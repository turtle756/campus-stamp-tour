/* ==========================================================================
   1. 설정·표 — 여기 숫자만 바꿔도 게임이 바뀐다
   ========================================================================== */
const W = 360;
const H = 600;
const HUD_H = 70;           // 위쪽 HUD 띠. 이 아래가 운동장
const DAY = 120;            // 120초 = 하루. 지나면 밤 — 보스를 다 잡아야 끝난다
const MEAL_PRICE = 5500;    // 학생식당 한 끼 (결과 화면 "N끼 분량")
const MAX_ENEMIES = 60;
const BULLET_SPEED = 420;
const JOY_DEAD = 8;
const JOY_MAX = 40;
const BEST_KEY = 'campusSurvivorBest';
const MUTE_KEY = 'campusSurvivorMuted';

// spawnFrom→spawnTo: 시간대 안에서 선형 보간. hpBonusAt: 그 시각부터 hpBonus 적용(저녁 초반 80초 벽 완화). 마지막 행 = 밤(장소 없음, 처치금 30%)
const PHASES = [
  { name: '아침', from: 0,   to: 40,       color: '#00aeef', bg: '#16323d', spawnFrom: 0.8,  spawnTo: 0.6,  enemies: ['delivery'],                   hpBonus: 0, bonus: 3000 },
  { name: '점심', from: 40,  to: 80,       color: '#d4a574', bg: '#2b2a24', spawnFrom: 0.75, spawnTo: 0.55, enemies: ['delivery', 'dining'],         hpBonus: 0, bonus: 4500 },
  { name: '저녁', from: 80,  to: 120,      color: '#ff6b35', bg: '#1a1420', spawnFrom: 0.55, spawnTo: 0.40, enemies: ['delivery', 'dining', 'taxi'], hpBonus: 1, hpBonusAt: 95, bonus: 8000 },
  { name: '밤',   from: 120, to: Infinity, color: '#b39ddb', bg: '#0b0a14', spawnFrom: 0.7,  spawnTo: 0.7,  enemies: ['delivery', 'dining', 'taxi'], hpBonus: 1, bonus: 0 },
];
const NIGHT_WON = 0.3;

const ENEMY_TYPES = {
  delivery: { name: '배달', shape: 'triangle', color: '#3ddc84', r: 11, hp: 1, speed: 85,  won: 3000,  loseText: '배달에 넘어갔다' },
  dining:   { name: '외식', shape: 'square',   color: '#e63946', r: 13, hp: 3, speed: 50,  won: 10000, loseText: '결국 외식했다' },
  taxi:     { name: '택시', shape: 'rect',     color: '#ffd166', r: 12, hp: 2, speed: 120, won: 8000,  loseText: '택시 탔다' },
};

// attack: riceball(삼각김밥 3발 부채꼴) / ladle(국자 휘두르기 + 식판 부메랑) / dash(돌진 + 덤벨 던지기)
const BOSSES = [
  { at: 30,  name: 'GS25 야간 알바생',  label: '아침의 시험', look: 'student', attack: 'riceball', color: '#00aeef', hp: 20, speed: 40, won: 15000, gems: 8,  loseText: 'GS25 알바생한테 붙잡혔다' },
  { at: 70,  name: '학생식당 아주머니', label: '점심의 시험', look: 'ajumma',  attack: 'ladle',    color: '#d4a574', hp: 30, speed: 40, won: 20000, gems: 10, loseText: '학생식당 아주머니한테 붙잡혔다' },
  { at: 110, name: '트러스트짐 헬창',   label: '저녁의 시험', look: 'gymbro',  attack: 'dash',     color: '#ff6b35', hp: 36, speed: 55, won: 30000, gems: 12, loseText: '헬창한테 깔렸다' },
];

// 카드 3장 각각 독립 추첨: 전설 6% / 희귀 22% / 일반 72%
const TIERS = {
  common:    { label: '',     color: '#ffd166' },
  rare:      { label: '희귀', color: '#4cc9f0' },
  legendary: { label: '전설', color: '#ffe066' },
};
const UPGRADES = [
  { tier: 'common', name: '도장 연타',   desc: '발사 간격 20% 단축',          apply: (p) => { p.fireEvery = Math.max(0.15, p.fireEvery * 0.8); } },
  { tier: 'common', name: '빠른 걸음',   desc: '이동 속도 +15%',               apply: (p) => { p.speed *= 1.15; } },
  { tier: 'common', name: '큰 가방',     desc: '젬 자석 범위 +40',             apply: (p) => { p.magnet += 40; } },
  { tier: 'common', name: '든든한 아침', desc: '최대 하트 +1, 하트 +1',        apply: (p) => { p.maxHp += 1; p.hp += 1; } },
  { tier: 'rare',   name: '도장 하나 더', desc: '한 번에 한 발 더 (12° 부채꼴)', apply: (p) => { p.shots += 1; } },
  { tier: 'rare',   name: '관통 도장',   desc: '적을 하나 더 뚫고 지나감',      apply: (p) => { p.pierce += 1; } },
  { tier: 'rare',   name: '보온병',      desc: '맞은 뒤 무적 시간 +0.3초',      apply: (p) => { p.invTime += 0.3; } },
  { tier: 'rare',   name: '컵라면 응급', desc: '최대 하트 +1, 하트 전부 회복',  apply: (p) => { p.maxHp += 1; p.hp = p.maxHp; } },
  { tier: 'legendary', flag: 'laser',   name: '교내 방송', desc: '6초마다 스피커 빔이 화면을 왼쪽→오른쪽으로 훑는다 (피해 6)',            apply: (p) => { p.laser = true; } },
  { tier: 'legendary', flag: 'missile', name: '과방 선배', desc: '1초마다 가장 가까운 유혹(보스 우선)을 끝까지 쫓아가 막는다 (피해 4, 주변 2)', apply: (p) => { p.missile = true; } },
];

const PLACES = [
  { name: 'GS25',     x: W * 0.5,  y: H * 0.30, r: 40 },
  { name: '학생식당', x: W * 0.25, y: H * 0.64, r: 40 },
  { name: '트러스트짐', x: W * 0.75, y: H * 0.64, r: 40 },
];

/* ==========================================================================
   2. 상태·DOM
   ========================================================================== */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);
const dom = {
  start: $('overlay-start'),
  levelup: $('overlay-levelup'),
  pause: $('overlay-pause'),
  over: $('overlay-over'),
  upBtns: [$('up-1'), $('up-2'), $('up-3')],
  overTitle: $('over-title'),
  overReason: $('over-reason'),
  overLeft: $('over-left'),
  money: $('hud-money'),
  best: $('hud-best'),
  mute: $('btn-mute'),
  status: $('status'),
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let mode = 'idle';          // idle | play | levelup | pause | intro | dying | over
let time, phaseIdx, bossIdx, night;   // night: 120초를 넘겼다. 보스를 다 잡을 때까지 끝나지 않는다
let player, enemies, bullets, gems, particles, floats;
let bossShots, missiles, laser, laserTimer, missileTimer;
let stamps, money, xp, nextXp, level, kills, bossKills, lastHit;
let spawnTimer, spawnCount, bossWarned, fireTimer, hintTimer = 0, played = false;
let shake, hitStop, lastHitStop, hurtFlash, banner, intro, dying, choices = [];
let legendaryOffered, levelupAt = 0, pauseAfterIntro = false;   // pity 플래그 / 카드 오픈 시각 / 컷신 중 탭 이탈
let best = 0;
try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (_) {}   // 저장소가 막힌 브라우저에서도 게임은 돌아가야 해서
let last = 0;

function resetState() {
  time = 0; phaseIdx = 0; bossIdx = 0; night = false;
  player = { x: W / 2, y: (H + HUD_H) / 2, r: 14, hp: 3, maxHp: 3, inv: 0, invTime: 0.8, speed: 170, fireEvery: 0.5, shots: 1, pierce: 0, magnet: 60, laser: false, missile: false };
  enemies = []; bullets = []; gems = []; particles = []; floats = [];
  bossShots = []; missiles = []; laser = null; laserTimer = 6; missileTimer = 1.0;
  stamps = ['wait', 'wait', 'wait'];
  money = 0; xp = 0; nextXp = 5; level = 1; kills = 0; bossKills = 0; lastHit = null;
  spawnTimer = 0.8; spawnCount = 0; bossWarned = false; fireTimer = 0.3;
  shake = { power: 0, time: 0 }; hitStop = 0; lastHitStop = -1; hurtFlash = 0; banner = null; intro = null; dying = 0;
  legendaryOffered = false; pauseAfterIntro = false;
}

function setStatus(text) { dom.status.textContent = text; }
function showBanner(text) { banner = { text, life: 1.6, max: 1.6 }; }
function renderHud() {
  dom.money.textContent = '₩ ' + money.toLocaleString('ko-KR');
  dom.best.textContent = '₩ ' + best.toLocaleString('ko-KR');
  dom.mute.textContent = muted ? '소리 끔' : '소리 켬';
  dom.mute.setAttribute('aria-pressed', String(muted));
}
function rand(a, b) { return a + Math.random() * (b - a); }

/* ==========================================================================
   3. 사운드 — 파일 없이 Web Audio로 합성. 시작 버튼(사용자 제스처)에서 켠다
   ========================================================================== */
let audio = null, master = null, noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (_) {}
let bgmTimer = null, bgmNext = 0, bgmStep = 0;
const sfxLast = {};              // 같은 효과음이 한 프레임에 겹쳐 터지지 않게 40ms 간격
const BGM_ARP = [0, 7, 12, 7];   // 근음 기준 반음 간격 (1도·5도·8도·5도)

function initAudio() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC();
    master = audio.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(audio.destination);
  }
  if (audio.state === 'suspended') audio.resume();
}

