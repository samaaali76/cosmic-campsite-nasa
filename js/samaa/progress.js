import { getProgress } from './checkpoints.js';
import { getSelectedDestination } from '../basmala/destinations.js';
export function renderProgress() {
  const host = document.querySelector('#progress-panel'); if (!host) return;
  const progress = getProgress();
  const destination = getSelectedDestination();
  const equipmentPercent = Math.min(100, Math.round(progress.exploredEquipment.length / 10 * 100));
  const storyPercent = Math.min(100, Math.round(progress.readArtifactStories.length / 10 * 100));
  const checkpointsDone = Object.values(progress.checkpoints).filter(Boolean).length;
  const checkpointPercent = progress.checkpoints ? Math.round(checkpointsDone / Math.max(1, Object.keys(progress.checkpoints).length) * 100) : 0;
  const latestScore = progress.quizAttempts.at(-1);
  const quizPercent = latestScore && latestScore.total > 0 ? Math.round(latestScore.score / latestScore.total * 100) : 0;
  const overall = Math.round((equipmentPercent + storyPercent + checkpointPercent + (latestScore ? quizPercent : 0)) / (latestScore ? 4 : 3));
  const checkpoints = Object.entries(progress.checkpoints).map(([id, complete]) => `<li class="${complete ? 'complete' : ''}">${id.replaceAll('-', ' ')}: ${complete ? 'complete' : 'ready to explore'}</li>`).join('');
  const last = progress.quizAttempts.at(-1);
  host.innerHTML = `<div class="progress-overview"><div><p class="eyebrow">Field journal completion</p><strong class="progress-overview__value">${overall}%</strong></div><div><p>Progress is calculated from your equipment exploration, stories read, checkpoints, and latest quiz score.</p><div class="progress-overview__track" role="progressbar" aria-label="Overall learning progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${overall}"><span style="width:${overall}%"></span></div><div class="progress-stats"><div class="stat"><strong>${equipmentPercent}%</strong>Equipment explored</div><div class="stat"><strong>${storyPercent}%</strong>Mission stories read</div><div class="stat"><strong>${checkpointPercent}%</strong>Checkpoints complete</div>${latestScore ? `<div class="stat"><strong>${quizPercent}%</strong>Latest quiz</div>` : ''}</div></div></div><div class="progress-stats"><div class="stat"><strong>${destination?.name || 'None'}</strong>Selected destination</div><div class="stat"><strong>${progress.exploredEquipment.length}</strong>Equipment explored</div><div class="stat"><strong>${progress.readArtifactStories.length}</strong>Mission stories read</div><div class="stat"><strong>${progress.exploredArtifacts.length}</strong>Legacy artifacts explored</div><div class="stat"><strong>${progress.completedChapters.length}</strong>Legacy stories completed</div><div class="stat"><strong>${progress.quizAttempts.length}</strong>Quiz attempts</div><div class="stat"><strong>${last ? `${last.score}/${last.total}` : '—'}</strong>Latest quiz</div></div><h3>Checkpoints</h3><ul class="checkpoint-list">${checkpoints}</ul><nav class="journey-actions" aria-label="Continue learning"><a href="#destinations">Choose destination</a><a href="#equipment">Explore equipment</a><a href="#stories">Read mission stories</a><a href="#timeline">Explore timeline</a><a href="#quiz">Take quiz</a></nav>`;
}
