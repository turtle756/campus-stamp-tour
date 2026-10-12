"""점자 읽기 모드 「손끝 한 줄」의 문장(레벨) 데이터.

기획자가 바꾸는 곳은 맨 위 LEVELS와 CARD_SHOWS_ALL_CHOICES뿐입니다.
- text: 손끝으로 읽을 정답 문장. 한글·숫자·띄어쓰기만 됩니다(braille.py 지원 범위).
- choices: 보기 3개. 정답을 꼭 넣고, 오답은 정답과 단어 수·글자 수를 맞춥니다. 화면에서는 순서를 섞습니다.
- rule(넣지 않아도 됨): 레벨 끝에 보여 줄 규칙 한 줄. 없으면 문장에 나온 규칙에서 자동으로 고릅니다.
서버를 켤 때 전부 점자로 바꿔 보고, 문제가 있으면 서버 터미널(과 오류는 화면)에 알립니다.
"""
from braille import is_hangul, split_syllable, to_cells, to_unicode

LEVELS = [
    {"text": "점자", "choices": ["점자", "정자", "잠자"]},
    {"text": "학관", "choices": ["학관", "학교", "한관"]},
    {"text": "손끝으로 읽는 글자", "choices": ["손끝으로 읽는 글자", "손끝으로 잇는 글자", "발끝으로 읽는 글자"]},
]

# 점자 카드에 정답 문장의 글자만 보여 줄지(False), 보기 3개에 나오는 글자를 모두 보여 줄지(True).
# False면 카드의 글자 목록만 보고도 보기를 좁힐 수 있습니다.
CARD_SHOWS_ALL_CHOICES = True   # 정답 글자만 보이면 점을 안 만지고도 고를 수 있어서 보기 글자를 모두 보여 줌


# ── 여기부터는 코드: LEVELS를 화면용 데이터로 바꾸고 검사합니다 ──────────────

# 레벨 끝 규칙 한 줄을 고를 때의 우선순위(앞 레벨에서 이미 보여 준 종류는 건너뜀).
RULE_PRIORITY = ["된소리표", "모음+받침 약자", "첫소리와 받침", "글자 약자", "성·정", "붙임표", "수표", "첫소리 ㅇ"]
DEFAULT_RULE = "한글 점자는 첫소리·모음·받침을 풀어서 한 칸씩 적습니다(제5항)."
# 점자 카드에서 보여 줄 순서(문장 속 순서가 드러나지 않게 역할별·가나다순으로 정리).
CARD_ROLE_ORDER = ["초성", "모음", "받침", "약자", "된소리표", "붙임표", "수표", "숫자"]


def topic(word):
    """'끝' → '은', '자' → '는'. 마지막 글자에 받침이 있으면 '은'."""
    last = word[-1]
    return "은" if is_hangul(last) and split_syllable(last)[2] else "는"


def dots_label(dots):
    """'245' → '2·4·5점'"""
    return "·".join(dots) + "점"


def count_letters(text):
    """띄어쓰기를 뺀 글자 수."""
    return len(text.replace(" ", ""))


def describe_rule(cell, syllable, initial_dots):
    """칸 하나가 보여 주는 규칙을 (종류, 설명 한 줄)로 돌려줍니다. 설명할 것이 없으면 (None, None)."""
    letter, role, rule = cell["letter"], cell["role"], cell["rule"]
    if role == "된소리표":
        return "된소리표", f"'{syllable}'의 된소리는 앞에 된소리표(6점)를 한 칸 더 붙여 씁니다."
    if rule == "제15항":
        return "모음+받침 약자", f"'{syllable}' 속 '{letter}'{topic(letter)} 모음과 받침을 합친 약자 한 칸입니다."
    if role == "받침" and letter in initial_dots and initial_dots[letter] != cell["dots"]:
        return ("첫소리와 받침", f"같은 '{letter}'도 첫소리({dots_label(initial_dots[letter])})와 "
                f"받침({dots_label(cell['dots'])})의 점 모양이 다릅니다.")
    if rule == "제12항" and letter == "것":
        return "글자 약자", "'것'은 두 칸짜리 약자로 씁니다."
    if rule == "제12항":
        return "글자 약자", f"'{letter}'{topic(letter)} '{split_syllable(letter)[0]}+ㅏ' 두 칸이 아니라 약자 한 칸입니다."
    if rule == "제16항":
        return "성·정", f"'{syllable}'{topic(syllable)} 'ㅓ+ㅇ' 대신 '영' 약자를 씁니다."
    if role == "붙임표":
        return "붙임표", "모음 뒤 '예'·'애' 앞에는 붙임표(3·6점)를 넣어 앞 글자와 헷갈리지 않게 합니다."
    if role == "수표":
        return "수표", "숫자 앞에는 수표(3·4·5·6점)를 붙여 글자와 구별합니다."
    if is_hangul(syllable) and split_syllable(syllable)[0] == "ㅇ":
        return "첫소리 ㅇ", f"'{syllable}'처럼 첫소리 'ㅇ'은 점자로 적지 않습니다."
    return None, None