// at: 예약 시각(초). 안 주면 지금 바로
function playTone(freq, ms, type, gain, slideTo, at) {
  if (!audio || muted) return;
  const t = at || audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + ms / 1000);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + ms / 1000 + 0.02);
}

function playNoise(ms, gain) {
  if (!audio || muted) return;
  if (!noiseBuf) {   // 0.2초짜리 백색소음 한 장을 만들어 두고 계속 재사용
    noiseBuf = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.2), audio.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  }
  const t = audio.currentTime, s = audio.createBufferSource(), g = audio.createGain();
  s.buffer = noiseBuf;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  s.connect(g); g.connect(master);
  s.start(t); s.stop(t + ms / 1000);
}

function sfx(name) {
  if (!audio || muted) return;
  const now = performance.now();
  if (now - (sfxLast[name] || 0) < 40) return;
  sfxLast[name] = now;
  const t = audio.currentTime;
  if (name === 'hit') playTone(700, 60, 'square', 0.04, 400);
  else if (name === 'kill') { playNoise(80, 0.06); playTone(140, 120, 'sine', 0.10, 50); }
  else if (name === 'hurt') playTone(110, 150, 'sawtooth', 0.10, 60);
  else if (name === 'levelup') { playTone(523, 120, 'triangle', 0.08); playTone(659, 120, 'triangle', 0.08, 0, t + 0.1); playTone(784, 240, 'triangle', 0.08, 0, t + 0.2); }
  else if (name === 'boss') playTone(70, 800, 'sawtooth', 0.10, 320);
  else if (name === 'laser') playTone(1600, 1000, 'sawtooth', 0.07, 180);
  else if (name === 'pickup') playTone(1400, 25, 'sine', 0.015);
  else if (name === 'throw') playTone(300, 120, 'triangle', 0.06, 520);
  else if (name === 'stamp') { playTone(880, 90, 'square', 0.06); playTone(1320, 160, 'square', 0.06, 0, t + 0.09); }
}

function startBgm() {
  if (!audio || bgmTimer) return;
  bgmNext = audio.currentTime + 0.05; bgmStep = 0;
  bgmTimer = setInterval(scheduleBgm, 25);
}
function stopBgm() { clearInterval(bgmTimer); bgmTimer = null; }

// 110BPM 8분음표. 0.1초 앞까지만 예약해 두면 setInterval이 조금 늦어도 박자가 안 밀린다
function scheduleBgm() {
  const step = 60 / 110 / 2;
  const root = 110 * Math.pow(2, phaseIdx / 12);   // 시간대마다 반음씩 올라간다
  const bossOn = enemies.some((e) => e.boss);
  if (bgmNext < audio.currentTime - 0.2) bgmNext = audio.currentTime;   // 탭 전환으로 밀린 만큼은 건너뛴다
  while (bgmNext < audio.currentTime + 0.1) {
    playTone(root * 2 * Math.pow(2, BGM_ARP[bgmStep % 4] / 12), step * 900, 'triangle', 0.04, 0, bgmNext);
    if (bossOn || bgmStep % 2 === 0) playTone(root, step * 500, 'sine', 0.05, root * 0.5, bgmNext);   // 보스 중엔 베이스 2배 빠르게
    bgmNext += step; bgmStep += 1;
  }
}

function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (_) {}
  if (master) master.gain.value = muted ? 0 : 1;
  renderHud();
}

/* ==========================================================================
   4. 입력 — 키보드(WASD/방향키) + 플로팅 조이스틱(터치)
   ========================================================================== */
// e.code(물리 키) 기준: 한/영 전환이 '한'이어도 WASD가 먹는다
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right' };
const keys = { up: false, down: false, left: false, right: false };
const joy = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };   // dx·dy는 -1~1 비율

function resetInput() {
  keys.up = keys.down = keys.left = keys.right = false;
  joy.active = false; joy.id = null; joy.dx = 0; joy.dy = 0;
}

function toCanvasXY(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * W / rect.width, y: (e.clientY - rect.top) * H / rect.height };
}

document.addEventListener('keydown', (e) => {
  const k = e.key, c = e.code;
  const onButton = e.target.closest && e.target.closest('a, #btn-mute');
  if (onButton && (k === ' ' || k === 'Enter')) return;   // 링크·음소거 버튼 위의 Space/Enter만 그쪽 기본 동작. 이동키는 항상 게임으로
  if (k === ' ' || k === 'Enter') {
    if (mode === 'idle' || mode === 'over') { e.preventDefault(); startGame(); }
    else if (mode === 'pause') resumeGame();
    return;
  }
  if (c === 'KeyP' || k === 'Escape') {
    if (mode === 'play') pauseGame(); else if (mode === 'pause') resumeGame();
    return;
  }
  if (c === 'KeyM') { toggleMute(); return; }
  if (mode === 'levelup' && (c === 'Digit1' || c === 'Digit2' || c === 'Digit3')) { applyUpgrade(Number(c.slice(-1)) - 1); return; }
  if (KEYMAP[c]) { keys[KEYMAP[c]] = true; if (mode === 'play') e.preventDefault(); }
});
document.addEventListener('keyup', (e) => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });

canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'play' && mode !== 'intro') return;
  const p = toCanvasXY(e);
  if (p.y < HUD_H) {   // ‖ 버튼은 조이스틱을 잡은 채 두 번째 손가락으로도 눌려야 해서 joy.active 검사보다 앞에 둔다
    if (mode === 'play' && p.x > W - 48) { e.preventDefault(); pauseGame(); }   // HUD 오른쪽 위 ‖ 버튼
    return;
  }
  if (joy.active) return;   // 첫 손가락만. 컷신 중에도 잡아 둬야 끝난 뒤 바로 움직인다
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  joy.active = true; joy.id = e.pointerId; joy.ox = p.x; joy.oy = p.y; joy.dx = 0; joy.dy = 0;
  hintTimer = 0;
});
canvas.addEventListener('pointermove', (e) => {
  if (!joy.active || e.pointerId !== joy.id) return;
  const p = toCanvasXY(e);
  const dx = p.x - joy.ox, dy = p.y - joy.oy;
  let d = Math.hypot(dx, dy);
  if (d > JOY_MAX) {   // 손가락이 링 밖으로 나가면 원점이 끌려온다 — 화면을 안 보고도 방향을 꺾을 수 있게
    joy.ox = p.x - dx / d * JOY_MAX; joy.oy = p.y - dy / d * JOY_MAX; d = JOY_MAX;
  }
  if (d < JOY_DEAD) { joy.dx = 0; joy.dy = 0; return; }
  const ratio = d / JOY_MAX;   // 많이 끌수록 빠르게
  joy.dx = dx / Math.hypot(dx, dy) * ratio; joy.dy = dy / Math.hypot(dx, dy) * ratio;
});
function endJoy(e) { if (joy.id === e.pointerId) { joy.active = false; joy.id = null; joy.dx = 0; joy.dy = 0; } }
canvas.addEventListener('pointerup', endJoy);
canvas.addEventListener('pointercancel', endJoy);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (mode === 'play') pauseGame();
    else { if (mode === 'intro') pauseAfterIntro = true; if (audio) audio.suspend(); }
  } else if (audio && mode !== 'pause') audio.resume();
});
$('btn-start').addEventListener('click', startGame);
$('btn-restart').addEventListener('click', startGame);
$('btn-resume').addEventListener('click', resumeGame);
dom.mute.addEventListener('click', () => { initAudio(); toggleMute(); dom.mute.blur(); });   // 포커스를 돌려놔야 그 뒤 키 입력이 게임으로 간다
dom.upBtns.forEach((btn, i) => btn.addEventListener('click', () => applyUpgrade(i)));

