(function (root) {
    'use strict';
    const engine = typeof module !== 'undefined' && module.exports ? require('./zapis-liczb-quiz.js') : root.NumberQuiz;
    const tasks = [];
    function add(category, prompt, answer, wrong, rule, extra = {}) {
        answer = String(answer);
        const choices = [...new Set([answer, ...wrong.map(String)])].slice(0, 4);
        if (choices.length !== 4) throw new Error('Brak odpowiedzi: ' + prompt);
        tasks.push({ category, prompt, answer, choices, rule, ...extra });
    }
    function numeric(category, prompt, value, rule, extra = {}, step = 1) {
        add(category, prompt, value, [value + step, value + 2 * step, value > step ? value - step : value + 3 * step], rule, extra);
    }
    // Każda konfiguracja definiuje rzeczywistą skalę, a podpisy mogą być oddalone.
    const configs = [
        [0, 1, 0, 1], [0, 2, 0, 1], [0, 5, 0, 1], [0, 10, 0, 1],
        [0, 20, 0, 1], [20, 2, 0, 1], [70, 5, 0, 1], [80, 20, 0, 1],
        [20, 5, 5, 6], [10, 10, 6, 7], [200, 50, 6, 7],
        [0, 3, 0, 4], [0, 4, 0, 3], [0, 50, 0, 5], [0, 200, 0, 3],
        [9, 3, 2, 6], [37, 7, 2, 4], [20, 3, 2, 5], [120, 60, 4, 7]
    ];
    configs.forEach(([start, step, i, j], index) => {
        const axis = { start, step, count: 11, labels: { [i]: String(start + i * step), [j]: String(start + j * step) }, points: { A: 1, B: 4, C: 8 } };
        for (const target of ['A', 'B', 'C']) {
            const value = start + axis.points[target] * step;
            numeric('Odczytywanie punktów', `Jaka liczba jest pod literą ${target}?`, value,
                `Między podpisami ${axis.labels[i]} i ${axis.labels[j]} jest ${j - i} równych odstępów. Jeden oznacza (${axis.labels[j]} − ${axis.labels[i]}) : ${j - i} = ${step}. Punkt ${target} leży ${Math.abs(axis.points[target] - i)} odstępów ${axis.points[target] >= i ? 'w prawo' : 'w lewo'} od ${axis.labels[i]}, więc ${target} = ${value}.`,
                { axis, kind: 'read', target }, step);
        }
        numeric('Ustalanie skali', 'O ile rosną liczby między sąsiednimi kreskami?', step,
            `Różnicę podpisanych liczb dzielimy przez liczbę odstępów, nie kresek: (${axis.labels[j]} − ${axis.labels[i]}) : ${j - i} = ${step}.`, { axis, kind: 'scale' });
        const markAxis = { ...axis, points: { A: 2, B: 4, C: 6, D: 8 } };
        const letter = ['A', 'B', 'C', 'D'][index % 4];
        const target = start + markAxis.points[letter] * step;
        add('Zaznaczanie liczb', `Który punkt należy zaznaczyć, aby wskazać liczbę ${target}?`, letter, ['A', 'B', 'C', 'D'],
            `Na tej osi jeden odstęp oznacza ${step}. Liczbie ${target} odpowiada punkt ${letter}. Liczby rosną w prawo, zgodnie ze strzałką.`, { axis: markAxis, kind: 'mark', target });
    });
    for (const [start, step] of [[0, 2], [10, 10], [20, 10], [100, 20], [1000, 100], [40, 4]]) {
        const axis = { start, step, count: 6, labels: { 2: String(start + step * 2), 3: String(start + step * 3) }, points: { A: 2.5 } };
        const value = start + step * 2.5;
        numeric('Między kreskami', `Jaka liczba leży w punkcie A, w połowie między ${axis.labels[2]} i ${axis.labels[3]}?`, value,
            `Połowa odstępu to ${step} : 2 = ${step / 2}. Dodajemy ją do ${axis.labels[2]}: ${axis.labels[2]} + ${step / 2} = ${value}. Na osi można zaznaczać liczby także między kreskami.`, { axis, kind: 'read', target: 'A' });
    }
    for (const [start, step] of [[0, 1], [0, 2], [20, 5], [100, 10], [1000, 100], [70, 7]]) {
        const sequence = Array.from({ length: 4 }, (_, i) => start + i * step);
        numeric('Odliczanie', `Odliczaj od ${start} co ${step}: ${sequence.join(', ')}, … Jaka liczba będzie następna?`, start + 4 * step,
            `Za każdym razem dodajemy ${step}. Po ${sequence[3]} otrzymamy ${sequence[3]} + ${step} = ${start + 4 * step}.`, {}, step);
    }
    for (const [name, value, unit, step, vertical] of [
        ['masa puchacza', 2, 'kg', 1, false], ['masa bociana', 4, 'kg', 1, false],
        ['masa lisa', 10, 'kg', 2, false], ['masa wilka', 50, 'kg', 10, false],
        ['wysokość lisa', 40, 'cm', 10, true], ['wysokość puchacza', 60, 'cm', 10, true],
        ['wysokość wilka', 80, 'cm', 10, true], ['wysokość dzika', 100, 'cm', 20, true],
        ['długość autobusu', 12, 'm', 3, false], ['długość autobusu przegubowego', 18, 'm', 3, false],
        ['długość tramwaju', 27, 'm', 3, false], ['długość pociągu', 72, 'm', 9, false]
    ]) {
        const axis = { start: 0, step, count: 11, labels: { 0: '0', 2: String(2 * step), 10: String(10 * step) }, points: { A: value / step }, unit, vertical };
        numeric('Odczytywanie pomiarów', `Na rysunku ${name} jest oznaczona punktem A. Ile wynosi w ${unit}?`, value,
            `Jeden odstęp oznacza ${step} ${unit}. Punkt A znajduje się ${value / step} odstępów od zera: ${value / step} × ${step} = ${value} ${unit}. To dane z rysunku w zadaniu.`, { axis, kind: 'read', target: 'A' }, step);
    }
    for (const [prompt, answer, wrong, rule] of [
        ['W którą stronę rosną liczby na poziomej osi ze strzałką w prawo?', 'W prawo', ['W lewo', 'W obie strony jednocześnie', 'Liczby nie rosną'], 'Strzałka na osi pokazuje kierunek wzrostu liczb. W tych zadaniach jest skierowana w prawo.'],
        ['Jak rozmieścić kreski oznaczające liczby 0, 1, 2, 3?', 'W równych odstępach', ['Coraz bliżej siebie', 'W dowolnych odstępach', 'Coraz dalej od siebie'], 'Jednakowym różnicom liczb odpowiadają jednakowe odległości na osi.'],
        ['Czy widoczny fragment osi musi zawierać zero?', 'Nie, może zaczynać się np. od 100', ['Tak, zawsze', 'Tak, musi zawierać też 1', 'Nie, ale musi zawierać 10'], 'Możemy pokazać tylko fragment osi, np. liczby 100, 101, 102, 103. Skala nadal musi być jednoznaczna.'],
        ['Podpisano tylko 0 i 12. Między nimi są 4 równe odstępy. Ile oznacza jeden odstęp?', '3', ['4', '12', '48'], 'Dzielimy różnicę wartości przez liczbę odstępów: 12 : 4 = 3.'],
        ['Na osi podpisano 0, 2, 4, 6. Gdzie można zaznaczyć 1?', 'W połowie między 0 i 2', ['Nie można jej zaznaczyć', 'Na kresce z liczbą 2', 'Na lewo od 0'], 'Brak kreski lub podpisu nie oznacza braku liczby. Jedynka leży w połowie między 0 i 2.'],
        ['Który przedmiot ma podziałkę przypominającą oś liczbową?', 'Linijka', ['Piłka', 'Talerz', 'Kostka do gry'], 'Linijka ma liczby i równą podziałkę. Zwykle brakuje jej strzałki wskazującej kierunek wzrostu.'],
        ['Co jest potrzebne, aby ustalić skalę osi z równymi kreskami?', 'Co najmniej dwa podpisy przy różnych kreskach', ['Tylko jedna litera', 'Sam kolor osi', 'Tylko jedna kreska bez podpisu'], 'Dwa podpisy i liczba odstępów między nimi pozwalają obliczyć wartość pojedynczego odstępu.'],
        ['Od 0 do 1 są 4 kratki. Ile kratek jest od 0 do 3?', '12', ['3', '4', '7'], 'Każda jednostka zajmuje 4 kratki. Trzy jednostki to 3 × 4 = 12 kratek.']
    ]) add('Zasady osi liczbowej', prompt, answer, wrong, rule);

    const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    function renderAxis(axis) {
        const { count, labels, points, vertical = false, unit = '' } = axis;
        const x = i => 40 + i * 44;
        const y = i => 290 - i * 24;
        const width = vertical ? 200 : x(count - 1) + 44;
        const description = `Oś liczbowa${vertical ? ' pionowa, liczby rosną w górę' : ', liczby rosną w prawo'}. Podpisane kreski: ${Object.entries(labels).map(([i, value]) => `${Number(i) + 1}. od ${vertical ? 'dołu' : 'lewej'}: ${value}`).join('; ')}. Punkty: ${Object.entries(points).map(([name, i]) => `${name}: ${i + 1}. pozycja od ${vertical ? 'dołu' : 'lewej'}${i % 1 ? ' (między kreskami)' : ''}`).join('; ')}.${unit ? ` Jednostka: ${unit}.` : ''}`;
        let content = vertical
            ? '<path d="M 90 304 V 24 M 84 34 L 90 24 L 96 34"/>'
            : `<path d="M 24 70 H ${width - 12} M ${width - 22} 64 L ${width - 12} 70 L ${width - 22} 76"/>`;
        for (let i = 0; i < count; i++) {
            content += vertical ? `<path d="M 84 ${y(i)} H 96"/>` : `<path d="M ${x(i)} 64 V 76"/>`;
            if (Object.hasOwn(labels, i)) content += vertical
                ? `<text x="74" y="${y(i) + 5}" text-anchor="end">${escape(labels[i])}</text>`
                : `<text x="${x(i)}" y="100" text-anchor="middle">${escape(labels[i])}</text>`;
        }
        for (const [letter, i] of Object.entries(points)) content += vertical
            ? `<circle cx="90" cy="${y(i)}" r="5"/><text class="axis-point" x="110" y="${y(i) + 5}">${escape(letter)}</text>`
            : `<circle cx="${x(i)}" cy="70" r="5"/><text class="axis-point" x="${x(i)}" y="48" text-anchor="middle">${escape(letter)}</text>`;
        if (unit) content += `<text x="${vertical ? 100 : width - 28}" y="${vertical ? 18 : 126}" text-anchor="middle">${escape(unit)}</text>`;
        return `<svg xmlns="http://www.w3.org/2000/svg" class="number-axis${vertical ? ' vertical-axis' : ''}" viewBox="0 0 ${width} ${vertical ? 320 : 140}" role="img"><title>${escape(description)}</title>${content}</svg>`;
    }
    const api = { tasks, renderAxis, createQuiz: (pool = tasks, randomize = true) => engine.createQuiz(pool, randomize) };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.NumberLineQuiz = api;
})(globalThis);
