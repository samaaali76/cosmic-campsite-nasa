import { getSelectedDestination } from './destinations.js';
import { recordEquipmentExplored } from '../samaa/checkpoints.js';
import { renderProgress } from '../samaa/progress.js';

async function loadJSON(path, message) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(message);
  return response.json();
}

function cardMarkup(item, index) {
  return `<article class="card equipment-card" style="--card-order:${index}">
    <div class="equipment-card__media"><img src="${item.image}" alt="${item.imageAlt}" loading="lazy" data-equipment-image><span class="equipment-image-fallback" hidden>NASA image unavailable</span><span>${item.category}</span></div>
    <div class="equipment-card__body"><p class="meta">${item.mission}</p><h3>${item.name}</h3><p>${item.description}</p><p class="equipment-purpose"><strong>Purpose</strong>${item.purpose}</p>
      <button class="equipment-details-button" type="button" data-equipment-details="${item.id}" aria-controls="equipment-detail">View details <span aria-hidden="true">↗</span></button>
    </div>
  </article>`;
}

function detailMarkup(item) {
  const storyAction = item.storyId
    ? `<a class="equipment-story-link" href="#stories" data-open-artifact-story="${item.storyId}">Open mission story <span aria-hidden="true">↗</span></a>`
    : '<p class="equipment-story-unavailable">A detailed mission story is not available for this item yet.</p>';
  return `<div class="equipment-detail__top"><div><p class="eyebrow">Equipment briefing · ${item.mission}</p><h3>${item.name}</h3></div><button type="button" class="equipment-detail__close" data-close-equipment-details aria-label="Close equipment details">×</button></div>
    <div class="equipment-detail__layout"><div class="equipment-detail__image"><img src="${item.image}" alt="${item.imageAlt}" data-equipment-image><span class="equipment-image-fallback" hidden>NASA image unavailable</span></div><div class="equipment-detail__copy">
      <p><strong>What it is</strong>${item.overview}</p><p><strong>Why it was sent</strong>${item.whySent}</p><p><strong>Purpose</strong>${item.purpose}</p><p><strong>Mission information</strong>${item.missionInfo}</p>
      <a class="equipment-source" href="${item.source}" target="_blank" rel="noopener noreferrer">Read the NASA mission page ↗</a>
      ${storyAction}
    </div></div>`;
}

function watchImage(image) {
  image.addEventListener('error', () => {
    image.classList.add('image-unavailable');
    const fallback = image.parentElement.querySelector('.equipment-image-fallback');
    if (fallback) fallback.hidden = false;
  }, { once: true });
}

export async function renderEquipment() {
  const host = document.querySelector('#equipment-list');
  const label = document.querySelector('#equipment-destination');
  const detail = document.querySelector('#equipment-detail');
  if (!host || !label || !detail) return;

  const [destinations, equipment] = await Promise.all([
    loadJSON('./data/destinations.json', 'Could not load destinations.'),
    loadJSON('./data/equipment.json', 'Could not load equipment.')
  ]);
  const saved = getSelectedDestination();
  const destination = destinations.find((item) => item.id === saved?.id);
  detail.hidden = true;
  detail.innerHTML = '';
  if (!destination) {
    label.textContent = 'Choose a destination to begin your equipment exploration.';
    host.innerHTML = '<div class="equipment-empty"><p>Your mission briefing is waiting.</p><a class="button" href="#destinations">Choose a destination</a></div>';
    document.querySelector('#equipment-heading').textContent = 'Equipment exploration';
    return;
  }

  document.querySelector('#equipment-heading').textContent = `${destination.name} · Field equipment`;
  label.textContent = `${destination.name} selected · Explore the machines associated with this destination.`;
  const items = equipment.filter((item) => item.destinationId === destination.id);
  host.innerHTML = items.length ? items.map(cardMarkup).join('') : '<p class="empty-state">No equipment is available for this destination yet.</p>';

  host.onclick = (event) => {
    const button = event.target.closest('[data-equipment-details]');
    if (!button) return;
    const selected = items.find((item) => item.id === button.dataset.equipmentDetails);
    if (!selected) return;
    recordEquipmentExplored(selected.id);
    renderProgress();
    detail.innerHTML = detailMarkup(selected);
    detail.querySelectorAll('[data-equipment-image]').forEach(watchImage);
    detail.hidden = false;
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  detail.onclick = (event) => {
    if (!event.target.closest('[data-close-equipment-details]')) return;
    detail.hidden = true;
    detail.innerHTML = '';
  };
  host.querySelectorAll('[data-equipment-image]').forEach(watchImage);
}

document.addEventListener('cosmic-destination-selected', renderEquipment);
