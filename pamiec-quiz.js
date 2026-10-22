(function (root) {
    'use strict';
    const engine = typeof module !== 'undefined' && module.exports ? require('./zapis-liczb-quiz.js') : root.NumberQuiz;
    const tasks = [];
    const prompts = new Set();
    const f = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    function add(category, prompt, answer, wrong, rule) {
        if (prompts.has(prompt)) return;
        const choices = [...new Set([String(answer), ...wrong.map(String)])].slice(0, 4);
        if (choices.length !== 4) throw new Error('Niepełne odpowiedzi: ' + prompt);
        prompts.add(prompt);
        tasks.push({ category, prompt, answer: String(answer), choices, rule });
    }
    function numeric(category, prompt, answer, rule) {
        add(category, prompt, f(answer), [answer + 1, Math.abs(answer - 1), answer + 10, answer + 100, answer + 2].map(f), rule);
    }
    function explain(a, b, op) {
        const result = op === '+' ? a + b : a - b;
        if (b === 0) return `Dodanie lub odjęcie zera nie zmienia liczby: ${f(a)} ${op} 0 = ${f(a)}.`;
        if (a === 0 && op === '+') return `Dodanie zera nie zmienia drugiego składnika: 0 + ${f(b)} = ${f(b)}.`;
        if (a === b && op === '−') return `Gdy odejmujesz liczbę od niej samej, otrzymujesz zero: ${f(a)} − ${f(b)} = 0.`;
        let scale = 1;
        while (a && b && a % (scale * 10) === 0 && b % (scale * 10) === 0) scale *= 10;
        if (scale > 1) return `Obie liczby są wielokrotnościami ${f(scale)}. Oblicz ${a / scale} ${op} ${b / scale} = ${result / scale}, a potem pomnóż wynik przez ${f(scale)}: ${f(result)}. Uważaj, czy obie liczby mają tyle samo zer.`;
        if (op === '+' && b < 10 && a % 10 + b > 10) {
            const gap = 10 - a % 10;
            return `Dopełnij do pełnej dziesiątki: ${f(a)} + ${gap} = ${f(a + gap)}. Z liczby ${b} zostaje ${b - gap}, więc ${f(a + gap)} + ${b - gap} = ${f(result)}.`;
        }
        if (op === '−' && b < 10 && a % 10 > 0 && a % 10 < b) {
            const part = a % 10;
            return `Najpierw odejmij ${part}, aby dojść do pełnej dziesiątki: ${f(a)} − ${part} = ${f(a - part)}. Potem odejmij pozostałe ${b - part}: ${f(a - part)} − ${b - part} = ${f(result)}. Sprawdzenie: ${f(result)} + ${b} = ${f(a)}.`;
        }
        const parts = String(b).split('').map((digit, i, digits) => Number(digit) * 10 ** (digits.length - i - 1)).filter(Boolean);
        let current = a;
        const steps = parts.map(part => {
            const next = op === '+' ? current + part : current - part;
            const text = `${f(current)} ${op} ${f(part)} = ${f(next)}`;
            current = next;
            return text;
        });
        return `${parts.length > 1 ? 'Rozłóż drugą liczbę na setki, dziesiątki i jedności. ' : 'Oblicz w pamięci. '}${steps.join('; ')}.${op === '−' ? ` Sprawdzenie: ${f(result)} + ${f(b)} = ${f(a)}.` : ' Dodawaj jednostki do jednostek, dziesiątki do dziesiątek.'}`;
    }
    function arithmetic(category, a, b, op) {
        numeric(category, `Oblicz: ${f(a)} ${op} ${f(b)} = ?`, op === '+' ? a + b : a - b, explain(a, b, op));
    }
    const groups = [
        ['Poziom A', '+', [[38,7],[9,3],[7,85],[46,8],[8,5],[49,4],[13,8],[4,7],[17,8],[6,6],[9,18],[5,9],[8,8],[56,5],[9,2],[7,76],[59,6],[8,9],[36,8],[3,78],[45,8],[7,84],[19,6],[8,37]]],
        ['Poziom B', '−', [[13,5],[90,8],[17,9],[82,4],[14,8],[49,4],[15,6],[40,3],[16,9],[64,7],[91,8],[15,7],[85,7],[56,9],[71,2],[14,6],[51,9],[16,7],[33,5],[26,8],[30,6],[18,9],[45,7]]],
        ['Poziom C', '+', [[500,300],[2100,200],[800,50],[500,3700],[700,200],[120,500],[700,700],[1600,7000],[100,900],[5500,300],[90,700],[900,1800],[300,600],[1600,500],[6000,800],[570,80],[500,30],[640,80],[5300,70],[600,3500],[820,90]]],
        ['Poziom D', '−', [[2800,300],[1200,800],[700,50],[230,70],[1300,800],[5000,500],[420,80],[1500,400],[4600,800],[1700,20],[220,90],[830,60],[3000,600],[1400,500],[8000,700],[570,80],[700,60],[1100,300],[260,90],[8000,40]]],
        ['Mistrz', '+', [[92,463],[16,74],[781,42],[37,15],[594,32],[16,26],[58,27],[271,76]]],
        ['Mistrz', '−', [[84,21],[71,36],[62,49],[51,45],[73,16],[31,23],[67,59],[93,11],[81,37],[52,25],[76,73],[91,76],[60,23]]]
    ];
    for (const [category, op, examples] of groups) for (const [a, b] of examples) arithmetic(category, a, b, op);
    for (const scale of [1, 10, 100, 1000]) {
        for (const [a, b] of [[5,3],[2,7],[6,8],[9,4]]) arithmetic('Te same rachunki, większe liczby', a * scale, b * scale, '+');
        for (const [a, b] of [[13,7],[15,8],[12,4],[16,9]]) arithmetic('Te same rachunki, większe liczby', a * scale, b * scale, '−');
    }
    for (const n of [0, 4, 10, 50, 200, 1300]) {
        arithmetic('Zero w działaniach', n, 0, '+');
        arithmetic('Zero w działaniach', 0, n, '+');
        arithmetic('Zero w działaniach', n, 0, '−');
        arithmetic('Zero w działaniach', n, n, '−');
    }
    for (const [a, b] of [[13,7],[38,17],[90,8],[82,4],[100,44],[74,13],[85,23],[1300,700]]) {
        const r = a - b;
        add('Sprawdzanie odejmowania', `Jak dodawaniem sprawdzisz wynik ${a} − ${b} = ${r}?`, `${r} + ${b} = ${a}`,
            [`${r} + ${b} = ${a + 1}`, `${a} + ${b} = ${r}`, `${r} + ${a} = ${b}`],
            `Do różnicy dodaj odjemnik. Powinna wyjść odjemna: ${r} + ${b} = ${a}. Dodawanie jest działaniem odwrotnym do odejmowania.`);
    }
    for (const [a, b] of [[38,7],[49,4],[500,30],[700,200],[13,5],[90,8],[1200,800],[8000,40]]) {
        for (const op of ['+', '−']) {
            const result = op === '+' ? a + b : a - b;
            numeric('Brakująca liczba', `Uzupełnij: ${a} ${op} □ = ${result}.`, b,
                op === '+' ? `Szukany składnik to suma pomniejszona o znany składnik: ${result} − ${a} = ${b}.` : `Szukany odjemnik to odjemna pomniejszona o różnicę: ${a} − ${result} = ${b}. Sprawdź: ${a} − ${b} = ${result}.`);
        }
    }
    for (const [prompt, answer, wrong, rule] of [
        ['Jak nazywa się wynik dodawania?', 'Suma', ['Różnica', 'Odjemnik', 'Odjemna'], 'W dodawaniu składnik + składnik = suma. Na przykład w 7 + 5 = 12 suma wynosi 12.'],
        ['Jak nazywają się liczby, które dodajemy?', 'Składniki', ['Odjemniki', 'Różnice', 'Odjemne'], 'Obie dodawane liczby to składniki. Wynik ich dodawania nazywamy sumą.'],
        ['Jak nazywa się wynik odejmowania?', 'Różnica', ['Suma', 'Odjemnik', 'Składnik'], 'W odejmowaniu odjemna − odjemnik = różnica. W 15 − 7 = 8 różnicą jest 8.'],
        ['W działaniu 15 − 7 = 8 odjemną jest…', '15', ['7', '8', 'Żadna z tych liczb'], 'Odjemna jest liczbą, od której odejmujemy. Stoi przed znakiem minus: 15.'],
        ['W działaniu 15 − 7 = 8 odjemnikiem jest…', '7', ['15', '8', 'Żadna z tych liczb'], 'Odjemnik to liczba, którą odejmujemy. W tym działaniu odejmujemy 7.'],
        ['W działaniu 15 − 7 = 8 różnicą jest…', '8', ['15', '7', 'Żadna z tych liczb'], 'Różnica to wynik odejmowania: 15 − 7 = 8.'],
        ['Który zapis przedstawia sumę liczb 17 i 38?', '17 + 38', ['38 − 17', '17 − 38', '38 + 38'], 'Suma oznacza dodawanie podanych liczb, więc zapisujemy 17 + 38.'],
        ['Który zapis pozwala obliczyć, o ile 38 jest większe od 17?', '38 − 17', ['38 + 17', '17 − 38', '38 − 38'], 'Pytanie „o ile więcej” dotyczy różnicy. Odejmujemy mniejszą liczbę od większej.']
    ]) add('Nazwy działań', prompt, answer, wrong, rule);

    for (const [prompt, answer, rule] of [
        ['Samochód kosztował 93 000 zł. Teraz jest o 8 000 zł tańszy. Ile kosztuje teraz?', 85000, 'Obniżka oznacza odejmowanie: 93 000 − 8 000 = 85 000 zł. Obliczamy 93 − 8 = 85 i zachowujemy tysiące.'],
        ['Grześ zebrał 36 grzybów, a Krysia 12. Ile zebrali razem?', 48, 'Razem oznacza sumę: 36 + 12 = 36 + 10 + 2 = 48 grzybów.'],
        ['Grześ zebrał 36 grzybów, a Krysia 12. O ile więcej zebrał Grześ?', 24, 'Porównujemy liczby, więc odejmujemy: 36 − 12 = 24. Grześ zebrał o 24 grzyby więcej.'],
        ['Grześ zebrał 36 grzybów, a Krysia o 12 więcej. Ile zebrali razem?', 84, 'Najpierw Krysia: 36 + 12 = 48. Następnie razem: 36 + 48 = 84 grzyby. Liczba 12 oznacza różnicę, a nie zbiór Krysi.'],
        ['Klasa IVa zebrała 24 kg makulatury, a IVb o 11 kg więcej. Ile zebrały razem?', 59, 'IVb zebrała 24 + 11 = 35 kg. Razem: 24 + 35 = 59 kg makulatury.'],
        ['Kasia ma 32 muszelki, a Jola o 15 mniej. Ile mają razem?', 49, 'Jola ma 32 − 15 = 17 muszelek. Razem mają 32 + 17 = 49 muszelek.'],
        ['Magda ma 17 naklejek, a Agata 38. O ile mniej ma Magda?', 21, 'Od większej liczby odejmujemy mniejszą: 38 − 17 = 21. Magda ma o 21 naklejek mniej.'],
        ['Magda ma 17 naklejek, a Agata 38. Ile musi dobrać Magda, aby miały tyle samo?', 21, 'Szukamy brakującego składnika: 17 + □ = 38. Obliczamy 38 − 17 = 21 naklejek.'],
        ['Tomek ma 24 zł, a Wiktor o 8 zł więcej. Ile ma Wiktor?', 32, 'O 8 zł więcej oznacza: 24 + 8 = 32 zł.'],
        ['Paweł miał 100 zł. Wydał 47 zł na książkę i 26 zł na komiks. Ile wydał razem?', 73, 'Dodajemy wydatki: 47 + 26 = 47 + 20 + 6 = 73 zł.'],
        ['Paweł miał 100 zł. Wydał 47 zł na książkę i 26 zł na komiks. Ile mu zostało?', 27, 'Wydatki: 47 + 26 = 73 zł. Pozostało: 100 − 73 = 27 zł.'],
        ['Paweł zapłacił 47 zł za książkę i 26 zł za komiks. O ile droższa była książka?', 21, 'Różnica cen wynosi 47 − 26 = 21 zł. Nie dodajemy cen, gdy pytamy o różnicę.'],
        ['Wiewiórka schowała 34 orzechy włoskie i 12 laskowych w dębie oraz 23 włoskie i 56 laskowych w klonie. Ile schowała razem?', 125, 'Dodajemy wszystkie cztery liczby: 34 + 12 + 23 + 56 = 46 + 79 = 125 orzechów.'],
        ['W klubie jest 80 osób. Karate trenuje 27, pozostali dżudo. Ile osób trenuje dżudo?', 53, 'Od wszystkich osób odejmujemy trenujących karate: 80 − 27 = 53 osoby.'],
        ['W skarbonce było 50 zł. Dzisiaj nic nie dołożono ani nie wydano. Ile jest w skarbonce?', 50, 'Dodanie lub odjęcie zera nie zmienia kwoty: 50 + 0 = 50 zł.']
    ]) numeric('Zadania tekstowe', prompt, answer, rule);
    add('Zadania tekstowe', 'W klubie jest 80 osób. Karate trenuje 27, a pozostali dżudo. Którą dyscyplinę trenuje więcej osób i o ile?', 'Dżudo, o 26 osób więcej',
        ['Karate, o 26 osób więcej', 'Dżudo, o 53 osoby więcej', 'Obie dyscypliny tyle samo osób'],
        'Dżudo trenuje 80 − 27 = 53 osoby. Różnica to 53 − 27 = 26. Dżudo trenuje o 26 osób więcej niż karate.');
    add('Mistrz', 'Różnica dwóch liczb wynosi 9 i jest o 6 mniejsza od ich sumy. Jakie to liczby?', '12 i 3', ['9 i 6', '15 i 6', '10 i 1'],
        'Suma wynosi 9 + 6 = 15. Szukamy liczb o sumie 15 i różnicy 9: 12 + 3 = 15 oraz 12 − 3 = 9.');
    for (const [title, pairs, op, wrong] of [
        ['Hasło z dodawania', [['E',72,21],['C',82,18],['Z',9,18],['O',53,35],['N',45,46],['S',54,7],['K',48,23],['A',49,4],['R',16,64],['I',42,50]], '+', ['ZASKRONIEK', 'ZASKORINCE', 'ZAKSRONIEC']],
        ['Hasło z odejmowania', [['E',60,3],['I',100,44],['N',70,15],['E',74,13],['R',85,23],['Z',100,37],['P',123,63],['O',99,40],['T',64,6]], '−', ['NIETORPEZ', 'NIETOPREZ', 'NIETORPEŹ']]
    ]) {
        const sorted = pairs.map(([letter, a, b]) => ({ letter, a, b, value: op === '+' ? a + b : a - b })).sort((a, b) => a.value - b.value);
        add('Hasła', `${title}: oblicz wyniki, ustaw je rosnąco i odczytaj litery.\n${pairs.map(([letter,a,b]) => `${letter}: ${a} ${op} ${b}`).join('; ')}`, sorted.map(x => x.letter).join(''), wrong,
            `W kolejności rosnącej: ${sorted.map(x => `${x.value} (${x.letter})`).join(', ')}. Litery tworzą hasło ${sorted.map(x => x.letter).join('')}.`);
    }
    const api = { tasks, createQuiz: (pool = tasks, randomize = true) => engine.createQuiz(pool, randomize) };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MemoryMathQuiz = api;
})(globalThis);
