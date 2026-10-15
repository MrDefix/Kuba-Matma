(function (root) {
    'use strict';

    const words = [];
    function add(pattern, answer, rule) {
        const [before, after] = pattern.split('_');
        words.push({ before, answer, after, rule });
    }

    for (const [pattern, pair] of [
        ['st_ł', 'stół – stoły'], ['d_ł', 'dół – doły'], ['w_z', 'wóz – wozy'],
        ['si_dmy', 'siódmy – siedem'], ['sz_sty', 'szósty – sześć'],
        ['ni_sł', 'niósł – niesie'], ['wr_cić', 'wrócić – wracać'],
        ['skr_cić', 'skrócić – skracać']
    ]) add(pattern, 'ó', `Piszemy „ó”, gdy w innym wyrazie lub innej formie wymienia się na „o”, „e” lub „a”. Porównaj: ${pair}.`);

    for (const pattern of ['Krak_w', 'dom_w', 'kot_w', 'chłopc_w', 'lod_wka', 'klas_wka', 'poczt_wka', 'żar_wka', 'Nowak_wna']) {
        add(pattern, 'ó', 'W zakończeniach „-ów”, „-ówka” i „-ówna” piszemy „ó”. Uwaga: skuwka, zasuwka i wsuwka mają „u”.');
    }
    for (const pattern of ['sk_wka', 'zas_wka', 'ws_wka']) {
        add(pattern, 'u', 'Zapamiętaj: skuwka, zasuwka i wsuwka. Te wyrazy piszemy przez „u”, mimo że brzmią podobnie do wyrazów zakończonych na „-ówka”.');
    }
    for (const pattern of ['_semka', '_smy', '_wczesny', '_wdzie']) {
        add(pattern, 'ó', 'Na początku wyrazów zwykle piszemy „u”, ale są wyjątki. Zapamiętaj: ósmy, ósemka, ów, ówczesny, ówdzie.');
    }
    for (const pattern of ['g_ra', 'c_rka', 'kr_l', 'og_rek', 'r_ża', 'ż_łw', 'wr_bel', 'jask_łka', 'źr_dło', 'pr_ba', 'r_żowy']) {
        add(pattern, 'ó', `Pisownię tego wyrazu trzeba zapamiętać: „${pattern.replace('_', 'ó')}” piszemy przez „ó” niewymienne.`);
    }
    for (const pattern of ['_lica', '_cho', '_czeń', '_branie', '_mowa', '_śmiech', '_rząd', '_rodziny']) {
        add(pattern, 'u', 'Na początku większości wyrazów piszemy „u”, np. ulica, ucho, uczeń. Wyjątki to m.in. ósmy, ósemka, ów i ówczesny.');
    }
    for (const pattern of ['dom_', 'kot_', 'brat_', 'rower_', 'telefon_', 'cukr_']) {
        add(pattern, 'u', 'Na końcu wyrazu piszemy „u”. Zapamiętaj przykłady: domu, kotu, bratu.');
    }
    for (const pattern of ['mal_ję', 'got_jesz', 'rys_je', 'mal_ją', 'got_ję', 'rys_jesz']) {
        add(pattern, 'u', 'W czasownikach z zakończeniami „-uję”, „-ujesz”, „-uje”, „-ują” piszemy „u”. Zapamiętaj: „-uje” się nie kreskuje!');
    }
    for (const pattern of ['rys_nek', 'rach_nek', 'podar_nek', 'opiek_nka', 'piast_nka', 'ham_lec', 'opiek_n', 'zwiast_n']) {
        add(pattern, 'u', 'W zakończeniach „-unek”, „-unka”, „-ulec” i „-un” piszemy „u”, np. rysunek, opiekunka, hamulec, opiekun.');
    }
    for (const pattern of ['b_rza', 'chm_ra', 'k_ra', 'dzi_ra', 'c_kier', 'b_ty', 'ż_k', 'm_cha', 'p_ch', 't_lipan', 'k_bek', 'p_stynia']) {
        add(pattern, 'u', `Pisownię tego wyrazu trzeba zapamiętać: „${pattern.replace('_', 'u')}” piszemy przez „u”.`);
    }

    function shuffle(tasks, previous) {
        const shuffled = tasks.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        if (shuffled.length > 1 && shuffled[0] === previous) shuffled.push(shuffled.shift());
        return shuffled;
    }

    function createQuiz(tasks, randomize = false) {
        if (!tasks.length) throw new Error('Brak słów do ćwiczeń.');
        return {
            tasks: randomize ? shuffle(tasks) : tasks.slice(),
            index: 0,
            correct: 0,
            mistakes: [],
            selected: null,
            phase: 'question',
            get incorrect() { return this.mistakes.length; },
            get current() { return this.tasks[this.index % this.tasks.length]; },
            choose(letter) {
                if (this.phase === 'question' && ['u', 'ó'].includes(letter)) this.selected = letter;
            },
            submit() {
                if (this.phase !== 'question' || this.selected === null) return;
                if (this.selected !== this.current.answer) {
                    const word = this.current;
                    this.mistakes.push({
                        word: word.before + word.answer + word.after,
                        picked: this.selected,
                        answer: word.answer,
                        rule: word.rule
                    });
                    this.phase = 'explanation';
                    return 'incorrect';
                }
                this.correct++;
                this.advance();
                return 'correct';
            },
            next() {
                if (this.phase === 'explanation') this.advance();
            },
            advance() {
                const previous = this.current;
                this.index++;
                if (randomize && this.index % this.tasks.length === 0) this.tasks = shuffle(this.tasks, previous);
                this.selected = null;
                this.phase = 'question';
            }
        };
    }

    function createPractice() {
        return createQuiz(words, true);
    }

    const api = { words, createQuiz, createPractice };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.UOQuiz = api;
})(globalThis);