/* ==========================================================================
   5. 스폰·발사
   ========================================================================== */
function spawnEnemy() {
  if (enemies.length >= MAX_ENEMIES) return;
  const phase = PHASES[phaseIdx];
  const T = ENEMY_TYPES[phase.enemies[Math.floor(Math.random() * phase.enemies.length)]];
  const side = Math.floor(Math.random() * 4);   // 0 위 1 오른쪽 2 아래 3 왼쪽
  let x, y;
  if (side === 0) { x = rand(0, W); y = HUD_H - 30; }
  else if (side === 1) { x = W + 30; y = rand(HUD_H, H); }
  else if (side === 2) { x = rand(0, W); y = H + 30; }
  else { x = -30; y = rand(HUD_H, H); }
  const hpBonus = time >= (phase.hpBonusAt || 0) ? phase.hpBonus : 0;
  const won = night ? Math.round(T.won * NIGHT_WON) : T.won;   // 문 닫은 시간: 아낄 돈도 30%만
  enemies.push({
    name: T.name, shape: T.shape, color: T.color, x, y, r: T.r,
    hp: T.hp + hpBonus, maxHp: T.hp + hpBonus, speed: T.speed, won, closed: night, loseText: T.loseText,
    flash: 0, angle: 0, boss: false, dead: false,
  });
}

// 낮: 시간대 안에서 spawnFrom→spawnTo 선형 보간. 밤: 0.7초에서 시작해 10초마다 5%씩 빨라진다(무한 농성 방지, 하한 0.3초)
function currentSpawnEvery() {
  const p = PHASES[phaseIdx];
  if (night) return Math.max(0.3, p.spawnFrom * Math.pow(0.95, Math.floor((time - DAY) / 10)));
  const k = Math.min(1, Math.max(0, (time - p.from) / (p.to - p.from)));
  return p.spawnFrom + (p.spawnTo - p.spawnFrom) * k;
}

// 보스는 거리를 0.45배(밤 0.3배)로 쳐서 잡몹 뒤에 숨어도 조준이 간다
function nearestEnemy(x, y) {
  let target = null, nearest = Infinity;
  const bossW = night ? 0.3 : 0.45;
  for (const e of enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - x, e.y - y) * (e.boss ? bossW : 1);
    if (d < nearest) { nearest = d; target = e; }
  }
  return target;
}

function missileTarget(x, y) { return enemies.find((e) => e.boss && !e.dead) || nearestEnemy(x, y); }

function shoot() {
  const target = nearestEnemy(player.x, player.y);
  if (!target) return;
  const base = Math.atan2(target.y - player.y, target.x - player.x);
  const n = player.shots, spread = 12 * Math.PI / 180;
  for (let i = 0; i < n; i += 1) {
    const a = base + (i - (n - 1) / 2) * spread;
    bullets.push({ x: player.x, y: player.y, vx: Math.cos(a) * BULLET_SPEED, vy: Math.sin(a) * BULLET_SPEED, r: 5, left: 1 + player.pierce, hit: [], color: PHASES[phaseIdx].color });
  }
}

/* ==========================================================================
   6. 업데이트·충돌 — 모든 충돌은 hitCircle 한 줄
   ========================================================================== */
function hitCircle(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r; }

function update(dt) {
  time += dt;
  const idx = PHASES.findIndex((p) => time < p.to);   // 마지막 행(밤)은 to가 Infinity라 항상 걸린다
  if (idx !== phaseIdx) {
    for (let i = 0; i < Math.min(idx, stamps.length); i += 1) if (stamps[i] === 'wait') stamps[i] = 'miss';   // 지나간 시간대 스탬프는 놓침
    phaseIdx = idx;
    if (idx < PLACES.length) showBanner(PHASES[idx].name + ' · ' + PLACES[idx].name + ' 영업 시작');
    else { night = true; showBanner('밤 — 남은 보스를 쓰러뜨려야 하루가 끝난다'); }   // 120초 = 밤. 시간으로는 끝나지 않는다 — 보스를 다 잡아야 하루가 끝난다
  }
  const nextBoss = BOSSES[bossIdx];
  if (nextBoss && time >= nextBoss.at) { startBossIntro(nextBoss); bossIdx += 1; bossWarned = false; return; }
  const bossSoon = nextBoss && time >= nextBoss.at - 5;   // 등장 5초 전: 예고 배너 + 잡몹 스폰 정지
  if (bossSoon && !bossWarned) { bossWarned = true; showBanner('곧 ' + nextBoss.name); }

  movePlayer(dt);
  if (!bossSoon) spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnCount += 1;
    const n = time < 30 && spawnCount % 4 === 0 ? 3 : 1;   // 첫 30초는 4번째 스폰마다 3마리 묶음 — 한 마리씩은 심심해서
    for (let i = 0; i < n; i += 1) spawnEnemy();
    spawnTimer = currentSpawnEvery();
  }
  fireTimer -= dt;
  if (fireTimer <= 0 && enemies.length) { shoot(); fireTimer = player.fireEvery; }

  updateBullets(dt);
  updateLaser(dt);
  updateMissiles(dt);
  if (bossKills >= BOSSES.length) { endGame(true); return; }   // 마지막 보스가 죽는 순간 하루 완성. 같은 프레임의 피격보다 먼저 판정
  updateEnemies(dt);
  updateBossShots(dt);
  if (mode !== 'play') return;   // 방금 죽어서 결과 화면이 떴으면 여기서 멈춤
  updateGems(dt);
  updateEffects(dt);

  const place = PLACES[phaseIdx];
  if (!night && stamps[phaseIdx] === 'wait' && hitCircle(player, place)) {
    stamps[phaseIdx] = 'done';
    money += PHASES[phaseIdx].bonus;
    player.hp = Math.min(player.maxHp, player.hp + 1);
    if (gems.length) { addFloat(player.x, player.y - 30, '젬 +' + gems.length, '#ffd166', 14); xp += gems.length; gems = []; }   // 장소에 들어가면 화면의 젬 전부 흡수
    addFloat(place.x, place.y - 50, '+' + PHASES[phaseIdx].bonus.toLocaleString('ko-KR'), PHASES[phaseIdx].color, 18);
    addParticles(place.x, place.y, PHASES[phaseIdx].color, 12, 140, 0.6);
    showBanner(PHASES[phaseIdx].name + ' 스탬프 ' + place.name + '!');
    sfx('stamp');
    renderHud();
  }
  if (player.inv > 0) player.inv -= dt;
  if (hintTimer > 0) hintTimer -= dt;
  if (mode === 'play' && xp >= nextXp) openLevelUp();
}

function movePlayer(dt) {
  let dx = joy.dx, dy = joy.dy;
  if (!joy.active) {
    dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }   // 대각선도 같은 속도
  }
  player.x = Math.min(W - player.r, Math.max(player.r, player.x + dx * player.speed * dt));
  player.y = Math.min(H - player.r, Math.max(HUD_H + player.r, player.y + dy * player.speed * dt));
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const b = bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < -20 || b.x > W + 20 || b.y < HUD_H - 20 || b.y > H + 20) { bullets.splice(i, 1); continue; }
    for (const e of enemies) {
      if (e.dead || b.hit.includes(e) || !hitCircle(b, e)) continue;
      b.hit.push(e);
      hurtEnemy(e, b);
      b.left -= 1;
      if (b.left <= 0) { bullets.splice(i, 1); break; }
    }
  }
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    if (e.dead) { enemies.splice(i, 1); continue; }
    if (e.boss) bossAttack(e, dt);
    e.angle = Math.atan2(player.y - e.y, player.x - e.x);
    if (!e.dash) {   // 돌진 예고·돌진 중엔 평소 추격을 멈춘다
      e.x += Math.cos(e.angle) * e.speed * dt;
      e.y += Math.sin(e.angle) * e.speed * dt;
    }
    if (e.flash > 0) e.flash -= dt;
    if (e.boss) e.hpShown += (e.hp - e.hpShown) * Math.min(1, dt * 8);   // HP 바가 스르륵 줄어듦
    if (player.inv <= 0 && hitCircle(e, player)) hurtPlayer(e);
  }
}

