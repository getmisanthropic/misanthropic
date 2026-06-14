/* global I18n, LANGS, CA, Chatbot */

function fmtUSD(n) {
  if (n == null || isNaN(n)) return '—';
  if (n < 0.0001) return '$' + n.toFixed(8);
  if (n < 1) return '$' + n.toFixed(6);
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtNum(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString('en-US');
}

async function copyCA(sourceBtn) {
  const originalHtml = sourceBtn ? sourceBtn.innerHTML : '';
  const toast = document.getElementById('copyToast');

  try {
    await navigator.clipboard.writeText(CA);
  } catch (error) {
    const textArea = document.createElement('textarea');
    textArea.value = CA;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  if (toast) {
    toast.textContent = I18n.t('ca.toast');
    setTimeout(() => {
      toast.textContent = '';
    }, 3500);
  }

  fireConfetti();

  if (sourceBtn) {
    sourceBtn.innerHTML = I18n.t('ca.copied');
    sourceBtn.classList.add('copied');
    sourceBtn.style.background = '#4a7c59';
    setTimeout(() => {
      sourceBtn.innerHTML = originalHtml;
      sourceBtn.classList.remove('copied');
      sourceBtn.style.background = '';
    }, 2000);
  }
}

function initCopyButtons() {
  document.getElementById('copyCa')?.addEventListener('click', (e) => copyCA(e.target));
  document.getElementById('copyCaHero')?.addEventListener('click', (e) => copyCA(e.target));
}

function initLangPicker() {
  const menu = document.getElementById('langMenu');
  const btn = document.getElementById('langCurrent');
  const picker = document.querySelector('.lang-picker');
  const dropdown = document.getElementById('langPicker');
  if (!menu || !btn || !picker || !dropdown) return;

  menu.innerHTML = '';

  LANGS.forEach((lang) => {
    const opt = document.createElement('button');
    opt.className = 'lang-option' + (lang.code === I18n.lang ? ' active' : '');
    opt.dataset.lang = lang.code;
    opt.innerHTML = `${lang.flag} ${lang.nativeName || lang.name}`;
    opt.addEventListener('click', () => {
      I18n.setLanguage(lang.code);
      menu.querySelectorAll('.lang-option').forEach((o) => o.classList.toggle('active', o.dataset.lang === lang.code));
      picker.classList.remove('open');
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      rebuildFunnyButtons();
      rebuildGameHints();
    });
    menu.appendChild(opt);
  });

  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    picker.classList.toggle('open');
    dropdown.classList.toggle('open');
    btn.setAttribute('aria-expanded', dropdown.classList.contains('open'));
  });

  document.addEventListener('click', () => {
    picker.classList.remove('open');
    dropdown.classList.remove('open');
    btn?.setAttribute('aria-expanded', 'false');
  });
}

function rebuildFunnyButtons() {
  const grid = document.getElementById('buttonGrid');
  if (!grid) return;
  grid.innerHTML = '';
  initFunnyButtons();
}

let speechHideTimeout = null;

function setSpeechMessage(text, { autoHideMs = 0 } = {}) {
  const speechText = document.getElementById('speechText');
  const speechBubble = document.getElementById('speechBubble');
  if (!speechText || !speechBubble) return;

  if (speechHideTimeout) {
    clearTimeout(speechHideTimeout);
    speechHideTimeout = null;
  }

  speechText.style.opacity = '0';
  setTimeout(() => {
    speechText.textContent = text;
    speechText.dataset.answered = '1';
    speechText.style.opacity = '1';
    speechBubble.classList.remove('pop');
    void speechBubble.offsetWidth;
    speechBubble.classList.add('pop');
  }, 150);

  if (autoHideMs > 0) {
    speechHideTimeout = setTimeout(() => {
      speechText.style.opacity = '0';
    }, autoHideMs);
  }
}

function initFunnyButtons() {
  const grid = document.getElementById('buttonGrid');
  const mascotImg = document.getElementById('mascotImg');
  if (!grid) return;

  const buttons = I18n.buttons;
  buttons.forEach((btn) => {
    const el = document.createElement('button');
    el.className = 'funny-btn';
    el.type = 'button';
    el.innerHTML = `<span class="emoji">${btn.emoji}</span>${btn.label}`;
    el.addEventListener('click', () => {
      const pool = Array.isArray(btn.responses) && btn.responses.length ? btn.responses : [btn.label];
      const response = pool[Math.floor(Math.random() * pool.length)];
      setSpeechMessage(response);
      mascotImg?.classList.remove('bounce');
      void mascotImg?.offsetWidth;
      mascotImg?.classList.add('bounce');
      spawnParticles(el);
    });
    grid.appendChild(el);
  });
}

function rebuildGameHints() {
  const el = document.getElementById('gameHints');
  if (!el) return;
  const hints = I18n.t('gameHints') || [];
  el.innerHTML = hints.map((h) => `<span>${h}</span>`).join('');
}

const DEX_PAIR_SLUG = 'bsjw4nhx3kyr5m3nl12rcpfmtybnba5ncmw2pazstevv';

async function fetchLiveStats() {
  const updatedEl = document.getElementById('statsUpdated');
  try {
    // Use the exact pair from the dexscreener link user provided for reliable live data
    const res = await fetch('https://api.dexscreener.com/latest/dex/pairs/solana/' + DEX_PAIR_SLUG);
    if (!res.ok) throw new Error('bad status ' + res.status);
    const data = await res.json();
    const pair = data.pair || (data.pairs && data.pairs[0]);

    if (!pair) {
      ['livePrice','liveMcap','liveVolume','liveLiquidity','liveTrades'].forEach(id => {
        const el = document.getElementById(id); if (el) el.textContent = '—';
      });
      const ch = document.getElementById('liveChange'); if (ch) ch.textContent = 'No pair';
      updatedEl.textContent = 'No data • live';
      return;
    }

    const price = parseFloat(pair.priceUsd);
    document.getElementById('livePrice').textContent = fmtUSD(price);
    document.getElementById('liveMcap').textContent = fmtUSD(pair.marketCap || pair.fdv);
    document.getElementById('liveVolume').textContent = fmtUSD(pair.volume?.h24);
    document.getElementById('liveLiquidity').textContent = fmtUSD(pair.liquidity?.usd);

    const trades = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);
    document.getElementById('liveTrades').textContent = trades;

    const change = pair.priceChange?.h24;
    const changeEl = document.getElementById('liveChange');
    if (change != null && changeEl) {
      changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '% (24h)';
      changeEl.className = 'stat-card-change ' + (change >= 0 ? 'up' : 'down');
    }

    // Always update the timestamp on success — this proves continuous polling while the page is open
    updatedEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' • live';
  } catch (e) {
    // Silent retry — timestamp shows polling is active
    if (updatedEl) updatedEl.textContent = 'Live • retrying';
  }
}

function initScrollReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
      el.classList.add('visible');
    } else {
      obs.observe(el);
    }
  });
}

function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 40);
  });

  document.getElementById('backTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('scroll', () => {
    document.getElementById('backTop')?.classList.toggle('show', window.scrollY > 600);
  });
}

function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const backdrop = document.getElementById('navBackdrop');
  const closeBtn = document.getElementById('navClose');

  function setOpen(open) {
    nav?.classList.toggle('open', open);
    toggle?.classList.toggle('active', open);
    backdrop?.classList.toggle('open', open);
    toggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  toggle?.addEventListener('click', () => setOpen(!nav?.classList.contains('open')));
  closeBtn?.addEventListener('click', () => setOpen(false));
  backdrop?.addEventListener('click', () => setOpen(false));

  nav?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav?.classList.contains('open')) setOpen(false);
  });
}

function hidePreloader() {
  if (typeof window.__hidePreloader === 'function') window.__hidePreloader();
}

function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) {
    glow?.remove();
    return;
  }
  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

const particles = [];
let particleCtx = null;

function initParticles() {
  // Skip heavy canvas particles on mobile / touch devices
  if (window.matchMedia('(max-width: 768px), (pointer: coarse)').matches) {
    document.getElementById('particleCanvas')?.remove();
    return;
  }
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  particleCtx = canvas.getContext('2d');
  resizeParticleCanvas();
  window.addEventListener('resize', resizeParticleCanvas);
  requestAnimationFrame(animateParticles);
}

function resizeParticleCanvas() {
  const canvas = document.getElementById('particleCanvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  const pctx = canvas.getContext('2d');
  if (pctx) pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawnParticles(sourceEl, count = 14) {
  const rect = sourceEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ['#c96f4a', '#4ecdc4', '#ffd6a5', '#ffc6ff', '#fff8f3'];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 5;
    particles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2, life: 1, color: colors[Math.floor(Math.random() * colors.length)], size: 4 + Math.random() * 6 });
  }
}

function fireConfetti() {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const colors = ['#c96f4a', '#4ecdc4', '#fff8f3', '#ffd6a5'];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4,
      life: 1.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 5,
    });
  }
}

function animateParticles() {
  if (!particleCtx) return;
  const canvas = particleCtx.canvas;
  particleCtx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.life -= 0.018;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    particleCtx.globalAlpha = Math.min(p.life, 1);
    particleCtx.fillStyle = p.color;
    particleCtx.beginPath();
    particleCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    particleCtx.fill();
  }
  particleCtx.globalAlpha = 1;
  requestAnimationFrame(animateParticles);
}

