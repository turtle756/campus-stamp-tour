const tabs = document.querySelectorAll('.place-tabs .tab');
const places = document.querySelectorAll('.place');
const DEFAULT_PLACE = 'store';

function showPlace(id) {
  places.forEach((section) => {
    const isTarget = section.dataset.place === id;
    section.style.display = isTarget ? 'block' : 'none';
    if (isTarget) {
      const frame = section.querySelector('.map-frame[data-map-key]');
      if (frame) renderKakaoMap(frame);
    }
  });

  tabs.forEach((tab) => {
    tab.setAttribute('aria-pressed', String(tab.dataset.place === id));
  });

  if (location.hash !== `#${id}`) {
    history.replaceState(null, '', `#${id}`);
  }
}

const MAP_W = 640;
const MAP_H = 360;

function fitMap(frame) {
  frame.style.setProperty('--map-scale', String(frame.clientWidth / MAP_W));
}

// 카카오 "지도 퍼가기"는 컨테이너 id가 timestamp로 정해져 있어, 같은 지도를 쓰는
// 두 장소(GS25·학생식당)는 이미 그려진 노드를 옮겨 씁니다.
function renderKakaoMap(frame) {
  const { mapTs, mapKey } = frame.dataset;
  const id = `daumRoughmapContainer${mapTs}`;
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement('div');
    node.id = id;
    node.className = 'root_daum_roughmap root_daum_roughmap_landing';
    frame.appendChild(node);
    if (window.daum && daum.roughmap) {
      new daum.roughmap.Lander({
        timestamp: mapTs,
        key: mapKey,
        mapWidth: String(MAP_W),
        mapHeight: String(MAP_H),
      }).render();
    }
  } else if (node.parentElement !== frame) {
    frame.appendChild(node);
  }
  fitMap(frame);
}

window.addEventListener('resize', () => {
  document.querySelectorAll('.map-frame[data-map-key]').forEach(fitMap);
});

function placeFromHash() {
  const id = location.hash.replace('#', '');
  return [...places].some((s) => s.dataset.place === id) ? id : DEFAULT_PLACE;
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => showPlace(tab.dataset.place));
});

window.addEventListener('hashchange', () => showPlace(placeFromHash()));

showPlace(placeFromHash());