function updateGems(dt) {
  for (let i = gems.length - 1; i >= 0; i -= 1) {
    const g = gems[i];
    const d = Math.hypot(player.x - g.x, player.y - g.y);
    if (d < player.magnet) {
      g.x += (player.x - g.x) / d * 260 * dt;
      g.y += (player.y - g.y) / d * 260 * dt;
    }
    if (hitCircle(g, player)) { gems.splice(i, 1); xp += 1; sfx('pickup'); }
  }
}

/* ==========================================================================
   7. 성장 — 레벨업 특전(등급 추첨) + 전설 무기(교내 방송·과방 선배)
   ========================================================================== */
// 카드 3장 각각 독립 추첨. 전설은 한 화면에 1장까지, 이미 얻은 전설은 빼고, 같은 카드는 두 번 안 나온다
function rollUpgrades() {
  const picked = [];
  let legendaryShown = false;
  const pity = !legendaryOffered && level >= 5;   // 4번째 레벨업까지 전설을 한 번도 못 봤으면 이번엔 1장 보장
  while (picked.length < 3) {
    const roll = Math.random();
    let tier = pity && !picked.length ? 'legendary' : roll < 0.06 ? 'legendary' : roll < 0.28 ? 'rare' : 'common';
    if (tier === 'legendary' && legendaryShown) tier = 'rare';
    let pool = UPGRADES.filter((u) => u.tier === tier && !picked.includes(u) && !(u.flag && player[u.flag]));
    if (!pool.length) pool = UPGRADES.filter((u) => u.tier === 'common' && !picked.includes(u));
    const u = pool[Math.floor(Math.random() * pool.length)];
    if (u.tier === 'legendary') { legendaryShown = true; legendaryOffered = true; }
    picked.push(u);
  }
  return picked;
}

function openLevelUp() {
  mode = 'levelup';
  xp -= nextXp;
  level += 1;
  nextXp += 2 + Math.ceil(level * 0.6);
  levelupAt = performance.now();
  choices = rollUpgrades();
  choices.forEach((u, i) => {
    const btn = dom.upBtns[i];
    btn.dataset.tier = u.tier;
    btn.querySelector('.up-tier').textContent = TIERS[u.tier].label;
    btn.querySelector('.up-name').textContent = (i + 1) + '. ' + u.name;
    btn.querySelector('.up-desc').textContent = u.desc;
  });
  resetInput();
  dom.levelup.hidden = false;
  dom.upBtns[0].focus();
  sfx('levelup');
  setStatus('레벨 ' + level + '! 특전을 고르세요');
}

function applyUpgrade(i) {
  if (mode !== 'levelup' || !choices[i] || performance.now() - levelupAt < 300) return;   // 오픈 직후 0.3초는 헛클릭
  choices[i].apply(player);
  player.inv = Math.max(player.inv, 0.8);   // 카드 닫히는 순간 적이 붙어 있어도 한 번은 봐준다
  dom.levelup.hidden = true;
  mode = 'play';
  setStatus(choices[i].name + ' 획득');
  addFloat(player.x, player.y - 30, choices[i].name, TIERS[choices[i].tier].color, choices[i].tier === 'legendary' ? 20 : 15);
}

function fireLaser() {
  laser = { t: 0, dur: 1.2, x: 0, w: 0, hit: [] };
  sfx('laser');
  addShake(2, 0.2);
}

// 빔은 왼쪽 끝→오른쪽 끝으로 1.2초. 폭은 sin 곡선으로 0→40→0. 적마다 스윕당 한 번만 맞는다
function updateLaser(dt) {
  if (player.laser) { laserTimer -= dt; if (laserTimer <= 0) { laserTimer = 6; fireLaser(); } }
  if (!laser) return;
  laser.t += dt;
  if (laser.t >= laser.dur) { laser = null; return; }
  const k = laser.t / laser.dur;
  laser.x = W * k;
  laser.w = 40 * Math.sin(Math.PI * k);
  for (const e of enemies) {
    if (e.dead || laser.hit.includes(e) || Math.abs(e.x - laser.x) > laser.w / 2 + e.r) continue;
    laser.hit.push(e);
    hurtEnemy(e, { vx: 1, vy: 0 }, 6);
  }
}

function fireMissile() {
  const target = missileTarget(player.x, player.y);
  if (!target) return;
  missiles.push({ x: player.x, y: player.y, angle: Math.atan2(target.y - player.y, target.x - player.x), vx: 0, vy: 0, r: 6, life: 3 });
}

// 매 프레임 목표(보스 우선) 쪽으로 방향을 최대 4rad/초만 튼다 — 바로 꺾이면 유도탄 느낌이 안 난다. 착탄 시 반경 36px 스플래시 2
function updateMissiles(dt) {
  if (player.missile) { missileTimer -= dt; if (missileTimer <= 0) { missileTimer = 1.0; fireMissile(); } }
  for (let i = missiles.length - 1; i >= 0; i -= 1) {
    const m = missiles[i];
    m.life -= dt;
    const target = missileTarget(m.x, m.y);
    if (target) {
      let diff = Math.atan2(target.y - m.y, target.x - m.x) - m.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));   // -π~π로 접기
      m.angle += Math.max(-4 * dt, Math.min(4 * dt, diff));
    }
    m.vx = Math.cos(m.angle) * 300; m.vy = Math.sin(m.angle) * 300;
    m.x += m.vx * dt; m.y += m.vy * dt;
    particles.push({ kind: 'dot', x: m.x - m.vx * 0.02, y: m.y - m.vy * 0.02, vx: rand(-25, 25), vy: rand(-25, 25), size: 3, life: 0.3, max: 0.3, color: '#ffd166' });
    const hitE = enemies.find((e) => !e.dead && hitCircle(m, e));
    if (hitE) {
      hurtEnemy(hitE, m, 4);
      for (const e of enemies) if (e !== hitE && !e.dead && Math.hypot(e.x - m.x, e.y - m.y) < 36 + e.r) hurtEnemy(e, m, 2);
      addParticles(m.x, m.y, '#ff6b35', 8, 150, 0.35); missiles.splice(i, 1); continue;
    }
    if (m.life <= 0 || m.x < -20 || m.x > W + 20 || m.y < HUD_H - 20 || m.y > H + 20) missiles.splice(i, 1);
  }
}

/* ==========================================================================
   8. 보스·공격·컷신·타격감 — particles, floats, shake, hitStop
   ========================================================================== */
function startBossIntro(b) {
  mode = 'intro';
  intro = { boss: b, t: 0, dur: reduceMotion ? 1.2 : 1.6 };
  joy.dx = 0; joy.dy = 0;   // 조이스틱 자체(active·원점)는 살려 둔다 — 컷신 중 누르고 있던 손가락이 끝난 뒤에도 먹어야 해서
  sfx('boss');
  setStatus('보스 등장: ' + b.name);
}

function spawnBoss(b) {
  enemies.push({
    name: b.name, look: b.look, attack: b.attack, color: b.color, x: W / 2, y: HUD_H - 40, r: 26,
    hp: b.hp, maxHp: b.hp, hpShown: b.hp, speed: b.speed, won: b.won, gems: b.gems, loseText: b.loseText,
    flash: 0, angle: 0, boss: true, dead: false,
    warm: 1, atkTimer: 1, atk2Timer: 2.5, swing: null, dash: null, wind: null,   // warm: 컷신 끝나고 1초는 공격 없음. wind: 투사체 던지기 예고
  });
  particles.push({ kind: 'ring', x: W / 2, y: HUD_H + 10, r: 10, life: 0.6, max: 0.6, color: b.color });
  player.inv = Math.max(player.inv, 1.0);   // 컷신 동안 붙어 있던 잡몹에게 바로 맞지 않게
  addShake(4, 0.3);
  showBanner(b.name + ' 등장!');
}

