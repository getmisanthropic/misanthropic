const CHAT_INTENTS = {
  greeting: {
    keys: ['hi','hello','hey','gm','gn','sup','yo','hola','bonjour','ciao','ola','привет','你好','こんにちは','안녕','مرحبا','namaste','xin chào','สวัสดี','cześć','hallo','hej'],
    en: ['Oh great. Another human. What do you want?', 'GM? Try BM — Bad Morning. Now ask your question.', 'You talked to me voluntarily. That is very un-misanthropic of you.', 'Hello. I was crying peacefully until you arrived.'],
  },
  ca: {
    keys: ['ca','contract','address','awqs','copy','mint','token address'],
    en: [`CA: ${window.CA || 'AWQSXRxiNUGLj9moJMFhq2axqwu6Dqerp16ftj4FjLyG'} — Copy it from the site. I am a flower, not a broker.`, 'Paste it on pump.fun. Then disappear from society. That is the way.', 'Do not lose the CA. Losing friends is fine. Not the CA.'],
  },
  moon: {
    keys: ['moon','pump','lambo','rich','100x','1000x','ath','wen','when moon','price','mcap','market cap'],
    en: ['Moon? I want a planet WITHOUT humans. That is the real goal.', 'WAGMI? No. WAHNI — We All Hate Nearby Individuals.', 'If chart goes green I might smile. Lies. I will cry harder because humans will notice.', 'Price up, tears down? Never. Tears are eternal.'],
  },
  cry: {
    keys: ['cry','crying','tear','sad','why sad','tears'],
    en: ['I cry because humans exist. Also Mondays. Also red candles. Pick one.', 'My tears are blue. Chart is red. We are aesthetically balanced.', 'Crying is my utility. Tears = liquidity. You are welcome.', 'I was born crying. Became a coin. Still crying. Arc complete.'],
  },
  humans: {
    keys: ['human','people','person','society','friend','social','party','crowd'],
    en: ['Humans are like gas fees — unavoidable and painful.', 'I do not hate people. I just prefer 10,000x more distance.', 'Every group chat is a rug pull waiting to happen.', 'Humans invented small talk. That alone justifies misanthropy.'],
  },
  elon: {
    keys: ['elon','musk','tweet','anthropic','x.com','twitter'],
    en: ['Elon said Anthropic will be Misanthropic. We listened. Crypto Twitter deployed. Science.', '688K views. One tweet. One coin. Zero love for humanity.', 'Elon is in space. We are on chain. Perfect labor division.'],
  },
  buy: {
    keys: ['buy','how to','purchase','swap','get','acquire'],
    en: ['1. Get Phantom wallet. 2. Buy SOL. 3. Go pump.fun, paste CA, swap. 4. Hide from friends.', 'Copy CA from the site. pump.fun. Connect wallet. Swap. Close tab. Exist quietly.', 'How to buy? With courage and a tolerance for crying flowers.'],
  },
  safe: {
    keys: ['safe','rug','scam','honeypot','secure','legit','trust'],
    en: ['Safe? Is life safe? Do your own research. I am a crying flower, not SEC.', 'Rug pull? I am a flower. I have no rug. You have due diligence.', 'Trust no one. Especially humans. Copy CA yourself. Verify on pump.fun.'],
  },
  game: {
    keys: ['game','play','run','jump','score','misanthropic run'],
    en: ['MISANTHROPIC RUN: dodge humans, collect stars. Scroll down and hit START.', 'Every human collision = ego death. Every star = mini pump.', 'Space to jump. Humans to avoid. Like real life but pixelated.'],
  },
  joke: {
    keys: ['joke','funny','lol','haha','meme','laugh'],
    en: ['Why did the misanthrope buy crypto? Humans do not ask for your seed phrase at 3am. Wait, they do. Never mind.', 'What is a misanthrope favorite blockchain? Solana — fast escapes from conversations.', 'I told a human I was a meme coin. They said "same."'],
  },
  thanks: {
    keys: ['thank','thanks','ty','thx'],
    en: ['Do not thank me. I did not want this interaction. But you are welcome I guess.', 'Gratitude noted. Emotion simulated. Back to crying.', 'Thanks accepted. Human contact quota fulfilled for the decade.'],
  },
};

