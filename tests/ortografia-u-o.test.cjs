const { test } = require('node:test');
const assert = require('node:assert/strict');
const { words, createQuiz, createPractice } = require('../ortografia-u-o-quiz.js');

const sample = [
    { before: 'st', answer: 'ó', after: 'ł', rule: 'stół – stoły' },
    { before: 'b', answer: 'u', after: 'rza', rule: 'Zapamiętaj: burza.' }
];

test('zatwierdzenie bez wyboru nie zmienia zadania ani wyniku', () => {
    const quiz = createQuiz(sample);
    quiz.submit();
    assert.equal(quiz.index, 0);
    assert.equal(quiz.correct, 0);
    assert.equal(quiz.phase, 'question');
});

test('wybór można zmienić przed zatwierdzeniem', () => {
    const quiz = createQuiz(sample);
    quiz.choose('u');
    quiz.choose('ó');
    assert.equal(quiz.selected, 'ó');
    assert.equal(quiz.index, 0);
});

test('dobra odpowiedź przechodzi od razu dalej i czyści wybór', () => {
    const quiz = createQuiz(sample);
    quiz.choose('ó');
    assert.equal(quiz.submit(), 'correct');
    assert.equal(quiz.index, 1);
    assert.equal(quiz.correct, 1);
    assert.equal(quiz.selected, null);
    assert.equal(quiz.phase, 'question');
});

test('błąd zatrzymuje zadanie z zasadą aż do kliknięcia Dalej', () => {
    const quiz = createQuiz(sample);
    quiz.choose('u');
    assert.equal(quiz.submit(), 'incorrect');
    assert.equal(quiz.phase, 'explanation');
    assert.equal(quiz.current.rule, 'stół – stoły');
    quiz.choose('ó');
    quiz.submit();
    assert.equal(quiz.index, 0);
    assert.equal(quiz.correct, 0);
    assert.equal(quiz.selected, 'u');
    quiz.next();
    assert.equal(quiz.index, 1);
    assert.equal(quiz.selected, null);
    assert.equal(quiz.phase, 'question');
});

test('nie można pominąć pytania przyciskiem Dalej', () => {
    const quiz = createQuiz(sample);
    quiz.next();
    quiz.choose('x');
    assert.equal(quiz.index, 0);
    assert.equal(quiz.selected, null);
});

test('ćwiczenie trwa dalej po przejściu całej bazy i zachowuje licznik', () => {
    const quiz = createQuiz(sample.slice(0, 1));
    for (let i = 0; i < 25; i++) {
        quiz.choose('ó');
        quiz.submit();
    }
    assert.equal(quiz.phase, 'question');
    assert.equal(quiz.correct, 25);
    assert.equal(quiz.index, 25);
    assert.equal(quiz.current.answer, 'ó');
});

test('każdy błąd jest liczony raz i zachowuje wybraną literę, poprawne słowo oraz zasadę', () => {
    const quiz = createQuiz(sample.slice(0, 1));
    quiz.choose('u');
    quiz.submit();
    quiz.submit();
    assert.equal(quiz.phase, 'explanation');
    assert.equal(quiz.incorrect, 1);
    assert.deepEqual(quiz.mistakes[0], {word: 'stół', picked: 'u', answer: 'ó', rule: 'stół – stoły'});
    quiz.next();
    assert.equal(quiz.phase, 'question');
    quiz.choose('u');
    quiz.submit();
    assert.equal(quiz.incorrect, 2);
    assert.equal(quiz.mistakes.length, 2);
    assert.equal(quiz.correct, 0);
});

test('baza zawiera unikalne słowa, obie litery i zasady dla każdego zadania', () => {
    assert.equal(words.length, 300);
    const spelling = words.map(word => word.before + word.answer + word.after);
    assert.equal(new Set(spelling).size, words.length);
    assert.deepEqual([...new Set(words.map(word => word.answer))].sort(), ['u', 'ó']);
    for (const word of words) {
        assert.ok(word.rule.length > 20);
        assert.equal(typeof word.before, 'string');
        assert.equal(typeof word.after, 'string');
        assert.ok(!word.before.includes('_') && !word.after.includes('_'));
        assert.equal(typeof word.category, 'string');
    }
});

test('300 wyrazów ma dokładnie podany rozkład głównych kategorii', () => {
    const counts = {};
    for (const word of words) counts[word.category] = (counts[word.category] || 0) + 1;
    assert.deepEqual(counts, {
        'Ó wymienne na O': 40,
        'Ó wymienne na E': 20,
        'Ó wymienne na A': 10,
        'Ó w zakończeniach -ów, -ówka, -ówna': 35,
        'Ó na początku wyrazu': 10,
        'Ó niewymienne – do zapamiętania': 45,
        'U w zakończeniach czasowników': 35,
        'U w zakończeniach rzeczowników': 30,
        'U na początku wyrazu': 25,
        'U niewymienne – do zapamiętania': 40,
        'Wyjątki i pułapki': 10
    });
    for (const word of words) {
        if (word.category.startsWith('Ó')) assert.equal(word.answer, 'ó');
        if (word.category.startsWith('U')) assert.equal(word.answer, 'u');
        if (word.category.includes('na początku')) assert.equal(word.before, '');
    }
});

