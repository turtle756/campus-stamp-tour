// 학관(GS25·학생식당)은 성심교정 대표 좌표, 트러스트짐은 Google 지도가 '지봉로 43 트러스트짐'으로 찍는 좌표.
const PLACES = [
  { id: 'store',     name: '학관 1층 GS25',    lat: 37.4865549, lng: 126.8018828, href: 'store.html' },
  { id: 'cafeteria', name: '학관 2층 학생식당', lat: 37.4865549, lng: 126.8018828, href: 'cafeteria.html' },
  { id: 'gym',       name: '교내 트러스트짐',   lat: 37.4859124, lng: 126.8019788, href: 'gym.html' },
];
const WALK_M_PER_MIN = 80;

const btn = document.getElementById('nearby-btn');
const status = document.getElementById('nearby-status');
const list = document.getElementById('nearby-list');

function setStatus(state, text) {
  status.dataset.state = state;
  status.textContent = text;
}

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(m) {
  return m < 1000 ? `약 ${Math.round(m / 10) * 10} m` : `약 ${(m / 1000).toFixed(1)} km`;
}

function renderList(here) {
  const rows = PLACES
    .map((p) => ({ ...p, meters: haversineMeters(here, p) }))
    .sort((a, b) => a.meters - b.meters);

  list.innerHTML = rows.map((p, i) => `
    <li>
      <a href="${p.href}">${i === 0 ? '<strong>가장 가까움 · </strong>' : ''}${p.name}</a>
      <span>${formatDistance(p.meters)} · 도보 약 ${Math.max(1, Math.round(p.meters / WALK_M_PER_MIN))}분</span>
    </li>`).join('');
  list.hidden = false;
}

function onSuccess(position) {
  const here = { lat: position.coords.latitude, lng: position.coords.longitude };
  renderList(here);
  const acc = Math.round(position.coords.accuracy);
  setStatus('success', `현재 위치 기준으로 계산했습니다(오차 약 ${acc} m). 좌표는 저장하지 않고 이 계산에만 썼습니다.`);
  btn.disabled = false;
}

function onError(err) {
  btn.disabled = false;
  list.hidden = true;
  if (err.code === err.PERMISSION_DENIED) {
    setStatus('denied', '위치 권한이 거부되었습니다. 거리 없이도 세 장소는 모두 성심교정 안에 있습니다. 다시 허용하려면 주소창의 자물쇠(사이트 정보)에서 위치 권한을 바꿔 주세요.');
  } else if (err.code === err.TIMEOUT) {
    setStatus('timeout', '두 번 시도했지만 위치를 가져오지 못했습니다. 기기 설정에서 위치 방식이 "높은 정확도"인지 확인하고, 실내라면 창가에서 다시 시도해 주세요.');
  } else {
    setStatus('error', '지금은 위치를 확인할 수 없습니다. 기기의 위치 서비스가 켜져 있는지 확인해 주세요.');
  }
}

btn.addEventListener('click', () => {
  if (!('geolocation' in navigator)) {
    setStatus('unsupported', '이 브라우저는 위치 확인을 지원하지 않습니다.');
    return;
  }
  if (!window.isSecureContext) {
    setStatus('unsupported', '위치 확인은 HTTPS 주소에서만 동작합니다.');
    return;
  }
  btn.disabled = true;
  list.hidden = true;
  setStatus('pending', '위치 확인 중… 브라우저가 권한을 물으면 "허용"을 눌러 주세요.');
  requestPosition(FAST, false);
});

// 실내에서는 저정밀(네트워크) 위치가 15초 안에 안 잡히는 경우가 있어
// 시간 초과면 고정밀(GPS)로 한 번 더 시도합니다. 5분 이내 캐시 위치는 그대로 씁니다.
const FAST = { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 };
const PRECISE = { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 };

function requestPosition(options, isRetry) {
  navigator.geolocation.getCurrentPosition(onSuccess, (err) => {
    if (err.code === err.TIMEOUT && !isRetry) {
      setStatus('pending', '아직 위치를 못 잡았습니다. 더 정밀한 방식으로 한 번 더 시도합니다(최대 25초)…');
      requestPosition(PRECISE, true);
      return;
    }
    onError(err);
  }, options);
}
