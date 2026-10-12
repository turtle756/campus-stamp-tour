// 점자 읽기 모드 「손끝 한 줄」
// - 점자 변환은 서버(braille.py)가 하고, 이 파일은 받은 칸을 Canvas에 그리고 손끝 입력을 처리합니다.
// - 볼록한 점을 지날 때의 '틱'은 브라우저 Web Audio로 바로 냅니다(서버에 묻지 않음).
// - 말소리(시작 안내·칸 힌트·정답 문장·다시 만져 볼 칸)는 서버 /api/tts가 만든 WAV를 받아 재생하고 파형을 그립니다.

const levels = JSON.parse(document.querySelector("#level-data").textContent);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const startScreen = document.querySelector("#start-screen");
const readingScreen = document.querySelector("#reading-screen");
const strip = document.querySelector("#braille-strip");
const cellInfo = document.querySelector("#cell-info");
const levelLabel = document.querySelector("#level-label");
const choicesBox = document.querySelector("#choices");
const answerPanel = document.querySelector("#answer-panel");
const answerForm = document.querySelector("#answer-form");
const answerInput = document.querySelector("#answer-input");
const levelEnd = document.querySelector("#level-end");
const finalPanel = document.querySelector("#final-panel");
const nextButton = document.querySelector("#next-button");
const restartButton = document.querySelector("#restart-button");
const cardDialog = document.querySelector("#card-dialog");
const cardList = document.querySelector("#card-list");
const soundPanel = document.querySelector("#sound-panel");
const waveCanvas = document.querySelector("#sound-wave");
const caption = document.querySelector("#caption");
const soundStatus = document.querySelector("#sound-status");

// 한 칸의 점 위치: 왼쪽 열 위→아래 1·2·3점, 오른쪽 열 4·5·6점 (점자 규정 제2항)
const ROW_NAMES = ["위", "가운데", "아래"];
const COLUMN_NAMES = ["왼쪽", "오른쪽"];
const ROW_PITCH = [880, 660, 440];   // 1·2·3행 → 높은·중간·낮은 음(Hz)
const COLUMN_PAN = [-0.7, 0.7];      // 왼쪽 열 → 왼쪽 스피커, 오른쪽 열 → 오른쪽 스피커
// 점 번호는 한자어로 읽힙니다. 레벨에 나오는 점 모양 19가지를 서버 TTS로 만들어 음성 인식으로 받아 적어 보니
// 한자어(사, 육 점)는 18/19, 고유어(넷, 여섯 점)는 16/19가 맞았습니다(고유어는 목록 중간의 '넷'·'셋'이 빠지기도 함).
const DOT_NUMBER_WORDS = ["일", "이", "삼", "사", "오", "육"];
const ROLE_LABELS = { 초성: "첫소리", 모음: "모음", 받침: "받침", 약자: "약자", 숫자: "숫자" };
const SHORT_LABELS = { 된소리표: "된", 수표: "수", 붙임표: "붙", 띄어쓰기: "" };
const VOICE = "F1";

const state = {
  levelIndex: 0,
  level: null,
  layout: null,                            // 칸마다 Canvas 위 사각형
  cursor: { cell: 0, column: 0, row: 0 },  // 키보드 손끝 위치
  pointer: null,                           // 마우스·손가락 손끝 위치(Canvas 좌표)
  usingKeyboard: false,
  touchedKey: null,                        // 지금 닿아 있는 점("칸:점번호") — 같은 점은 벗어났다 들어와야 다시 울림
  lastCell: null,
  lastTap: { time: 0, cell: -1 },          // 더블탭 판단용
  solved: false,
  revealed: 0,                             // 정답 뒤 켜진 점 개수
  revealTimer: null,
  flashCell: -1,                           // 힌트로 테두리를 잠깐 밝힐 칸
  flashTimer: null,
};

let audio = null;   // AudioContext 하나를 틱 소리와 서버 음성 재생에 같이 씁니다
const speech = { busy: false, pending: null, source: null, buffer: null, animation: 0, glowTimer: null, modelLoaded: false };

// ── 시작·레벨 ──────────────────────────────────────────────

// 오디오는 사용자의 클릭 안에서 만들어야 브라우저가 소리를 허용합니다.
function ensureAudio() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
}

