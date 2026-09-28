/* ==========================================================================
   1. 설정·표 — 여기 숫자만 바꿔도 게임이 바뀐다
   ========================================================================== */
const W = 360;
const H = 600;
const HUD_H = 70;           // 위쪽 HUD 띠. 이 아래가 운동장
const ON_TIME = 120;        // 이 안에 보스 셋을 다 잡으면 120초 클리어 보너스. 시간은 게임을 끝내지 않는다 — 보스만 끝낸다
const MAX_ENEMIES = 60;
const BULLET_SPEED = 420;
const JOY_DEAD = 8;
const JOY_MAX = 40;
const BEST_KEY = 'campusSurvivorBest';
const MUTE_KEY = 'campusSurvivorMuted';
const NEXT_XP_BASE = 2;     // 레벨업마다 다음 레벨까지 필요한 젬이 BASE + ceil(level × SLOPE)씩 늘어난다
const NEXT_XP_SLOPE = 0.6;
const SPAWN_MIN = 0.3;      // 보스전 스폰 가속 하한(초). 실제 하한은 max(SPAWN_MIN, spawnTo / 2)
const GEM_PULL_MAX = 320;   // 젬 자석: 거리 0에서 초속 px
const GEM_PULL_LAMBDA = 70; // 지수 감쇠 거리
const GEM_PULL_MIN = 5;     // 바닥값 — 아무 젬도 완전히 멈추지 않는다
const BOSS_GEM_SPEED = 220; // 보스 젬이 튀어나가는 초속
const GEM_DAMP = 0.9;       // 젬 튀는 속도의 프레임당 감쇠
const MAX_PARTICLES = 250;  // 파티클 상한 (addParticles 가드)
const MAX_FLOATS = 40;      // 떠오르는 숫자 상한 (addFloat 가드)
const HURT_FLASH = { color: '230,57,70', dur: 0.25, alpha: 0.6 };   // 피격 시 붉은 화면 비네트
const HURT_SHAKE = [6, 0.25];   // 피격 흔들림 [세기, 초]
const DYING = { dur: 0.8, rate: 0.25 };   // 하트 0: 결과창 전 dur초 동안 dt×rate 슬로모
const SLOWMO_RATE = 0.3;    // 슬로모 중 dt 배율
const SHAKE_MAX = 12;       // 흔들림 세기 상한
const FIRST_XP = 5;         // 첫 레벨업까지 필요한 젬
const CARD_GUARD_MS = 300;  // 카드가 열린 직후 이 시간 안의 클릭은 헛클릭으로 본다
const MOB_KILL_FX = { hitStop: 0.02, every: 0.5, shake: [3, 0.12] };   // 잡몹 처치: 히트스톱(초, every초에 한 번만) + 흔들림
const WIN_DELAY = 0.6;      // 마지막 보스 처치 → 결과창까지의 간격(게임 초). 사망 3박자가 화면에 보이도록
const END_BONUS = { clear: 5000, heart: 1500, zones: 3000, early: 5000 };   // 종료 보너스: 클리어 / 남은 하트 1개당 / 구역 3/3 / 120초 안 클리어
const DEBUG_LOG = false;    // true면 보스 처치 시각을 console.log로 남긴다
const PLAYER_HP = 3;        // 시작 하트. 최대 체력 패시브가 4/5/6으로 올린다
const PLAYER_SPEED = 190;   // 기본 이동 속도(초속 px). 폰 실측 뒤 170 → 190. 이동 속도 패시브가 213/238/267으로 올린다
const PLAYER_INV = 0.8;     // 맞은 뒤 무적(초). 무적 연장 패시브가 1.05/1.30/1.55로 올린다
const SHOT_SPREAD = 12;     // 탄 여러 발일 때 발 사이 각도(°)
const ORB_R = 8;            // 위성 구체 몸 반지름(접촉 판정·그리기)
const ORB_HIT_EVERY = 0.35; // 위성이 같은 적을 다시 때리기까지의 간격(초)
const PULSE_RING_DUR = 0.25;   // 펄스 링이 퍼지는 그림 시간(초)
const PUDDLE_SEEK_R = 220;  // 장판 밀집점을 찾는 범위: 플레이어 반경 안 적만 후보
const PUDDLE_TICK = 0.25;   // 장판 안 적에게 피해가 들어가는 간격(초)
const PUDDLE_COLOR = { player: '#4cc9f0', boss: '#e63946' };   // 장판 색: 내 것 / 보스 것
const MOB_PUSH = 8;         // 잡몹 피격 밀림(px). 넉백 패시브 값이 더해진다
const BOSS_PUSH = 3;        // 보스 피격 밀림(px). 진화 무기는 BOSS_PUSH_EVOLVED
const BOSS_PUSH_EVOLVED = 6;
const BOSS_KNOCK_RATE = 0.25;   // 넉백 패시브 값이 보스에게는 이 비율만 적용
const BOSS_SHAKE = 2;       // 보스 피격 흔들림. 진화 무기는 BOSS_SHAKE_EVOLVED
const BOSS_SHAKE_EVOLVED = 3;
const SCORE_CARD_VALUE = 500;   // 카드 후보가 모자랄 때 채우는 '점수 +500' 카드

// 보스 공통
const RAGE_AT = 0.5;        // hp 비율이 이 아래로 내려가면 광폭화 1회 → P2 (되돌아가지 않는다)
const ROAR_DUR = 0.6;       // 광폭화 정지(초). 공격 없음, 피해는 들어간다
const ROAR_FLASH = { color: '230,57,70', dur: 0.2, alpha: 0.35 };   // 광폭화 붉은 화면 플래시
const ROAR_SHAKE = 6;
const ROAR_SLOWMO = 0.25;   // 광폭화 슬로모(초)
const RAGE_LOOK = { color: '#e63946', brow: 15, ring: 6, amp: 3, hz: 12 };   // 광폭 외형: 테두리색 · 눈썹 기울기(°) · 링 r+6±3 12Hz
const PUDDLE_MAX = 3;       // 보스 장판 동시 최대(오래된 것부터 삭제)
const SOUP_AWAY = 120;      // 랜덤 장판은 플레이어에서 이 거리 밖으로 재추첨
const TELE_COLOR = { white: '#ffffff', red: '#e63946', yellow: '#ffd166' };   // 예고 색: 흰 = 장판·바닥 찍기 / 빨강 = 돌진 / 노랑 = 투사체
const TELE_GAUGE = { width: [1, 4], alpha: [0.3, 0.6] };   // 예고 게이지: 두께 1+4k, alpha 0.3+0.6k (k = 진행률)
const TELE_LINE = 46;       // 투사체 예고 짧은 선 길이(px)
const TELE_LONG = W + H;    // 돌진·밴드 예고 긴 선 길이(px) — 화면 끝까지
const TELE_OFFSET = 4;      // 예고 선이 보스 몸에서 떨어져 시작하는 거리(px)
const TELE_RING_R = 10;     // 원형 투사체 예고 링: 보스 반지름 + 이 값
const WALL_SHAKE = 5;       // 돌진이 벽에 닿을 때 흔들림 / 먼지 개수
const WALL_DUST = 8;
const SLAM_SHAKE = 6;       // 바닥 찍기 흔들림
const APPEAR_WAVE = { r: 140, push: 60, shake: [4, 0.3] };   // 보스 등장 파동: 반경 안 잡몹을 push만큼 밀어낸다 + 흔들림
const APPEAR_INV = 1.0;     // 컷신이 끝난 뒤 플레이어 무적(초)
const HEAD_BAR = { dx: -45, dy: -14, w: 90, h: 8 };   // 보스 머리 위 HP 바: 보스 중심 기준 x 오프셋 / 보스 윗머리 기준 y 오프셋 / 크기
const HP_GHOST_RATE = 3;    // HP 바 붉은 잔상이 따라오는 속도(초당 비율)
const BOSS_SHRINK = { scale: 0.94, dur: 0.08 };   // 보스 피격 수축: scale → 1.0을 dur 동안
const BOSS_DMG_FONT = { base: 12, per: 3 };       // 보스 피해 숫자 크기 = base + dmg × per
const HIT_PITCH = { from: 500, range: 600 };      // 피격음 피치(Hz): 보스 남은 HP가 적을수록 높다
const BOSS_DIE = { slowmo: 0.6, flash: 0.35, flashAlpha: 0.6, flashAlphaReduce: 0.25, shards: 30, rings: [0.5, 0.7, 0.9], font: 28, vibrate: [40, 30, 80], mobPush: 40, shake: [8, 0.35] };   // 보스 사망 3박자
const HEARTBEAT = { alpha: 0.12, amp: 0.08, hz: 6 };   // 하트 1일 때 붉은 비네트 맥동

// 구역은 시간이 아니라 보스가 넘긴다: 시작 bossAt초 뒤 그 구역의 보스가 나오고, 죽으면 다음 구역.
// spawnFrom→spawnTo: 시작→bossAt 사이 선형 보간. hpBonusAt: 구역 시작 후 그 초부터 hpBonus 적용(3구역 초반 난이도 벽 완화). bonus: 확보 지점 점수
const PHASES = [
  { name: '1구역', bossAt: 30, color: '#00aeef', bg: '#16323d', spawnFrom: 0.8,  spawnTo: 0.6,  enemies: ['runner'],                    hpBonus: 0, bonus: 500 },
  { name: '2구역', bossAt: 30, color: '#d4a574', bg: '#2b2a24', spawnFrom: 0.75, spawnTo: 0.55, enemies: ['runner', 'tank'],            hpBonus: 0, bonus: 800 },
  { name: '3구역', bossAt: 30, color: '#ff6b35', bg: '#1a1420', spawnFrom: 0.55, spawnTo: 0.40, enemies: ['runner', 'tank', 'sprinter'], hpBonus: 1, hpBonusAt: 15, bonus: 1200 },
];
const BOSS_ALIVE_SCORE = 0.5;   // 보스가 살아 있는 동안 잡몹 점수 50% — 보스를 두고 농성하지 못하게

const ENEMY_TYPES = {
  runner:   { name: '러너', shape: 'triangle', color: '#3ddc84', r: 11, hp: 1, speed: 85,  score: 100, loseText: '러너에게 당했다' },
  tank:     { name: '탱커', shape: 'square',   color: '#e63946', r: 13, hp: 3, speed: 50,  score: 300, loseText: '탱커에게 밀렸다' },
  sprinter: { name: '대시', shape: 'rect',     color: '#ffd166', r: 12, hp: 2, speed: 120, score: 250, loseText: '대시에 치였다' },
};

// PHASES와 같은 순서(i번째 구역의 보스). speed: [P1, P2]. phases: [[P1 패턴 2개], [P2 패턴 2개]] — id는 PATTERNS 키
const BOSSES = [
  { name: 'GS25 알바생',       label: '1구역 보스',  look: 'student', color: '#00aeef', hp: 80,  speed: [40, 55], score: 3000, gems: 8,  loseText: 'GS25 알바생에게 당했다',       phases: [['fan3', 'ring8'], ['fan5x2', 'ring12']] },
  { name: '학생식당 아주머니', label: '2구역 보스',  look: 'ajumma',  color: '#d4a574', hp: 200, speed: [35, 45], score: 5000, gems: 10, loseText: '학생식당 아주머니에게 당했다', phases: [['tray3', 'soup'], ['cart', 'soupBig']] },
  { name: '트러스트짐 헬창',   label: '마지막 보스', look: 'gymbro',  color: '#ff6b35', hp: 400, speed: [55, 70], score: 8000, gems: 12, loseText: '트러스트짐 헬창에게 당했다',   phases: [['dash1', 'dumbbell'], ['dash2', 'slam']] },
];
const BOSS_R = 40;   // 플레이어(14)의 약 3배. 폰에서 뭘 휘두르는지 보이게