const FALLBACK_EN = [
  'I did not understand. But I rarely understand why humans talk to me.',
  'Interesting. Wrong, but interesting. Try asking about CA, moon, or why I cry.',
  'My petals are not trained on that. Ask about the coin, humans, or the game.',
  'That question triggered my fight-or-flight. I chose cry.',
  'Humans and their questions. Copy the CA and let us both move on.',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getChatResponse(text) {
  const lower = text.toLowerCase().trim();

  for (const intent of Object.values(CHAT_INTENTS)) {
    if (intent.keys.some((k) => lower.includes(k))) {
      return pick(intent.en);
    }
  }

  return pick(FALLBACK_EN);
}

class Chatbot {
  constructor() {
    this.open = false;
    this.typing = false;
    this.messages = [];
    this.els = {};
  }

  init() {
    this.els.panel = document.getElementById('chatPanel');
    this.els.toggle = document.getElementById('chatToggle');
    this.els.close = document.getElementById('chatClose');
    this.els.messages = document.getElementById('chatMessages');
    this.els.input = document.getElementById('chatInput');
    this.els.send = document.getElementById('chatSend');
    this.els.suggestions = document.getElementById('chatSuggestions');

    this.els.toggle?.addEventListener('click', () => this.toggle(true));
    this.els.close?.addEventListener('click', () => this.toggle(false));
    this.els.send?.addEventListener('click', () => this.submit());
    this.els.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.submit(); }
    });

    window.addEventListener('langchange', () => this.onLangChange());
    this.onLangChange();
    this.addBotMessage(window.I18n.t('chat.greeting'));
  }

  onLangChange() {
    document.getElementById('chatTitle').textContent = window.I18n.t('chat.title');
    document.getElementById('chatSubtitle').textContent = window.I18n.t('chat.subtitle');
    this.els.input.placeholder = window.I18n.t('chat.placeholder');
    this.els.send.textContent = window.I18n.t('chat.send');

    const suggestions = window.I18n.t('chat.suggestions') || [];
    this.els.suggestions.innerHTML = suggestions.map((s) =>
      `<button type="button" class="chat-suggestion">${s}</button>`
    ).join('');
    this.els.suggestions.querySelectorAll('.chat-suggestion').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.els.input.value = btn.textContent;
        this.submit();
      });
    });
  }

  toggle(force) {
    this.open = force !== undefined ? force : !this.open;
    this.els.panel?.classList.toggle('open', this.open);
    this.els.toggle?.classList.toggle('active', this.open);
    if (this.open) this.els.input?.focus();
  }

  addMessage(text, who) {
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg--${who}`;
    div.innerHTML = who === 'bot'
      ? `<img src="assets/logo.jpg" alt="" class="chat-avatar"><div class="chat-bubble">${this.escape(text)}</div>`
      : `<div class="chat-bubble">${this.escape(text)}</div>`;
    this.els.messages.appendChild(div);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;
  }

  addBotMessage(text) {
    this.addMessage(text, 'bot');
  }

  escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  async submit() {
    const text = this.els.input.value.trim();
    if (!text || this.typing) return;
    this.els.input.value = '';
    this.addMessage(text, 'user');

    this.typing = true;
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-msg chat-msg--bot chat-typing';
    typingEl.innerHTML = `<img src="assets/logo.jpg" alt="" class="chat-avatar"><div class="chat-bubble"><span class="dots"><span></span><span></span><span></span></span></div>`;
    this.els.messages.appendChild(typingEl);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
    typingEl.remove();

    const reply = getChatResponse(text);
    this.addBotMessage(reply);
    this.typing = false;
  }
}

window.Chatbot = new Chatbot();
document.addEventListener('DOMContentLoaded', () => window.Chatbot.init());