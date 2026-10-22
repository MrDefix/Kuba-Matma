const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tasks, createQuiz } = require('../pamiec-quiz.js');

test('pula obejmuje rachunki, zera, sprawdzanie, nazwy działań i zadania tekstowe', () => {
    assert.ok(tasks.length >= 150);
    assert.equal(new Set(tasks.map(t => t.prompt)).size, tasks.length);
    for (const category of ['Poziom A', 'Poziom B', 'Poziom C', 'Poziom D', 'Mistrz', 'Zero w działaniach', 'Sprawdzanie odejmowania', 'Nazwy działań', 'Zadania tekstowe', 'Brakująca liczba', 'Hasła']) {
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

test('wszystkie rachunki mają poprawne wyniki, także zero i różna liczba zer', () => {
    const read = text => Number(text.replaceAll(' ', ''));
    for (const t of tasks.filter(t => /^Oblicz:/.test(t.prompt))) {
        const match = t.prompt.match(/^Oblicz: ([\d ]+) ([+−]) ([\d ]+) = \?/);
        assert.ok(match, t.prompt);
        const a = read(match[1]), b = read(match[3]), result = read(t.answer);
        if (match[2] === '+') assert.equal(result - a, b, t.prompt);
        else assert.equal(result + b, a, t.prompt);
        assert.ok(result >= 0);
    }
    for (const [prompt, answer] of [['Oblicz: 500 + 30 = ?', '530'], ['Oblicz: 500 + 300 = ?', '800'], ['Oblicz: 8 000 − 40 = ?', '7 960'], ['Oblicz: 0 + 0 = ?', '0']]) {
        assert.equal(tasks.find(t => t.prompt === prompt)?.answer, answer, prompt);
    }
});

test('ważne zadania tekstowe, brakujące liczby i hasła mają poprawne odpowiedzi', () => {
    for (const [fragment, answer] of [['93 000', '85 000'], ['Kasia ma 32', '49'], ['Którą dyscyplinę', 'Dżudo, o 26 osób więcej'], ['34 orzechy', '125'], ['Różnica dwóch liczb wynosi 9', '12 i 3'], ['Hasło z dodawania', 'ZASKRONIEC'], ['Hasło z odejmowania', 'NIETOPERZ']]) {
        assert.equal(tasks.find(t => t.prompt.includes(fragment))?.answer, answer, fragment);
    }
    for (const t of tasks.filter(t => t.category === 'Brakująca liczba')) {
        const match = t.prompt.match(/(\d+) ([+−]) □ = (\d+)/);
        assert.ok(match);
        assert.equal(match[2] === '+' ? Number(match[1]) + Number(t.answer) : Number(match[1]) - Number(t.answer), Number(match[3]));
    }
});

test('weryfikacja odejmowania używa działania odwrotnego', () => {
    for (const t of tasks.filter(t => t.category === 'Sprawdzanie odejmowania')) {
        const [result, b, a] = t.answer.match(/\d+/g).map(Number);
        assert.equal(result + b, a);
        assert.equal(t.choices.filter(option => {
            const [x, y, z] = option.match(/\d+/g).map(Number);
            return x + y === z;
        }).length, 1);
    }
});

test('liczniki, historia i przechodzenie działają bez końca i bez podwójnej oceny błędu', () => {
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
    assert.equal(quiz.phase, 'question');
});

test('strona modułu 3 obsługuje wybór, błąd, Dalej i historię we wspólnym interfejsie', () => {
    const fs = require('node:fs');
    const vm = require('node:vm');
    const path = require('node:path');
    const html = fs.readFileSync(path.join(__dirname, '../dzial-2-dodawanie-odejmowanie-w-pamieci.html'), 'utf8');
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
    const quiz = createQuiz(tasks.slice(0, 2), false);
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../zapis-liczb.js'), 'utf8'), {
        MemoryMathQuiz: { createQuiz: () => quiz }, NumberQuiz: { shuffle: list => list.slice() },
        document: { getElementById: id => elements[id], createElement: element, body: element() }, navigator: {}
    });
    const e = elements;
    const submit = () => e['quiz-form'].events.submit({ preventDefault() {} });
    assert.equal(e.question.textContent, tasks[0].prompt);
    assert.equal(e['submit-answer'].disabled, true);
    e.choices.children[0].click(); submit();
    assert.equal(e['correct-count'].textContent, '1');
    e.choices.children[1].click(); submit(); submit();
    assert.equal(e['incorrect-count'].textContent, '1');
    assert.equal(e['quiz-form'].hidden, true);
    assert.equal(e.explanation.hidden, false);
    assert.equal(e.rule.textContent, tasks[1].rule);
    assert.equal(e.explanation.focusOptions.preventScroll, true);
    e['show-history'].click();
    assert.equal(e['history-list'].children.length, 2);
    e['close-history'].click();
    e['show-mistakes'].click();
    assert.equal(e['history-list'].children.length, 1);
    e['close-history'].click();
    e['next-question'].click();
    assert.equal(e['quiz-form'].hidden, false);
    assert.equal(e.explanation.hidden, true);
});

test('moduł ładuje właściwą bazę w przeglądarce i ma wszystkie zasoby offline', () => {
    const fs = require('node:fs');
    const vm = require('node:vm');
    const path = require('node:path');
    const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const html = read('dzial-2-dodawanie-odejmowanie-w-pamieci.html');
    const scripts = [...html.matchAll(/<script src="([^"]+)" defer/g)].map(m => m[1]);
    assert.deepEqual(scripts, ['zapis-liczb-quiz.js', 'pamiec-quiz.js', 'zapis-liczb.js']);
    const context = vm.createContext({});
    vm.runInContext(read(scripts[0]), context);
    vm.runInContext(read(scripts[1]), context);
    assert.equal(context.MemoryMathQuiz.tasks.length, tasks.length);
    assert.equal(context.MemoryMathQuiz.createQuiz().tasks.length, tasks.length);
    for (const [, file] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        assert.ok(fs.existsSync(path.join(__dirname, '..', file)));
        assert.ok(read('sw.js').includes(`'/${file}'`));
    }
    assert.ok(html.includes('w pamięci'));
    assert.ok(!html.includes('\ufffd'));
});
