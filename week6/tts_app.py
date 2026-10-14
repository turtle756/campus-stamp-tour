"""실습 2: 이미지 앱에 서버 TTS 경로와 점자 읽기 모드 「손끝 한 줄」을 추가합니다.

교수 예제(Piper·영어)의 구조 — 최초 요청 때 모델을 한 번 로드, Lock으로 한 번에 하나씩,
메모리 버퍼(BytesIO)에 WAV를 만들어 send_file로 반환 — 는 그대로 두고,
모델만 한국어를 지원하는 Supertonic 3(Supertone, 코드 MIT · 가중치 OpenRAIL-M)으로 바꿨습니다.
OpenRAIL-M 조건: 화면에 "AI 합성 음성"임을 표시하고, 실존 인물을 흉내 내지 않습니다.
"""
from io import BytesIO
from pathlib import Path
from threading import Lock
from time import perf_counter
import os
import re
import wave

# 점자 화면은 음절·단어처럼 짧은 요청이 대부분인데, 이 노트북(i7-1360P)에서는 짧은 입력일 때
# 2스레드가 4스레드보다 빨랐습니다(음절·단어 530~710ms, 짧은 문구 800~1000ms / 4스레드는 650~910ms, 950~1160ms).
# 긴 문장은 4스레드가 조금 더 빠르지만 짧은 요청에 맞춰 2로 둡니다. import 전에 정해야 적용됩니다.
os.environ.setdefault("SUPERTONIC_INTRA_OP_THREADS", "2")

import numpy as np
from flask import render_template, request, send_file
from app import app
from braille_items import build_items

MODEL_DIR = Path(os.environ.get("TTS_MODEL_DIR", str(Path(__file__).parent / "models" / "supertonic-3")))
VOICES = ("F1", "F2", "F3", "F4", "F5", "M1", "M2", "M3", "M4", "M5")
SPEEDS = {0.8: 1.25, 1.0: 1.0, 1.25: 0.8}   # 강의의 음성 길이 배율 → Supertonic speed(클수록 빠름)
HANGUL = re.compile(r"[가-힣ㄱ-ㅎㅏ-ㅣ]")
SILENCE_RATIO = 0.02        # 가장 큰 소리의 2%(약 -34dB)보다 작으면 무음으로 봅니다
EDGE_PAD_SECONDS = 0.03     # 무음을 자른 뒤 앞뒤에 남기는 여유(30ms) — 말소리 시작이 잘리지 않게

tts = None            # 최초 요청 때 한 번 로드해 재사용
styles = {}           # 목소리 스타일도 한 번 읽어 재사용
tts_lock = Lock()

# 이미지 실험실(/) 하단의 TTS 링크는 tts_app으로 실행했을 때만 보이게 합니다(Render의 app:app에는 TTS가 없음).
app.config["TTS_PAGES"] = True

# 서버를 켤 때 점자 문장을 한 번 바꿔 둡니다(지원하지 않는 글자가 있으면 여기서 바로 오류가 납니다).
BRAILLE_ITEMS = build_items()


def model_ready():
    """모델 파일이 내려받아져 있는지 확인합니다(없으면 503 안내)."""
    return MODEL_DIR.is_dir() and any(MODEL_DIR.rglob("*.onnx"))


def detect_lang(text):
    """한글이 있으면 한국어, 영문자만 있으면 영어, 둘 다 없으면 지원하지 않는 입력."""
    if HANGUL.search(text):
        return "ko"
    if text.isascii() and any(char.isalpha() for char in text):
        return "en"
    return None


def cut_padding(samples, seconds, sample_rate):
    """Supertonic은 파형 뒤에 무음을 붙여 돌려주고 실제 길이(초)를 따로 알려 주므로 그만큼만 남깁니다."""
    return samples.reshape(-1)[: int(round(float(seconds) * sample_rate))]


def trim_silence(samples, sample_rate):
    """앞뒤 무음을 잘라 냅니다. 가장 큰 소리의 2% 미만을 무음으로 보고, 앞뒤 30ms 여유를 남깁니다.
    전부 무음(최댓값 0)이면 자르지 않고 그대로 돌려줍니다."""
    loudness = np.abs(samples)
    if len(loudness) == 0 or loudness.max() == 0:
        return samples
    voiced = np.flatnonzero(loudness >= loudness.max() * SILENCE_RATIO)   # 소리가 있는 샘플 위치들
    pad = int(EDGE_PAD_SECONDS * sample_rate)
    start = max(0, voiced[0] - pad)
    end = min(len(samples), voiced[-1] + 1 + pad)
    return samples[start:end]


