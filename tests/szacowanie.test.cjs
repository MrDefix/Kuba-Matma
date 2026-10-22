const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tasks, createQuiz, roundTo } = require('../szacowanie-quiz.js');

test('zaokrąglanie wybiera najbliższą wielokrotność, przy połowie większą', () => {
    for (const [n, unit, expected] of [[0,10,0],[14,10,10],[15,10,20],[149,100,100],[150,100,200],[2987,1000,3000],[9753,10000,10000],[21064,10000,20000]]) {
        assert.equal(roundTo(n, unit), expected);
    }
});

test('pula obejmuje materiał książki, każda odpowiedź jest jednoznaczna', () => {
    assert.ok(tasks.length >= 100);
    assert.equal(new Set(tasks.map(t => t.prompt)).size, tasks.length);
    for (const category of ['Przybliżanie liczb', 'Szacowanie działań', 'Zakupy', 'Sprawdzanie wyniku', 'Prawie i ponad', 'Określanie ilości', 'Szacowanie w życiu', 'Hasło']) {
        assert.ok(tasks.some(t => t.category === category), category);
    }
    for (const t of tasks) {
        assert.equal(t.choices.length, 4);
        assert.equal(new Set(t.choices).size, 4);
        assert.equal(t.choices.filter(c => c === t.answer).length, 1);
        assert.ok(t.rule.length > 20);
        assert.ok(!t.prompt.includes('\ufffd'));
    }
});

test('szacujemy osobno argumenty, a nie dokładny wynik działania', () => {
    const read = s => Number(s.replaceAll(' ', ''));
    for (const t of tasks.filter(t => t.estimate)) {
        const { a, b, unit, op } = t.estimate;
        const nearest = n => {
            const lower = Math.floor(n / unit) * unit;
            return n - lower < unit / 2 ? lower : lower + unit;
        };
        assert.equal(read(t.answer.replace('Około ', '')), op === '+' ? nearest(a) + nearest(b) : nearest(a) - nearest(b));
    }
    const task = tasks.find(t => t.estimate?.a === 875 && t.estimate.b === 758);
    assert.equal(task.answer, 'Około 1 700');
});

test('zakupy z książki, wynik kalkulatora i hasło mają poprawne rozwiązania', () => {
    for (const [fragment, expected] of [['Kostka masła', 'Około 36 zł'], ['bilet normalny', 'Około 10 zł'], ['Ola kupuje', 'Około 56 zł'], ['Dominika ma', 'Nie wystarczy'], ['Pan Irek', 'Wystarczy'], ['9 753 + 21 064', '30 817'], ['Tylko jeden wynik działania 1 183 + 2 415', '3 598'], ['Hasło jeziora', 'WIGRY']]) {
        assert.equal(tasks.find(t => t.prompt.includes(fragment))?.answer, expected, fragment);
    }
});

test('historia, liczniki, blokada błędu i ciągłe losowanie działają jak wcześniej', () => {
    const quiz = createQuiz(tasks.slice(0, 2), false);
    quiz.submit();
    assert.equal(quiz.history.length, 0);
    quiz.choose(quiz.current.choices.find(c => c !== quiz.current.answer));
    quiz.submit(); quiz.submit();
    assert.equal(quiz.incorrect, 1);
    assert.equal(quiz.phase, 'explanation');
    assert.equal(quiz.history[0].rule, tasks[0].rule);
    quiz.next();
    for (let i = 0; i < 5; i++) { quiz.choose(quiz.current.answer); quiz.submit(); }
    assert.equal(quiz.correct, 5);
    assert.equal(quiz.history.length, 6);
    const random = createQuiz();
    const seen = new Set();
    for (let i = 0; i < tasks.length; i++) {
        assert.ok(!seen.has(random.current.prompt));
        seen.add(random.current.prompt);
        random.choose(random.current.answer); random.submit();
    }
    assert.equal(random.correct, tasks.length);
});

test('strona modułu 4 uruchamia właściwą bazę, wybór odpowiedzi i historię', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const html = read('dzial-2-szacowanie.html');
    const scripts = [...html.matchAll(/<script src="([^"]+)" defer/g)].map(m => m[1]);
    assert.deepEqual(scripts, ['zapis-liczb-quiz.js', 'szacowanie-quiz.js', 'zapis-liczb.js']);
    const elements = {};
    const element = () => ({
        hidden: false, disabled: false, textContent: '', children: [], events: {}, attributes: {},
        classList: { toggle() {}, add() {}, remove() {} },
        append(...items) { this.children.push(...items); },
        replaceChildren() { this.children = []; },
        setAttribute(key, value) { this.attributes[key] = value; },
        addEventListener(name, handler) { this.events[name] = handler; },
        click() { if (!this.disabled) this.events.click(); },
        focus(options) { this.focusOptions = options; },
        showModal() { this.open = true; }, close() { this.open = false; this.events.close(); }
    });
    for (const [, id] of html.matchAll(/id="([^"]+)"/g)) elements[id] = element();
    const context = vm.createContext({ document: { getElementById: id => elements[id], createElement: element, body: element() }, navigator: {} });
    for (const script of scripts) vm.runInContext(read(script), context);
    const quiz = vm.runInContext('quiz', context);
    const e = elements;
    assert.equal(quiz.tasks.length, tasks.length);
    assert.equal(e.question.textContent, quiz.current.prompt);
    assert.equal(e['submit-answer'].disabled, true);
    const submit = () => e['quiz-form'].events.submit({ preventDefault() {} });
    e.choices.children.find(button => button.textContent !== quiz.current.answer).click();
    submit(); submit();
    assert.equal(e['incorrect-count'].textContent, '1');
    assert.equal(e.explanation.hidden, false);
    assert.equal(e.rule.textContent, quiz.current.rule);
    assert.equal(e.explanation.focusOptions.preventScroll, true);
    e['next-question'].click();
    e.choices.children.find(button => button.textContent === quiz.current.answer).click();
    submit();
    assert.equal(e['correct-count'].textContent, '1');
    e['show-history'].click();
    assert.equal(e['history-sheet'].open, true);
    assert.equal(e['history-list'].children.length, 2);
    e['close-history'].click();
    e['show-mistakes'].click();
    assert.equal(e['history-list'].children.length, 1);
    for (const [, file] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        assert.ok(fs.existsSync(path.join(__dirname, '..', file)));
        assert.ok(read('sw.js').includes(`'/${file}'`));
    }
    assert.ok(!html.includes('\ufffd'));
});
