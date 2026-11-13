const STORAGE_KEY = 'cosmicCampsiteProgress';
const DEFAULT_PROGRESS = { exploredArtifacts: [], completedChapters: [], exploredEquipment: [], readArtifactStories: [], quizAttempts: [], checkpoints: { 'moon-explorer': false, 'mars-storyteller': false, 'mission-scholar': false } };
function freshProgress() {
  return { ...DEFAULT_PROGRESS, exploredArtifacts: [], completedChapters: [], exploredEquipment: [], readArtifactStories: [], quizAttempts: [], checkpoints: { ...DEFAULT_PROGRESS.checkpoints } };
}
export function getProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return freshProgress();
    return {
      ...DEFAULT_PROGRESS,
      ...saved,
      exploredArtifacts: Array.isArray(saved.exploredArtifacts) ? [...new Set(saved.exploredArtifacts.filter((id) => typeof id === 'string'))] : [],
      completedChapters: Array.isArray(saved.completedChapters) ? [...new Set(saved.completedChapters.filter((id) => typeof id === 'string'))] : [],
      exploredEquipment: Array.isArray(saved.exploredEquipment) ? [...new Set(saved.exploredEquipment.filter((id) => typeof id === 'string'))] : [],
      readArtifactStories: Array.isArray(saved.readArtifactStories) ? [...new Set(saved.readArtifactStories.filter((id) => typeof id === 'string'))] : [],
      quizAttempts: Array.isArray(saved.quizAttempts) ? saved.quizAttempts.filter((attempt) => attempt && Number.isFinite(attempt.score) && Number.isFinite(attempt.total)) : [],
      checkpoints: {
        ...DEFAULT_PROGRESS.checkpoints,
        ...(saved.checkpoints && typeof saved.checkpoints === 'object' && !Array.isArray(saved.checkpoints)
          ? Object.fromEntries(Object.entries(saved.checkpoints).filter(([id, complete]) => typeof id === 'string' && typeof complete === 'boolean'))
          : {})
      }
    };
  } catch { return freshProgress(); }
}
function save(progress) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); return true; } catch { return false; } }
export function completeCheckpoint(id) {
  const progress = getProgress();
  if (!(id in progress.checkpoints) || progress.checkpoints[id]) return false; // Unknown and already-complete IDs are ignored.
  progress.checkpoints[id] = true; save(progress); return true;
}
export function recordArtifactExplored(id) { const progress = getProgress(); if (!progress.exploredArtifacts.includes(id)) progress.exploredArtifacts.push(id); save(progress); }
export function recordChapterCompleted(id) { const progress = getProgress(); if (!progress.completedChapters.includes(id)) progress.completedChapters.push(id); save(progress); }
export function recordEquipmentExplored(id) { const progress = getProgress(); if (!progress.exploredEquipment.includes(id)) progress.exploredEquipment.push(id); save(progress); }
export function recordArtifactStoryRead(id) { const progress = getProgress(); if (!progress.readArtifactStories.includes(id)) progress.readArtifactStories.push(id); save(progress); }
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
