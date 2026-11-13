const STORAGE_KEY = 'cosmic-campsite.selectedDestination';
const VALID_DESTINATIONS = ['moon', 'mars', 'deep-space'];
let memorySelection = null;

async function loadData() {
  const response = await fetch('./data/destinations.json');
  if (!response.ok) throw new Error('Could not load destinations.');
  return response.json();
}

export function getSelectedDestination() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && VALID_DESTINATIONS.includes(saved.id) && typeof saved.name === 'string') return saved;
  } catch { /* Fall back to this page's in-memory selection. */ }
  return memorySelection;
}

export function setSelectedDestination(destination) {
  if (!destination || !VALID_DESTINATIONS.includes(destination.id) || typeof destination.name !== 'string') return false;
  memorySelection = { id: destination.id, name: destination.name };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memorySelection)); } catch { /* Keep the selection for this page visit. */ }
  return true;
}

export async function renderDestinations() {
  const host = document.querySelector('#destination-list');
  if (!host) return;
  const destinations = await loadData();
  const selected = getSelectedDestination();
  host.innerHTML = destinations.map((item, index) => `
    <article class="destination-card destination-card--${item.accent}${selected?.id === item.id ? ' is-selected' : ''}" data-destination-card="${item.id}" style="--card-order:${index}">
      <img class="destination-card__image" src="${item.image}" alt="${item.imageAlt}" loading="lazy" data-destination-image>
      <div class="destination-card__shade"></div>
      <div class="destination-card__content">
        <p class="destination-card__type">${item.type}</p>
        <h3>${item.name}</h3>
        <p class="destination-card__intro">${item.description}</p>
        <ul class="destination-card__facts">${item.facts.map((fact) => `<li>${fact}</li>`).join('')}</ul>
      <a class="destination-card__explore" href="#equipment" data-explore-destination="${item.id}" aria-label="Explore ${item.name}">Explore destination <span aria-hidden="true">↗</span></a>
      </div>
      <span class="destination-card__credit">${item.imageCredit}</span>
    </article>`).join('');

  host.querySelectorAll('[data-destination-image]').forEach((image) => {
    image.addEventListener('error', () => image.classList.add('image-unavailable'), { once: true });
  });
  host.addEventListener('click', (event) => {
    const link = event.target.closest('[data-explore-destination]');
    if (!link) return;
    const destination = destinations.find((item) => item.id === link.dataset.exploreDestination);
    if (!destination) { event.preventDefault(); return; }
    setSelectedDestination(destination);
    document.dispatchEvent(new CustomEvent('cosmic-destination-selected'));
    host.querySelectorAll('.destination-card').forEach((card) => {
      const isSelected = card.dataset.destinationCard === destination.id;
      card.classList.toggle('is-selected', isSelected);
      card.querySelector('.destination-card__explore')?.setAttribute('aria-current', isSelected ? 'step' : 'false');
    });
  });
}
