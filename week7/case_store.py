"""7주차 게임 저장·판정: 사건을 DB(인물 계정·글)와 case.json(정답·번호표)에 넣고, 신고 배지와 체포 판결을 계산합니다.

DB 표·열은 새로 만들지 않습니다. 인물 계정은 교수 예제의 연습 계정과 같은 is_test=1이라
'연습 데이터 모두 삭제'로 함께 지워집니다. 게임 상태는 case.json 한 파일입니다(instance/ 폴더라 Git 제외).

참고(코드 복사 없이 아이디어만):
  Hypnospace Outlaw — 게시판 신고·정지 기능이 곧 수사 도구
  Orwell — 증거를 모으는 조사관(플레이어)과 결정하는 사람(수사반장=관리자)의 분업
  Cluedo — 고발(체포)은 사건당 한 번
"""

import json
import re
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

from werkzeug.security import generate_password_hash

import case_data as D
import case_engine

# 관리 화면 신고 배지: 문구 → CSS 색 이름
BADGE_TONES = {"모순 확인": "hit", "근거 번호 필요": "warn", "광고·도배": "spam", "모순 없음": "none"}


# ── case.json 읽기·쓰기 ──────────────────────────────

def load_case(path):
    """case.json을 읽습니다. 없으면 None(진행 중인 사건 없음)."""
    path = Path(path)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def save_case(path, case):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(case, ensure_ascii=False, indent=2), encoding="utf-8")


def delete_case(path):
    """case.json을 지웁니다. 있었으면 True."""
    path = Path(path)
    if not path.exists():
        return False
    path.unlink()
    return True


def now_text():
    """DB의 CURRENT_TIMESTAMP와 같은 UTC 'YYYY-MM-DD HH:MM:SS' 형식."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


# ── 새 사건 만들기 ───────────────────────────────────

def npc_names():
    """인물 계정 9개의 아이디(= 화면에 보이는 닉네임)."""
    return [D.VICTIM, *D.SUSPECTS, *D.WITNESSES]


def npcs_exist(db):
    """이전 사건의 인물 계정이 남아 있는가. 아이디가 겹치면 새로 만들 수 없습니다."""
    return any(db.execute("SELECT 1 FROM users WHERE username = ?", (name,)).fetchone()
               for name in npc_names())


def create_case(db, path):
    """새 사건: 생성기 → 인물 계정 9개 → 글 → case.json. (아이디 목록, 공통 비밀번호)를 돌려줍니다."""
    seed = secrets.randbelow(10**9)
    case = case_engine.generate_case(seed)
    password = secrets.token_urlsafe(12)
    npc_ids = insert_npcs(db, generate_password_hash(password))
    post_ids = insert_posts(db, case["posts"], npc_ids)
    db.commit()
    save_case(path, make_record(seed, case, npc_ids, post_ids))
    return list(npc_ids), password


def insert_npcs(db, password_hash):
    """인물 계정을 연습 계정(is_test=1)으로 만듭니다. 교수 create_test_data()와 같은 방식. {이름: id}"""
    ids = {}
    for name in npc_names():
        cursor = db.execute(
            "INSERT INTO users (username, password_hash, is_test) VALUES (?, ?, 1)",
            (name, password_hash),
        )
        ids[name] = cursor.lastrowid
    return ids


def insert_posts(db, posts, npc_ids):
    """글을 시간순으로 넣습니다. created_at = 어제(UTC) 날짜 + 글 시각. {생성기 index: 글 id}"""
    day = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    ids = {}
    for index, post in enumerate(posts):
        cursor = db.execute(
            "INSERT INTO comments (user_id, content, created_at) VALUES (?, ?, ?)",
            (npc_ids[post["author"]], post["text"], f"{day} {post['time']}:00"),
        )
        ids[index] = cursor.lastrowid
    return ids


def make_record(seed, case, npc_ids, post_ids):
    """case.json에 저장할 내용. 생성기 index를 실제 글 id로 바꿉니다(JSON 키는 문자열)."""
    posts = case["posts"]
    return {
        "seed": seed,
        "created_at": now_text(),
        "solution": case["solution"],
        "npc_user_ids": npc_ids,
        "post_ids": {str(i): post_ids[i] for i in post_ids},
        "kinds": {str(post_ids[i]): post["kind"] for i, post in enumerate(posts)},
        "contradicts": {str(post_ids[i]): [post_ids[j] for j in found]
                        for i, found in case["contradicts"].items()},
        "alibi_ids": {post["author"]: post_ids[i] for i, post in enumerate(posts) if post["kind"] == "alibi"},
        "verdict": None,
    }


# ── 화면에 넘길 정보 ─────────────────────────────────

def view(case):
    """템플릿용 사건 정보. 판결 전에는 정답을 넣지 않습니다."""
    if case is None:
        return {"status": "none", "post_ids": set(), "roles": {}}
    info = {
        "status": "open" if case["verdict"] is None else "closed",
        "post_ids": set(case["post_ids"].values()),
        "roles": npc_roles(case),
        "opening": D.OPENING,
        "how_to": D.HOW_TO,
        "suspects": D.SUSPECTS,
    }
    if info["status"] == "closed":
        info["headline"], info["evidence"] = verdict_lines(case)
    return info


def npc_roles(case):
    """{인물 계정 id: '용의자'·'목격자'·'피해자'} — 관리 화면 사용자 목록 표시용."""
    roles = {}
    for name, user_id in case["npc_user_ids"].items():
        roles[user_id] = "용의자" if name in D.SUSPECTS else "목격자" if name in D.WITNESSES else "피해자"
    return roles


def verdict_lines(case):
    """판결 문장 두 줄: (결과, 공개 증거 번호)."""
    verdict, solution = case["verdict"], case["solution"]
    answer = f"{solution['culprit']} · {solution['place']} · {solution['weapon']}"
    marks = f"결론 글 장소 {mark(verdict['place_ok'])} 도구 {mark(verdict['weapon_ok'])}"
    if verdict["correct"]:
        headline = f"체포 성공: 범인 {answer} ({marks})"
    else:
        headline = f"오인 체포({verdict['blocked']}): 진범은 {answer} ({marks})"
    alibi_id = case["alibi_ids"][solution["culprit"]]
    evidence = " ".join(f"#{i}" for i in case["contradicts"][str(alibi_id)])
    return headline, f"범인 알리바이 #{alibi_id} · 모순 글 {evidence}"


def mark(ok):
    return "미기재" if ok is None else "✓" if ok else "✗"


# ── 신고 배지 ────────────────────────────────────────

def report_badges(case, rows):
    """관리 화면의 신고된 사건 글마다 {글 id: (배지 문구, 색 이름)}."""
    badges = {}
    if case is None:
        return badges
    for row in rows:
        if row["report_count"]:
            label = report_badge(case, row["id"], row["report_reasons"])
            if label:
                badges[row["id"]] = (label, BADGE_TONES[label])
    return badges


def report_badge(case, comment_id, reasons):
    """신고 사유 속 #번호로 판정합니다. 사건 밖 글이면 None."""
    kind = case["kinds"].get(str(comment_id))
    if kind is None:
        return None
    if kind == "spam":
        return "광고·도배"
    culprit_alibi = case["alibi_ids"][case["solution"]["culprit"]]
    if comment_id != culprit_alibi:
        return "모순 없음"
    evidence = set(case["contradicts"][str(comment_id)])
    return "모순 확인" if cited_numbers(reasons) & evidence else "근거 번호 필요"