// 보스마다 다른 공격. 예고(텔레그래프)를 먼저 보여줘야 피할 수 있다
function bossAttack(e, dt) {
  if (e.warm > 0) { e.warm -= dt; return; }
  const toPlayer = Math.atan2(player.y - e.y, player.x - e.x);
  e.atkTimer -= dt; e.atk2Timer -= dt;
  if (e.attack === 'riceball') {
    if (e.atkTimer <= 0 && !e.wind) { e.atkTimer = 2.2; e.wind = { kind: 'riceball', t: 0, dur: 0.35, angle: toPlayer }; }
  } else if (e.attack === 'ladle') {
    if (e.atkTimer <= 0 && !e.swing) { e.atkTimer = 3; e.swing = { t: 0, angle: toPlayer, hit: false }; }
    if (e.swing) {
      e.swing.t += dt;
      if (!e.swing.hit && e.swing.t >= 0.5) {   // 예고 0.5초 뒤 반지름 70·90° 부채꼴 판정
        e.swing.hit = true;
        const d = Math.hypot(player.x - e.x, player.y - e.y);
        let diff = toPlayer - e.swing.angle;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        if (d < 70 + player.r && Math.abs(diff) < Math.PI / 4) hurtPlayer(e);
        addShake(3, 0.15); sfx('throw');
      }
      if (e.swing.t >= 0.7) e.swing = null;
    }
    if (e.atk2Timer <= 0 && !e.wind) { e.atk2Timer = 4; e.wind = { kind: 'tray', t: 0, dur: 0.3, angle: toPlayer }; }
  } else {
    if (e.atkTimer <= 0 && !e.dash) { e.atkTimer = 3.5; e.dash = { t: 0, angle: toPlayer, stage: 'warn' }; }
    if (e.dash) {
      e.dash.t += dt;
      if (e.dash.stage === 'warn' && e.dash.t >= 0.6) { e.dash.stage = 'go'; e.dash.t = 0; sfx('throw'); }
      else if (e.dash.stage === 'go') {
        e.x += Math.cos(e.dash.angle) * 520 * dt; e.y += Math.sin(e.dash.angle) * 520 * dt;
        const wall = e.x < e.r || e.x > W - e.r || e.y < HUD_H + e.r || e.y > H - e.r;
        e.x = Math.min(W - e.r, Math.max(e.r, e.x)); e.y = Math.min(H - e.r, Math.max(HUD_H + e.r, e.y));
        if (wall || e.dash.t >= 0.5) { e.dash = null; addShake(4, 0.15); }
      }
    }
    if (e.atk2Timer <= 0 && !e.wind) { e.atk2Timer = 5; e.wind = { kind: 'dumbbell', t: 0, dur: 0.3, angle: toPlayer }; }
  }
  if (!e.wind) return;
  e.wind.t += dt;   // 예고가 다 차면 예고 시작 때 잡은 방향으로 던진다 — 방향이 고정돼야 피할 수 있다
  if (e.wind.t < e.wind.dur) return;
  const w = e.wind, a = w.angle;
  e.wind = null;
  if (w.kind === 'riceball') {
    for (let k = -1; k <= 1; k += 1) {   // 3발 부채꼴 ±15°
      const ak = a + k * 15 * Math.PI / 180;
      bossShots.push({ kind: 'riceball', owner: e, x: e.x, y: e.y, vx: Math.cos(ak) * 200, vy: Math.sin(ak) * 200, r: 7, life: 4, spin: 0 });
    }
  } else if (w.kind === 'tray') {
    bossShots.push({ kind: 'tray', owner: e, x: e.x, y: e.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, r: 12, life: 6, spin: 0, dist: 0, out: true });
  } else {
    bossShots.push({ kind: 'dumbbell', owner: e, x: e.x, y: e.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, r: 10, life: 8, spin: 0, bounces: 2 });
  }
  sfx('throw');
}

// 보스 투사체. 내 도장과는 부딪히지 않는다 — 막을 수 있으면 피할 이유가 없어져서
function updateBossShots(dt) {
  for (let i = bossShots.length - 1; i >= 0; i -= 1) {
    const s = bossShots[i];
    s.life -= dt; s.spin += dt * 9;
    if (s.kind === 'tray' && !s.out) {   // 돌아오는 식판: 던진 보스에게로
      const o = s.owner, d = Math.hypot(o.x - s.x, o.y - s.y);
      if (o.dead || d < 14) { bossShots.splice(i, 1); continue; }
      s.x += (o.x - s.x) / d * 260 * dt; s.y += (o.y - s.y) / d * 260 * dt;
    } else {
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.kind === 'tray') { s.dist += 260 * dt; if (s.dist >= 180) s.out = false; }
      if (s.kind === 'dumbbell') {   // 벽에 두 번 튕긴 뒤 세 번째 벽에서 소멸
        if (s.x < s.r || s.x > W - s.r) { s.vx = -s.vx; s.x = Math.min(W - s.r, Math.max(s.r, s.x)); s.bounces -= 1; }
        if (s.y < HUD_H + s.r || s.y > H - s.r) { s.vy = -s.vy; s.y = Math.min(H - s.r, Math.max(HUD_H + s.r, s.y)); s.bounces -= 1; }
        if (s.bounces < 0) { bossShots.splice(i, 1); continue; }
      }
    }
    const outside = s.x < -30 || s.x > W + 30 || s.y < HUD_H - 30 || s.y > H + 30;
    if (s.life <= 0 || (outside && s.kind !== 'tray')) { bossShots.splice(i, 1); continue; }
    if (player.inv <= 0 && hitCircle(s, player)) {
      hurtPlayer(s.owner);
      if (s.kind !== 'tray') bossShots.splice(i, 1);   // 식판은 부메랑이라 계속 돈다
    }
  }
}

function hurtEnemy(e, b, dmg = 1) {
  e.hp -= dmg;
  e.flash = 0.08;
  const len = Math.hypot(b.vx, b.vy) || 1, push = e.boss ? 3 : 8;
  e.x += b.vx / len * push; e.y += b.vy / len * push;
  addParticles(e.x, e.y, '#ffffff', 3, 120, 0.25);
  if (e.boss) addShake(2, 0.1);
  sfx('hit');
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  e.dead = true;
  kills += 1;
  money += e.won;
  addParticles(e.x, e.y, e.color, e.boss ? 16 : 6 + Math.floor(Math.random() * 3), 170, 0.45);
  addFloat(e.x, e.y - e.r, '+' + e.won.toLocaleString('ko-KR') + (e.closed ? ' (문 닫음)' : ''), e.boss ? '#ffffff' : '#ffd166', e.boss ? 20 : 14);
  if (!reduceMotion && time - lastHitStop > 0.5) { hitStop = e.boss ? 0.09 : 0.02; lastHitStop = time; }   // 연속 처치마다 멈추면 끊겨 보여서 0.5초에 한 번만
  sfx('kill');
  if (e.boss) {
    bossKills += 1;
    addShake(8, 0.35);
    for (let i = bossShots.length - 1; i >= 0; i -= 1) {   // 죽은 보스의 투사체는 함께 사라진다
      const s = bossShots[i];
      if (s.owner !== e) continue;
      addParticles(s.x, s.y, e.color, 4, 120, 0.3);
      bossShots.splice(i, 1);
    }
    player.hp = Math.min(player.maxHp, player.hp + 1);
    for (let i = 0; i < e.gems; i += 1) gems.push({ x: e.x + rand(-40, 40), y: e.y + rand(-40, 40), r: 6 });
    setStatus(e.name + ' 통과!');
    showBanner('보스 처치 ' + bossKills + '/' + BOSSES.length);
  } else {
    addShake(3, 0.12);
    gems.push({ x: e.x, y: e.y, r: 6 });
  }
  renderHud();
}

function hurtPlayer(e) {
  if (player.inv > 0 || mode !== 'play') return;
  player.hp -= 1;
  player.inv = player.invTime;
  lastHit = e;
  hurtFlash = 0.25;
  addShake(6, 0.25);
  sfx('hurt');
  navigator.vibrate?.(60);
  if (player.hp <= 0) { mode = 'dying'; dying = 0.8; resetInput(); }   // 바로 결과창 대신 0.8초 슬로모
}

function addShake(power, dur) {
  if (reduceMotion) return;
  shake.power = Math.min(12, shake.power + power);
  shake.time = Math.max(shake.time, dur);
}

function addParticles(x, y, color, n, speed, life) {
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2, s = speed * rand(0.4, 1);
    particles.push({ kind: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: rand(2, 4), life, max: life, color });
  }
}

