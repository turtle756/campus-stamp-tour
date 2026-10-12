"""7주차 게임 엔진: 사건 하나를 무작위로 만들고, 답이 정말 하나뿐인지 직접 검사합니다.

Flask를 쓰지 않는 순수 Python이라 단독으로 실행·테스트할 수 있습니다.
게임 데이터(이름·장소·도구·문장 틀)는 case_data.py에 있습니다.

글 하나 = {author, time('HH:MM'), text, kind, facts}
facts는 판정용 구조 데이터입니다(문장은 화면용, facts는 검사용).
  ["at", 사람, 장소]      알리바이: 그 사람이 21시에 그 장소에 있었다
  ["seen", 사람, 장소]    목격: 그 사람을 21시쯤 그 장소(쪽)에서 봤다
  ["not_at", 사람, 장소]  그 사람은 21시에 그 장소에 없었다
  ["quiet", 장소]         그 장소는 21시에 별일 없었다
  ["noise", 장소]         그 장소에서 21시쯤 쿵 소리가 났다
  ["safe", 도구]          그 도구는 21시에 제자리에 있었다
  ["found", 도구, 장소]   그 도구가 22시에 그 장소 근처에서 발견됐다

참고(코드 복사 없이 아이디어만 가져와 직접 작성):
  Sleuth(1983)·Murdle — 범인의 알리바이만 다른 글과 모순되는 구조
  Cluedo — 용의자·장소·도구 세 가지 정답, 고발은 한 번
  Papers, Please — 두 문서의 불일치를 연결하는 조사
  Three Clue Rule(Justin Alexander) — 결론마다 단서 2~3개
  kpfaulkner/murdermystery(Apache-2.0) — 사실을 구조 데이터로 두고 문장으로 바꾸는 구조
  tuchandra/zebra(MIT) — 모든 가설을 대입해 해가 하나인지 세는 유일성 검사
"""

import random
from itertools import product

import case_data as D

PLACES = list(D.PLACES)    # 장소 짧은 이름 5개
WEAPONS = list(D.WEAPONS)  # 도구 5개
MIN_POSTS, MAX_POSTS = 35, 50
MAX_TRIES = 50


# ── 1. 사건 만들기 ───────────────────────────────────

def generate_case(seed):
    """seed가 같으면 같은 사건. 답이 하나뿐인 사건이 나올 때까지 최대 50번 다시 만듭니다."""
    rng = random.Random(seed)
    for _ in range(MAX_TRIES):
        case = build_case(rng)
        if is_fair(case):
            case["contradicts"] = find_contradicts(case["posts"])
            return case
    raise RuntimeError("답이 하나뿐인 사건을 50번 안에 만들지 못했습니다. case_data.py를 확인하세요.")


def build_case(rng):
    """정답을 뽑고, 21시 위치를 정하고, 종류별 글을 모아 시간순으로 정렬합니다."""
    culprit = rng.choice(D.SUSPECTS)
    place = rng.choice(PLACES)
    weapon = rng.choice(WEAPONS)
    lie = rng.choice([p for p in PLACES if p != place])  # 범인이 거짓으로 댈 장소
    where = place_people(rng, culprit, place)

    posts = [make_post(rng, D.VICTIM, "victim", [], D.VICTIM_LINES, "victim")]
    posts += alibi_posts(rng, culprit, lie, where)
    posts += corroborate_posts(rng, where)
    posts += contradict_posts(rng, culprit, place, lie, where)
    posts += quiet_posts(rng, place, where)
    posts += noise_posts(rng, place, where)
    posts += weapon_posts(rng, place, weapon)
    posts += spam_posts(rng)
    posts += chat_posts(rng, at_least=MIN_POSTS - len(posts))
    posts.sort(key=lambda post: post["time"])
    return {"solution": {"culprit": culprit, "place": place, "weapon": weapon}, "posts": posts}