function startReading() {
  ensureAudio();
  document.body.classList.add("reading");
  startScreen.hidden = true;
  readingScreen.hidden = false;
  loadLevel(0);
  strip.focus();
  checkModel().then(() => speak("읽기 모드를 시작합니다"));
}

function exitReading() {
  clearTimers();
  document.body.classList.remove("reading");
  readingScreen.hidden = true;
  startScreen.hidden = false;
  document.querySelector("#start-button").focus();
}

function loadLevel(index) {
  clearTimers();
  state.levelIndex = index;
  state.level = levels[index];
  state.cursor = { cell: 0, column: 0, row: 0 };
  state.pointer = null;
  state.touchedKey = null;
  state.lastCell = null;
  state.solved = false;
  state.revealed = 0;
  state.flashCell = -1;
  const count = state.level.cells.length;
  levelLabel.textContent = "문장 " + (index + 1) + " / " + levels.length;
  strip.setAttribute("aria-label", "점자 띠 " + count + "칸. 화살표로 점 위치를 옮기고 Space로 만지고, Enter로 칸의 점 번호를 듣습니다.");
  cellInfo.textContent = "문장 " + (index + 1) + " · " + count + "칸입니다. 왼쪽 첫 칸부터 오른쪽으로 쓸어 보세요.";
  buildChoices();
  buildCard();
  answerInput.value = "";
  setAnswerEnabled(true);
  answerPanel.hidden = false;
  levelEnd.hidden = true;
  finalPanel.hidden = true;
  layoutStrip();
  drawStrip();
}

function clearTimers() {
  clearInterval(state.revealTimer);
  clearTimeout(state.flashTimer);
}

// ── 점자 띠 배치와 그리기 ───────────────────────────────────

// 빈칸(띄어쓰기)까지를 한 단어로 묶습니다. 좁은 화면에서 단어 중간에 줄이 바뀌지 않게 하려는 것.
function splitWords(cells) {
  const words = [];
  let word = [];
  cells.forEach(function (cell, index) {
    word.push(index);
    if (cell.role === "띄어쓰기") {
      words.push(word);
      word = [];
    }
  });
  if (word.length) words.push(word);
  return words;
}

// 칸 크기(44~72px)를 정하고, 한 줄에 다 안 들어가면 단어 단위로 다음 줄로 넘깁니다.
function layoutStrip() {
  const cells = state.level.cells;
  const width = strip.clientWidth;
  const cellWidth = Math.max(44, Math.min(72, Math.floor(width / cells.length)));
  const perRow = Math.max(1, Math.floor(width / cellWidth));
  const rows = [[]];
  for (const word of splitWords(cells)) {
    let row = rows[rows.length - 1];
    if (row.length && row.length + word.length > perRow) rows.push(row = []);
    for (const index of word) {
      if (row.length >= perRow) rows.push(row = []);
      row.push(index);
    }
  }
  const cellHeight = Math.round(cellWidth * 1.4);
  const lineHeight = cellHeight + 26;   // 아래 26px는 정답 뒤 글자를 쓰는 자리
  const rects = [];
  rows.forEach(function (row, rowIndex) {
    // 한 줄이면 가운데, 여러 줄이면 글처럼 왼쪽부터(줄 첫 칸을 손끝으로 찾기 쉽게)
    const left = rows.length === 1 ? (width - row.length * cellWidth) / 2 : 0;
    row.forEach(function (cellIndex, position) {
      rects[cellIndex] = { x: left + position * cellWidth, y: 12 + rowIndex * lineHeight, w: cellWidth, h: cellHeight };
    });
  });
  const height = 12 + rows.length * lineHeight;
  const ratio = window.devicePixelRatio || 1;   // 고해상도 화면에서도 선명하게
  strip.style.height = height + "px";
  strip.width = Math.round(width * ratio);
  strip.height = Math.round(height * ratio);
  state.layout = { rects: rects, ratio: ratio, width: width, height: height };
}

function dotNumber(column, row) {
  return column * 3 + row + 1;   // (왼쪽, 위) → 1점, (오른쪽, 아래) → 6점
}

function dotCenter(rect, column, row) {
  return { x: rect.x + rect.w * (column === 0 ? 0.32 : 0.68), y: rect.y + rect.h * (0.22 + row * 0.28) };
}

function isRaised(cellIndex, column, row) {
  return state.level.cells[cellIndex].dots.includes(String(dotNumber(column, row)));
}

