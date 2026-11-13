const STORAGE_KEY = 'cosmicCampsiteProgress';
const DEFAULT_PROGRESS = { exploredArtifacts: [], completedChapters: [], quizAttempts: [], checkpoints: { 'moon-explorer': false, 'mars-storyteller': false, 'mission-scholar': false } };
export function getProgress() {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); return { ...DEFAULT_PROGRESS, ...saved, checkpoints: { ...DEFAULT_PROGRESS.checkpoints, ...saved?.checkpoints } }; }
  catch { return structuredClone(DEFAULT_PROGRESS); }
}
function save(progress) { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
export function completeCheckpoint(id) {
  const progress = getProgress();
  if (!(id in progress.checkpoints) || progress.checkpoints[id]) return false; // Unknown and already-complete IDs are ignored.
  progress.checkpoints[id] = true; save(progress); return true;
}
export function recordArtifactExplored(id) { const progress = getProgress(); if (!progress.exploredArtifacts.includes(id)) progress.exploredArtifacts.push(id); save(progress); }
export function recordChapterCompleted(id) { const progress = getProgress(); if (!progress.completedChapters.includes(id)) progress.completedChapters.push(id); save(progress); }
export function recordQuizAttempt(score, total) { const progress = getProgress(); progress.quizAttempts.push({ score, total, completedAt: new Date().toISOString() }); save(progress); }
// These starter rules can be adjusted as the team finalizes learning stages.
export function updateUnlockedCheckpoints() {
  const progress = getProgress();
  const requirements = {
    'moon-explorer': progress.exploredArtifacts.includes('apollo-11-descent-stage'),
    'mars-storyteller': progress.completedChapters.includes('sojourner-rover'),
    'mission-scholar': progress.quizAttempts.some((attempt) => attempt.total > 0 && attempt.score / attempt.total >= 0.5)
  };
  let changed = false;
  for (const [id, ready] of Object.entries(requirements)) {
    if (ready && !progress.checkpoints[id]) { progress.checkpoints[id] = true; changed = true; }
  }
  if (changed) save(progress);
  return changed;
}
// Future engine integration can call completeCheckpoint after its own unlock conditions are met.