// 보스 패턴 12개. tele: 예고 시간(초) / teleColor: 예고 색 / every: 쿨다운 / shape: 예고 모양(lines 짧은 선·line 긴 선·band 밴드·ring 원 테두리·spots 점선 원·slam 좁혀지는 원)
// fire(e, w, P): 예고가 다 차면 실행. count·retele: 같은 패턴을 재조준(retele초)해 count번. dirs: 발사 각도 오프셋(°). gap: 발 사이 간격(초). 보스는 돌진 중·광폭화 정지 중에만 멈춘다
const PATTERNS = {
  fan3:     { tele: 0.35, teleColor: 'yellow', every: 2.2, shape: 'lines', dirs: [-15, 0, 15],          kind: 'riceball', speed: 200, r: 11, life: 4, fire: fireFan },
  ring8:    { tele: 0.40, teleColor: 'yellow', every: 3.5, shape: 'ring',  n: 8,                         kind: 'riceball', speed: 160, r: 11, life: 4, fire: fireRing },
  fan5x2:   { tele: 0.35, teleColor: 'yellow', every: 2.5, shape: 'lines', dirs: [-24, -12, 0, 12, 24], kind: 'riceball', speed: 200, r: 11, life: 4, count: 2, retele: 0.25, fire: fireFan },
  ring12:   { tele: 0.40, teleColor: 'yellow', every: 3.0, shape: 'ring',  n: 12,                        kind: 'riceball', speed: 170, r: 11, life: 4, fire: fireRing },
  tray3:    { tele: 0.40, teleColor: 'yellow', every: 3.0, shape: 'lines', dirs: [-10, 0, 10], gap: 0.15, kind: 'tray',    speed: 260, r: 14, life: 4, bounces: 1, fire: fireLine },
  soup:     { tele: 0.60, teleColor: 'white',  every: 5.0, shape: 'spots', n: 1, r: 70,  dur: 4, fire: pourSoup },
  cart:     { tele: 0.60, teleColor: 'red',    every: 4.0, shape: 'band',  width: 80, speed: 520, go: 0.6, puddle: { r: 50, dur: 3 }, fire: startDash },
  soupBig:  { tele: 0.80, teleColor: 'white',  every: 6.0, shape: 'spots', n: 3, r: 90,  dur: 5, fire: pourSoup },
  dash1:    { tele: 0.60, teleColor: 'red',    every: 3.5, shape: 'line',  speed: 520, go: 0.5, fire: startDash },
  dumbbell: { tele: 0.30, teleColor: 'yellow', every: 5.0, shape: 'lines', dirs: [0],                    kind: 'dumbbell', speed: 260, r: 16, life: 8, bounces: 2, fire: fireLine },
  dash2:    { tele: 0.60, teleColor: 'red',    every: 4.0, shape: 'line',  speed: 560, go: 0.5, count: 2, retele: 0.4, fire: startDash },
  slam:     { tele: 0.70, teleColor: 'white',  every: 4.5, shape: 'slam',  r: 120, dur: 0.15, fire: fireSlam },
};

// 특전 카드 색. evolve는 진화 배너·'진화 재료' 배지 색
const TIERS = {
  weapon:    { label: '무기', color: '#4cc9f0' },
  passive:   { label: '',     color: '#ffd166' },
  legendary: { label: '전설', color: '#ffe066' },
  evolve:    { label: '진화', color: '#c77dff' },
};
const SLOTS = { weapon: 3, passive: 4 };   // 칸이 차면 새 종류는 카드에 안 나온다
const LEGEND_RATE = 0.01;   // 카드마다 전설 판정 확률
const OWNED_WEIGHT = 3;     // 카드 추첨 가중치: 보유 특전 3 : 새 특전 1
const EVOLVE_DUR = 1.0;     // 진화 합체 연출(초). 게임은 계속 돈다
const EVOLVE_FX = { stop: 0.3, flashDur: 0.3, flashAlpha: 0.5, shards: 24, shake: 8 };   // 히트스톱 → 흰 플래시 → 보라 파편 + 흔들림

// 특전 13종. kind: weapon(만렙 5) / passive(만렙 3) / legendary(레벨 없음, 무기 칸 차지 안 함).
// perLevel[n-1] = Lv n 수치(무기는 {n,dmg,...}, 패시브는 숫자 하나). every: 발동 주기(초). pair: 진화 짝.
// desc[0] = 새 카드의 기본 동작 한 줄, desc[n-1] = Lv n으로 올릴 때의 효과 한 줄
const UPGRADES = [
  { id: 'shot',   name: '탄',   tier: 'weapon', kind: 'weapon', max: 5, pair: 'might', every: 0.5,
    perLevel: [{ n: 1, dmg: 1, pierce: 0, r: 5 }, { n: 1, dmg: 2, pierce: 0, r: 5 }, { n: 2, dmg: 2, pierce: 0, r: 5 }, { n: 2, dmg: 2, pierce: 1, r: 5 }, { n: 3, dmg: 3, pierce: 1, r: 5 }],
    desc: ['0.5초마다 가장 가까운 적에게 탄 1발 · 피해 1', '피해 1 → 2', '2발 (12° 부채꼴)', '관통 +1', '3발 · 피해 3'] },
  { id: 'orbit',  name: '위성', tier: 'weapon', kind: 'weapon', max: 5, pair: 'speed',
    perLevel: [{ n: 1, r: 55, dmg: 1, spin: 3 }, { n: 2, r: 55, dmg: 1, spin: 3 }, { n: 2, r: 55, dmg: 2, spin: 3 }, { n: 3, r: 65, dmg: 2, spin: 3 }, { n: 4, r: 65, dmg: 3, spin: 4 }],
    desc: ['주위를 도는 구체 1개 · 반경 55 · 닿으면 피해 1', '구체 2개', '피해 2', '구체 3개 · 반경 65', '구체 4개 · 피해 3 · 더 빠르게'] },
  { id: 'pulse',  name: '펄스', tier: 'weapon', kind: 'weapon', max: 5, pair: 'hp', every: 0.5,
    perLevel: [{ r: 45, dmg: 1 }, { r: 55, dmg: 1 }, { r: 55, dmg: 2 }, { r: 65, dmg: 2 }, { r: 75, dmg: 3 }],
    desc: ['0.5초마다 반경 45 안 모든 적에게 피해 1', '반경 55', '피해 2', '반경 65', '반경 75 · 피해 3'] },
  { id: 'puddle', name: '장판', tier: 'weapon', kind: 'weapon', max: 5, pair: 'area', every: 2.5,
    perLevel: [{ r: 40, dur: 2, dmg: 1, n: 1, grow: 1 }, { r: 50, dur: 2, dmg: 1, n: 1, grow: 1 }, { r: 50, dur: 2, dmg: 1, n: 2, grow: 1 }, { r: 50, dur: 3, dmg: 1, n: 2, grow: 1 }, { r: 60, dur: 3, dmg: 2, n: 2, grow: 1 }],
    desc: ['2.5초마다 적이 가장 많은 곳에 바닥 피해 구역 · 반경 40 · 2초 · 피해 1', '반경 50', '동시 2개', '지속 3초', '반경 60 · 피해 2'] },
  { id: 'cooldown', name: '연사',      tier: 'passive', kind: 'passive', max: 3, pair: null,     perLevel: [0.88, 0.77, 0.68], desc: ['탄·펄스·장판 주기 ×0.88', '주기 ×0.77', '주기 ×0.68'] },
  { id: 'speed',    name: '이동 속도', tier: 'passive', kind: 'passive', max: 3, pair: 'orbit',  perLevel: [213, 238, 267],    desc: ['이동 속도 190 → 213', '이동 속도 238', '이동 속도 267'] },
  { id: 'hp',       name: '최대 체력', tier: 'passive', kind: 'passive', max: 3, pair: 'pulse',  perLevel: [4, 5, 6],          desc: ['최대 하트 4 · 하트 +1', '최대 하트 5 · 하트 +1', '최대 하트 6 · 하트 +1'] },
  { id: 'inv',      name: '무적 연장', tier: 'passive', kind: 'passive', max: 3, pair: null,     perLevel: [1.05, 1.30, 1.55], desc: ['맞은 뒤 무적 1.05초', '무적 1.30초', '무적 1.55초'] },
  { id: 'might',    name: '공격력',    tier: 'passive', kind: 'passive', max: 3, pair: 'shot',   perLevel: [1.3, 1.6, 1.9],    desc: ['모든 무기 피해 ×1.3', '피해 ×1.6', '피해 ×1.9'] },
  { id: 'area',     name: '범위',      tier: 'passive', kind: 'passive', max: 3, pair: 'puddle', perLevel: [1.15, 1.32, 1.52], desc: ['위성·펄스·장판·탄 범위 ×1.15', '범위 ×1.32', '범위 ×1.52'] },
  { id: 'knock',    name: '넉백',      tier: 'passive', kind: 'passive', max: 3, pair: null,     perLevel: [12, 24, 36],       desc: ['맞은 적이 12px 더 밀려난다 (보스는 25%)', '24px 더', '36px 더'] },
  { id: 'laser',   name: '스윕 빔', tier: 'legendary', kind: 'legendary', max: 1, pair: null, perLevel: [1], desc: ['6초마다 빔이 화면을 왼쪽→오른쪽으로 훑는다 · 적마다 스윕당 피해 6'] },
  { id: 'missile', name: '유도탄',  tier: 'legendary', kind: 'legendary', max: 1, pair: null, perLevel: [1], desc: ['1초마다 가장 가까운 적(보스 우선)을 끝까지 쫓는 탄 · 피해 4 · 착탄 반경 36에 2'] },
];
const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
const SCORE_CARD = { id: 'score', name: '점수 +' + SCORE_CARD_VALUE, tier: 'passive', kind: 'score', desc: ['특전 대신 점수를 바로 받는다'] };

