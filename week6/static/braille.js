// 손끝 한 줄: 검은 화면을 문지르면 짚은 곳의 점자 점만 드러나고,
// 한 글자의 점이 다 드러나면 서버 TTS(/api/tts)가 그 글자를 읽어 줍니다.
const ITEMS = JSON.parse(document.querySelector("#items").textContent);
const board = document.querySelector("#board");
const ctx = board.getContext("2d");
const W = board.width, H = board.height;
const DOT_GAP = 26;      // 한 칸 안에서 점 사이 거리
const CELL_GAP = 60;     // 칸과 칸 사이 거리 (화장실 7칸도 표지판 안에 들어가게)
const DOT_R = 7;         // 드러난 점의 반지름
const FINGER_R = 24;     // 손끝 범위: 이 안의 점이 드러남

let audio = null;        // AudioContext (시작 버튼을 눌렀을 때 만듦)
let index = 0;           // 지금 읽는 물건 번호
let dots = [];           // 지금 물건의 볼록한 점들 {x, y, row, syllable, shown}
let spoken = new Set();  // 이미 읽어 준 글자 번호
let finger = null;       // 손끝 위치(누르고 있을 때만)
let queue = Promise.resolve();   // 서버 음성은 한 번에 하나씩 차례대로

// ---- 점자 칸 → 화면 위 점 위치 ----
function layoutDots(item) {
  const width = (item.cells.length - 1) * CELL_GAP + DOT_GAP;
  const left = (W - width) / 2, top = H * 0.62;
  const list = [];
  item.cells.forEach(function (cell, i) {
    for (const ch of cell.dots) {
      const n = Number(ch);                     // 점 번호 1~6: 왼쪽 열 1·2·3, 오른쪽 열 4·5·6
      const col = n <= 3 ? 0 : 1, row = (n - 1) % 3;
      list.push({ x: left + i * CELL_GAP + col * DOT_GAP, y: top + row * DOT_GAP, row, syllable: cell.syllable, shown: false });
    }
  });
  return list;
}

