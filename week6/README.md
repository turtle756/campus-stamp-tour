# 6주차 실행 예제

Python 3.12 환경을 사용합니다. 전체 수업 설명은 강의 사이트의 6주차 자료에 있습니다.

## 이미지 실험실

```sh
python -m pip install -r requirements.txt
python -m flask --app app run --debug --port 5000
```

브라우저에서 http://127.0.0.1:5000 을 엽니다. VS Code Live Server로 HTML을 열지 않습니다.
샘플 이미지는 `static/sample.png`입니다. 사진은 JPEG/PNG, 5 MiB 및 800만 픽셀 이하입니다.

## 서버 TTS · 점자 읽기 모드 (Supertonic 3, 내 노트북에서만)

교수 예제의 Piper(영어 전용) 대신 한국어를 지원하는 **Supertonic 3**를 씁니다. 구조(최초 요청 때 모델 1회 로드, Lock, 메모리 WAV, `send_file`)는 예제와 같습니다.
이미지 서버를 Ctrl+C로 종료한 뒤 week6 폴더에서 실행합니다.

```sh
python -m pip install -r requirements-tts.txt
python -m flask --app tts_app download-model      # 처음 한 번, 약 385MB → week6/models/ (Git 제외)
python -m flask --app tts_app run --port 5000
```

- http://127.0.0.1:5000/tts : 문장 입력 → 서버 합성 → 파형·생성 시간·음성 길이·WAV 크기 (강의 기본 흐름)
- http://127.0.0.1:5000/braille : 점자 읽기 모드 「손끝 한 줄」. 점자 변환은 `braille.py`(한국 점자 규정, 문화체육관광부고시 제2020-38호), 문장은 `braille_items.py`의 `ITEMS`(엘리베이터 "열림"·캔 "음료"·화장실 "화장실")
- 한국어·영어 문장을 읽고, 그 밖의 언어·빈 문장·301자 이상은 400, 모델이 없으면 503과 내려받기 안내가 나옵니다.
- 나오는 목소리는 모두 AI 합성 음성입니다. 모델: Supertone `Supertone/supertonic-3`(코드 MIT, 가중치 OpenRAIL-M — AI 합성 음성임을 표시하고 실존 인물을 흉내 내지 않을 것).
- 이 노트북(CPU만)에서는 스레드 2개가 짧은 입력에 가장 빨라 `SUPERTONIC_INTRA_OP_THREADS=2`를 기본으로 둡니다. 음성 앞뒤 무음은 서버에서 잘라 보냅니다.
- TTS 앱은 Render에 배포하지 않습니다. Render의 `app:app`에는 `/tts`·`/braille`이 없습니다.

## Render 이미지 앱 설정

학생 저장소의 `week6` 폴더에 이 파일들을 둡니다.
Root Directory: `week6`
Build Command: `pip install -r requirements.txt`
Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120`
Python은 3.12 계열을 지정합니다. 수업 자료의 배포 절차를 확인하세요.

이 앱은 업로드 이미지와 생성한 결과를 영구 저장하지 않습니다.
프론트엔드는 같은 Flask 서버가 제공하므로 별도 CORS 설정은 사용하지 않습니다.