// 진화: 무기 만렙 + 짝 패시브 Lv1 이상이면 카드 적용 직후 자동 합체. stats가 perLevel보다 우선한다
const EVOLUTIONS = [
  { result: 'bigshot',   name: '대구경탄',  needs: ['shot', 'might'],  stats: { n: 3, dmg: 6, pierce: Infinity, r: 10 } },
  { result: 'ring',      name: '위성군',    needs: ['orbit', 'speed'], stats: { n: 6, r: 90, dmg: 4, spin: 5, push: 24 } },   // push: 접촉 넉백
  { result: 'shockwave', name: '충격파',    needs: ['pulse', 'hp'],    stats: { r: 110, dmg: 3, slow: 0.4 } },              // slow: 안의 적 이동속도 −40%, 안에서 죽은 적의 젬 즉시 흡수
  { result: 'bigpuddle', name: '광역 장판', needs: ['puddle', 'area'], stats: { r: 60, grow: 1.8, dur: 4.5, dmg: 2, n: 1 } },   // 2.5초마다 1개, 4.5초 지속이라 동시 2개
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
  score: $('hud-score'),
  best: $('hud-best'),
  mute: $('btn-mute'),
  status: $('status'),
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let mode = 'idle';          // idle | play | levelup | pause | intro | dying | over
let time, phaseIdx, phaseStart, bossCalled;   // phaseStart: 지금 구역이 시작된 시각. bossCalled: 이 구역의 보스를 이미 불렀다
let player, enemies, bullets, gems, particles, floats;
let bossShots, missiles, laser, laserTimer, missileTimer;
let orbs, orbAngle, orbHits, pulseTimer, pulseFx, puddleTimer, puddles, evolveFx;   // 위성 각도·재타격 Map / 펄스 타이머·링 그림 / 장판 타이머·목록 / 진화 연출
let zones, score, xp, nextXp, level, kills, bossKills, lastHit;   // zones[i]: 'wait' | 'done' | 'miss'
let spawnTimer, spawnCount, bossWarned, fireTimer, hintTimer = 0, played = false;
let shake, hitStop, lastHitStop, screenFlash, banner, intro, dying, choices = [];   // screenFlash: { color:'r,g,b', life, max, alpha } | null
let slowmo, levelupAt = 0, pauseAfterIntro = false;   // slowmo: 남은 슬로모 초 / 카드 오픈 시각 / 컷신 중 탭 이탈
let winAt = 0, statusBeforePause = '';   // winAt: 마지막 보스 처치 뒤 결과창을 여는 시각(0이면 예약 없음) / 일시정지 직전 상태줄
let best = 0;
try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (_) {}   // 저장소가 막힌 브라우저에서도 게임은 돌아가야 해서
let last = 0;

function resetState() {
  time = 0; phaseIdx = 0; phaseStart = 0; bossCalled = false;
  player = { x: W / 2, y: (H + HUD_H) / 2, r: 14, hp: PLAYER_HP, maxHp: PLAYER_HP, inv: 0, invTime: PLAYER_INV, speed: PLAYER_SPEED, levels: { shot: 1 }, evolved: {} };   // levels[id] = 특전 레벨. evolved[무기id] = 진화 완료
  enemies = []; bullets = []; gems = []; particles = []; floats = [];
  bossShots = []; missiles = []; laser = null; laserTimer = 6; missileTimer = 1.0;
  orbs = []; orbAngle = 0; orbHits = new Map(); pulseTimer = 0.5; pulseFx = null; puddleTimer = 2.5; puddles = []; evolveFx = null;
  zones = ['wait', 'wait', 'wait'];
  score = 0; xp = 0; nextXp = FIRST_XP; level = 1; kills = 0; bossKills = 0; lastHit = null;
  spawnTimer = 0.8; spawnCount = 0; bossWarned = false; fireTimer = 0.3;
  shake = { power: 0, time: 0 }; hitStop = 0; lastHitStop = -1; screenFlash = null; banner = null; intro = null; dying = 0;
  slowmo = 0; pauseAfterIntro = false; winAt = 0;
}

function setStatus(text) { dom.status.textContent = text; }
// 배너 한 줄. next를 주면 이 배너가 끝난 뒤 이어서 띄운다(보스 처치! → 구역 클리어)
function showBanner(text, next = null) { banner = { text, life: 1.6, max: 1.6, next }; }
function renderHud() {
  dom.score.textContent = score.toLocaleString('ko-KR');
  dom.best.textContent = best.toLocaleString('ko-KR');
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

// k: 0~1 보조값. 'hit'에서만 쓴다 — 보스 남은 HP가 적을수록 피치가 올라간다(500→1100Hz)
function sfx(name, k = 0) {
  if (!audio || muted) return;
  const now = performance.now();
  if (now - (sfxLast[name] || 0) < 40) return;
  sfxLast[name] = now;
  const t = audio.currentTime;
  if (name === 'hit') { const f = HIT_PITCH.from + HIT_PITCH.range * k; playTone(f, 60, 'square', 0.04, f * 0.6); }
  else if (name === 'kill') { playNoise(80, 0.06); playTone(140, 120, 'sine', 0.10, 50); }
  else if (name === 'hurt') playTone(110, 150, 'sawtooth', 0.10, 60);
  else if (name === 'levelup') { playTone(523, 120, 'triangle', 0.08); playTone(659, 120, 'triangle', 0.08, 0, t + 0.1); playTone(784, 240, 'triangle', 0.08, 0, t + 0.2); }
  else if (name === 'boss') playTone(70, 800, 'sawtooth', 0.10, 320);
  else if (name === 'laser') playTone(1600, 1000, 'sawtooth', 0.07, 180);
  else if (name === 'pickup') playTone(1400, 25, 'sine', 0.015);
  else if (name === 'throw') playTone(300, 120, 'triangle', 0.06, 520);
  else if (name === 'zone') { playTone(880, 90, 'square', 0.06); playTone(1320, 160, 'square', 0.06, 0, t + 0.09); }   // 구역 확보
  else if (name === 'evolve') { playTone(523, 100, 'square', 0.06); playTone(784, 100, 'square', 0.06, 0, t + 0.1); playTone(1047, 260, 'square', 0.06, 0, t + 0.2); }   // 진화: 3음 상승 사각파
  else if (name === 'tick') playTone(1200, 40, 'square', 0.03);   // 예고 시작
  else if (name === 'rage') { playTone(160, 600, 'sawtooth', 0.12, 40); playNoise(300, 0.08); }   // 광폭화: 저음 톱니파 하강 + 노이즈
  else if (name === 'bossdie') { playNoise(400, 0.12); playTone(220, 700, 'sawtooth', 0.12, 30); playTone(1047, 500, 'triangle', 0.06, 0, t + 0.15); }   // 보스 처치: 쿵 + 여운
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
  const rage = enemies.some((e) => e.boss && e.rage);
  const root = 110 * Math.pow(2, phaseIdx / 12) * (rage ? 2 : 1);   // 구역마다 반음씩 올라간다. 광폭화 뒤엔 1옥타브 위
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
  const hpBonus = time - phaseStart >= (phase.hpBonusAt || 0) ? phase.hpBonus : 0;
  enemies.push({
    name: T.name, shape: T.shape, color: T.color, x, y, r: T.r,
    hp: T.hp + hpBonus, maxHp: T.hp + hpBonus, speed: T.speed, score: T.score, loseText: T.loseText,
    flash: 0, angle: 0, boss: false, dead: false,
  });
}

// 보스 전: 구역 시작→bossAt 사이 spawnFrom→spawnTo 선형 보간. 보스가 나온 뒤: spawnTo에서 10초마다 5%씩 빨라진다(농성 방지, 가속 상한 2배)
function currentSpawnEvery() {
  const p = PHASES[phaseIdx], t = time - phaseStart;
  if (bossCalled) return Math.max(SPAWN_MIN, p.spawnTo / 2, p.spawnTo * Math.pow(0.95, Math.floor((t - p.bossAt) / 10)));
  return p.spawnFrom + (p.spawnTo - p.spawnFrom) * Math.min(1, t / p.bossAt);
}

// 보스는 거리를 0.45배로 쳐서 잡몹 뒤에 숨어도 조준이 간다
function nearestEnemy(x, y) {
  let target = null, nearest = Infinity;
  for (const e of enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - x, e.y - y) * (e.boss ? 0.45 : 1);
    if (d < nearest) { nearest = d; target = e; }
  }
  return target;
}

function missileTarget(x, y) { return enemies.find((e) => e.boss && !e.dead) || nearestEnemy(x, y); }

// 탄: stat('shot')의 발 수·피해·관통·반지름으로 가장 가까운 적 방향에 부채꼴 발사. 대구경탄이면 관통 무한
function shootShot() {
  const target = nearestEnemy(player.x, player.y);
  if (!target) return;
  const base = Math.atan2(target.y - player.y, target.x - player.x);
  const n = stat('shot', 'n'), spread = SHOT_SPREAD * Math.PI / 180;
  const dmg = stat('shot', 'dmg'), r = stat('shot', 'r'), left = 1 + stat('shot', 'pierce'), evolved = !!player.evolved.shot;
  for (let i = 0; i < n; i += 1) {
    const a = base + (i - (n - 1) / 2) * spread;
    bullets.push({ x: player.x, y: player.y, vx: Math.cos(a) * BULLET_SPEED, vy: Math.sin(a) * BULLET_SPEED, r, dmg, left, evolved, hit: [], color: PHASES[phaseIdx].color });
  }
}

/* ==========================================================================
   6. 업데이트·충돌 — 모든 충돌은 hitCircle 한 줄
   ========================================================================== */
function hitCircle(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r; }

function update(dt) {
  time += dt;
  const phase = PHASES[phaseIdx], phaseT = time - phaseStart, boss = BOSSES[phaseIdx];
  if (!bossCalled && phaseT >= phase.bossAt) { bossCalled = true; startBossIntro(boss); return; }   // 구역 전환은 여기가 아니라 killEnemy(보스가 죽을 때)에서
  const bossSoon = !bossCalled && phaseT >= phase.bossAt - 5;   // 등장 5초 전: 예고 배너 + 잡몹 스폰 정지
  if (bossSoon && !bossWarned) { bossWarned = true; showBanner('곧 ' + boss.name); }

  movePlayer(dt);
  if (!bossSoon) spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnCount += 1;
    const n = phaseIdx === 0 && !bossCalled && spawnCount % 4 === 0 ? 3 : 1;   // 1구역 보스 전엔 4번째 스폰마다 3마리 묶음 — 한 마리씩은 심심해서
    for (let i = 0; i < n; i += 1) spawnEnemy();
    spawnTimer = currentSpawnEvery();
  }
  fireTimer -= dt;
  if (fireTimer <= 0 && enemies.length) { shootShot(); fireTimer = stat('shot', 'every'); }

  updateBullets(dt);
  updateLaser(dt);
  updateMissiles(dt);
  updateOrbs(dt);
  updatePulse(dt);
  updatePuddles(dt);
  if (winAt && time >= winAt) { endGame(true); return; }   // 마지막 보스 처치 WIN_DELAY초 뒤 승리 — 사망 3박자가 보인 뒤 결과창. 그동안 피격은 hurtPlayer가 막는다
  updateEnemies(dt);
  updateBossShots(dt);
  if (mode !== 'play') return;   // 방금 죽었으면(결과 화면) 여기서 멈춤
  updateGems(dt);
  updateEffects(dt);

  const place = PLACES[phaseIdx];
  if (zones[phaseIdx] === 'wait' && hitCircle(player, place)) {   // 확보 지점 진입 = 구역 확보
    zones[phaseIdx] = 'done';
    score += PHASES[phaseIdx].bonus;
    player.hp = Math.min(player.maxHp, player.hp + 1);
    if (gems.length) { addFloat(player.x, player.y - 30, '젬 +' + gems.length, '#ffd166', 14); xp += gems.length; gems = []; }   // 확보 지점에 들어가면 화면의 젬 전부 흡수
    addFloat(place.x, place.y - 50, '+' + PHASES[phaseIdx].bonus.toLocaleString('ko-KR'), PHASES[phaseIdx].color, 18);
    addParticles(place.x, place.y, PHASES[phaseIdx].color, 12, 140, 0.6);
    showBanner(place.name + ' 확보!');
    sfx('zone');
    renderHud();
  }
  if (player.inv > 0) player.inv -= dt;
  if (hintTimer > 0) hintTimer -= dt;
  if (mode === 'play' && !winAt && xp >= nextXp) openLevelUp();   // 승리 예약 중엔 카드를 열지 않는다
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
      hurtEnemy(e, b, b.dmg);
      if (b.evolved) addParticle({ kind: 'mark', x: e.x, y: e.y, r: b.r, life: 0.4, max: 0.4, color: '#e63946' });   // 대구경탄: 맞은 자리에 붉은 자국 0.4초
      b.left -= 1;
      if (b.left <= 0) { bullets.splice(i, 1); break; }
    }
  }
}

