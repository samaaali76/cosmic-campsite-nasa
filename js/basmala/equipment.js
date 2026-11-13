import { recordArtifactExplored, updateUnlockedCheckpoints } from '../samaa/checkpoints.js';
import { renderProgress } from '../samaa/progress.js';
async function loadData() { const response = await fetch('./data/artifacts.json'); if (!response.ok) throw new Error('Could not load artifacts.'); return response.json(); }
export async function renderArtifacts() {
  const host = document.querySelector('#artifact-list'); if (!host) return;
  const artifacts = await loadData();
  host.innerHTML = artifacts.map((item) => `<article class="card artifact-card"><p class="meta">${item.destination} · ${item.mission}</p><h3>${item.name}</h3><p>${item.description}</p><p><strong>Why it matters:</strong> ${item.science}</p><button class="quiz-option" type="button" data-artifact="${item.id}">Mark explored</button></article>`).join('');
  host.addEventListener('click', (event) => { const button = event.target.closest('[data-artifact]'); if (!button) return; recordArtifactExplored(button.dataset.artifact); updateUnlockedCheckpoints(); button.textContent = 'Explored'; button.disabled = true; renderProgress(); });
}
