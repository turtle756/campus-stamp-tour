# 캠퍼스 스탬프 투어 · 학교 밖으로 안 나가는 하루

> ## 🔗 공개 주소
> ### **https://turtle756.github.io/campus-stamp-tour/**
> 저장소: https://github.com/turtle756/campus-stamp-tour

가톨릭대학교 웹프로그래밍 **개인 풀스택 프로젝트** 저장소입니다.
2주차부터 8주차까지 이 저장소 하나에 기능을 얹어 가며 캠퍼스 미션·스탬프 투어로 확장합니다.

현재 단계는 **3주차 · CSS와 반응형 UI**입니다. 2주차의 HTML 위에 `assets/css/style.css`
하나만 얹어서 네 페이지에 확연히 다른 분위기를 주고, 모바일 전용 규칙까지 넣었습니다.

---

## 지금 만든 것 (2주차)

성심교정 안에서 하루가 실제로 굴러가게 해주는 장소 3곳을 HTML만으로 소개합니다.
명소가 아니라 **동선**을 기준으로 골랐습니다. 아침(편의점) → 점심(학생식당) → 저녁(헬스장)까지
정문 밖으로 한 발도 나가지 않는 하루가 이 사이트의 주제입니다.

| 시간 | 장소 | 페이지 | 고른 이유 |
|---|---|---|---|
| 아침 | 학관 1층 GS25 | [`store.html`](store.html) | 습관처럼 들르게 되는, 아침·점심 대용을 책임지는 곳 |
| 점심 | 학관 2층 학생식당 | [`cafeteria.html`](cafeteria.html) | 혼밥이 편하고, 밖보다 반값인 가성비 |
| 저녁 | 교내 트러스트짐 | [`gym.html`](gym.html) | 교내라서 계속 다니게 된 헬스장 — 거리가 습관을 만든다 |

## 파일 구조

```
campus-stamp-tour/
├── README.md
├── index.html          # 첫 화면 · 장소 3곳 소개와 제보 폼
├── store.html          # 장소 1 · 학관 1층 GS25
├── cafeteria.html      # 장소 2 · 학관 2층 학생식당
├── gym.html            # 장소 3 · 교내 트러스트짐
├── images/             # 장소 사진 (파일명 고정, 내용만 교체)
│   ├── store.jpg
│   ├── cafeteria.jpg
│   └── gym.jpg
└── assets/
    ├── css/
    │   └── style.css   # 3주차 · 네 페이지 스타일 한 파일에 통합
    └── js/             # 4주차 JavaScript 자리
```

`images/` 의 파일명은 HTML이 참조하는 이름으로 고정되어 있습니다.
사진을 바꿀 때는 **같은 이름으로 덮어쓰기만** 하면 모든 페이지에 반영됩니다.

## 2주차에 사용한 HTML

수업 실습에서 다룬 요소를 과제에 반영했습니다.

| 실습 내용 | 사용한 곳 |
|---|---|
| HTML5 기본 구조 (`doctype`, `html lang`, `meta charset`, `viewport`, `title`, `body`) | 4개 파일 전부 |
| 제목·문단·줄바꿈·강조 (`h1`~`h3`, `p`, `br`, `b`, `strong`) | 전 페이지 |
| `style` 속성 | 2주차에는 `index.html` 소개 문장 1곳에 사용했으나, 3주차에 요구사항대로 제거함 |
| `div` 로 관련 내용 묶기 | 상세 페이지 이미지 영역 |
| 외부 링크 (`target="_blank" rel="noopener"`) | 카카오맵 지도 링크 3개 |
| 문서 내 이동 링크 (`#id`) | `index.html` 목차, 맨 위로 |
| `img` 와 대체 텍스트 `alt` | 장소 사진 6곳 |
| 시맨틱 구조 태그 (`header`, `main`, `section`, `article`, `nav`, `footer`) | 전 페이지 |