def to_wav_bytes(samples, sample_rate):
    """float32 파형(-1~1)을 16비트 PCM WAV로 메모리 버퍼에 씁니다."""
    pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype("<i2")
    buffer = BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm.tobytes())
    buffer.seek(0)
    return buffer


@app.cli.command("download-model")
def download_model_command():
    """python -m flask --app tts_app download-model : 모델(약 385MB)을 week6/models에 내려받습니다."""
    from supertonic import TTS
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    TTS(model_dir=MODEL_DIR, auto_download=True)
    print("모델 준비 완료:", MODEL_DIR)


@app.get("/tts")
def tts_page():
    return render_template("tts.html", voices=VOICES)


@app.get("/braille")
def braille_page():
    # 점자 변환은 서버가 맡습니다: 규정 표를 braille.py 한곳에서 관리하고, 브라우저는 받은 점을 그리기만 합니다.
    return render_template("braille.html", items=BRAILLE_ITEMS)


@app.get("/api/tts/status")
def tts_status():
    """화면이 '모델 준비 중/완료'를 보여 줄 수 있게 상태만 알려 줍니다."""
    return {"model_files": model_ready(), "loaded": tts is not None}


@app.post("/api/tts")
def synthesize():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return {"error": "JSON 객체로 text를 보내세요."}, 400
    text = data.get("text")
    if not isinstance(text, str) or not text.strip() or len(text) > 300:
        return {"error": "1~300자의 문장을 입력하세요."}, 400
    lang = detect_lang(text)
    if lang is None:
        return {"error": "한국어 또는 영어 문장만 읽을 수 있습니다."}, 400
    try:
        length_scale = float(data.get("length_scale", 1.0))
    except (TypeError, ValueError):
        return {"error": "음성 길이 배율은 숫자여야 합니다."}, 400
    if length_scale not in SPEEDS:
        return {"error": "배율은 0.8, 1.0, 1.25 중 하나입니다."}, 400
    voice = data.get("voice", "F1")
    if voice not in VOICES:
        return {"error": "목소리는 F1~F5, M1~M5 중 하나입니다."}, 400
    if not model_ready():
        return {"error": "모델 파일이 없습니다. week6 폴더에서 'python -m flask --app tts_app download-model'을 먼저 실행하세요."}, 503
    try:
        from supertonic import TTS
    except ImportError:
        return {"error": "requirements-tts.txt의 패키지를 설치하세요."}, 503
    # 한 번에 하나씩 합성합니다. 점자 화면은 짧은 요청이 이어지므로 바로 거절하지 않고 잠깐 기다립니다.
    if not tts_lock.acquire(timeout=15):
        return {"error": "다른 음성을 만드는 중입니다. 잠시 뒤 다시 시도하세요."}, 429
    started = perf_counter()
    try:
        global tts
        if tts is None:
            tts = TTS(model_dir=MODEL_DIR, auto_download=False)   # 최초 요청 때 한 번 로드
        if voice not in styles:
            styles[voice] = tts.get_voice_style(voice_name=voice)
        samples, durations = tts.synthesize(text.strip(), voice_style=styles[voice], lang=lang,
                                            speed=SPEEDS[length_scale])
        spoken = cut_padding(samples, durations[0], tts.sample_rate)
        trimmed = trim_silence(spoken, tts.sample_rate)   # 짧은 말이 바로 들리도록 앞뒤 무음 제거
        buffer = to_wav_bytes(trimmed, tts.sample_rate)
        response = send_file(buffer, mimetype="audio/wav", download_name="speech.wav", max_age=0)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Processing-Ms"] = f"{(perf_counter() - started) * 1000:.1f}"
        response.headers["X-Audio-Seconds"] = f"{len(trimmed) / tts.sample_rate:.3f}"      # 무음을 자른 뒤 길이(브라우저 값과 교차 확인용)
        response.headers["X-Untrimmed-Seconds"] = f"{len(spoken) / tts.sample_rate:.3f}"  # 자르기 전 길이(비교용)
        response.headers["X-Sample-Rate"] = str(tts.sample_rate)     # decodeAudioData는 리샘플링하므로 원본 값은 서버가 알려 줌
        response.headers["X-Lang"] = lang
        return response
    except Exception:
        app.logger.exception("TTS 생성 실패")
        return {"error": "음성을 만들지 못했습니다. 서버 터미널에서 오류를 확인하세요."}, 500
    finally:
        tts_lock.release()
