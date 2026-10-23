const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sets, grade, evaluate } = require('../ortografia-egzamin-data.js');

test('progi ocen odpowiadają kartce, włącznie z granicami', () => {
    const expected = Array(9).fill(1).concat(Array(7).fill(2), Array(7).fill(3), Array(4).fill(4), Array(2).fill(5), Array(2).fill(6));
    expected.forEach((value, score) => assert.equal(grade(score).value, value));
});

test('dziesięć różnych zestawów ma po 17 + 10 + 3 punktów', () => {
    assert.equal(sets.length, 10);
    assert.equal(new Set(sets.map(set => JSON.stringify(set.words))).size, 10);
    for (const set of sets) {
        const used = new Set();
        const perfect = Object.fromEntries(set.sections.flatMap(section => section.fields.map(field => {
            const answer = field.answers.find(answer => !field.group || !used.has(`${field.group}:${answer}`));
            used.add(`${field.group}:${answer}`);
            return [field.id, answer];
        })));
        assert.deepEqual(evaluate(set, perfect).sections.map(section => section.score), [17, 10, 3]);
        assert.equal(evaluate(set, perfect).score, 30);
        assert.equal(evaluate(set, {}).score, 0);
    }
});

test('kolejność wyjątków jest dowolna, powtórzenia nie dają punktów', () => {
    const set = sets[0];
    assert.equal(evaluate(set, { exception0: ' WSUWKA ', exception1: 'skuwka', exception2: 'zasuwka' }).score, 3);
    assert.equal(evaluate(set, { exception0: 'skuwka', exception1: 'skuwka', exception2: 'skuwka' }).score, 1);
    assert.equal(evaluate(set, { ending0: '-ówka', ending1: 'ów', ending2: 'ówna' }).score, 3);
    assert.equal(evaluate(set, { ending0: 'ów', ending1: 'ów', ending2: 'ów' }).score, 1);
});

test('liczy częściowe wyniki i nie akceptuje błędnej ortografii', () => {
    const result = evaluate(sets[0], { word0: 'u', word1: 'ó', exception0: 'skówka', finalRule: 'o' });
    assert.equal(result.score, 1);
    assert.equal(result.grade.value, 1);
    assert.equal(result.sections[1].score, 1);
});

test('nawigacja prowadzi do egzaminu, a wszystkie jego zasoby są w cache offline', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(read('ortografia.html'), /href="ortografia-u-o-menu.html"/);
    const menu = read('ortografia-u-o-menu.html');
    assert.match(menu, /href="ortografia-u-o.html"/);
    assert.match(menu, /href="ortografia-egzamin.html"/);
    assert.match(menu, /EGZAMIN/);
    const sw = read('sw.js');
    for (const file of ['ortografia-u-o-menu.html', 'ortografia-egzamin.html', 'ortografia-egzamin-data.js', 'ortografia-egzamin.js', 'ortografia-egzamin.css']) {
        assert.ok(sw.includes(`'/${file}'`), file);
    }
    const html = read('ortografia-egzamin.html');
    assert.ok(html.indexOf('ortografia-egzamin-data.js') < html.indexOf('ortografia-egzamin.js'));
});
