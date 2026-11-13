import { getSelectedDestination, setSelectedDestination } from './destinations.js';
import { recordArtifactStoryRead } from '../samaa/checkpoints.js';
import { renderProgress } from '../samaa/progress.js';

const STORY_KEY = 'cosmic-campsite.selectedArtifactStory';

async function loadJSON(path, message) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(message);
  return response.json();
}

function getStoredStoryId() {
  try { return localStorage.getItem(STORY_KEY); }
  catch { return null; }
}

function storeStoryId(id) {
  try { localStorage.setItem(STORY_KEY, id); }
  catch { /* The current page can still show the selected story without persistence. */ }
}

function hideStoryView(host) {
  host.hidden = true;
  host.innerHTML = '';
}

function missingStoryMarkup() {
  return `<div class="artifact-story__top"><p class="eyebrow">Mission story</p><h3>Story unavailable</h3></div>
    <p>This equipment item does not have a matching story yet. You can return to the equipment list and keep exploring.</p>
    <nav class="artifact-story__navigation" aria-label="Story navigation"><a href="#equipment">← Back to equipment</a><a href="#destinations">Choose destination</a></nav>`;
}

async function renderArtifactStoryIndex() {
  const host = document.querySelector('#artifact-story-index');
  if (!host) return;
  try {
    const [stories, equipment] = await Promise.all([
      loadJSON('./data/artifact-stories.json', 'Could not load mission stories.'),
      loadJSON('./data/equipment.json', 'Could not load equipment.')
    ]);
    const linkedStories = stories.map((story) => ({
      story,
      equipment: equipment.find((item) => item.id === story.equipmentId && item.storyId === story.id)
    })).filter((entry) => entry.equipment);
    host.innerHTML = linkedStories.map(({ story, equipment: item }) => `<article class="card artifact-story-index__card">
      <figure class="artifact-story-index__media"><img src="${item.image}" alt="${item.imageAlt}" loading="lazy" decoding="async"><span class="equipment-image-fallback" hidden>NASA image unavailable</span></figure>
      <p class="meta">${item.destinationId.replace('-', ' ')} · ${item.mission}</p><h3>${item.name}</h3><p>${item.description}</p>
      <a class="equipment-story-link" href="#stories" data-open-artifact-story="${story.id}" data-story-destination="${item.destinationId}">Read mission story <span aria-hidden="true">↗</span></a>
    </article>`).join('');
    host.querySelectorAll('.artifact-story-index__media img').forEach((image) => image.addEventListener('error', () => {
      image.classList.add('image-unavailable');
      const fallback = image.parentElement.querySelector('.equipment-image-fallback');
      if (fallback) fallback.hidden = false;
    }, { once: true }));
    if (linkedStories.length !== stories.length) console.warn('Some mission stories have no matching equipment entry.');
  } catch (error) {
    host.innerHTML = '<p class="empty-state">Mission stories could not load. Please try again later.</p>';
    console.error('Could not load the mission story index:', error);
  }
}

function storyMarkup(story, equipment, previous, next, position, total) {
  const discoveries = story.majorDiscoveries.map((item) => `<li>${item}</li>`).join('');
  const facts = story.facts.map((item) => `<li>${item}</li>`).join('');
  const sources = story.sources.map((item) => `<li><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.label} ↗</a></li>`).join('');
  return `<div class="artifact-story__hero"><img src="${equipment.image}" alt="${equipment.imageAlt}" loading="lazy" data-story-image><span class="equipment-image-fallback" hidden>NASA image unavailable</span><div class="artifact-story__hero-shade"></div><div class="artifact-story__top"><div><p class="eyebrow">Artifact learning story · ${equipment.mission}</p><h3>${equipment.name}</h3></div><p class="artifact-story__count">${position} of ${total}</p></div></div>
    <section class="artifact-story__chapter"><h4>Mission overview</h4><p>${story.missionOverview}</p></section>
    <section class="artifact-story__chapter"><h4>Major discoveries</h4><ul>${discoveries}</ul></section>
    <section class="artifact-story__chapter"><h4>Current mission status</h4><p>${story.status}</p></section>
    <section class="artifact-story__chapter"><h4>Current location</h4><p>${story.location}</p></section>
    <section class="artifact-story__chapter"><h4>Interesting facts</h4><ul>${facts}</ul></section>
    <section class="artifact-story__sources"><h4>Sources</h4><ul>${sources}</ul></section>
    <nav class="artifact-story__navigation" aria-label="Story navigation">
      <button type="button" data-story-id="${previous?.id || ''}" ${previous ? '' : 'disabled'}>← Previous story</button>
      <a href="#equipment">Back to equipment</a>
      <a href="#destinations">Choose destination</a>
      <button type="button" data-story-id="${next?.id || ''}" ${next ? '' : 'disabled'}>Next story →</button>
    </nav>`;
}

