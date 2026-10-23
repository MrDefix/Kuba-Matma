(function (root) {
    'use strict';

    // Układ 17 + 10 + 3 i progi ocen pochodzą z fotografii kartkówki.
    // Zasady: https://zpe.gov.pl/a/karta-zadan-interaktywnych/D12la1SGa
    const initialExceptions = ['ósmy', 'ósemka', 'ów', 'ówdzie', 'ówczesny', 'ówcześnie', 'ósmoklasista', 'ósmoklasistka'];
    const suffixes = ['uję', 'ujesz', 'uje', 'ujemy', 'ujecie', 'ują', 'un', 'unek', 'utki', 'uch', 'uchna', 'uchny', 'ula', 'ulek', 'uleńka', 'ulka', 'ulo', 'unia', 'usia', 'us', 'uszek', 'uszka', 'uszko', 'uś', 'uśki'];
    const exceptions = ['skuwka', 'zasuwka', 'wsuwka', 'zakuwka', 'okuwka', 'odkuwka', 'przesuwka'];
    const definitions = [
        { name: 'Zestaw 1', surname: 'Nowak', daughter: 'Nowakówna', ending: 'Kraków', end: 'domu', start: 'ulica',
            words: ['st_udnia', 'Piotr_usia', '_ulubiona', 'pod_uszka', 'rys_uję', 'mal_uję', 'kr_ótka', 'wędr_ówka', 'wr_óbel', 'wiewi_órka'] },
        { name: 'Zestaw 2', surname: 'Kowalczyk', daughter: 'Kowalczykówna', ending: 'klasówka', end: 'lasu', start: 'uwaga',
            words: ['ogr_ód', 'og_órek', 'c_ukier', 'ż_ółty', 'got_uję', 'rach_unek', 'kr_ól', 'zas_uwka', 'r_óża', '_ulica'] },
        { name: 'Zestaw 3', surname: 'Woźniak', daughter: 'Woźniakówna', ending: 'żarówka', end: 'stołu', start: 'usta',
            words: ['m_ózg', 'b_urza', 'sk_uwka', 'pi_órko', 'prac_uję', 'jask_ółka', 'mal_utki', 'z_upa', 'źr_ódło', 'miod_u'] },
        { name: 'Zestaw 4', surname: 'Mazur', daughter: 'Mazurówna', ending: 'Rzeszów', end: 'sklepu', start: 'ubranie',
            words: ['ws_uwka', 'mr_óz', 'kr_uk', 'c_órka', 'pak_uję', 'g_óra', 'opiek_un', 'p_udełko', 's_ól', '_ósmy'] },
        { name: 'Zestaw 5', surname: 'Baran', daughter: 'Baranówna', ending: 'lodówka', end: 'parku', start: 'uczeń',
            words: ['st_ół', 'n_óż', 'pi_óro', 'w_ujek', 'kog_ut', 'lod_ówka', 'bud_uję', 'ż_ółw', 'chm_ura', '_ósma'] },
        { name: 'Zestaw 6', surname: 'Kruk', daughter: 'Krukówna', ending: 'Tarnów', end: 'ogrodu', start: 'ucho',
            words: ['w_óz', 'd_ół', 'dł_ugopis', 'b_urak', 'kap_usta', 'gł_ówka', 'kup_uję', 'pł_ótno', 's_ukienka', '_ósemka'] },
        { name: 'Zestaw 7', surname: 'Lis', daughter: 'Lisówna', ending: 'stołówka', end: 'autobusu', start: 'upominek',
            words: ['l_ód', 'mi_ód', 'kr_ólik', 'k_ura', 'l_ustro', 'stoł_ówka', 'tańc_uje', 'ż_uraw', 'm_undur', 'wsch_ód'] },
        { name: 'Zestaw 8', surname: 'Zając', daughter: 'Zającówna', ending: 'Lwów', end: 'telefonu', start: 'urząd',
            words: ['r_óg', 'b_ór', 'wr_óżka', 'b_uty', 'ognisk_u', 'bib_uła', 'leśnicz_ówka', 'druk_uję', 'ob_óz', '_ucho'] },
        { name: 'Zestaw 9', surname: 'Krawczyk', daughter: 'Krawczykówna', ending: 'makówka', end: 'cukru', start: 'uśmiech',
            words: ['gł_ód', 'chł_ód', 'zbi_ór', 't_usz', 'b_ukiet', 'mak_ówka', 'dzięk_uję', 'p_ółka', 'k_ula', 'j_utro'] },
        { name: 'Zestaw 10', surname: 'Adamczyk', daughter: 'Adamczykówna', ending: 'taksówka', end: 'zeszytu', start: 'ulewa',
            words: ['nar_ód', 'powr_ót', 'pr_óba', 'f_utro', 'g_umka', 'taks_ówka', 'podr_óż', 'recyt_uję', 'm_uszla', 'r_ówny'] }
    ];

    function field(id, label, answers, group, kind = 'text') {
        return { id, label, answers, group, kind };
    }
    const sets = definitions.map((set, index) => {
        const words = set.words.map(pattern => {
            const [before, rest] = pattern.split('_');
            return { before, answer: rest[0], after: rest.slice(1) };
        });
        const rules = [
            ...Array.from({ length: 3 }, (_, i) => field(`ending${i}`, `Ó piszemy w zakończeniach — zakończenie ${i + 1}`, ['ów', 'ówka', 'ówna'], 'endings')),
            field('endingExample', `Przykład: wpisz poprawnie „${set.ending.replace('ó', '_')}” (cały wyraz)`, [set.ending]),
            field('daughter', 'Cząstka -ówna tworzy nazwiska (czyje?)', ['córek', 'córki', 'panien', 'niezamężnych córek']),
            field('surname', `Utwórz takie nazwisko od nazwiska ${set.surname}`, [set.daughter]),
            field('endExample', `U piszemy na końcu wyrazu, np. „${set.end.slice(0, -1)}_” (cały wyraz)`, [set.end]),
            field('startExample', `U piszemy na początku większości wyrazów, np. „_${set.start.slice(1)}” (cały wyraz)`, [set.start]),
            ...Array.from({ length: 5 }, (_, i) => field(`initial${i}`, `Wyjątek od pisania u na początku — wyraz ${i + 1}`, initialExceptions, 'initial')),
            ...Array.from({ length: 3 }, (_, i) => field(`suffix${i}`, `U piszemy w zakończeniach — zakończenie ${i + 1}`, suffixes, 'suffixes')),
            field('finalRule', 'U piszemy, gdy nie obowiązuje żadna zasada dotycząca pisowni… (wpisz literę)', ['ó'])
        ];
        return { id: index + 1, name: set.name, words, sections: [
            { title: 'Dokończ zasady pisowni', instruction: 'Uzupełnij zasady i przykłady. Zakończenia i wyjątki wpisuj w dowolnej kolejności, bez powtórzeń.', fields: rules },
            { title: 'Uzupełnij wyrazy literami u lub ó', instruction: 'Za każdą poprawną literę otrzymasz 1 punkt.', fields: words.map((word, i) => field(`word${i}`, `${word.before}_${word.after}`, [word.answer], undefined, 'letter')) },
            { title: 'Napisz trzy wyjątki', instruction: 'W zakończeniach -ów, -ówka, -ówna piszemy ó. Podaj trzy różne wyjątki od tej reguły (całe wyrazy).', fields: Array.from({ length: 3 }, (_, i) => field(`exception${i}`, `Wyjątek ${i + 1}`, exceptions, 'exceptions')) }
        ] };
    });

    function normalize(value) {
        return String(value ?? '').normalize('NFC').trim().toLocaleLowerCase('pl').replace(/^[−–—-]+/, '').replace(/[.,;!?]+$/, '').trim();
    }
    function grade(score) {
        const value = score >= 29 ? 6 : score >= 27 ? 5 : score >= 23 ? 4 : score >= 16 ? 3 : score >= 9 ? 2 : 1;
        return { value, name: ['niedostateczny', 'dopuszczający', 'dostateczny', 'dobry', 'bardzo dobry', 'celujący'][value - 1] };
    }
    function evaluate(set, answers) {
        const seen = new Map();
        const sections = set.sections.map(section => {
            const fields = section.fields.map(item => {
                const answer = normalize(answers[item.id]);
                const used = item.group ? (seen.get(item.group) || new Set()) : new Set();
                const duplicate = used.has(answer);
                const correct = item.answers.some(option => normalize(option) === answer) && !duplicate;
                if (correct && item.group) { used.add(answer); seen.set(item.group, used); }
                return { ...item, picked: String(answers[item.id] ?? ''), correct, duplicate };
            });
            return { title: section.title, fields, score: fields.filter(item => item.correct).length, max: fields.length };
        });
        const score = sections.reduce((sum, section) => sum + section.score, 0);
        return { sections, score, max: 30, grade: grade(score) };
    }
    const api = { sets, evaluate, grade };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.UOExam = api;
})(globalThis);
