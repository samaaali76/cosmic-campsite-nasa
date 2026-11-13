import { recordChapterCompleted, updateUnlockedCheckpoints } from '../samaa/checkpoints.js';
import { renderProgress } from '../samaa/progress.js';
async function loadData() { const response = await fetch('./data/artifacts.json'); if (!response.ok) throw new Error('Could not load stories.'); return response.json(); }
export async function renderStories() {
  const host = document.querySelector('#story-list'); if (!host) return;
  const items = await loadData();
  host.innerHTML = items.map((item) => `<article class="card story-card"><p class="meta">Field note · ${item.destination}</p><h3>${item.storyTitle}</h3><p>${item.story}</p><button class="quiz-option" type="button" data-chapter="${item.id}">Mark story complete</button></article>`).join('');
  host.addEventListener('click', (event) => { const button = event.target.closest('[data-chapter]'); if (!button) return; recordChapterCompleted(button.dataset.chapter); updateUnlockedCheckpoints(); button.textContent = 'Completed'; button.disabled = true; renderProgress(); });
}