function updateEnemies(dt) {
  const shockR = player.evolved.pulse ? stat('pulse', 'r') : 0, shockSlow = shockR ? stat('pulse', 'slow') : 0;   // 충격파 안의 적은 느려진다
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    if (e.dead) { enemies.splice(i, 1); continue; }
    if (e.boss) { updateBossPatterns(e, dt); updateBossDash(e, dt); }
    e.angle = Math.atan2(player.y - e.y, player.x - e.x);
    if (!bossHolds(e)) {   // 돌진·광폭화 정지 중엔 평소 추격을 멈춘다
      const slow = shockR && Math.hypot(e.x - player.x, e.y - player.y) < shockR + e.r ? 1 - shockSlow : 1;
      e.x += Math.cos(e.angle) * e.speed * slow * dt;
      e.y += Math.sin(e.angle) * e.speed * slow * dt;
    }
    if (e.flash > 0) e.flash -= dt;
    if (e.boss) {
      e.hpGhost += (e.hp - e.hpGhost) * Math.min(1, dt * HP_GHOST_RATE);   // 붉은 잔상이 HP를 천천히 따라온다
      if (!e.entered && e.y >= HUD_H + e.r) e.entered = true;   // HUD 위에서 걸어 들어온 뒤로는 운동장 밖으로 못 나간다
      if (e.entered) clampToField(e);
    }
    if (player.inv <= 0 && hitCircle(e, player)) hurtPlayer(e);
  }
}

// 젬 하나. vx,vy는 튀어나가는 속도(보스 젬만 0이 아니다)
function makeGem(x, y, vx = 0, vy = 0) { return { x, y, r: 6, vx, vy }; }

// 젬 자석: 모든 젬이 매 프레임 플레이어 쪽으로 온다. 속도 = max(바닥값, MAX·e^(−d/λ)) — 가까울수록 빠르고, 멀어도 완전히 멈추지 않는다. 좌표 강제 이동 없음
function updateGems(dt) {
  for (let i = gems.length - 1; i >= 0; i -= 1) {
    const g = gems[i];
    g.x += g.vx * dt; g.y += g.vy * dt;   // 튀어나가는 속도는 프레임마다 감쇠
    g.vx *= GEM_DAMP; g.vy *= GEM_DAMP;
    const d = Math.hypot(player.x - g.x, player.y - g.y) || 1;
    const v = Math.max(GEM_PULL_MIN, GEM_PULL_MAX * Math.exp(-d / GEM_PULL_LAMBDA));
    g.x += (player.x - g.x) / d * v * dt;
    g.y += (player.y - g.y) / d * v * dt;
    if (hitCircle(g, player)) { gems.splice(i, 1); xp += 1; sfx('pickup'); }
  }
}

/* ==========================================================================
   7. 성장 — 특전(무기·패시브·전설) 레벨, 카드 추첨, 진화, 무기 갱신(위성·펄스·장판)
   ========================================================================== */
function levelOf(id) { return player.levels[id] || 0; }
function hasUpgrade(id) { return levelOf(id) > 0; }
function ownedCount(kind) { return UPGRADES.filter((u) => u.kind === kind && hasUpgrade(u.id)).length; }

// 패시브 현재 값. 없으면 def (연사 1 / 공격력 1 / 범위 1 / 넉백 0)
function passiveVal(id, def) { return hasUpgrade(id) ? UPGRADE_BY_ID[id].perLevel[levelOf(id) - 1] : def; }

// 무기 최종 수치. 진화했으면 EVOLUTIONS.stats 우선 → 없으면 perLevel → 없으면 행(every). 그 위에 공격력(dmg)·범위(r)·연사(every) 배수
function stat(id, key) {
  const u = UPGRADE_BY_ID[id], per = u.perLevel[Math.max(0, levelOf(id) - 1)];
  const evo = player.evolved[id] ? EVOLUTIONS.find((v) => v.needs[0] === id) : null;
  let v = evo && key in evo.stats ? evo.stats[key] : key in per ? per[key] : u[key];
  if (key === 'dmg') v = Math.round(v * passiveVal('might', 1));
  else if (key === 'r') v *= passiveVal('area', 1);
  else if (key === 'every') v *= passiveVal('cooldown', 1);
  return v;
}

// 카드 3장 추첨. 카드마다: 전설 1%(미보유 전설이 남고 이 화면에 아직 없을 때) → 가중 풀(보유 3 : 새 종류 1, 칸 남을 때만) → 없으면 '점수 +500'
function rollUpgrades() {
  const picked = [];
  const weightedPick = (pool) => {
    let r = Math.random() * pool.reduce((s, c) => s + c.w, 0);
    for (const c of pool) { r -= c.w; if (r < 0) return c.u; }
    return pool[pool.length - 1].u;
  };
  while (picked.length < 3) {
    const legends = UPGRADES.filter((u) => u.kind === 'legendary' && !hasUpgrade(u.id));
    if (legends.length && !picked.some((u) => u.kind === 'legendary') && Math.random() < LEGEND_RATE) { picked.push(legends[Math.floor(Math.random() * legends.length)]); continue; }
    const pool = [];
    for (const u of UPGRADES) {
      if (u.kind === 'legendary' || picked.includes(u)) continue;
      if (hasUpgrade(u.id)) { if (levelOf(u.id) < u.max && !player.evolved[u.id]) pool.push({ u, w: OWNED_WEIGHT }); }
      else if (ownedCount(u.kind) < SLOTS[u.kind]) pool.push({ u, w: 1 });
    }
    picked.push(pool.length ? weightedPick(pool) : SCORE_CARD);
  }
  return picked;
}

// 카드 문구. 새 특전: NEW + 기본 동작 / 보유: Lv.n → n+1 + 이번 레벨 효과 / 무기 Lv4→5: 진화 힌트 / 짝 패시브: '진화 재료' 배지
function cardText(u) {
  const lv = u.kind === 'score' ? 0 : levelOf(u.id);
  const out = { tier: u.tier, badge: lv ? TIERS[u.tier].label : u.kind === 'score' ? '' : 'NEW', lv: lv ? 'Lv.' + lv + ' → ' + (lv + 1) : '', desc: u.desc[lv] };
  if (u.kind === 'weapon' && lv === u.max - 1) {
    const evo = EVOLUTIONS.find((v) => v.needs[0] === u.id);
    out.desc += '\n만렙 + ' + UPGRADE_BY_ID[u.pair].name + ' 보유 시 → ' + evo.name;
  }
  if (u.kind === 'passive' && u.pair && hasUpgrade(u.pair) && !player.evolved[u.pair]) {
    out.tier = 'evolve';
    out.badge = (lv ? '' : 'NEW · ') + '진화 재료';
  }
  return out;
}

function openLevelUp() {
  mode = 'levelup';
  xp -= nextXp;
  level += 1;
  nextXp += NEXT_XP_BASE + Math.ceil(level * NEXT_XP_SLOPE);
  levelupAt = performance.now();
  choices = rollUpgrades();
  choices.forEach((u, i) => {
    const btn = dom.upBtns[i], c = cardText(u);
    btn.dataset.tier = c.tier;
    btn.querySelector('.up-tier').textContent = c.badge;
    btn.querySelector('.up-lv').textContent = c.lv;
    btn.querySelector('.up-name').textContent = (i + 1) + '. ' + u.name;
    btn.querySelector('.up-desc').textContent = c.desc;
  });
  resetInput();
  dom.levelup.hidden = false;
  dom.upBtns[0].focus();
  sfx('levelup');
  setStatus('레벨 ' + level + '! 특전을 고르세요');
}

// 패시브를 고른 즉시 플레이어 수치에 반영. 나머지(연사·공격력·범위·넉백)는 stat()·hurtEnemy가 읽는다
function applyPassive(id) {
  if (id === 'hp') { const max = passiveVal('hp', PLAYER_HP); player.hp += max - player.maxHp; player.maxHp = max; }
  else if (id === 'speed') player.speed = passiveVal('speed', PLAYER_SPEED);
  else if (id === 'inv') player.invTime = passiveVal('inv', PLAYER_INV);
}

function applyUpgrade(i) {
  if (mode !== 'levelup' || !choices[i] || performance.now() - levelupAt < CARD_GUARD_MS) return;   // 오픈 직후는 헛클릭
  const u = choices[i];
  if (u.kind === 'score') score += SCORE_CARD_VALUE;
  else {
    player.levels[u.id] = levelOf(u.id) + 1;
    if (u.kind === 'passive') applyPassive(u.id);
    if (u.id === 'orbit') rebuildOrbs();
  }
  player.inv = Math.max(player.inv, PLAYER_INV);   // 카드 닫히는 순간 적이 붙어 있어도 한 번은 봐준다
  dom.levelup.hidden = true;
  mode = 'play';
  setStatus(u.name + ' 획득');
  addFloat(player.x, player.y - 30, u.name, TIERS[u.tier].color, u.tier === 'legendary' ? 20 : 15);
  renderHud();
  checkEvolution();
}

// 무기 만렙 + 짝 패시브 보유 → 자동 합체. 레벨업 소모 없음
function checkEvolution() {
  for (const evo of EVOLUTIONS) {
    const [w, p] = evo.needs;
    if (!player.evolved[w] && levelOf(w) >= UPGRADE_BY_ID[w].max && hasUpgrade(p)) startEvolve(evo);
  }
}

// 합체 연출: 히트스톱 → 흰 플래시 → 보라 파편 + 배너 + 흔들림 + 3음 효과음. 별도 mode 없이 evolveFx 타이머 하나
function startEvolve(evo) {
  player.evolved[evo.needs[0]] = true;
  if (evo.needs[0] === 'orbit') rebuildOrbs();
  evolveFx = { t: 0, name: evo.name };
  if (!reduceMotion) hitStop = Math.max(hitStop, EVOLVE_FX.stop);
  screenFlash = { color: '255,255,255', life: EVOLVE_FX.flashDur, max: EVOLVE_FX.flashDur, alpha: EVOLVE_FX.flashAlpha };
  addParticles(player.x, player.y, TIERS.evolve.color, EVOLVE_FX.shards, 200, 0.6);
  showBanner('진화! ' + evo.name);
  addShake(EVOLVE_FX.shake, 0.4);
  sfx('evolve');
  setStatus('진화! ' + evo.name);
}

// 위성: 구체 n개를 같은 간격으로 다시 배치(레벨업·진화 때). 각도는 이어서 돈다
function rebuildOrbs() {
  const n = hasUpgrade('orbit') ? stat('orbit', 'n') : 0;
  orbs = Array.from({ length: n }, (_, i) => ({ offset: i * Math.PI * 2 / n, x: player.x, y: player.y }));
}