function drawStrip() {
  const { rects, ratio, width, height } = state.layout;
  const ctx = strip.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  let budget = state.revealed;   // 정답 뒤 켜진 점 개수만큼 앞 칸부터 차례로 켭니다
  state.level.cells.forEach(function (cell, index) {
    const rect = rects[index];
    drawCellBorder(ctx, rect, index === state.flashCell);
    if (!state.solved) return;   // 맞히기 전에는 점을 그리지 않습니다(칸 경계만)
    const fullyLit = budget >= cell.dots.length;
    drawDots(ctx, cell, rect, budget);
    budget -= cell.dots.length;
    if (fullyLit) drawLetter(ctx, cell, rect);
  });
  drawFingertip(ctx);
}

function drawCellBorder(ctx, rect, bright) {
  ctx.strokeStyle = bright ? "#f2f2f2" : "rgba(255, 255, 255, 0.11)";   // 평소엔 아주 흐리게
  ctx.lineWidth = bright ? 3 : 1;
  ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
}

function drawDots(ctx, cell, rect, budget) {
  let lit = 0;
  for (let column = 0; column < 2; column++) {
    for (let row = 0; row < 3; row++) {
      const center = dotCenter(rect, column, row);
      ctx.beginPath();
      ctx.arc(center.x, center.y, rect.w * 0.09, 0, Math.PI * 2);
      if (cell.dots.includes(String(dotNumber(column, row)))) {
        lit += 1;
        if (lit > budget) continue;   // 아직 켜질 차례가 아님
        ctx.fillStyle = "#f4f4f4";
        ctx.fill();
      } else if (budget >= cell.dots.length) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";   // 평평한 자리는 흐린 고리
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

function drawLetter(ctx, cell, rect) {
  const label = cell.role in SHORT_LABELS ? SHORT_LABELS[cell.role] : cell.letter;
  ctx.fillStyle = "#c9c9c9";
  ctx.font = "15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h + 18);
}

// 손끝 커서: 마우스·손가락 위치, 또는 키보드로 고른 점 위치에 흐린 고리를 그립니다(점의 볼록 여부는 드러내지 않음).
function drawFingertip(ctx) {
  let point = state.pointer;
  const rect = state.layout.rects[state.cursor.cell];
  if (!point && state.usingKeyboard && rect) point = dotCenter(rect, state.cursor.column, state.cursor.row);
  if (!point) return;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ── 손끝 입력(포인터·키보드) ─────────────────────────────────

function toCanvasPoint(event) {
  const box = strip.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

// 좌표가 어느 칸의 어느 점 위치 위인지 찾습니다. 칸 안이지만 점 위치가 아니면 column/row가 null.
function findDot(point) {
  const rects = state.layout.rects;
  for (let cell = 0; cell < rects.length; cell++) {
    const rect = rects[cell];
    if (point.x < rect.x || point.x > rect.x + rect.w || point.y < rect.y || point.y > rect.y + rect.h) continue;
    for (let column = 0; column < 2; column++) {
      for (let row = 0; row < 3; row++) {
        const center = dotCenter(rect, column, row);
        if (Math.hypot(point.x - center.x, point.y - center.y) <= rect.w * 0.17) return { cell: cell, column: column, row: row };
      }
    }
    return { cell: cell, column: null, row: null };
  }
  return null;
}

// 점 위치에 닿았을 때: 볼록하면 틱(+진동), 평평하면 아주 약한 소리.
function touchDot(cellIndex, column, row, byFinger) {
  const raised = isRaised(cellIndex, column, row);
  playTick(row, column, raised);
  if (raised && byFinger && navigator.vibrate) navigator.vibrate(8);
}

// 포인터가 움직일 때마다: 칸이 바뀌면 위치 안내, 새 점에 들어가면 만지기.
function handlePointer(event) {
  state.usingKeyboard = false;
  state.pointer = toCanvasPoint(event);
  const hit = findDot(state.pointer);
  if (hit && hit.cell !== state.lastCell) enterCell(hit.cell, false);
  const key = hit && hit.column !== null ? hit.cell + ":" + dotNumber(hit.column, hit.row) : null;
  if (key && key !== state.touchedKey) touchDot(hit.cell, hit.column, hit.row, event.pointerType !== "mouse");
  state.touchedKey = key;
  drawStrip();
  return hit;
}

// 같은 칸을 0.4초 안에 두 번 누르면 칸 힌트.
function checkDoubleTap(hit) {
  const now = performance.now();
  if (hit && hit.cell === state.lastTap.cell && now - state.lastTap.time < 400) {
    state.lastTap = { time: 0, cell: -1 };
    requestCellHint(hit.cell);
    return;
  }
  state.lastTap = { time: now, cell: hit ? hit.cell : -1 };
}

// 칸에 들어왔을 때 위치를 글로 알려 줍니다(aria-live). 빈칸이면 단어가 끝났다는 안내만(단어를 읽어 주지 않음).
function enterCell(cellIndex, withPosition) {
  state.lastCell = cellIndex;
  state.cursor.cell = cellIndex;
  const cell = state.level.cells[cellIndex];
  const where = (cellIndex + 1) + "번째 칸";
  if (cell.role === "띄어쓰기") {
    cellInfo.textContent = where + " · 빈칸: 단어 하나가 끝났습니다. 알 것 같으면 아래에서 답을 골라 보세요.";
  } else if (withPosition) {
    cellInfo.textContent = where + ", " + COLUMN_NAMES[state.cursor.column] + " " + ROW_NAMES[state.cursor.row];
  } else {
    cellInfo.textContent = where;
  }
}

// 화살표: ←→는 열 단위(칸마다 2열), ↑↓는 줄. 도착한 점을 바로 만집니다.
function moveCursor(columnStep, rowStep) {
  const cursor = state.cursor;
  const lastColumn = state.level.cells.length * 2 - 1;
  const column = Math.min(lastColumn, Math.max(0, cursor.cell * 2 + cursor.column + columnStep));
  const row = Math.min(2, Math.max(0, cursor.row + rowStep));
  const moved = column !== cursor.cell * 2 + cursor.column || row !== cursor.row;
  cursor.cell = Math.floor(column / 2);
  cursor.column = column % 2;
  cursor.row = row;
  state.usingKeyboard = true;
  state.pointer = null;
  enterCell(cursor.cell, true);
  if (moved) touchAtCursor();
  drawStrip();
}

function touchAtCursor() {
  const cursor = state.cursor;
  state.touchedKey = cursor.cell + ":" + dotNumber(cursor.column, cursor.row);
  touchDot(cursor.cell, cursor.column, cursor.row, false);
}

function handleStripKey(event) {
  const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (moves[event.key]) {
    event.preventDefault();
    moveCursor(moves[event.key][0], moves[event.key][1]);
  } else if (event.key === " ") {
    event.preventDefault();
    state.usingKeyboard = true;
    touchAtCursor();
    drawStrip();
  } else if (event.key === "Enter") {
    event.preventDefault();
    requestCellHint(state.cursor.cell);
  }
}

// ── 소리: Web Audio 틱 ──────────────────────────────────────

function playTick(row, column, raised) {
  if (!audio) return;
  const now = audio.currentTime;
  const tone = audio.createOscillator();
  const volume = audio.createGain();
  tone.type = raised ? "triangle" : "sine";
  tone.frequency.value = raised ? ROW_PITCH[row] : 200;
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(raised ? 0.3 : 0.015, now + 0.005);   // 평평한 자리는 아주 약하게
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  tone.connect(volume);
  let output = volume;
  if (audio.createStereoPanner) {
    const pan = audio.createStereoPanner();
    pan.pan.value = COLUMN_PAN[column];
    volume.connect(pan);
    output = pan;
  }
  output.connect(audio.destination);
  tone.start(now);
  tone.stop(now + 0.08);
}

// ── 소리: 서버 TTS ─────────────────────────────────────────

// "46" → "사, 육 점"
function dotsToSpeech(dots) {
  return dots.split("").map(function (dot) { return DOT_NUMBER_WORDS[Number(dot) - 1]; }).join(", ") + " 점";
}

// 칸 힌트: 점 번호만 읽어 줍니다. 빈칸이면 단어를 미리 말하지 않고 답하기로 안내합니다.
function requestCellHint(cellIndex) {
  const cell = state.level.cells[cellIndex];
  enterCell(cellIndex, state.usingKeyboard);
  if (cell.role === "띄어쓰기") return;
  speak(dotsToSpeech(cell.dots));
}

async function checkModel() {
  try {
    const status = await (await fetch("/api/tts/status")).json();
    speech.modelLoaded = status.loaded;
    if (!status.model_files) soundStatus.textContent = "모델 파일이 없습니다. 틱 소리와 자막으로 계속할 수 있습니다.";
  } catch (error) {
    soundStatus.textContent = "서버 상태를 확인하지 못했습니다. " + error.message;
  }
}

// 서버 음성 요청. 요청 중이면 다음 요청 1개만 기다리게 하고, 더 오면 가장 최근 것으로 바꿉니다.
// afterStart: 재생이 시작된 뒤(또는 음성을 못 받았을 때) 이어서 할 일(예: 정답 점 켜기).
function speak(text, afterStart) {
  if (!speech.busy) {
    runSpeech(text, afterStart);
    return;
  }
  if (speech.pending && speech.pending.afterStart) speech.pending.afterStart();   // 밀려난 요청의 후속 동작은 바로 실행
  speech.pending = { text: text, afterStart: afterStart };
  soundStatus.textContent = "Processing… (다음 요청 1개 대기 중)";
}

async function runSpeech(text, afterStart) {
  speech.busy = true;
  caption.textContent = "“" + text + "”";   // 들리는 말을 자막으로도
  soundStatus.textContent = speech.modelLoaded
    ? "Processing… 서버가 음성을 만들고 있습니다."
    : "Processing… 모델 준비 중입니다. 처음 한 번은 모델을 읽느라 몇 초 걸립니다.";
  const started = performance.now();
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, voice: VOICE, length_scale: 1.0 })
    });
    if (!response.ok) throw new Error(await readError(response));
    const blob = await response.blob();               // 서버가 만든 WAV
    const roundTrip = performance.now() - started;
    const buffer = await audio.decodeAudioData(await blob.arrayBuffer());
    speech.modelLoaded = true;
    showMetrics(response, roundTrip, buffer, blob);
    playBuffer(buffer);
    soundStatus.textContent = "완료 · 서버가 만든 WAV를 재생합니다.";
  } catch (error) {
    soundStatus.textContent = "음성을 받지 못했습니다. " + error.message + " 자막으로 계속할 수 있습니다.";
  } finally {
    speech.busy = false;
    if (afterStart) afterStart();
    const next = speech.pending;
    speech.pending = null;
    if (next) runSpeech(next.text, next.afterStart);
  }
}

