import { recordQuizAttempt, updateUnlockedCheckpoints } from './checkpoints.js';
import { renderProgress } from './progress.js';
async function loadData() { const response = await fetch('./data/questions.json'); if (!response.ok) throw new Error('Could not load quiz questions.'); return response.json(); }
export async function setupQuiz() {
  const host = document.querySelector('#quiz-panel'); if (!host) return;
  const questions = await loadData(); if (!questions.length) { host.textContent = 'Quiz questions are coming soon.'; return; }
  let index = 0; let score = 0; let answered = false;
  const render = () => {
    answered = false; const question = questions[index];
    host.innerHTML = `<p class="eyebrow">Question ${index + 1} of ${questions.length}</p><h3>${question.question}</h3><div class="quiz-options">${question.options.map((option, i) => `<button class="quiz-option" type="button" data-option="${i}">${option}</button>`).join('')}</div><p class="feedback" role="status"></p><button class="button next-question" type="button" hidden>${index === questions.length - 1 ? 'See results' : 'Next question'}</button>`;
    host.querySelectorAll('[data-option]').forEach((button) => button.addEventListener('click', () => {
      if (answered) return; answered = true; const correct = Number(button.dataset.option) === question.answerIndex; if (correct) score++;
      host.querySelectorAll('[data-option]').forEach((choice) => { choice.disabled = true; });
      host.querySelector('.feedback').textContent = correct ? `Correct! ${question.explanation}` : `Not quite. ${question.explanation}`;
      host.querySelector('.next-question').hidden = false;
    }));
    host.querySelector('.next-question').addEventListener('click', () => { if (index < questions.length - 1) { index++; render(); } else { recordQuizAttempt(score, questions.length); updateUnlockedCheckpoints(); host.innerHTML = `<h3>Quiz complete</h3><p>You scored ${score} out of ${questions.length}.</p><button class="button restart-quiz" type="button">Try again</button>`; host.querySelector('.restart-quiz').addEventListener('click', () => { index = 0; score = 0; render(); }); renderProgress(); } });
  };
  render();
}
