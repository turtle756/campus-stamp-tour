const CSV_URL = 'data/cpi_food.csv';
const TREND_ITEMS = ['외식', '구내식당식사비', '소비자물가 전체'];
const TREND_YEARS = [2021, 2022, 2023, 2024, 2025];
const ITEM_YEAR = 2024;
const ITEM_ORDER = ['삼각김밥', '편의점도시락', '김밥', '햄버거', '떡볶이', '도시락', '구내식당식사비', '외식'];

const COLORS = {
  '외식': '#ff6b35',
  '구내식당식사비': '#2d5016',
  '소비자물가 전체': '#8ba1ad',
  '삼각김밥': '#00aeef',
  '편의점도시락': '#00aeef',
  default: '#a0522d',
};

const tabs = document.querySelectorAll('.chart-tabs .tab');
const panels = document.querySelectorAll('.chart-panel');
const charts = {};
let rows = [];

function showTab(id) {
  panels.forEach((p) => p.classList.toggle('is-active', p.dataset.tab === id));
  tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.tab === id)));
  if (charts[id]) charts[id].resize();
}

tabs.forEach((tab) => tab.addEventListener('click', () => showTab(tab.dataset.tab)));

function showError(message) {
  const el = document.getElementById('load-error');
  el.textContent = message;
  el.hidden = false;
}

function setNotice(id, missing) {
  const el = document.getElementById(`notice-${id}`);
  if (!missing.length) {
    el.hidden = true;
    return;
  }
  el.textContent = `아직 값이 확인되지 않은 칸: ${missing.join(', ')} — 0으로 채우지 않고 비워 두었습니다.`;
  el.hidden = false;
}

function valueOf(item, year) {
  const row = rows.find((r) => r.item === item && r.year === year);
  return row && typeof row.rate_pct === 'number' ? row.rate_pct : null;
}

function renderTable(id, header, body) {
  const table = document.getElementById(`table-${id}`);
  const thead = `<thead><tr>${header.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${body.map((r) => `<tr>${r.map((c, i) => `<td class="${i > 0 ? 'num' : ''}">${c ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody>`;
  table.insertAdjacentHTML('beforeend', thead + tbody);
}

function buildTrend() {
  const missing = [];
  const datasets = TREND_ITEMS.map((item) => ({
    label: item,
    data: TREND_YEARS.map((year) => {
      const v = valueOf(item, year);
      if (v === null) missing.push(`${item} ${year}`);
      return v;
    }),
    backgroundColor: COLORS[item],
    borderRadius: 4,
  }));
  setNotice('trend', missing);
  renderTable('trend', ['연도', ...TREND_ITEMS], TREND_YEARS.map((y) => [y, ...TREND_ITEMS.map((i) => valueOf(i, y))]));

  if (!window.Chart) return;
  charts.trend = new Chart(document.getElementById('chart-trend'), {
    type: 'bar',
    data: { labels: TREND_YEARS.map(String), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y === null ? '미확인' : c.parsed.y + '%'}` } },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '전년 대비 상승률 (%)' }, ticks: { callback: (v) => `${v}%` } },
        x: { title: { display: true, text: '연도' } },
      },
    },
  });
}

function buildItems() {
  const missing = [];
  const labels = ITEM_ORDER.filter((item) => rows.some((r) => r.item === item && r.year === ITEM_YEAR));
  const data = labels.map((item) => {
    const v = valueOf(item, ITEM_YEAR);
    if (v === null) missing.push(item);
    return v;
  });
  setNotice('items', missing);
  renderTable('items', ['품목', `${ITEM_YEAR}년 상승률`], labels.map((l, i) => [l, data[i]]));

  if (!window.Chart) return;
  charts.items = new Chart(document.getElementById('chart-items'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: `${ITEM_YEAR}년 전년 대비 상승률`,
        data,
        backgroundColor: labels.map((l) => COLORS[l] || COLORS.default),
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => (c.parsed.x === null ? '미확인' : `${c.parsed.x}%`) } },
      },
      scales: {
        x: { beginAtZero: true, title: { display: true, text: '전년 대비 상승률 (%)' }, ticks: { callback: (v) => `${v}%` } },
      },
    },
  });
}

function onParsed(result) {
  if (result.errors && result.errors.length) {
    showError(`CSV 일부 행을 읽지 못했습니다: ${result.errors[0].message}`);
  }
  rows = (result.data || []).filter((r) => r.item && Number.isInteger(r.year));
  if (!rows.length) {
    showError('CSV에 읽을 수 있는 데이터가 없습니다. data/cpi_food.csv 파일을 확인하세요.');
    return;
  }
  if (!window.Chart) {
    showError('Chart.js를 불러오지 못했습니다. 아래 원자료 표로 값을 확인할 수 있습니다.');
  }
  buildTrend();
  buildItems();
}

if (!window.Papa) {
  showError('CSV 파서(Papa Parse)를 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 새로고침하세요.');
} else {
  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: onParsed,
    error: (err) => showError(`CSV를 불러오지 못했습니다: ${err.message || err}`),
  });
}
