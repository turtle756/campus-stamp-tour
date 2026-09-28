# 캠퍼스 스탬프 투어 · 학교 밖으로 안 나가는 하루

> ## 🔗 공개 주소
> ### **https://turtle756.github.io/campus-stamp-tour/**
> 저장소: https://github.com/turtle756/campus-stamp-tour

가톨릭대학교 웹프로그래밍 **개인 풀스택 프로젝트** 저장소입니다.
2주차부터 8주차까지 이 저장소 하나에 기능을 얹어 가며 캠퍼스 미션·스탬프 투어로 확장합니다.

현재 단계는 **4주차 · JavaScript와 DOM**입니다. 3주차까지의 정적 페이지는 그대로 두고,
`week4/` 폴더에 장소 탐험·통계 시각화·Canvas 게임 세 실습을 추가했습니다.

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
├── assets/
│   ├── css/
│   │   └── style.css   # 3주차 · 네 페이지 스타일 한 파일에 통합
│   └── js/             # (비어 있음 · 4주차 JS는 week4/ 안에 둠)
└── week4/              # 4주차 · JavaScript와 DOM
    ├── index.html      # 실습 1 · 장소 탐험 (한 번에 하나씩)
    ├── app.js
    ├── styles.css      # week4 공용 스타일
    ├── statistics.html # 실습 2 · 통계 시각화 (Chart.js + Papa Parse)
    ├── statistics.js
    ├── game.html       # 실습 3 · Canvas 게임 (스탬프 투어 러시)
    ├── game.js
    └── data/
        └── cpi_food.csv
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

## 지금 추가한 것 (4주차) · JavaScript와 DOM

3주차까지의 페이지는 그대로 두고 `week4/` 폴더에 실습 세 개를 따로 만들었습니다.
모두 같은 `week4/styles.css`를 쓰고, 서버로 무언가를 보내는 코드는 없습니다(GitHub Pages 정적 배포).

| 실습 | 배포 주소 | 한 줄 설명 |
|---|---|---|
| 1 · 장소 탐험 | https://turtle756.github.io/campus-stamp-tour/week4/ | 세 장소가 한 페이지에 있고, 버튼을 누르면 하나만 보임 + 지도 |
| 2 · 통계 시각화 | https://turtle756.github.io/campus-stamp-tour/week4/statistics.html | 외식 vs 구내식당 vs 편의점 한 끼 물가 상승률, 그래프 2개 탭 전환 |
| 3 · Canvas 게임 | https://turtle756.github.io/campus-stamp-tour/week4/game.html | 스탬프 투어 러시 — 반짝인 순서를 기억해 빠르게 누르기 |

### 실습 1 · 장소 탐험 (`week4/index.html`, `app.js`)

- 2주차 세 장소의 사진·설명·추천 이유를 `section` 세 개에 모두 넣고, `app.js`가 `section.style.display`를 `block`/`none`으로 바꿔 **한 번에 하나만** 보이게 합니다.
- 버튼은 `aria-pressed`로 현재 선택을 표시하고, `#store` 같은 URL 해시와 동기화해 새로고침·공유 시 같은 장소가 열립니다.
- 지도는 Google 지도 퍼가기(`output=embed`) iframe입니다. 카카오맵은 JavaScript API 앱키 발급과 도메인 등록이 필수라 iframe만으로는 넣을 수 없어, "카카오맵에서 열기" 링크로 대신했습니다.
- 보이지 않는 장소의 iframe은 `data-src`로 두었다가 선택될 때만 `src`를 넣어 첫 로딩에서 지도 세 개를 동시에 받지 않게 했습니다.

### 실습 2 · 통계 시각화 (`week4/statistics.html`, `statistics.js`, `data/cpi_food.csv`)

