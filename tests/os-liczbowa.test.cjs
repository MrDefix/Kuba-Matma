const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tasks, createQuiz, renderAxis } = require('../os-liczbowa-quiz.js');

test('pula osi ma unikalne pytania i cztery różne odpowiedzi', () => {
    assert.ok(tasks.length >= 100);
    assert.equal(new Set(tasks.map(t => JSON.stringify([t.prompt, t.axis]))).size, tasks.length);
    for (const task of tasks) {
        assert.equal(task.choices.length, 4);
        assert.equal(new Set(task.choices).size, 4);
        assert.ok(task.choices.includes(task.answer));
        assert.ok(task.rule.length > 20);
    }
});

test('pytania nie zawierają technicznych numerów osi', () => {
    for (const task of tasks) assert.doesNotMatch(task.prompt, /^Oś\s+\d+/);
});

test('wartości punktów i skala zgadzają się z rysunkiem, także przy odliczaniu wstecz', () => {
    for (const task of tasks.filter(t => t.axis)) {
        const { start, step, count, labels, points } = task.axis;
        const known = Object.entries(labels).map(([i, label]) => [Number(i), Number(label)]);
        assert.ok(known.length >= 2);
        assert.equal((known[1][1] - known[0][1]) / (known[1][0] - known[0][0]), step);
        for (const [index, label] of known) assert.equal(start + index * step, label);
        for (const index of Object.values(points)) assert.ok(index >= 0 && index < count);
        if (task.kind === 'read') assert.equal(Number(task.answer), start + points[task.target] * step);
        if (task.kind === 'scale') assert.equal(Number(task.answer), step);
        if (task.kind === 'mark') assert.equal(start + points[task.answer] * step, task.target);
    }
    assert.ok(tasks.some(t => t.axis && !('0' in t.axis.labels)));
    assert.ok(tasks.some(t => t.axis && Object.values(t.axis.points).some(i => i % 1 !== 0)));
});

test('SVG pokazuje podpisy i punkty, nie zdradza ukrytej wartości w opisie', () => {
    const task = tasks.find(t => t.kind === 'read');
    const svg = renderAxis(task.axis);
    assert.match(svg, /<svg/);
    assert.match(svg, /role="img"/);
    assert.match(svg, /viewBox/);
    assert.match(svg, /<title>/);
    assert.match(svg, /A/);
    assert.ok(!svg.includes(`A = ${task.answer}`));
});

test('historia osi zachowuje rysunek, liczniki i wyjaśnienie, błąd blokuje ponowną ocenę', () => {
    const quiz = createQuiz(tasks.filter(t => t.axis).slice(0, 2), false);
    const first = quiz.current;
    quiz.choose(first.choices.find(c => c !== first.answer));
    assert.equal(quiz.submit(), 'incorrect');
    quiz.submit();
    assert.equal(quiz.incorrect, 1);
    assert.deepEqual(quiz.history[0].axis, first.axis);
    quiz.next();
    quiz.choose(quiz.current.answer);
    assert.equal(quiz.submit(), 'correct');
    assert.equal(quiz.correct, 1);
    assert.equal(quiz.history.length, 2);
});

test('interfejs osi wyświetla SVG i zachowuje je po błędzie oraz w historii', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const html = fs.readFileSync(path.join(__dirname, '../dzial-2-os-liczbowa.html'), 'utf8');
    const elements = {};
    const element = () => ({
        hidden: false, disabled: false, textContent: '', innerHTML: '', children: [], events: {}, attributes: {},
        classList: { toggle() {}, add() {}, remove() {} },
        append(...children) { this.children.push(...children); },
        replaceChildren() { this.children = []; },
        setAttribute(key, value) { this.attributes[key] = value; },
        addEventListener(name, listener) { this.events[name] = listener; },
        focus() {}, showModal() { this.open = true; },
        close() { this.open = false; this.events.close(); },
        click() { if (!this.disabled) this.events.click(); }
    });
    for (const [, id] of html.matchAll(/id="([^"]+)"/g)) elements[id] = element();
    const quiz = createQuiz(tasks.slice(0, 2), false);
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../zapis-liczb.js'), 'utf8'), {
        NumberLineQuiz: { createQuiz: () => quiz, renderAxis },
        NumberQuiz: { shuffle: list => list.slice() },
        document: { getElementById: id => elements[id], createElement: element, body: element() }, navigator: {}
    });
    const e = elements;
    const drawing = e['axis-drawing'].innerHTML;
    assert.match(drawing, /<svg/);
    assert.equal(e['axis-drawing'].hidden, false);
    e.choices.children[1].click();
    e['quiz-form'].events.submit({ preventDefault() {} });
    assert.equal(e['quiz-form'].hidden, true);
    assert.equal(e['axis-drawing'].innerHTML, drawing);
    e['show-history'].click();
    assert.equal(e['history-sheet'].open, true);
    assert.equal(e['history-list'].children[0].children[3].innerHTML, drawing);
    e['close-history'].click();
    e['next-question'].click();
    assert.equal(e.question.textContent, tasks[1].prompt);
    assert.equal(e['quiz-form'].hidden, false);
    assert.equal(e['incorrect-count'].textContent, '1');
});

test('strona ładuje skrypty w kolejności i wszystkie jej zasoby są w cache offline', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const html = read('dzial-2-os-liczbowa.html');
    const scripts = [...html.matchAll(/<script src="([^"]+)" defer/g)].map(match => match[1]);
    assert.deepEqual(scripts, ['zapis-liczb-quiz.js', 'os-liczbowa-quiz.js', 'zapis-liczb.js']);
    for (const [, file] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        assert.ok(fs.existsSync(path.join(__dirname, '..', file)));
        assert.ok(read('sw.js').includes(`'/${file}'`));
    }
    assert.match(html, /Oś liczbowa/);
    assert.ok(!html.includes('\ufffd'));
});
