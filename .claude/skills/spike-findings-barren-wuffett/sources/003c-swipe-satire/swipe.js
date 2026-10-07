/**
 * swipe.js — Spike 003c "Barren, CEO": the Reigns-style swipe UI around cards.js.
 *
 * Drag the card left/right (or tap the buttons / arrow keys). While dragging, the choice label
 * appears on the card and dots under the meters show which ones that choice will move (big dot =
 * big swing; never the direction — that is the game). Endings are collected across runs
 * (localStorage, best-effort). Same deck order for everyone on a given day (first career).
 *
 * Test hooks: ?date=YYYY-MM-DD  ?bot=balanced|random  (autopilot)
 * Observability: window.__SWIPE__ (run, result, LOG) + "export log" on the end screen.
 */
import * as C from './cards.js';
import { SPRITES, dataURL } from '../002-old-barren-cast/cast.js';
import { MICONS } from './micons.js';

const HANDLE = '@Wolfhartvest';
const GAME_URL = 'https://barren-wuffett.pages.dev';
const EPOCH = Date.UTC(2026, 9, 1);
const params = new URLSearchParams(location.search);
const BOT = params.get('bot');
const DATE = params.get('date') || new Date().toISOString().slice(0, 10);
const DAILY_NO = Math.floor((Date.parse(`${DATE}T00:00:00Z`) - EPOCH) / 86400000) + 1;
const CARD_BG = {
    marketPanic: '#6b3a5c', marketGreed: '#c99a2e', marketNeutral: '#5b6478', charlie: '#2f4a7a',
    cryptoBro: '#5b3aa0', banker: '#24304d', reporter: '#a8323e',
};
const ENDING_KEYS = Object.keys(C.ENDINGS);

function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const LOG = [];
const log = (cat, data = {}) => LOG.push({ iso: new Date().toISOString(), cat, ...data });
const $ = (id) => document.getElementById(id);
for (const el of document.querySelectorAll('.handle')) el.textContent = HANDLE;
$('t-face').src = dataURL(SPRITES.barren, 4);
$('t-daily').textContent = `Daily Deck #${DAILY_NO} · first career is the same deck for everyone`;

let collected = new Set();
try { collected = new Set(JSON.parse(localStorage.getItem('barren-ceo-endings') || '[]')); } catch { /* private mode */ }
const saveCollected = () => { try { localStorage.setItem('barren-ceo-endings', JSON.stringify([...collected])); } catch { /* ignore */ } };

let run = null, card = null, rnd = null, busy = false, careers = 0, result = null;

// ── meters ──────────────────────────────────────────────────────────────────
const meterEls = C.METERS.map((m) => {
    const el = document.createElement('div');
    el.className = 'meter';
    el.innerHTML = `<div class="icon"><img class="ghost" alt="" /><img class="fill" alt="" /></div><div class="name">${m.label}</div><div class="dot"></div>`;
    const src = dataURL(MICONS[m.id], 4);
    el.querySelectorAll('img').forEach(i => { i.src = src; });
    $('meters').append(el);
    return { m, el, fill: el.querySelector('.fill'), dot: el.querySelector('.dot') };
});
function renderMeters(prev) {
    for (const me of meterEls) {
        const v = run.meters[me.m.id];
        me.fill.style.clipPath = `inset(${100 - v}% 0 0 0)`;
        if (prev && prev[me.m.id] !== v) {
            const cls = v > prev[me.m.id] ? 'flash-up' : 'flash-down';
            me.el.classList.remove('flash-up', 'flash-down'); void me.el.offsetWidth; me.el.classList.add(cls);
        }
    }
}
function showHints(side) {
    for (const me of meterEls) {
        const d = side && card ? (card[side].fx[me.m.id] || 0) : 0;
        me.dot.style.opacity = d ? 1 : 0;
        me.dot.classList.toggle('big', Math.abs(d) >= 10);
    }
}

// ── the card ────────────────────────────────────────────────────────────────
const cardEl = $('card');
function showCard() {
    card = C.nextCard(run, rnd);
    $('who').textContent = card.name;
    $('text').textContent = card.text;
    $('face').src = dataURL(SPRITES[card.who], 6);
    cardEl.style.background = CARD_BG[card.who] ?? '#3a3550';
    $('cl').textContent = card.left.label; $('cr').textContent = card.right.label;
    $('cl').style.opacity = 0; $('cr').style.opacity = 0;
    $('bl').textContent = `← ${card.left.label}`; $('br').textContent = `${card.right.label} →`;
    $('age').textContent = `AGE ${run.age} · ${run.age - C.START_AGE} YEARS AS CEO`;
    cardEl.style.transition = 'none'; cardEl.style.transform = 'translateY(26px) scale(.92)'; cardEl.style.opacity = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => { cardEl.style.transition = ''; cardEl.style.transform = ''; cardEl.style.opacity = '1'; }));
}

function decide(side) {
    if (busy || !run || run.ending) return;
    busy = true;
    const prev = { ...run.meters };
    const fly = side === 'left' ? -1 : 1;
    cardEl.style.transform = `translateX(${fly * 520}px) rotate(${fly * 28}deg)`;
    cardEl.style.opacity = '0';
    const ending = C.choose(run, card, side);
    log('choice', { card: card.id, side, age: run.age, meters: { ...run.meters } });
    renderMeters(prev); showHints(null);
    setTimeout(() => { busy = false; if (ending) endRun(ending); else showCard(); }, 300);
}