- **왜 이 데이터인가**: 이 사이트의 주제가 "학교 밖으로 안 나가는 하루"라서, 밖에서 먹는 값(외식)과 안에서 먹는 값(구내식당·편의점)이 실제로 어떻게 움직였는지 보고 싶었습니다.
- **출처**: 국가데이터처(구 통계청) KOSIS [품목별 소비자물가지수 DT_1J20003](https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1J20003) 과 연도별 [소비자물가동향 보도자료](https://www.kostat.go.kr/board.es?mid=a10301010000&bid=213). 구내식당식사비 2021~2023 값은 KOSIS를 인용한 [이투데이 2024-01-09 기사](https://www.etoday.co.kr/news/view/2319254)로 확인. **확인일 2026-09-28.**
- **대상·기간·단위**: 대한민국 전국, 2021~2025년 연간, 전년 대비 상승률(%). 2020=100 기준 지수의 변화율.
- **그래프 선택 이유**: 그래프 1은 연도×항목의 비교라 묶음 막대(bar)를, 그래프 2는 품목 이름이 길어 가로 막대(`indexAxis: 'y'`)를 골랐습니다. 선 그래프는 5개 점으로는 추세보다 값 비교가 중요해 쓰지 않았습니다.
- **CSV 처리**: Papa Parse(`header`, `dynamicTyping`)로 읽어 `year, item, rate_pct` 긴 형식으로 두고 그래프별로 필터합니다. 빈 값은 0으로 바꾸지 않고 `null`로 남겨 막대를 비우고, 그래프 위 안내문에 "아직 확인되지 않은 칸"으로 표시합니다. 파일을 못 읽거나 라이브러리 로드에 실패하면 오류 문구와 원자료 표만 보입니다.
- **아직 비어 있는 칸**: 구내식당식사비 2024·2025 연간 상승률은 보도자료 첨부(hwp)에만 있어 웹에서 원문을 확인하지 못했습니다. KOSIS에서 직접 내려받아 채울 예정이며, 그때까지는 비워 둡니다.

### 실습 3 · Canvas 게임 (`week4/game.html`, `game.js`)

- **아이디어**: 아침(GS25)·점심(학생식당)·저녁(트러스트짐) 스탬프 세 개가 차례로 반짝이면, 같은 순서로 빠르게 눌러 하루를 완성하는 순서 기억 게임입니다. 라운드가 오를수록 순서는 길어지고(3→4→5…) 입력 제한 시간은 줄어듭니다(6초→2.5초).
- **조작**: 마우스 클릭과 터치 모두 `pointerdown` 하나로 받고, `getBoundingClientRect`로 화면 좌표를 캔버스 좌표로 환산합니다. 캔버스는 CSS로 폭 100%라 휴대전화에서도 같은 코드가 동작합니다.
- **점수·종료·재시작**: 성공 시 `순서 길이 × 10 + 남은 시간 보너스`, 실패·시간 초과 시 목숨 −1, 목숨 0이면 종료 화면과 재시작 버튼. 최고 점수는 `localStorage`에 저장합니다(5주차 브라우저 저장소 예습).
- **플레이하며 고친 것**: 처음엔 반짝임 간격이 일정했는데 5라운드부터 눈으로 구분이 안 돼 라운드마다 25ms씩 짧아지되 280ms 아래로는 안 내려가게 바꿨습니다. 또 시간 초과가 목숨을 두 번 깎는 버그가 있어 `phase`를 `between`으로 먼저 바꾸고 다음 라운드를 예약하도록 순서를 고쳤습니다.

### AI 도구 활용 내역

Copilot 대신 Claude Code(터미널 에이전트)를 사용했습니다. 실제로 한 요청과 고친 것:

- "세 장소를 한 페이지에서 버튼으로 하나씩 보이게, `display` 토글로" → 초안에서 `hidden` 속성을 쓰길래 채점 기준대로 `style.display`로 바꾸게 함.
- "공공데이터 CSV로 외식 vs 학식 그래프" → 처음 제안한 '천원의 아침밥' 데이터는 공공데이터포털에 CSV가 없어서 폐기하고, 같은 KOSIS 표 안의 외식·구내식당식사비로 바꿈. 없는 값은 0으로 채우지 말라고 지시.
- "카카오맵 iframe" → 앱키 없이는 불가하다는 반론을 받고 Google 임베드 + 카카오 링크로 결정.
- 모든 코드는 `node --check`로 문법 확인 후, 배포된 페이지를 직접 열어 버튼·탭·게임을 눌러 봤습니다.

### 휴대전화 확인 결과

- (제출 전 직접 확인해 채울 칸) 장소 탐험: 버튼 3개 / 지도 표시 · 통계: 두 탭 전환 / 그래프 터치 툴팁 · 게임: 터치로 스탬프 입력 / 재시작

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
| 4주차 | `week4/` 신규 · 장소 탐험(display 토글 + Google 지도 iframe) · 통계 시각화(KOSIS 외식·구내식당·편의점 CSV, Chart.js 탭 2개) · Canvas 게임(스탬프 투어 러시) |
