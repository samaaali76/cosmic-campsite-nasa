const STORAGE_KEY = 'cosmicCampsiteProgress';
const SCHEMA_VERSION = 2;

const ARTIFACT_IDS = new Set([
  'apollo-11-descent-stage', 'apollo-lunar-roving-vehicle', 'apollo-12-alsep', 'surveyor-3-lander',
  'sojourner-rover', 'spirit-rover', 'opportunity-rover', 'viking-1-lander', 'insight-lander', 'ingenuity-helicopter',
  'near-shoemaker', 'dawn-spacecraft', 'pioneer-10', 'kepler-space-telescope'
]);
const STORY_IDS = new Set(ARTIFACT_IDS);
const EQUIPMENT_IDS = new Set(['apollo-lunar-module', 'lunar-roving-vehicle', 'lunar-reconnaissance-orbiter', 'curiosity', 'perseverance', 'ingenuity', 'jwst', 'hubble', 'voyager-1', 'voyager-2']);
const ARTIFACT_STORY_IDS = new Set(EQUIPMENT_IDS);
const TIMELINE_EVENT_IDS = new Set([
  'apollo-11', 'apollo-15', 'lro-launch', 'artemis-i', 'mariner-4', 'viking-1', 'viking-2', 'pathfinder',
  'spirit-landing', 'opportunity-landing', 'curiosity-landing', 'perseverance-landing', 'ingenuity-flight',
  'pioneer-10-launch', 'pioneer-11-launch', 'voyager-2-launch', 'voyager-1-launch', 'voyager-jupiter',
  'voyager-uranus', 'voyager-neptune', 'hubble-launch', 'voyager-1-interstellar', 'jwst-launch',
  'voyager-2-interstellar', 'jwst-first-images', 'surveyor-3', 'apollo-12-alsep', 'apollo-lrv',
  'pioneer-jupiter', 'near-eros', 'spirit-opportunity', 'kepler-survey', 'dawn-ceres', 'insight-landing'
]);
export const TIMELINE_EVENT_COUNT = TIMELINE_EVENT_IDS.size;

export const CHECKPOINTS = [
  { id: 'moon-explorer', title: 'Moon Explorer', type: 'mission', order: 1, description: 'Explore the Apollo 11 descent stage and complete its story.' },
  { id: 'mars-storyteller', title: 'Mars Storyteller', type: 'mission', order: 2, description: 'Explore Sojourner and complete its story after Moon Explorer.' },
  { id: 'knowledge-seeker', title: 'Knowledge Seeker', type: 'achievement', description: 'Score at least 70% in a completed quiz.' },
  { id: 'perfect-score', title: 'Perfect Score', type: 'achievement', description: 'Answer every question correctly in a completed quiz.' },
  { id: 'timeline-explorer', title: 'Timeline Explorer', type: 'achievement', description: 'Select every event in the mission timeline.' }
];

function emptyProgress() {
  return {
    version: SCHEMA_VERSION,
    exploredArtifacts: [],
    exploredEquipment: [],
    completedChapters: [],
    readArtifactStories: [],
    exploredTimelineEvents: [],
    quizAttempts: [],
    checkpoints: {
      'moon-explorer': { status: 'unlocked' },
      'mars-storyteller': { status: 'locked' },
      'knowledge-seeker': { status: 'unlocked' },
      'perfect-score': { status: 'unlocked' },
      'timeline-explorer': { status: 'unlocked' }
    }
  };
}

function uniqueKnownIds(value, knownIds) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => typeof id === 'string' && knownIds.has(id)))];
}

function normalizeAttempts(value) {
  if (!Array.isArray(value)) return [];
  const attempts = [];
  const seenIds = new Set();
  for (const item of value) {
    if (!item || !Number.isInteger(item.score) || !Number.isInteger(item.total) || item.total < 1 || item.score < 0 || item.score > item.total) continue;
    if (typeof item.id === 'string' && seenIds.has(item.id)) continue;
    if (typeof item.id === 'string') seenIds.add(item.id);
    attempts.push({
      ...(typeof item.id === 'string' ? { id: item.id } : {}),
      score: item.score,
      total: item.total,
      completedAt: typeof item.completedAt === 'string' ? item.completedAt : ''
    });
  }
  return attempts;
}

function legacyCheckpointWasComplete(raw, id) {
  const saved = raw?.checkpoints?.[id];
  return saved === true || saved?.status === 'completed';
}

function readStoredValue() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    // Keep the page usable if storage is disabled or full.
    return false;
  }
}

