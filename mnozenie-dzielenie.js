(function () {
    'use strict';
    const { TABLES, createPractice, taskById } = window.TimesTableQuiz;
    const storageKey = 'matma-kuba-times-tables-v1';
    const $ = id => document.getElementById(id);
    let saved;
    let storageAvailable = true;
    try { saved = localStorage.getItem(storageKey); }
    catch { storageAvailable = false; }
    const quiz = createPractice({ saved });
    const operationNames = { mixed: 'Mieszane', mul: 'Mnożenie', div: 'Dzielenie' };
    const practiceNames = { learn: 'Nauka', train: 'Trening', mistakes: 'Moje błędy' };

    function save() {
        try {
            localStorage.setItem(storageKey,JSON.stringify(quiz.snapshot()));
            storageAvailable = true;
        } catch { storageAvailable = false; }
        renderStorage();
    }

    function renderStorage() {
        $('storage-status').textContent = storageAvailable
            ? 'Postęp i błędy zapisują się na tym urządzeniu.'
            : 'Zapis na urządzeniu jest niedostępny. Możesz ćwiczyć, ale nowe wyniki znikną po zamknięciu strony.';
    }

    for (const table of TABLES) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'secondary-button';
        button.textContent = table;
        button.dataset.table = table;
        button.setAttribute('aria-label',`Tabliczka ${table}`);
        button.addEventListener('click', () => {
            const selected = quiz.settings.tables;
            const tables = selected.length === 10 ? [table] : selected.includes(table)
                ? selected.filter(n => n !== table) : [...selected,table];
            if (!tables.length) {
                $('selection-status').textContent = 'Wybierz przynajmniej jedną tabliczkę.';
                return;
            }
            configure({ tables });
        });
        $('table-choices').append(button);
    }

    function renderSettings() {
        const { operation,practice,tables } = quiz.settings;
        for (const name of ['operation','practice']) {
            for (const input of document.querySelectorAll(`input[name="${name}"]`)) {
                input.checked = input.value === quiz.settings[name];
            }
        }
        for (const button of $('table-choices').children) {
            button.setAttribute('aria-pressed',String(tables.includes(Number(button.dataset.table))));
        }
        $('all-tables').setAttribute('aria-pressed',String(tables.length === 10));
        const tableLabel = tables.length === 10 ? 'Wszystkie tabliczki' : `Tabliczki: ${tables.join(', ')}`;
        $('settings-summary').textContent = `Ustawienia · ${operationNames[operation]} · ${tableLabel}`;
        $('exercise-context').textContent = `${practiceNames[practice]} · ${operationNames[operation]} · ${tableLabel}`;
    }

    function renderProgress() {
        let mastered = 0, total = 0;
        const fragment = document.createDocumentFragment();
        for (const table of quiz.settings.tables) {
            const progress = quiz.progress(table);
            mastered += progress.mastered;
            total += progress.total;
            const row = document.createElement('div');
            row.className = 'progress-row';
            const label = document.createElement('div');
            label.className = 'progress-label';
            const title = document.createElement('strong');
            title.textContent = `Tabliczka ${table}`;
            const count = document.createElement('span');
            count.textContent = `${progress.mastered}/${progress.total} opanowanych`;
            label.append(title,count);
            const bar = document.createElement('progress');
            bar.max = progress.total;
            bar.value = progress.mastered;
            bar.setAttribute('aria-label',`Tabliczka ${table}: ${progress.mastered} z ${progress.total} opanowanych działań`);
            const detail = document.createElement('p');
            detail.textContent = `Poprawne: ${progress.correct} · Błędy: ${progress.wrong} · Do powtórki: ${progress.weak}`;
            row.append(label,bar,detail);
            fragment.append(row);
        }
        $('progress-list').replaceChildren(fragment);
        $('progress-summary').textContent = `Twój postęp · ${mastered}/${total} opanowanych działań`;
    }

    function render(message = '') {
        const error = quiz.phase === 'error';
        const empty = !quiz.current;
        renderSettings();
        $('answer-form').hidden = error || empty;
        $('explanation').hidden = !error;
        $('empty-state').hidden = !empty;
        $('exercise').classList.toggle('has-error',error);
        $('status').textContent = message;
        $('status').classList.remove('is-error');
        $('answer').value = '';
        $('answer').removeAttribute('aria-invalid');
        $('hint').hidden = true;
        $('show-hint').hidden = quiz.settings.practice !== 'learn';
        $('show-hint').setAttribute('aria-expanded','false');
        if (quiz.current) $('task').textContent = quiz.current.prompt;
        $('correct-count').textContent = quiz.correct;
        $('incorrect-count').textContent = quiz.incorrect;
        renderProgress();
    }

    function configure(changes) {
        quiz.configure(changes);
        $('selection-status').textContent = '';
        render();
        save();
    }

    $('settings').open = window.matchMedia('(min-width: 701px)').matches;
    for (const name of ['operation','practice']) {
        for (const input of document.querySelectorAll(`input[name="${name}"]`)) {
            input.addEventListener('change', () => configure({ [name]: input.value }));
        }
    }
    $('all-tables').addEventListener('click', () => configure({ tables: TABLES }));
    $('start-training').addEventListener('click', () => {
        configure({ practice: 'train' });
        $('answer').focus({ preventScroll: true });
    });
    $('show-hint').addEventListener('click', () => {
        $('hint').textContent = quiz.hint();
        $('hint').hidden = false;
        $('show-hint').setAttribute('aria-expanded','true');
    });
    $('answer').addEventListener('keydown', event => {
        if (event.key === 'Enter' && event.repeat) event.preventDefault();
    });
    $('answer-form').addEventListener('submit', event => {
        event.preventDefault();
        const result = quiz.submit($('answer').value);
        if (!result.valid) {
            $('status').textContent = 'Wpisz całą liczbę, np. 24.';
            $('status').classList.add('is-error');
            $('answer').setAttribute('aria-invalid','true');
            $('answer').focus({ preventScroll: true });
            return;
        }
        render(result.correct ? `✓ Dobrze! ${result.task.equation}` : '');
        if (!result.correct) {
            $('wrong-answer').textContent = `Twoja odpowiedź: ${result.answer}. Poprawna: ${result.task.answer}.`;
            $('correction').textContent = result.task.equation;
            $('rule').textContent = result.task.explanation;
            $('next-task').focus({ preventScroll: true });
        } else {
            (quiz.current ? $('answer') : $('start-training')).focus({ preventScroll: true });
        }
        save();
    });
    $('next-task').addEventListener('click', () => {
        quiz.next();
        render();
        $('answer').focus({ preventScroll: true });
    });

    const sheet = $('mistakes-sheet');
    $('show-mistakes').addEventListener('click', () => {
        const fragment = document.createDocumentFragment();
        for (const entry of quiz.mistakes.slice().reverse()) {
            const task = taskById(entry.id);
            const li = document.createElement('li');
            const equation = document.createElement('strong');
            equation.textContent = task.equation;
            const answer = document.createElement('p');
            answer.className = 'mistake-answer';
            answer.textContent = `Pytanie: ${task.prompt} · Twoja odpowiedź: ${entry.answer}. Poprawna: ${task.answer}.`;
            const state = document.createElement('small');
            state.textContent = quiz.facts[task.fact]?.streak >= 3 ? '✓ Już opanowane' : 'Do powtórki w trybie „Moje błędy”';
            li.append(equation,answer,state);
            fragment.append(li);
        }
        $('mistakes-list').replaceChildren(fragment);
        $('mistakes-empty').hidden = quiz.mistakes.length > 0;
        sheet.showModal();
        document.body.classList.add('sheet-open');
        $('show-mistakes').setAttribute('aria-expanded','true');
    });
    $('close-mistakes').addEventListener('click', () => sheet.close());
    sheet.addEventListener('close', () => {
        document.body.classList.remove('sheet-open');
        $('show-mistakes').setAttribute('aria-expanded','false');
        $('show-mistakes').focus({ preventScroll: true });
    });
    sheet.addEventListener('click', event => {
        if (event.target !== sheet) return;
        const rect = sheet.getBoundingClientRect();
        if (event.clientY < rect.top || event.clientX < rect.left || event.clientX > rect.right) sheet.close();
    });
    render();
    renderStorage();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