function addFloat(x, y, text, color, size) {
  floats.push({ x, y, text, color, size, life: 0.7, max: 0.7 });
}

function updateEffects(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    if (p.kind === 'ring') { p.r += 320 * dt; continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.9; p.vy *= 0.9;
  }
  for (let i = floats.length - 1; i >= 0; i -= 1) {
    floats[i].life -= dt; floats[i].y -= 40 * dt;
    if (floats[i].life <= 0) floats.splice(i, 1);
  }
  if (shake.time > 0) { shake.time -= dt; if (shake.time <= 0) shake.power = 0; }
  if (hurtFlash > 0) hurtFlash -= dt;
  if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }
}

/* ==========================================================================
   9. 시작·종료·일시정지
   ========================================================================== */
function startGame() {
  resetState();
  resetInput();
  dom.start.hidden = true; dom.over.hidden = true; dom.pause.hidden = true; dom.levelup.hidden = true;
  hintTimer = played ? 0 : 3;
  played = true;
  mode = 'play';
  last = performance.now();
  initAudio();   // 시작 버튼 클릭 = 사용자 제스처. 브라우저가 소리를 허락하는 순간
  startBgm();
  renderHud();
  setStatus('아침 · GS25로 가서 첫 스탬프를 찍자');
}

function pauseGame() { mode = 'pause'; resetInput(); dom.pause.hidden = false; stopBgm(); if (audio) audio.suspend(); setStatus('일시정지'); }
function resumeGame() {
  if (mode !== 'pause') return;
  dom.pause.hidden = true; mode = 'play'; last = performance.now();
  player.inv = Math.max(player.inv, 0.5);   // 재개 직후 바로 맞지 않게
  if (audio) audio.resume(); startBgm(); setStatus('');
}

function endGame(won) {
  mode = 'over';
  resetInput();
  stopBgm();
  shake.power = 0; shake.time = 0; hurtFlash = 0;   // 결과창 뒤에서 떨림·비네트가 남지 않게
  const survived = Math.floor(time) + '초 버팀' + (night ? ' (밤 +' + Math.floor(time - DAY) + '초)' : '');
  if (won) {
    const stampBonus = stamps.every((s) => s === 'done') ? 30000 : 0;
    const earlyBonus = time < DAY ? 50000 : 0;   // 밤이 오기 전에 보스 셋을 다 잡았다
    money += 50000 + player.hp * 15000 + stampBonus + earlyBonus;
    dom.overTitle.textContent = '하루 완성!';
    dom.overReason.textContent = '정문 밖으로 한 번도 안 나갔다. ' + survived + ' · 밤 완주 +50,000 · 남은 하트 ' + player.hp + '×15,000'
      + (stampBonus ? ' · 스탬프 3/3 +30,000' : '') + (earlyBonus ? ' · 정시 퇴근 +50,000' : '');
  } else {
    dom.overTitle.textContent = lastHit && lastHit.boss ? '시험에 떨어졌다' : '결국 정문 밖으로 나갔다';
    dom.overReason.textContent = lastHit ? lastHit.loseText + '. (' + survived + ')' : '';
    dom.overLeft.textContent = '남은 보스 ' + (BOSSES.length - bossKills) + '명';
  }
  dom.overLeft.hidden = won;
  if (money > best) { best = money; try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {} }
  $('res-money').textContent = '₩ ' + money.toLocaleString('ko-KR');
  $('res-meals').textContent = '≈ ' + Math.round(money / MEAL_PRICE) + '끼';
  $('res-stamps').textContent = stamps.map((s) => (s === 'done' ? '●' : '○')).join(' ') + ' ' + stamps.filter((s) => s === 'done').length + '/3';
  $('res-boss').textContent = bossKills + '/3';
  $('res-kills').textContent = kills + '번';
  $('res-level').textContent = 'Lv.' + level;
  $('res-best').textContent = '₩ ' + best.toLocaleString('ko-KR');
  renderHud();
  dom.over.hidden = false;
  $('btn-restart').focus();
  setStatus(won ? '하루 완성! 아낀 돈 ₩' + money.toLocaleString('ko-KR') : '게임 종료. ' + (lastHit ? lastHit.loseText : ''));
}

/* ==========================================================================
   10. 그리기·루프
   ========================================================================== */