def place_people(rng, culprit, place):
    """범인을 뺀 인물(목격자·무고 용의자)의 21시 위치. 사건 장소에는 아무도 두지 않습니다.

    규칙: 사건 장소가 아닌 네 곳에 모두 누군가 있다('별일 없었음'을 쓸 사람).
          무고 용의자는 혼자 있지 않다(그 사람을 '봤다'고 쓸 사람).
    """
    free = [p for p in PLACES if p != place]
    where = {}
    for name, home in D.WITNESSES.items():  # 목격자: 평소 장소, 안 되면 남은 빈 장소
        empty = [p for p in free if p not in where.values()]
        where[name] = home if home in empty else rng.choice(empty)
    innocents = [s for s in D.SUSPECTS if s != culprit]
    rng.shuffle(innocents)
    for spot in [p for p in free if p not in where.values()]:  # 아무도 없는 곳에는 두 명을 함께
        pair, innocents = innocents[:2], innocents[2:]
        for name in pair:
            where[name] = spot
    for name in innocents:  # 남은 무고 용의자는 사건 장소만 빼고 아무 곳
        where[name] = rng.choice(free)
    return where


def make_post(rng, author, kind, facts, lines, window, **slots):
    """문장 틀 하나를 골라 채우고, 시각 범위(window) 안에서 글 시각을 뽑습니다."""
    text = rng.choice(lines).format(**slots)
    return {"author": author, "time": random_time(rng, window), "text": text, "kind": kind, "facts": facts}


def random_time(rng, window):
    """POST_TIMES[window] = ("HH:MM", "HH:MM") 사이의 시각 하나."""
    start, end = (to_minutes(t) for t in D.POST_TIMES[window])
    minutes = rng.randint(start, end)
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def to_minutes(hhmm):
    hours, minutes = hhmm.split(":")
    return int(hours) * 60 + int(minutes)


def place_slots(name):
    """문장 틀에 넣을 장소 낱말들."""
    info = D.PLACES[name]
    return {"place": info["full"], "short": name, "spot": info["spot"], "doing": info["doing"]}


def people_at(where, spot):
    return [name for name, p in where.items() if p == spot]


# ── 2. 글 종류별 만들기 ──────────────────────────────

def alibi_posts(rng, culprit, lie, where):
    """용의자 5명의 알리바이. 무고하면 실제 위치, 범인은 거짓 장소(lie)."""
    posts = []
    for name in D.SUSPECTS:
        claimed = lie if name == culprit else where[name]
        posts.append(make_post(rng, name, "alibi", [["at", name, claimed]],
                               D.ALIBI_LINES, "alibi", **place_slots(claimed)))
    return posts


def corroborate_posts(rng, where):
    """무고 용의자마다 1~2개: 같은 장소에 있던 다른 사람이 '봤다'고 씁니다."""
    posts = []
    for name in [s for s in D.SUSPECTS if s in where]:
        spot = where[name]
        others = [o for o in people_at(where, spot) if o != name]
        for author in rng.sample(others, min(len(others), rng.randint(1, 2))):
            posts.append(make_post(rng, author, "corroborate", [["seen", name, spot]],
                                   D.SEEN_LINES, "corroborate", who=name,
                                   hhmm=random_time(rng, "seen_clock"), **place_slots(spot)))
    return posts


def contradict_posts(rng, culprit, place, lie, where):
    """범인 알리바이와 부딪히는 글 2~3개(작성자는 모두 다름).

    ① 범인이 댄 장소에 21시 내내 있던 사람(목격자 우선): 범인 못 봄
    ② 다른 사람: 범인이 사건 장소 쪽으로 가는 걸 봄
    ③ 절반 확률로, 범인이 댄 장소에 있던 또 다른 사람: 범인 못 봄
    """
    at_lie = people_at(where, lie)
    rng.shuffle(at_lie)
    at_lie.sort(key=lambda name: name not in D.WITNESSES)  # 목격자를 앞으로
    if not at_lie:
        return []
    first = at_lie[0]
    second = rng.choice([name for name in where if name != first])
    posts = [
        make_post(rng, first, "contradict", [["not_at", culprit, lie]],
                  D.NOT_AT_LINES, "not_at", who=culprit, **place_slots(lie)),
        make_post(rng, second, "contradict", [["seen", culprit, place]],
                  D.HEADING_LINES, "heading", who=culprit, **place_slots(place)),
    ]
    extra = [name for name in at_lie if name not in (first, second)]
    if extra and rng.random() < 0.5:
        posts.append(make_post(rng, extra[0], "contradict", [["not_at", culprit, lie]],
                               D.NOT_AT_LINES, "not_at", who=culprit, **place_slots(lie)))
    return posts


