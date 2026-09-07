# 캠퍼스 스탬프 투어 · 학교 밖으로 안 나가는 하루

> ## 🔗 공개 주소
> ### **https://turtle756.github.io/campus-stamp-tour/**
> 저장소: https://github.com/turtle756/campus-stamp-tour

가톨릭대학교 웹프로그래밍 **개인 풀스택 프로젝트** 저장소입니다.
2주차부터 8주차까지 이 저장소 하나에 기능을 얹어 가며 캠퍼스 미션·스탬프 투어로 확장합니다.

현재 단계는 **2주차 · HTML 구조와 장소 안내**입니다.

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
    ├── css/            # 3주차 CSS 자리
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
| `style` 속성 | `index.html` 소개 문장 1곳 |
| `div` 로 관련 내용 묶기 | 상세 페이지 이미지 영역 |
| 외부 링크 (`target="_blank" rel="noopener"`) | 카카오맵 지도 링크 3개 |
| 문서 내 이동 링크 (`#id`) | `index.html` 목차, 맨 위로 |
| `img` 와 대체 텍스트 `alt` | 장소 사진 6곳 |
| 시맨틱 구조 태그 (`header`, `main`, `section`, `article`, `nav`, `footer`) | 전 페이지 |

`iframe`(YouTube 퍼가기)은 소개할 장소에 맞는 영상 중 이용 조건을 확인한 것이 없어 사용하지 않았습니다.
`form`은 이번 과제에서 요구하지 않는 요소라 넣지 않았습니다. 사용자 입력은 6~7주차에 서버와 함께 설계할 예정입니다.
별도의 CSS 파일과 JavaScript는 사용하지 않았습니다.

## 다음 주차 준비 상태

이후 주차에서 HTML을 다시 쓰지 않아도 되도록 미리 붙여 둔 것들입니다.

- **3주차 (CSS)** — `.explorer`, `.place-panel`, `.place-card`, `.map`, `.primary-action` 등
  class 이름을 강의 예제와 같은 규칙으로 부여했습니다. `assets/css/style.css` 를 만들고
  각 페이지에 `link` 한 줄만 추가하면 됩니다.
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

## 작업 기록

| 주차 | 내용 |
|---|---|
| 2주차 | 저장소 생성, 장소 3곳 HTML 구조 작성, GitHub Pages 첫 배포 |
