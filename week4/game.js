/* ==========================================================================
   1. 설정·표 — 여기 숫자만 바꿔도 게임이 바뀐다
   ========================================================================== */
const W = 360;
const H = 600;
const HUD_H = 70;           // 위쪽 HUD 띠. 이 아래가 운동장
const DAY = 120;            // 한 판 = 120초 = 하루
const MEAL_PRICE = 5500;    // 학생식당 한 끼 (결과 화면 "N끼 분량")
const MAX_ENEMIES = 60;
const BULLET_SPEED = 420;
const JOY_DEAD = 8;
const JOY_MAX = 48;
const BEST_KEY = 'campusSurvivorBest';

const PHASES = [
  { name: '아침', from: 0,  to: 40,  color: '#00aeef', bg: '#16323d', spawnEvery: 1.0,  enemies: ['delivery'],                   hpBonus: 0, bonus: 3000 },
  { name: '점심', from: 40, to: 80,  color: '#d4a574', bg: '#2b2a24', spawnEvery: 0.65, enemies: ['delivery', 'dining'],         hpBonus: 0, bonus: 4500 },
  { name: '저녁', from: 80, to: 120, color: '#ff6b35', bg: '#1a1420', spawnEvery: 0.45, enemies: ['delivery', 'dining', 'taxi'], hpBonus: 1, bonus: 8000 },
];

const ENEMY_TYPES = {
  delivery: { name: '배달', shape: 'triangle', color: '#3ddc84', r: 11, hp: 1, speed: 70,  won: 3000,  loseText: '배달에 넘어갔다' },
  dining:   { name: '외식', shape: 'square',   color: '#e63946', r: 13, hp: 3, speed: 50,  won: 10000, loseText: '결국 외식했다' },
  taxi:     { name: '택시', shape: 'rect',     color: '#ffd166', r: 12, hp: 2, speed: 120, won: 8000,  loseText: '택시 탔다' },
};

const BOSSES = [
  { at: 30,  name: 'GS25 아주머니',    label: '아침의 시험', look: 'ajumma', color: '#00aeef', hp: 20, speed: 40, won: 15000, gems: 8,  loseText: 'GS25 아주머니한테 붙잡혔다' },
  { at: 70,  name: '학생식당 아주머니', label: '점심의 시험', look: 'ajumma', color: '#d4a574', hp: 30, speed: 40, won: 20000, gems: 10, loseText: '학생식당 아주머니한테 붙잡혔다' },
  { at: 110, name: '트러스트짐 헬창',   label: '저녁의 시험', look: 'gymbro', color: '#ff6b35', hp: 45, speed: 55, won: 30000, gems: 12, loseText: '헬창한테 깔렸다' },
];

