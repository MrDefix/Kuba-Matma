(function (root) {
    'use strict';
    const units = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
    const teens = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
    const tens = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
    const hundreds = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];
    const scales = [null, ['tysiąc', 'tysiące', 'tysięcy'], ['milion', 'miliony', 'milionów'], ['miliard', 'miliardy', 'miliardów'], ['bilion', 'biliony', 'bilionów']];
    const format = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    function toWords(number) {
        if (number === 0) return 'zero';
        const parts = [];
        for (let i = 0; number > 0; i++, number = Math.floor(number / 1000)) {
            const n = number % 1000;
            if (!n) continue;
            const rest = n % 100;
            let words = [hundreds[Math.floor(n / 100)], rest < 20 && rest >= 10 ? teens[rest - 10] : [tens[Math.floor(rest / 10)], units[rest % 10]].filter(Boolean).join(' ')].filter(Boolean).join(' ');
            if (i) {
                const form = n === 1 ? 0 : (n % 10 >= 2 && n % 10 <= 4 && !(rest >= 12 && rest <= 14) ? 1 : 2);
                words = (n === 1 ? '' : words + ' ') + scales[i][form];
            }
            parts.unshift(words);
        }
        return parts.join(' ');
    }
    const tasks = [];
    function add(category, prompt, answer, distractors, rule) {
        answer = String(answer);
        const choices = [...new Set([answer, ...distractors.map(String)])].slice(0, 4);
        if (choices.length !== 4) throw new Error('Niepełne odpowiedzi: ' + prompt);
        tasks.push({ category, prompt, answer, choices, rule });
    }
    const numbers = [0, 48, 109, 357, 803, 1000, 4809, 12845, 34173, 42382, 50080, 60012, 153876, 250303, 300207, 920030, 1302037, 2506021, 4200200, 5000300, 5083705, 7125630, 8240036, 12358249, 50000090, 80000005, 111818500, 200000070, 420058303, 525032708, 600000002, 18500000000, 400000040004, 1003080000000, 2000000000003];
    for (const n of numbers) {
        add('Zapis cyframi', `Zapisz cyframi: ${toWords(n)}.`, format(n), [format(n + 10), format(n + 100), format(n + 1000)],
            `Poprawny zapis to ${format(n)}. Oddzielamy grupy po trzy cyfry od prawej: jedności, tysiące, miliony, miliardy, biliony. Zera zachowują puste miejsca.`);
        add('Odczytywanie liczb', `Jak odczytujemy liczbę ${format(n)}?`, toWords(n), [toWords(n + 10), toWords(n + 100), toWords(n + 1000)],
            `${format(n)} czytamy: ${toWords(n)}. Czytaj grupami po trzy cyfry; grup złożonych z samych zer nie wymawiamy.`);
    }
    for (const n of [357, 853, 725, 572, 257, 172, 527, 720, 2541, 7436, 3030, 3526]) {
        for (const [power, name] of [[0, 'jedności'], [1, 'dziesiątek'], [2, 'setek']]) {
            const digit = Math.floor(n / 10 ** power) % 10;
            add('Cyfry i ich pozycje', `Jaka jest cyfra ${name} w liczbie ${format(n)}?`, digit, [(digit + 1) % 10, (digit + 3) % 10, (digit + 7) % 10],
                `Licząc od prawej: jedności, dziesiątki, setki. Cyfra ${name} to ${digit}; oznacza ${digit} × ${format(10 ** power)} = ${format(digit * 10 ** power)}.`);
        }
    }
    for (const [n, power, name] of [[1161111, 4, 'dziesiątek tysięcy'], [525032708, 6, 'milionów'], [12358249, 5, 'setek tysięcy'], [80000005, 3, 'tysięcy']]) {
        const digit = Math.floor(n / 10 ** power) % 10;
        add('Cyfry i ich pozycje', `Wskaż cyfrę ${name} w liczbie ${format(n)}.`, digit, [(digit + 1) % 10, (digit + 2) % 10, (digit + 5) % 10], `Pozycja ${name} jest ${power + 1}. miejscem od prawej. Znajduje się tam cyfra ${digit}.`);
    }
    for (const [h, t, u] of [[5, 7, 9], [8, 0, 3], [2, 4, 6], [3, 5, 7], [6, 0, 8], [4, 9, 0], [7, 2, 5], [9, 1, 4]]) {
        const n = 100 * h + 10 * t + u;
        add('Pieniądze', `Masz ${h} banknotów po 100 zł, ${t} banknotów po 10 zł i ${u} monet po 1 zł. Ile to złotych?`, format(n), [format(n + 10), format(n + 100), format(n + 1)], `${h} × 100 + ${t} × 10 + ${u} × 1 = ${n} zł. Setki, dziesiątki i jedności mają różne wartości.`);
    }
    for (const n of [7309, 6198, 4079, 2409, 3005, 8020]) {
        const d = String(n).split('').map(Number);
        const decomposition = a => `${a[0]} × 1000 + ${a[1]} × 100 + ${a[2]} × 10 + ${a[3]} × 1`;
        add('Rozkład liczby', `Który zapis przedstawia liczbę ${format(n)}?`, decomposition(d), [decomposition([d[1], d[0], d[2], d[3]]), decomposition([d[0], d[1], d[3], d[2]]), decomposition([d[0], d[1], (d[2] + 1) % 10, d[3]])], `Każdą cyfrę mnożymy przez wartość jej pozycji: ${decomposition(d)} = ${format(n)}. Także zero ma swoje miejsce.`);
    }
    for (const [a, b] of [[17, 13], [452, 1111], [999, 1000], [39, 81], [704, 256], [50080, 50800], [300207, 302007], [1000000, 999999], [525032708, 525023708]]) {
        add('Porównywanie', `Który zapis poprawnie porównuje ${format(a)} i ${format(b)}?`, `${format(a)} ${a < b ? '<' : '>'} ${format(b)}`, [`${format(a)} ${a < b ? '>' : '<'} ${format(b)}`, `${format(a)} = ${format(b)}`, 'Nie można porównać tych liczb'], `Najpierw porównaj liczbę cyfr, następnie cyfry od lewej. ${format(Math.max(a, b))} jest większe od ${format(Math.min(a, b))}. Znak jest otwarty w stronę większej liczby.`);
    }
    for (const list of [[118, 98, 203, 302], [1001, 1100, 1010, 1000], [50080, 50800, 50008, 58000], [720, 725, 527, 572]]) {
        const sorted = list.slice().sort((a, b) => a - b);
        const join = a => a.map(format).join(' < ');
        add('Porządkowanie', `Ustaw od najmniejszej: ${list.map(format).join(', ')}.`, join(sorted), [join(sorted.slice().reverse()), join([sorted[1], sorted[0], sorted[2], sorted[3]]), join([sorted[0], sorted[2], sorted[1], sorted[3]])], `Zacznij od najmniejszej liczby i porównuj kolejne. Poprawny porządek: ${join(sorted)}.`);
    }
    for (const [prompt, answer, others, rule] of [
        ['Jaka jest największa liczba trzycyfrowa?', '999', ['1000', '990', '900'], 'Liczba trzycyfrowa ma trzy miejsca. Na każdym wybieramy największą cyfrę: 9.'],
        ['Jaka jest najmniejsza liczba trzycyfrowa?', '100', ['0', '111', '99'], 'Pierwsza cyfra nie może być zerem. Najmniejsza to 1, a kolejne mogą być zerami.'],
        ['Największa liczba trzycyfrowa o różnych cyfrach to…', '987', ['999', '989', '986'], 'Wybieramy największe różne cyfry: 9, potem 8, potem 7.'],
        ['Najmniejsza liczba trzycyfrowa o różnych cyfrach to…', '102', ['100', '101', '123'], 'Pierwsza cyfra to 1, potem najmniejsza niewykorzystana 0, a następnie 2.'],
        ['Największa liczba czterocyfrowa o różnych cyfrach to…', '9876', ['9999', '9877', '9875'], 'Wybieramy kolejno największe dostępne różne cyfry: 9, 8, 7, 6.'],
        ['Który zestaw zawiera wyłącznie liczby naturalne?', '0, 1, 2, 3', ['−1, 0, 1, 2', '0, 1/2, 1, 2', '1, 2, 3, 4,5'], 'Liczby naturalne to 0, 1, 2, 3 i kolejne całkowite liczby dodatnie. Ułamki i liczby ujemne do nich nie należą.'],
        ['Ile liczb trzycyfrowych ułożysz z cyfr 4, 6, 7, używając każdej raz?', '6', ['3', '9', '12'], 'Pierwszą cyfrę wybierasz na 3 sposoby, drugą na 2, ostatnią na 1: 3 × 2 × 1 = 6.'],
        ['Ile liczb trzycyfrowych ma dokładnie dwa zera?', '9', ['10', '18', '90'], 'To 100, 200, …, 900. Cyfra setek może przyjąć 9 wartości; pozostałe dwie to zera.'],
        ['Ile liczb trzycyfrowych ma jedno zero i dwie jednakowe niezerowe cyfry?', '18', ['9', '27', '81'], 'Wybierasz jedną z 9 niezerowych cyfr. Zero jest na miejscu dziesiątek lub jedności: 9 × 2 = 18.'],
        ['Która liczba ma cyfrę tysięcy równą cyfrze dziesiątek?', '3030', ['2541', '7436', '3526'], 'W 3030 cyfrą tysięcy jest 3 i cyfrą dziesiątek też jest 3.'],
        ['Która liczba ma cyfrę dziesiątek o 3 większą od cyfry jedności?', '963', ['258', '3526', '215'], 'W 963 cyfra dziesiątek to 6, a jedności 3. Różnica wynosi 6 − 3 = 3.'],
        ['Cyfra dziesiątek to 5, jedności jest o 4 większa, a setek o 2 mniejsza od jedności. Jaka to liczba?', '759', ['957', '579', '795'], 'Dziesiątki: 5. Jedności: 5 + 4 = 9. Setki: 9 − 2 = 7. Zapisujemy 759.'],
        ['Czterocyfrowa liczba ma trzy siódemki. Tysiące i dziesiątki są równe, a setek jest o 1 więcej niż tysięcy. Jaka to liczba?', '7877', ['7778', '8777', '7787'], 'Tysiące i dziesiątki to 7, setki to 8, a ostatnia siódemka jest cyfrą jedności.'],
        ['Ile liczb dwucyfrowych ma cyfrę jedności o 2 mniejszą od cyfry dziesiątek?', '8', ['7', '9', '10'], 'To 20, 31, 42, 53, 64, 75, 86, 97. Cyfra dziesiątek przyjmuje wartości od 2 do 9.'],
        ['Ile cyfr potrzeba do ponumerowania stron od 1 do 64?', '119', ['64', '128', '118'], 'Strony 1–9 wymagają 9 cyfr. Strony 10–64 to 55 numerów po dwie cyfry: 9 + 55 × 2 = 119.'],
        ['Ile razy zapiszesz cyfrę 1, numerując strony od 1 do 64?', '17', ['16', '10', '7'], 'Na miejscu dziesiątek: 10 razy (10–19). Na miejscu jedności: 7 razy (1, 11, 21, 31, 41, 51, 61). Razem 17; w 11 liczymy obie jedynki.'],
        ['Ile razy zapiszesz cyfrę 0, numerując strony od 1 do 64?', '6', ['7', '5', '10'], 'Zero występuje w numerach 10, 20, 30, 40, 50 i 60. Razem 6 razy.'],
        ['Jakie cyfry mogą zastąpić oba serca: 228 < 2♥♥ < 253?', '3 lub 4', ['2 lub 3', '4 lub 5', '1 lub 2'], 'Jednakowe serca to jednakowe cyfry. Warunek spełniają 233 i 244; 222 jest za małe, a 255 za duże.'],
        ['Jakie cyfry mogą zastąpić oba symbole: 7♠ < ♠6?', '8 lub 9', ['6 lub 7', '7 lub 8', 'Tylko 7'], 'Sprawdzamy 78 < 86 oraz 79 < 96. Dla cyfry 7 otrzymujemy 77 < 76, czyli fałsz.']
    ]) add('Własności i zagadki', prompt, answer, others, rule);

    function shuffle(list, previous) {
        const copy = list.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        if (copy.length > 1 && copy[0] === previous) copy.push(copy.shift());
        return copy;
    }
    function createQuiz(pool = tasks, randomize = true) {
        if (!pool.length) throw new Error('Brak zadań.');
        return {
            tasks: randomize ? shuffle(pool) : pool.slice(), index: 0, correct: 0, history: [], selected: null, phase: 'question',
            get current() { return this.tasks[this.index % this.tasks.length]; },
            get incorrect() { return this.history.length - this.correct; },
            choose(answer) {
                if (this.phase === 'question' && this.current.choices.includes(answer)) this.selected = answer;
            },
            submit() {
                if (this.phase !== 'question' || this.selected === null) return;
                const correct = this.selected === this.current.answer;
                const { prompt, answer, rule } = this.current;
                const entry = { prompt, answer, rule, picked: this.selected, correct };
                if (this.current.axis) entry.axis = this.current.axis;
                this.history.push(entry);
                if (correct) { this.correct++; this.advance(); }
                else this.phase = 'explanation';
                return correct ? 'correct' : 'incorrect';
            },
            next() { if (this.phase === 'explanation') this.advance(); },
            advance() {
                const previous = this.current;
                this.index++;
                if (randomize && this.index % this.tasks.length === 0) this.tasks = shuffle(this.tasks, previous);
                this.selected = null;
                this.phase = 'question';
            }
        };
    }
    const api = { tasks, createQuiz, toWords, shuffle };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.NumberQuiz = api;
})(globalThis);
