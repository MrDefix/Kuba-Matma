'use strict';

const picker = document.getElementById('set-picker');
const exam = document.getElementById('exam');
const form = document.getElementById('exam-form');
const tasks = document.getElementById('tasks');
const resultPanel = document.getElementById('result');
const controls = new Map();
const results = new Map();
let currentSet;
let submitted = false;

function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
}

function renderSets() {
    const list = document.getElementById('sets');
    list.replaceChildren();
    for (const set of UOExam.sets) {
        const button = node('button', '', 'tile');
        button.type = 'button';
        button.append(node('strong', set.name));
        const result = results.get(set.id);
        button.append(node('small', result ? `Ostatni wynik: ${result.score}/30 · ocena ${result.grade.value}` : '17 + 10 + 3 punkty'));
        button.addEventListener('click', () => start(set));
        list.append(button);
    }
}

function updateProgress() {
    const filled = [...controls.values()].filter(({ input }) => input.value.trim()).length;
    document.getElementById('progress').textContent = `Uzupełnione pola: ${filled}/30`;
}

function start(set) {
    currentSet = set;
    submitted = false;
    controls.clear();
    tasks.replaceChildren();
    picker.hidden = true;
    resultPanel.hidden = true;
    exam.hidden = false;
    form.querySelector('button[type="submit"]').hidden = false;
    document.getElementById('exam-title').textContent = set.name;
    set.sections.forEach((section, index) => {
        const fieldset = node('fieldset', '', 'exam-task');
        fieldset.append(node('legend', `${index + 1}. ${section.title} (0–${section.fields.length} pkt)`));
        fieldset.append(node('p', section.instruction));
        const fields = node('div', '', index === 1 ? 'task-fields word-fields' : 'task-fields');
        for (const field of section.fields) {
            const wrapper = node('div', '', 'exam-field');
            const label = node('label', field.label);
            label.htmlFor = field.id;
            let input;
            if (field.kind === 'letter') {
                input = node('select');
                const placeholder = node('option', 'Wybierz: u / ó');
                placeholder.value = '';
                input.append(placeholder);
                for (const letter of ['u', 'ó']) {
                    const option = node('option', letter);
                    option.value = letter;
                    input.append(option);
                }
            } else {
                input = node('input');
                input.type = 'text';
                input.maxLength = 80;
                input.spellcheck = false;
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('autocapitalize', 'off');
            }
            input.id = field.id;
            input.name = field.id;
            const feedback = node('p', '', 'field-feedback');
            feedback.id = `${field.id}-feedback`;
            feedback.hidden = true;
            input.setAttribute('aria-describedby', feedback.id);
            wrapper.append(label, input, feedback);
            controls.set(field.id, { wrapper, input, feedback });
            fields.append(wrapper);
        }
        fieldset.append(fields);
        tasks.append(fieldset);
    });
    updateProgress();
    document.getElementById('exam-title').focus();
}

form.addEventListener('input', updateProgress);
form.addEventListener('change', updateProgress);
// Enter in a text field moves to the next answer instead of accidentally handing in the test.
form.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.target.tagName !== 'INPUT') return;
    event.preventDefault();
    const inputs = [...controls.values()].map(control => control.input);
    const next = inputs[inputs.indexOf(event.target) + 1];
    (next || form.querySelector('button[type="submit"]')).focus();
});
form.addEventListener('submit', event => {
    event.preventDefault();
    if (submitted || !currentSet) return;
    submitted = true;
    const answers = Object.fromEntries([...controls].map(([id, { input }]) => [id, input.value]));
    const result = UOExam.evaluate(currentSet, answers);
    results.set(currentSet.id, result);
    for (const section of result.sections) {
        const suggested = new Map();
        for (const field of section.fields.filter(field => field.correct && field.group)) {
            if (!suggested.has(field.group)) suggested.set(field.group, new Set());
            suggested.get(field.group).add(field.picked.trim().toLocaleLowerCase('pl').replace(/^[−–—-]+/, '').replace(/[.,;!?]+$/, '').trim());
        }
        for (const field of section.fields) {
            const { input, wrapper, feedback } = controls.get(field.id);
            input.disabled = true;
            wrapper.classList.add(field.correct ? 'is-correct' : 'is-wrong');
            input.setAttribute('aria-invalid', String(!field.correct));
            const used = suggested.get(field.group) || new Set();
            const correction = field.answers.find(answer => !used.has(answer)) || field.answers[0];
            if (!field.correct && field.group) {
                used.add(correction);
                suggested.set(field.group, used);
            }
            feedback.textContent = field.correct ? '✓ Poprawnie · 1 pkt' :
                `${field.duplicate ? '✗ Powtórzona odpowiedź' : field.picked ? '✗ Błędna odpowiedź' : '— Brak odpowiedzi'} · 0 pkt. ${field.kind === 'letter' ? 'Poprawnie' : 'Przykładowa poprawna odpowiedź'}: ${field.kind === 'letter' ? field.label.replace('_', correction) : correction}.`;
            feedback.hidden = false;
        }
    }
    form.querySelector('button[type="submit"]').hidden = true;
    document.getElementById('result-title').textContent = `${currentSet.name} — wynik: ${result.score}/30 pkt`;
    document.getElementById('grade').textContent = `Ocena ${result.grade.value} — ${result.grade.name}`;
    const breakdown = document.getElementById('breakdown');
    breakdown.replaceChildren(...result.sections.map((section, i) => node('li', `Zadanie ${i + 1}: ${section.score}/${section.max} pkt`)));
    resultPanel.hidden = false;
    document.getElementById('result-title').focus();
});

document.getElementById('choose-set').addEventListener('click', () => {
    exam.hidden = true;
    resultPanel.hidden = true;
    picker.hidden = false;
    renderSets();
    document.getElementById('picker-title').focus();
});
renderSets();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
