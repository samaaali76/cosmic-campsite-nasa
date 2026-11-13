import { recordQuizAttempt, updateUnlockedCheckpoints } from './checkpoints.js';
import { renderProgress } from './progress.js';
import { getSelectedDestination } from '../basmala/destinations.js';
async function loadData() { const response = await fetch('./data/questions.json'); if (!response.ok) throw new Error('Could not load quiz questions.'); return response.json(); }
function createAttemptId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `quiz-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function setupQuiz() {
  const host = document.querySelector('#quiz-panel'); if (!host) return;
  const allQuestions = await loadData(); if (!allQuestions.length) { host.textContent = 'Quiz questions are coming soon.'; return; }
  let questions = [];
  let index = 0; let score = 0; let answered = false; let attemptSubmitted = false; let attemptId = createAttemptId(); let missedQuestions = [];
  const selectQuestions = () => {
    const destination = getSelectedDestination();
    questions = destination ? allQuestions.filter((question) => question.destinationId === destination.id) : allQuestions;
  };
  const render = () => {
    selectQuestions();
    if (!questions.length) {
      host.innerHTML = '<p class="eyebrow">Mission knowledge check</p><h3>No quiz questions for this destination yet.</h3><p>Choose another destination or explore the mission archive.</p><a class="button" href="#destinations">Choose destination</a>';
      return;
    }
    answered = false; const question = questions[index];
    host.innerHTML = `<div class="quiz-progress"><p class="eyebrow">${getSelectedDestination()?.name || 'All missions'} · Question ${index + 1} of ${questions.length}</p><div class="quiz-progress__track" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${index + 1}"><span style="width:${Math.round((index + 1) / questions.length * 100)}%"></span></div></div><h3>${question.question}</h3><div class="quiz-options">${question.options.map((option, i) => `<button class="quiz-option" type="button" data-option="${i}" aria-pressed="false">${option}</button>`).join('')}</div><p class="feedback" role="status" aria-live="polite"></p><button class="button next-question" type="button" hidden>${index === questions.length - 1 ? 'See results' : 'Next question'}</button>`;
    host.querySelectorAll('[data-option]').forEach((button) => button.addEventListener('click', () => {
      if (answered) return; answered = true; const correct = Number(button.dataset.option) === question.answerIndex; if (correct) score++; else missedQuestions.push(question);
      host.querySelectorAll('[data-option]').forEach((choice) => { choice.disabled = true; choice.setAttribute('aria-pressed', String(choice === button)); });
      host.querySelector(`[data-option="${question.answerIndex}"]`)?.classList.add('is-correct');
      if (!correct) button.classList.add('is-incorrect');
      host.querySelector('.feedback').textContent = correct ? `Correct! ${question.explanation}` : `Not quite. ${question.explanation}`;
      host.querySelector('.next-question').hidden = false;
    }));
    host.querySelector('.next-question').addEventListener('click', () => {
      if (index < questions.length - 1) { index++; render(); return; }
      if (!attemptSubmitted) {
        attemptSubmitted = true;
        recordQuizAttempt(score, questions.length, attemptId);
        updateUnlockedCheckpoints();
      }
      const percentage = Math.round((score / questions.length) * 100);
      const note = percentage === 100 ? 'Perfect flight. You have the mission details down.' : percentage >= 70 ? 'Mission accomplished. You have a strong grasp of the archive.' : 'Every mission is a chance to learn. Revisit the field notes and try again.';
      const review = missedQuestions.length ? '<p class="quiz-result-note"><strong>Review:</strong> <span class="quiz-review-copy"></span></p>' : '';
      host.innerHTML = `<div class="quiz-result"><p class="eyebrow">FLIGHT CHECK COMPLETE</p><p class="quiz-result-score">${percentage}%</p><h3>You scored ${score} out of ${questions.length}.</h3><p class="quiz-result-note">${note}</p>${review}<button class="button restart-quiz" type="button">Try again <span aria-hidden="true">↻</span></button></div>`;
      const reviewCopy = host.querySelector('.quiz-review-copy');
      if (reviewCopy) reviewCopy.textContent = missedQuestions.map((question) => question.explanation).join(' ');
      host.querySelector('.restart-quiz').addEventListener('click', () => {
        index = 0; score = 0; missedQuestions = []; attemptSubmitted = false; attemptId = createAttemptId(); render();
      });
      renderProgress();
    });
  };
  document.addEventListener('cosmic-destination-selected', () => {
    index = 0; score = 0; missedQuestions = []; attemptSubmitted = false; attemptId = createAttemptId(); render();
  });
  render();
}
