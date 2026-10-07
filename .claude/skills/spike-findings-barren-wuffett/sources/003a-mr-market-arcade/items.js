/**
 * items.js — pixel sprites for the things Mr. Market throws (Spike 003a).
 * Same row/palette format as ../002-old-barren-cast/cast.js, so cast.renderCanvas() draws them.
 */

const PAL = {
    K: '#1c1824', X: '#ffffff', Z: '#b9bfcc', z: '#7d8496',
    G: '#5fd068', n: '#2e8a3e', N: '#1f5c2b',
    Y: '#f2c23d', y: '#b8862a', O: '#ff9a2e',
    R: '#e04848', r: '#9c2a33', P: '#ff9db0',
    U: '#9fdcff', u: '#5aa7e0', W: '#f6ecd2', w: '#d9c9a4', B: '#7a4a2c', b: '#523019',
};

const mk = (rows) => ({ w: rows[0].length, h: rows.length, rows, pal: PAL });

export const ITEMS = {
    // a dollar bill — the plain bargain
    bill: mk([
        'KKKKKKKKKKKKKKKK',
        'KGGGGGGGGGGGGGGK',
        'KGnnGGGGGGGGnnGK',
        'KGnGGGGXXGGGGnGK',
        'KGGGGGXnnXGGGGGK',
        'KGGGGGXnnXGGGGGK',
        'KGnGGGGXXGGGGnGK',
        'KGnnGGGGGGGGnnGK',
        'KGGGGGGGGGGGGGGK',
        'KKKKKKKKKKKKKKKK',
    ]),
    // a sturdy little business — the big bargain
    shop: mk([
        '.....KKKKKK.....',
        '....KYYYYYYK....',
        '....KYyYYyYK....',
        '..KKKKKKKKKKKK..',
        '.KRXRXRXRXRXRXK.',
        '.KRXRXRXRXRXRXK.',
        '..KKKKKKKKKKKK..',
        '..KWWWWWWWWWWK..',
        '..KWUUKWWBBBWK..',
        '..KWUuKWWBbBWK..',
        '..KWKKKWWBBBWK..',
        '..KWWWWWWBYBWK..',
        '..KwwwwwwBBBwK..',
        '..KKKKKKKKKKKK..',
    ]),
    // a speculative bubble with a $ inside — greed junk
    bubble: mk([
        '.....KKKKK.....',
        '...KKUUUUUKK...',
        '..KUXXuuuuuUK..',
        '.KUXXuuYYuuuUK.',
        '.KUXuuYYYYuuUK.',
        'KUuuuuYYuuuuuUK',
        'KUuuuuuYYuuuuUK',
        'KUuuuuuuYYuuuUK',
        'KUuuuuYYYYuuuUK',
        '.KUuuuuYYuuuUK.',
        '.KUuuuuuuuuuUK.',
        '..KUuuuuuuuUK..',
        '...KKUUUUUKK...',
        '.....KKKKK.....',
    ]),
    // a meme-stock rocket, nose DOWN (it is crashing) — greed junk
    rocket: mk([
        '....KOYOK...',
        '....KYOYK...',
        '...KKKKKKK..',
        '..KRKZZZKRK.',
        '..KRKZZZKRK.',
        '..KKKZZZKKK.',
        '....KZZZK...',
        '....KZUZK...',
        '....KZuZK...',
        '....KZZZK...',
        '....KZZZK...',
        '.....KZK....',
        '.....KRK....',
        '......K.....',
    ]),
    // Fizzcoin — crypto parody — greed junk
    coin: mk([
        '...KKKKKK...',
        '..KYYYYYYK..',
        '.KYXYYYYyYK.',
        'KYXYKKKKyYYK',
        'KYYYKyyyYYYK',
        'KYYYKKKyYYYK',
        'KYYYKyyyYYYK',
        'KYYYKyYYYyYK',
        '.KYYYYYYyYK.',
        '..KYyyyyYK..',
        '...KKKKKK...',
    ]),
    // a falling knife, point down — panic hazard
    knife: mk([
        '.KKKK.',
        'KBbBBK',
        'KBBbBK',
        'KBbBBK',
        'KKKKKK',
        '.KZXK.',
        '.KZXK.',
        '.KZXK.',
        '.KZXK.',
        '.KZXK.',
        '.KZXK.',
        '.KzXK.',
        '..KzK.',
        '..KK..',
    ]),
    // Charlie's power-up: a "NO." speech bubble — blocks the next bad catch
    charlie: mk([
        '.KKKKKKKKKKK.',
        'KXXXXXXXXXXXK',
        'KXRXXRXXRRXXK',
        'KXRRXRXRXXRXK',
        'KXRXRRXRXXRXK',
        'KXRXXRXXRRXXK',
        'KXXXXXXXXXXXK',
        '.KKKXXKKKKKK.',
        '...KXK.......',
        '...KK........',
    ]),
    heart: mk([
        '.KK.KK.',
        'KRRKRRK',
        'KRPRRRK',
        'KRRRRRK',
        '.KRRRK.',
        '..KRK..',
        '...K...',
    ]),
    heartEmpty: mk([
        '.KK.KK.',
        'KzzKzzK',
        'KzzzzzK',
        'KzzzzzK',
        '.KzzzK.',
        '..KzK..',
        '...K...',
    ]),
};