// 위성: 플레이어 주위를 돌며 닿는 적에게 피해. 같은 적은 ORB_HIT_EVERY마다 한 번. 넉백은 플레이어에서 바깥
function updateOrbs(dt) {
  if (!orbs.length) return;
  orbAngle += stat('orbit', 'spin') * dt;
  const R = stat('orbit', 'r'), dmg = stat('orbit', 'dmg'), push = stat('orbit', 'push'), evolved = !!player.evolved.orbit;
  for (const [e] of orbHits) if (e.dead) orbHits.delete(e);   // 죽은 적은 Map에서 정리
  for (const o of orbs) {
    o.x = player.x + Math.cos(orbAngle + o.offset) * R;
    o.y = player.y + Math.sin(orbAngle + o.offset) * R;
    for (const e of enemies) {
      if (e.dead || time - (orbHits.get(e) ?? -Infinity) < ORB_HIT_EVERY || !hitCircle({ x: o.x, y: o.y, r: ORB_R }, e)) continue;
      orbHits.set(e, time);
      hurtEnemy(e, { vx: e.x - player.x, vy: e.y - player.y, push, evolved }, dmg);
    }
  }
}

// 펄스: every마다 플레이어 반경 안 모든 적 피해 + 링 그림. 넉백은 플레이어에서 바깥
function updatePulse(dt) {
  if (pulseFx) { pulseFx.t += dt; if (pulseFx.t >= PULSE_RING_DUR) pulseFx = null; }
  if (!hasUpgrade('pulse')) return;
  pulseTimer -= dt;
  if (pulseTimer > 0) return;
  pulseTimer = stat('pulse', 'every');
  const R = stat('pulse', 'r'), dmg = stat('pulse', 'dmg'), evolved = !!player.evolved.pulse;
  pulseFx = { t: 0, r: R };
  for (const e of enemies) {
    if (e.dead || Math.hypot(e.x - player.x, e.y - player.y) >= R + e.r) continue;
    hurtEnemy(e, { vx: e.x - player.x, vy: e.y - player.y, evolved }, dmg);
  }
}

// 장판 밀집점: 플레이어 반경 PUDDLE_SEEK_R 안 적 중 "반경 r 안에 적이 가장 많은 적"의 자리. skip 안 좌표 근처(r 이내)는 뺀다
function densestPoint(r, skip) {
  let best = null, bestN = 0;
  for (const a of enemies) {
    if (a.dead || Math.hypot(a.x - player.x, a.y - player.y) > PUDDLE_SEEK_R) continue;
    if (skip.some((s) => Math.hypot(a.x - s.x, a.y - s.y) < r)) continue;
    let n = 0;
    for (const b of enemies) if (!b.dead && Math.hypot(a.x - b.x, a.y - b.y) < r) n += 1;
    if (n > bestN) { bestN = n; best = a; }
  }
  return best ? { x: best.x, y: best.y } : null;
}

// 내 장판: every마다 밀집점 n곳에 owner 'player' 장판. r0에서 시작해 grow배까지 지속 동안 선형으로 커진다(광역 장판)
function firePlayerPuddle() {
  const r = stat('puddle', 'r'), dur = stat('puddle', 'dur'), placed = [];
  for (let i = 0; i < stat('puddle', 'n'); i += 1) {
    const p = densestPoint(r, placed);
    if (!p) break;
    placed.push(p);
    puddles.push({ x: p.x, y: p.y, r, r0: r, grow: stat('puddle', 'grow'), life: dur, max: dur, owner: 'player', dmg: stat('puddle', 'dmg'), tick: 0 });
  }
}

// 장판 공용: owner 'player'는 PUDDLE_TICK마다 안의 적 피해(넉백 없음), owner 'boss'는 안의 플레이어 피격(무적이 연타를 막는다)
function updatePuddles(dt) {
  if (hasUpgrade('puddle')) { puddleTimer -= dt; if (puddleTimer <= 0 && enemies.length) { puddleTimer = stat('puddle', 'every'); firePlayerPuddle(); } }
  for (let i = puddles.length - 1; i >= 0; i -= 1) {
    const p = puddles[i];
    if (!p) continue;   // 이 루프의 hurtEnemy로 보스가 죽으면 clearBossAttacks가 목록을 줄인다 — 빈 칸은 건너뛴다
    p.life -= dt;
    if (p.life <= 0) { puddles.splice(i, 1); continue; }
    p.r = p.r0 * (1 + (p.grow - 1) * (1 - p.life / p.max));
    if (p.owner === 'boss') {
      const boss = enemies.find((e) => e.boss && !e.dead);
      if (boss && player.inv <= 0 && Math.hypot(player.x - p.x, player.y - p.y) < p.r + player.r) hurtPlayer(boss);
      continue;
    }
    p.tick -= dt;
    if (p.tick > 0) continue;
    p.tick = PUDDLE_TICK;
    for (const e of enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < p.r + e.r) hurtEnemy(e, { vx: 0, vy: 0 }, p.dmg);
  }
}

function fireLaser() {
  laser = { t: 0, dur: 1.2, x: 0, w: 0, hit: [] };
  sfx('laser');
  addShake(2, 0.2);
}