`iframe`(YouTube 퍼가기)은 소개할 장소에 맞는 영상 중 이용 조건을 확인한 것이 없어 사용하지 않았습니다.
`form`은 이번 과제에서 요구하지 않는 요소라 넣지 않았습니다. 사용자 입력은 6~7주차에 서버와 함께 설계할 예정입니다.
별도의 CSS 파일과 JavaScript는 사용하지 않았습니다.

## 지금 추가한 것 (3주차) · 네 페이지, 네 가지 분위기

같은 HTML 위에 CSS 하나만 얹어서 페이지마다 색·글꼴·모서리·인터랙션을 서로 다르게 만들었습니다.
`<body>` 에 붙인 `page-XXX` class 하나로 페이지를 구분하고, 나머지는 모두
`assets/css/style.css` 안에서 처리합니다. HTML의 `style` 속성과 `style` 태그는 모두 제거했습니다.

| 페이지 | body class | 의도한 분위기 | 대표 색 | 대표 글꼴 | 특징 |
|---|---|---|---|---|---|
| `index.html` | `page-home` | 손글씨 메모패드 · "실제 동선 기록" | 크림 `#fdf6e3` + 진녹 `#2d5016` | Noto Sans KR 900 | 배경에 노트 밑줄(`repeating-linear-gradient`), 카드 등장 애니메이션, `<strong>` 형광펜 |
| `store.html` | `page-store` | 편의점 형광등 · 각진 진열대 | 순백 + GS25 청록 `#00aeef` | Noto Sans KR | 상단 스트라이프 바, 각진 모서리(4px), 버튼에 `pulse` 애니메이션 |
| `cafeteria.html` | `page-cafeteria` | 조용한 식당 · 담백한 명조 | 크림 `#faf3e6` + 갈색 `#a0522d` | **Nanum Myeongjo** | 둥근 카드(24px), 포인트 `◆` 리스트, 알약형 버튼 |
| `gym.html` | `page-gym` | 짙은 네이비 · 오렌지 강조 | `#0f2027` + `#ff6b35` | **JetBrains Mono** (제목) | 왼쪽 오렌지 바, 제목에 `//` 프리픽스, `-webkit-backdrop-filter` 유리 패널 |

**공통 규칙:**

- 네 페이지 모두 `.page` / `.site-header` / `main.explorer` 컨테이너로 **1단 중앙 배치** (`max-width: 760px; margin: 0 auto;`).
- `box-sizing: border-box` 를 전 요소에 적용해 크기 계산을 예측 가능하게 정리.
- 링크는 모두 `:hover` 와 `:focus-visible` 을 함께 설계 — 마우스뿐 아니라 Tab 이동으로도 어디가 눌리는지 보이도록.
- `a { color: inherit; }` 로 어두운 gym 페이지에서도 링크가 배경과 싸우지 않도록 처리.

**반응형 (`@media`):**

| 조건 | 무엇을 바꾸는가 | 이유 |
|---|---|---|
| `max-width: 600px` | `.page` 좌우 여백 축소, `h1` 축소, 카드 padding 축소, `.primary-action` 을 **세로 블록**으로 전환하고 padding 확대 | 모바일에서 손가락으로 누르기 쉽도록 링크·버튼의 터치 타깃을 확대. 각 페이지의 제목 크기도 개별적으로 재조정 |
| `min-width: 601px` and `max-width: 959px` | 태블릿에서 `h1` 살짝 축소 | 데스크톱-태블릿 사이 어색한 크기 방지 |
| `print` | `.place-nav`, `.toc`, `.back-link`, `.primary-action` 숨김 · 외부 링크 뒤에 URL 자동 표기 | 종이로 뽑았을 때 UI 요소가 지면을 차지하지 않도록 |
| `prefers-reduced-motion: reduce` | 모든 애니메이션·transition을 0.01ms로 억제 | 어지럼증 사용자를 위한 접근성 대응 |

**강의에서 배운 CSS 요소가 실제로 쓰인 곳:**

