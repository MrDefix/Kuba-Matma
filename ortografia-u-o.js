'use strict';

const form = document.getElementById('quiz-form');
const question = document.getElementById('question');
const gap = document.getElementById('word-gap');
const choices = [...document.querySelectorAll('[data-letter]')];
const submit = document.getElementById('submit-answer');
const explanation = document.getElementById('explanation');
const status = document.getElementById('status');
const sheet = document.getElementById('mistakes-sheet');
const showMistakes = document.getElementById('show-mistakes');
const quiz = UOQuiz.createPractice();

function render() {
    const wrong = quiz.phase === 'explanation';
    form.hidden = wrong;
    status.hidden = wrong;
    document.getElementById('quiz-card').classList.toggle('showing-explanation', wrong);
    status.classList.toggle('is-error', wrong);
    form.classList.toggle('has-error', wrong);
    explanation.hidden = !wrong;
    document.getElementById('correct-count').textContent = String(quiz.correct);
    document.getElementById('incorrect-count').textContent = String(quiz.incorrect);
    const word = quiz.current;
    document.getElementById('word-before').textContent = word.before;
    document.getElementById('word-after').textContent = word.after;
    gap.textContent = wrong ? word.answer : (quiz.selected || '?');
    gap.classList.toggle('corrected', wrong);
    question.setAttribute('aria-label', wrong
        ? `Poprawnie: ${word.before}${word.answer}${word.after}`
        : `Uzupełnij: ${word.before}, brakująca litera, ${word.after}`);
    for (const choice of choices) {
        choice.disabled = wrong;
        choice.setAttribute('aria-pressed', String(quiz.selected === choice.dataset.letter));
    }
    submit.hidden = wrong;
    submit.disabled = quiz.selected === null || wrong;
    if (wrong) {
        document.getElementById('correction').textContent = `Poprawna pisownia: ${word.before}${word.answer}${word.after}.`;
        document.getElementById('rule').textContent = word.rule;
        explanation.focus();
    }
}

for (const choice of choices) {
    choice.addEventListener('click', () => {
        quiz.choose(choice.dataset.letter);
        render();
    });
}

form.addEventListener('submit', event => {
    event.preventDefault();
    const result = quiz.submit();
    if (!result) return;
    status.textContent = result === 'correct' ? 'Dobrze!' : '✕ Błędna odpowiedź. Przeczytaj zasadę.';
    render();
    if (result === 'correct' && quiz.phase === 'question') question.focus();
});

document.getElementById('next-question').addEventListener('click', () => {
    quiz.next();
    status.textContent = '';
    render();
    if (quiz.phase === 'question') question.focus();
});

showMistakes.addEventListener('click', () => {
    const list = document.getElementById('mistakes-list');
    list.replaceChildren();
    document.getElementById('mistakes-empty').hidden = quiz.incorrect > 0;
    for (const mistake of quiz.mistakes) {
        const item = document.createElement('li');
        const word = document.createElement('strong');
        word.textContent = mistake.word;
        const answer = document.createElement('p');
        answer.className = 'mistake-answer';
        answer.textContent = `Twój wybór: „${mistake.picked}”. Poprawnie: „${mistake.answer}”.`;
        const rule = document.createElement('p');
        rule.textContent = mistake.rule;
        item.append(word, answer, rule);
        list.append(item);
    }
    sheet.showModal();
    showMistakes.setAttribute('aria-expanded', 'true');
    document.body.classList.toggle('sheet-open', true);
});

document.getElementById('close-mistakes').addEventListener('click', () => sheet.close());
sheet.addEventListener('close', () => {
    showMistakes.setAttribute('aria-expanded', 'false');
    document.body.classList.toggle('sheet-open', false);
});
sheet.addEventListener('click', event => {
    if (event.target !== sheet) return;
    const bounds = sheet.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) sheet.close();
});

render();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(console.error);
}
