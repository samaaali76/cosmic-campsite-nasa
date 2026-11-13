async function loadData() { const response = await fetch('./data/destinations.json'); if (!response.ok) throw new Error('Could not load destinations.'); return response.json(); }
export async function renderDestinations() {
  const host = document.querySelector('#destination-list'); if (!host) return;
  const destinations = await loadData();
  host.innerHTML = destinations.map((item) => `<article class="card destination-card"><div class="card-icon" aria-hidden="true">${item.icon}</div><p class="meta">${item.type}</p><h3>${item.name}</h3><p>${item.description}</p></article>`).join('');
}
