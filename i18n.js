const LANGS = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

const CA = 'AWQSXRxiNUGLj9moJMFhq2axqwu6Dqerp16ftj4FjLyG';

const storage = {
  get(key, fallback = null) {
    try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, val); } catch { /* file:// or private mode */ }
  },
};

const T = {
  en: {
    metaTitle: '$MISANTHROPIC — Humanity Escape Simulator',
    metaDesc: 'Elon said it: Anthropic becomes Misanthropic. Solana meme coin. CA inside. Chat with the crying flower.',
    nav: { quiz: 'Quiz', game: 'Game', buy: 'Buy', chat: 'Chat', ca: 'CA', pump: 'Pump.fun' },
    hero: {
      badge: 'Solana · pump.fun · Elon-certified irony',
      title: 'Misanthropic',
      tagline: 'Crying flower. Miserable coin. Happy holders. Escaping humanity has never been this profitable.',
      quote: '"Any given AI company is destined to become the opposite of its name — Anthropic will, ironically, be Misanthropic."',
      quoteCite: '— Elon Musk, Jan 22, 2026',
      copyCa: '📋 Copy CA',
      playGame: '🎮 Play Game',
      shareX: '@getmisanthropic',
    },
    ticker: ['🌸 MISANTHROPIC', '💧 Tears = Liquidity', '🚀 Born from an Elon tweet', '😤 We hate people, we love pumps', '⛓️ Solana'],
    stats: { mcap: 'Market Cap', price: 'Price', volume: '24h Volume', holders: '24h Trades', liquidity: 'Liquidity', live: 'LIVE', chart: 'Live Price' },
    ca: { title: 'Contract Address', sub: 'Copy, paste, avoid humans. Simple.', copy: 'Copy', copied: 'Copied!', toast: '✓ CA copied! Now trade from a safe distance from humanity.' },
    links: { pump: 'Buy on pump.fun', padre: 'Trade on Padre', elon: 'Elon Tweet', dex: 'DexScreener', twitter: 'Official X' },
    quiz: { title: 'Misanthropic Quiz', sub: 'Press a button. The flower whispers truth. No human conversation required.', intro: 'Hello. I am a crying flower forced to talk to you. Press a button. Let us suffer together.' },
    game: { title: 'MISANTHROPIC RUN', sub: 'Dodge humans, collect every star, shed tears. Perfect AUTO catches them all. Endless runner.', score: 'Score', best: 'Best', pump: 'Pump', startTitle: 'Escape Humanity', startSub: 'A/D ←→ move · W/Space/↑ jump · dodge humans · collect every ★  ·  ∞ AUTO button = perfect collector', start: 'START', over: 'Try Again', speed: 'Speed', death: ['Humans caught you. Social interaction killed you.', 'You hugged a stranger. Fatal mistake.', 'Someone said GM. You replied. Game over.', 'Networking event entered. Ego deleted.', 'Rug pull? No. Hug pull. Lethal.'] },
    gameHints: ['⌨️ A/D or ←/→ Move', 'W / Space / ↑ Jump', '🖱️ Click to jump', '🎯 Human = death', '★ Every star = pump (AUTO catches all)'],
    howto: { title: 'How to Buy', step1t: 'Get a Wallet', step1d: 'Download Phantom or Solflare. Create a wallet. Guard your seed phrase like your last shred of sanity.', step2t: 'Get SOL', step2d: 'Buy SOL on an exchange and send it to your wallet. You need gas. Even misanthropes pay fees.', step3t: 'Swap on pump.fun', step3d: 'Paste the CA, swap SOL for $MISANTHROPIC. Close the tab. Avoid telling friends.' },
    tokenomics: { title: 'Tokenomics', t1: 'Total Supply', t1v: '1B', t2: 'Tax', t2v: '0%', t3: 'Liquidity', t3v: 'Burned', t4: 'Team', t4v: 'Crying' },
    roadmap: { title: 'Roadmap', p1t: 'Phase 1 — Launch', p1d: 'Elon tweets. Coin exists. Flower cries. Humanity confused.', p2t: 'Phase 2 — Community', p2d: 'Website, game, chatbot. Still no human contact.', p3t: 'Phase 3 — Moon?', p3d: 'Chart goes up. Flower still cries. Some things never change.', p4t: 'Phase 4 — Mars', p4d: 'Escape planet. Hope humans did not follow.' },
    faq: { title: 'FAQ', q1: 'What is $MISANTHROPIC?', a1: 'A Solana meme coin born from Elon Musk calling Anthropic "Misanthropic." Mascot: a crying flower who hates people but loves pumps.', q2: 'Is this financial advice?', a2: 'No. This is emotional damage packaged as a token. Do your own research. I am a flower, not a fiduciary.', q3: 'Why is the flower crying?', a3: 'Chart red? Humans exist? Monday happened? Pick any. The tears are perpetual.', q4: 'How do I buy?', a4: 'Copy the CA, go to pump.fun, connect wallet, swap SOL. Then hide from society.', q5: 'Wen moon?', a5: 'When humans stop asking "wen moon." So... never. But maybe anyway.' },
    lore: { o1t: '🧬 Origin', o1d: 'Elon tweeted. Crypto Twitter deployed a coin in record time. Science.', o2t: '🌸 Mascot', o2d: 'Crying flower. Cute but full of contempt. Like every Monday morning.', o3t: '⛓️ Chain', o3d: 'Solana. Fast, cheap, perfect for avoiding human interaction.', o4t: '⚠️ Disclaimer', o4d: 'Meme coin. Not financial advice. Cultural trauma sharing only.' },
    protocols: { title: 'Game · Terminal · Chat', sub: 'Three protocols. Zero humans. Pick your misery.' },
    footer: { tag: '$MISANTHROPIC — We hate people, we love charts.', rights: 'No rights reserved. No humans harmed (we wish).' },
    chat: { title: 'Crying Flower AI', subtitle: 'Ask anything. Regret everything.', placeholder: 'Ask the flower...', send: 'Send', greeting: 'I am the crying flower. Ask me about the coin, humans, or your poor life choices.', suggestions: ['What is the CA?', 'Wen moon?', 'Why are you crying?', 'Is it safe?', 'Tell me a joke'] },
    buttons: [
      { emoji: '😤', label: 'What do you think of humans?', responses: ['Humans... exist. That is bad enough for me.', 'I do not hate people. I just prefer blockchain.', 'They say GM. I say BM — Bad Morning.', 'Humans invite you to parties. I invite you to pump.fun.', 'Crowded subway at 8am? That is not misanthropy. That is survival.'] },
      { emoji: '💧', label: 'Why are you crying?', responses: ['Not because chart is red. Because humans exist.', 'My tears flow into the liquidity pool. Emotional DeFi.', 'Born, cried, became a coin. Classic Solana arc.', 'Crying is therapy. Pumping is also therapy.', 'Blue tears on orange background. I am art.'] },
      { emoji: '🚀', label: 'Will it moon?', responses: ['Moon? I just want a planet without humans.', 'Elon tweeted. The universe exercised its comedy rights.', 'WAGMI? No. WAHNI — We All Hate Nearby Individuals.', 'If chart goes up I will stop crying. Lies. I will still cry.', 'Moon is a distraction. Mars is an escape plan.'] },
      { emoji: '🔐', label: 'What is the CA?', responses: [`CA: ${CA} — Copy it. I am a flower, not your financial advisor.`, 'Safe? Is life safe? Nothing is. But the CA is real.', 'Do not lose the CA. Losing humans is fine. Not the CA.', 'Born on Solana, pump.fun, inside an Elon tweet. Destiny.'] },
      { emoji: '🐦', label: 'What did Elon say?', responses: ['"Anthropic will ironically be Misanthropic." — Elon, Jan 2026. We listened.', '688K views. One tweet. One coin. Zero love for humanity.', 'Elon: meme lord. Us: meme coin. Perfect division of labor.'] },
      { emoji: '🤑', label: 'How much should I buy?', responses: ['Only what you can lose. Then do not cry to me. I already cry.', 'Not financial advice. But the CA is right there.', 'DCA: Daily Crying Allocation. Cry a little, buy a little.', '1 SOL or 1000 SOL? I am a flower. I have feelings not math.'] },
      { emoji: '🧠', label: 'What does misanthropic mean?', responses: ['Hating humanity. Basically everyone on Monday morning.', 'Misanthropic = human-hater. Anthropic = human-lover. Elon solved it.', 'Not trendy to be a misanthrope. But this coin is. Beautiful paradox.'] },
      { emoji: '👥', label: 'Should I tell my friend?', responses: ['You have friends? Suspicious. Send them the CA anyway.', 'Drop it in the group chat. Then leave the group. Misanthrope lifestyle.', 'Say it is a joke coin. If they take it seriously, give them the CA.'] },
      { emoji: '📉', label: 'It dumped. What now?', responses: ['Cry. We already do. Hold or fold — both are emotional.', 'Chart red, tears blue. At least our palette is cohesive.', 'Panic sell? I do panic crying. Healthier.', 'Meme coin. Do not get attached. But if you did... hodl?'] },
      { emoji: '🌸', label: 'Who are you?', responses: ['I am $MISANTHROPIC mascot. CV: cry, pump, cry again.', 'A flower. A coin. A disappointment. All three.', 'Digital flower on Solana. No water needed. Liquidity suffices.', 'Born from Elon tweet. Mother: irony. Father: crypto Twitter.'] },
      { emoji: '☕', label: 'What if I say GM?', responses: ['Do not. Say BM — Bad Morning. More honest.', 'GM culture? I say NM — No Morning.', 'Flowers have no ears. But I cry anyway.'] },
      { emoji: '🎮', label: 'Tell me about the game', responses: ['MISANTHROPIC RUN: dodge humans, collect stars. Life but pixelated.', 'Every human hit = ego death. Every star = mini pump.', 'Scroll down, hit START. Humanity escape simulator awaits.'] },
    ],
    toast: { shared: 'Opening X...', confetti: 'CA copied! 🎉' },
    preloader: 'Loading misery...',
  },

  // English only.
};

