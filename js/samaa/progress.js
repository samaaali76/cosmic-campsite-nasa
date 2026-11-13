import { getProgress } from './checkpoints.js';
export function renderProgress() {
  const host = document.querySelector('#progress-panel'); if (!host) return;
  const progress = getProgress();
  const checkpoints = Object.entries(progress.checkpoints).map(([id, complete]) => `<li class="${complete ? 'complete' : ''}">${id.replaceAll('-', ' ')}: ${complete ? 'complete' : 'ready to explore'}</li>`).join('');
  const last = progress.quizAttempts.at(-1);
  host.innerHTML = `<div class="progress-stats"><div class="stat"><strong>${progress.exploredArtifacts.length}</strong>Artifacts explored</div><div class="stat"><strong>${progress.completedChapters.length}</strong>Stories completed</div><div class="stat"><strong>${progress.quizAttempts.length}</strong>Quiz attempts</div><div class="stat"><strong>${last ? `${last.score}/${last.total}` : '—'}</strong>Latest quiz</div></div><h3>Checkpoints</h3><ul class="checkpoint-list">${checkpoints}</ul>`;
}
