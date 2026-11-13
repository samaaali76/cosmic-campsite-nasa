import { setupNavigation } from './basmala/navigation.js';
import { renderDestinations } from './basmala/destinations.js';
import { renderEquipment } from './basmala/equipment.js';
import { renderArtifacts } from './basmala/artifacts.js';
import { setupArtifactStories } from './basmala/artifact-stories.js';
import { renderStories } from './basmala/learning.js';
import { setupTimeline } from './samaa/timeline.js';
import { setupQuiz } from './samaa/quiz.js';
import { renderProgress } from './samaa/progress.js';

// Start each independent page feature and show a readable message if its data cannot load.
setupNavigation();
document.addEventListener('cosmic-destination-selected', renderProgress);
const artifactStoriesReady = setupArtifactStories();
const tasks = [artifactStoriesReady, renderDestinations(), renderEquipment(), renderArtifacts(), renderStories(), setupTimeline(), setupQuiz()];
Promise.allSettled(tasks).then((results) => {
  results.forEach((result) => { if (result.status === 'rejected') console.error('A page section could not start:', result.reason); });
  renderProgress();
});
