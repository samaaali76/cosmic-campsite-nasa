import { recordQuizAttempt, updateUnlockedCheckpoints } from './checkpoints.js';
import { renderProgress } from './progress.js';
import { getSelectedDestination } from '../basmala/destinations.js';

async function loadData() {
  const response = await fetch('./data/questions.json');
  if (!response.ok) throw new Error('Could not load quiz questions.');
  return response.json();
}

export async function setupQuiz() {
  const host = document.querySelector('#quiz-panel');
  if (!host) return;
  const allQuestions = await loadData();
  let questions = [];
  let index = 0;
  let score = 0;
  let answered = false;

  const destinationQuestions = () => {
    const destination = getSelectedDestination();
    return destination ? allQuestions.filter((question) => question.destinationId === destination.id) : allQuestions;
  };
  const render = () => {
    questions = destinationQuestions();
    if (!questions.length) {
      host.innerHTML = `<p class="eyebrow">Mission knowledge check</p><h3>Choose a destination first</h3><p>Select the Moon, Mars, or Deep Space to load its 15-question quiz.</p><a class="button" href="#destinations">Choose destination</a>`;
      return;
    }
    if (index >= questions.length) index = 0;
    answered = false;
    const question = questions[index];
    host.innerHTML = `<div class="quiz-progress"><p class="eyebrow">${getSelectedDestination()?.name || 'All missions'} · Question ${index + 1} of ${questions.length}</p><div class="quiz-progress__track" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${index}"><span style="width:${Math.round(index / questions.length * 100)}%"></span></div></div><h3>${question.question}</h3><div class="quiz-options">${question.options.map((option, i) => `<button class="quiz-option" type="button" data-option="${i}">${option}</button>`).join('')}</div><p class="feedback" role="status" aria-live="polite"></p><button class="button next-question" type="button" hidden>${index === questions.length - 1 ? 'See results' : 'Next question'} <span aria-hidden="true">→</span></button>`;
    host.querySelectorAll('[data-option]').forEach((button) => button.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const correct = Number(button.dataset.option) === question.answerIndex;
      if (correct) score++;
      host.querySelectorAll('[data-option]').forEach((choice) => {
        choice.disabled = true;
        const isCorrect = Number(choice.dataset.option) === question.answerIndex;
        if (isCorrect) choice.classList.add('is-correct');
        else if (choice === button) choice.classList.add('is-incorrect');
      });
      host.querySelector('.feedback').textContent = correct ? `Correct. ${question.explanation}` : `Not quite. ${question.explanation}`;
      host.querySelector('.next-question').hidden = false;
    }));
    host.querySelector('.next-question').addEventListener('click', () => {
      if (index < questions.length - 1) { index++; render(); return; }
      recordQuizAttempt(score, questions.length);
      updateUnlockedCheckpoints();
      const resultScore = score;
      const total = questions.length;
      const percentage = Math.round(resultScore / total * 100);
      host.innerHTML = `<p class="eyebrow">${getSelectedDestination()?.name || 'Mission'} · Quiz complete</p><h3>${percentage >= 80 ? 'Mission specialist' : percentage >= 50 ? 'Strong exploration' : 'A good first orbit'}</h3><p>You scored <strong>${resultScore} out of ${total}</strong> (${percentage}%). ${percentage >= 80 ? 'Excellent mission knowledge.' : 'Keep exploring the mission stories and try again when you are ready.'}</p><button class="button restart-quiz" type="button">Try again</button><nav class="journey-actions" aria-label="Continue learning"><a href="#progress">Review progress</a><a href="#destinations">Choose another destination</a></nav>`;
      host.querySelector('.restart-quiz').addEventListener('click', () => { index = 0; score = 0; render(); });
      renderProgress();
    });
  };

  document.addEventListener('cosmic-destination-selected', () => { index = 0; score = 0; render(); });
  render();
}
