import { getSelectedDestination } from '../basmala/destinations.js';
import { recordTimelineEventExplored, updateUnlockedCheckpoints, getProgress } from './checkpoints.js';
import { renderProgress } from './progress.js';

async function loadData() {
  const response = await fetch('./data/timeline.json');
  if (!response.ok) throw new Error('Could not load timeline.');
  return response.json();
}

export async function setupTimeline() {
  const host = document.querySelector('#timeline-list');
  const detail = document.querySelector('#timeline-detail');
  if (!host || !detail) return;
  const events = (await loadData()).sort((a, b) => (a.year ?? Number(a.date)) - (b.year ?? Number(b.date)) || a.id.localeCompare(b.id));
  let visibleEvents = [];

  const show = (event) => {
    if (!event) return;
    const storyLink = event.storyId
      ? `<p><a href="#stories" data-open-artifact-story="${event.storyId}" data-story-destination="${event.destinationId || ''}">Read the related mission story ↗</a></p>` : '';
    const artifactId = event.artifactId;
    const artifactLink = artifactId ? `<a href="#legacy-artifact-${artifactId}">View ${event.artifact || 'related artifact'} ↗</a>` : (event.artifact || '');
    const artifactRow = artifactLink ? `<p><strong>Related artifact:</strong> ${artifactLink}</p>` : '';
    const source = event.source || event.sourceUrl;
    const sourceLink = source ? `<p class="timeline-source"><a href="${source}" target="_blank" rel="noopener noreferrer">Read the NASA mission source ↗</a></p>` : '';
    detail.innerHTML = `<p class="eyebrow">${event.year ?? event.date} · ${event.mission}</p><h3>${event.title}</h3><p>${event.detail}</p>${artifactRow}${storyLink}${sourceLink}<nav class="journey-actions" aria-label="Continue learning"><a href="#equipment">Explore mission hardware</a><a href="#quiz">Continue to quiz</a><a href="#progress">View progress</a></nav>`;
    host.querySelectorAll('.timeline-event').forEach((button) => {
      const selected = button.dataset.eventId === event.id;
      button.setAttribute('aria-current', String(selected));
      button.setAttribute('aria-pressed', String(selected));
    });
  };

  const render = () => {
    const destination = getSelectedDestination();
    visibleEvents = destination ? events.filter((event) => event.destinationId === destination.id) : events;
    const explored = new Set(getProgress().exploredTimelineEvents);
    if (!visibleEvents.length) {
      host.innerHTML = '<p class="empty-state">No timeline events are available for this destination yet.</p>';
      detail.innerHTML = '<p>Select another destination or continue exploring the archive.</p>';
      return;
    }
    host.innerHTML = visibleEvents.map((event) => `<button class="timeline-event${explored.has(event.id) ? ' is-explored' : ''}" type="button" data-event-id="${event.id}" aria-current="false" aria-pressed="false"><span class="year">${event.year ?? event.date}</span><span><strong>${event.title}</strong><br>${event.mission}</span></button>`).join('');
    show(visibleEvents[0]);
  };

  host.addEventListener('click', (event) => {
    const button = event.target.closest('[data-event-id]');
    const selected = visibleEvents.find((item) => item.id === button?.dataset.eventId);
    if (!selected) return;
    show(selected);
    if (recordTimelineEventExplored(selected.id)) {
      button.classList.add('is-explored');
      updateUnlockedCheckpoints();
      renderProgress();
    }
  });
  document.addEventListener('cosmic-destination-selected', render);
  render();
}