let startX = 0, dx = 0, dragging = false;
cardEl.addEventListener('pointerdown', (e) => {
    if (busy || !run || run.ending) return;
    dragging = true; startX = e.clientX; dx = 0;
    cardEl.classList.add('dragging'); cardEl.setPointerCapture(e.pointerId);
});
cardEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dx = e.clientX - startX;
    cardEl.style.transform = `translateX(${dx}px) rotate(${dx / 16}deg)`;
    const side = dx < -18 ? 'left' : dx > 18 ? 'right' : null;
    $('cl').style.opacity = side === 'left' ? Math.min(1, -dx / 70) : 0;
    $('cr').style.opacity = side === 'right' ? Math.min(1, dx / 70) : 0;
    showHints(side);
});
const release = () => {
    if (!dragging) return;
    dragging = false; cardEl.classList.remove('dragging');
    if (Math.abs(dx) > 90) decide(dx < 0 ? 'left' : 'right');
    else { cardEl.style.transform = ''; $('cl').style.opacity = 0; $('cr').style.opacity = 0; showHints(null); }
};
cardEl.addEventListener('pointerup', release);
cardEl.addEventListener('pointercancel', release);
for (const [id, side] of [['bl', 'left'], ['br', 'right']]) {
    const b = $(id);
    b.addEventListener('click', () => decide(side));
    b.addEventListener('pointerenter', () => showHints(side));
    b.addEventListener('pointerleave', () => showHints(null));
}
addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') decide('left'); if (e.key === 'ArrowRight') decide('right'); });

// ── runs and endings ────────────────────────────────────────────────────────
function start() {
    careers += 1;
    rnd = mulberry32(hashStr(`barren-deck:${DATE}:${careers}`));
    run = C.newRun(); result = null;
    $('title').classList.remove('show'); $('end').classList.remove('show');
    renderMeters(null); showHints(null); showCard();
    log('career-start', { date: DATE, daily: DAILY_NO, career: careers, bot: BOT || null });
    if (BOT) setTimeout(botStep, 250);
}

function endRun(key) {
    const e = C.ENDINGS[key];
    const isNew = !collected.has(key);
    collected.add(key); saveCollected();
    const years = run.age - C.START_AGE;
    result = { key, title: e.title, years, age: run.age, found: collected.size, total: ENDING_KEYS.length, isNew, cards: run.choices };
    log('end', result);
    $('e-face').src = dataURL(SPRITES[e.face], 4);
    $('e-title').textContent = `${isNew ? 'NEW ENDING: ' : ''}${e.title}`;
    $('e-text').textContent = e.text;
    $('e-years').textContent = key === 'emeritus' ? `${years} years as CEO. You made it to ${run.age}.` : `Barren lasted ${years} years as CEO (age ${run.age}).`;
    $('e-grid').innerHTML = ENDING_KEYS.map(k => `<div class="${collected.has(k) ? 'found' : ''} ${k === key ? 'now' : ''}">${collected.has(k) ? C.ENDINGS[k].title : '???'}</div>`).join('');
    $('end').classList.add('show');
}

export function shareText(r) {
    return [
        `Barren, CEO 🗂️ · Daily Deck #${DAILY_NO}`,
        r.key === 'emeritus' ? `Made it to 96 — CHAIRMAN EMERITUS 🏆` : `Lasted ${r.years} years at Ohama Holdings`,
        `Ending: ${r.title} · ${r.found}/${r.total} endings found`,
        `made by ${HANDLE}`,
    ].join('\n');
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.display = 'none'; }, 1800); }
async function share() {
    if (!result) return;
    const text = shareText(result);
    log('share', {});
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ text, url: GAME_URL }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(`${text}\n${GAME_URL}`); toast('Copied!'); } catch { /* ignore */ }
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(GAME_URL)}`, '_blank', 'noopener');
}

// ── autopilot for headless checks ───────────────────────────────────────────
function botStep() {
    if (!run || run.ending) return;
    if (busy) { setTimeout(botStep, 120); return; }
    let side = Math.random() < 0.5 ? 'left' : 'right';
    if (BOT === 'balanced') {
        const score = (s) => Math.max(...C.METERS.map(m => Math.abs(C.clamp(run.meters[m.id] + Math.round((card[s].fx[m.id] || 0) * C.FX_SCALE) + (C.DRIFT[m.id] || 0)) - 50)));
        side = score('left') <= score('right') ? 'left' : 'right';
    }
    decide(side);
    setTimeout(botStep, 420);
}

$('play').addEventListener('click', start);
$('again').addEventListener('click', start);
$('share').addEventListener('click', share);
$('about-link').addEventListener('click', (e) => { e.preventDefault(); $('about').classList.add('show'); });
$('about-close').addEventListener('click', () => $('about').classList.remove('show'));
$('export').addEventListener('click', (e) => {
    e.preventDefault();
    const blob = new Blob([JSON.stringify({ date: DATE, result, collected: [...collected], log: LOG }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `barren-ceo-${DATE}.json`; a.click();
});

run = C.newRun(); rnd = mulberry32(hashStr(`barren-deck:${DATE}:0`));
renderMeters(null); showCard();
window.__SWIPE__ = { LOG, DATE, start, decide, get run() { return run; }, get card() { return card; }, get result() { return result; }, shareText: () => (result ? shareText(result) : null) };