// 빔은 왼쪽 끝→오른쪽 끝으로 1.2초. 폭은 sin 곡선으로 0→40→0. 적마다 스윕당 한 번만 맞는다
function updateLaser(dt) {
  if (hasUpgrade('laser')) { laserTimer -= dt; if (laserTimer <= 0) { laserTimer = 6; fireLaser(); } }
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
  if (hasUpgrade('missile')) { missileTimer -= dt; if (missileTimer <= 0) { missileTimer = 1.0; fireMissile(); } }
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
    addParticle({ kind: 'dot', x: m.x - m.vx * 0.02, y: m.y - m.vy * 0.02, vx: rand(-25, 25), vy: rand(-25, 25), size: 3, life: 0.3, max: 0.3, color: '#ffd166' });
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

// 보스 엔티티. phase 0/1, rage: 광폭화 뒤 true, roar: 광폭화 정지 남은 초, timers[패턴id]: 쿨다운, wind: 진행 중 예고(하나만), dash: 돌진 중
function spawnBoss(b) {
  const e = {
    name: b.name, look: b.look, color: b.color, def: b, x: W / 2, y: HUD_H - BOSS_R, r: BOSS_R,
    hp: b.hp, maxHp: b.hp, hpGhost: b.hp, speed: b.speed[0], score: b.score, gems: b.gems, loseText: b.loseText,
    flash: 0, angle: 0, boss: true, dead: false,
    warm: 1, phase: 0, rage: false, roar: 0, timers: {}, wind: null, dash: null, entered: false,   // warm: 컷신 끝나고 1초는 공격 없음. entered: 운동장 안에 들어왔다(그 뒤 클램프)
  };
  for (const id of b.phases[0]) e.timers[id] = PATTERNS[id].every;
  enemies.push(e);
  addParticle({ kind: 'ring', x: e.x, y: HUD_H + 10, r: 10, life: 0.6, max: 0.6, color: b.color });
  for (const m of enemies) {   // 등장 파동: 반경 안 잡몹이 밀려난다
    if (m.boss || m.dead) continue;
    const d = Math.hypot(m.x - e.x, m.y - e.y);
    if (d < APPEAR_WAVE.r) { m.x += (m.x - e.x) / (d || 1) * APPEAR_WAVE.push; m.y += (m.y - e.y) / (d || 1) * APPEAR_WAVE.push; }
  }
  player.inv = Math.max(player.inv, APPEAR_INV);   // 컷신 동안 붙어 있던 잡몹에게 바로 맞지 않게
  addShake(...APPEAR_WAVE.shake);
  showBanner(b.label + ' 등장');
}

// 보스가 제자리에 서는 조건: 돌진 중 / 광폭화 정지 중
function bossHolds(e) { return !!(e.dash || e.roar > 0); }

// 보스를 운동장 안으로. 추격·넉백·돌진 뒤에 호출 — 몸·머리 위 HP 바가 화면 밖으로 잘리지 않게
function clampToField(e) {
  e.x = Math.min(W - e.r, Math.max(e.r, e.x));
  e.y = Math.min(H - e.r, Math.max(HUD_H + e.r, e.y));
}

// 예고 시작. 방향·위치는 이 순간 고정된다. count: 이 패턴이 앞으로 발동할 횟수(재조준이면 짧은 retele)
function startWind(e, id, count) {
  const P = PATTERNS[id], again = count < (P.count || 1);
  e.wind = { id, t: 0, dur: again ? P.retele : P.tele, color: TELE_COLOR[P.teleColor], count, angle: Math.atan2(player.y - e.y, player.x - e.x), spots: [] };
  if (P.shape === 'spots') e.wind.spots = soupSpots(P);
  else if (P.shape === 'slam') e.wind.spots = [{ x: e.x, y: e.y, r: P.r }];   // 바닥 찍기 자리도 이 순간 고정 — 보스가 걸어도 원은 안 따라간다
  sfx('tick');
}

// 패턴 진행: 광폭화 정지 → warm → 페이즈 체크 → 쿨다운 → 예고 하나 진행 → 발동. 돌진 중엔 새 패턴을 시작하지 않는다
function updateBossPatterns(e, dt) {
  if (e.roar > 0) { e.roar -= dt; if (e.roar <= 0) endRoar(e); return; }
  if (e.warm > 0) { e.warm -= dt; return; }
  if (mode === 'play' && !e.rage && e.hp / e.maxHp <= RAGE_AT) { startRoar(e); return; }
  const ids = e.def.phases[e.phase];
  for (const id of ids) e.timers[id] -= dt;
  if (e.dash) return;
  if (e.wind) {
    const w = e.wind, P = PATTERNS[w.id];
    w.t += dt;
    if (w.t < w.dur) return;
    e.wind = null;
    P.fire(e, w, P);
    if (w.count > 1 && !e.dash) startWind(e, w.id, w.count - 1);   // 연발: 재조준 뒤 한 번 더 (돌진은 끝난 뒤 updateBossDash에서)
    return;
  }
  for (const id of ids) if (e.timers[id] <= 0) { e.timers[id] = PATTERNS[id].every; startWind(e, id, PATTERNS[id].count || 1); break; }
}

// 돌진·카트 공용: 예고 방향으로 speed만큼 go초, 벽에 닿으면 정지 + 흔들림 + 먼지. 카트는 벽에 닿은 자리에만 장판. count가 남았으면 재조준
function updateBossDash(e, dt) {
  const d = e.dash;
  if (!d) return;
  const P = PATTERNS[d.id];
  d.t += dt;
  e.x += Math.cos(d.angle) * P.speed * dt; e.y += Math.sin(d.angle) * P.speed * dt;
  const wall = e.x < e.r || e.x > W - e.r || e.y < HUD_H + e.r || e.y > H - e.r;
  clampToField(e);
  if (!wall && d.t < P.go) return;
  e.dash = null;
  if (wall) {
    addShake(WALL_SHAKE, 0.15); addDust(e.x, e.y + e.r);
    if (P.puddle) pushBossPuddle(e.x, e.y, P.puddle.r, P.puddle.dur);
  }
  if (d.count > 1) startWind(e, d.id, d.count - 1);
}

// 벽 충돌 먼지: 회색 알갱이가 위쪽으로
function addDust(x, y) {
  for (let i = 0; i < WALL_DUST; i += 1) addParticle({ kind: 'dot', x: x + rand(-20, 20), y, vx: rand(-60, 60), vy: rand(-140, -40), size: rand(2, 4), life: 0.4, max: 0.4, color: '#9aa0a6' });
}

// 광폭화: 0.6초 정지, 이 보스의 투사체·장판·예고 소멸, 붉은 플래시, 흔들림, 슬로모, 배너. 피해는 계속 들어간다
function startRoar(e) {
  e.rage = true; e.roar = ROAR_DUR;
  clearBossAttacks(e);
  screenFlash = { color: ROAR_FLASH.color, life: ROAR_FLASH.dur, max: ROAR_FLASH.dur, alpha: ROAR_FLASH.alpha };
  addShake(ROAR_SHAKE, 0.3);
  if (!reduceMotion) slowmo = Math.max(slowmo, ROAR_SLOWMO);
  showBanner('광폭화!');
  sfx('rage');
}

// 광폭화 끝: P2로. 속도 P2, P2 패턴 타이머는 각 쿨다운의 절반부터
function endRoar(e) {
  e.phase = 1; e.roar = 0; e.speed = e.def.speed[1];
  for (const id of e.def.phases[1]) e.timers[id] = PATTERNS[id].every / 2;
}

// 이 보스의 투사체·장판·예고·돌진을 파편으로 지운다(광폭화·사망)
function clearBossAttacks(e) {
  for (let i = bossShots.length - 1; i >= 0; i -= 1) {
    const s = bossShots[i];
    if (s.owner !== e) continue;
    addParticles(s.x, s.y, e.color, 4, 120, 0.3);
    bossShots.splice(i, 1);
  }
  for (let i = puddles.length - 1; i >= 0; i -= 1) {
    const p = puddles[i];
    if (p.owner !== 'boss') continue;
    addParticles(p.x, p.y, PUDDLE_COLOR.boss, 6, 100, 0.3);
    puddles.splice(i, 1);
  }
  e.wind = null; e.dash = null;
}

// 보스 투사체 하나. delay: 이 초가 지나야 날아간다(연발 간격). bounces: 벽 튕김 횟수(없으면 화면 밖에서 소멸)
function pushBossShot(e, angle, P, delay) {
  bossShots.push({ kind: P.kind, owner: e, x: e.x, y: e.y, vx: Math.cos(angle) * P.speed, vy: Math.sin(angle) * P.speed, r: P.r, life: P.life, spin: 0, bounces: P.bounces, delay });
}

// 부채꼴: dirs 각도마다 한 발, 동시에
function fireFan(e, w, P) {
  for (const d of P.dirs) pushBossShot(e, w.angle + d * Math.PI / 180, P, 0);
  sfx('throw');
}

// 원형 n발: 시작각 = 플레이어 방향 + 반 간격 → 정면은 항상 빈틈
function fireRing(e, w, P) {
  for (let i = 0; i < P.n; i += 1) pushBossShot(e, w.angle + (i + 0.5) * Math.PI * 2 / P.n, P, 0);
  sfx('throw');
}

// 직선 연발: dirs 각도마다 gap 간격으로. 벽 튕김은 P.bounces
function fireLine(e, w, P) {
  P.dirs.forEach((d, i) => pushBossShot(e, w.angle + d * Math.PI / 180, P, i * (P.gap || 0)));
  sfx('throw');
}

// 장판 자리: 첫 번째는 플레이어 현 위치, 나머지는 플레이어 SOUP_AWAY 밖 랜덤(재추첨 최대 20회)
function soupSpots(P) {
  const spots = [{ x: player.x, y: player.y, r: P.r }];
  for (let i = 1; i < P.n; i += 1) {
    let x = player.x, y = player.y, tries = 0;
    while (Math.hypot(x - player.x, y - player.y) < SOUP_AWAY && tries < 20) { x = rand(P.r, W - P.r); y = rand(HUD_H + P.r, H - P.r); tries += 1; }
    spots.push({ x, y, r: P.r });
  }
  return spots;
}

// 보스 장판. PUDDLE_MAX를 넘으면 오래된 보스 장판부터 지운다
function pushBossPuddle(x, y, r, dur) {
  puddles.push({ x, y, r, r0: r, grow: 1, life: dur, max: dur, owner: 'boss', dmg: 1, tick: 0 });
  const mine = puddles.filter((p) => p.owner === 'boss');
  while (mine.length > PUDDLE_MAX) puddles.splice(puddles.indexOf(mine.shift()), 1);
}

// 예고 때 잡아 둔 자리에 장판을 붓는다
function pourSoup(e, w, P) {
  for (const s of w.spots) pushBossPuddle(s.x, s.y, s.r, P.dur);
  sfx('throw');
}

// 돌진 시작: 예고 방향으로 (진행은 updateBossDash)
function startDash(e, w) {
  e.dash = { id: w.id, t: 0, angle: w.angle, count: w.count };
  sfx('throw');
}

// 바닥 찍기: 예고 시작 때 잡아 둔 자리(w.spots[0]) 원 안 전부 피격 = 아주 짧은 보스 장판
function fireSlam(e, w, P) {
  const s = w.spots[0];
  pushBossPuddle(s.x, s.y, s.r, P.dur);
  addParticle({ kind: 'ring', x: s.x, y: s.y, r: e.r, life: 0.4, max: 0.4, color: TELE_COLOR.white });
  addShake(SLAM_SHAKE, 0.25);
  sfx('throw');
}

// 보스 투사체. 내 탄과는 부딪히지 않는다 — 막을 수 있으면 피할 이유가 없어져서. delay가 남은 발은 아직 안 날아간다
function updateBossShots(dt) {
  for (let i = bossShots.length - 1; i >= 0; i -= 1) {
    const s = bossShots[i];
    if (s.delay > 0) { s.delay -= dt; s.x = s.owner.x; s.y = s.owner.y; continue; }   // 아직 안 던진 발은 보스 손에 들려 따라간다
    s.life -= dt; s.spin += dt * 9;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.bounces !== undefined) {   // 벽 튕김: bounces번 튕긴 뒤 다음 벽에서 소멸(식판 1번, 덤벨 2번)
      if (s.x < s.r || s.x > W - s.r) { s.vx = -s.vx; s.x = Math.min(W - s.r, Math.max(s.r, s.x)); s.bounces -= 1; }
      if (s.y < HUD_H + s.r || s.y > H - s.r) { s.vy = -s.vy; s.y = Math.min(H - s.r, Math.max(HUD_H + s.r, s.y)); s.bounces -= 1; }
      if (s.bounces < 0) { bossShots.splice(i, 1); continue; }
    }
    const outside = s.x < -30 || s.x > W + 30 || s.y < HUD_H - 30 || s.y > H + 30;
    if (s.life <= 0 || outside) { bossShots.splice(i, 1); continue; }
    if (player.inv <= 0 && hitCircle(s, player)) { hurtPlayer(s.owner); bossShots.splice(i, 1); }
  }
}

// b: 때린 것 {vx, vy, push?, evolved?}. 밀림 방향은 vx,vy(탄=진행 방향, 위성·펄스=플레이어에서 바깥, 장판=0).
// 잡몹 밀림 = (b.push 또는 MOB_PUSH) + 넉백 패시브, 보스 = BOSS_PUSH(진화 무기면 6) + 넉백 패시브의 25%
function hurtEnemy(e, b, dmg = 1) {
  e.hp -= dmg;
  e.flash = BOSS_SHRINK.dur;
  const len = Math.hypot(b.vx, b.vy) || 1, knock = passiveVal('knock', 0);
  const push = e.boss ? (b.evolved ? BOSS_PUSH_EVOLVED : BOSS_PUSH) + knock * BOSS_KNOCK_RATE : (b.push ?? MOB_PUSH) + knock;
  e.x += b.vx / len * push; e.y += b.vy / len * push;
  if (e.boss && e.entered) clampToField(e);   // 넉백으로 HUD 띠·화면 밖에 밀려 들어가지 않게
  addParticles(e.x, e.y, '#ffffff', 3, 120, 0.25);
  if (e.boss) {   // 보스만: 흔들림 + 피해 숫자(피해량만큼 크게) + 남은 HP가 적을수록 높은 피격음
    addShake(b.evolved ? BOSS_SHAKE_EVOLVED : BOSS_SHAKE, 0.1);
    addFloat(e.x + rand(-20, 20), e.y - e.r - 6, String(dmg), '#fff', BOSS_DMG_FONT.base + dmg * BOSS_DMG_FONT.per);
  }
  sfx('hit', e.boss ? Math.max(0, 1 - e.hp / e.maxHp) : 0);
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  e.dead = true;
  kills += 1;
  const bossOn = !e.boss && bossCalled;   // 죽는 순간 보스가 살아 있으면 잡몹 점수 50%
  const gained = bossOn ? Math.round(e.score * BOSS_ALIVE_SCORE) : e.score;
  score += gained;
  if (e.boss) {
    bossKills += 1;
    if (DEBUG_LOG) console.log('boss kill', e.name, time.toFixed(1) + 's');
    bossDeathFx(e, gained);
    player.hp = Math.min(player.maxHp, player.hp + 1);
    for (let i = 0; i < e.gems; i += 1) {   // 젬 폭발: 랜덤 방향으로 튀어나간 뒤 자석에 끌려온다
      const a = Math.random() * Math.PI * 2;
      gems.push(makeGem(e.x, e.y, Math.cos(a) * BOSS_GEM_SPEED, Math.sin(a) * BOSS_GEM_SPEED));
    }
    if (zones[phaseIdx] === 'wait') zones[phaseIdx] = 'miss';   // 보스가 죽을 때까지 안 들어갔으면 그 구역은 놓침
    if (bossKills >= BOSSES.length) { winAt = time + WIN_DELAY; showBanner('보스 처치!'); renderHud(); return; }   // 마지막 보스 — 승리는 update()가 WIN_DELAY 뒤에(시간은 게임을 끝내지 않는다)
    phaseIdx += 1; phaseStart = time; bossCalled = false; bossWarned = false; spawnTimer = 0.8;   // 보스가 구역을 넘긴다
    setStatus(PHASES[phaseIdx].name + ' · 확보 지점으로 이동');
    showBanner('보스 처치!', PHASES[phaseIdx - 1].name + ' 클리어! → ' + PHASES[phaseIdx].name);   // 처치 배너가 끝나면 구역 클리어 배너
  } else {   // 잡몹: 파편 + 점수 + 짧은 히트스톱. 슬로모는 쓰지 않는다
    addParticles(e.x, e.y, e.color, 6 + Math.floor(Math.random() * 3), 170, 0.45);
    addFloat(e.x, e.y - e.r, '+' + gained.toLocaleString('ko-KR') + (bossOn ? ' (보스전 중)' : ''), '#ffd166', 14);
    if (!reduceMotion && time - lastHitStop > MOB_KILL_FX.every) { hitStop = MOB_KILL_FX.hitStop; lastHitStop = time; }   // 연속 처치마다 멈추면 끊겨 보여서 every초에 한 번만
    sfx('kill');
    addShake(...MOB_KILL_FX.shake);
    if (player.evolved.pulse && Math.hypot(e.x - player.x, e.y - player.y) < stat('pulse', 'r') + e.r) { xp += 1; sfx('pickup'); }   // 충격파 안에서 죽은 적의 젬은 즉시 흡수
    else gems.push(makeGem(e.x, e.y));
  }
  renderHud();
}