function draw() {
  ctx.fillStyle = PHASES[phaseIdx].bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  if (shake.time > 0) ctx.translate(rand(-shake.power, shake.power), rand(-shake.power, shake.power));

  // 담장(점선 프레임) + 정문
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, HUD_H + 8, W - 16, H - HUD_H - 16);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '700 14px "JetBrains Mono", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('정 문', W / 2, H - 14);

  PLACES.forEach(drawPlace);

  ctx.fillStyle = '#ffd166';
  for (const g of gems) {
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }

  for (const e of enemies) { if (e.boss) drawBoss(e); else drawEnemy(e); }
  drawLaser();
  drawPlayer();

  for (const b of bullets) {
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI * 2); ctx.fill();
  }
  drawMissiles();
  drawBossShots();

  for (const p of particles) {
    ctx.globalAlpha = p.life / p.max;
    if (p.kind === 'ring') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  for (const f of floats) {
    ctx.globalAlpha = Math.min(1, f.life / f.max * 1.5);
    ctx.font = '900 ' + f.size + 'px "JetBrains Mono", monospace';
    ctx.fillStyle = '#000'; ctx.fillText(f.text, f.x + 1, f.y + 1);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();   // 흔들림 끝. HUD는 흔들리지 않는다

  drawJoystick();
  drawHud();

  if (hurtFlash > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.7);
    g.addColorStop(0, 'rgba(230,57,70,0)');
    g.addColorStop(1, 'rgba(230,57,70,' + (0.6 * hurtFlash / 0.25).toFixed(2) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  if (banner) {
    ctx.globalAlpha = Math.min(1, banner.life / 0.4);
    ctx.font = '900 20px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(banner.text).width + 32;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(W / 2 - tw / 2, H * 0.42 - 20, tw, 40);
    ctx.fillStyle = '#fff';
    ctx.fillText(banner.text, W / 2, H * 0.42);
    ctx.globalAlpha = 1;
  }

  if (hintTimer > 0 && mode === 'play') {
    ctx.globalAlpha = Math.min(1, hintTimer);
    ctx.font = '700 14px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('여기를 누르고 끌어서 이동', W / 2, H - 48);
    ctx.globalAlpha = 1;
  }

  if (mode === 'intro') drawIntro();
}

function drawPlace(p, i) {
  const open = i === phaseIdx && !night, done = stamps[i] === 'done', miss = stamps[i] === 'miss';   // 밤엔 어디도 영업하지 않는다
  const color = PHASES[i].color;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = open ? 1 : 0.4;
  if (open && !done) {   // 영업 중: 맥동 링
    const k = (time * 1.2) % 1;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, p.r + k * 18, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = miss ? '#777' : color;
  ctx.lineWidth = open ? 4 : 2;
  ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = miss ? '#999' : '#fff';
  ctx.font = '700 14px "Noto Sans KR", sans-serif';
  ctx.fillText(p.name, 0, -9);
  ctx.fillStyle = miss ? '#999' : color;
  ctx.fillText(done ? '완료' : miss ? '놓침' : open ? '영업 중' : PHASES[i].name, 0, 10);
  if (miss) {
    ctx.strokeStyle = '#999'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(14, -2); ctx.moveTo(14, -30); ctx.lineTo(-14, -2); ctx.stroke();
  }
  if (done) {
    ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-10, -22); ctx.lineTo(-3, -15); ctx.lineTo(12, -30); ctx.stroke();
  }
  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.flash > 0 ? '#fff' : e.color;
  if (e.shape === 'triangle') {
    ctx.rotate(e.angle + Math.PI / 2);   // 꼭짓점이 나를 향하게
    ctx.beginPath(); ctx.moveTo(0, -e.r); ctx.lineTo(e.r, e.r); ctx.lineTo(-e.r, e.r); ctx.closePath(); ctx.fill();
  } else if (e.shape === 'square') {
    ctx.fillRect(-e.r, -e.r, e.r * 2, e.r * 2);
  } else {
    ctx.rotate(e.angle);
    ctx.fillRect(-e.r * 1.2, -e.r * 0.6, e.r * 2.4, e.r * 1.2);
  }
  ctx.restore();
  if (e.maxHp > 1) {   // 남은 HP 점
    ctx.fillStyle = '#fff';
    for (let i = 0; i < e.hp; i += 1) ctx.fillRect(e.x - e.maxHp * 3 + i * 6, e.y - e.r - 7, 4, 3);
  }
}

function drawBossFace(x, y, r, b) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  if (b.look === 'ajumma') {          // 앞치마(사다리꼴)
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.85); ctx.lineTo(r * 0.7, r * 0.85); ctx.lineTo(r * 1.05, r * 1.9); ctx.lineTo(-r * 1.05, r * 1.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-r * 0.25, r * 1.1, r * 0.5, r * 0.5);   // 앞치마 주머니
  } else if (b.look === 'student') {  // 후드티 + 끈 두 가닥
    ctx.fillStyle = b.color;
    ctx.fillRect(-r * 0.7, r * 0.85, r * 1.4, r * 1.05);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.beginPath(); ctx.moveTo(-r * 0.15, r * 0.9); ctx.lineTo(-r * 0.2, r * 1.4); ctx.moveTo(r * 0.15, r * 0.9); ctx.lineTo(r * 0.2, r * 1.4); ctx.stroke();
  } else {                            // 민소매 + 양팔 근육
    ctx.fillStyle = '#f5d3b3';
    ctx.beginPath(); ctx.arc(-r * 1.1, r * 1.25, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 1.1, r * 1.25, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = b.color;
    ctx.fillRect(-r * 0.7, r * 0.85, r * 1.4, r * 1.05);
  }
  ctx.fillStyle = '#f5d3b3';
  ctx.strokeStyle = '#17223b'; ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (b.look === 'ajumma') {          // 파마머리: 윗반원을 따라 곡선 여러 개
    ctx.fillStyle = '#3b2a20';
    for (let a = Math.PI * 1.02; a <= Math.PI * 1.99; a += Math.PI * 0.16) {
      ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, r * 0.3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (b.look === 'student') {  // 캡 모자: 이마 위 반원 + 오른쪽 챙. 눈·안경(y -0.36r~)을 덮지 않게 위로 올렸고 색도 눈과 다르게
    ctx.fillStyle = '#2b3a5e';
    ctx.beginPath(); ctx.arc(0, -r * 0.4, r * 0.9, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(-r * 0.1, -r * 0.52, r * 1.45, r * 0.16);
  } else {                            // 짧은 머리
    ctx.fillStyle = '#1f1a17';
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 1.12, Math.PI * 1.88); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = '#17223b'; ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();   // 눈
  ctx.moveTo(-r * 0.45, -r * 0.12); ctx.lineTo(-r * 0.18, -r * 0.12);
  ctx.moveTo(r * 0.18, -r * 0.12); ctx.lineTo(r * 0.45, -r * 0.12);
  ctx.stroke();
  if (b.look === 'student') {         // 안경 + 이어폰 줄
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.beginPath();
    ctx.arc(-r * 0.32, -r * 0.12, r * 0.24, 0, Math.PI * 2);
    ctx.moveTo(r * 0.56, -r * 0.12); ctx.arc(r * 0.32, -r * 0.12, r * 0.24, 0, Math.PI * 2);
    ctx.moveTo(-r * 0.08, -r * 0.12); ctx.lineTo(r * 0.08, -r * 0.12);
    ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, r * 0.04);
    ctx.beginPath(); ctx.moveTo(r * 0.9, r * 0.1); ctx.quadraticCurveTo(r * 1.1, r * 0.8, r * 0.5, r * 1.4); ctx.stroke();
    ctx.strokeStyle = '#17223b'; ctx.lineWidth = Math.max(2, r * 0.08);
  }
  ctx.beginPath();   // 입: 아주머니는 미소, 알바생은 하품, 헬창은 굳은 입
  if (b.look === 'ajumma') ctx.arc(0, r * 0.25, r * 0.3, Math.PI * 0.15, Math.PI * 0.85);
  else if (b.look === 'student') ctx.arc(0, r * 0.4, r * 0.14, 0, Math.PI * 2);
  else { ctx.moveTo(-r * 0.3, r * 0.42); ctx.lineTo(r * 0.3, r * 0.42); }
  ctx.stroke();
  ctx.restore();
}

function drawBoss(e) {
  if (e.swing) {   // 국자: 예고 0.5초는 흰 반투명 부채꼴, 그 뒤 0.2초는 진짜 휘두르기
    const warn = e.swing.t < 0.5;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.globalAlpha = warn ? 0.2 + e.swing.t * 0.8 : 0.7;
    ctx.fillStyle = warn ? '#fff' : e.color;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 70, e.swing.angle - Math.PI / 4, e.swing.angle + Math.PI / 4); ctx.closePath(); ctx.fill();
    if (!warn) {
      ctx.globalAlpha = 1;
      ctx.rotate(e.swing.angle - Math.PI / 4 + (e.swing.t - 0.5) / 0.2 * Math.PI / 2);   // 부채꼴을 왼쪽에서 오른쪽으로 쓸고 지나간다
      ctx.strokeStyle = '#e8eef2'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.r, 0); ctx.lineTo(58, 0); ctx.stroke();
      ctx.fillStyle = '#e8eef2';
      ctx.beginPath(); ctx.arc(64, 0, 9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  if (e.dash) {    // 돌진: 예고는 점선, 돌진 중엔 잔상
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.dash.angle);
    if (e.dash.stage === 'warn') {
      ctx.globalAlpha = 0.4 + e.dash.t;
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = e.color; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(e.r, 0); ctx.lineTo(W + H, 0); ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = e.color;
      ctx.beginPath(); ctx.arc(-24, 0, e.r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-48, 0, e.r * 0.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  if (e.wind) {    // 던지기 예고: 던질 방향으로 짧은 선(삼각김밥은 3갈래)이 자라나고, 몸 둘레 링이 맥동
    const k = e.wind.t / e.wind.dur, dirs = e.wind.kind === 'riceball' ? [-1, 0, 1] : [0];
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.globalAlpha = 0.35 + k * 0.6;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    for (const d of dirs) {
      const a = e.wind.angle + d * 15 * Math.PI / 180;
      ctx.moveTo(Math.cos(a) * (e.r + 4), Math.sin(a) * (e.r + 4));
      ctx.lineTo(Math.cos(a) * (e.r + 12 + k * 34), Math.sin(a) * (e.r + 12 + k * 34));
    }
    ctx.stroke();
    ctx.strokeStyle = e.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, e.r + 6 + Math.sin(k * Math.PI) * 6, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  drawBossFace(e.x, e.y, e.r, e);
  if (e.flash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, Math.PI * 2); ctx.fill();
  }
  const bw = 64, bx = e.x - bw / 2, by = e.y - e.r - 16;   // 머리 위 HP 바
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, by, bw, 7);
  ctx.fillStyle = e.color; ctx.fillRect(bx, by, bw * Math.max(0, e.hpShown / e.maxHp), 7);
}

function drawBossShots() {
  for (const s of bossShots) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin);
    if (s.kind === 'riceball') {        // 삼각김밥: 김 삼각형 + 밥 띠
      ctx.fillStyle = '#1d2a1e';
      ctx.beginPath(); ctx.moveTo(0, -s.r * 1.3); ctx.lineTo(s.r * 1.2, s.r * 0.8); ctx.lineTo(-s.r * 1.2, s.r * 0.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-s.r * 0.35, -s.r * 0.2, s.r * 0.7, s.r * 0.9);
    } else if (s.kind === 'tray') {     // 식판: 회색 원반 + 반찬 칸 3개
      ctx.fillStyle = '#c8ccd0';
      ctx.beginPath(); ctx.arc(0, 0, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b7075';
      for (let k = 0; k < 3; k += 1) {
        const a = k * Math.PI * 2 / 3;
        ctx.beginPath(); ctx.arc(Math.cos(a) * s.r * 0.5, Math.sin(a) * s.r * 0.5, s.r * 0.28, 0, Math.PI * 2); ctx.fill();
      }
    } else {                            // 덤벨: 봉 + 양끝 원판
      ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s.r, 0); ctx.lineTo(s.r, 0); ctx.stroke();
      ctx.fillStyle = '#3a3f44';
      ctx.fillRect(-s.r - 4, -s.r * 0.6, 6, s.r * 1.2);
      ctx.fillRect(s.r - 2, -s.r * 0.6, 6, s.r * 1.2);
    }
    ctx.restore();
  }
}

function drawLaser() {
  if (!laser) return;
  const w = Math.max(3, laser.w), color = PHASES[phaseIdx].color;
  const g = ctx.createLinearGradient(laser.x - w / 2, 0, laser.x + w / 2, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.3, color);
  g.addColorStop(0.5, '#ffffff');
  g.addColorStop(0.7, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.shadowColor = '#fff'; ctx.shadowBlur = 30;   // 글로우
  ctx.fillStyle = g;
  ctx.fillRect(laser.x - w / 2, HUD_H, w, H - HUD_H);
  ctx.restore();
}

function drawMissiles() {
  for (const m of missiles) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle);
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(-8, -3, 14, 6);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(12, 0); ctx.lineTo(6, 3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawPlayer() {
  ctx.save();
  if (player.inv > 0 && Math.floor(time * 20) % 2 === 0) ctx.globalAlpha = 0.4;   // 무적 깜빡임
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#ff6b35'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#17223b';
  ctx.font = '900 14px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('나', player.x, player.y + 1);
  ctx.restore();
}

function drawJoystick() {
  if (!joy.active) return;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(joy.ox, joy.oy, JOY_MAX, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.arc(joy.ox + joy.dx * JOY_MAX, joy.oy + joy.dy * JOY_MAX, 20, 0, Math.PI * 2); ctx.fill();
}

function drawHud() {
  ctx.fillStyle = PHASES[phaseIdx].bg;   // 불투명하게 먼저 깔아야 HUD 뒤에서 스폰되는 적이 비치지 않는다
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.textBaseline = 'middle';

  for (let i = 0; i < player.maxHp; i += 1) {   // 하트 = 원
    ctx.beginPath(); ctx.arc(16 + i * 17, 20, 6, 0, Math.PI * 2);
    if (i < player.hp) { ctx.fillStyle = '#e63946'; ctx.fill(); }
    else { ctx.strokeStyle = '#e63946'; ctx.lineWidth = 2; ctx.stroke(); }
  }
  ctx.fillStyle = '#fff';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('₩ ' + money.toLocaleString('ko-KR'), W / 2, 20);
  ctx.font = '700 14px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Lv.' + level, W - 50, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(W - 40, 4, 32, 32);   // 일시정지 버튼 32×32 — 폰엔 P 키가 없어서
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillRect(W - 29, 12, 4, 16); ctx.fillRect(W - 19, 12, 4, 16);

  // 120초 진행 바 + 아침/점심/저녁 눈금 + 보스 예고 빨간 눈금
  const bx = 12, bw = W - 24, by = 38, bh = 6;
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = PHASES[phaseIdx].color; ctx.fillRect(bx, by, bw * Math.min(1, time / DAY), bh);
  ctx.fillStyle = '#fff';
  ctx.fillRect(bx + bw / 3 - 1, by - 2, 2, bh + 4);
  ctx.fillRect(bx + bw * 2 / 3 - 1, by - 2, 2, bh + 4);
  ctx.fillStyle = '#e63946';
  for (const b of BOSSES) ctx.fillRect(bx + bw * b.at / DAY - 1, by - 3, 2, bh + 6);
  ctx.font = '700 14px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  if (night) {   // 밤: 바는 가득 찬 채로 남고, 눈금 자리에 남은 보스 수
    ctx.fillStyle = '#fff';
    ctx.fillText('밤 · 남은 보스 ' + (BOSSES.length - bossKills) + '명', W / 2, 54);
  } else PHASES.slice(0, stamps.length).forEach((p, i) => {
    const cx = bx + bw * (i + 0.5) / 3;
    ctx.fillStyle = i === phaseIdx ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.fillText(p.name, cx - 8, 54);
    ctx.beginPath(); ctx.arc(cx + 12, 54, 4, 0, Math.PI * 2);   // 스탬프 점: 완료 채움 / 대기 테두리 / 놓침 회색
    if (stamps[i] === 'done') { ctx.fillStyle = p.color; ctx.fill(); }
    else if (stamps[i] === 'miss') { ctx.fillStyle = '#666'; ctx.fill(); }
    else { ctx.strokeStyle = p.color; ctx.lineWidth = 1.5; ctx.stroke(); }
  });

  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, HUD_H - 4, W, 3);   // 경험치 바
  ctx.fillStyle = '#fff'; ctx.fillRect(0, HUD_H - 4, W * Math.min(1, xp / nextXp), 3);

  // 살아 있는 보스마다 한 줄(이름 + HP), 위에서 아래로 최대 3줄
  enemies.filter((e) => e.boss && !e.dead).slice(0, 3).forEach((boss, i) => {
    const y = HUD_H + i * 18;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, y, W, 18);
    ctx.fillStyle = boss.color;
    ctx.font = '700 14px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(boss.name, 12, y + 9);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(140, y + 5, W - 152, 8);
    ctx.fillStyle = boss.color; ctx.fillRect(140, y + 5, (W - 152) * Math.max(0, boss.hpShown / boss.maxHp), 8);
  });
}

function drawIntro() {
  const b = intro.boss;
  // 0→1 진행률을 "빠르게 시작해서 천천히 멈추는" 곡선으로 (Back은 살짝 지나쳤다가 돌아옴)
  const clamp01 = (t) => Math.min(1, Math.max(0, t));
  const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
  const easeOutBack = (t) => { const c = 1.70158, x = clamp01(t) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  // 왼쪽에서 초상이 "팍" — 오른쪽에서 이름판이 살짝 오버슈트
  const faceX = reduceMotion ? W / 3 : -160 + (W / 3 + 160) * easeOutCubic(intro.t / 0.45);
  drawBossFace(faceX, H * 0.4, 44, b);

  const plateW = 230, endX = W - plateW - 14;
  const plateX = reduceMotion ? endX : W + 40 + (endX - W - 40) * easeOutBack((intro.t - 0.15) / 0.5);
  const plateY = H * 0.6;
  ctx.save();
  ctx.translate(plateX, plateY);
  ctx.transform(1, 0, -0.35, 1, 0, 0);   // 사선 블록
  ctx.fillStyle = b.color; ctx.fillRect(0, -30, plateW, 60);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, -30, plateW, 5);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 25, plateW, 5);
  ctx.restore();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#17223b'; ctx.lineJoin = 'round';   // 밝은 블록 위 흰 글씨라 외곽선으로 대비 확보
  ctx.font = '700 14px "Noto Sans KR", sans-serif';
  ctx.lineWidth = 3; ctx.strokeText(b.label, plateX + 22, plateY - 13);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(b.label, plateX + 22, plateY - 13);
  ctx.font = '900 22px "Noto Sans KR", sans-serif';
  ctx.lineWidth = 4; ctx.strokeText(b.name, plateX + 18, plateY + 10);
  ctx.fillStyle = '#fff';
  ctx.fillText(b.name, plateX + 18, plateY + 10);

  if (Math.floor(intro.t * 6) % 2 === 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e63946';
    ctx.font = '900 14px "JetBrains Mono", monospace';
    ctx.fillText('B O S S', W / 2, H - 40);
  }
}

function loop(now) {
  const dt = Math.min(now - last, 50) / 1000;   // 탭 전환 등으로 커진 dt는 50ms로 자름
  last = now;
  if (mode === 'play') {
    if (hitStop > 0) hitStop -= dt;   // 히트스톱: 이 프레임은 멈춤
    else update(dt);
  } else if (mode === 'intro') {   // 컷신: 시간만 흐르고 게임은 멈춤
    intro.t += dt;
    updateEffects(dt);
    if (intro.t >= intro.dur) {
      spawnBoss(intro.boss); intro = null; mode = 'play';
      if (pauseAfterIntro) { pauseAfterIntro = false; pauseGame(); }   // 컷신 중 탭을 떠났으면 끝나는 즉시 멈춤
    }
  } else if (mode === 'dying') {   // 죽는 순간: 0.8초 슬로모(×0.25), 입력 없음
    const s = dt * 0.25;
    dying -= dt;
    updateBullets(s); updateEnemies(s); updateBossShots(s); updateEffects(s);
    if (dying <= 0) endGame(false);
  } else if (mode !== 'idle') updateEffects(dt);   // 오버레이 뒤에서 떨림·배너가 굳어 있지 않게
  draw();
  requestAnimationFrame(loop);
}

resetState();
renderHud();
requestAnimationFrame((now) => { last = now; loop(now); });