def quiet_posts(rng, place, where):
    """사건 장소가 아닌 곳마다 1개: 그곳에 있던 사람이 '별일 없었음'을 씁니다."""
    posts = []
    for spot in PLACES:
        people = people_at(where, spot)
        if spot != place and people:
            posts.append(make_post(rng, rng.choice(people), "place_quiet", [["quiet", spot]],
                                   D.QUIET_LINES, "place_quiet", **place_slots(spot)))
    return posts


def noise_posts(rng, place, where):
    """사건 장소 1~2개: 같은 건물에 있던 사람이 먼저, 없으면 아무나 '쿵 소리'를 씁니다."""
    building = D.PLACES[place]["building"]
    near = [n for n, p in where.items() if D.PLACES[p]["building"] == building]
    far = [n for n in where if n not in near]
    rng.shuffle(near)
    rng.shuffle(far)
    authors = (near + far)[:rng.randint(1, 2)]
    return [make_post(rng, author, "place_noise", [["noise", place]],
                      D.NOISE_LINES, "place_noise", **place_slots(place)) for author in authors]


def weapon_posts(rng, place, weapon):
    """도구 단서(작성자는 목격자): 쓰인 도구는 사건 장소 근처에서 발견 1개, 나머지 도구는 점검 기록 각 1개."""
    staff = list(D.WITNESSES)
    posts = [make_post(rng, rng.choice(staff), "weapon_found", [["found", weapon, place]],
                       D.FOUND_LINES, "weapon_found", tool=weapon, **place_slots(place))]
    for tool, info in D.WEAPONS.items():
        if tool != weapon:
            posts.append(make_post(rng, rng.choice(staff), "weapon_safe", [["safe", tool]],
                                   D.SAFE_LINES, "weapon_safe", tool=tool, home=info["home"]))
    return posts


def spam_posts(rng):
    """광고·도배 3~5개(사실 없음). 관리자가 지울 글."""
    picks = rng.sample(D.SPAM, rng.randint(3, 5))
    return [make_post(rng, author, "spam", [], [text], "spam") for author, text in picks]


def chat_posts(rng, at_least):
    """잡담 8~12개(사실 없음). 전체 글이 35개 이상이 되도록 at_least개보다 적게 만들지 않습니다."""
    pool = [(line, "chat_before") for line in D.CHAT_BEFORE] + [(line, "chat_after") for line in D.CHAT_AFTER]
    speakers = D.SUSPECTS + list(D.WITNESSES)
    count = max(rng.randint(8, 12), at_least)
    return [make_post(rng, rng.choice(speakers), "chat", [], [line], window)
            for line, window in rng.sample(pool, count)]


# ── 3. 유일성 검사(솔버) ─────────────────────────────

def is_fair(case):
    """공정한 사건인가: 답이 정확히 하나이고 그게 정답, 결론마다 단서 2개 이상, 글 수 35~50."""
    answer = (case["solution"]["culprit"], case["solution"]["place"], case["solution"]["weapon"])
    return (solve(case["posts"]) == [answer]
            and min(count_clues(case).values()) >= 2
            and MIN_POSTS <= len(case["posts"]) <= MAX_POSTS)


def solve(posts):
    """125개 가설(범인 5 × 장소 5 × 도구 5)을 모두 대입해 모든 글과 맞는 가설만 남깁니다."""
    return [(s, p, w) for s, p, w in product(D.SUSPECTS, PLACES, WEAPONS) if consistent(posts, s, p, w)]


