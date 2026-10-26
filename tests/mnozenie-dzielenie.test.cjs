const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildTasks, createPractice } = require('../mnozenie-dzielenie-quiz.js');

test('pełna tabliczka 1–10 obejmuje 100 i wszystkie wielokrotności 10', () => {
    const tasks = buildTasks({ operation: 'mixed', tables: [1,2,3,4,5,6,7,8,9,10], practice: 'train' });
    assert.equal(tasks.length, 600);
    for (const task of tasks) {
        const values = task.values.slice();
        assert.equal(values[task.gap], task.answer);
        assert.ok(values.every(value => Number.isInteger(value) && value >= 1 && value <= 100));
        assert.equal(task.operation === 'mul' ? values[0] * values[1] : values[0] / values[1], values[2]);
        assert.ok(task.prompt.includes('?'));
        assert.ok(task.explanation.includes(`${task.a * task.b}`));
    }
    for (let n = 1; n <= 10; n++) {
        assert.ok(tasks.some(t => t.operation === 'mul' && t.answer === n * 10));
    }
});

test('wybór tabliczek ogranicza mnożnik i dzielnik, nauka pyta tylko o wynik', () => {
    for (const operation of ['mul', 'div', 'mixed']) {
        const tasks = buildTasks({ operation, tables: [6,8], practice: 'learn' });
        assert.equal(tasks.length, operation === 'mixed' ? 40 : 20);
        assert.ok(tasks.every(t => [6,8].includes(t.b) && t.gap === 2));
        if (operation !== 'mixed') assert.ok(tasks.every(t => t.operation === operation));
    }
});

test('odpowiedź musi być całą liczbą, błąd jest oceniany tylko raz i czeka na Dalej', () => {
    const quiz = createPractice({ random: () => 0 });
    const original = quiz.current;
    for (const value of ['', ' ', '7.5', '7abc', '-1', '1e1']) {
        assert.equal(quiz.submit(value).valid, false, value);
    }
    assert.equal(quiz.correct + quiz.incorrect, 0);
    assert.equal(quiz.submit('101').correct, false);
    assert.equal(quiz.phase, 'error');
    assert.equal(quiz.current, original);
    quiz.submit(String(original.answer));
    assert.equal(quiz.incorrect, 1);
    assert.equal(quiz.correct, 0);
    assert.equal(quiz.mistakes.length, 1);
    quiz.next();
    assert.equal(quiz.phase, 'question');
    assert.notEqual(quiz.current.fact, original.fact);
});

test('błędne działanie wraca po trzech innych odpowiedziach', () => {
    const quiz = createPractice({ random: () => 0 });
    const fact = quiz.current.fact;
    quiz.submit('101');
    quiz.next();
    for (let i = 0; i < 3; i++) {
        assert.notEqual(quiz.current.fact, fact);
        quiz.submit(String(quiz.current.answer));
    }
    assert.equal(quiz.current.fact, fact);
});

test('Moje błędy jest puste bez pomyłek i respektuje filtry', () => {
    const quiz = createPractice();
    quiz.configure({ practice: 'mistakes' });
    assert.equal(quiz.current, null);
    quiz.configure({ practice: 'learn', operation: 'mul', tables: [7] });
    quiz.submit('101');
    quiz.configure({ practice: 'mistakes', tables: [8] });
    assert.equal(quiz.current, null);
    quiz.configure({ tables: [7] });
    assert.equal(quiz.current.b, 7);
    assert.equal(quiz.current.operation, 'mul');
});

test('trzy samodzielne poprawne odpowiedzi opanowują działanie i kończą jego powtórkę', () => {
    const quiz = createPractice({ random: () => 0 });
    quiz.submit('101');
    const fact = quiz.current.fact;
    quiz.configure({ practice: 'mistakes' });
    quiz.hint();
    quiz.submit(String(quiz.current.answer));
    assert.equal(quiz.facts[fact].streak, 0);
    for (let i = 0; i < 3; i++) quiz.submit(String(quiz.current.answer));
    assert.equal(quiz.facts[fact].streak, 3);
    assert.equal(quiz.current, null);
    assert.equal(quiz.mistakes.length, 1, 'historia pozostaje po opanowaniu działania');
});

test('ustawienia, liczniki, błędy i opanowanie przeżywają zapis i odczyt', () => {
    const quiz = createPractice({ random: () => 0 });
    quiz.configure({ practice: 'learn', operation: 'div', tables: [1,10] });
    quiz.submit(String(quiz.current.answer));
    quiz.submit('101');
    const restored = createPractice({ saved: JSON.stringify(quiz.snapshot()) });
    assert.deepEqual(restored.settings, quiz.settings);
    assert.equal(restored.correct, 1);
    assert.equal(restored.incorrect, 1);
    assert.deepEqual(restored.mistakes, quiz.mistakes);
    assert.deepEqual(restored.facts, quiz.facts);
});

test('uszkodzony zapis i nieprawidłowe ustawienia mają bezpieczne wartości domyślne', () => {
    for (const saved of ['{', 'null', '[]', '{"version":99}', '{"version":1,"facts":{"bad":{}}}']) {
        const quiz = createPractice({ saved });
        assert.ok(quiz.current);
        assert.equal(quiz.correct, 0);
    }
    const quiz = createPractice();
    quiz.configure({ tables: [], operation: 'bad', practice: 'bad' });
    assert.ok(quiz.settings.tables.length);
    assert.ok(quiz.current);
});

test('postęp rozróżnia mnożenie od dzielenia i pokazuje liczbę opanowanych działań', () => {
    const quiz = createPractice({ random: () => 0 });
    quiz.configure({ practice: 'learn', tables: [1], operation: 'mul' });
    for (let i = 0; i < 30; i++) quiz.submit(String(quiz.current.answer));
    const progress = quiz.progress(1);
    assert.equal(progress.mastered, 10);
    assert.equal(progress.total, 10);
    quiz.configure({ operation: 'div' });
    assert.equal(quiz.progress(1).mastered, 0);
});

test('podpowiedź przerywa serię samodzielnych odpowiedzi', () => {
    const quiz = createPractice({ random: () => 0 });
    quiz.configure({ practice: 'learn', operation: 'mul', tables: [7] });
    const fact = quiz.current.fact;
    for (let i = 0; i < 20; i++) quiz.submit(String(quiz.current.answer));
    assert.equal(quiz.facts[fact].streak, 2);
    quiz.hint();
    quiz.submit(String(quiz.current.answer));
    assert.equal(quiz.facts[fact].streak, 0);
});

test('strona i wszystkie nowe zasoby są dostępne w cache offline', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.join(__dirname,'..');
    const html = fs.readFileSync(path.join(root,'mnozenie-dzielenie.html'),'utf8');
    const worker = fs.readFileSync(path.join(root,'sw.js'),'utf8');
    for (const asset of ['mnozenie-dzielenie.css','mnozenie-dzielenie.js','mnozenie-dzielenie-quiz.js']) {
        assert.ok(html.includes(asset));
        assert.ok(worker.includes(`'/${asset}'`));
        assert.ok(fs.existsSync(path.join(root,asset)));
    }
    assert.ok(html.indexOf('src="mnozenie-dzielenie-quiz.js"') < html.indexOf('src="mnozenie-dzielenie.js"'));
});
