import { recordChapterCompleted, updateUnlockedCheckpoints, getProgress } from '../samaa/checkpoints.js';
import { renderProgress } from '../samaa/progress.js';

async function loadData() {
  const response = await fetch('./data/artifacts.json');
  if (!response.ok) throw new Error('Could not load stories.');
  return response.json();
}

export async function renderStories() {
  const host = document.querySelector('#story-list');
  if (!host) return;
  const [items, progress, destinations] = await Promise.all([
    loadData(),
    Promise.resolve(getProgress()),
    fetch('./data/destinations.json').then((response) => {
      if (!response.ok) throw new Error('Could not load destination image references.');
      return response.json();
    })
  ]);
  const fallbackByCategory = {
    Moon: destinations.find((destination) => destination.id === 'moon'),
    Mars: destinations.find((destination) => destination.id === 'mars'),
    Asteroids: destinations.find((destination) => destination.id === 'deep-space'),
    'Deep Space / Other Orbits': destinations.find((destination) => destination.id === 'deep-space')
  };
  host.innerHTML = items.map((item, index) => {
    const complete = progress.completedChapters.includes(item.id);
    const fallback = fallbackByCategory[item.category] || fallbackByCategory['Deep Space / Other Orbits'];
    const imageUrl = item.image || fallback?.image || '';
    const imageAlt = item.imageAlt || fallback?.imageAlt || `NASA mission image related to ${item.category}`;
    const imageCredit = item.imageCredit || fallback?.imageCredit || 'NASA image source';
    return `<article class="story-card field-note-card${complete ? ' is-complete' : ''}">
      <figure class="field-note-media"><img src="${imageUrl}" alt="${imageAlt}" loading="lazy" decoding="async"><span class="field-note-fallback" hidden>NASA image unavailable</span><figcaption><a href="${item.image || item.sourceUrl}" target="_blank" rel="noopener noreferrer">${imageCredit} ↗</a></figcaption></figure>
      <div class="field-note-content"><p class="field-note-index">FIELD NOTE / ${String(index + 1).padStart(2, '0')} <span>${item.category}</span></p>
      <p class="meta">${item.mission}</p><h3>${item.storyTitle}</h3><p class="field-note-description">${item.story}</p>
      <a class="source-link" href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">Open NASA reference <span aria-hidden="true">↗</span></a>
      <button class="story-action" type="button" data-chapter="${item.id}" ${complete ? 'disabled' : ''}>${complete ? '✓ Story complete' : 'Mark Story Complete'}</button></div>
    </article>`;
  }).join('');
  host.querySelectorAll('.field-note-media img').forEach((image) => {
    image.addEventListener('error', () => {
      const media = image.closest('.field-note-media');
      media?.classList.add('image-unavailable');
      image.remove();
      const fallback = media?.querySelector('.field-note-fallback');
      if (fallback) fallback.hidden = false;
    }, { once: true });
  });
  host.addEventListener('click', (event) => {
    const button = event.target.closest('[data-chapter]');
    if (!button || !recordChapterCompleted(button.dataset.chapter)) return;
    updateUnlockedCheckpoints();
    button.textContent = '✓ Story complete';
    button.disabled = true;
    button.closest('.field-note-card')?.classList.add('is-complete');
    renderProgress();
  });
}