def rule_examples(text, cells):
    """규칙 종류마다 이 문장에서 처음 나온 예로 설명 한 줄을 만듭니다. {종류: 설명}"""
    initial_dots = {cell["letter"]: cell["dots"] for cell in cells if cell["role"] == "초성"}
    examples = {}
    for cell in cells:
        kind, line = describe_rule(cell, text[cell["pos"]], initial_dots)
        if kind and kind not in examples:
            examples[kind] = line
    return examples


def pick_rule(examples, used_kinds):
    """우선순위대로, 앞 레벨에서 아직 안 보여 준 종류를 하나 고릅니다."""
    for kind in RULE_PRIORITY:
        if kind in examples and kind not in used_kinds:
            used_kinds.add(kind)
            return examples[kind]
    for kind in RULE_PRIORITY:
        if kind in examples:
            return examples[kind]
    return DEFAULT_RULE


def make_card(texts):
    """점자 카드: 문장에 쓰인 칸 모양을 (글자, 역할)마다 한 번씩 모읍니다. '것'처럼 두 칸인 글자는 칸 두 개."""
    entries = {}
    for text in texts:
        for cell in to_cells(text):
            if cell["role"] == "띄어쓰기":
                continue
            entry = entries.setdefault((cell["letter"], cell["role"]),
                                       {"letter": cell["letter"], "role": cell["role"], "cells": []})
            if cell["dots"] not in [item["dots"] for item in entry["cells"]]:
                entry["cells"].append({"dots": cell["dots"], "unicode": cell["unicode"]})
    return sorted(entries.values(), key=lambda item: (CARD_ROLE_ORDER.index(item["role"]), item["letter"]))


def check_choices(text, choices):
    """보기 검사. 정답 포함·서로 다른 3개·점자 모양이 정답과 다름은 꼭 지켜야 하고(어기면 ValueError),
    단어 수·글자 수가 정답과 다르면 경고 문장 목록으로 돌려줍니다."""
    if not isinstance(choices, list) or len(choices) != 3 or len(set(choices)) != 3 or text not in choices:
        raise ValueError("보기는 정답을 포함해 서로 다른 3개여야 합니다.")
    answer = to_unicode(text)
    warnings = []
    for choice in choices:
        if choice == text:
            continue
        if to_unicode(choice) == answer:          # 지원 범위 밖이면 여기서 UnsupportedText
            raise ValueError(f"오답 '{choice}'의 점자 모양이 정답과 같습니다.")
        if len(choice.split()) != len(text.split()) or count_letters(choice) != count_letters(text):
            warnings.append(f"오답 '{choice}'은(는) 정답과 단어 수·글자 수가 다릅니다 "
                            f"(정답 {len(text.split())}단어 {count_letters(text)}글자, "
                            f"오답 {len(choice.split())}단어 {count_letters(choice)}글자).")
    return warnings


def prepare_level(level, used_kinds):
    """레벨 하나를 화면용 데이터로 바꿉니다. (데이터, 경고 목록)을 돌려줍니다."""
    text = level["text"]
    cells = to_cells(text)                         # 지원 범위 밖이면 UnsupportedText(ValueError)
    warnings = check_choices(text, level["choices"])
    rule = level.get("rule") or pick_rule(rule_examples(text, cells), used_kinds)
    card_texts = level["choices"] if CARD_SHOWS_ALL_CHOICES else [text]
    data = {"text": text, "choices": level["choices"], "cells": cells,
            "unicode": to_unicode(text), "rule": rule, "card": make_card(card_texts)}
    return data, warnings


def prepare_levels():
    """서버 시작 때 LEVELS 전부를 점자로 바꿔 봅니다. (화면용 레벨 목록, 오류 목록, 경고 목록)을 돌려줍니다.
    오류가 난 레벨은 빼고 진행합니다."""
    ready, errors, warnings, used_kinds = [], [], [], set()
    for number, level in enumerate(LEVELS, start=1):
        try:
            data, level_warnings = prepare_level(level, used_kinds)
        except (ValueError, KeyError, TypeError, AttributeError) as error:
            text = level.get("text", "") if isinstance(level, dict) else ""
            errors.append(f"문장 {number} '{text}': {error}")
            continue
        ready.append(data)
        warnings += [f"문장 {number}: {message}" for message in level_warnings]
    return ready, errors, warnings