async function readError(response) {
  if ((response.headers.get("Content-Type") || "").includes("application/json")) {
    const data = await response.json();
    return data.error || "HTTP " + response.status;
  }
  return "HTTP " + response.status;
}

// 강의 필수 표시(생성 시간·길이·크기)에 왕복 시간을 더해 매 요청 보여 줍니다.
function showMetrics(response, roundTrip, buffer, blob) {
  document.querySelector("#metric-server").textContent = (response.headers.get("X-Processing-Ms") || "측정 불가") + " ms";
  document.querySelector("#metric-round").textContent = roundTrip.toFixed(0) + " ms";
  document.querySelector("#metric-length").textContent = buffer.duration.toFixed(2) + "초";
  document.querySelector("#metric-size").textContent = (blob.size / 1024).toFixed(1) + " KiB";
}

function playBuffer(buffer) {
  if (speech.source) {
    try { speech.source.stop(); } catch (error) { /* 이미 끝난 소리 */ }
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.connect(audio.destination);
  source.start();
  speech.source = source;
  speech.buffer = buffer;
  animateWave(buffer);
}

// 소리가 나는 동안 패널이 빛나고, 재생 위치를 따라 파형을 밝게 칠합니다.
// 스피커가 없는 PC에서도 진행하도록 벽시계(performance.now)로 계산합니다.
function animateWave(buffer) {
  cancelAnimationFrame(speech.animation);
  clearTimeout(speech.glowTimer);
  soundPanel.classList.add("glowing");
  speech.glowTimer = setTimeout(function () { soundPanel.classList.remove("glowing"); }, buffer.duration * 1000);
  if (reduceMotion) {   // 움직임 줄이기: 파형을 한 번에 그림
    drawWave(buffer, 1);
    return;
  }
  const started = performance.now();
  function frame() {
    const progress = Math.min(1, (performance.now() - started) / 1000 / buffer.duration);
    drawWave(buffer, progress);
    if (progress < 1) speech.animation = requestAnimationFrame(frame);
  }
  frame();
}

function drawWave(buffer, progress) {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(waveCanvas.clientWidth * ratio));
  const height = Math.round(110 * ratio);
  waveCanvas.width = width;
  waveCanvas.height = height;
  const ctx = waveCanvas.getContext("2d");
  const samples = buffer.getChannelData(0);
  const middle = height / 2;
  const step = Math.max(1, Math.ceil(samples.length / width));
  const playedX = width * progress;
  ctx.fillStyle = "#0b0e12";
  ctx.fillRect(0, 0, width, height);
  for (let x = 0; x < width; x++) {
    let minimum = 1;
    let maximum = -1;
    const end = Math.min(samples.length, (x + 1) * step);
    if (end <= x * step) break;
    for (let i = x * step; i < end; i++) {
      minimum = Math.min(minimum, samples[i]);
      maximum = Math.max(maximum, samples[i]);
    }
    ctx.fillStyle = x <= playedX ? "#cfe6ff" : "#3a4857";   // 재생한 부분은 밝게
    ctx.fillRect(x, middle - maximum * middle * 0.9, 1, Math.max(1, (maximum - minimum) * middle * 0.9));
  }
}

