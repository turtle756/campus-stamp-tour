const KEY = 'plannedPlaces';
const VERSION_KEY = 'plannedPlaces:version';
const VERSION = 1;

const buttons = document.querySelectorAll('[data-plan]');
const summary = document.getElementById('plan-summary');
const clearBtn = document.getElementById('plan-clear');

function migrate() {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored === String(VERSION)) return;
  // 버전이 없거나 다르면 이전 형식은 버리고 빈 목록으로 시작
  if (stored !== null) localStorage.removeItem(KEY);
  localStorage.setItem(VERSION_KEY, String(VERSION));
}

function load() {
  try {
    migrate();
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

function save(set) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    summary.textContent = '이 브라우저에서는 저장할 수 없습니다(사생활 보호 모드 등). 새로고침하면 목록이 사라집니다.';
  }
}

function render(set) {
  const names = [];
  buttons.forEach((btn) => {
    const on = set.has(btn.dataset.plan);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? '✓ 방문 예정' : '방문 예정에 추가';
    btn.closest('.place-card')?.classList.toggle('is-planned', on);
    if (on) names.push(btn.dataset.planName);
  });
  summary.textContent = set.size
    ? `방문 예정 ${set.size}곳 · ${names.join(', ')}`
    : '아직 방문 예정으로 표시한 장소가 없습니다. 카드의 버튼을 눌러 보세요.';
  clearBtn.hidden = set.size === 0;
}

let planned = load();
render(planned);

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.plan;
    if (planned.has(id)) planned.delete(id);
    else planned.add(id);
    save(planned);
    render(planned);
  });
});

clearBtn.addEventListener('click', () => {
  if (!confirm('방문 예정 목록을 모두 지울까요?')) return;
  planned.clear();
  save(planned);
  render(planned);
});

window.addEventListener('storage', (e) => {
  if (e.key === KEY || e.key === VERSION_KEY) {
    planned = load();
    render(planned);
  }
});
