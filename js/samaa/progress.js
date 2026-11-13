import { CHECKPOINTS, TIMELINE_EVENT_COUNT, getProgress } from './checkpoints.js';
import { getSelectedDestination } from '../basmala/destinations.js';

function renderCheckpoint(checkpoint, progress) {
  const status = progress.checkpoints[checkpoint.id]?.status ?? 'locked';
  const statusLabel = status[0].toUpperCase() + status.slice(1);
  return `<li data-status="${status}"><strong>${checkpoint.title}</strong><span class="checkpoint-status">${statusLabel}</span><p>${checkpoint.description}</p></li>`;
}

export function renderProgress() {
  const host = document.querySelector('#progress-panel');
  if (!host) return;

  const progress = getProgress();
  const destination = getSelectedDestination();
  const missions = CHECKPOINTS.filter((checkpoint) => checkpoint.type === 'mission').sort((a, b) => a.order - b.order);
  const achievements = CHECKPOINTS.filter((checkpoint) => checkpoint.type === 'achievement');
  const completedMissions = missions.filter((checkpoint) => progress.checkpoints[checkpoint.id]?.status === 'completed').length;
  const unlockedMissions = missions.filter((checkpoint) => progress.checkpoints[checkpoint.id]?.status === 'unlocked').length;
  const lastAttempt = progress.quizAttempts.at(-1);
  const latestScore = lastAttempt ? `${lastAttempt.score}/${lastAttempt.total} · ${Math.round((lastAttempt.score / lastAttempt.total) * 100)}%` : '—';
  const eventTotal = progress.exploredTimelineEvents.length;
  const eventMax = TIMELINE_EVENT_COUNT;

  host.innerHTML = `
    <div class="progress-stats">
      <div class="stat"><strong>${destination?.name || 'None'}</strong><span>Selected destination</span></div>
      <div class="stat"><strong>${progress.exploredArtifacts.length}</strong><span>Artifacts explored</span></div>
      <div class="stat"><strong>${progress.exploredEquipment.length}</strong><span>Equipment briefings explored</span></div>
      <div class="stat"><strong>${progress.completedChapters.length}</strong><span>Stories completed</span></div>
      <div class="stat"><strong>${progress.readArtifactStories.length}</strong><span>Mission stories read</span></div>
      <div class="stat"><strong>${eventTotal}/${eventMax}</strong><span>Timeline events explored</span></div>
      <div class="stat"><strong>${progress.quizAttempts.length}</strong><span>Quiz attempts</span></div>
      <div class="stat"><strong>${latestScore}</strong><span>Latest quiz result</span></div>
    </div>
    <h3>Sequential mission</h3>
    <p>Complete each stage to unlock the next one.</p>
    <div class="mission-progress" aria-label="${completedMissions} of ${missions.length} mission stages completed">
      <span>${completedMissions} / ${missions.length} STAGES COMPLETE</span>
      <span class="mission-progress-track"><span style="width:${missions.length ? (completedMissions / missions.length) * 100 : 0}%"></span></span>
      <span>${unlockedMissions ? 'NEXT STAGE AVAILABLE' : 'SEQUENCE COMPLETE'}</span>
    </div>
    <ol class="checkpoint-list">${missions.map((checkpoint) => renderCheckpoint(checkpoint, progress)).join('')}</ol>
    <h3>Independent achievements</h3>
    <p>Earn these at any time, outside the mission sequence.</p>
    <ul class="checkpoint-list">${achievements.map((checkpoint) => renderCheckpoint(checkpoint, progress)).join('')}</ul>
  `;
}