def cited_numbers(text):
    """'#17 ... #22' 에서 {17, 22}."""
    return {int(number) for number in re.findall(r"#(\d+)", text or "")}


# ── 체포 판결 ────────────────────────────────────────

def arrest(db, path, user_id):
    """관리자가 계정을 '차단'한 직후 호출합니다. 용의자면 한 번만 판결합니다. 관리 화면 안내 문장을 돌려줍니다."""
    case = load_case(path)
    if case is None:
        return None
    name = npc_name(case, user_id)
    if name is None:
        return None  # 사건과 상관없는 계정
    if name not in D.SUSPECTS:
        return f"용의자가 아님: {name} · 판결하지 않았습니다."
    if case["verdict"] is not None:
        return "이미 판결한 사건입니다. 판결은 바뀌지 않습니다."
    place_ok, weapon_ok = conclusion_marks(db, case)
    case["verdict"] = {
        "blocked": name,
        "correct": name == case["solution"]["culprit"],
        "place_ok": place_ok,
        "weapon_ok": weapon_ok,
        "at": now_text(),
    }
    save_case(path, case)
    return "판결했습니다. 게시판과 이 화면 위쪽에 공개됩니다."


def npc_name(case, user_id):
    for name, npc_id in case["npc_user_ids"].items():
        if npc_id == user_id:
            return name
    return None


def conclusion_marks(db, case):
    """플레이어(인물 계정이 아닌 계정)가 사건 뒤에 쓴 가장 최근 '결론:' 글로 (장소 맞음?, 도구 맞음?). 글이 없으면 (None, None)."""
    npc_ids = set(case["npc_user_ids"].values())
    last_case_post = max(case["post_ids"].values())
    rows = db.execute(
        "SELECT user_id, content FROM comments WHERE content LIKE '결론:%' AND id > ? ORDER BY id DESC",
        (last_case_post,),
    ).fetchall()
    for row in rows:
        if row["user_id"] not in npc_ids:
            text = without_npc_names(row["content"])
            solution = case["solution"]
            return (judge_named(text, D.PLACES, solution["place"]),
                    judge_named(text, D.WEAPONS, solution["weapon"]))
    return None, None


def without_npc_names(text):
    """'노란우산'의 '우산', '헬스장매니저'의 '헬스장'처럼 이름 속 낱말이 장소·도구로 읽히지 않게 이름을 지웁니다."""
    for name in npc_names():
        text = text.replace(name, " ")
    return text


def judge_named(text, table, answer):
    """글에 나온 이름 중 정답 하나만 있으면 True, 다른 이름이 섞이면 False, 하나도 없으면 None(미기재)."""
    lowered = text.lower()
    named = {key for key, info in table.items()
             if any(word.lower() in lowered for word in info["aliases"])}
    if not named:
        return None
    return named == {answer}