// ── 답하기 ────────────────────────────────────────────────

function shuffled(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildChoices() {
  choicesBox.replaceChildren();
  for (const choice of shuffled(state.level.choices)) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", function () { checkAnswer(choice); });
    choicesBox.append(button);
  }
}

function setAnswerEnabled(enabled) {
  answerPanel.querySelectorAll("button, input").forEach(function (element) { element.disabled = !enabled; });
}

async function checkAnswer(guess) {
  if (state.solved) return;
  const answer = guess.trim().replace(/\s+/g, " ");
  if (!answer) {
    cellInfo.textContent = "보기를 고르거나 답을 입력해 주세요.";
    return;
  }
  if (answer === state.level.text) {
    solveLevel();
    return;
  }
  try {
    const guessCells = await fetchCells(answer);   // 직접 입력한 답도 서버가 점자로 바꿉니다
    const index = firstDifferentCell(state.level.cells, guessCells);
    if (index === -1) solveLevel();                  // 글자는 달라도 점자 모양이 같으면 손끝으로는 같은 답
    else showWrongHint(index);
  } catch (error) {
    cellInfo.textContent = error.message;
  }
}

async function fetchCells(text) {
  const response = await fetch("/api/braille", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text })
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()).cells;
}

// 정답 칸과 답의 칸을 앞에서부터 비교해 처음으로 모양이 다른 칸 번호를 찾습니다(모두 같으면 -1).
function firstDifferentCell(answerCells, guessCells) {
  const length = Math.max(answerCells.length, guessCells.length);
  for (let i = 0; i < length; i++) {
    const a = answerCells[i];
    const g = guessCells[i];
    if (!a || !g || a.dots !== g.dots) return Math.min(i, answerCells.length - 1);
  }
  return -1;
}

