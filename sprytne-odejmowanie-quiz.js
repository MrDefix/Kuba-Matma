(function (root) {
    'use strict';
    const engine = typeof module !== 'undefined' && module.exports ? require('./zapis-liczb-quiz.js') : root.NumberQuiz;
    const tasks = [];
    const f = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
    function add(category,prompt,answer,wrong,rule,extra = {}) {
        const choices = [...new Set([String(answer),...wrong.map(String)])].slice(0,4);
        if (choices.length !== 4) throw new Error('Niepełne odpowiedzi: '+prompt);
        tasks.push({ category,prompt,answer:String(answer),choices,rule,...extra });
    }
    function numeric(category,prompt,answer,rule,extra = {}) {
        add(category,prompt,f(answer),[answer+1,Math.max(0,answer-1),answer+10,answer+100,answer+2].map(f),rule,extra);
    }
    function additionSteps(from,to) {
        const steps = [];
        let current = from;
        const advance = next => {
            if (next > current && next <= to) {
                steps.push({from:current,to:next,amount:next-current});
                current = next;
            }
        };
        if (current % 10) advance(Math.min(Math.ceil(current/10)*10,to));
        if (current % 100) advance(Math.min(Math.ceil(current/100)*100,Math.floor(to/10)*10));
        advance(Math.floor(to/100)*100);
        advance(to);
        return steps;
    }
    function addingRule(a,b) {
        const steps = additionSteps(b,a);
        if (!steps.length) return `Obie liczby są równe: ${f(a)} − ${f(b)} = 0. Nie trzeba nic dodawać, aby dojść od jednej do drugiej.`;
        return `Dojdź od ${f(b)} do ${f(a)} przez dodawanie: ${steps.map(s => `${f(s.from)} + ${f(s.amount)} = ${f(s.to)}`).join('; ')}. Dodaj przyrosty: ${steps.map(s => f(s.amount)).join(' + ')} = ${f(a-b)}. Tyle wynosi różnica.`;
    }
    function shiftFor(b) {
        const unit = b >= 50 ? 100 : 10;
        return (unit - b % unit) % unit;
    }
    function shiftRule(a,b) {
        const amount = shiftFor(b);
        if (!amount) return `Odjemnik jest już pełną dziesiątką lub setką: ${f(a)} − ${f(b)} = ${f(a-b)}. Sprawdzenie: ${f(a-b)} + ${f(b)} = ${f(a)}.`;
        return `Powiększ obie liczby o ${amount}: ${f(a)} − ${f(b)} = ${f(a+amount)} − ${f(b+amount)} = ${f(a-b)}. Jednakowe zwiększenie obu liczb zachowuje różnicę. To dokładne przekształcenie, nie zaokrąglanie.`;
    }
    function piecesRule(a,b) {
        const parts = String(b).split('').map((digit,i,digits) => Number(digit)*10**(digits.length-i-1)).filter(Boolean);
        let current = a;
        const steps = [];
        for (const part of parts) {
            if (part < 10 && current%10 > 0 && current%10 < part) {
                const first = current%10;
                steps.push(`${f(current)} − ${first} = ${f(current-first)}`);
                current -= first;
                steps.push(`${f(current)} − ${part-first} = ${f(current-part+first)}`);
                current -= part-first;
            } else {
                steps.push(`${f(current)} − ${f(part)} = ${f(current-part)}`);
                current -= part;
            }
        }
        return `Odejmuj po kawałku: ${steps.join('; ')}. Łącznie odejmujesz ${f(b)}. Sprawdzenie: ${f(a-b)} + ${f(b)} = ${f(a)}.`;
    }
    function placesRule(a,b) {
        const length = String(a).length;
        const parts = Array.from({length},(_,i) => 10**(length-i-1));
        return `Odejmij liczby na odpowiadających sobie pozycjach: ${parts.map(unit => `${Math.floor(a/unit)%10*unit} − ${Math.floor(b/unit)%10*unit} = ${(Math.floor(a/unit)%10-Math.floor(b/unit)%10)*unit}`).join('; ')}. Dodaj otrzymane części: ${f(a-b)}.`;
    }
    const groups = [
        ['Poziom A','places',[[367,152],[85,32],[164,51],[248,128],[79,26],[285,134],[195,123],[267,135],[975,432],[864,321],[598,276],[763,142]]],
        ['Poziom B','pieces',[[93,58],[65,48],[63,27],[42,26],[32,17],[84,36],[76,39],[453,38],[82,17],[74,56],[175,98],[567,42],[132,48],[251,76],[304,57],[96,29]]],
        ['Poziom C','shift',[[121,83],[43,17],[205,27],[182,59],[54,8],[105,36],[175,127],[183,74],[246,98],[312,79],[525,196],[1031,996]]],
        ['Poziom D','adding',[[54,37],[141,66],[542,194],[162,99],[230,179],[176,98],[105,87],[385,289],[135,19],[378,92],[232,175],[518,463]]],
        ['Poziom E','shift',[[452,98],[763,172],[75,46],[245,67],[328,59],[94,31],[417,298],[602,397],[818,479],[930,685],[1000,999],[245,245]]],
        ['Mistrz','pieces',[[7245,896],[1047,394],[3075,2482],[1503,978],[6351,1765],[5306,4732],[8000,1999],[10000,8765]]]
    ];
    for (const [category,method,examples] of groups) {
        for (const [a,b] of examples) {
            const rule = method === 'places' ? placesRule(a,b) : method === 'pieces' ? piecesRule(a,b) : method === 'shift' ? shiftRule(a,b) : addingRule(a,b);
            numeric(category,`Oblicz sprytnie: ${f(a)} − ${f(b)} = ?`,a-b,rule,{ calculation:{a,b,method} });
        }
    }
    for (const [a,b] of [[121,83],[43,17],[205,27],[182,59],[54,8],[105,36],[175,127],[183,74],[246,98],[312,79],[525,196],[1031,996],[452,98],[75,46],[328,59],[94,31]]) {
        const amount = shiftFor(b);
        add('Powiększanie obu liczb',`Zwiększ obie liczby w działaniu ${a} − ${b} o ${amount}. Który zapis zachowuje różnicę?`,`${a+amount} − ${b+amount}`,
            [`${a+amount} − ${b}`,`${a} − ${b+amount}`,`${a+amount} − ${b-amount}`],shiftRule(a,b),{shift:{a,b,amount}});
    }
    for (const [from,to] of [[67,100],[83,100],[37,40],[66,70],[194,200],[98,100],[179,200],[289,300],[17,20],[27,30],[59,100],[36,40],[74,100],[87,100],[175,200],[996,1000]]) {
        numeric('Dopełnianie',`Ile trzeba dodać do ${f(from)}, aby otrzymać ${f(to)}?`,to-from,`${addingRule(to,from)} Szukany brakujący składnik to ${f(to-from)}.`);
    }
    for (const [price,paid] of [[17,100],[84,200],[132,200],[69,500],[373,500],[47,100],[89,100],[149,200],[267,500],[498,500]]) {
        numeric('Wydawanie reszty',`Zakupy kosztują ${price} zł. Klient płaci ${paid} zł. Ile złotych reszty otrzyma?`,paid-price,`${addingRule(paid,price)} Klient otrzyma ${paid-price} zł reszty.`,{change:{price,paid}});
    }
    for (const [prompt,answer,rule] of [
        ['Kasia zebrała 73 naklejki, a Marysia ma o 15 mniej. Ile naklejek ma Marysia?',58,'73 − 15 = 73 − 10 − 5 = 63 − 5 = 58 naklejek.'],
        ['Marysia ma o 15 naklejek mniej niż Kasia. O ile więcej naklejek od Marysi ma Kasia?',15,'To ta sama różnica: jeśli Marysia ma o 15 mniej, to Kasia ma o 15 więcej. Nie trzeba znać obu liczebności.'],
        ['Żyrafy mają wysokość 518 cm i 463 cm. Jaka jest różnica ich wysokości?',55,'Powiększ obie liczby o 37: 518 − 463 = 555 − 500 = 55. Różnica wysokości to 55 cm.'],
        ['Żubr jesienią ważył 1 031 kg, a wiosną 996 kg. Ile kilogramów schudł?',35,'Powiększ obie liczby o 4: 1 031 − 996 = 1 035 − 1 000 = 35 kg.'],
        ['Na wycieczkę zebrano 1 171 zł, a wydano 1 118 zł. Ile złotych zostało?',53,'1 171 − 1 118 = 53. Można dopełnić: od 1 118 do 1 120 brakuje 2, a do 1 171 kolejnych 51. Razem 53 zł.'],
        ['Ola ma 121 cm wzrostu, a Paweł 83 cm. Jaka jest różnica wzrostu w centymetrach?',38,'Dodaj do obu liczb 17: 121 − 83 = 138 − 100 = 38 cm.'],
        ['Adam ma 54 zł, a Kamil ma 37 zł. Ile złotych brakuje Kamilowi do kwoty Adama?',17,addingRule(54,37)],
        ['Mały zestaw ma 175 klocków, a duży 232. O ile więcej klocków jest w dużym zestawie?',57,addingRule(232,175)],
        ['Andrzej zdobył w pierwszej rundzie 64 punkty, a Mirek 72. Jaka była różnica punktów po tej rundzie?',8,'Odejmujemy mniejszą liczbę od większej: 72 − 64 = 8 punktów.'],
        ['Andrzej zdobył 64 i 58 punktów, a Mirek 72 i 45. Ile punktów łącznie zdobył Andrzej?',122,'Dodajemy wyniki obu rund Andrzeja: 64 + 58 = 122 punkty.'],
        ['Andrzej zdobył 64 i 58 punktów, a Mirek 72 i 45. Ile punktów łącznie zdobył Mirek?',117,'Dodajemy wyniki obu rund Mirka: 72 + 45 = 117 punktów.']
    ]) numeric('Zadania tekstowe',prompt,answer,rule);
    add('Zadania tekstowe','Andrzej zdobył 64 i 58 punktów, a Mirek 72 i 45. Wskaż zwycięzcę i przewagę punktową zwycięzcy.','Andrzej, o 5 punktów',
        ['Mirek, o 5 punktów','Andrzej, o 8 punktów','Remis'],
        'Andrzej: 64 + 58 = 122. Mirek: 72 + 45 = 117. Różnica 122 − 117 = 5, więc Andrzej wygrał o 5 punktów.');
    // Podany rok odniesienia jest częścią zadania, nie zmienia się wraz z zegarem.
    for (const [prompt,answer,rule] of [
        ['Do 2026 roku od 1885 roku minęło ile lat? Oblicz różnicę lat na podstawie podanych dat.',141,'2026 − 1885 = 2041 − 1900 = 141 lat.'],
        ['Do 2026 roku od 1957 roku minęło ile lat? Oblicz różnicę lat na podstawie podanych dat.',69,'2026 − 1957 = 2069 − 2000 = 69 lat.'],
        ['Do 2026 roku od 1983 roku minęło ile lat? Oblicz różnicę lat na podstawie podanych dat.',43,'2026 − 1983 = 2043 − 2000 = 43 lata.'],
        ['Według zadania Tuwim w 1936 roku miał 42 lata. Jaki rok urodzenia wynika z tych danych?',1894,'Od podanego roku odejmujemy podany wiek: 1936 − 42 = 1894. Liczymy różnicę lat z zadania.'],
        ['Ile lat jest między 1936 a 2026 rokiem?',90,'2026 − 1936 = 90. Sprawdzenie: 1936 + 90 = 2026.'],
        ['Jan Kazimierz urodził się w 1609 roku, a zmarł w 1672. Ile lat wynosi różnica tych dat?',63,'1672 − 1609 = 63 lata. W zadaniu porównujemy podane lata.'],
        ['Jan Kazimierz urodził się w 1609 roku i został królem w 1648. Ile lat wynosi różnica tych dat?',39,'1648 − 1609 = 39 lat. Można powiększyć obie liczby o 1: 1649 − 1610 = 39.'],
        ['Jan Kazimierz został królem w 1648 roku i panował 20 lat. W którym roku abdykował według tych danych?',1668,'Do 1648 dodajemy 20 lat panowania: 1648 + 20 = 1668.'],
        ['Ile lat jest między abdykacją w 1668 roku a śmiercią w 1672 roku?',4,'1672 − 1668 = 4. Od 1668 do 1670 dodajemy 2, a potem do 1672 jeszcze 2.'],
        ['Ile lat jest między 1609 a 2026 rokiem?',417,'2026 − 1609 = 2037 − 1620 = 417. Można też dodać do obu liczb 391: 2417 − 2000 = 417.']
    ]) numeric('Lata i daty',prompt,answer,rule);
    numeric('Zagadki','Ile jest rozwiązań zagadki: od trzycyfrowej liczby o jednakowych cyfrach odejmujemy dwucyfrową liczbę o jednakowych cyfrach, a wynik jest dwucyfrowy?',8,
        'Pierwszą liczbą musi być 111: już 222 − 99 = 123 jest za duże. Od 111 można odjąć 22, 33, 44, 55, 66, 77, 88 lub 99. Daje to 8 rozwiązań; 111 − 11 = 100 nie pasuje.');
    add('Zagadki','Które działanie spełnia warunki: od trzycyfrowej liczby o jednakowych cyfrach odejmujemy dwucyfrową liczbę o jednakowych cyfrach i otrzymujemy wynik dwucyfrowy?','111 − 22',
        ['222 − 22','111 − 11','123 − 44'],
        '111 − 22 = 89, więc w każdej z obu liczb cyfry są jednakowe, a wynik ma dwie cyfry. Pozostałe przykłady dają wynik trzycyfrowy albo pierwsza liczba ma różne cyfry.');
    for (const [prompt,answer,wrong,rule] of [
        ['Co stanie się z różnicą, gdy obie liczby zwiększysz o tyle samo?','Nie zmieni się',['Zawsze wzrośnie','Zawsze zmaleje','Zawsze będzie zerem'],'Jednakowe przesunięcie obu liczb zachowuje odległość między nimi. Na przykład 54 − 37 = 57 − 40 = 17.'],
        ['Czy można zamienić miejscami liczby w odejmowaniu tak jak w dodawaniu?','Nie, odejmowanie nie jest przemienne',['Tak, zawsze','Tak, jeśli obie liczby są dwucyfrowe','Tak, jeśli różnica jest większa od 10'],'Kolejność liczb w odejmowaniu ma znaczenie: 8 − 3 = 5, ale 3 − 8 nie daje 5.'],
        ['Jak przez dodawanie obliczyć 54 − 37?','Sprawdzić, ile trzeba dodać do 37, aby otrzymać 54',['Dodać 54 do 37','Sprawdzić, ile trzeba dodać do 54, aby otrzymać 100','Dodać do obu liczb po 54 i podać sumę'],'Różnica 54 − 37 to brakujący składnik w 37 + □ = 54. Przyrost wynosi 17.']
    ]) add('Zasady odejmowania',prompt,answer,wrong,rule);
    const api = { tasks,additionSteps,createQuiz:(pool = tasks,randomize = true) => engine.createQuiz(pool,randomize) };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.SmartSubtractionQuiz = api;
})(globalThis);
