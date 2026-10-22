const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tasks, createQuiz, groupPairs } = require('../sprytne-dodawanie-quiz.js');

test('baza obejmuje wszystkie sposoby z książki i ma jednoznaczne odpowiedzi', () => {
    assert.ok(tasks.length >= 100);
    assert.equal(new Set(tasks.map(t => t.prompt)).size, tasks.length);
    for (const category of ['Dopełnianie', 'Pary do pełnych dziesiątek', 'Poziom A', 'Poziom B', 'Poziom C', 'Poziom D', 'Mistrz', 'Zadania tekstowe', 'Przemienność', 'Przekładanie']) {
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

test('sumy i grupowanie par nie gubią ani nie zmieniają składników', () => {
    for (const task of tasks.filter(t => t.numbers)) {
        assert.equal(Number(task.answer.replaceAll(' ', '')), task.numbers.reduce((a,b) => a+b, 0));
        const copy = task.numbers.slice();
        const grouped = groupPairs(copy);
        assert.deepEqual(copy, task.numbers);
        assert.deepEqual(grouped.flat().sort((a,b) => a-b), copy.slice().sort((a,b) => a-b));
        for (const pair of grouped.filter(g => g.length === 2)) assert.equal((pair[0] + pair[1]) % 10, 0);
    }
    assert.deepEqual(groupPairs([14,8,36,17,42]), [[14,36],[8,42],[17]]);
});

test('przekładanie zachowuje dokładną sumę i tylko jedna opcja jest poprawna', () => {
    for (const t of tasks.filter(t => t.transfer)) {
        const { a, b } = t.transfer;
        const valid = t.choices.filter(option => option.match(/\d+/g).map(Number).reduce((s,n) => s+n, 0) === a+b);
        assert.deepEqual(valid, [t.answer]);
        const [x,y] = t.answer.match(/\d+/g).map(Number);
        assert.equal(x-a, b-y);
        assert.ok(x % 10 === 0 || y % 10 === 0);
    }
});

test('tylko jedna z podanych liczb dopełnia parę do pełnych dziesiątek', () => {
    for (const task of tasks.filter(t => t.category === 'Pary do pełnych dziesiątek')) {
        const a = Number(task.prompt.match(/do (\d+)/)[1]);
        const valid = task.choices.filter(choice => (a + Number(choice)) % 10 === 0);
        assert.deepEqual(valid, [task.answer]);
    }
});

test('zadania tekstowe z książki i dodatkowe warunki są poprawne', () => {
    for (const [fragment, answer] of [['Dwie dynie', '186'], ['Do parku', '94'], ['długość Odry', '854'], ['długość Wisły', '1 047'], ['Ile dębów', '110'], ['Ile ptaków', '65'], ['na wędliny', '61'], ['na nabiał', '34'], ['kawiarenkę', '272'], ['15 punktów', '5'], ['od 51 do 60', '555']]) {
        assert.equal(tasks.find(t => t.prompt.includes(fragment))?.answer, answer, fragment);
    }
});

test('liczniki, historia i wyjaśnienia działają bez podwójnego naliczania', () => {
    const quiz = createQuiz(tasks.slice(0,2), false);
    quiz.submit();
    assert.equal(quiz.history.length, 0);
    quiz.choose(quiz.current.choices.find(c => c !== quiz.current.answer));
    quiz.submit(); quiz.submit();
    assert.equal(quiz.incorrect, 1);
    assert.equal(quiz.phase, 'explanation');
    assert.equal(quiz.history[0].rule, tasks[0].rule);
    quiz.next();
    for (let i=0; i<5; i++) { quiz.choose(quiz.current.answer); quiz.submit(); }
    assert.equal(quiz.correct, 5);
    assert.equal(quiz.history.length, 6);
});

test('strona uruchamia moduł 5, obsługuje odpowiedzi, historię i ma zasoby offline', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const html = read('dzial-2-sprytne-dodawanie.html');
    const scripts = [...html.matchAll(/<script src="([^"]+)" defer/g)].map(m => m[1]);
    assert.deepEqual(scripts, ['zapis-liczb-quiz.js', 'sprytne-dodawanie-quiz.js', 'zapis-liczb.js']);
    const elements = {};
    const element = () => ({
        hidden: false, disabled: false, textContent: '', children: [], events: {}, attributes: {},
        classList: { toggle() {}, add() {}, remove() {} },
        append(...items) { this.children.push(...items); },
        replaceChildren() { this.children = []; },
        setAttribute(key,value) { this.attributes[key] = value; },
        addEventListener(name,handler) { this.events[name] = handler; },
        click() { if (!this.disabled) this.events.click(); },
        focus(options) { this.focusOptions = options; },
        showModal() { this.open = true; }, close() { this.open = false; this.events.close(); }
    });
    for (const [,id] of html.matchAll(/id="([^"]+)"/g)) elements[id] = element();
    const context = vm.createContext({ document: { getElementById: id => elements[id], createElement: element, body: element() }, navigator: {} });
    for (const script of scripts) vm.runInContext(read(script), context);
    const quiz = vm.runInContext('quiz', context);
    const e = elements;
    assert.equal(quiz.tasks.length, tasks.length);
    assert.ok(tasks.some(t => t.prompt === e.question.textContent));
    assert.equal(e['submit-answer'].disabled, true);
    const submit = () => e['quiz-form'].events.submit({ preventDefault() {} });
    e.choices.children.find(b => b.textContent !== quiz.current.answer).click();
    submit(); submit();
    assert.equal(e['incorrect-count'].textContent, '1');
    assert.equal(e.explanation.hidden, false);
    assert.equal(e.rule.textContent, quiz.current.rule);
    assert.equal(e.explanation.focusOptions.preventScroll, true);
    e['next-question'].click();
    e.choices.children.find(b => b.textContent === quiz.current.answer).click();
    submit();
    assert.equal(e['correct-count'].textContent, '1');
    e['show-history'].click();
    assert.equal(e['history-sheet'].open, true);
    assert.equal(e['history-list'].children.length, 2);
    e['close-history'].click();
    e['show-mistakes'].click();
    assert.equal(e['history-list'].children.length, 1);
    for (const [,file] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        assert.ok(fs.existsSync(path.join(__dirname, '..', file)));
        assert.ok(read('sw.js').includes(`'/${file}'`));
    }
    assert.ok(!html.includes('\ufffd'));
});