def consistent(posts, culprit, place, weapon):
    """가설: culprit이 place에서 weapon으로. culprit이 쓴 글은 거짓, 나머지 글은 참으로 두고 모순이 없는지 봅니다."""
    where = {culprit: {place}}  # 사람 → 21시에 있을 수 있는 장소들(사람은 한 곳에만 있다)
    for post in posts:
        truth = post["author"] != culprit
        for fact in post["facts"]:
            if not fact_ok(fact, truth, where, place, weapon):
                return False
    return True


def fact_ok(fact, truth, where, place, weapon):
    """사실 하나가 truth(참/거짓)일 수 있는지. 사람 위치 사실은 where의 후보를 좁혀 기록합니다."""
    kind = fact[0]
    if kind in ("at", "seen", "not_at"):
        person, spot = fact[1], fact[2]
        says_there = kind != "not_at"               # at·seen은 '있었다', not_at은 '없었다'
        is_there = says_there if truth else not says_there
        allowed = {spot} if is_there else set(PLACES) - {spot}
        where[person] = where.get(person, set(PLACES)) & allowed
        return bool(where[person])                  # 후보가 0곳이면 모순
    if kind == "quiet":
        return (fact[1] != place) == truth
    if kind == "noise":
        return (fact[1] == place) == truth
    if kind == "safe":
        return (fact[1] != weapon) == truth
    if kind == "found":
        return (fact[1] == weapon and fact[2] == place) == truth
    raise ValueError(f"모르는 사실 종류: {kind}")


def count_clues(case):
    """결론마다 독립 단서 수.

    범인 = contradict 글을 쓴 서로 다른 사람 수
    장소 = noise 글 + found 글 (+ 나머지 네 곳이 모두 quiet면 1)
    도구 = found 글 (+ 나머지 네 도구가 모두 safe면 1)
    """
    solution = case["solution"]
    facts = [fact for post in case["posts"] for fact in post["facts"]]
    culprit = len({post["author"] for post in case["posts"] if post["kind"] == "contradict"})
    noise = [f for f in facts if f[0] == "noise" and f[1] == solution["place"]]
    found = [f for f in facts if f[0] == "found" and f[1:] == [solution["weapon"], solution["place"]]]
    quiet_all = {f[1] for f in facts if f[0] == "quiet"} >= set(PLACES) - {solution["place"]}
    safe_all = {f[1] for f in facts if f[0] == "safe"} >= set(WEAPONS) - {solution["weapon"]}
    return {
        "culprit": culprit,
        "place": len(noise) + len(found) + int(quiet_all),
        "weapon": len(found) + int(safe_all),
    }


def find_contradicts(posts):
    """알리바이 글마다 '그 글과 함께 참일 수 없는 글'의 index 목록. 무고한 알리바이는 빈 목록입니다."""
    result = {}
    for i, alibi in enumerate(posts):
        if alibi["kind"] == "alibi":
            result[i] = [j for j, other in enumerate(posts)
                         if j != i and other["facts"] and not can_both_be_true(alibi, other)]
    return result


def can_both_be_true(a, b):
    """두 글이 동시에 참인 가설이 125개 중 하나라도 있는가(작성자는 따지지 않음)."""
    for s, p, w in product(D.SUSPECTS, PLACES, WEAPONS):
        where = {s: {p}}
        if all(fact_ok(fact, True, where, p, w) for fact in a["facts"] + b["facts"]):
            return True
    return False


if __name__ == "__main__":
    # 터미널에서 python case_engine.py 로 사건 하나를 미리 볼 수 있습니다.
    sample = generate_case(7)
    print("정답:", sample["solution"])
    for index, post in enumerate(sample["posts"]):
        print(f"{index:2d} {post['time']} [{post['kind']}] {post['author']}: {post['text']}")
    print("모순:", sample["contradicts"])