test('ciągłe ćwiczenie używa całej bazy bez powtórzeń przed jej wyczerpaniem', () => {
    const before = words.slice();
    const quiz = createPractice();
    const seen = new Set();
    for (let i = 0; i < words.length; i++) {
        seen.add(quiz.current);
        quiz.choose(quiz.current.answer);
        quiz.submit();
    }
    assert.equal(seen.size, words.length);
    assert.equal(quiz.phase, 'question');
    assert.equal(quiz.correct, words.length);
    assert.deepEqual(words, before);
    assert.throws(() => createQuiz([]), /Brak słów/);
});

// Adapter DOM do uruchomienia rzeczywistych procedur przycisków bez przeglądarki.
function loadPage() {
    const fs = require('node:fs');
    const vm = require('node:vm');
    const path = require('node:path');
    const html = fs.readFileSync(path.join(__dirname, '../ortografia-u-o.html'), 'utf8');
    const elements = {};
    function element() {
        return {
            hidden: false, disabled: false, textContent: '', attributes: {}, events: {},
            classList: { toggle() {} },
            children: [],
            append(...items) { this.children.push(...items); },
            replaceChildren(...items) { this.children = items; },
            showModal() { this.open = true; },
            close() { this.open = false; this.events.close(); },
            focus() { this.focused = true; },
            setAttribute(key, value) { this.attributes[key] = value; },
            addEventListener(name, handler) { this.events[name] = handler; },
            click() { if (!this.disabled) this.events.click(); }
        };
    }
    for (const [, id] of html.matchAll(/id="([^"]+)"/g)) elements[id] = element();
    const choices = ['u', 'ó'].map(letter => Object.assign(element(), {dataset: {letter}}));
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../ortografia-u-o.js'), 'utf8'), {
        document: {getElementById: id => elements[id], querySelectorAll: () => choices,
            createElement: element, body: {classList: {toggle() {}}}},
        UOQuiz: {createPractice: () => createQuiz(sample)}, navigator: {}
    });
    return {elements, choices, submit: () => elements['quiz-form'].events.submit({preventDefault() {}})};
}

test('przyciski pokazują wybór, a zatwierdzenie dobrej odpowiedzi renderuje kolejne słowo', () => {
    const {elements, choices, submit} = loadPage();
    assert.equal(elements['submit-answer'].disabled, true);
    choices[1].click();
    assert.equal(elements['word-gap'].textContent, 'ó');
    assert.equal(choices[1].attributes['aria-pressed'], 'true');
    assert.equal(elements['submit-answer'].disabled, false);
    submit();
    assert.equal(elements['word-before'].textContent, 'b');
    assert.equal(elements['word-gap'].textContent, '?');
    assert.equal(elements['correct-count'].textContent, '1');
    assert.equal(elements['incorrect-count'].textContent, '0');
    assert.equal(elements.explanation.hidden, true);
    assert.equal(elements['submit-answer'].disabled, true);
});

test('błąd pokazuje zasadę, Dalej zachowuje liczniki i ćwiczenie nie kończy się', () => {
    const {elements, choices, submit} = loadPage();
    choices[0].click();
    submit();
    assert.equal(elements.explanation.hidden, false);
    assert.equal(elements['quiz-form'].hidden, true);
    assert.equal(elements.status.hidden, true);
    assert.equal(elements.rule.textContent, 'stół – stoły');
    assert.equal(elements['word-gap'].textContent, 'ó');
    assert.equal(elements.correction.textContent, 'Poprawna pisownia: stół.');
    assert.equal(elements['submit-answer'].hidden, true);
    assert.ok(choices.every(choice => choice.disabled));
    elements['next-question'].click();
    assert.equal(elements.explanation.hidden, true);
    assert.equal(elements['quiz-form'].hidden, false);
    assert.equal(elements.status.hidden, false);
    choices[0].click();
    submit();
    assert.equal(elements['correct-count'].textContent, '1');
    assert.equal(elements['incorrect-count'].textContent, '1');
    assert.equal(elements['word-before'].textContent, 'st');
    assert.equal(elements['word-gap'].textContent, '?');
});

test('pasek błędów otwiera pustą listę, a zamknięcie zwija panel', () => {
    const {elements} = loadPage();
    elements['show-mistakes'].click();
    assert.equal(elements['mistakes-sheet'].open, true);
    assert.equal(elements['mistakes-empty'].hidden, false);
    assert.equal(elements['show-mistakes'].attributes['aria-expanded'], 'true');
    elements['close-mistakes'].click();
    assert.equal(elements['mistakes-sheet'].open, false);
    assert.equal(elements['show-mistakes'].attributes['aria-expanded'], 'false');
});

test('dolny panel pokazuje wszystkie błędy wraz z poprawną pisownią i wybraną literą', () => {
    const {elements, choices, submit} = loadPage();
    choices[0].click();
    submit();
    elements['next-question'].click();
    choices[1].click();
    submit();
    elements['show-mistakes'].click();
    assert.equal(elements['mistakes-empty'].hidden, true);
    assert.equal(elements['mistakes-list'].children.length, 2);
    const first = elements['mistakes-list'].children[0].children;
    assert.equal(first[0].textContent, 'stół');
    assert.match(first[1].textContent, /u.*ó/);
    assert.equal(first[2].textContent, 'stół – stoły');
    elements['close-mistakes'].click();
    elements['show-mistakes'].click();
    assert.equal(elements['mistakes-list'].children.length, 2);
    assert.equal(elements['incorrect-count'].textContent, '2');
});
