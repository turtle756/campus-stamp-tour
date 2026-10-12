@echo off
chcp 65001 >nul
set PYTHONUTF8=1
title 6주차 서버 TTS · 점자 읽기 모드 (http://127.0.0.1:5000)
cd /d "%~dp0"

rem 1) 가상환경(.venv, Python 3.12)이 없으면 uv로 만든다
if not exist ".venv\Scripts\python.exe" (
  where uv >nul 2>nul || (echo [오류] uv가 없습니다. https://docs.astral.sh/uv/ 에서 설치한 뒤 다시 실행하세요. & pause & exit /b 1)
  echo 가상환경을 만드는 중...
  uv venv --seed --python 3.12 .venv || (pause & exit /b 1)
)
set "PY=%~dp0.venv\Scripts\python.exe"

rem 2) 패키지(Flask·OpenCV·Supertonic)가 없으면 설치한다
"%PY%" -c "import flask, cv2, supertonic" >nul 2>nul || (
  echo 패키지를 설치하는 중...
  where uv >nul 2>nul && (uv pip install --python "%PY%" -r week6\requirements-tts.txt) || ("%PY%" -m pip install -r week6\requirements-tts.txt)
)

cd /d "%~dp0week6"
rem 3) TTS 모델(약 385MB)이 없으면 처음 한 번 내려받는다
if not exist "models\supertonic-3\onnx" (
  echo TTS 모델을 내려받는 중... 처음 한 번만, 1분 정도 걸립니다.
  "%PY%" -m flask --app tts_app download-model || (pause & exit /b 1)
)

rem 4) 서버가 준비되면 브라우저로 점자 읽기 모드를 연다 (NO_BROWSER=1이면 열지 않음)
if not defined NO_BROWSER start "" /b powershell -NoProfile -Command "for($i=0;$i -lt 120;$i++){try{Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5000/health -TimeoutSec 1 | Out-Null; Start-Process 'http://127.0.0.1:5000/braille'; break}catch{Start-Sleep -Milliseconds 500}}"

echo.
echo  점자 읽기 모드  http://127.0.0.1:5000/braille
echo  서버 TTS        http://127.0.0.1:5000/tts
echo  사진 실험실     http://127.0.0.1:5000/
echo  끄려면 이 창에서 Ctrl+C 를 누르거나 창을 닫으세요.
echo.
"%PY%" -m flask --app tts_app run --port 5000
pause