// 보스 사망 3박자: 슬로모 → 흰 플래시 → 파편 30 + 링 3 → 큰 점수 + 배너 → 진동 → 잡몹 넉백. 그 보스의 투사체·장판·예고도 지운다
function bossDeathFx(e, gained) {
  slowmo = reduceMotion ? 0 : BOSS_DIE.slowmo;
  screenFlash = { color: '255,255,255', life: BOSS_DIE.flash, max: BOSS_DIE.flash, alpha: reduceMotion ? BOSS_DIE.flashAlphaReduce : BOSS_DIE.flashAlpha };
  clearBossAttacks(e);
  particles.length = 0;   // 화면을 비운 뒤 파편만 남긴다 — 상한 안에서 가장 크게 터지도록
  addParticles(e.x, e.y, e.color, BOSS_DIE.shards / 2, 220, 0.6);
  addParticles(e.x, e.y, '#ffffff', BOSS_DIE.shards / 2, 220, 0.6);
  for (const life of BOSS_DIE.rings) addParticle({ kind: 'ring', x: e.x, y: e.y, r: e.r, life, max: life, color: e.color });
  addFloat(e.x, e.y - e.r, '+' + gained.toLocaleString('ko-KR'), '#ffffff', BOSS_DIE.font);
  addShake(...BOSS_DIE.shake);
  sfx('bossdie');
  navigator.vibrate?.(BOSS_DIE.vibrate);
  for (const m of enemies) {   // 잡몹은 보스 자리에서 바깥으로 밀려난다
    if (m.boss || m.dead) continue;
    const d = Math.hypot(m.x - e.x, m.y - e.y) || 1;
    m.x += (m.x - e.x) / d * BOSS_DIE.mobPush; m.y += (m.y - e.y) / d * BOSS_DIE.mobPush;
  }
}

function hurtPlayer(e) {
  if (player.inv > 0 || mode !== 'play' || winAt) return;   // 승리 예약 중엔 맞지 않는다
  player.hp -= 1;
  player.inv = player.invTime;
  lastHit = e;
  screenFlash = { color: HURT_FLASH.color, life: HURT_FLASH.dur, max: HURT_FLASH.dur, alpha: HURT_FLASH.alpha };
  addShake(...HURT_SHAKE);
  sfx('hurt');
  navigator.vibrate?.(60);
  if (player.hp <= 0) { mode = 'dying'; dying = DYING.dur; resetInput(); }   // 바로 결과창 대신 짧은 슬로모
}

// 흔들림은 더하지 않고 큰 쪽을 따른다 — 보스 연타 중 작은 흔들림이 쌓여 처치 흔들림보다 커지지 않게
function addShake(power, dur) {
  if (reduceMotion) return;
  shake.power = Math.min(SHAKE_MAX, Math.max(shake.power, power));
  shake.time = Math.max(shake.time, dur);
}

// 파티클 하나. MAX_PARTICLES를 넘기지 않는다 — 폰에서 프레임 유지. 모든 파티클 추가는 이 함수를 거친다
function addParticle(p) { if (particles.length < MAX_PARTICLES) particles.push(p); }

function addParticles(x, y, color, n, speed, life) {
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2, s = speed * rand(0.4, 1);
    addParticle({ kind: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: rand(2, 4), life, max: life, color });
  }
}

function addFloat(x, y, text, color, size) {
  if (floats.length >= MAX_FLOATS) return;
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
  if (screenFlash) { screenFlash.life -= dt; if (screenFlash.life <= 0) screenFlash = null; }
  if (banner) { banner.life -= dt; if (banner.life <= 0) { const next = banner.next; banner = null; if (next) showBanner(next); } }   // 끝나면 예약된 다음 배너
  if (evolveFx) { evolveFx.t += dt; if (evolveFx.t >= EVOLVE_DUR) evolveFx = null; }
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
  setStatus(PHASES[0].name + ' · 확보 지점으로 이동');
}

function pauseGame() { mode = 'pause'; resetInput(); dom.pause.hidden = false; stopBgm(); if (audio) audio.suspend(); statusBeforePause = dom.status.textContent; setStatus('일시정지'); }
function resumeGame() {
  if (mode !== 'pause') return;
  dom.pause.hidden = true; mode = 'play'; last = performance.now();
  player.inv = Math.max(player.inv, 0.5);   // 재개 직후 바로 맞지 않게
  if (audio) audio.resume(); startBgm(); setStatus(statusBeforePause);   // 멈추기 전 상태줄로 복귀
}

function endGame(won) {
  mode = 'over';
  resetInput();
  stopBgm();
  shake.power = 0; shake.time = 0; screenFlash = null; slowmo = 0;   // 결과창 뒤에서 떨림·비네트·슬로모가 남지 않게
  const secs = Math.floor(time);
  const fmt = (n) => n.toLocaleString('ko-KR');
  if (won) {
    const zoneBonus = zones.every((z) => z === 'done') ? END_BONUS.zones : 0;
    const earlyBonus = time <= ON_TIME ? END_BONUS.early : 0;   // 120초 안에 보스 셋을 다 잡았다
    score += END_BONUS.clear + player.hp * END_BONUS.heart + zoneBonus + earlyBonus;
    dom.overTitle.textContent = '3구역 확보! 살아남았다';
    dom.overReason.textContent = secs + '초 · 클리어 +' + fmt(END_BONUS.clear) + ' · 남은 하트 ' + player.hp + '×' + fmt(END_BONUS.heart)
      + (zoneBonus ? ' · 구역 3/3 +' + fmt(END_BONUS.zones) : '') + (earlyBonus ? ' · ' + ON_TIME + '초 클리어 +' + fmt(END_BONUS.early) : '');
  } else {
    dom.overTitle.textContent = '게임 오버';
    dom.overReason.textContent = lastHit ? lastHit.loseText + ' (' + secs + '초)' : '';
    dom.overLeft.textContent = '남은 보스 ' + (BOSSES.length - bossKills) + '명';
  }
  dom.overLeft.hidden = won;
  if (score > best) { best = score; try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {} }
  $('res-score').textContent = fmt(score);
  $('res-time').textContent = secs + '초';
  $('res-kills').textContent = kills + '번';
  $('res-boss').textContent = bossKills + '/3';
  $('res-zones').textContent = zones.map((z) => (z === 'done' ? '●' : '○')).join(' ') + ' ' + zones.filter((z) => z === 'done').length + '/3';
  $('res-level').textContent = 'Lv.' + level;
  $('res-best').textContent = fmt(best);
  renderHud();
  dom.over.hidden = false;
  $('btn-restart').focus();
  setStatus(won ? '3구역 확보! 점수 ' + fmt(score) : '게임 오버. ' + (lastHit ? lastHit.loseText : ''));
}

/* ==========================================================================
   10. 그리기·루프
   ========================================================================== */
