'use strict';

const lineQuiz = typeof NumberLineQuiz !== 'undefined' ? NumberLineQuiz : null;
const quizSource = typeof SmartSubtractionQuiz !== 'undefined' ? SmartSubtractionQuiz
    : typeof SmartAdditionQuiz !== 'undefined' ? SmartAdditionQuiz
    : typeof EstimationQuiz !== 'undefined' ? EstimationQuiz
    : typeof MemoryMathQuiz !== 'undefined' ? MemoryMathQuiz : (lineQuiz || NumberQuiz);
const quiz = quizSource.createQuiz();
const byId = id => document.getElementById(id);
const form = byId('quiz-form');
const question = byId('question');
const choices = byId('choices');
const submit = byId('submit-answer');
const explanation = byId('explanation');
const sheet = byId('history-sheet');
let displayedTask;

function render() {
    const wrong = quiz.phase === 'explanation';
    form.hidden = wrong;
    byId('status').hidden = wrong;
    explanation.hidden = !wrong;
    byId('quiz-card').classList.toggle('showing-explanation', wrong);
    byId('correct-count').textContent = String(quiz.correct);
    byId('incorrect-count').textContent = String(quiz.incorrect);
    if (displayedTask !== quiz.current) {
        displayedTask = quiz.current;
        question.textContent = quiz.current.prompt;
        byId('category').textContent = quiz.current.category;
        if (lineQuiz) {
            const drawing = byId('axis-drawing');
            drawing.hidden = !quiz.current.axis;
            drawing.innerHTML = quiz.current.axis ? lineQuiz.renderAxis(quiz.current.axis) : '';
        }
        choices.replaceChildren();
        for (const answer of NumberQuiz.shuffle(quiz.current.choices)) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'letter-choice number-choice';
            button.textContent = answer;
            button.addEventListener('click', () => { quiz.choose(answer); render(); });
            choices.append(button);
        }
    }
    for (const button of choices.children) {
        button.setAttribute('aria-pressed', String(button.textContent === quiz.selected));
        button.disabled = wrong;
    }
    submit.disabled = quiz.selected === null || wrong;
    if (wrong) {
        byId('correction').textContent = `Poprawna odpowiedź: ${quiz.current.answer}`;
        byId('rule').textContent = quiz.current.rule;
        explanation.focus({ preventScroll: true });
    }
}

form.addEventListener('submit', event => {
    event.preventDefault();
    const result = quiz.submit();
    if (!result) return;
    byId('status').textContent = result === 'correct' ? 'Dobrze! Następne zadanie.' : '';
    render();
    if (result === 'correct') question.focus({ preventScroll: true });
});
byId('next-question').addEventListener('click', () => {
    quiz.next();
    byId('status').textContent = '';
    render();
    question.focus({ preventScroll: true });
});

function showHistory(onlyMistakes) {
    byId('history-title').textContent = onlyMistakes ? 'Twoje błędy' : 'Historia wyników';
    const entries = quiz.history.map((entry, index) => ({ ...entry, number: index + 1 })).filter(entry => !onlyMistakes || !entry.correct);
    byId('history-empty').hidden = entries.length > 0;
    byId('history-empty').textContent = onlyMistakes ? 'Nie masz jeszcze błędów.' : 'Nie ma jeszcze odpowiedzi.';
    const list = byId('history-list');
    list.replaceChildren();
    for (const entry of entries.reverse()) {
        const item = document.createElement('li');
        item.value = entry.number;
        const title = document.createElement('strong');
        title.textContent = `${entry.correct ? '✓' : '✕'} ${entry.prompt}`;
        title.className = entry.correct ? 'history-correct' : 'history-incorrect';
        const answer = document.createElement('p');
        answer.textContent = `Twoja odpowiedź: ${entry.picked}. Poprawnie: ${entry.answer}.`;
        const rule = document.createElement('p');
        rule.textContent = entry.rule;
        item.append(title, answer, rule);
        if (lineQuiz && entry.axis) {
            const drawing = document.createElement('div');
            drawing.className = 'axis-drawing';
            drawing.tabIndex = 0;
            drawing.setAttribute('role', 'group');
            drawing.setAttribute('aria-label', 'Rysunek osi z zadania; można przewijać w poziomie');
            drawing.innerHTML = lineQuiz.renderAxis(entry.axis);
            item.append(drawing);
        }
        list.append(item);
    }
    sheet.showModal();
    document.body.classList.add('sheet-open');
}
byId('show-history').addEventListener('click', () => showHistory(false));
byId('show-mistakes').addEventListener('click', () => showHistory(true));
byId('close-history').addEventListener('click', () => sheet.close());
sheet.addEventListener('close', () => document.body.classList.remove('sheet-open'));
sheet.addEventListener('click', event => {
    if (event.target !== sheet) return;
    const bounds = sheet.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) sheet.close();
});
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
