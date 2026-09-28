const tabs = document.querySelectorAll('.place-tabs .tab');
const places = document.querySelectorAll('.place');
const DEFAULT_PLACE = 'store';

function showPlace(id) {
  places.forEach((section) => {
    const isTarget = section.dataset.place === id;
    section.style.display = isTarget ? 'block' : 'none';
    if (isTarget) {
      const frame = section.querySelector('iframe[data-src]');
      if (frame) {
        frame.src = frame.dataset.src;
        frame.removeAttribute('data-src');
      }
    }
  });

  tabs.forEach((tab) => {
    tab.setAttribute('aria-pressed', String(tab.dataset.place === id));
  });

  if (location.hash !== `#${id}`) {
    history.replaceState(null, '', `#${id}`);
  }
}

function placeFromHash() {
  const id = location.hash.replace('#', '');
  return [...places].some((s) => s.dataset.place === id) ? id : DEFAULT_PLACE;
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => showPlace(tab.dataset.place));
});

window.addEventListener('hashchange', () => showPlace(placeFromHash()));

showPlace(placeFromHash());