function draw() {
  ctx.fillStyle = PHASES[phaseIdx].bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  if (shake.time > 0) ctx.translate(rand(-shake.power, shake.power), rand(-shake.power, shake.power));

  PLACES.forEach(drawPlace);
  drawPuddles();

  ctx.fillStyle = '#ffd166';
  for (const g of gems) {
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }

  for (const e of enemies) { if (e.boss) drawBoss(e); else drawEnemy(e); }
  drawLaser();
  drawPulse();
  drawPlayer();
  drawOrbs();
  drawEvolveFx();

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
    } else if (p.kind === 'mark') {   // 대구경탄 붉은 자국
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
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

  if (screenFlash) {   // 화면 비네트: 피격 빨강 등. 가장자리가 color, 가운데는 투명. 남은 시간에 비례해 옅어진다
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.7);
    g.addColorStop(0, 'rgba(' + screenFlash.color + ',0)');
    g.addColorStop(1, 'rgba(' + screenFlash.color + ',' + (screenFlash.alpha * screenFlash.life / screenFlash.max).toFixed(2) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (player.hp === 1 && mode === 'play') {   // 하트 1: 가장자리가 심장박동처럼 붉게 맥동(reduceMotion이면 고정)
    const a = HEARTBEAT.alpha + (reduceMotion ? 0 : HEARTBEAT.amp * Math.sin(time * Math.PI * 2 * HEARTBEAT.hz));
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, 'rgba(' + HURT_FLASH.color + ',0)');
    g.addColorStop(1, 'rgba(' + HURT_FLASH.color + ',' + a.toFixed(2) + ')');
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
  const open = i === phaseIdx, done = zones[i] === 'done', miss = zones[i] === 'miss';   // 그 구역의 보스가 죽을 때까지 들어갈 수 있다
  const color = PHASES[i].color;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = open ? 1 : 0.4;
  if (open && !done) {   // 지금 구역의 확보 지점: 맥동 링
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
  ctx.fillText(done ? '완료' : miss ? '놓침' : open ? '확보 지점' : PHASES[i].name, 0, 10);
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
  ctx.strokeStyle = b.rage ? RAGE_LOOK.color : '#17223b'; ctx.lineWidth = Math.max(2, r * 0.07);   // 광폭화: 붉은 테두리
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
  if (b.rage) {                       // 광폭화: 눈썹이 안쪽으로 15° 내려간다
    const tilt = RAGE_LOOK.brow * Math.PI / 180;
    ctx.strokeStyle = RAGE_LOOK.color;
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * r * 0.32, -r * 0.42); ctx.rotate(-side * tilt);
      ctx.beginPath(); ctx.moveTo(-r * 0.17, 0); ctx.lineTo(r * 0.17, 0); ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = '#17223b';
  }
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

// 보스: 예고 → 돌진 잔상 → 광폭 링 → 얼굴(피격 수축) → 피격 플래시 → 머리 위 HP 바(절대 좌표)
function drawBoss(e) {
  if (e.wind) drawTelegraph(e);
  if (e.dash) {    // 돌진 중 잔상
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.dash.angle);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(-e.r * 0.9, 0, e.r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-e.r * 1.8, 0, e.r * 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  if (e.rage) {    // 광폭 링: r+6±3 12Hz 맥동 (reduceMotion이면 고정)
    ctx.strokeStyle = RAGE_LOOK.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + RAGE_LOOK.ring + (reduceMotion ? 0 : RAGE_LOOK.amp * Math.sin(time * Math.PI * 2 * RAGE_LOOK.hz)), 0, Math.PI * 2); ctx.stroke();
  }
  const sc = e.flash > 0 && !reduceMotion ? BOSS_SHRINK.scale + (1 - BOSS_SHRINK.scale) * (1 - e.flash / BOSS_SHRINK.dur) : 1;   // 맞는 순간 움츠렸다 돌아온다
  drawBossFace(e.x, e.y, e.r * sc, e);
  if (e.flash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r * sc + 2, 0, Math.PI * 2); ctx.fill();
  }
  drawHpBar(e, e.x + HEAD_BAR.dx, e.y - e.r + HEAD_BAR.dy, HEAD_BAR.w, HEAD_BAR.h);
}

// 예고 게이지: k(진행률)로 두께 1+4k·alpha 0.3+0.6k. 모양은 PATTERNS.shape — lines 짧은 선 / line 긴 선 / band 밴드 / ring 원 테두리 / spots 점선 원 / slam 안쪽으로 좁혀지는 원
function drawTelegraph(e) {
  const w = e.wind, P = PATTERNS[w.id], k = Math.min(1, w.t / w.dur);
  ctx.save();
  ctx.globalAlpha = TELE_GAUGE.alpha[0] + TELE_GAUGE.alpha[1] * k;
  ctx.lineWidth = TELE_GAUGE.width[0] + TELE_GAUGE.width[1] * k;
  ctx.strokeStyle = w.color; ctx.fillStyle = w.color; ctx.lineCap = 'round';
  if (P.shape === 'lines' || P.shape === 'line') {
    const len = P.shape === 'line' ? TELE_LONG : TELE_LINE, from = e.r + TELE_OFFSET;
    ctx.beginPath();
    for (const d of P.dirs || [0]) {
      const a = w.angle + d * Math.PI / 180;
      ctx.moveTo(e.x + Math.cos(a) * from, e.y + Math.sin(a) * from);
      ctx.lineTo(e.x + Math.cos(a) * (from + len), e.y + Math.sin(a) * (from + len));
    }
    ctx.stroke();
  } else if (P.shape === 'band') {
    ctx.translate(e.x, e.y); ctx.rotate(w.angle);
    ctx.globalAlpha *= 0.35; ctx.fillRect(0, -P.width / 2, TELE_LONG, P.width);
    ctx.globalAlpha = TELE_GAUGE.alpha[0] + TELE_GAUGE.alpha[1] * k; ctx.strokeRect(0, -P.width / 2, TELE_LONG, P.width);
  } else if (P.shape === 'ring') {
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + TELE_RING_R, 0, Math.PI * 2); ctx.stroke();
  } else if (P.shape === 'spots') {
    ctx.setLineDash([8, 6]);
    for (const s of w.spots) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke(); }
  } else if (P.shape === 'slam') {   // 예고 시작 때 고정된 자리(spots[0])에 바깥 원 + 안쪽으로 좁혀지는 원
    const s = w.spots[0];
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(s.x, s.y, e.r + (s.r - e.r) * (1 - k), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawBossShots() {
  for (const s of bossShots) {
    if (s.delay > 0) continue;   // 아직 안 던진 연발
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';   // 흰 테두리로 어두운 배경과 분리
    if (s.kind === 'riceball') {        // 삼각김밥: 김 삼각형 + 밥 띠
      ctx.fillStyle = '#1d2a1e';
      ctx.beginPath(); ctx.moveTo(0, -s.r * 1.3); ctx.lineTo(s.r * 1.2, s.r * 0.8); ctx.lineTo(-s.r * 1.2, s.r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-s.r * 0.35, -s.r * 0.2, s.r * 0.7, s.r * 0.9);
    } else if (s.kind === 'tray') {     // 식판: 회색 원반 + 반찬 칸 3개
      ctx.fillStyle = '#c8ccd0';
      ctx.beginPath(); ctx.arc(0, 0, s.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6b7075';
      for (let k = 0; k < 3; k += 1) {
        const a = k * Math.PI * 2 / 3;
        ctx.beginPath(); ctx.arc(Math.cos(a) * s.r * 0.5, Math.sin(a) * s.r * 0.5, s.r * 0.28, 0, Math.PI * 2); ctx.fill();
      }
    } else {                            // 덤벨: 두꺼운 봉 + 양끝 원판
      ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s.r, 0); ctx.lineTo(s.r, 0); ctx.stroke();
      ctx.fillStyle = '#3a3f44'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.fillRect(-s.r - 5, -s.r * 0.6, 8, s.r * 1.2); ctx.strokeRect(-s.r - 5, -s.r * 0.6, 8, s.r * 1.2);
      ctx.fillRect(s.r - 3, -s.r * 0.6, 8, s.r * 1.2); ctx.strokeRect(s.r - 3, -s.r * 0.6, 8, s.r * 1.2);
    }
    ctx.restore();
  }
}

// 장판: 8각 출렁 폴리곤(r + 3·sin(time·6 + i)), 안쪽 α0.45. grow가 반영된 현재 r로 그린다
function drawPuddles() {
  for (const p of puddles) {
    const color = PUDDLE_COLOR[p.owner];
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = i * Math.PI / 4, r = p.r + 3 * Math.sin(time * 6 + i);
      if (i === 0) ctx.moveTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); else ctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.45 * Math.min(1, p.life / 0.3);   // 끝나기 0.3초 전부터 옅어진다
    ctx.fillStyle = color; ctx.fill();
    ctx.globalAlpha = Math.min(1, p.life / 0.3);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// 위성: 구체 몸 + 흰 테두리. 진화(위성군)면 보라
function drawOrbs() {
  if (!orbs.length) return;
  ctx.fillStyle = player.evolved.orbit ? TIERS.evolve.color : TIERS.weapon.color;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  for (const o of orbs) { ctx.beginPath(); ctx.arc(o.x, o.y, ORB_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
}

// 펄스: 플레이어에서 반경 r까지 PULSE_RING_DUR 동안 퍼지는 링
function drawPulse() {
  if (!pulseFx) return;
  const k = pulseFx.t / PULSE_RING_DUR;
  ctx.globalAlpha = 1 - k;
  ctx.strokeStyle = player.evolved.pulse ? TIERS.evolve.color : TIERS.weapon.color; ctx.lineWidth = 3 + 3 * (1 - k);
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r + (pulseFx.r - player.r) * k, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
}

// 진화 합체: EVOLVE_DUR 동안 플레이어 주위로 보라 링이 퍼지며 옅어진다
function drawEvolveFx() {
  if (!evolveFx) return;
  const k = evolveFx.t / EVOLVE_DUR;
  ctx.globalAlpha = 1 - k;
  ctx.strokeStyle = TIERS.evolve.color; ctx.lineWidth = 2 + 6 * (1 - k);
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r + 6 + 90 * k, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
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
  ctx.fillText(score.toLocaleString('ko-KR'), W / 2, 20);
  ctx.font = '700 14px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Lv.' + level, W - 50, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(W - 40, 4, 32, 32);   // 일시정지 버튼 32×32 — 폰엔 P 키가 없어서
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillRect(W - 29, 12, 4, 16); ctx.fillRect(W - 19, 12, 4, 16);

  // 진행 바 3칸(1·2·3구역). 칸마다 그 구역의 상태 — 진행 중: 보스 등장까지 채움 / 보스전: 붉은 맥동 / 완료: 구역색. 칸 끝 빨간 눈금 = 보스 등장
  const bx = 12, bw = W - 24, by = 38, bh = 6, gap = 4, sw = (bw - gap * 2) / 3;
  PHASES.forEach((p, i) => {
    const sx = bx + i * (sw + gap), bossNow = i === phaseIdx && bossCalled;
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(sx, by, sw, bh);
    if (i < phaseIdx) { ctx.fillStyle = p.color; ctx.fillRect(sx, by, sw, bh); }
    else if (bossNow) { ctx.fillStyle = 'rgba(230,57,70,' + (0.55 + 0.45 * Math.sin(time * 8)).toFixed(2) + ')'; ctx.fillRect(sx, by, sw, bh); }
    else if (i === phaseIdx) { ctx.fillStyle = p.color; ctx.fillRect(sx, by, sw * Math.min(1, (time - phaseStart) / p.bossAt), bh); }
    if (i >= phaseIdx && !bossNow) { ctx.fillStyle = '#e63946'; ctx.fillRect(sx + sw - 2, by - 3, 2, bh + 6); }
  });
  ctx.font = '700 13px "Noto Sans KR", sans-serif';   // 칸 라벨 = 확보 지점 이름(GS25/학생식당/트러스트짐) + 확보 점
  ctx.textAlign = 'left';
  PHASES.forEach((p, i) => {
    const cx = bx + i * (sw + gap) + sw / 2, label = PLACES[i].name;
    const tw = ctx.measureText(label).width, x0 = cx - (tw + 14) / 2;   // 글자 + 점을 한 덩어리로 칸 가운데에
    ctx.fillStyle = i === phaseIdx ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.fillText(label, x0, 54);
    ctx.beginPath(); ctx.arc(x0 + tw + 10, 54, 4, 0, Math.PI * 2);   // 확보 점: 완료 채움 / 대기 테두리 / 놓침 회색
    if (zones[i] === 'done') { ctx.fillStyle = p.color; ctx.fill(); }
    else if (zones[i] === 'miss') { ctx.fillStyle = '#666'; ctx.fill(); }
    else { ctx.strokeStyle = p.color; ctx.lineWidth = 1.5; ctx.stroke(); }
  });
  ctx.fillStyle = 'rgba(255,255,255,0.6)';   // 총 경과 시간 "1:37" — 작게, 오른쪽 끝
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(Math.floor(time / 60) + ':' + String(Math.floor(time % 60)).padStart(2, '0'), W - 12, 54);

  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, HUD_H - 4, W, 3);   // 경험치 바
  ctx.fillStyle = '#fff'; ctx.fillRect(0, HUD_H - 4, W * Math.min(1, xp / nextXp), 3);

  // 살아 있는 보스(한 번에 1명) 이름 + HP 한 줄
  enemies.filter((e) => e.boss && !e.dead).forEach((boss, i) => {
    const y = HUD_H + i * 18;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, y, W, 18);
    ctx.fillStyle = boss.color;
    ctx.font = '700 14px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(boss.name, 12, y + 9);
    drawHpBar(boss, 140, y + 3, W - 152, 12);
  });
}

// 보스 HP 바 공용(머리 위·HUD): 붉은 잔상(hpGhost) 먼저 → 보스색(hp) → 50% 흰 눈금 → P2면 붉게 맥동
function drawHpBar(e, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = RAGE_LOOK.color; ctx.fillRect(x, y, w * Math.max(0, e.hpGhost / e.maxHp), h);
  ctx.fillStyle = e.color; ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), h);
  if (e.rage) { ctx.fillStyle = 'rgba(230,57,70,' + (0.25 + 0.25 * Math.sin(time * 8)).toFixed(2) + ')'; ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), h); }
  ctx.fillStyle = '#fff'; ctx.fillRect(x + w * RAGE_AT - 1, y, 2, h);
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
  drawBossFace(faceX, H * 0.36, 52, b);

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
  let dt = Math.min(now - last, 50) / 1000;   // 탭 전환 등으로 커진 dt는 50ms로 자름
  last = now;
  if (mode === 'play') {
    const real = dt;   // 히트스톱은 실시간으로 잰다 — 슬로모 안에서 늘어나지 않게
    if (slowmo > 0) { slowmo -= dt; dt *= SLOWMO_RATE; }   // 슬로모: 남은 시간은 실시간으로 줄고, 게임은 느리게 흐른다
    if (hitStop > 0) hitStop -= real;   // 히트스톱: 이 프레임은 멈춤
    else update(dt);
  } else if (mode === 'intro') {   // 컷신: 시간만 흐르고 게임은 멈춤
    intro.t += dt;
    updateEffects(dt);
    if (intro.t >= intro.dur) {
      spawnBoss(intro.boss); intro = null; mode = 'play';
      if (pauseAfterIntro) { pauseAfterIntro = false; pauseGame(); }   // 컷신 중 탭을 떠났으면 끝나는 즉시 멈춤
    }
  } else if (mode === 'dying') {   // 죽는 순간: DYING.dur초 슬로모(×DYING.rate), 입력 없음
    const s = dt * DYING.rate;
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
