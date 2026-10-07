/**
 * cards.js — the deck, meters and endings for Spike 003c (pure data + a tiny engine; no DOM).
 *
 * Reigns-style: four meters start at 50. Every card is someone asking Barren (CEO of Ohama
 * Holdings) something; swiping left/right applies that choice's effects. Any meter hitting
 * 0 or 100 ends the run with one of eight endings; surviving to 96 is the ninth.
 * Each card = 2 years. Parody throughout: no real names, brands or investment advice.
 */

export const METERS = [
    { id: 'cash',    label: 'CASH',         emoji: '💵' },
    { id: 'holders', label: 'SHAREHOLDERS', emoji: '👥' },
    { id: 'calm',    label: 'PATIENCE',     emoji: '🧘' },
    { id: 'fizz',    label: 'CHERRY FIZZ',  emoji: '🥤' },
];

export const START_AGE = 30;
export const END_AGE = 96;
export const YEARS_PER_CARD = 2;
export const FX_SCALE = 1.3;                       // swing size
export const DRIFT = { calm: 1, fizz: -2 };        // every 2 years: a bit more patient, more tired

export const ENDINGS = {
    'cash-0':      { title: 'BROKE',            face: 'barrenWorried', text: 'You spent the whole cash pile. Even the gum stand repossessed you.' },
    'cash-100':    { title: 'CASH MOUNTAIN',    face: 'barrenSmile',   text: 'Your cash pile got its own zip code. Shareholders sued you for having too much money.' },
    'holders-0':   { title: 'OUSTED',           face: 'barrenWorried', text: 'The shareholders voted you out. You now run a lemonade stand. Margins are great.' },
    'holders-100': { title: 'THE CULT',         face: 'barren',        text: '40,000 people now copy every trade you make. Nothing is cheap anymore.' },
    'calm-0':      { title: 'DAY TRADER',       face: 'barrenWorried', text: 'You sold everything and bought rockets. Mr. Market laughed until he cried.' },
    'calm-100':    { title: 'TOO PATIENT',      face: 'barrenSmile',   text: 'You waited thirty years for the perfect pitch. The bat fell asleep.' },
    'fizz-0':      { title: 'BURNOUT',          face: 'barrenWorried', text: 'No Cherry Fizz, no energy. You fell asleep in your own annual meeting.' },
    'fizz-100':    { title: 'SUGAR RUSH',       face: 'barren',        text: 'Five Cherry Fizzes a day. Your dentist bought a yacht.' },
    'emeritus':    { title: 'CHAIRMAN EMERITUS', face: 'barren',       text: 'You made it to 96 with your snowball intact. They made you chairman emeritus. You kept the Fizz.' },
};