// 1 → "첫", 2 → "두", 3 → "세", 11 → "열한", 20 → "스무", 21 → "스물한"
function koreanOrdinal(n) {
  if (n === 1) return "첫";
  if (n === 20) return "스무";
  if (n >= 60) return String(n);
  const tens = ["", "열", "스물", "서른", "마흔", "쉰"][Math.floor(n / 10)];
  const ones = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"][n % 10];
  return tens + ones;
}

// 틀렸을 때: 벌 없이, 처음 다른 칸을 음성·자막으로 알려 주고 그 칸 테두리만 잠깐 밝힙니다.
function showWrongHint(index) {
  speak(koreanOrdinal(index + 1) + " 번째 칸을 다시 만져 보세요");
  state.cursor = { cell: index, column: 0, row: 0 };   // 키보드 손끝도 그 칸으로
  enterCell(index, state.usingKeyboard);
  state.flashCell = index;
  clearTimeout(state.flashTimer);
  state.flashTimer = setTimeout(function () {
    state.flashCell = -1;
    drawStrip();
  }, 1600);
  drawStrip();
}

// 맞혔을 때: 문장을 서버 음성으로 읽고, 재생이 시작되면 점을 하나씩 켭니다.
function solveLevel() {
  state.solved = true;
  setAnswerEnabled(false);
  cellInfo.textContent = "맞았습니다. 점이 하나씩 켜집니다.";
  speak(state.level.text, startReveal);
}