async function renderArtifactStory(requestedId = getStoredStoryId()) {
  const host = document.querySelector('#artifact-story-view');
  if (!host) return;
  if (!requestedId) { hideStoryView(host); return; }

  let stories;
  let equipment;
  try {
    [stories, equipment] = await Promise.all([
      loadJSON('./data/artifact-stories.json', 'Could not load mission stories.'),
      loadJSON('./data/equipment.json', 'Could not load equipment.')
    ]);
  } catch {
    host.hidden = false;
    host.innerHTML = `<div class="artifact-story__top"><p class="eyebrow">Mission story</p><h3>Story could not load</h3></div><p>Return to equipment and try opening the mission story again.</p><nav class="artifact-story__navigation"><a href="#equipment">← Back to equipment</a><a href="#destinations">Choose destination</a></nav>`;
    return;
  }
  const destination = getSelectedDestination();
  const available = equipment
    .filter((item) => item.destinationId === destination?.id && item.storyId && stories.some((story) => story.id === item.storyId && story.equipmentId === item.id));
  const equipmentItem = available.find((item) => item.storyId === requestedId);
  const story = equipmentItem && stories.find((item) => item.id === requestedId && item.equipmentId === equipmentItem.id);

  host.hidden = false;
  if (!story || !equipmentItem) {
    host.innerHTML = missingStoryMarkup();
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const index = available.indexOf(equipmentItem);
  host.innerHTML = storyMarkup(story, equipmentItem, available[index - 1], available[index + 1], index + 1, available.length);
  const storyImage = host.querySelector('[data-story-image]');
  storyImage?.addEventListener('error', () => {
    storyImage.classList.add('image-unavailable');
    const fallback = storyImage.parentElement.querySelector('.equipment-image-fallback');
    if (fallback) fallback.hidden = false;
  }, { once: true });
  recordArtifactStoryRead(story.id);
  renderProgress();
  const journeyActions = document.createElement('nav');
  journeyActions.className = 'journey-actions';
  journeyActions.setAttribute('aria-label', 'Continue learning');
  journeyActions.innerHTML = `<a href="#timeline" data-related-timeline-story="${story.id}">Explore related timeline events</a><a href="#equipment">Continue to checkpoints</a><a href="#quiz">Continue to quiz</a><a href="#progress">View progress</a>`;
  host.append(journeyActions);
  host.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onStoryLink(event) {
  const link = event.target.closest('[data-open-artifact-story]');
  if (!link) return;
  storeStoryId(link.dataset.openArtifactStory);
  const destinationId = link.dataset.storyDestination;
  if (destinationId) {
    const destinationName = destinationId === 'deep-space' ? 'Deep Space' : destinationId[0].toUpperCase() + destinationId.slice(1);
    if (setSelectedDestination({ id: destinationId, name: destinationName })) document.dispatchEvent(new CustomEvent('cosmic-destination-selected'));
  }
  renderArtifactStory(link.dataset.openArtifactStory);
}

function onStoryNavigation(event) {
  const button = event.target.closest('[data-story-id]');
  if (!button || !button.dataset.storyId) return;
  storeStoryId(button.dataset.storyId);
  renderArtifactStory(button.dataset.storyId);
}

function onDestinationChange() {
  const savedId = getStoredStoryId();
  if (!savedId) return;
  loadJSON('./data/equipment.json', 'Could not load equipment.').then((items) => {
    const selectedDestination = getSelectedDestination();
    if (items.some((item) => item.storyId === savedId && item.destinationId !== selectedDestination?.id)) {
      try { localStorage.removeItem(STORY_KEY); } catch { /* Ignore unavailable storage. */ }
      const host = document.querySelector('#artifact-story-view');
      if (host) hideStoryView(host);
    }
  }).catch((error) => console.error('Could not update the selected story:', error));
}

export function setupArtifactStories() {
  document.addEventListener('click', onStoryLink);
  document.querySelector('#artifact-story-view')?.addEventListener('click', onStoryNavigation);
  document.addEventListener('cosmic-destination-selected', onDestinationChange);
  const indexReady = renderArtifactStoryIndex();
  return location.hash === '#stories' ? Promise.all([indexReady, renderArtifactStory()]) : indexReady;
}