// who: portrait key from the shared cast (../002-old-barren-cast/cast.js)
// fx keys: cash, holders, calm, fizz.  then: queue a follow-up card id.  once: never repeat.
export const CARDS = [
    { id: 'mm-panic-rail', who: 'marketPanic', name: 'Mr. Market (panicking)', text: 'Everything is crashing! I will sell you this railroad for half price. Please. I am begging.',
      left: { label: 'Not now', fx: { cash: 6, calm: 6 } }, right: { label: 'Buy the railroad', fx: { cash: -18, holders: 14 } } },
    { id: 'mm-greed-tech', who: 'marketGreed', name: 'Mr. Market (euphoric)', text: 'Stocks only go up! Buy this hot software company at ninety times earnings!',
      left: { label: 'Pass', fx: { calm: 8, holders: -6 } }, right: { label: 'Buy it', fx: { cash: -16, holders: 6, calm: -12 } } },
    { id: 'bro-fizzcoin', who: 'cryptoBro', name: 'Crypto Bro', text: 'Bro. Put the company treasury in FIZZCOIN. It is like Cherry Fizz, but digital.', once: true,
      left: { label: 'No.', fx: { holders: 6, calm: 6 } }, right: { label: 'Ape in', fx: { cash: -12, calm: -14 }, then: 'bro-fizzcoin-dip' } },
    { id: 'charlie-candy', who: 'charlie', name: 'Charlie', text: 'A candy company is for sale. Overpriced, but people love it. They will pay more every Christmas.',
      left: { label: 'Too pricey', fx: { cash: 6, calm: 4 } }, right: { label: 'Buy it', fx: { cash: -16, holders: 10, fizz: 4 } } },
    { id: 'bank-loan', who: 'banker', name: 'The Banker', text: 'Take this cheap loan! Leverage makes your winners bigger!', once: true,
      left: { label: 'No debt', fx: { calm: 8, holders: -6 } }, right: { label: 'Borrow', fx: { cash: 22, calm: -10 }, then: 'bank-margin' } },
    { id: 'rep-letter', who: 'reporter', name: 'The Reporter', text: 'Your shareholder letter is forty pages of jokes about textile mills. Care to comment?',
      left: { label: 'Read it aloud', fx: { holders: 10, fizz: -8 } }, right: { label: 'No comment', fx: { holders: -8, calm: 6 } } },
    { id: 'charlie-mill', who: 'charlie', name: 'Charlie', text: 'A textile mill. Terrible business. But SO cheap.', once: true,
      left: { label: 'Pass', fx: { calm: 6, cash: 4 } }, right: { label: 'Buy it', fx: { cash: -12, holders: -8 }, then: 'charlie-mill-again' } },
    { id: 'charlie-fizz', who: 'charlie', name: 'Charlie', text: 'Your Cherry Fizz intake is getting a little concerning, Barren.',
      left: { label: 'Fine, one less', fx: { fizz: -14 } }, right: { label: 'Make it a 12-pack', fx: { fizz: 14, calm: 4 } } },
    { id: 'mm-forecast', who: 'marketNeutral', name: 'Mr. Market', text: 'Want to know what the market does this year? I will tell you for one million dollars.',
      left: { label: 'Nobody knows', fx: { calm: 10, cash: 4 } }, right: { label: 'Pay him', fx: { cash: -12, calm: -10 } } },
    { id: 'bro-burger', who: 'cryptoBro', name: 'Crypto Bro', text: 'Bro, digital trading cards of Ohama\'s best hamburgers. Each one is unique.',
      left: { label: 'Hard pass', fx: { holders: 6, fizz: -4 } }, right: { label: 'Buy the burger', fx: { cash: -8, fizz: 8, holders: -8 } } },
    { id: 'bank-dividend', who: 'banker', name: 'The Banker', text: 'Your shareholders want a dividend. A big one.',
      left: { label: 'We reinvest', fx: { holders: -12, cash: 8 } }, right: { label: 'Pay it out', fx: { holders: 12, cash: -16 } } },
    { id: 'rep-tech', who: 'reporter', name: 'The Reporter', text: 'Will you FINALLY buy a tech company?',
      left: { label: 'I do not get it', fx: { calm: 8, holders: -6 } }, right: { label: 'Buy a phone maker', fx: { cash: -18, holders: 12, calm: -4 } } },
    { id: 'charlie-float', who: 'charlie', name: 'Charlie', text: 'An insurance company. People pay us now, claims come later. Free money to invest.',
      left: { label: 'Sounds boring', fx: { calm: -6, fizz: 4 } }, right: { label: 'Float!', fx: { cash: 16, holders: 6 } } },
    { id: 'mm-panic-sell', who: 'marketPanic', name: 'Mr. Market (panicking)', text: 'THE END IS NIGH! I am selling everything! Sell with me!',
      left: { label: 'Buy instead', fx: { cash: -16, holders: 12, calm: 6 } }, right: { label: 'Panic too', fx: { cash: 14, calm: -16, holders: -8 } } },
    { id: 'mm-greed-split', who: 'marketGreed', name: 'Mr. Market (euphoric)', text: 'Your stock is up forty percent! Split it a hundred for one so everyone can buy!',
      left: { label: 'No splits', fx: { holders: -6, calm: 6 } }, right: { label: 'Split it', fx: { holders: 10, calm: -10 } } },
    { id: 'bank-activist', who: 'banker', name: 'The Banker', text: 'An activist investor demands you fire Charlie.',
      left: { label: 'Never', fx: { holders: -8, calm: 6 } }, right: { label: 'Fire Charlie', fx: { holders: 8, calm: -16, fizz: -6 } } },
    { id: 'rep-ukulele', who: 'reporter', name: 'The Reporter', text: 'Forty thousand people came to your annual meeting. They are chanting for a ukulele song.',
      left: { label: 'Absolutely not', fx: { holders: -10, calm: 4 } }, right: { label: 'Play the ukulele', fx: { holders: 14, fizz: -6 } } },
    { id: 'charlie-house', who: 'charlie', name: 'Charlie', text: 'Barren, you could afford a mansion now. With a moat. A real one.',
      left: { label: 'I love my house', fx: { cash: 8, calm: 6 } }, right: { label: 'Buy the mansion', fx: { cash: -14, holders: -6, fizz: 6 } } },
    { id: 'bro-ai', who: 'cryptoBro', name: 'Crypto Bro', text: 'Bro. Bro. BRO. An AI coin. It is AI. AND a coin.',
      left: { label: 'Bro, no.', fx: { holders: 6, calm: 6 } }, right: { label: 'Ape in', fx: { cash: -14, calm: -12 } } },
    { id: 'mm-bonds', who: 'marketNeutral', name: 'Mr. Market', text: 'Interest rates are up! Or down! I forget. Buy bonds?',
      left: { label: 'Cash is fine', fx: { cash: 8, calm: 4 } }, right: { label: 'Buy bonds', fx: { cash: -6, calm: 6, fizz: -4 } } },
    { id: 'bank-merger', who: 'banker', name: 'The Banker', text: 'I have a "synergistic merger" for you. Only forty slides.',
      left: { label: 'Show him out', fx: { calm: 8, holders: -6 } }, right: { label: 'Hear him out', fx: { cash: -14, holders: 6, fizz: -6 } } },
    { id: 'rep-giving', who: 'reporter', name: 'The Reporter', text: 'Will you give most of your fortune away?',
      left: { label: 'Later', fx: { holders: -8, cash: 6 } }, right: { label: 'Pledge it', fx: { holders: 14, cash: -12, fizz: 4 } } },
    { id: 'charlie-shoes', who: 'charlie', name: 'Charlie', text: 'A shoe company. I have a good feeling about this one.', once: true,
      left: { label: 'Pass', fx: { calm: 6 } }, right: { label: 'Buy it', fx: { cash: -12, holders: -8, fizz: 4 } } },
    { id: 'mm-greed-sell', who: 'marketGreed', name: 'Mr. Market (euphoric)', text: 'Sell me your candy company! I will pay three times what it is worth!',
      left: { label: 'Hold forever', fx: { holders: 6, calm: 8 } }, right: { label: 'Sell it', fx: { cash: 18, calm: -6, fizz: -4 } } },
    { id: 'rep-advice', who: 'reporter', name: 'The Reporter', text: 'Is now a good time to invest?',
      left: { label: 'Nobody knows', fx: { calm: 6, holders: -4 } }, right: { label: 'Long term? Always.', fx: { holders: 10, calm: -6 } } },
    { id: 'charlie-airline', who: 'charlie', name: 'Charlie', text: 'Airlines are cheap right now. Very cheap.',
      left: { label: 'Never airlines', fx: { calm: 6, fizz: -4 } }, right: { label: 'Buy airlines', fx: { cash: -16, holders: -8 } } },
    { id: 'bank-railroad', who: 'banker', name: 'The Banker', text: 'The biggest deal of your life: a whole railroad. All cash?',
      left: { label: 'Too big', fx: { calm: 6, holders: -6 } }, right: { label: 'All aboard', fx: { cash: -24, holders: 16 } } },
    { id: 'charlie-tired', who: 'charlie', name: 'Charlie', text: 'You have read annual reports for nine hours straight. Take a nap?',
      left: { label: 'One more report', fx: { fizz: -10, calm: 6, cash: 4 } }, right: { label: 'Nap', fx: { fizz: 10, calm: -4 } } },
    { id: 'rep-tv', who: 'reporter', name: 'The Reporter', text: 'A TV network wants to film your whole life. They will pay millions.',
      left: { label: 'No cameras', fx: { holders: -6, calm: 6 } }, right: { label: 'Roll camera', fx: { cash: 14, calm: -8, fizz: 4 } } },
    { id: 'mm-greed-bricks', who: 'marketGreed', name: 'Mr. Market (euphoric)', text: 'I will buy your boring brick company for a CRAZY price! Bricks are the future!',
      left: { label: 'Bricks are forever', fx: { calm: 6, cash: -4 } }, right: { label: 'Sell the bricks', fx: { cash: 16, holders: -6 } } },
    { id: 'charlie-xmas', who: 'charlie', name: 'Charlie', text: 'The candy company had a record Christmas. Raise prices again?',
      left: { label: 'Be nice this year', fx: { holders: 6, cash: -6 } }, right: { label: 'Raise prices', fx: { cash: 12, holders: -4, fizz: 4 } } },
    // follow-ups (only via `then`)
    { id: 'bro-fizzcoin-dip', who: 'cryptoBro', name: 'Crypto Bro', text: 'Bro... about Fizzcoin. It is at zero. Want to buy the dip?', followUp: true,
      left: { label: 'Never again', fx: { calm: 10 } }, right: { label: 'Buy the dip', fx: { cash: -12, calm: -10 } } },
    { id: 'bank-margin', who: 'banker', name: 'The Banker', text: 'MARGIN CALL. The market dropped and the bank wants its money. Today.', followUp: true,
      left: { label: 'Sell a business', fx: { cash: 8, holders: -16 } }, right: { label: 'Pay in cash', fx: { cash: -26 } } },
    { id: 'charlie-mill-again', who: 'charlie', name: 'Charlie', text: 'About that textile mill. It lost money. Again. Twenty years in a row.', followUp: true,
      left: { label: 'Close it', fx: { cash: -8, holders: -4, calm: 6 } }, right: { label: 'Keep it', fx: { cash: -12, calm: 6 } } },
];

