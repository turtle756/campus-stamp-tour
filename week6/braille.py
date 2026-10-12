"""한글 점자 변환기 · 2020 한국 점자 규정(문화체육관광부고시 제2020-38호) 일부.

지원: 제1~17항(자모·약자), 제37~38항(숫자). 한글 음절·숫자(0~9)·띄어쓰기만 바꿉니다.
지원하지 않음: 문장부호, 로마자, 단독 자모(제9항), 약어(제18항: 그래서·그러나…), 옛 글자
→ UnsupportedText 예외를 냅니다(메시지는 화면에 그대로 보여 줄 수 있는 한국어).

점 번호는 문자열로 적습니다. "146"은 1·4·6점이 볼록하다는 뜻입니다(제2항).
    1 ● ● 4
    2 ● ● 5
    3 ● ● 6
두 칸이 필요한 글자는 튜플로 적습니다. 예: ㅒ = ("345", "1235")
"""


class UnsupportedText(ValueError):
    """지원 범위 밖의 글자가 들어 있을 때 냅니다."""


# ── 규정 표 ────────────────────────────────────────────────

# 제1항: 첫소리 자음 14개. ('ㅇ'은 첫소리에서 적지 않습니다 — 제2항)
CHOSEONG = {"ㄱ": "4", "ㄴ": "14", "ㄷ": "24", "ㄹ": "5", "ㅁ": "15", "ㅂ": "45", "ㅅ": "6",
            "ㅈ": "46", "ㅊ": "56", "ㅋ": "124", "ㅌ": "125", "ㅍ": "145", "ㅎ": "245"}

# 제3항: 된소리 첫소리는 된소리표(6점) + 예사소리로 적습니다. (ㄲ = 6점 + ㄱ)
TENSE_MARK = "6"
TENSE_TO_PLAIN = {"ㄲ": "ㄱ", "ㄸ": "ㄷ", "ㅃ": "ㅂ", "ㅆ": "ㅅ", "ㅉ": "ㅈ"}

# 제4항: 받침 자음 14개. 같은 자음도 첫소리와 받침의 점 모양이 다릅니다(ㄱ: 첫소리 4점, 받침 1점).
JONGSEONG = {"ㄱ": "1", "ㄴ": "25", "ㄷ": "35", "ㄹ": "2", "ㅁ": "26", "ㅂ": "12", "ㅅ": "3",
             "ㅇ": "2356", "ㅈ": "13", "ㅊ": "23", "ㅋ": "235", "ㅌ": "236", "ㅍ": "256", "ㅎ": "356"}

# 제5항: 쌍받침 'ㅆ'은 약자 한 칸(34점)으로 적습니다.
SS_FINAL = "34"

# 제5·6항: 쌍받침 'ㄲ'과 겹받침은 두 자음의 받침 점을 이어 적습니다. (읽 = ㅣ + ㄹ받침 + ㄱ받침)
SPLIT_FINALS = {"ㄲ": "ㄱㄱ", "ㄳ": "ㄱㅅ", "ㄵ": "ㄴㅈ", "ㄶ": "ㄴㅎ", "ㄺ": "ㄹㄱ", "ㄻ": "ㄹㅁ",
                "ㄼ": "ㄹㅂ", "ㄽ": "ㄹㅅ", "ㄾ": "ㄹㅌ", "ㄿ": "ㄹㅍ", "ㅀ": "ㄹㅎ", "ㅄ": "ㅂㅅ"}

# 제7항: 기본 모음 10개. 제8항: 그 밖의 모음 11개(ㅒ·ㅙ·ㅞ·ㅟ는 두 칸).
VOWELS = {"ㅏ": "126", "ㅑ": "345", "ㅓ": "234", "ㅕ": "156", "ㅗ": "136",
          "ㅛ": "346", "ㅜ": "134", "ㅠ": "146", "ㅡ": "246", "ㅣ": "135",
          "ㅐ": "1235", "ㅒ": ("345", "1235"), "ㅔ": "1345", "ㅖ": "34", "ㅘ": "1236",
          "ㅙ": ("1236", "1235"), "ㅚ": "13456", "ㅝ": "1234", "ㅞ": ("1234", "1235"),
          "ㅟ": ("134", "1235"), "ㅢ": "2456"}
BASIC_VOWELS = "ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ"

# 제10·11항: 모음 다음에 '예', 또는 ㅑ·ㅘ·ㅜ·ㅝ 다음에 '애'가 오면 사이에 붙임표(36점)를 넣습니다.
HYPHEN = "36"
VOWELS_BEFORE_AE = ("ㅑ", "ㅘ", "ㅜ", "ㅝ")

