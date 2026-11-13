async function loadData() { const response = await fetch('./data/timeline.json'); if (!response.ok) throw new Error('Could not load timeline.'); return response.json(); }
export async function setupTimeline() {
  const host = document.querySelector('#timeline-list'); const detail = document.querySelector('#timeline-detail'); if (!host || !detail) return;
  const events = await loadData();
  host.innerHTML = events.map((event, index) => `<button class="timeline-event" type="button" data-index="${index}" aria-current="${index === 0}"><span class="year">${event.year}</span><span><strong>${event.title}</strong><br>${event.mission}</span></button>`).join('');
  const show = (index) => { const event = events[index]; detail.innerHTML = `<p class="eyebrow">${event.year} · ${event.mission}</p><h3>${event.title}</h3><p>${event.detail}</p><p><strong>Related artifact:</strong> ${event.artifact}</p>`; host.querySelectorAll('.timeline-event').forEach((button, i) => button.setAttribute('aria-current', String(i === index))); };
  host.addEventListener('click', (event) => { const button = event.target.closest('[data-index]'); if (button) show(Number(button.dataset.index)); });
  if (events.length) show(0);
}