// ── tiny engine (shared by the UI and the balance sim) ──────────────────────
export function newRun() {
    return { meters: { cash: 50, holders: 50, calm: 50, fizz: 50 }, age: START_AGE, seen: [], queue: [], used: new Set(), ending: null, choices: 0 };
}
export const clamp = (v) => Math.max(0, Math.min(100, v));

/** pick the next card: queued follow-up first (after a short delay), else a weighted pick avoiding recent repeats */
export function nextCard(run, rnd) {
    const due = run.queue.find(q => q.at <= run.choices);
    if (due) { run.queue = run.queue.filter(q => q !== due); return CARDS.find(c => c.id === due.id); }
    const recent = new Set(run.seen.slice(-10));
    const pool = CARDS.filter(c => !c.followUp && !recent.has(c.id) && !(c.once && run.used.has(c.id)));
    return pool[Math.floor(rnd() * pool.length)];
}

export function choose(run, card, side) {
    const opt = card[side];
    for (const [k, v] of Object.entries(opt.fx)) run.meters[k] = clamp(run.meters[k] + Math.round(v * FX_SCALE));
    for (const [k, v] of Object.entries(DRIFT)) run.meters[k] = clamp(run.meters[k] + v);
    run.seen.push(card.id); run.used.add(card.id); run.choices += 1;
    run.age += YEARS_PER_CARD;
    if (opt.then) run.queue.push({ id: opt.then, at: run.choices + 2 });
    if (run.age >= END_AGE) { run.ending = 'emeritus'; return run.ending; }   // reaching 96 wins, even on a tipping swipe
    for (const m of METERS) {
        if (run.meters[m.id] <= 0) { run.ending = `${m.id}-0`; break; }
        if (run.meters[m.id] >= 100) { run.ending = `${m.id}-100`; break; }
    }
    return run.ending;
}
