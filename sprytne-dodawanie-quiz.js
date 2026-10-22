(function (root) {
    'use strict';
    const engine = typeof module !== 'undefined' && module.exports ? require('./zapis-liczb-quiz.js') : root.NumberQuiz;
    const tasks = [];
    const f = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    function add(category, prompt, answer, wrong, rule, extra = {}) {
        const choices = [...new Set([String(answer), ...wrong.map(String)])].slice(0,4);
        if (choices.length !== 4) throw new Error('Niepełne odpowiedzi: ' + prompt);
        tasks.push({ category, prompt, answer: String(answer), choices, rule, ...extra });
    }
    function numeric(category, prompt, answer, rule, extra = {}) {
        add(category, prompt, f(answer), [answer+1, Math.max(0,answer-1), answer+10, answer+100, answer+2].map(f), rule, extra);
    }
    function groupPairs(numbers) {
        const remaining = numbers.slice();
        const groups = [];
        while (remaining.length) {
            const a = remaining.shift();
            const i = remaining.findIndex(b => (a+b) % 10 === 0);
            groups.push(i < 0 ? [a] : [a, remaining.splice(i,1)[0]]);
        }
        return groups;
    }
    function groupedRule(numbers) {
        const groups = groupPairs(numbers);
        const total = numbers.reduce((s,n) => s+n,0);
        return `Możesz zmieniać kolejność i grupować składniki bez zmiany sumy. Połącz wygodne pary: ${groups.map(g => g.length === 2 ? `${g[0]} + ${g[1]} = ${g[0]+g[1]}` : `zostaje ${g[0]}`).join('; ')}. Następnie ${groups.map(g => f(g.reduce((s,n) => s+n,0))).join(' + ')} = ${f(total)}.`;
    }
    function sum(category, numbers, rule) {
        numeric(category, `Oblicz sprytnie: ${numbers.map(f).join(' + ')} = ?`, numbers.reduce((s,n) => s+n,0), rule || groupedRule(numbers), { numbers });
    }
    for (let n=0; n<=10; n++) numeric('Dopełnianie', `Ile brakuje liczbie ${n} do 10?`, 10-n, `Szukamy brakującego składnika: ${n} + ${10-n} = 10. Para ${n} i ${10-n} dopełnia się do dziesięciu.`);
    for (const [n, target] of [[14,20],[23,30],[34,40],[47,50],[68,70],[79,80],[91,100],[127,130],[194,200],[226,230],[37,100],[64,100],[78,100],[52,100],[35,100]]) {
        numeric('Dopełnianie', `Jaką liczbę dodasz do ${n}, aby otrzymać ${target}?`, target-n, `Dopełnij do podanej liczby: ${n} + ${target-n} = ${target}. Możesz sprawdzić brakującą część odejmowaniem: ${target} − ${n} = ${target-n}.`);
    }
    for (const [a,b] of [[64,46],[78,52],[27,13],[15,35],[22,18],[37,23],[14,36],[8,42],[17,63],[49,1],[53,7],[42,8]]) {
        add('Pary do pełnych dziesiątek', `Którą z podanych liczb dodasz do ${a}, aby suma była pełną dziesiątką?`, String(b), [b+1,b+2,b+3].map(String),
            `${a} + ${b} = ${a+b}. Cyfry jedności dopełniają się do 10, więc ostatnią cyfrą sumy jest 0. Pozostałe podane liczby nie dają takiej sumy.`);
    }
    for (const [a,b] of [[34,59],[68,29],[74,18],[26,57],[45,17],[39,36],[19,74],[83,79],[157,64],[78,45],[26,238],[58,27],[46,38],[72,49]]) {
        const tens = Math.floor(a/10)*10 + Math.floor(b/10)*10;
        const ones = a%10 + b%10;
        sum('Poziom A', [a,b], `Dodaj pełne dziesiątki do pełnych dziesiątek: ${Math.floor(a/10)*10} + ${Math.floor(b/10)*10} = ${tens}. Jedności: ${a%10} + ${b%10} = ${ones}. Razem ${tens} + ${ones} = ${a+b}.`);
    }
    for (const numbers of [[13,15,7],[34,8,26],[14,7,6],[16,17,3],[49,1,22],[53,2,7],[12,45,5],[42,7,8],[37,35,33],[28,19,12],[46,18,4],[23,11,17]]) sum('Poziom B', numbers);
    for (const numbers of [[22,27,18,23],[14,8,36,17,42],[17,29,21,63],[127,84,23,15,6],[72,17,9,43,8],[84,233,47,16,2],[22,67,8,13],[138,49,31,22],[254,22,57,46,13],[25,36,15,24],[68,17,32,13],[44,29,16,21]]) sum('Poziom C', numbers);
    for (const [a,b,side] of [[47,35,'first'],[194,48,'first'],[226,39,'second'],[76,18,'first'],[48,24,'first'],[36,47,'first'],[37,54,'first'],[19,63,'first'],[27,58,'second'],[294,178,'first'],[167,385,'second'],[437,256,'first']]) {
        const delta = 10 - (side === 'first' ? a : b)%10;
        const x = side === 'first' ? a+delta : a-delta;
        const y = side === 'first' ? b-delta : b+delta;
        const rule = `Przełóż ${delta} z ${side === 'first' ? 'drugiego składnika do pierwszego' : 'pierwszego składnika do drugiego'}: ${a} + ${b} = ${x} + ${y} = ${a+b}. Jedną liczbę zwiększasz o ${delta}, drugą zmniejszasz o tyle samo. Suma się nie zmienia.`;
        sum('Poziom D', [a,b], rule);
        add('Przekładanie', `W sumie ${a} + ${b} dopełnij ${side === 'first' ? 'pierwszy' : 'drugi'} składnik do najbliższej większej pełnej dziesiątki. Który zapis zachowuje sumę?`, `${x} + ${y}`,
            [`${a+delta} + ${b}`, `${a} + ${b-delta}`, `${a+delta} + ${b+delta}`], rule, { transfer: { a,b } });
    }
    for (const numbers of [[493,44,188,77,12,256],[493,44,188,57,93,22,46],[162,85,18,297,315,23],[124,76,219,81],[245,38,155,62],[398,47,102,53]]) sum('Mistrz', numbers);
    for (const [a,b] of [[12,7],[34,59],[47,35],[194,48],[226,39],[18,42],[56,27],[105,19]]) {
        add('Przemienność', `Który zapis otrzymasz, zamieniając kolejność składników w ${a} + ${b}?`, `${b} + ${a}`,
            [`${b} − ${a}`, `${a} − ${b}`, `${b+1} + ${a}`],
            `Dodawanie jest przemienne: ${a} + ${b} = ${b} + ${a} = ${a+b}. Zamieniamy miejscami te same składniki, a nie znaki ani ich wartości.`);
    }
    for (const [prompt, answer, rule] of [
        ['Dwie dynie ważyły 37 kg i 149 kg. Ile ważyły łącznie?',186,'Przełóż 1: 37 + 149 = 36 + 150 = 186 kg.'],
        ['Do parku jest 47 km. Ile kilometrów liczy droga do parku i z powrotem tą samą trasą?',94,'Dwie takie same drogi: 47 + 47 = 50 + 44 = 94 km.'],
        ['Warta ma 808 km, a Odra jest o 46 km dłuższa. Oblicz długość Odry według tych danych.',854,'808 + 46 = 800 + 54 = 854 km. To długość obliczona z danych w zadaniu.'],
        ['Odra ma 854 km, a Wisła jest o 193 km dłuższa. Oblicz długość Wisły według tych danych.',1047,'854 + 193 = 847 + 200 = 1 047 km. Przekładamy 7, aby łatwo dodać 200.'],
        ['Leśniczy posadził 76 sosen, a buków o 25 więcej. Ile buków posadził?',101,'Liczba buków: 76 + 25 = 75 + 26 = 101. Można też dodać 76 + 20 + 5.'],
        ['Leśniczy posadził 76 sosen. Buków było o 25 więcej niż sosen, a dębów o 9 więcej niż buków. Ile dębów posadził?',110,'Buków było 76 + 25 = 101. Dębów było 101 + 9 = 110.'],
        ['W małym koszyku jest 29 śliwek, a w dużym 68. Ile śliwek jest razem?',97,'Przełóż jedną śliwkę do małego koszyka: 29 + 68 = 30 + 67 = 97.'],
        ['Mateusz ma 27 modeli samochodów osobowych, 19 motocykli i 48 ciężarówek. Ile modeli ma razem?',94,'Wygodnie dodać 27 + 48 = 75, potem 75 + 19 = 94. Można przełożyć 1: 74 + 20 = 94.'],
        ['Na podwórku jest 13 indyków, 15 kur, 5 psów i 37 kaczek. Ile ptaków jest na podwórku?',65,'Psy nie są ptakami. Dodajemy tylko 13 + 15 + 37 = 50 + 15 = 65 ptaków.'],
        ['Kuba kupił szynkę za 26 zł, kiełbasę za 27 zł i parówki za 8 zł. Ile wydał na wędliny?',61,'26 + 27 + 8 = 26 + 35 = 61 zł. Grupujemy dwa wygodne składniki.'],
        ['Kuba kupił ser żółty za 19 zł, twaróg za 12 zł i jogurt za 3 zł. Ile wydał na nabiał?',34,'19 + 12 + 3 = 19 + 15 = 34 zł. Można przełożyć 1: 20 + 14 = 34.'],
        ['Uczniowie zorganizowali kawiarenkę. Sałatki przyniosły 78 zł, ciasta 151 zł, a grzanki 43 zł. Ile zebrali razem?',272,'78 + 151 + 43 = 78 + 194 = 72 + 200 = 272 zł. Nie mnożymy 78 przez liczbę rodzajów sałatek: 78 zł to łączny przychód z sałatek.'],
        ['Na górnej półce jest 47 książek, na dolnej 35. Ile książek jest na obu półkach?',82,'Przekładamy 3 książki na górną półkę: 47 + 35 = 50 + 32 = 82.'],
        ['Drużyna zdobyła 15 punktów. Każdy zawodnik, który punktował, zdobył inną dodatnią liczbę punktów. Ilu najwyżej zawodników mogło zdobyć punkty?',5,'Najmniejsze różne dodatnie liczby to 1, 2, 3, 4, 5. Ich suma wynosi 15. Dla 6 zawodników potrzeba co najmniej 1 + 2 + 3 + 4 + 5 + 6 = 21 punktów.']
    ]) numeric('Zadania tekstowe', prompt, answer, rule);
    for (const start of [1,11,21,31,41,51,61,71,81,91]) {
        const end = start+9;
        const pairSum = start+end;
        numeric('Sumy wierszy', `Oblicz sumę dziesięciu kolejnych liczb od ${start} do ${end}.`, pairSum*5,
            `Połącz pierwszą z ostatnią, drugą z przedostatnią itd. Powstaje 5 par, każda o sumie ${pairSum}. Razem 5 × ${pairSum} = ${pairSum*5}.`);
    }
    numeric('Sumy wierszy', 'O ile suma liczb od 11 do 20 jest większa od sumy liczb od 1 do 10?',100,'Każdy z 10 składników drugiego wiersza jest większy o 10. Suma zwiększa się o 10 × 10 = 100.');
    const api = { tasks, groupPairs, createQuiz: (pool = tasks, randomize = true) => engine.createQuiz(pool, randomize) };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.SmartAdditionQuiz = api;
})(globalThis);
