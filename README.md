# 나만의 캠퍼스 핫스팟

가톨릭대학교 웹프로그래밍 **2주차 실습 과제**입니다.
성심교정 안에서 개인적으로 의미 있는 장소 3곳을 골라, HTML만으로 만든 한 장짜리 소개 홈페이지입니다.

## 공개 주소 (GitHub Pages)

**https://turtle756.github.io/WP-week02/**

## 소개하는 장소

| 장소 | 페이지 | 한 줄 소개 |
|---|---|---|
| 중앙도서관의 조용한 창가 | `library.html` | 복잡한 생각을 정리하고 싶을 때 찾는 자리 |
| 예수성심성당 앞 계단 | `chapel.html` | 캠퍼스에서 가장 조용한 몇 분을 얻을 수 있는 곳 |
| 니콜스관 1층 라운지 | `nichols.html` | 약속 시간보다 20분 일찍 도착했을 때 쓸모 있는 자리 |

## 파일 구조

```
WP-week02/
├── README.md
├── index.html          # 첫 화면·프론트페이지
├── library.html        # 장소 1 · 중앙도서관
├── chapel.html         # 장소 2 · 예수성심성당
├── nichols.html        # 장소 3 · 니콜스관
└── images/
    ├── library.jpg
    ├── chapel.jpg
    └── nichols.jpg
```

## 이번 주에 사용한 것

- HTML5 기본 구조 (`<!doctype html>`, `html lang`, `meta charset`, `viewport`, `title`, `body`)
- 구조 태그: `header`, `main`, `section`, `article`, `nav`, `footer`
- 콘텐츠 태그: `h1`~`h3`, `p`, `ul`, `ol`, `li`, `table`, `hr`
- 링크: 문서 간 상대 경로 링크, 외부 지도 링크 (`target="_blank" rel="noopener"`)
- 이미지: `img` 와 내용에 맞는 `alt`
- 별도의 CSS 파일과 JavaScript는 사용하지 않았습니다. 프론트페이지 소개 문장 한 곳에만 `style` 속성을 사용했습니다.

## 출처

- 사진: 작성자 직접 촬영
- 위치·지도 링크: [카카오맵](https://map.kakao.com/)
- 학교 정보: [가톨릭대학교 공식 홈페이지](https://www.catholic.ac.kr/)

---

## 작업 메모 (제출 전 정리 · 확인 후 이 절은 지워도 됩니다)

- [ ] `images/` 의 세 파일은 **자리표시용 placeholder** 입니다. 직접 촬영한 사진으로 같은 파일 이름으로 덮어쓰기
- [ ] 각 장소 페이지의 「이 장소가 의미 있는 이유」 문단을 본인의 실제 경험으로 교체
- [ ] 「찾아가는 방법」의 층수·방향 설명이 실제와 맞는지 확인
- [ ] 사진에 다른 사람의 얼굴이나 이름표가 알아볼 수 있게 나오지 않았는지 확인
- [ ] 휴대전화 / 로그아웃한 브라우저에서 공개 주소 네 페이지가 모두 열리는지 확인
