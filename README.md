# 학교 밖으로 안 나가는 하루

가톨릭대학교 웹프로그래밍 **2주차 실습 과제**입니다.
성심교정 안에서 하루가 실제로 굴러가게 해주는 장소 3곳을 골라, HTML만으로 만든 소개 홈페이지입니다.

명소가 아니라 **동선**을 기준으로 골랐습니다. 아침(편의점) → 점심(학생식당) → 저녁(헬스장)까지
정문 밖으로 한 발도 나가지 않는 하루가 이 사이트의 주제입니다.

## 공개 주소 (GitHub Pages)

**https://turtle756.github.io/WP-week02/**

## 소개하는 장소

| 시간 | 장소 | 페이지 | 고른 이유 |
|---|---|---|---|
| 아침 | 학관 1층 GS25 | `store.html` | 습관처럼 들르게 되는, 아침·점심 대용을 책임지는 곳 |
| 점심 | 학관 2층 학생식당 | `cafeteria.html` | 혼밥이 편하고, 밖보다 반값인 가성비 |
| 저녁 | 교내 트러스트짐 | `gym.html` | 교내라서 계속 다니게 된 헬스장 — 거리가 습관을 만든다 |

## 파일 구조

```
WP-week02/
├── README.md
├── index.html          # 첫 화면·프론트페이지
├── store.html          # 장소 1 · 학관 1층 GS25
├── cafeteria.html      # 장소 2 · 학관 2층 학생식당
├── gym.html            # 장소 3 · 교내 트러스트짐
└── images/
    ├── store.jpg
    ├── cafeteria.jpg
    └── gym.jpg
```

## 이번 주에 사용한 것

- HTML5 기본 구조 (`<!doctype html>`, `html lang`, `meta charset`, `viewport`, `title`, `body`)
- 구조 태그: `header`, `main`, `section`, `article`, `nav`, `footer`
- 콘텐츠 태그: `h1`~`h3`, `p`, `ul`, `ol`, `li`, `strong`, `table`, `hr`
- 링크: 문서 간 상대 경로 링크, 외부 지도 링크 (`target="_blank" rel="noopener"`)
- 이미지: `img` 와 내용에 맞는 `alt`
- 별도의 CSS 파일과 JavaScript는 사용하지 않았습니다. 프론트페이지 소개 문장 한 곳에만 `style` 속성을 사용했습니다.

## 출처

- 사진: 작성자 직접 촬영
- 위치·지도 링크: [카카오맵](https://map.kakao.com/)
  - [GS25 가톨릭대학교점](https://place.map.kakao.com/870364688)
  - [가톨릭대학교 성심교정](https://place.map.kakao.com/11344864) (학생식당은 학관 2층)
  - [트러스트짐 (지봉로 43)](https://place.map.kakao.com/986693554)
- 학교 정보: [가톨릭대학교 공식 홈페이지](https://www.catholic.ac.kr/)

---

## 작업 메모 (제출 전 정리 · 확인 후 이 절은 지워도 됩니다)

- [ ] `images/` 의 세 파일은 **자리표시용 placeholder** 입니다. 직접 촬영한 사진으로 같은 파일 이름으로 덮어쓰기
- [ ] 학생식당 배식·식권 방식, 트러스트짐 등록 절차 설명이 실제와 맞는지 확인
- [ ] 사진에 다른 사람의 얼굴이나 이름표가 알아볼 수 있게 나오지 않았는지 확인 (편의점·식당·헬스장은 특히 주의)
- [ ] 휴대전화 / 로그아웃한 브라우저에서 공개 주소 네 페이지가 모두 열리는지 확인
