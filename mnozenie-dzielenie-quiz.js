(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.TimesTableQuiz = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const TABLES = Array.from({ length: 10 }, (_, i) => i + 1);
    const defaults = { operation: 'mixed', practice: 'train', tables: TABLES };

    function settingsFor(value = {}) {
        const tables = Array.isArray(value.tables) ? TABLES.filter(n => value.tables.includes(n)) : TABLES.slice();
        return {
            operation: ['mul','div','mixed'].includes(value.operation) ? value.operation : 'mixed',
            practice: ['learn','train','mistakes'].includes(value.practice) ? value.practice : 'train',
            tables: tables.length ? tables : TABLES.slice()
        };
    }

    function makeTask(operation, a, b, gap) {
        const product = a * b;
        const values = operation === 'mul' ? [a,b,product] : [product,b,a];
        const symbol = operation === 'mul' ? '×' : '÷';
        const parts = values.map((value, i) => i === gap ? '?' : value);
        return {
            id: `${operation}:${a}:${b}:${gap}`, fact: `${operation}:${a}:${b}`,
            operation, a, b, gap, values, answer: values[gap],
            prompt: `${parts[0]} ${symbol} ${parts[1]} = ${parts[2]}`,
            equation: `${values[0]} ${symbol} ${values[1]} = ${values[2]}`,
            explanation: `${a} × ${b} = ${product}, więc ${product} ÷ ${b} = ${a}.`
        };
    }

    function buildTasks(options = defaults) {
        const settings = settingsFor(options);
        const operations = settings.operation === 'mixed' ? ['mul','div'] : [settings.operation];
        const gaps = settings.practice === 'learn' ? [2] : [2,0,1];
        return settings.tables.flatMap(b => TABLES.flatMap(a => operations.flatMap(op => gaps.map(gap => makeTask(op,a,b,gap)))));
    }

    const allTasks = new Map(buildTasks().map(task => [task.id,task]));
    const factKeys = new Set(Array.from(allTasks.values(), task => task.fact));
    const count = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;

    function restore(saved) {
        try {
            const data = typeof saved === 'string' ? JSON.parse(saved) : saved;
            if (!data || data.version !== 1) return {};
            const facts = {};
            for (const [key,value] of Object.entries(data.facts || {})) {
                if (!factKeys.has(key) || !value || typeof value !== 'object') continue;
                facts[key] = { correct: count(value.correct), wrong: count(value.wrong), streak: Math.min(3,count(value.streak)) };
            }
            const mistakes = (Array.isArray(data.mistakes) ? data.mistakes : []).filter(entry =>
                entry && allTasks.has(entry.id) && Number.isSafeInteger(entry.answer) && entry.answer >= 0
            ).map(entry => ({ id: entry.id, answer: entry.answer, at: count(entry.at) }));
            return { settings: settingsFor(data.settings || {}), facts, mistakes };
        } catch { return {}; }
    }

    function createPractice({ saved, random = Math.random } = {}) {
        const data = restore(saved);
        let settings = data.settings || settingsFor();
        const facts = data.facts || {};
        const mistakes = data.mistakes || [];
        const due = new Map();
        let answered = 0, cursor = 0, current = null, phase = 'question', hinted = false;
        let pool = buildTasks(settings);
        for (const [key,value] of Object.entries(facts)) {
            if (value.wrong && value.streak < 3) due.set(key,0);
        }
        const weak = task => facts[task.fact]?.wrong > 0 && facts[task.fact].streak < 3;
        function pick(items) { return items[Math.min(items.length - 1,Math.floor(random() * items.length))]; }

        function next() {
            const previous = current?.fact;
            let candidates = settings.practice === 'mistakes' ? pool.filter(weak) : pool;
            phase = 'question';
            hinted = false;
            if (!candidates.length) { current = null; return; }
            const ready = settings.practice === 'train' ? candidates.filter(t => due.has(t.fact) && due.get(t.fact) <= answered) : [];
            if (ready.length) {
                const oldest = Math.min(...ready.map(t => due.get(t.fact)));
                current = pick(ready.filter(t => due.get(t.fact) === oldest));
                due.set(current.fact, answered + 3);
            } else if (settings.practice === 'learn') {
                current = candidates[cursor++ % candidates.length];
            } else {
                const others = candidates.filter(t => t.fact !== previous);
                if (others.length) candidates = others;
                // Działania w kolejce wracają dopiero po trzech innych odpowiedziach.
                if (settings.practice === 'train') {
                    const notWaiting = candidates.filter(t => !due.has(t.fact));
                    if (notWaiting.length) candidates = notWaiting;
                }
                const weights = candidates.map(t => {
                    const f = facts[t.fact];
                    return !f ? 3 : f.streak >= 3 ? 1 : 4 + Math.min(f.wrong,5);
                });
                let value = random() * weights.reduce((sum,w) => sum+w,0);
                current = candidates[candidates.length - 1];
                for (let i = 0; i < candidates.length; i++) {
                    value -= weights[i];
                    if (value < 0) { current = candidates[i]; break; }
                }
            }
        }

        function submit(value) {
            if (!current || phase !== 'question') return { valid: false };
            const text = String(value).trim();
            if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text))) return { valid: false };
            const answer = Number(text);
            const task = current;
            const correct = answer === task.answer;
            const f = facts[task.fact] ||= { correct: 0, wrong: 0, streak: 0 };
            answered++;
            if (correct) {
                f.correct++;
                f.streak = hinted ? 0 : Math.min(3,f.streak+1);
                if (f.streak >= 3) due.delete(task.fact);
                else if (due.has(task.fact)) due.set(task.fact,answered+3);
                next();
            } else {
                f.wrong++;
                f.streak = 0;
                due.set(task.fact,answered+3);
                mistakes.push({ id: task.id, answer, at: Date.now() });
                phase = 'error';
            }
            return { valid: true, correct, task, answer };
        }

        next();
        return {
            get current() { return current; }, get phase() { return phase; },
            get settings() { return { ...settings, tables: settings.tables.slice() }; },
            get correct() { return Object.values(facts).reduce((n,f) => n+f.correct,0); },
            get incorrect() { return Object.values(facts).reduce((n,f) => n+f.wrong,0); },
            facts, mistakes, submit, next,
            reset() {
                for (const key of Object.keys(facts)) delete facts[key];
                mistakes.length = 0;
                due.clear();
                answered = 0;
                cursor = 0;
                current = null;
                next();
            },
            configure(changes) {
                settings = settingsFor({ ...settings, ...changes });
                pool = buildTasks(settings);
                cursor = 0;
                next();
            },
            hint() {
                if (!current || phase !== 'question') return '';
                hinted = true;
                if (current.gap !== 2) return 'Użyj związku mnożenia z dzieleniem. Brakujący czynnik znajdziesz, dzieląc iloczyn przez znany czynnik. Dzielną znajdziesz przez mnożenie.';
                if (current.operation === 'div') return `Pomyśl: ile razy ${current.b} mieści się w ${current.a * current.b}? Sprawdź przez mnożenie: ? × ${current.b} = ${current.a * current.b}.`;
                return `Dodaj ${current.a} razy liczbę ${current.b}: ${Array(current.a).fill(current.b).join(' + ')}.`;
            },
            progress(table) {
                const ops = settings.operation === 'mixed' ? ['mul','div'] : [settings.operation];
                const entries = TABLES.flatMap(a => ops.map(op => facts[`${op}:${a}:${table}`]));
                return {
                    total: entries.length, mastered: entries.filter(f => f?.streak >= 3).length,
                    correct: entries.reduce((n,f) => n+(f?.correct || 0),0),
                    wrong: entries.reduce((n,f) => n+(f?.wrong || 0),0),
                    weak: entries.filter(f => f?.wrong > 0 && f.streak < 3).length
                };
            },
            snapshot() { return { version: 1, settings, facts, mistakes }; }
        };
    }
    return { TABLES, buildTasks, createPractice, taskById: id => allTasks.get(id) };
});
