const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const STAMPS = [
  { id: 'store',     label: '아침',  name: 'GS25',   color: '#00aeef', x: W * 0.5,  y: H * 0.24 },
  { id: 'cafeteria', label: '점심',  name: '학생식당', color: '#d4a574', x: W * 0.25, y: H * 0.62 },
  { id: 'gym',       label: '저녁',  name: '트러스트짐', color: '#ff6b35', x: W * 0.75, y: H * 0.62 },
];
const RADIUS = 58;
const BEST_KEY = 'stampRushBest';

const hud = {
  round: document.getElementById('hud-round'),
  score: document.getElementById('hud-score'),
  lives: document.getElementById('hud-lives'),
  best: document.getElementById('hud-best'),
};
const overlayStart = document.getElementById('overlay-start');
const overlayOver = document.getElementById('overlay-over');
const finalScore = document.getElementById('final-score');
const finalNote = document.getElementById('final-note');
const statusEl = document.getElementById('status');

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  phase: 'idle',        // idle | showing | input | between | over
  round: 1,
  score: 0,
  lives: 3,
  best: Number(localStorage.getItem(BEST_KEY) || 0),
  sequence: [],
  inputIndex: 0,
  lit: null,            // 현재 반짝이는 stamp id
  pressed: null,        // 방금 눌린 stamp id
  inputDeadline: 0,
  inputLimit: 0,
};

function inputLimitFor(round) {
  return Math.max(2500, 6000 - (round - 1) * 400);
}

function sequenceLength(round) {
  return 2 + round;
}

function randomSequence(length) {
  const seq = [];
  for (let i = 0; i < length; i += 1) {
    seq.push(STAMPS[Math.floor(Math.random() * STAMPS.length)].id);
  }
  return seq;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setStatus(text) {
  statusEl.textContent = text;
}

function renderHud() {
  hud.round.textContent = state.round;
  hud.score.textContent = state.score;
  hud.lives.textContent = '♥'.repeat(state.lives) + '♡'.repeat(3 - state.lives);
  hud.best.textContent = state.best;
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // 배경 그리드
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // 동선 연결선
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(STAMPS[0].x, STAMPS[0].y);
  ctx.lineTo(STAMPS[1].x, STAMPS[1].y);
  ctx.lineTo(STAMPS[2].x, STAMPS[2].y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 스탬프
  STAMPS.forEach((s) => {
    const active = state.lit === s.id || state.pressed === s.id;
    ctx.beginPath();
    ctx.arc(s.x, s.y, RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = active ? s.color : 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.lineWidth = active ? 6 : 3;
    ctx.strokeStyle = s.color;
    ctx.stroke();

    if (active && !reduceMotion) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, RADIUS + 10, 0, Math.PI * 2);
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = active ? '#0f2027' : '#e8eef2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 22px "Noto Sans KR", sans-serif';
    ctx.fillText(s.label, s.x, s.y - 10);
    ctx.font = '400 13px "Noto Sans KR", sans-serif';
    ctx.fillText(s.name, s.x, s.y + 14);
  });

  // 입력 타이머 바
  if (state.phase === 'input') {
    const remain = Math.max(0, state.inputDeadline - performance.now());
    const ratio = remain / state.inputLimit;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(30, H - 40, W - 60, 12);
    ctx.fillStyle = ratio < 0.3 ? '#ff4d4d' : '#ffd166';
    ctx.fillRect(30, H - 40, (W - 60) * ratio, 12);
  }

  // 진행 점
  if (state.phase === 'input' || state.phase === 'showing') {
    const dotGap = 18;
    const startX = W / 2 - ((state.sequence.length - 1) * dotGap) / 2;
    state.sequence.forEach((id, i) => {
      const done = state.phase === 'input' && i < state.inputIndex;
      ctx.beginPath();
      ctx.arc(startX + i * dotGap, H - 70, 5, 0, Math.PI * 2);
      ctx.fillStyle = done ? '#ffd166' : 'rgba(255,255,255,0.25)';
      ctx.fill();
    });
  }
}

function loop() {
  if (state.phase === 'input' && performance.now() > state.inputDeadline) {
    failRound('시간 초과!');
  }
  draw();
  requestAnimationFrame(loop);
}

async function playRound() {
  state.phase = 'showing';
  state.sequence = randomSequence(sequenceLength(state.round));
  state.inputIndex = 0;
  state.pressed = null;
  renderHud();
  setStatus(`라운드 ${state.round} · 순서를 기억하세요`);

  await sleep(600);
  const onMs = Math.max(280, 600 - state.round * 25);
  for (const id of state.sequence) {
    state.lit = id;
    await sleep(onMs);
    state.lit = null;
    await sleep(180);
  }

  state.phase = 'input';
  state.inputLimit = inputLimitFor(state.round);
  state.inputDeadline = performance.now() + state.inputLimit;
  setStatus('같은 순서로 누르세요!');
}

function failRound(reason) {
  state.phase = 'between';
  state.lives -= 1;
  renderHud();
  setStatus(`${reason} 목숨 −1`);
  if (state.lives <= 0) {
    endGame();
    return;
  }
  setTimeout(playRound, 1100);
}

function successRound() {
  state.phase = 'between';
  const remain = Math.max(0, state.inputDeadline - performance.now());
  const bonus = Math.round((remain / state.inputLimit) * 20);
  state.score += state.sequence.length * 10 + bonus;
  state.round += 1;
  renderHud();
  setStatus(`성공! +${state.sequence.length * 10} (보너스 +${bonus})`);
  setTimeout(playRound, 900);
}

function endGame() {
  state.phase = 'over';
  const isNewBest = state.score > state.best;
  if (isNewBest) {
    state.best = state.score;
    localStorage.setItem(BEST_KEY, String(state.best));
  }
  renderHud();
  finalScore.textContent = state.score;
  finalNote.textContent = isNewBest ? '최고 기록 갱신!' : `최고 기록 ${state.best}`;
  overlayOver.hidden = false;
  setStatus('');
}

function startGame() {
  state.round = 1;
  state.score = 0;
  state.lives = 3;
  state.lit = null;
  overlayStart.hidden = true;
  overlayOver.hidden = true;
  renderHud();
  playRound();
}

function stampAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (W / rect.width);
  const y = (clientY - rect.top) * (H / rect.height);
  return STAMPS.find((s) => Math.hypot(s.x - x, s.y - y) <= RADIUS + 6) || null;
}

function handlePress(clientX, clientY) {
  if (state.phase !== 'input') return;
  const stamp = stampAt(clientX, clientY);
  if (!stamp) return;

  state.pressed = stamp.id;
  setTimeout(() => { if (state.pressed === stamp.id) state.pressed = null; }, 160);

  if (stamp.id !== state.sequence[state.inputIndex]) {
    failRound('순서가 틀렸어요.');
    return;
  }
  state.inputIndex += 1;
  if (state.inputIndex >= state.sequence.length) {
    successRound();
  }
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  handlePress(e.clientX, e.clientY);
});

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);

renderHud();
loop();