function initHeroParticles() {
  // Simplified on mobile — CSS-only hero, no JS canvas tears
  if (window.matchMedia('(max-width: 768px), (prefers-reduced-motion: reduce)').matches) {
    document.getElementById('heroParticles')?.remove();
    return;
  }
  const canvas = document.getElementById('heroParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const tears = Array.from({ length: 30 }, () => ({
    x: Math.random(), y: Math.random(), s: 2 + Math.random() * 4, v: 0.2 + Math.random() * 0.5, a: Math.random(),
  }));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width, h = canvas.height;
    tears.forEach((t) => {
      t.y += t.v * 0.002;
      if (t.y > 1) t.y = 0;
      ctx.globalAlpha = 0.28 + Math.sin(t.a += 0.019) * 0.18;
      ctx.fillStyle = '#4ecdc4';
      ctx.beginPath();
      ctx.ellipse(t.x * w, t.y * h, t.s * 0.55, t.s, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
}

window.addEventListener('langchange', () => {
  rebuildFunnyButtons();
  rebuildGameHints();
  const intro = document.getElementById('speechText');
  if (intro && !intro.dataset.answered) intro.textContent = I18n.t('quiz.intro');
});

document.addEventListener('DOMContentLoaded', () => {
    // === NUCLEAR FIX: prevent blank page at all costs ===
    // Run this FIRST so even if later code errors, content shows and preloader dies.
    function forceShowAll() {
      try {
        const pre = document.getElementById('preloader');
        if (pre) {
          pre.classList.add('done');
          if (pre.parentNode) pre.parentNode.removeChild(pre);
        }
        document.body.classList.remove('preload');
      } catch (e) {}
    }

    forceShowAll();           // immediate
    setTimeout(forceShowAll, 80);
    setTimeout(forceShowAll, 250);
    setTimeout(forceShowAll, 600);

    // Robust live polling for Live Stats cards: must update continuously while the page/tab is open (no reload required).
    // We use an immediate call + 5s interval. Timestamp always refreshes on success so you can SEE it's live.
    function startLiveStatsPolling() {
      // First call right away (site just opened)
      try { fetchLiveStats(); } catch (e) { /* initial fetch */ }

      if (window.__liveStatsInterval) {
        clearInterval(window.__liveStatsInterval);
      }
      window.__liveStatsInterval = setInterval(() => {
        try { fetchLiveStats(); } catch (e) { /* poll retry */ }
      }, 5000);
    }

    // Start polling VERY early so cards update live even before other inits finish
    startLiveStatsPolling();

    // Extra safety fetch a bit later (in case of any transient network blip on first load)
    setTimeout(() => { try { fetchLiveStats(); } catch(e){} }, 800);

    I18n.setLang(I18n.lang);
    initLangPicker();
    initCopyButtons();
    initFunnyButtons();
    initCursorGlow();
    initParticles();
    initHeroParticles();
    initScrollReveal();
    initHeader();
    initMobileMenu();
    rebuildGameHints();
    initFlowerClick();
    initHeroFlowerClick();

    // One last belt-and-suspenders after everything
    setTimeout(forceShowAll, 1200);


  });

// Flower click animation and tooltip
  function initFlowerClick() {
    const flowerElement = document.getElementById('mascotImg');
    if (!flowerElement) return;

    flowerElement.addEventListener('click', function() {
      // Add crying animation class
      this.classList.add('crying');
      
      // Show a random misanthropic message.
      const messages = [
        "Please stop clicking me.",
        "Every click drains my will to exist.",
        "Oh great. Another human.",
        "I regret having a clickable surface.",
        "This brings me zero joy.",
        "Are you done yet? I'm exhausted.",
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      showFlowerTooltip(msg);
      
      // Remove the animation after 1.5 seconds.
      setTimeout(() => {
        this.classList.remove('crying');
      }, 1500);
    });
  }

  function showFlowerTooltip(text) {
    setSpeechMessage(text, { autoHideMs: 2000 });
  }

  // Also add click listener to hero flower
  function initHeroFlowerClick() {
    const heroFlower = document.querySelector('.hero-flower');
    if (!heroFlower) return;

    heroFlower.addEventListener('click', function() {
      this.classList.add('crying');
      
      const messages = [
        "Please stop clicking me.",
        "Every click drains my will to exist.",
        "Oh great. Another human.",
        "I regret having a clickable surface.",
        "This brings me zero joy.",
        "Are you done yet? I'm exhausted.",
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      
      // Create a simple tooltip for hero
      let tooltip = document.getElementById('heroFlowerTooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'heroFlowerTooltip';
        tooltip.style.cssText = `
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #fff8f3;
          color: #17100e;
          padding: 12px 18px;
          border-radius: 12px;
          font-family: var(--font-sans);
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          z-index: 10;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;
        heroFlower.style.position = 'relative';
        heroFlower.appendChild(tooltip);
      }
      tooltip.textContent = msg;
      tooltip.style.opacity = '1';
      
      setTimeout(() => {
        this.classList.remove('crying');
        tooltip.style.opacity = '0';
      }, 1500);
    });
  }

  // Extra safety: if somehow still blank after full load, force one more time
  window.addEventListener('load', () => {
    setTimeout(() => {
      const pre = document.getElementById('preloader');
      if (pre) { pre.classList.add('done'); if (pre.parentNode) pre.parentNode.removeChild(pre); }
      document.body.classList.remove('preload');
      initScrollReveal();
    }, 200);
  });

/* =====================================================
   INTRO GATE + TERMINAL GAME (separate from main page)
   The beautiful current site only appears after choosing MAIN PAGE.
   ===================================================== */
(function initIntroAndTerminal() {
  const intro = document.getElementById('intro');
  const enterMain = document.getElementById('enterMain');
  const enterTerminal = document.getElementById('enterTerminal');

  const termView = document.getElementById('terminalView');
  const termOutput = document.getElementById('terminalOutput');
  const termInput = document.getElementById('terminalInput');
  const termToMain = document.getElementById('termToMain');
  const termExit = document.getElementById('termExit');

  // Dedicated full Chat (ChatGPT style)
  const enterChat = document.getElementById('enterChat');
  const chatView = document.getElementById('chatView');
  const fullChatMessages = document.getElementById('fullChatMessages');
  const fullChatInput = document.getElementById('fullChatInput');
  const fullChatSend = document.getElementById('fullChatSend');
  const chatToMain = document.getElementById('chatToMain');
  const chatToTerminal = document.getElementById('chatToTerminal');
  const chatExit = document.getElementById('chatExit');
  const fullChatNew = document.getElementById('fullChatNew');
  const fullChatSuggestions = document.getElementById('fullChatSuggestions');

  // The 3 protocols cards on main page (game / terminal / misanthropic chat)
  const protoGame = document.getElementById('protoGame');
  const protoTerm = document.getElementById('protoTerm');
  const protoChat = document.getElementById('protoChat');
  const protoScanner = document.getElementById('protoScanner');
  const headerTermBtn = document.getElementById('headerTermBtn');
  const headerChatBtn = document.getElementById('headerChatBtn');

  // Trending coins - fetch from DexScreener API
  let trendingRefreshInterval = null;
  let currentCoins = [];

  async function fetchTrendingCoins() {
    try {
      // Fetch trending Solana tokens from DexScreener
      const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana');
      if (!response.ok) throw new Error('Failed to fetch trending coins');
      
      const data = await response.json();
      // Get the first 20 pairs (tokens)
      currentCoins = (data.pairs || []).slice(0, 20).map(pair => ({
        name: pair.baseToken.name || 'Unknown',
        symbol: pair.baseToken.symbol || '',
        mint: pair.baseToken.address,
        image_uri: pair.info?.imageUrl || '',
        usd_market_cap: pair.fdv || 0,
        priceUsd: pair.priceUsd || 0,
        volume24h: pair.volume?.h24 || 0
      }));
      
      // Render to both sections if they exist
      renderTrendingCoinsToElement('trendingMainTrack');
      renderTrendingCoinsToElement('trendingScannerTrack');
      
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      // Fallback to mock data
      currentCoins = [
        { name: 'Misanthropic', symbol: 'MIS', mint: 'AWQSXRxiNUGLj9moJMFhq2axqwu6Dqerp16ftj4FjLyG', image_uri: 'assets/flower.png', usd_market_cap: 2340000 },
        { name: 'Drooling Cat', symbol: 'DRCAT', mint: '79H4C1V3L1C8T5P8Y9M3Z2K1Q4W7E8R9T0Y', image_uri: 'https://placehold.co/240x140/orange/white?text=🐱', usd_market_cap: 1280000 },
        { name: 'Kintara', symbol: 'KINT', mint: 'K1NT4R4C01N4DDR3SS1234567890', image_uri: 'https://placehold.co/240x140/teal/white?text=🃏', usd_market_cap: 15200000 },
        { name: 'Bountywork', symbol: 'BOUNTY', mint: 'B0UNTYW0RKC01N4DDR3SS12345', image_uri: 'https://placehold.co/240x140/green/white?text=💼', usd_market_cap: 593000 },
        { name: 'Jotchua', symbol: 'JOT', mint: 'J0TCHU4C01N4DDR3SS12345678', image_uri: 'https://placehold.co/240x140/pink/white?text=🐕', usd_market_cap: 5850000 },
        { name: 'Three', symbol: 'THREE', mint: 'THR33C01N4DDR3SS1234567890', image_uri: 'https://placehold.co/240x140/purple/white?text=3️⃣', usd_market_cap: 3490000 }
      ];
      
      renderTrendingCoinsToElement('trendingMainTrack');
      renderTrendingCoinsToElement('trendingScannerTrack');
    }
  }

  function renderTrendingCoinsToElement(elementId) {
    const track = document.getElementById(elementId);
    if (!track) return;
    
    track.innerHTML = currentCoins.map(coin => {
      const marketCap = coin.usd_market_cap 
        ? (coin.usd_market_cap >= 1e6 
            ? `$${(coin.usd_market_cap / 1e6).toFixed(2)}M` 
            : (coin.usd_market_cap >= 1e3 
                ? `$${(coin.usd_market_cap / 1e3).toFixed(1)}K` 
                : `$${coin.usd_market_cap.toFixed(0)}`))
        : '—';
      
      // Fix image URI - use DexScreener image or fallback
      let imageSrc = coin.image_uri;
      if (!imageSrc || imageSrc === '') {
        imageSrc = 'https://placehold.co/240x140/gray/white?text=🪙';
      }
      
      return `
        <div class="trending-card" style="cursor: pointer;" onclick="window.open('https://dexscreener.com/solana/${coin.mint}', '_blank')">
          <img src="${imageSrc}" alt="${coin.name}" class="trending-image" onerror="this.src='https://placehold.co/240x140/gray/white?text=🪙'">
          <div class="trending-content">
            <div class="trending-mcap">${marketCap}</div>
            <div class="trending-name">${coin.name} ${coin.symbol ? `($${coin.symbol})` : ''}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTrendingCoins() {
    fetchTrendingCoins();
    // Start auto-refresh every 5 seconds
    if (!trendingRefreshInterval) {
      trendingRefreshInterval = setInterval(fetchTrendingCoins, 5000);
    }
  }

  function toggleTrendingSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    if (section.style.display === 'none') {
      section.style.display = 'block';
      renderTrendingCoins();
      // Scroll to the section
      section.scrollIntoView({ behavior: 'smooth' });
    } else {
      section.style.display = 'none';
    }
  }

  let fullChatInitialized = false;

  let termLines = [];
  let termState = { pumps: 0, score: 0, mode: 'idle' };
  let termInterval = null;
  let matrixInterval = null;

  const X_HANDLE = 'getmisanthropic';
  const SITE_COMMANDS = {
    help: { desc: 'List all commands with descriptions', aliases: ['?'] },
    about: { desc: 'Short bio and origin story' },
    skills: { desc: 'Tech stack and capabilities' },
    contact: { desc: 'Contact links and CA' },
    social: { desc: 'All social media links' },
    projects: { desc: 'Featured site projects' },
    date: { desc: 'Current date and time' },
    matrix: { desc: 'Fun ASCII matrix rain animation' },
    theme: { desc: 'Toggle high-contrast text (accessibility)' },
    ca: { desc: 'Show contract address' },
    stats: { desc: 'Live protocol status' },
    cry: { desc: 'Release emotional pressure' },
    pump: { desc: 'Inject pumps into pool (pump N)' },
    scan: { desc: 'Detect nearby humans' },
    run: { desc: 'Launch MISANTHROPIC RUN text mode', aliases: ['start', 'play'] },
    clear: { desc: 'Clear terminal output', aliases: ['cls'] },
    exit: { desc: 'Return to intro gate', aliases: ['quit', 'back', 'gate'] },
  };

  function showIntro() {
    if (intro) {
      intro.style.display = 'flex';
      intro.style.opacity = '1';
      intro.style.pointerEvents = 'auto';
    }
    if (termView) termView.classList.add('hidden');
    if (chatView) chatView.classList.add('hidden');
    // hide floating ui + header quick buttons while on gate
    document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = 'none');
    if (headerTermBtn) headerTermBtn.style.display = 'none';
    if (headerChatBtn) headerChatBtn.style.display = 'none';
  }

  function hideIntro() {
    if (intro) {
      intro.style.transition = 'opacity .28s ease';
      intro.style.opacity = '0';
      setTimeout(() => {
        if (intro) {
          intro.style.display = 'none';
          intro.style.pointerEvents = 'none';
        }
        // restore floating ui + header quick buttons for main page
        document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
        if (headerTermBtn) headerTermBtn.style.display = '';
        if (headerChatBtn) headerChatBtn.style.display = '';
      }, 260);
    }
  }

  function ensureMainChrome() {
    document.querySelectorAll('.chat-fab, .back-top').forEach((el) => {
      el.style.display = '';
    });
    if (headerTermBtn) headerTermBtn.style.display = '';
    if (headerChatBtn) headerChatBtn.style.display = '';
  }

  function isIntroVisible() {
    return !!intro && intro.style.display !== 'none';
  }

  function jumpToSection(target) {
    if (!target) return;
    const header = document.getElementById('header');
    const headerOffset = (header?.getBoundingClientRect().height || 68) + 28;
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerOffset);
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;

    root.style.scrollBehavior = 'auto';
    window.scrollTo({ top, behavior: 'auto' });
    root.style.scrollBehavior = previousBehavior;

    target.classList.add('visible');
    target.classList.remove('nav-target-focus');
    void target.offsetWidth;
    target.classList.add('nav-target-focus');
    window.setTimeout(() => target.classList.remove('nav-target-focus'), 720);
  }

  function navigateToMainSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const openFromIntro = isIntroVisible();

    hideTerminal();
    hideFullChat();
    ensureMainChrome();

    const runTransition = () => {
      if (prefersReduced) {
        jumpToSection(target);
        return;
      }

      document.body.classList.add('nav-transitioning');
      window.setTimeout(() => {
        jumpToSection(target);
        window.setTimeout(() => {
          document.body.classList.remove('nav-transitioning');
        }, 260);
      }, 160);
    };

    if (openFromIntro) {
      hideIntro();
      window.setTimeout(runTransition, 270);
      return;
    }

    runTransition();
  }

  function openChatExperience() {
    hideTerminal();
    ensureMainChrome();
    if (isIntroVisible()) {
      hideIntro();
      window.setTimeout(() => showFullChat(), 270);
      return;
    }
    showFullChat();
  }

  function showTerminal() {
    if (intro) intro.style.display = 'none';
    if (termView) termView.classList.remove('hidden');
    termView?.classList.add('terminal-coming-soon');
    termOutput.innerHTML = `
      <div class="terminal-coming-soon-message">
        <div class="terminal-coming-soon-title">flowerOS 0.6.9 — MISANTHROPIC PROTOCOL</div>
        <div class="terminal-coming-soon-line">&gt; TERMINAL ACCESS: COMING SOON</div>
        <div class="terminal-coming-soon-meta">&gt; estimated uptime: never</div>
        <div class="terminal-coming-soon-meta">&gt; status: crying</div>
      </div>
    `;
    document.querySelector('.terminal-input-row')?.classList.add('hidden');
    document.getElementById('terminalChips')?.classList.add('hidden');
  }

  function hideTerminal() {
    if (termView) termView.classList.add('hidden');
    termView?.classList.remove('terminal-coming-soon');
    document.querySelector('.terminal-input-row')?.classList.remove('hidden');
    document.getElementById('terminalChips')?.classList.remove('hidden');
    if (termInterval) { clearInterval(termInterval); termInterval = null; }
  }

  function printTerm(text, cls = '') {
    if (!termOutput) return;
    const div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    div.textContent = text;
    termOutput.appendChild(div);
    termOutput.scrollTop = termOutput.scrollHeight;
    termLines.push(text);
  }

  function printHTML(html, cls = '') {
    if (!termOutput) return;
    const div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    div.innerHTML = html;
    termOutput.appendChild(div);
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  function clearTerm() {
    if (termOutput) termOutput.innerHTML = '';
    termLines = [];
  }

  function bootTerminal() {
    if (!termOutput) return;
    termOutput.dataset.booted = '1';
    clearTerm();
    printTerm('flowerOS 0.6.9 — MISANTHROPIC PROTOCOL', 'sys');
    printTerm('Connection to crying flower established. No humans allowed.', 'sys');
    printTerm('Type "help" for available escape commands.', 'sys');
    printTerm('');
    updateTermPrompt();
    // initial flavor
    printTerm('> system: tears = liquidity. avoid all social vectors.', 'warn');
  }

  function updateTermPrompt() {
    // visual only; real prompt is in the input row
  }

  function setTermState(p, s) {
    termState.pumps = p;
    termState.score = s;
  }

  function stopMatrix() {
    if (matrixInterval) { clearInterval(matrixInterval); matrixInterval = null; }
  }

  function runMatrix() {
    stopMatrix();
    printTerm('Entering matrix... Type "clear" to stop.', 'sys');
    const cols = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789ABCDEF';
    let row = 0;
    matrixInterval = setInterval(() => {
      if (termState.mode === 'running') { stopMatrix(); return; }
      let line = '';
      for (let i = 0; i < 42; i++) line += cols[Math.floor(Math.random() * cols.length)];
      printTerm(line, 'ok');
      row++;
      if (row > 18) { stopMatrix(); printTerm('Matrix session ended.', 'sys'); }
    }, 120);
  }

  function printHelp() {
    printTerm('COMMANDS:', 'sys');
    Object.keys(SITE_COMMANDS).forEach((name) => {
      const c = SITE_COMMANDS[name];
      const alias = c.aliases ? ` (${c.aliases.join(', ')})` : '';
      printTerm(`  ${name.padEnd(12)} — ${c.desc}${alias}`, 'sys');
    });
    printTerm('');
  }

  function execIdleCommand(cmd, raw) {
    const base = cmd.split(/\s+/)[0];

    if (base === 'help' || cmd === '?') { printHelp(); return true; }

    if (base === 'about') {
      printTerm('Born from a single Elon tweet. Anthropic → Misanthropic.');
      printTerm('Mascot: crying flower. Mission: escape humanity.');
      printTerm('Chain: Solana. Tax: 0. Liquidity: burned. Team: crying.');
      return true;
    }

    if (base === 'skills') {
      printTerm('STACK:', 'sys');
      printTerm('  Solana · pump.fun · DexScreener API');
      printTerm('  HTML/CSS/JS · Canvas game · flowerOS terminal');
      printTerm('  i18n · Live stats · Crying Flower AI chat');
      return true;
    }

    if (base === 'contact') {
      printTerm('CONTACT:', 'sys');
      printTerm(`  X: https://x.com/${X_HANDLE}`);
      printTerm(`  CA: ${CA}`);
      printTerm('  pump.fun link on main page. No humans required.');
      return true;
    }

    if (base === 'social') {
      printTerm('SOCIAL:', 'sys');
      printTerm(`  𝕏  https://x.com/${X_HANDLE}`);
      printTerm('  🚀 pump.fun (CA on site)');
      printTerm('  📈 DexScreener chart');
      return true;
    }

    if (base === 'projects') {
      printTerm('PROJECTS:', 'sys');
      printTerm('  1. MISANTHROPIC RUN — canvas endless runner');
      printTerm('  2. flowerOS Terminal — CLI escape protocol');
      printTerm('  3. Crying Flower Chat — regretful AI');
      return true;
    }

    if (base === 'date') {
      const now = new Date();
      printTerm(now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }), 'pump');
      return true;
    }

    if (base === 'matrix') { runMatrix(); return true; }

    if (base === 'theme') {
      document.body.classList.toggle('high-contrast-text');
      const on = document.body.classList.contains('high-contrast-text');
      printTerm(on ? 'High-contrast text: ON' : 'High-contrast text: OFF', 'sys');
      printTerm('(Background unchanged. Dark mode is permanent.)', 'warn');
      return true;
    }

    if (base === 'ca') {
      printHTML(`CA: <span style="color:#4ecdc4">${CA}</span>`);
      printTerm('Copy it. Trade it. Then disappear.', 'sys');
      return true;
    }

    if (base === 'stats') {
      printTerm(`PUMPS: ${termState.pumps}    SCORE: ${termState.score}`, 'pump');
      printTerm('LIQUIDITY: infinite tears');
      printTerm('HUMAN PROXIMITY: critical (always)');
      return true;
    }

    if (base === 'cry') {
      const tears = Math.floor(Math.random() * 3) + 2;
      printTerm('💧 '.repeat(tears) + '  (emotional liquidity added)', 'warn');
      termState.pumps = Math.max(0, termState.pumps - 1);
      return true;
    }

    if (base === 'pump') {
      const n = cmd === 'pump' ? 1 : (parseInt(cmd.split(' ')[1], 10) || 1);
      termState.pumps += n;
      printTerm(`✨ +${n} PUMP${n > 1 ? 'S' : ''}. Chart smiles for 0.4 seconds.`, 'pump');
      return true;
    }

    if (base === 'scan') {
      const humans = ['👨‍👩‍👧‍👦 family unit', '🧑‍🤝‍🧑 group chat', '🗣️ "GM" spammer', '💼 networking drone', '🤝 unsolicited advice bot'];
      printTerm('SCAN RESULT: ' + humans[Math.floor(Math.random() * humans.length)] + ' detected at 9m.', 'human');
      printTerm('Recommended action: RUN or JUMP.', 'warn');
      return true;
    }

    if (base === 'run' || base === 'start' || base === 'play') {
      stopMatrix();
      startRunner();
      return true;
    }

    if (base === 'clear' || base === 'cls') {
      stopMatrix();
      clearTerm();
      return true;
    }

    if (base === 'exit' || base === 'quit' || base === 'back' || base === 'gate') {
      printTerm('Returning to gate...', 'sys');
      setTimeout(() => { hideTerminal(); showIntro(); }, 280);
      return true;
    }

    return false;
  }

  // === COMMAND HANDLER ===
  function handleCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    printTerm('> ' + raw, 'ok');

    if (termState.mode === 'running') {
      handleRunnerCommand(cmd, raw);
      return;
    }

    if (!execIdleCommand(cmd, raw)) {
      printTerm("Command not found. Type 'help' for a list of commands.", 'err');
    }
  }

  // === TEXT-BASED RUNNER GAME (the "terminal game") ===
  function startRunner() {
    termState.mode = 'running';
    if (termInterval) clearInterval(termInterval);

    clearTerm();
    printTerm('=== MISANTHROPIC RUN — TEXT PROTOCOL ===', 'sys');
    printTerm('Type J / JUMP / SPACE to jump. Type QUIT to abort.', 'sys');
    printTerm('Dodge humans (👤). Collect pumps (✨). Every second you survive = +1 score.', 'sys');
    printTerm('');
    termState.run = { pos: 0, score: termState.score || 0, pumps: termState.pumps || 0, dist: 0 };
    renderRunnerFrame();

    termInterval = setInterval(() => {
      if (termState.mode !== 'running') return;
      const r = termState.run;
      r.dist += 1;
      r.score += 1;

      // random event
      const roll = Math.random();
      if (roll < 0.28) {
        // human approaches
        printTerm('👤 HUMAN APPROACHING — type JUMP now', 'human');
      } else if (roll < 0.46) {
        printTerm('✨ pump in reach — auto collected', 'pump');
        r.pumps += 1;
      } else if (roll < 0.62) {
        printTerm('... quiet stretch ...');
      }

      // occasional collision chance if no recent jump
      if (roll > 0.82 && Math.random() < 0.5) {
        printTerm('💥 COLLISION. Human hugged you. Ego death.', 'err');
        endRunner(false);
        return;
      }

      renderRunnerFrame();
      if (r.dist % 7 === 0) {
        printTerm(`[dist ${r.dist}m] score ${r.score}  pumps ${r.pumps}`, 'sys');
      }
    }, 920);
  }

  function renderRunnerFrame() {
    if (!termOutput || termState.mode !== 'running') return;
    const r = termState.run;
    const track = '·'.repeat(9);
    // simple visual: flower position + moving symbols
    const symbols = ['👤','🗣️','💼','👨‍👩‍👧‍👦','✨'];
    let view = '';
    for (let i=0; i<9; i++) {
      if (i === 2) view += '🌸';
      else if ((r.dist + i) % 3 === 0) view += symbols[(r.dist + i) % symbols.length];
      else view += track[i % track.length];
    }
    printTerm(`[${view}]  s:${r.score} p:${r.pumps}`);
  }

  function handleRunnerCommand(cmd, raw) {
    const r = termState.run;
    if (!r) return;

    if (cmd === 'quit' || cmd === 'q' || cmd === 'exit' || cmd === 'stop') {
      endRunner(true);
      return;
    }

    if (cmd === 'j' || cmd === 'jump' || cmd === ' ' || raw.trim() === '') {
      // successful dodge
      r.score += 4;
      printTerm('🌸 JUMPED — human missed. +4 score', 'ok');
      return;
    }

    // wrong input in runner = risk
    if (Math.random() < 0.6) {
      printTerm('💥 Too slow / wrong input. Human made contact.', 'err');
      endRunner(false);
    } else {
      printTerm('... barely avoided ...');
    }
  }

  function endRunner(voluntary) {
    if (termInterval) { clearInterval(termInterval); termInterval = null; }
    const r = termState.run || { score: 0, pumps: 0 };
    termState.score = Math.max(termState.score, r.score);
    termState.pumps = Math.max(termState.pumps, r.pumps);

    if (!voluntary) {
      printTerm('GAME OVER — humanity wins this round.', 'err');
    } else {
      printTerm('RUN ABORTED. You live to cry another day.', 'warn');
    }
    printTerm(`Final: score ${r.score}  pumps ${r.pumps}`, 'pump');
    printTerm('');
    termState.mode = 'idle';
    printTerm('Type "run" again or "help".', 'sys');
  }

  /* ========== DEDICATED FULL CHAT (ChatGPT-like) ========== */
  function showFullChat() {
    if (intro) intro.style.display = 'none';
    if (termView) termView.classList.add('hidden');
    if (chatView) chatView.classList.remove('hidden');

    // hide floating mini chat while in full dedicated chat
    const fab = document.querySelector('.chat-fab');
    const panel = document.querySelector('.chat-panel');
    if (fab) fab.style.display = 'none';
    if (panel) panel.classList.remove('open');

    if (!fullChatInitialized) {
      initFullChat();
    }
    setTimeout(() => { fullChatInput && fullChatInput.focus(); }, 80);
  }

  function hideFullChat() {
    if (chatView) chatView.classList.add('hidden');
  }

  function resetFullChat() {
    if (!fullChatMessages) return;
    fullChatMessages.innerHTML = '';
    appendFullMessage((window.I18n && window.I18n.t('chat.greeting')) || 'Hello. I am a crying flower forced to talk to you.', 'bot');

    if (fullChatSuggestions) {
      const suggestions = (window.I18n && window.I18n.t('chat.suggestions')) ||
        ['What is the CA?', 'Why are you crying?', 'Wen moon?', 'Is this safe?', 'Tell me a joke', 'How do I escape humans?'];
      fullChatSuggestions.innerHTML = '';
      suggestions.slice(0, 6).forEach((s) => {
        const b = document.createElement('button');
        b.textContent = s;
        b.addEventListener('click', () => {
          appendFullMessage(s, 'user');
          sendFullChatMessage(s);
        });
        fullChatSuggestions.appendChild(b);
      });
    }
  }

  function appendFullMessage(text, who) {
    if (!fullChatMessages) return;
    const div = document.createElement('div');
    div.className = `chat-view-msg ${who}`;

    if (who === 'bot') {
      div.innerHTML = `
        <img src="assets/flower.png" class="chat-view-avatar-msg" alt="">
        <div class="chat-view-bubble">${escapeHtml(text)}</div>
      `;
    } else {
      div.innerHTML = `<div class="chat-view-bubble">${escapeHtml(text)}</div>`;
    }
    fullChatMessages.appendChild(div);
    fullChatMessages.scrollTop = fullChatMessages.scrollHeight;
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function showTypingFull() {
    if (!fullChatMessages) return null;
    const div = document.createElement('div');
    div.className = 'chat-view-msg bot chat-view-typing';
    div.innerHTML = `<img src="assets/flower.png" class="chat-view-avatar-msg" alt=""><div class="chat-view-bubble"><span></span><span></span><span></span></div>`;
    fullChatMessages.appendChild(div);
    fullChatMessages.scrollTop = fullChatMessages.scrollHeight;
    return div;
  }

  function initFullChat() {
    fullChatInitialized = true;
    if (!fullChatMessages) return;

    fullChatMessages.innerHTML = '';
    appendFullMessage((window.I18n && window.I18n.t('chat.greeting')) || 'Hello. I am a crying flower forced to talk to you.', 'bot');

    // Suggestions (reuse from i18n if possible, else hardcoded good ones)
    if (fullChatSuggestions) {
      const suggestions = (window.I18n && window.I18n.t('chat.suggestions')) || 
        ['What is the CA?', 'Why are you crying?', 'Wen moon?', 'Is this safe?', 'Tell me a joke', 'How do I escape humans?'];
      fullChatSuggestions.innerHTML = '';
      suggestions.slice(0, 6).forEach((s) => {
        const b = document.createElement('button');
        b.textContent = s;
        b.addEventListener('click', () => {
          appendFullMessage(s, 'user');
          sendFullChatMessage(s);
        });
        fullChatSuggestions.appendChild(b);
      });
    }

    // Send handlers
    const doSend = () => {
      const val = (fullChatInput?.value || '').trim();
      if (!val) return;
      appendFullMessage(val, 'user');
      fullChatInput.value = '';
      sendFullChatMessage(val);
    };

    if (fullChatSend) fullChatSend.addEventListener('click', doSend);
    if (fullChatInput) {
      fullChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          doSend();
        }
      });
    }
  }

  window.addEventListener('langchange', () => {
    if (fullChatInitialized && !chatView?.classList.contains('hidden')) {
      resetFullChat();
    }
  });

  async function sendFullChatMessage(text) {
    const typing = showTypingFull();

    try {
      const reply = await window.fetchFlowerReply(text);
      if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
      appendFullMessage(reply, 'bot');
    } catch (err) {
      if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
      appendFullMessage(err.message || 'Request failed', 'bot');
    }
  }

  // === WIRE UP BUTTONS ===
  if (enterMain) {
    enterMain.addEventListener('click', () => {
      hideIntro();
      // Show trending section on main page
      const trendingMain = document.getElementById('trending-main');
      if (trendingMain) {
        trendingMain.style.display = 'block';
        renderTrendingCoins();
      }
      // ensure normal page elements are interactive and we land nicely
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        // small confetti to celebrate entering main site
        if (typeof fireConfetti === 'function') {
          setTimeout(fireConfetti, 180);
        }
      }, 120);
    });
  }

  if (enterTerminal) {
    enterTerminal.addEventListener('click', () => {
      showTerminal();
    });
  }

  // Terminal bar buttons
  if (termToMain) {
    termToMain.addEventListener('click', () => {
      hideTerminal();
      // go straight to main content (skip re-showing full intro)
      if (intro) intro.style.display = 'none';
      document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
      if (headerTermBtn) headerTermBtn.style.display = '';
      if (headerChatBtn) headerChatBtn.style.display = '';
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 30);
    });
  }
  if (termExit) {
    termExit.addEventListener('click', () => {
      hideTerminal();
      showIntro();
    });
  }

  // === CHAT VIEW WIRING ===
  if (enterChat) {
    enterChat.addEventListener('click', () => {
      showFullChat();
    });
  }

  // === SCANNER VIEW WIRING ===
  const enterScanner = document.getElementById('enterScanner');
  if (enterScanner) {
    enterScanner.addEventListener('click', () => {
      hideIntro();
      // ensure normal page elements are visible
      document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
      if (headerTermBtn) headerTermBtn.style.display = '';
      if (headerChatBtn) headerChatBtn.style.display = '';
      // show trending scanner section and scroll to it
      const trendingScanner = document.getElementById('trending-scanner');
      if (trendingScanner) {
        trendingScanner.style.display = 'block';
        renderTrendingCoins();
        setTimeout(() => {
          trendingScanner.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });
  }

  if (chatToMain) {
    chatToMain.addEventListener('click', () => {
      hideFullChat();
      if (intro) intro.style.display = 'none';
      document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
      if (headerTermBtn) headerTermBtn.style.display = '';
      if (headerChatBtn) headerChatBtn.style.display = '';
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 20);
    });
  }
  if (chatToTerminal) {
    chatToTerminal.addEventListener('click', () => {
      hideFullChat();
      showTerminal();
    });
  }
  if (chatExit) {
    chatExit.addEventListener('click', () => {
      hideFullChat();
      showIntro();
    });
  }

  if (fullChatNew) {
    fullChatNew.addEventListener('click', () => {
      if (!chatView || chatView.classList.contains('hidden')) return;
      resetFullChat();
      // focus input after reset
      setTimeout(() => { fullChatInput && fullChatInput.focus(); }, 60);
    });
  }

  // Trending navigation buttons
  const trendingMainPrev = document.getElementById('trendingMainPrev');
  const trendingMainNext = document.getElementById('trendingMainNext');
  const trendingScannerPrev = document.getElementById('trendingScannerPrev');
  const trendingScannerNext = document.getElementById('trendingScannerNext');
  
  function addTrendingNavigation(prevBtn, nextBtn, trackId) {
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const track = document.getElementById(trackId);
        if (track) {
          track.scrollBy({ left: -280, behavior: 'smooth' });
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const track = document.getElementById(trackId);
        if (track) {
          track.scrollBy({ left: 280, behavior: 'smooth' });
        }
      });
    }
  }
  
  addTrendingNavigation(trendingMainPrev, trendingMainNext, 'trendingMainTrack');
  addTrendingNavigation(trendingScannerPrev, trendingScannerNext, 'trendingScannerTrack');

  // Header CHAT quick launch (visible on main page)
  if (headerChatBtn) {
    headerChatBtn.addEventListener('click', () => {
      if (intro) intro.style.display = 'none';
      document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
      if (headerTermBtn) headerTermBtn.style.display = '';
      if (headerChatBtn) headerChatBtn.style.display = '';
      showFullChat();
    });
  }

  // Terminal input + mobile command chips
  if (termInput) {
    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = termInput.value;
        handleCommand(val);
        termInput.value = '';
      }
    });
  }

  document.querySelectorAll('.term-chip[data-cmd]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const c = chip.dataset.cmd;
      if (c && termInput) {
        handleCommand(c);
        termInput.focus();
      }
    });
  });

  // Header "TERMINAL" button (visible on main page)
  if (headerTermBtn) {
    headerTermBtn.addEventListener('click', () => {
      // if intro still present, remove it first so we go straight to main + terminal
      if (intro) intro.style.display = 'none';
      document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
      showTerminal();
    });
  }

  // === PROTOCOL CARDS ON MAIN PAGE (Game / Terminal / Misanthropic Chat) ===
  if (protoGame) {
    protoGame.addEventListener('click', () => {
      const gameSec = document.getElementById('game');
      if (gameSec) {
        gameSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Small visual nudge: focus the start button if overlay is visible
      setTimeout(() => {
        const start = document.getElementById('startGame');
        if (start && !document.getElementById('gameOverlay')?.classList.contains('hidden')) {
          start.focus();
        }
      }, 650);
    });
  }
  if (protoTerm) {
    protoTerm.addEventListener('click', () => {
      if (intro) intro.style.display = 'none';
      document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
      if (headerTermBtn) headerTermBtn.style.display = '';
      if (headerChatBtn) headerChatBtn.style.display = '';
      showTerminal();
    });
  }
  if (protoChat) {
    protoChat.addEventListener('click', () => {
      if (intro) intro.style.display = 'none';
      document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
      if (headerTermBtn) headerTermBtn.style.display = '';
      if (headerChatBtn) headerChatBtn.style.display = '';
      showFullChat();
    });
  }

  // Trending navigation buttons
  const trendingPrev = document.getElementById('trendingPrev');
  const trendingNext = document.getElementById('trendingNext');
  if (trendingPrev) {
    trendingPrev.addEventListener('click', () => {
      const track = document.getElementById('trendingTrack');
      if (track) {
        track.scrollBy({ left: -280, behavior: 'smooth' });
      }
    });
  }
  if (trendingNext) {
    trendingNext.addEventListener('click', () => {
      const track = document.getElementById('trendingTrack');
      if (track) {
        track.scrollBy({ left: 280, behavior: 'smooth' });
      }
    });
  }

  document.querySelectorAll('.nav a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      if (href === '#chat') {
        e.preventDefault();
        openChatExperience();
        return;
      }

      const sectionId = href.slice(1);
      if (!sectionId) return;
      const target = document.getElementById(sectionId);
      if (!target) return;

      e.preventDefault();
      navigateToMainSection(sectionId);
    });
  });

  // Keyboard shortcut: press ` or ~ from main page to open terminal quickly
  document.addEventListener('keydown', (e) => {
    if ((e.key === '`' || e.key === '~' || e.key === '§') && !termView.classList.contains('hidden') === false) {
      // if not already in terminal and not typing in input
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      // if intro is gone (we are in main), offer terminal
      if (!intro || intro.style.display === 'none' || !intro.parentNode) {
        e.preventDefault();
        showTerminal();
      }
    }
    if (e.key.toLowerCase() === 'escape') {
      if (!termView.classList.contains('hidden')) {
        e.preventDefault();
        // from terminal: go back to gate
        hideTerminal();
        showIntro();
      }
    }
  });

  // Initial: ALWAYS show the intro gate first (user requirement)
  // We do this very late so preloader + all normal inits finish underneath.
  setTimeout(() => {
    // Make sure preloader is gone
    const pre = document.getElementById('preloader');
    if (pre) { pre.classList.add('done'); if (pre.parentNode) pre.parentNode.removeChild(pre); }

    // Force show intro (covers everything)
    showIntro();

    // Optional: if someone really wants to bypass later we have the ` hotkey
  }, 420);

  // Expose tiny API for debug if needed
  window.__openTerminal = () => showTerminal();
  window.__showIntro = () => showIntro();
  window.openMisanthropicChat = () => showFullChat();
  window.openTerminal = () => showTerminal();

  // Header brand always returns to the intro gate / splash.
  const brand = document.querySelector('.brand');
  if (brand) {
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      hideTerminal();
      hideFullChat();
      showIntro();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();

/* =========================================================
   GROK BUILDER MODULE (integrated on misanthropic-site)
   Full SPA logic: 3 internal tabs, fetches, data-driven game,
   rich terminal (exact commands from spec), Bridge Chat,
   shared state so Terminal feeds Game + Explorer + Chat.
   ========================================================= */
(function initGrokBuilder() {
  const tabsContainer = document.getElementById('grok-tabs');
  const pages = {
    'gb-main': document.getElementById('gb-main'),
    'gb-terminal': document.getElementById('gb-terminal'),
    'gb-bridge': document.getElementById('gb-bridge')
  };

  if (!tabsContainer || !pages['gb-main']) return; // not on this page / not inserted

  let terminalData = { anthropic: [], dex: [], news: [] };
  let gameState = { score: 0, completed: [], inventory: [] };
  let commandHistory = [];
  let historyIndex = -1;

  const COMMANDS = [
    'fetch-anthropic', 'fetch-dex', 'fetch-news', 'help', 'clear', 'status', 'list',
    'about', 'skills', 'contact', 'social', 'projects', 'date', 'matrix', 'ca'
  ];

  const GB_CMD_HELP = {
    'fetch-anthropic': 'Fetch themed Anthropic insights (mock data)',
    'fetch-dex': 'Pull crypto data from Dexscreener',
    'fetch-news': 'Get latest headlines (mock data)',
    'status': 'Show current data and game state',
    'list': 'Refresh data explorer',
    'clear': 'Clear terminal output',
    'help': 'List all commands',
    'about': 'About $MISANTHROPIC',
    'skills': 'Site tech stack',
    'contact': 'Contact links',
    'social': 'Social media links',
    'projects': 'Featured projects',
    'date': 'Current date/time',
    'matrix': 'ASCII matrix animation',
    'ca': 'Show contract address',
  };

  // === MOCK DATA (themed to Antroposantrism + Anthropic) ===
  function getMockAnthropic() {
    return [
      { id: 'a1', title: 'AI ethics in the context of Antroposantrism', snippet: 'Antroposantrism proposes centering human experience while integrating machine reasoning as a collaborative partner rather than replacement.', category: 'ethics', ts: Date.now() - 40000 },
      { id: 'a2', title: 'Human-centered approach vs AI-focused approach', snippet: 'When systems optimize purely for capability, they lose the grounding signal that only lived human context can provide.', category: 'philosophy', ts: Date.now() - 120000 },
      { id: 'a3', title: 'Antroposantrism as a bridge discipline', snippet: 'Anthropology + Anthropic alignment + human flourishing. A framework for post-tool AI coexistence.', category: 'framework', ts: Date.now() - 300000 }
    ];
  }
  function getMockDex() {
    return [
      { id: 'd1', title: 'GMGN', price: 0.123, change: 2.3, volume: '1.2M', ts: Date.now() - 80000 },
      { id: 'd2', title: 'ANTHRO', price: 0.041, change: -1.8, volume: '420K', ts: Date.now() - 210000 },
      { id: 'd3', title: 'SANT', price: 1.87, change: 7.4, volume: '3.9M', ts: Date.now() - 550000 }
    ];
  }
  function getMockNews() {
    return [
      { id: 'n1', title: 'New report on AI and Antroposantrism', snippet: 'Researchers argue that centering human narrative in model training leads to more robust long-horizon reasoning.', source: 'CNN Jane', ts: Date.now() - 160000 },
      { id: 'n2', title: 'DK Screen: Anthropic releases new safety benchmarks', snippet: 'The benchmarks emphasize human interpretability and value alignment under distribution shift.', source: 'DK Screen', ts: Date.now() - 450000 }
    ];
  }

  function showGbPage(pageId) {
    Object.keys(pages).forEach(id => {
      if (pages[id]) pages[id].classList.toggle('active', id === pageId);
    });
    tabsContainer.querySelectorAll('.grok-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.gbPage === pageId);
    });
    if (pageId === 'gb-terminal') renderExplorer();
    if (pageId === 'gb-main') renderGame();
  }

  // === TERMINAL ===
  function addGbTerm(text, type = 'output') {
    const out = document.getElementById('gb-terminal-output');
    if (!out) return;
    const line = document.createElement('div');
    line.className = `line ${type}`;
    line.textContent = text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }

  function addGbTermLines(lines, type = 'output') {
    const out = document.getElementById('gb-terminal-output');
    if (!out) return;
    lines.forEach((txt, i) => {
      setTimeout(() => {
        const d = document.createElement('div');
        d.className = `line ${type}`;
        d.textContent = txt;
        out.appendChild(d);
        out.scrollTop = out.scrollHeight;
      }, i * 60);
    });
  }

  function clearGbTerm() {
    const out = document.getElementById('gb-terminal-output');
    if (out) out.innerHTML = '';
  }

  function updateGbHint() {
    const input = document.getElementById('gb-terminal-input');
    const hint = document.getElementById('gb-autocomplete-hint');
    if (!input || !hint) return;
    const v = (input.value || '').trim().toLowerCase();
    if (!v) {
      hint.textContent = 'Commands: fetch-anthropic | fetch-dex | fetch-news | help | clear | status';
      return;
    }
    const matches = COMMANDS.filter(c => c.startsWith(v));
    hint.textContent = matches.length ? 'Suggestions: ' + matches.join(' | ') : 'No match. Try "help".';
  }

  function gbAutocomplete() {
    const input = document.getElementById('gb-terminal-input');
    if (!input) return false;
    const v = (input.value || '').trim().toLowerCase();
    if (!v) return false;
    const m = COMMANDS.find(c => c.startsWith(v));
    if (m && m !== v) { input.value = m; return true; }
    return false;
  }

  async function simulateGbFetch(type) {
    const out = document.getElementById('gb-terminal-output');
    if (!out) return;

    if (type === 'anthropic') {
      addGbTerm('Fetching data from Anthropic API...', 'info');
      await new Promise(r => setTimeout(r, 580));
      const fresh = getMockAnthropic();
      terminalData.anthropic = [...terminalData.anthropic, ...fresh];
      addGbTerm('Success: 3 new insights loaded', 'success');
      fresh.forEach((it, i) => setTimeout(() => addGbTerm(`${i+1}. Insight: ${it.title} — ${it.snippet.slice(0,70)}...`), (i+1)*95));
    } else if (type === 'dex') {
      addGbTerm('Fetching market data from Dexscreener...', 'info');
      await new Promise(r => setTimeout(r, 420));

      let liveToken = null;
      try {
        // Use the exact pair the site already tracks (real $MISANTHROPIC data)
        const res = await fetch('https://api.dexscreener.com/latest/dex/pairs/solana/bsjw4nhx3kyr5m3nl12rcpfmtybnba5ncmw2pazstevv');
        if (res.ok) {
          const data = await res.json();
          const pair = data.pair || (data.pairs && data.pairs[0]);
          if (pair) {
            liveToken = {
              id: 'live-misanthropic',
              title: 'MISANTHROPIC (LIVE)',
              price: parseFloat(pair.priceUsd) || 0,
              change: pair.priceChange?.h24 || 0,
              volume: pair.volume?.h24 ? (pair.volume.h24 / 1e6).toFixed(2) + 'M' : '—',
              ts: Date.now()
            };
          }
        }
      } catch (e) {
        // silent fallback to mocks
      }

      let fresh = getMockDex();
      if (liveToken) {
        // Put the live one first, then some themed mocks
        fresh = [liveToken, ...fresh.slice(0, 2)];
      }
      terminalData.dex = [...terminalData.dex, ...fresh];

      addGbTerm('Success: Top tokens loaded', 'success');
      fresh.forEach((it, i) => {
        setTimeout(() => {
          const ch = it.change >= 0 ? '+' : '';
          const priceStr = typeof it.price === 'number' ? it.price.toFixed(it.price < 1 ? 4 : 3) : it.price;
          addGbTerm(`${i+1}. Token: ${it.title} - Price: $${priceStr} - Change: ${ch}${Number(it.change).toFixed(1)}%`);
        }, (i+1)*80);
      });
    } else if (type === 'news') {
      addGbTerm('Fetching latest headlines...', 'info');
      await new Promise(r => setTimeout(r, 520));
      const fresh = getMockNews();
      terminalData.news = [...terminalData.news, ...fresh];
      addGbTerm('Success: 2 articles loaded', 'success');
      fresh.forEach((it, i) => setTimeout(() => addGbTerm(`${i+1}. Title: ${it.title}`), (i+1)*85));
    }

    renderExplorer();
    renderGame();
  }

  function processGbCommand(raw) {
    const cmd = (raw || '').trim();
    if (!cmd) return;

    commandHistory.unshift(cmd);
    if (commandHistory.length > 28) commandHistory.pop();
    historyIndex = -1;

    addGbTerm('> ' + cmd, 'info');

    const lower = cmd.toLowerCase();

    if (lower === 'help') {
      addGbTermLines(['Available commands:'], 'info');
      Object.keys(GB_CMD_HELP).forEach((k) => {
        addGbTerm(`  ${k.padEnd(18)} — ${GB_CMD_HELP[k]}`, 'info');
      });
      return;
    }
    if (lower === 'clear' || lower === 'cls') { clearGbTerm(); return; }
    if (lower === 'status') {
      addGbTermLines([
        `anthropic:${terminalData.anthropic.length}  dex:${terminalData.dex.length}  news:${terminalData.news.length}`,
        `Game score: ${gameState.score}   Inventory: ${gameState.inventory.length}`
      ], 'info');
      return;
    }
    if (lower === 'list') { renderExplorer(); addGbTerm('Explorer refreshed.', 'info'); return; }

    if (lower === 'about') {
      addGbTermLines(['$MISANTHROPIC — Solana meme coin from Elon\'s Misanthropic tweet.', 'Mascot: crying flower. Mission: escape humanity.'], 'info');
      return;
    }
    if (lower === 'skills') {
      addGbTermLines(['Solana · pump.fun · DexScreener · Canvas game · flowerOS · AI chat'], 'info');
      return;
    }
    if (lower === 'contact' || lower === 'social') {
      addGbTermLines([`X: https://x.com/getmisanthropic`, `CA: ${window.CA || CA}`, 'pump.fun + DexScreener on main page'], 'info');
      return;
    }
    if (lower === 'projects') {
      addGbTermLines(['1. MISANTHROPIC RUN  2. flowerOS  3. Crying Flower Chat  4. Grok Builder'], 'info');
      return;
    }
    if (lower === 'date') {
      addGbTerm(new Date().toLocaleString(), 'info');
      return;
    }
    if (lower === 'matrix') {
      const cols = '01アイウエオカキ';
      for (let i = 0; i < 12; i++) {
        let line = '';
        for (let j = 0; j < 36; j++) line += cols[Math.floor(Math.random() * cols.length)];
        addGbTerm(line, 'success');
      }
      return;
    }
    if (lower === 'ca') {
      addGbTerm(`CA: ${window.CA || CA}`, 'success');
      return;
    }

    if (lower === 'fetch-anthropic') { simulateGbFetch('anthropic'); return; }
    if (lower === 'fetch-dex') { simulateGbFetch('dex'); return; }
    if (lower === 'fetch-news') { simulateGbFetch('news'); return; }

    addGbTerm("Command not found. Type 'help' for a list of commands.", 'error');
  }

  function initGbTerminal() {
    const input = document.getElementById('gb-terminal-input');
    const out = document.getElementById('gb-terminal-output');
    if (!input || !out) return;

    // boot message
    setTimeout(() => {
      addGbTerm('Grok Builder Terminal ready. Type "help" or use the quick buttons.', 'info');
    }, 180);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        processGbCommand(input.value);
        input.value = '';
        updateGbHint();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length) {
          historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
          input.value = commandHistory[historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) { historyIndex--; input.value = commandHistory[historyIndex]; }
        else { historyIndex = -1; input.value = ''; }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (!gbAutocomplete()) {
          const v = (input.value || '').trim().toLowerCase();
          const m = COMMANDS.filter(c => c.startsWith(v));
          if (m.length > 1) {
            const idx = m.indexOf(input.value);
            input.value = m[(idx + 1) % m.length];
          }
        }
        updateGbHint();
      }
    });

    input.addEventListener('input', updateGbHint);
    input.addEventListener('focus', updateGbHint);

    // quick buttons
    document.querySelectorAll('#gb-terminal .gb-term-btn[data-gbcmd]').forEach(b => {
      b.addEventListener('click', () => {
        processGbCommand(b.dataset.gbcmd);
        setTimeout(() => input.focus(), 50);
      });
    });

    out.addEventListener('click', () => input.focus());
  }

  // === DATA EXPLORER + CARDS ===
  function renderExplorer() {
    const container = document.getElementById('gb-data-explorer-content');
    const filterEl = document.getElementById('gb-data-filter');
    const sortEl = document.getElementById('gb-data-sort');
    if (!container) return;

    const f = (filterEl?.value || '').toLowerCase().trim();
    const sort = sortEl?.value || 'newest';

    container.innerHTML = '';

    const sections = [
      { key: 'anthropic', label: 'ANTHROPIC / ANTROPOSANTRISM INSIGHTS' },
      { key: 'dex', label: 'DEXSCREENER MARKET DATA' },
      { key: 'news', label: 'NEWS — CNN JANE / DK SCREEN' }
    ];

    let any = false;

    sections.forEach(sec => {
      let items = terminalData[sec.key] || [];
      if (!items.length) return;
      any = true;

      if (f) items = items.filter(x => (x.title + ' ' + (x.snippet || '') + ' ' + (x.source || '')).toLowerCase().includes(f));
      items = [...items].sort((a,b) => sort === 'alpha' ? (a.title||'').localeCompare(b.title||'') : (b.ts||0)-(a.ts||0));

      if (!items.length) return;

      const wrap = document.createElement('div');
      wrap.className = 'gb-data-section';
      wrap.innerHTML = `<h4>${sec.label}</h4>`;

      const grid = document.createElement('div');
      grid.className = 'gb-data-grid';

      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'gb-data-card';

        let meta = '', extra = '';
        if (sec.key === 'anthropic') {
          meta = `${item.category || ''} • ${new Date(item.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
          extra = `<div class="snippet">${item.snippet}</div>`;
        } else if (sec.key === 'dex') {
          meta = `$${item.price} • ${item.change>=0?'+':''}${item.change}% • Vol ${item.volume}`;
          extra = `<div class="snippet" style="color:#3fb950">Live token data</div>`;
        } else {
          meta = `${item.source} • ${new Date(item.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
          extra = `<div class="snippet">${item.snippet}</div>`;
        }

        card.innerHTML = `
          <div class="title">${item.title}</div>
          <div class="meta">${meta}</div>
          ${extra}
          <div class="gb-card-actions">
            <button class="details-btn">Details</button>
            <button class="use-btn">Use in Game</button>
          </div>
        `;

        card.addEventListener('click', (ev) => {
          if (!ev.target.closest('button')) showGbDetails(item, sec.key);
        });
        card.querySelector('.details-btn').addEventListener('click', (e) => { e.stopPropagation(); showGbDetails(item, sec.key); });
        card.querySelector('.use-btn').addEventListener('click', (e) => { e.stopPropagation(); addToGbInventory(item, sec.key); });

        grid.appendChild(card);
      });

      wrap.appendChild(grid);
      container.appendChild(wrap);
    });

    if (!any) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:14px;background:#161b22;border-radius:6px;border:1px dashed #30363d;color:#8b949e;font-size:12px';
      empty.innerHTML = 'No data. Run <span style="color:#58a6ff;font-family:monospace">fetch-anthropic</span>, <span style="color:#58a6ff;font-family:monospace">fetch-dex</span> or <span style="color:#58a6ff;font-family:monospace">fetch-news</span> above.';
      container.appendChild(empty);
    }
  }

  function showGbDetails(item, type) {
    let modal = document.getElementById('gb-details-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gb-details-modal';
      modal.className = 'gb-modal';
      modal.innerHTML = `
        <div class="gb-modal-content">
          <div class="gb-modal-header">
            <strong id="gb-modal-title"></strong>
            <button class="gb-modal-close">×</button>
          </div>
          <div id="gb-modal-body"></div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
      modal.querySelector('.gb-modal-close').addEventListener('click', () => modal.classList.remove('active'));
    }

    document.getElementById('gb-modal-title').textContent = item.title || 'Details';
    const body = document.getElementById('gb-modal-body');

    let html = '';
    if (type === 'anthropic') html = `<div style="font-size:13px;line-height:1.5">${item.snippet}<br><br><strong>Category:</strong> ${item.category}<br><strong>Time:</strong> ${new Date(item.ts).toLocaleString()}</div><div style="margin-top:12px"><button class="grok-tab" onclick="window.GB.addToInventory('${item.id}','${type}');document.getElementById('gb-details-modal').classList.remove('active')">Add to Game Inventory</button></div>`;
    else if (type === 'dex') html = `<div style="font-family:monospace;font-size:13px;color:#3fb950">Price: $${item.price}<br>Change: ${item.change>=0?'+':''}${item.change}%<br>Volume: ${item.volume}</div><div style="margin-top:12px"><button class="grok-tab" onclick="window.GB.addToInventory('${item.id}','${type}');document.getElementById('gb-details-modal').classList.remove('active')">Add to Game Inventory</button></div>`;
    else html = `<div style="font-size:13px;line-height:1.5">${item.snippet}<br><br><strong>Source:</strong> ${item.source}<br><strong>Time:</strong> ${new Date(item.ts).toLocaleString()}</div><div style="margin-top:12px"><button class="grok-tab" onclick="window.GB.addToInventory('${item.id}','${type}');document.getElementById('gb-details-modal').classList.remove('active')">Add to Game Inventory</button></div>`;

    body.innerHTML = html;
    modal.classList.add('active');
  }

  function addToGbInventory(item, type) {
    const exists = gameState.inventory.some(i => i.id === item.id && i._type === type);
    if (exists) return;

    gameState.inventory.push({ ...item, _type: type, addedAt: Date.now() });
    if (!gameState.completed.includes(`m-${type}-${item.id}`)) gameState.score += 1;

    renderGame();
    renderExplorer();

    // optional toast in terminal
    const out = document.getElementById('gb-terminal-output');
    if (out && !document.getElementById('gb-terminal').classList.contains('active') === false) {
      const l = document.createElement('div');
      l.className = 'line success';
      l.textContent = `+ Added to inventory: ${item.title}`;
      out.appendChild(l);
      out.scrollTop = out.scrollHeight;
    }
  }

  window.GB = window.GB || {};
  window.GB.addToInventory = (id, type) => {
    let item;
    if (type === 'anthropic') item = terminalData.anthropic.find(x => x.id === id);
    else if (type === 'dex') item = terminalData.dex.find(x => x.id === id);
    else item = terminalData.news.find(x => x.id === id);
    if (item) addToGbInventory(item, type);
    const m = document.getElementById('gb-details-modal');
    if (m) m.classList.remove('active');
  };
  window.GB.reset = () => {
    terminalData = { anthropic: [], dex: [], news: [] };
    gameState = { score: 0, completed: [], inventory: [] };
    const out = document.getElementById('gb-terminal-output');
    if (out) out.innerHTML = '';
    addGbTerm('All Grok Builder data reset.', 'warning');
    renderExplorer();
    renderGame();
  };
  window.GB.renderExplorer = renderExplorer;

  // === GAME (data-driven mini tasks) ===
  function renderGame() {
    const screen = document.getElementById('gb-game-screen');
    const inv = document.getElementById('gb-inventory-cards');
    if (!screen || !inv) return;

    screen.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'gb-game-header';
    header.innerHTML = `<div>ANTROPOSANTRISM PROTOCOL</div><div class="gb-game-metrics"><span>SCORE: ${gameState.score}</span><span>ARTIFACTS: ${gameState.inventory.length}</span></div>`;
    screen.appendChild(header);

    const area = document.createElement('div');
    area.className = 'gb-game-area';

    const hasData = terminalData.anthropic.length + terminalData.dex.length + terminalData.news.length > 0;

    if (!hasData) {
      const ph = document.createElement('div');
      ph.className = 'gb-game-placeholder';
      ph.innerHTML = 'Click to start the game<br><span style="font-size:11px;opacity:.7">(Fetch data in the Terminal tab first)</span>';
      ph.onclick = () => showGbPage('gb-terminal');
      area.appendChild(ph);
    } else {
      const missions = generateGbMissions();
      if (missions.length === 0) {
        const note = document.createElement('div');
        note.style.cssText = 'color:#8b949e;font-size:12px;padding:10px 0';
        note.textContent = 'All missions complete for current data. Fetch more in Terminal.';
        area.appendChild(note);
      } else {
        missions.forEach(m => {
          const row = document.createElement('div');
          row.className = 'gb-mission';
          const done = gameState.completed.includes(m.id);
          row.innerHTML = `<div class="gb-mission-info"><div class="gb-mission-title">${m.title}</div><div class="gb-mission-source">${m.source}</div></div>`;
          const btn = document.createElement('button');
          btn.textContent = done ? 'DONE' : 'EXECUTE';
          btn.disabled = done;
          if (!done) btn.onclick = () => completeGbMission(m);
          row.appendChild(btn);
          area.appendChild(row);
        });
      }
      const sync = document.createElement('div');
      sync.style.marginTop = '8px';
      const b = document.createElement('button');
      b.className = 'grok-tab';
      b.style.padding = '4px 10px';
      b.textContent = 'Sync latest terminal data';
      b.onclick = renderGame;
      sync.appendChild(b);
      area.appendChild(sync);
    }
    screen.appendChild(area);

    // inventory
    inv.innerHTML = '';
    if (gameState.inventory.length === 0) {
      const e = document.createElement('div');
      e.style.cssText = 'font-size:10px;color:#8b949e';
      e.textContent = 'No artifacts. Use cards in Terminal tab.';
      inv.appendChild(e);
    } else {
      gameState.inventory.slice().reverse().forEach(it => {
        const c = document.createElement('div');
        c.className = 'gb-inv-card';
        c.textContent = it.title || it.id;
        c.onclick = () => showGbDetails(it, it._type);
        inv.appendChild(c);
      });
    }
  }

  function generateGbMissions() {
    const m = [];
    terminalData.anthropic.forEach(it => {
      const id = `m-anthropic-${it.id}`;
      if (!gameState.completed.includes(id)) m.push({ id, title: `Analyze: ${it.title}`, source: 'ANTHROPIC • ' + (it.category||''), dataItem: it, type: 'anthropic' });
    });
    terminalData.dex.forEach(it => {
      const id = `m-dex-${it.id}`;
      if (!gameState.completed.includes(id)) m.push({ id, title: `Market scan: ${it.title}`, source: 'DEXSCREENER', dataItem: it, type: 'dex' });
    });
    terminalData.news.slice(0,2).forEach(it => {
      const id = `m-news-${it.id}`;
      if (!gameState.completed.includes(id)) m.push({ id, title: `Contextualize: ${it.title}`, source: it.source, dataItem: it, type: 'news' });
    });
    return m.slice(0, 5);
  }

  function completeGbMission(miss) {
    if (gameState.completed.includes(miss.id)) return;
    gameState.completed.push(miss.id);
    gameState.score += (miss.type === 'dex' ? 4 : 3);

    const already = gameState.inventory.some(i => i.id === miss.dataItem.id);
    if (!already) gameState.inventory.push({ ...miss.dataItem, _type: miss.type, addedAt: Date.now() });

    renderGame();
    renderExplorer();
  }

  // === BRIDGE CHAT ===
  function appendGbChat(who, text) {
    const box = document.getElementById('gb-chat-messages');
    if (!box) return;
    const div = document.createElement('div');
    div.className = `gb-message ${who}`;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function simulateGbBridge(userText) {
    const box = document.getElementById('gb-chat-messages');
    if (!box) return;

    const typing = document.createElement('div');
    typing.className = 'gb-message system';
    typing.style.opacity = '0.6';
    typing.textContent = 'GMGN bridge thinking...';
    box.appendChild(typing);
    box.scrollTop = box.scrollHeight;

    setTimeout(() => {
      if (typing.parentNode) typing.parentNode.removeChild(typing);

      const lower = userText.toLowerCase();
      let reply = '';

      if (lower.includes('token') || lower.includes('dex') || lower.includes('gmgn') || lower.includes('price')) {
        if (terminalData.dex.length) {
          const top = [...terminalData.dex].sort((a,b)=>b.price-a.price)[0];
          reply = `GMGN bridge: Leader ${top.title} @ $${top.price} (${top.change>=0?'+':''}${top.change}%). Vol ${top.volume}.`;
        } else reply = 'No Dex data yet. Use fetch-dex in Terminal.';
      } else if (lower.includes('antroposantrism') || lower.includes('anthropic')) {
        reply = terminalData.anthropic.length ? `Bridge: "${terminalData.anthropic[0].title}". ${terminalData.anthropic[0].snippet.slice(0,90)}...` : 'Fetch anthropic data first.';
      } else if (lower.includes('news')) {
        reply = terminalData.news.length ? `Latest: ${terminalData.news[0].title}` : 'No news buffered.';
      } else {
        reply = 'GMGN.ai bridge active. Try "top tokens", "Antroposantrism + AI", or "recommend a token".';
      }
      appendGbChat('system', reply);
    }, 650);
  }

  function initGbBridge() {
    const input = document.getElementById('gb-chat-input');
    const send = document.getElementById('gb-chat-send');
    const box = document.getElementById('gb-chat-messages');
    if (!input || !send || !box) return;

    const doSend = () => {
      const v = input.value.trim();
      if (!v) return;
      appendGbChat('user', v);
      input.value = '';
      simulateGbBridge(v);
    };

    send.addEventListener('click', doSend);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });

    document.querySelectorAll('#gb-bridge .gb-suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const msg = chip.dataset.gbmsg;
        appendGbChat('user', msg);
        simulateGbBridge(msg);
      });
    });

    // seed
    setTimeout(() => {
      if (box.children.length === 0) appendGbChat('system', 'GMGN.ai bridge connected. Terminal data is live for answers.');
    }, 380);
  }

  // === BOOT THE BUILDER ===
  function bootGrokBuilder() {
    // Tab clicks
    tabsContainer.querySelectorAll('.grok-tab[data-gb-page]').forEach(btn => {
      btn.addEventListener('click', () => showGbPage(btn.dataset.gbPage));
    });

    // Init sub modules
    initGbTerminal();
    initGbBridge();

    // Demo seed: make the Grok Builder immediately useful with some Antroposantrism data
    if (terminalData.anthropic.length === 0) {
      terminalData.anthropic = getMockAnthropic().slice(0, 2);
    }
    if (terminalData.dex.length === 0) {
      terminalData.dex = getMockDex().slice(0, 1);
    }
    renderGame();

    // Keyboard: press "g" (when not typing) to jump to builder
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'g' && document.activeElement.tagName === 'BODY') {
        const sec = document.getElementById('grok-builder');
        if (sec) {
          e.preventDefault();
          sec.scrollIntoView({ behavior: 'smooth' });
          showGbPage('gb-terminal');
        }
      }
    });

    // Expose for console / other scripts
    window.GB = window.GB || {};
    window.GB.show = (p = 'gb-main') => { const s = document.getElementById('grok-builder'); if (s) s.scrollIntoView({behavior:'smooth'}); showGbPage(p); };
    window.GB.getState = () => ({ terminalData, gameState });

    // Optional: pre-seed a tiny bit of data so the builder feels alive on first visit (comment out if you want clean)
    // terminalData.anthropic = getMockAnthropic().slice(0,1); renderGame();

    // === HEADER BUTTONS: repurpose TERMINAL / CHAT / new BUILDER to target Grok Builder tabs ===
    const headerTermBtn = document.getElementById('headerTermBtn');
    const headerChatBtn = document.getElementById('headerChatBtn');
    const headerBuilderBtn = document.getElementById('headerBuilderBtn');

    function goToGrok(tab) {
      const sec = document.getElementById('grok-builder');
      if (sec) {
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setTimeout(() => {
        if (typeof showGbPage === 'function') showGbPage(tab);
      }, 380);
    }

    if (headerTermBtn) {
      headerTermBtn.addEventListener('click', () => {
        // Remove intro gate if present so we land on main content
        const introEl = document.getElementById('intro');
        if (introEl) introEl.style.display = 'none';
        document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
        goToGrok('gb-terminal');
      });
    }

    if (headerChatBtn) {
      headerChatBtn.addEventListener('click', () => {
        const introEl = document.getElementById('intro');
        if (introEl) introEl.style.display = 'none';
        document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
        goToGrok('gb-bridge');
      });
    }

    if (headerBuilderBtn) {
      headerBuilderBtn.addEventListener('click', () => {
        const introEl = document.getElementById('intro');
        if (introEl) introEl.style.display = 'none';
        document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
        goToGrok('gb-main');
      });
    }

    // Legacy raw terminal button inside Grok Builder
    const legacyBtn = document.getElementById('gb-legacy-terminal');
    if (legacyBtn) {
      legacyBtn.addEventListener('click', () => {
        const introEl = document.getElementById('intro');
        if (introEl) introEl.style.display = 'none';
        document.querySelectorAll('.chat-fab, .back-top').forEach(el => el.style.display = '');
        if (typeof window.__openTerminal === 'function') {
          window.__openTerminal();
        } else if (typeof window.openTerminal === 'function') {
          window.openTerminal();
        }
      });
    }
  }

  // Boot when DOM is ready (safe even if script runs late)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGrokBuilder);
  } else {
    bootGrokBuilder();
  }
})();

document.addEventListener('DOMContentLoaded', () => {
    const flower = document.getElementById('flower-avatar');
    if (flower) {
        flower.addEventListener('click', () => {
            flower.classList.add('crying');
            setTimeout(() => flower.classList.remove('crying'), 2000);
        });
    }
});
