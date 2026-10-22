const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tasks, createQuiz, additionSteps } = require('../sprytne-odejmowanie-quiz.js');

test('moduł obejmuje sposoby z książki, poziomy A–E i Mistrz', () => {
    assert.ok(tasks.length >= 100);
    assert.equal(new Set(tasks.map(t => t.prompt)).size, tasks.length);
    for (const category of ['Poziom A','Poziom B','Poziom C','Poziom D','Poziom E','Mistrz','Powiększanie obu liczb','Dopełnianie','Wydawanie reszty','Zadania tekstowe','Lata i daty','Zagadki']) {
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

test('wyniki działań są poprawne, dopełnianie sumuje się do różnicy', () => {
    for (const t of tasks.filter(t => t.calculation)) {
        const { a,b } = t.calculation;
        assert.equal(Number(t.answer.replaceAll(' ','')) + b, a);
        const steps = additionSteps(b,a);
        let current = b;
        for (const step of steps) {
            assert.equal(step.from, current);
            assert.ok(step.amount > 0);
            assert.equal(step.to, step.from + step.amount);
            current = step.to;
        }
        assert.equal(current,a);
        assert.equal(steps.reduce((s,step) => s+step.amount,0),a-b);
    }
    assert.deepEqual(additionSteps(37,54), [{from:37,to:40,amount:3},{from:40,to:50,amount:10},{from:50,to:54,amount:4}]);
    assert.deepEqual(additionSteps(194,542), [{from:194,to:200,amount:6},{from:200,to:500,amount:300},{from:500,to:542,amount:42}]);
});

test('powiększanie zachowuje różnicę i ma tylko jedną prawidłową opcję', () => {
    for (const t of tasks.filter(t => t.shift)) {
        const { a,b,amount } = t.shift;
        const valid = t.choices.filter(option => {
            const [x,y] = option.match(/\d+/g).map(Number);
            return x-y === a-b;
        });
        assert.deepEqual(valid,[t.answer]);
        const [x,y] = t.answer.match(/\d+/g).map(Number);
        assert.equal(x-a,amount);
        assert.equal(y-b,amount);
    }
});

test('zadania tekstowe, reszta, daty i zagadki mają poprawne odpowiedzi', () => {
    for (const [fragment,expected] of [['Marysia ma o 15 mniej','58'],['Żyrafy','55'],['Żubr','35'],['Na wycieczkę zebrano','53'],['Ola ma 121','38'],['Kamil ma 37','17'],['ma 175 klocków','57'],['zwycięzcy','Andrzej, o 5 punktów'],['Jan Kazimierz urodził się w 1609','63'],['abdykował','1 668'],['Do 2026 roku od 1885','141'],['Ile jest rozwiązań zagadki','8']]) {
        assert.equal(tasks.find(t => t.prompt.includes(fragment))?.answer,expected,fragment);
    }
    for (const t of tasks.filter(t => t.change)) {
        assert.equal(Number(t.answer.replaceAll(' ','')) + t.change.price, t.change.paid);
    }
});

test('historia i liczniki: błędu nie oceniamy dwa razy, dobra odpowiedź przechodzi dalej', () => {
    const quiz = createQuiz(tasks.slice(0,2), false);
    quiz.submit();
    assert.equal(quiz.history.length,0);
    quiz.choose(quiz.current.choices.find(c => c !== quiz.current.answer));
    quiz.submit(); quiz.submit();
    assert.equal(quiz.incorrect,1);
    assert.equal(quiz.phase,'explanation');
    quiz.next();
    for (let i=0;i<5;i++) { quiz.choose(quiz.current.answer); quiz.submit(); }
    assert.equal(quiz.correct,5);
    assert.equal(quiz.history.length,6);
});

test('strona modułu 6 ładuje właściwą bazę, zapisuje historię i ma zasoby offline', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const read = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');
    const html = read('dzial-2-sprytne-odejmowanie.html');
    const scripts = [...html.matchAll(/<script src="([^"]+)" defer/g)].map(m => m[1]);
    assert.deepEqual(scripts,['zapis-liczb-quiz.js','sprytne-odejmowanie-quiz.js','zapis-liczb.js']);
    const elements = {};
    const element = () => ({
        hidden:false, disabled:false, textContent:'', children:[], events:{}, attributes:{},
        classList:{ toggle() {}, add() {}, remove() {} },
        append(...items) { this.children.push(...items); },
        replaceChildren() { this.children=[]; },
        setAttribute(key,value) { this.attributes[key]=value; },
        addEventListener(name,handler) { this.events[name]=handler; },
        click() { if (!this.disabled) this.events.click(); },
        focus(options) { this.focusOptions=options; },
        showModal() { this.open=true; }, close() { this.open=false; this.events.close(); }
    });
    for (const [,id] of html.matchAll(/id="([^"]+)"/g)) elements[id]=element();
    const context = vm.createContext({ document:{ getElementById:id=>elements[id], createElement:element, body:element() }, navigator:{} });
    for (const script of scripts) vm.runInContext(read(script),context);
    const quiz = vm.runInContext('quiz',context);
    const e = elements;
    assert.equal(quiz.tasks.length,tasks.length);
    assert.ok(tasks.some(t=>t.prompt===e.question.textContent));
    assert.equal(e['submit-answer'].disabled,true);
    const submit = () => e['quiz-form'].events.submit({ preventDefault() {} });
    e.choices.children.find(b=>b.textContent!==quiz.current.answer).click();
    submit(); submit();
    assert.equal(e['incorrect-count'].textContent,'1');
    assert.equal(e.explanation.hidden,false);
    assert.equal(e.rule.textContent,quiz.current.rule);
    assert.equal(e.explanation.focusOptions.preventScroll,true);
    e['next-question'].click();
    e.choices.children.find(b=>b.textContent===quiz.current.answer).click();
    submit();
    assert.equal(e['correct-count'].textContent,'1');
    e['show-history'].click();
    assert.equal(e['history-sheet'].open,true);
    assert.equal(e['history-list'].children.length,2);
    e['close-history'].click();
    e['show-mistakes'].click();
    assert.equal(e['history-list'].children.length,1);
    for (const [,file] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        assert.ok(fs.existsSync(path.join(__dirname,'..',file)));
        assert.ok(read('sw.js').includes(`'/${file}'`));
    }
    assert.ok(!html.includes('\ufffd'));
});