const UPGRADES = [
  { name: '도장 연타',   desc: '발사 간격 20% 단축',   apply: (p) => { p.fireEvery = Math.max(0.15, p.fireEvery * 0.8); } },
  { name: '도장 하나 더', desc: '한 번에 한 발 더 (부채꼴)', apply: (p) => { p.shots += 1; } },
  { name: '꽝 도장',     desc: '적을 하나 더 뚫고 지나감', apply: (p) => { p.pierce += 1; } },
  { name: '든든한 아침', desc: '최대 하트 +1, 하트 +1',   apply: (p) => { p.maxHp += 1; p.hp += 1; } },
  { name: '빠른 걸음',   desc: '이동 속도 +15%',        apply: (p) => { p.speed *= 1.15; } },
  { name: '큰 가방',     desc: '젬 자석 범위 +40',      apply: (p) => { p.magnet += 40; } },
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
  money: $('hud-money'),
  best: $('hud-best'),
  status: $('status'),
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let mode = 'idle';          // idle | play | levelup | pause | intro | over
let time, phaseIdx, bossIdx;
let player, enemies, bullets, gems, particles, floats;
let stamps, money, xp, nextXp, level, kills, bossKills, lastHit;
let spawnTimer, fireTimer, hintTimer = 0, played = false;
let shake, hitStop, hurtFlash, banner, intro, choices = [];
let best = 0;
try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (_) {}   // 저장소가 막힌 브라우저에서도 게임은 돌아가야 해서
let last = 0;

function resetState() {
  time = 0; phaseIdx = 0; bossIdx = 0;
  player = { x: W / 2, y: (H + HUD_H) / 2, r: 14, hp: 3, maxHp: 3, inv: 0, speed: 170, fireEvery: 0.5, shots: 1, pierce: 0, magnet: 60 };
  enemies = []; bullets = []; gems = []; particles = []; floats = [];
  stamps = ['wait', 'wait', 'wait'];
  money = 0; xp = 0; nextXp = 5; level = 1; kills = 0; bossKills = 0; lastHit = null;
  spawnTimer = 0.8; fireTimer = 0.3;
  shake = { power: 0, time: 0 }; hitStop = 0; hurtFlash = 0; banner = null; intro = null;
}

function setStatus(text) { dom.status.textContent = text; }
function showBanner(text) { banner = { text, life: 1.6, max: 1.6 }; }
function renderHud() {
  dom.money.textContent = '₩ ' + money.toLocaleString('ko-KR');
  dom.best.textContent = '₩ ' + best.toLocaleString('ko-KR');
}
function rand(a, b) { return a + Math.random() * (b - a); }

/* ==========================================================================
   3. 입력 — 키보드(WASD/방향키) + 플로팅 조이스틱(터치)
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
  if (e.target.closest && e.target.closest('a')) return;   // 링크에 포커스가 있으면 Enter는 링크 이동
  const k = e.key, c = e.code;
  if (k === ' ' || k === 'Enter') {
    if (mode === 'idle' || mode === 'over') { e.preventDefault(); startGame(); }
    else if (mode === 'pause') resumeGame();
    return;
  }
  if (c === 'KeyP' || k === 'Escape') {
    if (mode === 'play') pauseGame(); else if (mode === 'pause') resumeGame();
    return;
  }
  if (mode === 'levelup' && (c === 'Digit1' || c === 'Digit2' || c === 'Digit3')) { applyUpgrade(Number(c.slice(-1)) - 1); return; }
  if (KEYMAP[c]) { keys[KEYMAP[c]] = true; if (mode === 'play') e.preventDefault(); }
});
document.addEventListener('keyup', (e) => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });

canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'play' || joy.active) return;   // 첫 손가락만
  const p = toCanvasXY(e);
  if (p.y < HUD_H) return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  joy.active = true; joy.id = e.pointerId; joy.ox = p.x; joy.oy = p.y; joy.dx = 0; joy.dy = 0;
  hintTimer = 0;
});
canvas.addEventListener('pointermove', (e) => {
  if (!joy.active || e.pointerId !== joy.id) return;
  const p = toCanvasXY(e);
  const dx = p.x - joy.ox, dy = p.y - joy.oy;
  const d = Math.hypot(dx, dy);
  if (d < JOY_DEAD) { joy.dx = 0; joy.dy = 0; return; }
  const ratio = Math.min(d, JOY_MAX) / JOY_MAX;   // 많이 끌수록 빠르게
  joy.dx = dx / d * ratio; joy.dy = dy / d * ratio;
});
function endJoy(e) { if (joy.id === e.pointerId) { joy.active = false; joy.id = null; joy.dx = 0; joy.dy = 0; } }
canvas.addEventListener('pointerup', endJoy);
canvas.addEventListener('pointercancel', endJoy);

document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') pauseGame(); });
$('btn-start').addEventListener('click', startGame);
$('btn-restart').addEventListener('click', startGame);
$('btn-resume').addEventListener('click', resumeGame);
dom.upBtns.forEach((btn, i) => btn.addEventListener('click', () => applyUpgrade(i)));

/* ==========================================================================
   4. 스폰·발사
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
  enemies.push({
    name: T.name, shape: T.shape, color: T.color, x, y, r: T.r,
    hp: T.hp + phase.hpBonus, maxHp: T.hp + phase.hpBonus, speed: T.speed, won: T.won, loseText: T.loseText,
    flash: 0, angle: 0, boss: false, dead: false,
  });
}

function shoot() {
  let target = null, nearest = Infinity;
  for (const e of enemies) {
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d < nearest) { nearest = d; target = e; }
  }
  if (!target) return;
  const base = Math.atan2(target.y - player.y, target.x - player.x);
  const n = player.shots, spread = 12 * Math.PI / 180;
  for (let i = 0; i < n; i += 1) {
    const a = base + (i - (n - 1) / 2) * spread;
    bullets.push({ x: player.x, y: player.y, vx: Math.cos(a) * BULLET_SPEED, vy: Math.sin(a) * BULLET_SPEED, r: 5, left: 1 + player.pierce, hit: [], color: PHASES[phaseIdx].color });
  }
}

/* ==========================================================================
   5. 업데이트·충돌 — 모든 충돌은 hitCircle 한 줄
   ========================================================================== */
function hitCircle(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r; }

function update(dt) {
  time += dt;
  if (time >= DAY) { endGame(true); return; }

  const idx = PHASES.findIndex((p) => time < p.to);
  if (idx !== phaseIdx) {
    for (let i = 0; i < idx; i += 1) if (stamps[i] === 'wait') stamps[i] = 'miss';   // 지나간 시간대 스탬프는 놓침
    phaseIdx = idx;
    showBanner(PHASES[idx].name + ' · ' + PLACES[idx].name + ' 영업 시작');
  }
  if (bossIdx < BOSSES.length && time >= BOSSES[bossIdx].at) { startBossIntro(BOSSES[bossIdx]); bossIdx += 1; return; }

  movePlayer(dt);
  spawnTimer -= dt;
  if (spawnTimer <= 0) { spawnEnemy(); spawnTimer = PHASES[phaseIdx].spawnEvery; }
  fireTimer -= dt;
  if (fireTimer <= 0 && enemies.length) { shoot(); fireTimer = player.fireEvery; }

  updateBullets(dt);
  updateEnemies(dt);
  if (mode !== 'play') return;   // 방금 죽어서 결과 화면이 떴으면 여기서 멈춤
  updateGems(dt);
  updateEffects(dt);

  const place = PLACES[phaseIdx];
  if (stamps[phaseIdx] === 'wait' && hitCircle(player, place)) {
    stamps[phaseIdx] = 'done';
    money += PHASES[phaseIdx].bonus;
    player.hp = Math.min(player.maxHp, player.hp + 1);
    addFloat(place.x, place.y - 50, '+' + PHASES[phaseIdx].bonus.toLocaleString('ko-KR'), PHASES[phaseIdx].color, 18);
    addParticles(place.x, place.y, PHASES[phaseIdx].color, 12, 140, 0.6);
    showBanner(PHASES[phaseIdx].name + ' 스탬프 ' + place.name + '!');
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
    e.angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(e.angle) * e.speed * dt;
    e.y += Math.sin(e.angle) * e.speed * dt;
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
    if (hitCircle(g, player)) { gems.splice(i, 1); xp += 1; }
  }
}

/* ==========================================================================
   6. 성장 — 레벨업 특전
   ========================================================================== */
function openLevelUp() {
  mode = 'levelup';
  xp -= nextXp;
  level += 1;
  nextXp += 3 + level;
  const pool = [...UPGRADES];   // 뽑은 건 pool에서 빼니까 중복이 없다
  choices = [];
  while (choices.length < 3) choices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  choices.forEach((u, i) => {
    dom.upBtns[i].querySelector('.up-name').textContent = (i + 1) + '. ' + u.name;
    dom.upBtns[i].querySelector('.up-desc').textContent = u.desc;
  });
  resetInput();
  dom.levelup.hidden = false;
  dom.upBtns[0].focus();
  setStatus('레벨 ' + level + '! 특전을 고르세요');
}

function applyUpgrade(i) {
  if (mode !== 'levelup' || !choices[i]) return;
  choices[i].apply(player);
  dom.levelup.hidden = true;
  mode = 'play';
  setStatus(choices[i].name + ' 획득');
  addFloat(player.x, player.y - 30, choices[i].name, '#ffd166', 15);
}

/* ==========================================================================
   7. 보스·컷신·타격감 — particles, floats, shake, hitStop
   ========================================================================== */
function startBossIntro(b) {
  mode = 'intro';
  intro = { boss: b, t: 0, dur: reduceMotion ? 1.2 : 1.6 };
  resetInput();
  setStatus('보스 등장: ' + b.name);
}

function spawnBoss(b) {
  enemies.push({
    name: b.name, look: b.look, color: b.color, x: W / 2, y: HUD_H - 40, r: 26,
    hp: b.hp, maxHp: b.hp, hpShown: b.hp, speed: b.speed, won: b.won, gems: b.gems, loseText: b.loseText,
    flash: 0, angle: 0, boss: true, dead: false,
  });
  particles.push({ kind: 'ring', x: W / 2, y: HUD_H + 10, r: 10, life: 0.6, max: 0.6, color: b.color });
  addShake(4, 0.3);
  showBanner(b.name + ' 등장!');
}

function hurtEnemy(e, b) {
  e.hp -= 1;
  e.flash = 0.08;
  const len = Math.hypot(b.vx, b.vy), push = e.boss ? 3 : 8;
  e.x += b.vx / len * push; e.y += b.vy / len * push;
  addParticles(e.x, e.y, '#ffffff', 3, 120, 0.25);
  if (e.boss) addShake(2, 0.1);
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  e.dead = true;
  kills += 1;
  money += e.won;
  addParticles(e.x, e.y, e.color, e.boss ? 16 : 6 + Math.floor(Math.random() * 3), 170, 0.45);
  addFloat(e.x, e.y - e.r, '+' + e.won.toLocaleString('ko-KR'), e.boss ? '#ffffff' : '#ffd166', e.boss ? 20 : 13);
  if (reduceMotion === false) hitStop = 0.045;
  if (e.boss) {
    bossKills += 1;
    addShake(8, 0.35);
    for (let i = 0; i < e.gems; i += 1) gems.push({ x: e.x + rand(-40, 40), y: e.y + rand(-40, 40), r: 6 });
    setStatus(e.name + ' 퇴치!');
  } else {
    addShake(3, 0.12);
    gems.push({ x: e.x, y: e.y, r: 6 });
  }
  renderHud();
}

function hurtPlayer(e) {
  player.hp -= 1;
  player.inv = 0.8;
  lastHit = e;
  hurtFlash = 0.25;
  addShake(6, 0.25);
  if (player.hp <= 0) endGame(false);
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
   8. 시작·종료·일시정지
   ========================================================================== */
function startGame() {
  resetState();
  resetInput();
  dom.start.hidden = true; dom.over.hidden = true; dom.pause.hidden = true; dom.levelup.hidden = true;
  hintTimer = played ? 0 : 3;
  played = true;
  mode = 'play';
  last = performance.now();
  renderHud();
  setStatus('아침 · GS25로 가서 첫 스탬프를 찍자');
}

function pauseGame() { mode = 'pause'; resetInput(); dom.pause.hidden = false; setStatus('일시정지'); }
function resumeGame() { if (mode !== 'pause') return; dom.pause.hidden = true; mode = 'play'; last = performance.now(); setStatus(''); }

function endGame(won) {
  mode = 'over';
  resetInput();
  if (won) {
    const stampBonus = stamps.every((s) => s === 'done') ? 5000 : 0;
    const bossBonus = bossKills === 3 ? 10000 : 0;
    money += 20000 + player.hp * 5000 + stampBonus + bossBonus;
    dom.overTitle.textContent = '하루 완성!';
    dom.overReason.textContent = '정문 밖으로 한 번도 안 나갔다. 하루 완성 +20,000 · 남은 하트 ' + player.hp + '×5,000'
      + (stampBonus ? ' · 스탬프 3/3 +5,000' : '') + (bossBonus ? ' · 보스 3/3 +10,000' : '');
  } else {
    dom.overTitle.textContent = '결국 정문 밖으로 나갔다';
    dom.overReason.textContent = lastHit ? lastHit.loseText + '. (' + Math.floor(time) + '초 버팀)' : '';
  }
  if (money > best) { best = money; try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {} }
  $('res-money').textContent = '₩ ' + money.toLocaleString('ko-KR');
  $('res-meals').textContent = (money / MEAL_PRICE).toFixed(1) + '끼';
  $('res-stamps').textContent = stamps.map((s) => (s === 'done' ? '●' : '○')).join(' ') + ' ' + stamps.filter((s) => s === 'done').length + '/3';
  $('res-boss').textContent = bossKills + '/3';
  $('res-kills').textContent = kills + '마리';
  $('res-level').textContent = 'Lv.' + level;
  $('res-best').textContent = '₩ ' + best.toLocaleString('ko-KR');
  renderHud();
  dom.over.hidden = false;
  $('btn-restart').focus();
  setStatus(won ? '하루 완성! 아낀 돈 ₩' + money.toLocaleString('ko-KR') : '게임 종료. ' + (lastHit ? lastHit.loseText : ''));
}

/* ==========================================================================
   9. 그리기·루프
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
  ctx.font = '700 12px "JetBrains Mono", monospace';
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
  drawPlayer();

  for (const b of bullets) {
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI * 2); ctx.fill();
  }

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
  const open = i === phaseIdx, done = stamps[i] === 'done', miss = stamps[i] === 'miss';
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
  ctx.font = '700 12px "Noto Sans KR", sans-serif';
  ctx.fillText(p.name, 0, -8);
  ctx.font = '700 12px "Noto Sans KR", sans-serif';
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
  if (b.look === 'ajumma') {   // 앞치마(사다리꼴)
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.85); ctx.lineTo(r * 0.7, r * 0.85); ctx.lineTo(r * 1.05, r * 1.9); ctx.lineTo(-r * 1.05, r * 1.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-r * 0.25, r * 1.1, r * 0.5, r * 0.5);   // 앞치마 주머니
  } else {                     // 민소매 + 양팔 근육
    ctx.fillStyle = '#f5d3b3';
    ctx.beginPath(); ctx.arc(-r * 1.1, r * 1.25, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 1.1, r * 1.25, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = b.color;
    ctx.fillRect(-r * 0.7, r * 0.85, r * 1.4, r * 1.05);
  }
  ctx.fillStyle = '#f5d3b3';
  ctx.strokeStyle = '#17223b'; ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (b.look === 'ajumma') {   // 파마머리: 윗반원을 따라 곡선 여러 개
    ctx.fillStyle = '#3b2a20';
    for (let a = Math.PI * 1.02; a <= Math.PI * 1.99; a += Math.PI * 0.16) {
      ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, r * 0.3, 0, Math.PI * 2); ctx.fill();
    }
  } else {                     // 짧은 머리
    ctx.fillStyle = '#1f1a17';
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 1.12, Math.PI * 1.88); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = '#17223b'; ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();   // 눈
  ctx.moveTo(-r * 0.45, -r * 0.12); ctx.lineTo(-r * 0.18, -r * 0.12);
  ctx.moveTo(r * 0.18, -r * 0.12); ctx.lineTo(r * 0.45, -r * 0.12);
  ctx.stroke();
  ctx.beginPath();   // 입: 아주머니는 미소, 헬창은 굳은 입
  if (b.look === 'ajumma') ctx.arc(0, r * 0.25, r * 0.3, Math.PI * 0.15, Math.PI * 0.85);
  else { ctx.moveTo(-r * 0.3, r * 0.42); ctx.lineTo(r * 0.3, r * 0.42); }
  ctx.stroke();
  ctx.restore();
}

function drawBoss(e) {
  drawBossFace(e.x, e.y, e.r, e);
  if (e.flash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, Math.PI * 2); ctx.fill();
  }
  const bw = 64, bx = e.x - bw / 2, by = e.y - e.r - 16;   // 머리 위 HP 바
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, by, bw, 7);
  ctx.fillStyle = e.color; ctx.fillRect(bx, by, bw * Math.max(0, e.hpShown / e.maxHp), 7);
}

function drawPlayer() {
  ctx.save();
  if (player.inv > 0 && Math.floor(time * 20) % 2 === 0) ctx.globalAlpha = 0.4;   // 무적 깜빡임
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#ff6b35'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#17223b';
  ctx.font = '900 12px "Noto Sans KR", sans-serif';
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
  ctx.fillText('Lv.' + level, W - 12, 20);

  // 120초 진행 바 + 아침/점심/저녁 눈금
  const bx = 12, bw = W - 24, by = 38, bh = 6;
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = PHASES[phaseIdx].color; ctx.fillRect(bx, by, bw * Math.min(1, time / DAY), bh);
  ctx.fillStyle = '#fff';
  ctx.fillRect(bx + bw / 3 - 1, by - 2, 2, bh + 4);
  ctx.fillRect(bx + bw * 2 / 3 - 1, by - 2, 2, bh + 4);
  ctx.font = '700 12px "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  PHASES.forEach((p, i) => {
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

  const boss = enemies.filter((e) => e.boss).pop();
  if (boss) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, HUD_H, W, 18);
    ctx.fillStyle = boss.color;
    ctx.font = '700 13px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(boss.name, 12, HUD_H + 9);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(140, HUD_H + 5, W - 152, 8);
    ctx.fillStyle = boss.color; ctx.fillRect(140, HUD_H + 5, (W - 152) * Math.max(0, boss.hpShown / boss.maxHp), 8);
  }
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
  ctx.font = '700 12px "Noto Sans KR", sans-serif';
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
    if (intro.t >= intro.dur) { spawnBoss(intro.boss); intro = null; mode = 'play'; }
  }
  draw();
  requestAnimationFrame(loop);
}

resetState();
renderHud();
requestAnimationFrame((now) => { last = now; loop(now); });