# 제12항: 'ㅏ'가 들어간 글자의 약자. 라·아·차는 약자가 없습니다.
ABBREV_SYLLABLE = {"가": "1246", "나": "14", "다": "24", "마": "15", "바": "45", "사": "123",
                   "자": "46", "카": "124", "타": "125", "파": "145", "하": "245"}

# 제12항: '것'은 두 칸짜리 약자입니다.
GEOT = ("456", "234")

# 제14항: 된소리표를 붙여 약자를 쓰는 것은 '까·싸·껏'뿐입니다. (따·빠·짜는 풀어 씀)
TENSE_ABBREV_OK = ("ㄲ", "ㅆ")

# 제17항: 이 글자 뒤에 모음으로 시작하는 글자가 이어지면 약자 대신 'ㅏ'를 적습니다. (나이, 자아)
KEEP_A_BEFORE_VOWEL = ("나", "다", "마", "바", "자", "카", "타", "파", "하")

# 제15항: 모음+받침 약자 14개. 'ㅇ'을 붙여 읽은 이름(억·언…)으로 찾습니다.
ABBREV_VOWEL_FINAL = {"억": "1456", "언": "23456", "얼": "2345", "연": "16", "열": "1256",
                      "영": "12456", "옥": "1346", "온": "12356", "옹": "123456", "운": "1245",
                      "울": "12346", "은": "1356", "을": "2346", "인": "12345"}

# 제16항: '성·썽·정·쩡·청'은 첫소리 다음에 'ㅓ+ㅇ' 대신 '영' 약자를 씁니다.
SEONG_INITIALS = ("ㅅ", "ㅆ", "ㅈ", "ㅉ", "ㅊ")

# 제37항: 숫자는 수표(3456점)를 앞세워 적습니다. 숫자가 이어지면 수표는 처음 한 번만.
NUMBER_SIGN = "3456"
DIGITS = {"1": "1", "2": "12", "3": "14", "4": "145", "5": "15",
          "6": "124", "7": "1245", "8": "125", "9": "24", "0": "245"}

# 제38항 [다만]: 숫자 뒤에 이 첫소리나 '운' 약자가 오면 숫자로 오해하지 않게 한 칸 띄웁니다.
SPACE_AFTER_NUMBER = ("ㄴ", "ㄷ", "ㅁ", "ㅋ", "ㅌ", "ㅍ", "ㅎ")

# 제18항: 약어. 이 변환기는 지원하지 않으므로 이 말로 시작하는 단어는 예외로 알립니다.
ABBREVIATED_WORDS = ("그래서", "그러나", "그러면", "그러므로", "그런데", "그리고", "그리하여")


# ── 한글 음절 나누기 ────────────────────────────────────────

INITIAL_ORDER = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"
VOWEL_ORDER = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"
FINAL_ORDER = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ",
               "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"]


def is_hangul(char):
    """완성형 한글 음절(가~힣)인지 확인합니다."""
    return char is not None and "가" <= char <= "힣"