// ---- 그리기: 희미한 실루엣 + 드러난 점 + 손끝 ----
function drawSilhouette(shape) {
  ctx.fillStyle = "#151515";
  ctx.strokeStyle = "#1f1f1f";
  ctx.lineWidth = 3;
  if (shape === "elevator") {
    roundRect(W / 2 - 150, 30, 300, 360, 18); ctx.fill();
    ctx.fillStyle = "#1c1c1c"; ctx.beginPath(); ctx.arc(W / 2, 150, 70, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (shape === "can") {
    ctx.beginPath(); ctx.ellipse(W / 2, 210, 230, 180, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1c1c1c"; roundRect(W / 2 - 60, 90, 120, 70, 30); ctx.fill();
  } else {
    roundRect(W / 2 - 230, 30, 460, 360, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1c1c1c"; ctx.beginPath(); ctx.arc(W / 2, 95, 32, 0, Math.PI * 2); ctx.fill();
    roundRect(W / 2 - 38, 135, 76, 95, 16); ctx.fill();
  }
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function draw() {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  drawSilhouette(ITEMS[index].shape);
  ctx.fillStyle = "#f5f5f5";
  for (const d of dots) if (d.shown) { ctx.beginPath(); ctx.arc(d.x, d.y, DOT_R, 0, Math.PI * 2); ctx.fill(); }
  if (finger) {
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(finger.x, finger.y, FINGER_R, 0, Math.PI * 2); ctx.stroke();
  }
}

// ---- 손끝: 누른 채 움직이면 범위 안의 점이 드러남 ----
function toBoard(event) {
  const rect = board.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
}
function touch(point) {
  finger = point;
  for (const d of dots) {
    if (d.shown || Math.hypot(d.x - point.x, d.y - point.y) > FINGER_R) continue;
    d.shown = true;
    tick(d.row);
    checkSyllable(d.syllable);
  }
  const shown = dots.filter(function (d) { return d.shown; }).length;
  document.querySelector("#progress").textContent = "점 " + shown + " / " + dots.length;
  draw();
}
board.addEventListener("pointerdown", function (e) { board.setPointerCapture(e.pointerId); touch(toBoard(e)); });
board.addEventListener("pointermove", function (e) { if (e.buttons || e.pointerType === "touch") touch(toBoard(e)); });
board.addEventListener("pointerup", function () { finger = null; draw(); });
board.addEventListener("pointerleave", function () { finger = null; draw(); });

// 점 하나가 드러날 때 짧은 소리(위·가운데·아래 줄 = 높은·중간·낮은 음) — 브라우저가 바로 냄
function tick(row) {
  if (navigator.vibrate) navigator.vibrate(8);
  if (!audio) return;
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.frequency.value = [880, 660, 440][row];
  gain.gain.setValueAtTime(0.15, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.06);
  osc.connect(gain).connect(audio.destination);
  osc.start(); osc.stop(audio.currentTime + 0.07);
}

// ---- 한 글자의 점이 다 드러나면 그 글자, 단어가 다 드러나면 단어 전체를 읽음 ----
function checkSyllable(syllable) {
  const item = ITEMS[index];
  const mine = dots.filter(function (d) { return d.syllable === syllable; });
  if (spoken.has(syllable) || !mine.every(function (d) { return d.shown; })) return;
  spoken.add(syllable);
  say(item.syllables[syllable]);
  if (dots.every(function (d) { return d.shown; })) {
    say(item.text).then(function () { document.querySelector("#next").hidden = false; document.querySelector("#next").focus(); });
  }
}

// ---- 서버 TTS: POST /api/tts → WAV → 재생 + 파형 + 생성 시간·길이·크기 ----
function say(text) {
  queue = queue.then(function () { return speakNow(text); }).catch(function () {});
  return queue;
}
async function speakNow(text) {
  const caption = document.querySelector("#caption");
  caption.textContent = "음성 만드는 중… “" + text + "”";
  const response = await fetch("/api/tts", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text, voice: "F1" })
  });
  if (!response.ok) {
    const error = await response.json().catch(function () { return {}; });
    caption.textContent = "음성을 만들지 못했습니다. " + (error.error || "HTTP " + response.status);
    return;
  }
  const blob = await response.blob();
  const buffer = await audio.decodeAudioData(await blob.arrayBuffer());
  document.querySelector("#m-time").textContent = "생성 " + response.headers.get("X-Processing-Ms") + " ms";
  document.querySelector("#m-dur").textContent = "길이 " + buffer.duration.toFixed(2) + "초";
  document.querySelector("#m-size").textContent = "크기 " + (blob.size / 1024).toFixed(1) + " KiB";
  caption.textContent = "“" + text + "”";
  drawWave(buffer);
  await play(buffer);
}
function play(buffer) {
  return new Promise(function (resolve) {
    const source = audio.createBufferSource();
    source.buffer = buffer; source.connect(audio.destination);
    source.onended = resolve; source.start();
  });
}
function drawWave(buffer) {
  const wave = document.querySelector("#wave"), w = wave.width, h = wave.height, c = wave.getContext("2d");
  const data = buffer.getChannelData(0), step = Math.max(1, Math.floor(data.length / w));
  c.fillStyle = "#06080b"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "#8fc3ff"; c.beginPath();
  for (let x = 0; x < w; x++) {
    let lo = 1, hi = -1;
    for (let i = x * step; i < Math.min(data.length, (x + 1) * step); i++) { lo = Math.min(lo, data[i]); hi = Math.max(hi, data[i]); }
    c.moveTo(x, h / 2 - hi * h / 2); c.lineTo(x, h / 2 - lo * h / 2);
  }
  c.stroke();
}

// ---- 진행: 시작 → 물건 3개 → 끝 ----
function startItem(i) {
  index = i;
  dots = layoutDots(ITEMS[i]);
  spoken = new Set();
  document.querySelector("#next").hidden = true;
  document.querySelector("#place").textContent = (i + 1) + " / " + ITEMS.length + " · " + ITEMS[i].place;
  document.querySelector("#progress").textContent = "점 0 / " + dots.length;
  draw();
  say(ITEMS[i].place);
}
document.querySelector("#begin").addEventListener("click", function () {
  audio = new (window.AudioContext || window.webkitAudioContext)();   // 소리는 사용자가 누른 뒤에만 시작할 수 있음
  document.querySelector("#start").hidden = true;
  startItem(0);
});
document.querySelector("#next").addEventListener("click", function () {
  if (index + 1 < ITEMS.length) startItem(index + 1);
  else document.querySelector("#finish").hidden = false;
});
document.querySelector("#again").addEventListener("click", function () {
  document.querySelector("#finish").hidden = true;
  startItem(0);
});
draw();
