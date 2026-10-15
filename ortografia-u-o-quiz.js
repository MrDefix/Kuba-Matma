(function (root) {
    'use strict';

    const words = [];
    function add(pattern, answer, category, rule) {
        const [before, after] = pattern.split('_');
        words.push({ before, answer, after, category, rule });
    }

    // Każdy wyraz ma jedną główną kategorię, nawet gdy pasuje do kilku reguł.
    // Zasady: https://zpe.gov.pl/a/karta-zadan-interaktywnych/D12la1SGa
    // RJP: https://rjp.pan.pl/app/uploads/2026/03/Zalacznik-do-komunikatu-11-25-wersja-ostateczna-jednolita.pdf
    function exchange(letter, entries) {
        for (const [pattern, related] of entries) {
            const word = pattern.replace('_', 'ó');
            add(pattern, 'ó', `Ó wymienne na ${letter.toUpperCase()}`,
                `W wyrazie „${word}” piszemy „ó”, bo wymienia się na „${letter}”. Porównaj: ${word} – ${related}.`);
        }
    }

    // Ó wymienne na O: 40.
    exchange('o', [
        ['st_ł', 'stoły'], ['d_ł', 'doły'], ['w_z', 'wozy'], ['n_ż', 'noże'],
        ['l_d', 'lody'], ['mr_z', 'mrozy'], ['ogr_d', 'ogrody'], ['mi_d', 'miodowy'],
        ['s_l', 'solny'], ['r_g', 'rogi'], ['b_r', 'bory'], ['w_r', 'wory'],
        ['dw_r', 'dwory'], ['zbi_r', 'zbiory'], ['utw_r', 'utwory'], ['otw_r', 'otwory'],
        ['tw_r', 'twory'], ['potw_r', 'potwory'], ['b_br', 'bobry'], ['sok_ł', 'sokoły'],
        ['b_l', 'boleć'], ['m_wić', 'mowa'], ['gł_d', 'głodny'], ['chł_d', 'chłodny'],
        ['zaw_d', 'zawody'], ['nar_d', 'narody'], ['pow_d', 'powody'], ['samoch_d', 'samochody'],
        ['zach_d', 'zachody'], ['wsch_d', 'wschody'], ['ob_z', 'obozy'], ['pow_z', 'powozy'],
        ['przew_z', 'przewozy'], ['dow_z', 'dowozy'], ['sł_wko', 'słowo'], ['szk_łka', 'szkoła'],
        ['pszcz_łka', 'pszczoła'], ['ł_dka', 'łodzie'], ['k_zka', 'koza'], ['n_żka', 'noga']
    ]);

    // Ó wymienne na E: 20.
    exchange('e', [
        ['si_dmy', 'siedem'], ['sz_sty', 'sześć'], ['ni_sł', 'niesie'], ['wi_dł', 'wiedzie'],
        ['wi_zł', 'wiezie'], ['pi_ro', 'pierze'], ['zani_sł', 'zaniesie'], ['przyni_sł', 'przyniesie'],
        ['odni_sł', 'odniesie'], ['wyni_sł', 'wyniesie'], ['uni_sł', 'uniesie'], ['doni_sł', 'doniesie'],
        ['poni_sł', 'poniesie'], ['podni_sł', 'podniesie'], ['wni_sł', 'wniesie'], ['zni_sł', 'zniesie'],
        ['przeni_sł', 'przeniesie'], ['rozni_sł', 'rozniesie'], ['wzni_sł', 'wzniesie'], ['zmi_tł', 'zmiecie']
    ]);

    // Ó wymienne na A: 10.
    exchange('a', [
        ['wr_cić', 'wracać'], ['nawr_cić', 'nawracać'], ['zawr_cić', 'zawracać'],
        ['odwr_cić', 'odwracać'], ['powr_cić', 'powracać'], ['przywr_cić', 'przywracać'],
        ['przewr_cić', 'przewracać'], ['obr_cić', 'obracać'], ['skr_cić', 'skracać'],
        ['powt_rzyć', 'powtarzać']
    ]);

    // Ó w zakończeniach -ów, -ówka, -ówna: 35.
    for (const [suffix, patterns] of [
        ['-ów', [
            'Krak_w', 'dom_w', 'kot_w', 'chłopc_w', 'ps_w', 'las_w', 'kwiat_w',
            'krok_w', 'ptak_w', 'uczni_w', 'rower_w', 'telefon_w', 'zeszyt_w', 'koleg_w', 'długopis_w'
        ]],
        ['-ówka', [
            'lod_wka', 'klas_wka', 'poczt_wka', 'żar_wka', 'stoł_wka', 'mak_wka',
            'groch_wka', 'par_wka', 'kr_wka', 'ciężar_wka', 'osob_wka', 'zer_wka',
            'złot_wka', 'maj_wka', 'widok_wka', 'koszyk_wka', 'siatk_wka'
        ]],
        ['-ówna', ['Nowak_wna', 'Kowalczyk_wna', 'cesarz_wna']]
    ]) {
        for (const pattern of patterns) {
            add(pattern, 'ó', 'Ó w zakończeniach -ów, -ówka, -ówna',
                `W zakończeniu „${suffix}” piszemy „ó”. Zapamiętaj wyjątki z „u”: skuwka, zasuwka, wsuwka.`);
        }
    }

    // Ó na początku wyrazu: 10 (rodziny słów ósmy i ów).
    for (const pattern of [
        '_smy', '_semka', '_semkowy', '_smak', '_smoklasista',
        '_smoklasistka', '_w', '_wczesny', '_wcześnie', '_wdzie'
    ]) {
        add(pattern, 'ó', 'Ó na początku wyrazu',
            `Wyraz „${pattern.replace('_', 'ó')}” zaczyna się od „ó”. To wyjątek od zwykłej pisowni „u” na początku. Zapamiętaj rodziny wyrazów „ósmy” i „ów”.`);
    }

    // Ó niewymienne: 45.
    for (const pattern of [
        'g_ra', 'c_rka', 'kr_l', 'og_rek', 'r_ża', 'ż_łw', 'wr_bel', 'jask_łka', 'źr_dło',
        'pr_ba', 'r_żowy', 'kr_lik', 'kr_lewna', 'kr_lewski', 'kr_lowa', 'g_rnik', 'g_rski',
        'og_rkowy', 'r_żany', 'r_żnica', 'r_żny', 'ż_łty', 'ż_łtko', 'ż_łć', 'tch_rz',
        'wł_czka', 'wł_czyć', 'kł_tnia', 'kł_cić', 'pr_żny', 'pr_żnia', 'p_źny', 'p_źniej',
        'm_zg', 'sk_ra', 'ch_r', 'wiewi_rka', 's_jka', 'r_zga', 'r_żdżka', 'r_wny',
        'r_wnież', 'r_wnina', 'wł_kno', 'wr_żba'
    ]) {
        add(pattern, 'ó', 'Ó niewymienne – do zapamiętania',
            `Pisownię tego wyrazu trzeba zapamiętać: „${pattern.replace('_', 'ó')}” piszemy przez „ó” niewymienne.`);
    }

    // U w zakończeniach czasowników: 7 czasowników × 5 form = 35.
    for (const stem of ['mal', 'got', 'rys', 'prac', 'bud', 'kup', 'pak']) {
        for (const ending of ['ję', 'jesz', 'je', 'jemy', 'ją']) {
            add(`${stem}_${ending}`, 'u', 'U w zakończeniach czasowników',
                `W czasowniku „${stem}u${ending}” piszemy „u” w zakończeniu „-u${ending}”. Zapamiętaj: „-uje” się nie kreskuje!`);
        }
    }

    // U w zakończeniach rzeczowników: 30.
    for (const [suffix, patterns] of [
        ['-unek', [
            'rys_nek', 'rach_nek', 'podar_nek', 'pak_nek', 'rat_nek', 'pocał_nek',
            'opatr_nek', 'meld_nek', 'kier_nek', 'wizer_nek', 'gat_nek', 'ład_nek',
            'szac_nek', 'poczęst_nek', 'poster_nek', 'war_nek', 'stos_nek', 'ekwip_nek'
        ]],
        ['-unka', ['opiek_nka', 'piast_nka']],
        ['-un', ['opiek_n', 'zwiast_n']],
        ['-ulec', ['ham_lec', 'bud_lec']],
        ['-uszek', ['pal_szek', 'garn_szek', 'dzban_szek', 'kwiat_szek', 'star_szek']],
        ['-uszka', ['piel_szka']]
    ]) {
        for (const pattern of patterns) {
            add(pattern, 'u', 'U w zakończeniach rzeczowników',
                `W zakończeniu „${suffix}” rzeczowników piszemy „u”. Dlatego poprawnie piszemy „${pattern.replace('_', 'u')}”.`);
        }
    }

    // U na początku wyrazu: 25.
    for (const pattern of [
        '_lica', '_cho', '_czeń', '_branie', '_mowa', '_śmiech', '_rząd', '_rodziny',
        '_sta', '_l', '_waga', '_rlop', '_pał', '_czennica', '_czucie', '_roda',
        '_mysł', '_rok', '_miejętność', '_stawa', '_prawa', '_pominek', '_kład', '_rządzenie', '_sługa'
    ]) {
        add(pattern, 'u', 'U na początku wyrazu',
            'Na początku większości wyrazów piszemy „u”, np. ulica, ucho, uczeń. Wyjątki to m.in. ósmy, ósemka, ów i ówczesny.');
    }

    // U do zapamiętania: 40.
    for (const pattern of [
        'b_rza', 'chm_ra', 'k_ra', 'dzi_ra', 'c_kier', 'b_ty', 'ż_k', 'm_cha',
        'p_ch', 't_lipan', 'k_bek', 'p_stynia', 'b_telka', 'b_da', 'b_rak', 'ceb_la',
        'd_ch', 'd_ma', 'g_ma', 'h_lajnoga', 'h_śtawka', 'j_tro', 'kapt_r', 'kl_cz',
        'kog_t', 'kosz_la', 'kr_k', 'k_la', 'k_kurydza', 'k_ltura', 'l_stro', 'dł_g',
        'm_szla', 'n_ta', 'pap_ga', 'p_dełko', 'r_ra', 's_kienka', 's_fit', 't_sz'
    ]) {
        add(pattern, 'u', 'U niewymienne – do zapamiętania',
            `Pisownię tego wyrazu trzeba zapamiętać: „${pattern.replace('_', 'u')}” piszemy przez „u”.`);
    }

    // Wyjątki i pułapki: 4 wyrazy z -uwka oraz 6 z u na końcu = 10.
    for (const [pattern, related] of [
        ['sk_wka', 'skuwać'], ['zas_wka', 'zasuwać'],
        ['ws_wka', 'wsuwać'], ['przes_wka', 'przesuwać']
    ]) {
        add(pattern, 'u', 'Wyjątki i pułapki',
            `Uwaga na pułapkę! „${pattern.replace('_', 'u')}” piszemy przez „u”, a nie przez „ó” jak w zakończeniu „-ówka”. Ten wyraz pochodzi od „${related}”.`);
    }
    for (const pattern of ['dom_', 'kot_', 'brat_', 'rower_', 'telefon_', 'cukr_']) {
        add(pattern, 'u', 'Wyjątki i pułapki',
            `Na końcu wyrazu piszemy „u”. Dlatego poprawnie piszemy „${pattern.replace('_', 'u')}”. Litera „ó” nie występuje na końcu wyrazów.`);
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
