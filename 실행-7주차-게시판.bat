@echo off
chcp 65001 >nul
set PYTHONUTF8=1
title 7주차 성심교정 밤 9시 제보 게시판 (http://127.0.0.1:5001)
cd /d "%~dp0"

rem 1) 가상환경(.venv, Python 3.12)이 없으면 uv로 만든다
if not exist ".venv\Scripts\python.exe" (
  where uv >nul 2>nul || (echo [오류] uv가 없습니다. https://docs.astral.sh/uv/ 에서 설치한 뒤 다시 실행하세요. & pause & exit /b 1)
  echo 가상환경을 만드는 중...
  uv venv --seed --python 3.12 .venv || (pause & exit /b 1)
)
set "PY=%~dp0.venv\Scripts\python.exe"
"%PY%" -c "import flask" >nul 2>nul || (
  where uv >nul 2>nul && (uv pip install --python "%PY%" -r week7\requirements.txt) || ("%PY%" -m pip install -r week7\requirements.txt)
)

cd /d "%~dp0week7"
if not exist "instance" mkdir instance

rem 2) SECRET_KEY: 처음 한 번 무작위로 만들어 instance\secret_key.txt(Git 제외)에 두고 계속 같은 값을 쓴다
rem    같은 값을 써야 서버를 다시 켜도 로그인이 유지된다
if not exist "instance\secret_key.txt" "%PY%" -c "import secrets; print(secrets.token_hex(32))" > "instance\secret_key.txt"
set /p SECRET_KEY=<"instance\secret_key.txt"

rem 3) 표 준비(기존 계정·글은 지우지 않음)
"%PY%" -m flask --app app init-db

rem 4) 관리자 지정: admin7로 가입해 두었다면 관리자가 된다(강의의 터미널 promote-admin과 같은 명령)
set "WEEK7_ADMIN_USERNAME=admin7"
"%PY%" -m flask --app app promote-admin >nul 2>nul && (echo admin7 = 관리자) || (echo admin7이 아직 없습니다. 웹에서 admin7으로 가입한 뒤 이 파일을 다시 실행하면 관리자가 됩니다.)

rem 5) 사건 자동 준비: 없으면 새로 만들고, 판결이 끝났으면 정리하고 새로 만들고, 진행 중이면 이어 간다
"%PY%" -m flask --app app auto-case

rem 6) 서버가 준비되면 브라우저를 연다 (NO_BROWSER=1이면 열지 않음)
if not defined NO_BROWSER start "" /b powershell -NoProfile -Command "for($i=0;$i -lt 120;$i++){try{Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5001/ -TimeoutSec 1 | Out-Null; Start-Process 'http://127.0.0.1:5001/'; break}catch{Start-Sleep -Milliseconds 500}}"

echo.
echo  게시판     http://127.0.0.1:5001/
echo  관리 화면  http://127.0.0.1:5001/admin  (admin7로 로그인)
echo  두 계정 시험은 다른 브라우저(예: 크롬과 엣지)로 같은 주소를 여세요.
echo  끄려면 이 창에서 Ctrl+C 를 누르거나 창을 닫으세요.
echo.
"%PY%" -m flask --app app run --port 5001
pause