| 강의 항목 | 사용한 곳 |
|---|---|
| 외부 CSS 파일 연결 (`<link rel="stylesheet">`) | 4개 HTML 전부, `<head>` 안 |
| `box-sizing: border-box` 전역 적용 | `style.css` 상단 |
| CSS 변수 (`--ink`, `--accent` 등) | 페이지별 팔레트 분리 |
| 선택자 조합 (`.page-store .place-panel` 같은 페이지별 오버라이드) | 4개 페이지 스타일 전부 |
| `:hover`, `:focus-visible`, `:active` | `.primary-action`, `.place-card` 등 |
| `transition` | 링크·버튼 색·transform 부드러운 전환 |
| `@keyframes` | `home-slide-up`, `store-pulse`, `cafe-fade-in`, `gym-slide-in` |
| Vendor prefix (`-webkit-backdrop-filter`, `-webkit-text-stroke`) | gym 페이지 유리 패널·제목 stroke |
| `@supports (display: grid)` fallback | `.place-list` — grid 미지원 시 block으로 |
| `@media (max-width: ...)` / `@media print` / `prefers-reduced-motion` | 반응형·인쇄·접근성 각 1블록 |

**의도적으로 뺀 것:**

- **여러 열 레이아웃** — 강의가 "네 페이지 모두 1단 중앙"이라고 못박아서 grid 3열 같은 건 넣지 않았습니다. `.place-list` 는 grid를 쓰지만 열은 1로 고정되어 있어 세로로만 쌓입니다.
- **hover에만 의존하는 정보** — 기본 상태에서 이미 다 보이도록 하고, hover는 강조/미세 이동에만 사용했습니다. 터치 기기에서도 정보가 사라지지 않습니다.
- **외부 이미지·아이콘** — 도형은 CSS와 유니코드 문자(`◆`, `▶`)로 처리해서 이미지 요청을 늘리지 않았습니다.

## 다음 주차 준비 상태

이후 주차에서 HTML을 다시 쓰지 않아도 되도록 미리 붙여 둔 것들입니다.

- **4주차 (JavaScript)** — 각 장소에 `data-place-id`, `data-building`, `data-floor`,
  `data-time-of-day` 를 넣어 두었습니다. `dataset` 으로 읽어 marker·필터에 바로 쓸 수 있습니다.
- **6~7주차 (Flask)** — 장소 id 를 그대로 route 와 API 경로에 쓸 수 있게 맞춰 두었습니다.
- 장소 id (`store`, `cafeteria`, `gym`) 는 이후 JSON·DB의 기본 키로 그대로 쓸 예정입니다.

## 출처

- 사진: 작성자 직접 촬영
- 위치·지도 링크: [카카오맵](https://map.kakao.com/)
  - [GS25 가톨릭대학교점](https://place.map.kakao.com/870364688)
  - [가톨릭대학교 성심교정](https://place.map.kakao.com/11344864) — 학생식당은 학관 2층
  - [트러스트짐 (지봉로 43)](https://place.map.kakao.com/986693554)
- 학교 정보: [가톨릭대학교 공식 홈페이지](https://www.catholic.ac.kr/)
- 웹폰트 (3주차 추가): [Google Fonts](https://fonts.google.com/) — [Noto Sans KR](https://fonts.google.com/specimen/Noto+Sans+KR), [Nanum Myeongjo](https://fonts.google.com/specimen/Nanum+Myeongjo), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono). 모두 오픈 폰트 라이선스로 배포됩니다.

## 작업 기록

| 주차 | 내용 |
|---|---|
| 2주차 | 저장소 생성, 장소 3곳 HTML 구조 작성, GitHub Pages 첫 배포 |
| 3주차 | `assets/css/style.css` 신규 · 네 페이지에 서로 다른 분위기 적용 · 모바일 `@media` · 인쇄와 `prefers-reduced-motion` 대응 · `index.html` 인라인 style 제거 |
