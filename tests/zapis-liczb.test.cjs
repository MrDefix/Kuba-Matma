const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tasks, createQuiz, toWords } = require('../zapis-liczb-quiz.js');

test('polskie nazwy liczb uwzględniają zera i odmianę dużych jednostek', () => {
    for (const [number, words] of [
        [0, 'zero'], [1000, 'tysiąc'], [12000, 'dwanaście tysięcy'],
        [22003, 'dwadzieścia dwa tysiące trzy'], [5000300, 'pięć milionów trzysta'],
        [2000000000003, 'dwa biliony trzy']
    ]) assert.equal(toWords(number), words);
});

test('każde pytanie ma jedną poprawną opcję i wyjaśnienie, cały zakres książki jest obecny', () => {
    assert.ok(tasks.length >= 100);
    assert.equal(new Set(tasks.map(t => t.prompt)).size, tasks.length);
    assert.ok(new Set(tasks.map(t => t.category)).size >= 8);
    for (const task of tasks) {
        assert.ok(task.rule.length > 15);
        assert.equal(task.choices.length, 4);
        assert.equal(new Set(task.choices).size, 4);
        assert.equal(task.choices.filter(c => c === task.answer).length, 1);
        assert.ok(!task.prompt.includes('\ufffd'));
    }
});

test('brak wyboru i obca odpowiedź nie zmieniają wyniku', () => {
    const quiz = createQuiz(tasks.slice(0, 2), false);
    quiz.submit();
    quiz.choose('obca odpowiedź');
    assert.equal(quiz.selected, null);
    assert.equal(quiz.history.length, 0);
    quiz.next();
    assert.equal(quiz.index, 0);
});

test('poprawna odpowiedź przechodzi dalej i zapisuje historię', () => {
    const quiz = createQuiz(tasks.slice(0, 2), false);
    quiz.choose(quiz.current.answer);
    assert.equal(quiz.submit(), 'correct');
    assert.equal(quiz.correct, 1);
    assert.equal(quiz.index, 1);
    assert.equal(quiz.selected, null);
    assert.equal(quiz.history[0].correct, true);
});

test('błąd liczony raz, z wyjaśnieniem i historią aż do Dalej', () => {
    const quiz = createQuiz(tasks.slice(0, 2), false);
    const current = quiz.current;
    const picked = current.choices.find(c => c !== current.answer);
    quiz.choose(picked);
    assert.equal(quiz.submit(), 'incorrect');
    quiz.choose(current.answer);
    quiz.submit();
    assert.equal(quiz.incorrect, 1);
    assert.equal(quiz.index, 0);
    assert.deepEqual(quiz.history[0], { prompt: current.prompt, picked, answer: current.answer, rule: current.rule, correct: false });
    quiz.next();
    assert.equal(quiz.index, 1);
    assert.equal(quiz.phase, 'question');
});

test('losowanie nie powtarza zadań przed wyczerpaniem puli, potem ćwiczenie trwa dalej', () => {
    const quiz = createQuiz();
    const seen = new Set();
    for (let i = 0; i < tasks.length; i++) {
        assert.ok(!seen.has(quiz.current.prompt));
        seen.add(quiz.current.prompt);
        quiz.choose(quiz.current.answer);
        quiz.submit();
    }
    assert.equal(quiz.correct, tasks.length);
    assert.equal(quiz.history.length, tasks.length);
    assert.ok(quiz.current);
    assert.equal(quiz.phase, 'question');
});

function loadPage() {
    const fs = require('node:fs');
    const vm = require('node:vm');
    const path = require('node:path');
    const html = fs.readFileSync(path.join(__dirname, '../dzial-2-jak-zapisujemy-liczby.html'), 'utf8');
    const elements = {};
    const element = () => ({
        hidden: false, disabled: false, textContent: '', attributes: {}, events: {}, children: [],
        classList: { toggle() {}, add() {}, remove() {} },
        append(...items) { this.children.push(...items); },
        replaceChildren() { this.children = []; },
        setAttribute(key, value) { this.attributes[key] = value; },
        addEventListener(name, handler) { this.events[name] = handler; },
        focus(options) { this.focusOptions = options; },
        click() { if (!this.disabled) this.events.click(); },
        showModal() { this.open = true; },
        close() { this.open = false; this.events.close(); }
    });
    for (const [, id] of html.matchAll(/id="([^"]+)"/g)) elements[id] = element();
    const quiz = createQuiz(tasks.slice(0, 2), false);
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../zapis-liczb.js'), 'utf8'), {
        NumberQuiz: { createQuiz: () => quiz, shuffle: list => list.slice() },
        document: { getElementById: id => elements[id], createElement: element, body: element() },
        navigator: {}
    });
    return { elements, quiz, submit: () => elements['quiz-form'].events.submit({ preventDefault() {} }) };
}

test('interfejs: wybór, dobra odpowiedź, blokada błędu, Dalej i historia wszystkich wyników', () => {
    const { elements: e, quiz, submit } = loadPage();
    assert.equal(e['submit-answer'].disabled, true);
    e['choices'].children[0].click();
    assert.equal(e['choices'].children[0].attributes['aria-pressed'], 'true');
    submit();
    assert.equal(e['correct-count'].textContent, '1');
    assert.equal(e.question.textContent, tasks[1].prompt);
    e['choices'].children[1].click();
    submit();
    submit();
    assert.equal(e['incorrect-count'].textContent, '1');
    assert.equal(e['quiz-form'].hidden, true);
    assert.equal(e.explanation.hidden, false);
    assert.equal(e.explanation.focusOptions.preventScroll, true);
    assert.equal(e.rule.textContent, tasks[1].rule);
    e['show-history'].click();
    assert.equal(e['history-sheet'].open, true);
    assert.equal(e['history-list'].children.length, 2);
    assert.match(e['history-list'].children[0].children[1].textContent, /Poprawnie:/);
    e['close-history'].click();
    assert.equal(e['history-sheet'].open, false);
    e['show-mistakes'].click();
    assert.equal(e['history-list'].children.length, 1);
    e['close-history'].click();
    e['next-question'].click();
    assert.equal(e['quiz-form'].hidden, false);
    assert.equal(e.explanation.hidden, true);
    assert.equal(quiz.history.length, 2);
});

test('wszystkie nowe zasoby są dostępne offline i pliki zawierają polskie znaki UTF-8', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const sw = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
    for (const file of ['dzial-2-jak-zapisujemy-liczby.html', 'zapis-liczb-quiz.js', 'zapis-liczb.js', 'zapis-liczb.css', 'ortografia-u-o.css']) {
        assert.ok(sw.includes(`'/${file}'`));
        const text = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
        assert.ok(!text.includes('\ufffd'));
    }
    assert.ok(tasks.some(t => t.prompt.includes('cyfrę')));
});