def split_syllable(char):
    """'관' → ('ㄱ', 'ㅘ', 'ㄴ'). 유니코드 한글은 (첫소리×21 + 모음)×28 + 받침 순서로 놓여 있습니다."""
    index = ord(char) - 0xAC00
    return INITIAL_ORDER[index // 588], VOWEL_ORDER[index // 28 % 21], FINAL_ORDER[index % 28]


def join_syllable(initial, vowel, final=""):
    """('ㅇ', 'ㅓ', 'ㄱ') → '억'. 약자 표를 글자 이름으로 찾을 때 씁니다."""
    index = (INITIAL_ORDER.index(initial) * 21 + VOWEL_ORDER.index(vowel)) * 28 + FINAL_ORDER.index(final)
    return chr(0xAC00 + index)


# ── 칸 만들기 ──────────────────────────────────────────────

def dots_to_unicode(dots):
    """'146' → '⠩'. 유니코드 점자는 U+2800에 n번 점마다 2의 (n-1)제곱을 더한 글자입니다."""
    return chr(0x2800 + sum(1 << (int(dot) - 1) for dot in dots))


def make_cell(dots, letter, role, rule):
    """점자 한 칸. letter는 원래 글자나 자모, role은 칸의 역할, rule은 근거 조항입니다."""
    return {"dots": dots, "unicode": dots_to_unicode(dots), "letter": letter, "role": role, "rule": rule}


def as_tuple(value):
    """한 칸("126")과 두 칸(("345", "1235"))을 똑같이 반복할 수 있게 튜플로 맞춥니다."""
    return (value,) if isinstance(value, str) else value


def tense_mark_cell(rule):
    return make_cell(TENSE_MARK, "된소리표", "된소리표", rule)


def initial_cells(initial):
    """첫소리 칸. ㅇ은 적지 않고(제2항), 된소리는 된소리표를 앞에 붙입니다(제3항)."""
    if initial == "ㅇ":
        return []
    if initial in TENSE_TO_PLAIN:
        plain = TENSE_TO_PLAIN[initial]
        return [tense_mark_cell("제3항"), make_cell(CHOSEONG[plain], plain, "초성", "제3항")]
    return [make_cell(CHOSEONG[initial], initial, "초성", "제1항")]


def vowel_cells(vowel):
    """모음 칸(제7·8항). ㅒ·ㅙ·ㅞ·ㅟ는 두 칸이 나옵니다."""
    rule = "제7항" if vowel in BASIC_VOWELS else "제8항"
    return [make_cell(dots, vowel, "모음", rule) for dots in as_tuple(VOWELS[vowel])]


def final_part_cells(parts, rule):
    """받침 자음들을 차례로 받침 칸으로 바꿉니다. 예: 'ㄹㄱ' → ㄹ받침, ㄱ받침."""
    return [make_cell(JONGSEONG[part], part, "받침", rule) for part in parts]


def final_cells(final):
    """받침 칸. ㅆ은 한 칸 약자(제5항), ㄲ과 겹받침은 두 자음을 이어 적습니다(제5·6항)."""
    if final == "":
        return []
    if final == "ㅆ":
        return [make_cell(SS_FINAL, "ㅆ", "받침", "제5항")]
    if final in SPLIT_FINALS:
        return final_part_cells(SPLIT_FINALS[final], "제5항" if final == "ㄲ" else "제6항")
    return final_part_cells(final, "제4항")


# ── 약자 판단 ──────────────────────────────────────────────

def starts_with_vowel(char):
    """다음 글자가 첫소리 ㅇ(소리 없음), 즉 모음으로 시작하는 한글인지 봅니다."""
    return is_hangul(char) and split_syllable(char)[0] == "ㅇ"


def keeps_a_before_vowel(initial, vowel, final, next_char):
    """제17항: '나·다·마…하' 뒤에 모음으로 시작하는 글자가 오면 'ㅏ'를 생략하지 않습니다(나이 ≠ 니)."""
    if vowel != "ㅏ" or final != "" or initial not in CHOSEONG:
        return False
    return join_syllable(initial, "ㅏ") in KEEP_A_BEFORE_VOWEL and starts_with_vowel(next_char)


def a_syllable_abbrev(initial, vowel, final, next_char):
    """제12·13·14항: 'ㅏ'가 들어간 글자를 약자로 쓸 수 있으면 약자 이름('가'~'하')을, 아니면 None을 돌려줍니다."""
    if vowel != "ㅏ":
        return None
    if initial in TENSE_TO_PLAIN and initial not in TENSE_ABBREV_OK:   # 따·빠·짜는 약자 없음
        return None
    if initial == "ㅍ" and final == "ㅆ":                               # 제17항 [붙임] '팠'은 ㅏ를 적음
        return None
    if keeps_a_before_vowel(initial, vowel, final, next_char):          # 제17항
        return None
    name = join_syllable(TENSE_TO_PLAIN.get(initial, initial), "ㅏ")
    return name if name in ABBREV_SYLLABLE else None


def vowel_final_abbrev(vowel, final):
    """제15항: 모음+받침 약자를 쓸 수 있으면 (약자 이름, 남은 받침 자음)을, 아니면 None을 돌려줍니다.
    겹받침은 앞 자음으로 약자를 만들고 뒤 자음을 받침으로 덧붙입니다(얹 = 언 + ㅈ받침)."""
    parts = SPLIT_FINALS.get(final, final)       # 'ㄵ' → 'ㄴㅈ', 'ㄴ' → 'ㄴ', '' → ''
    if parts == "":
        return None
    name = join_syllable("ㅇ", vowel, parts[0])
    if name not in ABBREV_VOWEL_FINAL:
        return None
    return name, parts[1:]


# ── 글자 하나 → 칸 목록 ─────────────────────────────────────

def syllable_cells(char, next_char):
    """한글 음절 하나를 칸 목록으로 바꿉니다. 약자 규칙을 먼저 보고, 없으면 풀어 씁니다(제5항)."""
    initial, vowel, final = split_syllable(char)

    # 제12항 '것', 제14항 '껏'(된소리표 + 것)
    if vowel == "ㅓ" and final == "ㅅ" and initial in ("ㄱ", "ㄲ"):
        marks = [tense_mark_cell("제14항")] if initial == "ㄲ" else []
        return marks + [make_cell(dots, "것", "약자", "제12항") for dots in GEOT]

    # 제16항 성·썽·정·쩡·청: 첫소리 + '영' 약자
    if initial in SEONG_INITIALS and vowel == "ㅓ" and final == "ㅇ":
        return initial_cells(initial) + [make_cell(ABBREV_VOWEL_FINAL["영"], "영", "약자", "제16항")]

    # 제12·13·14항 가·나·다…하 약자 (받침은 그 뒤에 그대로 붙임: 강 = 가 + ㅇ받침)
    name = a_syllable_abbrev(initial, vowel, final, next_char)
    if name:
        marks = [tense_mark_cell("제14항")] if initial in TENSE_TO_PLAIN else []
        return marks + [make_cell(ABBREV_SYLLABLE[name], name, "약자", "제12항")] + final_cells(final)

    # 제15항 억·언·…·인 약자 (손 = ㅅ + 온)
    found = vowel_final_abbrev(vowel, final)
    if found:
        name, rest = found
        return (initial_cells(initial) + [make_cell(ABBREV_VOWEL_FINAL[name], name, "약자", "제15항")]
                + final_part_cells(rest, "제6항"))

    # 약자가 없으면 첫소리 + 모음 + 받침을 풀어 씁니다.
    return initial_cells(initial) + vowel_cells(vowel) + final_cells(final)


def number_cells(digit, after_digit):
    """제37항: 숫자 앞에 수표를 붙이고, 숫자가 이어지면 수표 없이 숫자 점만 적습니다."""
    sign = [] if after_digit else [make_cell(NUMBER_SIGN, "수표", "수표", "제37항")]
    return sign + [make_cell(DIGITS[digit], digit, "숫자", "제37항")]


def space_cell(rule=""):
    """빈칸(점 없음). 단어가 끝났다는 표시입니다."""
    return make_cell("", " ", "띄어쓰기", rule)


def needs_space_after_number(char, first_cell):
    """제38항 [다만]: 숫자 뒤에 ㄴ·ㄷ·ㅁ·ㅋ·ㅌ·ㅍ·ㅎ 첫소리나 '운' 약자가 오면 한 칸 띄웁니다(1년, 5운)."""
    return split_syllable(char)[0] in SPACE_AFTER_NUMBER or first_cell["letter"] == "운"


def needs_hyphen(prev_char, char):
    """제10·11항: 받침 없는 글자 뒤 '예', 또는 ㅑ·ㅘ·ㅜ·ㅝ 뒤 '애' 앞에 붙임표를 넣습니다(아예, 구애)."""
    if not is_hangul(prev_char):
        return False
    _, prev_vowel, prev_final = split_syllable(prev_char)
    initial, vowel, _ = split_syllable(char)
    if prev_final != "" or initial != "ㅇ":
        return False
    return vowel == "ㅖ" or (vowel == "ㅐ" and prev_vowel in VOWELS_BEFORE_AE)


# ── 공개 함수 ──────────────────────────────────────────────

def check_supported(text):
    """지원 범위(한글 음절·숫자·띄어쓰기) 밖이면 UnsupportedText를 냅니다."""
    if not isinstance(text, str) or not text.strip():
        raise UnsupportedText("점자로 바꿀 글자가 없습니다.")
    for char in text:
        if is_hangul(char) or char in DIGITS or char == " ":
            continue
        if "ㄱ" <= char <= "ㅣ":
            raise UnsupportedText(f"{char!r}처럼 자모만 따로 쓴 글자(제9항)는 아직 바꾸지 못합니다.")
        raise UnsupportedText(f"{char!r}는 바꾸지 못하는 글자입니다. 한글·숫자·띄어쓰기만 됩니다(문장부호·로마자 미지원).")
    for word in text.split():
        if word.startswith(ABBREVIATED_WORDS):
            raise UnsupportedText(f"'{word}' 같은 약어(제18항: 그래서·그러나·그리고 등)는 아직 바꾸지 못합니다.")


def to_cells(text):
    """문장을 점자 칸 목록으로 바꿉니다.
    칸마다 {"dots", "unicode", "letter", "role", "rule", "pos"} — pos는 원문에서 몇 번째 글자(0부터)에서 나온 칸인지입니다."""
    check_supported(text)
    cells = []
    for pos, char in enumerate(text):
        prev_char = text[pos - 1] if pos > 0 else None
        next_char = text[pos + 1] if pos + 1 < len(text) else None
        if char == " ":
            new = [space_cell()]
        elif char in DIGITS:
            new = number_cells(char, after_digit=prev_char in DIGITS)
        else:
            new = syllable_cells(char, next_char)
            if prev_char in DIGITS and needs_space_after_number(char, new[0]):
                new = [space_cell("제38항")] + new
            elif needs_hyphen(prev_char, char):
                new = [make_cell(HYPHEN, "붙임표", "붙임표", "제10·11항")] + new
        for item in new:
            item["pos"] = pos
        cells.extend(new)
    return cells


def to_unicode(text):
    """문장을 유니코드 점자 문자열로 바꿉니다. 예: '점자' → '⠨⠎⠢⠨'"""
    return "".join(item["unicode"] for item in to_cells(text))
