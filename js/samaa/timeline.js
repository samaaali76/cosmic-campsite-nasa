import { getSelectedDestination } from '../basmala/destinations.js';

async function loadData() {
  const response = await fetch('./data/timeline.json');
  if (!response.ok) throw new Error('Could not load timeline.');
  return response.json();
}

export async function setupTimeline() {
  const host = document.querySelector('#timeline-list');
  const detail = document.querySelector('#timeline-detail');
  if (!host || !detail) return;

  const events = (await loadData()).sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  let visibleEvents = [];

  const show = (eventId) => {
    const event = visibleEvents.find((item) => item.id === eventId);
    if (!event) return;
    const storyLink = event.storyId
      ? `<p><a href="#stories" data-open-artifact-story="${event.storyId}" data-story-destination="${event.destinationId}">Read the related artifact story ↗</a></p>`
      : '';
    const artifactLink = event.artifactId
      ? `<a href="#legacy-artifact-${event.artifactId}">View ${event.artifact} ↗</a>`
      : event.artifact || '';
    const artifactRow = artifactLink ? `<p><strong>Related artifact:</strong> ${artifactLink}</p>` : '';
    const sourceLink = event.source ? `<p class="timeline-source"><a href="${event.source}" target="_blank" rel="noopener noreferrer">Read the NASA mission source ↗</a></p>` : '';
    detail.innerHTML = `<p class="eyebrow">${event.year} · ${event.mission}</p><h3>${event.title}</h3><p>${event.detail}</p>${artifactRow}${storyLink}${sourceLink}<nav class="journey-actions" aria-label="Continue learning"><a href="#artifacts">Continue to checkpoints</a><a href="#quiz">Continue to quiz</a><a href="#progress">View progress</a></nav>`;
    host.querySelectorAll('.timeline-event').forEach((button) => button.setAttribute('aria-current', String(button.dataset.eventId === event.id)));
  };

  const render = () => {
    const destination = getSelectedDestination();
    visibleEvents = destination ? events.filter((event) => event.destinationId === destination.id) : events;
    if (!visibleEvents.length) {
      host.innerHTML = '<p class="empty-state">No timeline events are available for this destination yet.</p>';
      detail.innerHTML = '<p>Select another destination or continue to the quiz and progress sections.</p><nav class="journey-actions"><a href="#quiz">Continue to quiz</a><a href="#progress">View progress</a></nav>';
      return;
    }
    host.innerHTML = visibleEvents.map((event) => `<button class="timeline-event" type="button" data-event-id="${event.id}" aria-current="false"><span class="year">${event.year}</span><span><strong>${event.title}</strong><br>${event.mission}</span></button>`).join('');
    show(visibleEvents[0].id);
  };

  host.addEventListener('click', (event) => {
    const button = event.target.closest('[data-event-id]');
    if (button) show(button.dataset.eventId);
  });
  document.addEventListener('cosmic-destination-selected', render);
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-related-timeline-story]');
    if (!link) return;
    const matchingEvent = visibleEvents.find((item) => item.storyId === link.dataset.relatedTimelineStory);
    if (matchingEvent) show(matchingEvent.id);
    else detail.innerHTML = `<p>No existing timeline event is linked to this mission yet.</p><p>Events for the selected destination remain available above.</p><nav class="journey-actions"><a href="#quiz">Continue to quiz</a><a href="#progress">View progress</a></nav>`;
  });
  render();
}
