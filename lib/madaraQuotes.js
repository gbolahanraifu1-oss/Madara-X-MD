// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Madara Uchiha Quote Footers        ║
// ║   Short, dark, in-character lines used to brand     ║
// ║   menu / alive / welcome / goodbye messages          ║
// ║   Same no-repeat-twice-in-a-row rotation as the      ║
// ║   menu banner slideshow (lib/menuBanner.js) — keyed  ║
// ║   per-user, per-category.                            ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const BRAND = '© MADARA X-MD | INC.';

const QUOTES = {
    // ── Menu ──────────────────────────────────────────────────────────────
    menu: [
        'Wake up to reality.',
        'This is the world of the strong.',
        'Only the weak seek peace.',
        'The future is not a straight path.',
        'Power is everything.',
        'I will create a new world.',
        'In this world, wherever there is light, there are always shadows.',
        'I have no interest in ordinary people.',
        'A shinobi who breaks the rules is trash, but one who abandons his friends is worse.',
        'There was no such thing as peace to begin with.',
        'Dreams are not given. They are seized.',
        'The strong live and the weak die. That is the law of this world.',
        'Whoever controls the battlefield, controls the war.',
        'History is written by the victors.',
    ],
    // ── Alive — presence / survival ─────────────────────────────────────────
    alive: [
        'I am the ghost of the Uchiha.',
        'I am still here... watching.',
        'Power never sleeps.',
        'A true shinobi is one who endures.',
        'The longer you live, the more you realize reality is just a cruel dream.',
        'The Uchiha name will never die. I am the future.',
        'Death is not the end. It is a beginning.',
        'I have transcended what you call life.',
        'You cannot kill a ghost that refuses to rest.',
        'Time bends. I do not.',
        'Even in silence, I am the loudest presence in the room.',
    ],
    // ── Welcome — inspirational / strong ────────────────────────────────────
    welcome: [
        'Those who cannot protect anything cannot hope to achieve anything.',
        'I will carry the hope of the clan on my shoulders.',
        'Love breeds sacrifice... and sacrifice breeds hatred.',
        'Those who abandon their friends are worse than scum.',
        'A new chapter begins. Prove your strength.',
        'Every legend starts with a single step into the unknown.',
        'Welcome, warrior. The clan grows stronger.',
        'A new shadow joins the light. Rise well.',
        'The strong are not born — they are forged here.',
    ],
    // ── Goodbye — cold / dramatic / philosophical ────────────────────────────
    goodbye: [
        'The weak will always be discarded.',
        'Farewell... the cycle continues without you.',
        'Nothing ever goes as planned in this world.',
        'Even the strongest shadows fade eventually.',
        'The path splits here. We will not walk it together again.',
        'Not every story needs an ending worth remembering.',
        'The battlefield remembers no names, only outcomes.',
        'Some leave quietly. Some leave as legends. Choose wisely next time.',
        'A tree with dead branches grows stronger without them.',
    ],
};

// ── Per-category, per-user "last shown" tracker — mirrors
// lib/menuBanner.js exactly, so quotes rotate the same way banners do:
// no repeat twice in a row for the same user, tracked globally across
// every chat/group they're in.
const _lastShown = new Map(); // key: `${category}:${userId}` -> quote

function pick(list, category, userId) {
    if (list.length === 1) return list[0];
    if (!userId) return list[Math.floor(Math.random() * list.length)];

    const key  = `${category}:${userId}`;
    const last = _lastShown.get(key);
    let choice;
    do {
        choice = list[Math.floor(Math.random() * list.length)];
    } while (choice === last);

    _lastShown.set(key, choice);
    return choice;
}

/**
 * Returns just the quote text (no branding) — for callers that want to
 * place it inline within their own custom box/footer layout.
 * Pass userId (e.g. ctx.sender) to get the no-repeat-twice-in-a-row
 * rotation, same as the menu banner slideshow.
 */
function getQuote(category = 'menu', userId = null) {
    const list = QUOTES[category] || QUOTES.menu;
    return pick(list, category, userId);
}

/**
 * Returns a formatted footer block:
 *   ✧ {quote}
 *   ✧ © MADARA X-MD | INC.
 */
function quoteFooter(category = 'menu', userId = null) {
    const quote = getQuote(category, userId);
    return `\n\n✧ ${quote}\n✧ ${BRAND}`;
}

module.exports = { QUOTES, getQuote, quoteFooter };
