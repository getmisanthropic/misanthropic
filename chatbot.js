/**
 * Flower AI Chat — all replies come from /.netlify/functions/chat → Gemini.
 * No mock / fallback answer arrays in this file.
 */

const CHAT_API = '/.netlify/functions/chat';
const MASCOT_SRC = 'assets/flower.png';

/** UI-only loading lines (not chat answers) */
const WAIT_LINES = [
  'Hayattan nefret ediyor...',
  'Neden buradasın...',
  'İnsanlar yine konuşuyor...',
  'Gözyaşları birikiyor...',
];

function pickWaitLine() {
  return WAIT_LINES[Math.floor(Math.random() * WAIT_LINES.length)];
}

/**
 * POST user message to Netlify function; returns Gemini reply text.
 * Throws on any failure — caller must surface the error, not substitute fake text.
 */
async function fetchFlowerReply(message) {
  const res = await fetch(CHAT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Invalid JSON from server (HTTP ${res.status})`);
  }

  if (!res.ok) {
    const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error || `HTTP ${res.status}`);
    throw new Error(msg);
  }

  if (!data.reply || typeof data.reply !== 'string') {
    throw new Error('Server returned no reply');
  }

  return data.reply;
}

class FlowerChat {
  constructor() {
    this.open = false;
    this.typing = false;
    this.waitTimer = null;
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

    this.els.toggle?.addEventListener('click', () => this.openDrawer());
    this.els.close?.addEventListener('click', () => this.closeDrawer());
    this.els.send?.addEventListener('click', () => this.submit());
    this.els.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submit();
      }
    });

    window.addEventListener('langchange', () => this.onLangChange());
    this.onLangChange();
  }

  openDrawer() {
    this.open = true;
    this.els.panel?.classList.add('open');
    this.els.toggle?.classList.add('active');
    setTimeout(() => this.els.input?.focus(), 200);
  }

  closeDrawer() {
    this.open = false;
    this.els.panel?.classList.remove('open');
    this.els.toggle?.classList.remove('active');
  }

  onLangChange() {
    const title = document.getElementById('chatTitle');
    const subtitle = document.getElementById('chatSubtitle');
    if (title && window.I18n) title.textContent = window.I18n.t('chat.title');
    if (subtitle && window.I18n) subtitle.textContent = window.I18n.t('chat.subtitle');
    if (this.els.input && window.I18n) this.els.input.placeholder = window.I18n.t('chat.placeholder');
    if (this.els.send && window.I18n) this.els.send.textContent = window.I18n.t('chat.send');

    const suggestions = (window.I18n && window.I18n.t('chat.suggestions')) || [];
    if (!this.els.suggestions) return;

    this.els.suggestions.innerHTML = suggestions
      .map((s) => `<button type="button" class="chat-suggestion">${s}</button>`)
      .join('');

    this.els.suggestions.querySelectorAll('.chat-suggestion').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.els.input.value = btn.textContent;
        this.submit();
      });
    });
  }

  escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  addMessage(text, who, isError = false) {
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg--${who}` + (isError ? ' chat-msg--error' : '');
    div.innerHTML =
      who === 'bot'
        ? `<img src="${MASCOT_SRC}" alt="" class="chat-avatar" width="32" height="32"><div class="chat-bubble">${this.escape(text)}</div>`
        : `<div class="chat-bubble">${this.escape(text)}</div>`;
    this.els.messages.appendChild(div);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;
  }

  showWaitingBubble() {
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg--bot chat-typing';
    div.innerHTML = `
      <img src="${MASCOT_SRC}" alt="" class="chat-avatar" width="32" height="32">
      <div class="chat-bubble chat-bubble--waiting">
        <span class="chat-wait-text">${pickWaitLine()}</span>
        <span class="dots"><span></span><span></span><span></span></span>
      </div>`;
    this.els.messages.appendChild(div);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;

    const waitEl = div.querySelector('.chat-wait-text');
    this.waitTimer = setInterval(() => {
      if (waitEl) waitEl.textContent = pickWaitLine();
    }, 2200);

    return div;
  }

  clearWaitingBubble(el) {
    if (this.waitTimer) {
      clearInterval(this.waitTimer);
      this.waitTimer = null;
    }
    el?.remove();
  }

  async submit() {
    const text = this.els.input.value.trim();
    if (!text || this.typing) return;

    if (!this.open) this.openDrawer();

    this.els.input.value = '';
    this.addMessage(text, 'user');
    this.typing = true;
    this.els.send.disabled = true;

    const waitingEl = this.showWaitingBubble();
    if (typeof triggerCrying === 'function') triggerCrying();

    try {
      const reply = await fetchFlowerReply(text);
      this.clearWaitingBubble(waitingEl);
      this.addMessage(reply, 'bot');
    } catch (err) {
      this.clearWaitingBubble(waitingEl);
      this.addMessage(err.message || 'Request failed', 'bot', true);
    } finally {
      this.typing = false;
      this.els.send.disabled = false;
      this.els.input.focus();
    }
  }
}

window.fetchFlowerReply = fetchFlowerReply;
window.FlowerChat = new FlowerChat();
window.openFlowerChat = () => window.FlowerChat.openDrawer();
window.Chatbot = window.FlowerChat;

document.addEventListener('DOMContentLoaded', () => window.FlowerChat.init());