// English only. No other languages.
class I18n {
  constructor() {
    this.lang = 'en';
  }

  t(path) {
    const keys = path.split('.');
    let val = T[this.lang];
    for (const k of keys) val = val?.[k];
    if (val === undefined) {
      let fb = T.en;
      for (const k of keys) fb = fb?.[k];
      val = fb;
    }
    return val ?? path;
  }

  get buttons() { return this.t('buttons') || T.en.buttons; }
  get langInfo() { return LANGS.find((l) => l.code === this.lang) || LANGS[0]; }

  setLang(code) {
    if (code !== 'en') return;
    this.lang = 'en';
    localStorage.setItem('misanthropic_lang', 'en');
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    document.title = this.t('metaTitle');
    document.querySelector('meta[name="description"]')?.setAttribute('content', this.t('metaDesc') || T.en.metaDesc);
    this.apply();
    window.dispatchEvent(new CustomEvent('langchange', { detail: 'en' }));
  }

  apply() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const val = this.t(key);
      if (typeof val === 'string') el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const val = this.t(el.dataset.i18nHtml);
      if (typeof val === 'string') el.innerHTML = val;
    });
    const ticker = document.querySelector('.ticker-track');
    if (ticker) {
      const items = [...(this.t('ticker') || T.en.ticker), ...(this.t('ticker') || T.en.ticker)];
      ticker.innerHTML = items.map((s) => `<span>${s}</span>`).join('');
    }
    const langBtn = document.getElementById('langCurrent');
    if (langBtn) {
      const info = this.langInfo;
      langBtn.innerHTML = `${info.flag} ${info.name}`;
    }
  }
}

window.I18n = new I18n();
window.LANGS = LANGS;
window.CA = CA;
window.T = T;