(function (root) {
    'use strict';
    const engine = typeof module !== 'undefined' && module.exports ? require('./zapis-liczb-quiz.js') : root.NumberQuiz;
    const tasks = [];
    const f = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const roundTo = (n, unit) => Math.floor((n + unit / 2) / unit) * unit;
    const names = { 10: 'dziesiątek', 100: 'setek', 1000: 'tysięcy', 10000: 'dziesiątek tysięcy' };
    function add(category, prompt, answer, wrong, rule, extra = {}) {
        const choices = [...new Set([String(answer), ...wrong.map(String)])].slice(0, 4);
        if (choices.length !== 4) throw new Error('Niepełne odpowiedzi: ' + prompt);
        tasks.push({ category, prompt, answer: String(answer), choices, rule, ...extra });
    }
    function numeric(category, prompt, result, unit, rule, extra = {}, decorate = f) {
        add(category, prompt, decorate(result), [result + unit, Math.max(0, result - unit), result + unit * 2, result + unit * 3, result + unit * 4].map(decorate), rule, extra);
    }
    for (const [unit, numbers] of [
        [10, [14,15,18,23,38,47,62,74,85,96,192,291]],
        [100, [149,150,186,221,234,291,295,387,463,498,514,516,517,579,684,758,875,999]],
        [1000, [1183,1718,1783,1927,2415,2456,2987,3058,5319,5836,6911,8921]],
        [10000, [9753,15741,21064,39643,47831,58960]]
    ]) {
        for (const number of numbers) {
            const rounded = roundTo(number, unit);
            numeric('Przybliżanie liczb', `Zaokrąglij ${f(number)} do najbliższych ${names[unit]}. Przy połowie wybierz większą liczbę.`, rounded, unit,
                `${f(number)} leży między ${f(Math.floor(number / unit) * unit)} a ${f((Math.floor(number / unit) + 1) * unit)}. Wybieramy najbliższą wielokrotność ${f(unit)}: ${f(rounded)}. Gdy odległości są równe, wybieramy większą.`);
        }
    }
    for (const [a, b, op, unit] of [
        [221,463,'+',100], [516,295,'−',100], [875,758,'+',100], [1927,3058,'+',1000],
        [8923,5319,'+',1000], [2456,1783,'−',100], [39643,7320,'−',1000], [1718,296,'+',100],
        [8921,3215,'−',1000], [1183,2415,'+',100], [756,93,'−',100], [5836,9905,'+',1000],
        [4363,6911,'+',1000], [58960,11129,'−',1000], [832,378,'−',100], [7642,6538,'−',1000],
        [4634,5297,'+',1000], [287,6328,'+',100], [143,251,'+',100], [682,194,'−',100],
        [390,420,'+',100], [732,218,'−',100], [1950,2020,'+',1000], [9080,3980,'−',1000]
    ]) {
        const ra = roundTo(a, unit), rb = roundTo(b, unit);
        const estimate = op === '+' ? ra + rb : ra - rb;
        const exact = op === '+' ? a + b : a - b;
        numeric('Szacowanie działań', `Oszacuj ${f(a)} ${op} ${f(b)}. Najpierw zaokrąglij każdą liczbę do najbliższych ${names[unit]}, potem wykonaj działanie.`, estimate, unit,
            `${f(a)} ≈ ${f(ra)}, a ${f(b)} ≈ ${f(rb)}. Szacujemy: ${f(ra)} ${op} ${f(rb)} = ${f(estimate)}. Dokładny wynik to ${f(exact)}. Szacunek nie musi być dokładnym wynikiem.`, { estimate: { a, b, op, unit } }, n => `Około ${f(n)}`);
    }
    for (const [a, b, op, choices, unit] of [
        [9753,21064,'+', [11917,3917,111817],10000],
        [1183,2415,'+', [1428,35998,358],100],
        [756,93,'−', [363,6363,6633],100],
        [5836,9905,'+', [1574,157410,2741],1000],
        [4363,6911,'+', [1274,112740,27411],1000],
        [58960,11129,'−', [4783,478310,7831],1000]
    ]) {
        const ra = roundTo(a, unit), rb = roundTo(b, unit);
        const value = op === '+' ? a + b : a - b;
        const estimate = op === '+' ? ra + rb : ra - rb;
        add('Sprawdzanie wyniku', `Tylko jeden wynik działania ${f(a)} ${op} ${f(b)} jest poprawny. Oszacuj i wybierz go.`, f(value), choices.map(f),
            `Zastępujemy liczby przybliżeniami: ${f(ra)} ${op} ${f(rb)} = ${f(estimate)}. Pasuje wynik ${f(value)}. Pozostałe odpowiedzi mają niewłaściwą wielkość. Dokładne obliczenie potwierdza ${f(value)}.`);
    }
    const money = cents => `${Math.floor(cents / 100)} zł${cents % 100 ? ` ${String(cents % 100).padStart(2, '0')} gr` : ''}`;
    for (const [prompt, basket] of [
        ['Kostka masła kosztuje 8 zł 10 gr, chleb 4 zł 98 gr, bułka 1 zł 80 gr, a serek 4 zł 97 gr. Kupujesz masło, chleb, 4 bułki i 3 serki.', [[810,1],[498,1],[180,4],[497,3]]],
        ['Jeden bilet normalny kosztuje 3 zł 80 gr, a ulgowy 2 zł 90 gr. Kupujesz bilet normalny i dwa ulgowe.', [[380,1],[290,2]]],
        ['Ola kupuje 5 batonów po 2 zł 10 gr, 4 czekolady po 9 zł 80 gr i sok za 6 zł 15 gr.', [[210,5],[980,4],[615,1]]],
        ['Kupujesz 3 zeszyty po 4 zł 10 gr i 2 długopisy po 2 zł 20 gr.', [[410,3],[220,2]]],
        ['Kupujesz 2 kanapki po 7 zł 90 gr i wodę za 3 zł 10 gr.', [[790,2],[310,1]]],
        ['Kupujesz 4 jabłka po 1 zł 90 gr i 3 gruszki po 2 zł 10 gr.', [[190,4],[210,3]]],
        ['Kupujesz 2 książki po 19 zł 80 gr i zakładkę za 4 zł 20 gr.', [[1980,2],[420,1]]],
        ['Kupujesz 5 bułek po 1 zł 80 gr i mleko za 4 zł 10 gr.', [[180,5],[410,1]]],
        ['Kupujesz 3 bilety po 9 zł 70 gr i napój za 5 zł 10 gr.', [[970,3],[510,1]]],
        ['Kupujesz 2 gry po 39 zł 90 gr i piłkę za 20 zł 10 gr.', [[3990,2],[2010,1]]]
    ]) {
        const estimated = basket.reduce((sum, [price, count]) => sum + roundTo(price, 100) / 100 * count, 0);
        add('Zakupy', `${prompt} Ile mniej więcej zapłacisz? Najpierw zaokrąglij każdą cenę jednostkową do najbliższej pełnej złotówki.`, `Około ${estimated} zł`,
            [estimated + 5, estimated + 10, estimated + 20].map(n => `Około ${n} zł`),
            `Przybliżamy ceny pojedynczych produktów: ${basket.map(([price,count]) => `${money(price)} ≈ ${roundTo(price,100) / 100} zł, razy ${count}`).join('; ')}. Razem około ${estimated} zł. Zaokrąglamy przed mnożeniem przez liczbę sztuk.`);
    }
    add('Zakupy', 'Dominika ma 30 zł. Czy wystarczy na 6 zeszytów po 4 zł 10 gr i 7 flamastrów po 2 zł 20 gr?', 'Nie wystarczy',
        ['Wystarczy', 'Wystarczy dokładnie, bez reszty', 'Nie da się ustalić na podstawie danych'],
        'Każdy zeszyt kosztuje więcej niż 4 zł, a flamaster więcej niż 2 zł. Już 6 × 4 + 7 × 2 = 38 zł przekracza 30 zł. Rzeczywisty koszt jest jeszcze większy: 40 zł.');
    add('Zakupy', 'Pan Irek ma 70 zł. Czy wystarczy na 8 róż po 4 zł 70 gr, 4 gerbery po 3 zł 10 gr i wstążkę za 9 zł?', 'Wystarczy',
        ['Nie wystarczy', 'Wystarczy dokładnie, bez reszty', 'Nie da się ustalić na podstawie danych'],
        'Szacujemy z zapasem w górę: róża najwyżej 5 zł, gerbera najwyżej 4 zł. Całość kosztuje mniej niż 8 × 5 + 4 × 4 + 9 = 65 zł, więc 70 zł wystarczy. Dokładny koszt to 59 zł.');
    for (const [n, base] of [[192,200],[498,500],[291,300],[187,200],[98,100],[997,1000],[517,500],[234,200],[208,200],[218,200],[316,300],[1008,1000]]) {
        const less = n < base;
        add('Prawie i ponad', `Porównaj ${f(n)} z ${f(base)}. Które określenie jest poprawne?`, less ? `Trochę mniej niż ${f(base)}` : `Trochę więcej niż ${f(base)}`,
            [less ? `Ponad ${f(base)}` : `Mniej niż ${f(base)}`, `Dokładnie ${f(base)}`, `Dokładnie ${f(base * 2)}`],
            `${f(n)} ${less ? '<' : '>'} ${f(base)}. ${less ? '„Prawie” lub „niecałe” oznacza trochę mniej.' : '„Ponad” oznacza więcej niż podana liczba.'} Różnica wynosi ${f(Math.abs(n - base))}.`);
    }
    const quantityWords = ['Kilka', 'Kilkanaście', 'Kilkadziesiąt', 'Kilkaset'];
    for (const [category, numbers] of [[0,[3,5,7,9]],[1,[12,14,17,19]],[2,[28,38,64,87]],[3,[230,380,670,850]]]) {
        for (const n of numbers) add('Określanie ilości', `W grupie jest ${n} zwierząt. Które ogólne określenie pasuje do tej liczby?`, quantityWords[category], quantityWords,
            `Liczbę ${n} opisujemy słowem „${quantityWords[category].toLowerCase()}”. Kilka to kilka jedności, kilkanaście to 11–19, kilkadziesiąt to dziesiątki, a kilkaset to setki.`);
    }
    for (const [prompt, answer, wrong, rule] of [
        ['Co oznacza szacowanie?', 'Podawanie przybliżonej wartości', ['Zawsze podawanie dokładnej wartości', 'Zawsze dodawanie 100', 'Zgadywanie bez korzystania z danych'], 'Szacowanie daje wynik przybliżony, oparty na danych. Ułatwia szybkie obliczenia i sprawdzenie, czy wynik ma sens.'],
        ['Czy „około 200” oznacza dokładnie 200?', 'Nie, to wartość przybliżona', ['Tak, zawsze', 'Tak, ale tylko przy dodawaniu', 'Oznacza dokładnie 20'], '„Około” i „mniej więcej” zapowiadają przybliżenie. Wartość może być trochę mniejsza albo trochę większa.'],
        ['Droga do poczty ma 186 m. Zaokrąglij ją do najbliższej setki metrów.', 'Około 200 m', ['Około 20 m', 'Około 2 000 m', 'Około 100 m'], '186 jest bliżej 200 niż 100. Do opisania przybliżonej odległości wystarczy powiedzieć „około 200 m”.'],
        ['Czy 514 cm można rozsądnie opisać jako około 5 000 cm?', 'Nie, raczej około 500 cm', ['Tak, to dobre przybliżenie', 'Tak, bo obie liczby zaczynają się od 5', 'Nie, raczej około 50 cm'], '514 jest blisko 500. Liczba 5 000 jest prawie dziesięć razy większa, więc to błędny rząd wielkości.'],
        ['Ktoś obliczył 516 − 295 = 21. Co podpowiada szacowanie do setek?', 'Wynik jest podejrzany, powinno być około 200', ['Wynik jest dobry, bo powinno być około 20', 'Powinno być około 2 000', 'Nie da się nic ocenić'], '516 ≈ 500, 295 ≈ 300, więc różnica to około 200. Dokładny wynik wynosi 221, a nie 21.'],
        ['Przyjmij, że śpisz 8 godzin każdej nocy. Ile godzin to w tygodniu i czy więcej niż dwie doby?', '56 godzin, więcej niż dwie doby', ['48 godzin, dokładnie dwie doby', '40 godzin, mniej niż dwie doby', '16 godzin, mniej niż dwie doby'], 'Tydzień ma 7 nocy. 7 × 8 = 56 godzin. Dwie doby to 48 godzin, więc 56 godzin to więcej. To obliczenie dla podanego założenia.'],
        ['Oszacowano liczbę spinaczy na 100, a było ich 128. O ile pomylono się w oszacowaniu?', 'O 28', ['O 128', 'O 228', 'O 18'], 'Błąd oszacowania to odległość między oszacowaniem a rzeczywistą liczbą: 128 − 100 = 28.'],
        ['W którym przypadku potrzebujesz dokładnej liczby, a nie tylko szacunku?', 'Licząc kwotę reszty wydawaną klientowi', ['Opisując odległość do dalekiego miasta', 'Opisując wielkość dużego stada', 'Planując orientacyjny czas spaceru'], 'Przy wydawaniu reszty liczy się dokładna kwota. Szacunek może pomóc sprawdzić, czy obliczenie ma sens, ale go nie zastępuje.']
    ]) add('Szacowanie w życiu', prompt, answer, wrong, rule);
    for (const [a, b, op, unit] of [[1718,296,'+',100],[8921,3215,'−',1000]]) {
        const exact = op === '+' ? a + b : a - b;
        const estimate = op === '+' ? roundTo(a,unit) + roundTo(b,unit) : roundTo(a,unit) - roundTo(b,unit);
        numeric('Błąd oszacowania', `Dla ${f(a)} ${op} ${f(b)} otrzymano szacunek ${f(estimate)} i dokładny wynik ${f(exact)}. O ile różnią się te wartości?`, Math.abs(exact - estimate), 10,
            `Od większej wartości odejmujemy mniejszą: ${f(Math.max(exact,estimate))} − ${f(Math.min(exact,estimate))} = ${f(Math.abs(exact-estimate))}. Szacunek może być większy lub mniejszy od dokładnego wyniku.`);
    }
    add('Hasło', 'Hasło jeziora: oszacuj i uporządkuj wyniki rosnąco. I: 875 + 758; R: 8 923 + 5 319; W: 2 456 − 1 783; Y: 39 643 − 7 320; G: 1 927 + 3 058.', 'WIGRY',
        ['WIRGY', 'WYRIG', 'GWIYR'],
        'W ≈ 700, I ≈ 1 700, G ≈ 5 000, R ≈ 14 000, Y ≈ 33 000. Kolejność rosnąca to W, I, G, R, Y. Hasło: WIGRY. Wystarczą przybliżenia, ponieważ wyniki są od siebie daleko.');
    const api = { tasks, roundTo, createQuiz: (pool = tasks, randomize = true) => engine.createQuiz(pool, randomize) };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.EstimationQuiz = api;
})(globalThis);