function startReveal() {
  const total = state.level.cells.reduce(function (sum, cell) { return sum + cell.dots.length; }, 0);
  if (reduceMotion) {   // 움직임 줄이기 설정이면 한 번에 공개
    state.revealed = total;
    drawStrip();
    showLevelEnd();
    return;
  }
  clearInterval(state.revealTimer);
  state.revealTimer = setInterval(function () {
    state.revealed += 1;
    drawStrip();
    if (state.revealed >= total) {
      clearInterval(state.revealTimer);
      showLevelEnd();
    }
  }, 60);
}

function showLevelEnd() {
  const last = state.levelIndex === levels.length - 1;
  answerPanel.hidden = true;
  levelEnd.hidden = false;
  document.querySelector("#end-braille").textContent = state.level.unicode;
  document.querySelector("#end-text").textContent = "= " + state.level.text;
  document.querySelector("#end-rule").textContent = "이번 규칙: " + state.level.rule;
  nextButton.hidden = last;
  finalPanel.hidden = !last;
  (last ? restartButton : nextButton).focus();
}

// ── 점자 카드(눈으로 보는 학습표) ───────────────────────────

// 6점 그림 하나(SVG). 볼록한 점은 채우고, 평평한 자리는 흐린 고리.
function dotFigure(dots) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 30 42");
  svg.setAttribute("class", "dot-figure");
  svg.setAttribute("aria-hidden", "true");
  for (let column = 0; column < 2; column++) {
    for (let row = 0; row < 3; row++) {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", column === 0 ? 9 : 21);
      circle.setAttribute("cy", 8 + row * 13);
      circle.setAttribute("r", 4.5);
      circle.setAttribute("class", dots.includes(String(dotNumber(column, row))) ? "dot-on" : "dot-off");
      svg.append(circle);
    }
  }
  return svg;
}

function dotsLabel(dots) {
  return dots.split("").join("·") + "점";
}

function buildCard() {
  cardList.replaceChildren();
  for (const entry of state.level.card) {
    const item = document.createElement("li");
    const figures = document.createElement("div");
    figures.className = "figures";
    entry.cells.forEach(function (cell) { figures.append(dotFigure(cell.dots)); });
    const name = document.createElement("strong");
    name.textContent = entry.role in ROLE_LABELS ? entry.letter + " · " + ROLE_LABELS[entry.role] : entry.letter;
    const numbers = document.createElement("span");
    numbers.textContent = entry.cells.map(function (cell) { return dotsLabel(cell.dots); }).join(" + ");
    item.append(figures, name, numbers);
    cardList.append(item);
  }
}

// ── 이벤트 연결 ────────────────────────────────────────────

document.querySelector("#start-button").addEventListener("click", startReading);
document.querySelector("#exit-button").addEventListener("click", exitReading);
document.querySelector("#hint-button").addEventListener("click", function () { requestCellHint(state.cursor.cell); });
document.querySelector("#card-button").addEventListener("click", function () { cardDialog.showModal(); });
document.querySelector("#card-close").addEventListener("click", function () { cardDialog.close(); });
nextButton.addEventListener("click", function () {
  loadLevel(state.levelIndex + 1);
  strip.focus();
});
restartButton.addEventListener("click", exitReading);
answerForm.addEventListener("submit", function (event) {
  event.preventDefault();
  checkAnswer(answerInput.value);
});

strip.addEventListener("keydown", handleStripKey);
strip.addEventListener("focus", drawStrip);
strip.addEventListener("pointerdown", function (event) {
  strip.setPointerCapture(event.pointerId);   // 손가락이 띠 밖으로 조금 나가도 계속 따라가게
  checkDoubleTap(handlePointer(event));
});
strip.addEventListener("pointermove", handlePointer);
strip.addEventListener("pointerup", function (event) {
  if (event.pointerType === "mouse") return;
  state.touchedKey = null;   // 손가락을 떼었다 다시 대면 같은 점도 다시 울림
  state.pointer = null;
  drawStrip();
});
strip.addEventListener("pointerleave", function () {
  state.pointer = null;
  state.touchedKey = null;
  drawStrip();
});
window.addEventListener("resize", function () {
  if (state.level && !readingScreen.hidden) {
    layoutStrip();
    drawStrip();
  }
  if (speech.buffer) drawWave(speech.buffer, 1);
});