function deriveCheckpointStates(progress, raw) {
  const oldSchema = raw?.version !== SCHEMA_VERSION;
  const legacyMoonComplete = oldSchema && legacyCheckpointWasComplete(raw, 'moon-explorer');
  const legacyMarsComplete = oldSchema && legacyCheckpointWasComplete(raw, 'mars-storyteller');
  const savedMoonComplete = raw?.checkpoints?.['moon-explorer']?.status === 'completed';
  const savedMarsComplete = raw?.checkpoints?.['mars-storyteller']?.status === 'completed';

  let moonComplete = legacyMoonComplete || savedMoonComplete || (
    progress.exploredArtifacts.includes('apollo-11-descent-stage') &&
    progress.completedChapters.includes('apollo-11-descent-stage')
  ) || (progress.exploredEquipment.includes('apollo-lunar-module') && progress.readArtifactStories.includes('apollo-lunar-module'));
  const marsRequirementsMet = progress.exploredArtifacts.includes('sojourner-rover') &&
    progress.completedChapters.includes('sojourner-rover') ||
    (progress.exploredEquipment.includes('curiosity') && progress.readArtifactStories.includes('curiosity'));
  const marsComplete = legacyMarsComplete || savedMarsComplete || (moonComplete && marsRequirementsMet);
  // A legacy Mars completion means the user had already advanced through the sequence.
  if (marsComplete) moonComplete = true;

  const statuses = {
    'moon-explorer': moonComplete ? 'completed' : 'unlocked',
    'mars-storyteller': marsComplete ? 'completed' : (moonComplete ? 'unlocked' : 'locked'),
    'knowledge-seeker': progress.quizAttempts.some((attempt) => attempt.score / attempt.total >= 0.7) ? 'completed' : 'unlocked',
    'perfect-score': progress.quizAttempts.some((attempt) => attempt.score === attempt.total) ? 'completed' : 'unlocked',
    'timeline-explorer': TIMELINE_EVENT_IDS.size > 0 && [...TIMELINE_EVENT_IDS].every((id) => progress.exploredTimelineEvents.includes(id)) ? 'completed' : 'unlocked'
  };
  progress.checkpoints = Object.fromEntries(CHECKPOINTS.map(({ id }) => [id, { status: statuses[id] }]));
}

function normalizeProgress(raw) {
  const progress = emptyProgress();
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    progress.exploredArtifacts = uniqueKnownIds(raw.exploredArtifacts, ARTIFACT_IDS);
    progress.exploredEquipment = uniqueKnownIds(raw.exploredEquipment, EQUIPMENT_IDS);
    progress.completedChapters = uniqueKnownIds(raw.completedChapters, STORY_IDS);
    progress.readArtifactStories = uniqueKnownIds(raw.readArtifactStories, ARTIFACT_STORY_IDS);
    progress.exploredTimelineEvents = uniqueKnownIds(raw.exploredTimelineEvents, TIMELINE_EVENT_IDS);
    progress.quizAttempts = normalizeAttempts(raw.quizAttempts);
  }
  deriveCheckpointStates(progress, raw);
  return progress;
}

function statusesChanged(raw, progress) {
  const oldCheckpoints = raw?.checkpoints;
  return CHECKPOINTS.some(({ id }) => {
    const oldStatus = oldCheckpoints?.[id];
    const normalizedOldStatus = typeof oldStatus === 'boolean' ? (oldStatus ? 'completed' : 'unlocked') : oldStatus?.status;
    return normalizedOldStatus !== progress.checkpoints[id].status;
  });
}

function loadProgress() {
  const raw = readStoredValue();
  const progress = normalizeProgress(raw);
  const needsMigration = raw?.version !== SCHEMA_VERSION;
  const changed = needsMigration || statusesChanged(raw, progress);
  if (changed) writeProgress(progress);
  return { progress, changed };
}

export function getProgress() {
  return loadProgress().progress;
}

function saveActivity(progress) {
  progress.version = SCHEMA_VERSION;
  deriveCheckpointStates(progress, progress);
  return writeProgress(progress);
}

export function recordArtifactExplored(id) {
  if (!ARTIFACT_IDS.has(id)) return false;
  const progress = getProgress();
  if (progress.exploredArtifacts.includes(id)) return false;
  progress.exploredArtifacts.push(id);
  return saveActivity(progress);
}

export function recordEquipmentExplored(id) {
  if (!EQUIPMENT_IDS.has(id)) return false;
  const progress = getProgress();
  if (progress.exploredEquipment.includes(id)) return false;
  progress.exploredEquipment.push(id);
  return saveActivity(progress);
}

export function recordArtifactStoryRead(id) {
  if (!ARTIFACT_STORY_IDS.has(id)) return false;
  const progress = getProgress();
  if (progress.readArtifactStories.includes(id)) return false;
  progress.readArtifactStories.push(id);
  return saveActivity(progress);
}

export function recordChapterCompleted(id) {
  if (!STORY_IDS.has(id)) return false;
  const progress = getProgress();
  if (progress.completedChapters.includes(id)) return false;
  progress.completedChapters.push(id);
  return saveActivity(progress);
}

export function recordTimelineEventExplored(id) {
  if (!TIMELINE_EVENT_IDS.has(id)) return false;
  const progress = getProgress();
  if (progress.exploredTimelineEvents.includes(id)) return false;
  progress.exploredTimelineEvents.push(id);
  return saveActivity(progress);
}

export function recordQuizAttempt(score, total, attemptId) {
  if (!Number.isInteger(score) || !Number.isInteger(total) || total < 1 || score < 0 || score > total) return false;
  if (typeof attemptId !== 'string' || attemptId.length === 0) return false;
  const progress = getProgress();
  if (progress.quizAttempts.some((attempt) => attempt.id === attemptId)) return false;
  progress.quizAttempts.push({ id: attemptId, score, total, completedAt: new Date().toISOString() });
  return saveActivity(progress);
}

export function updateUnlockedCheckpoints() {
  return loadProgress().changed;
}

// Retained for future integrations: checkpoint completion still follows the configured requirements.
export function completeCheckpoint(id) {
  if (!CHECKPOINTS.some((checkpoint) => checkpoint.id === id)) return false;
  const before = getProgress().checkpoints[id].status;
  updateUnlockedCheckpoints();
  return before !== 'completed' && getProgress().checkpoints[id].status === 'completed';
}
