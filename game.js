(function () {
  console.log('Game Engine Fixed');

  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('scoreDisplay');
  const highScoreEl = document.getElementById('highScoreDisplay');
  const pumpEl = document.getElementById('pumpDisplay');
  const overlay = document.getElementById('gameOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const startBtn = document.getElementById('startGame');
  const restartBtn = document.getElementById('restartGame');
  const deathMsgEl = document.getElementById('deathMessage');

  const GROUND_Y = 320;
  const LOGIC_W = 720;
  const LOGIC_H = 420;
  const GRAVITY = 0.65;
  const JUMP_FORCE = -13;
  const BASE_SPEED = 5;
  const MAX_SPEED = 7.6; // hard cap so game never becomes unplayably fast later on

  function getDeathMessages() {
    const msgs = window.I18n?.t('game.death');
    return Array.isArray(msgs) ? msgs : ['Game Over'];
  }

  function t(key) {
    return window.I18n?.t(key) || key;
  }

  let flowerImg = new Image();
  let flowerImgReady = false;
  flowerImg.onload = () => { flowerImgReady = true; };
  flowerImg.onerror = () => { flowerImgReady = false; console.warn('flower img failed, using fallback circle'); };
  flowerImg.src = 'assets/flower.png';

  let state = 'idle';
  let frame = 0;
  let score = 0;
  let pump = 0;
  function getStoredScore() {
    try {
      return localStorage.getItem('misanthropic_high') || localStorage.getItem('misanthrope_high') || '0';
    } catch { return '0'; }
  }
  function setStoredScore(val) {
    try { localStorage.setItem('misanthropic_high', val); } catch { /* ignore */ }
  }
  let highScore = parseInt(getStoredScore(), 10);
  let speed = BASE_SPEED;
  let shakeTimer = 0;

  let autoMode = false;
  let autoLoops = 0;

  const player = {
    x: 120,
    y: GROUND_Y,
    w: 52,
    h: 52,
    vy: 0,
    grounded: true,
    rotation: 0
  };
  let obstacles = [], collectibles = [], clouds = [], tears = [];
  let keys = {}; // for A/D left/right movement

  highScoreEl.textContent = highScore;

  function resetGame() {
    score = 0; pump = 0; speed = BASE_SPEED; frame = 0;
    player.x = 120;
    player.y = GROUND_Y; player.vy = 0; player.grounded = true; player.rotation = 0;
    obstacles = []; collectibles = []; tears = [];
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = score;
    pumpEl.textContent = pump;
    highScoreEl.textContent = highScore;
    // live auto status badge (added/removed dynamically)
    const hsParent = highScoreEl && highScoreEl.parentElement;
    let badge = hsParent && hsParent.querySelector('.auto-badge');
    if (autoMode) {
      if (!badge && hsParent) {
        badge = document.createElement('span');
        badge.className = 'auto-badge';
        badge.style.cssText = 'font-size:10px;margin-left:6px;padding:1px 5px;border:1px solid #4ecdc4;color:#4ecdc4;border-radius:3px';
        hsParent.appendChild(badge);
      }
      if (badge) badge.textContent = '★AUTO×' + (autoLoops || 0);
      if (pumpEl) pumpEl.title = 'Auto loops: ' + autoLoops;
    } else if (badge) {
      badge.remove();
    }
  }

  function startGame() {
    resetGame();
    state = 'playing';
    overlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
  }

  function restartGame() {
    // Full reset including AUTO mode on manual restart
    if (autoMode) setAutoMode(false);
    startGame();
  }

  function endGame() {
    if (autoMode) {
      // Skip death entirely. Keep score & pump growing. Clear threats only. Infinite run.
      autoLoops++;
      // clear only dangerous stuff, preserve imminent collectibles so we don't lose stars
      obstacles = [];
      const keepDist = 95;
      collectibles = collectibles.filter((c) => !c.collected && (c.x - player.x) < keepDist);
      tears = [];
      // reposition player safely on ground
      player.x = 130;
      player.y = GROUND_Y;
      player.vy = 0;
      player.grounded = true;
      player.rotation = 0;
      // keep state playing, hide any overlays just in case
      state = 'playing';
      overlay.classList.add('hidden');
      if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
      updateHUD();
      return;
    }
    // normal (manual) death
    state = 'dead';
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('misanthropic_high', String(highScore));
    }
    const msgs = getDeathMessages();
    deathMsgEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalPump').textContent = pump;
    gameOverOverlay.classList.remove('hidden');
    shakeTimer = 20;
    updateHUD();
  }

  function jump() {
    if (state !== 'playing' || !player.grounded) return;
    player.vy = JUMP_FORCE;
    player.grounded = false;
    tears.push({ x: player.x + 20, y: player.y + 10, vy: -1, life: 30 });
  }

  function spawnObstacle() {
    const types = [
      { emoji: '🧑‍🤝‍🧑', w: 48, h: 48 }, { emoji: '👨‍👩‍👧‍👦', w: 56, h: 48 },
      { emoji: '🗣️', w: 40, h: 40 }, { emoji: '📢', w: 44, h: 44 },
      { emoji: '🤝', w: 42, h: 42 }, { emoji: '💼', w: 40, h: 44 },
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push({ x: canvas.width + 20, y: GROUND_Y + 52 - type.h, w: type.w, h: type.h, emoji: type.emoji });
  }

  function spawnCollectible() {
    const heights = [GROUND_Y - 30, GROUND_Y - 80, GROUND_Y - 130];
    collectibles.push({ x: canvas.width + 20, y: heights[Math.floor(Math.random() * heights.length)], w: 28, h: 28, collected: false, spin: Math.random() * Math.PI * 2 });
  }

  function initClouds() {
    clouds = Array.from({ length: 6 }, (_, i) => ({
      x: (canvas.width / 6) * i, y: 40 + Math.random() * 80, w: 80 + Math.random() * 60, speed: 0.3 + Math.random() * 0.5,
    }));
  }

  function rectsOverlap(a, b) {
    const pad = 8;
    return a.x + pad < b.x + b.w - pad && a.x + a.w - pad > b.x + pad && a.y + pad < b.y + b.h - pad && a.y + a.h - pad > b.y + pad;
  }

  function update() {
    if (state !== 'playing') return;
    frame++;
    // Much gentler speed ramp + hard cap. Game stays enjoyable even at high scores.
    speed = Math.min(BASE_SPEED + Math.floor(score / 380) * 0.26, MAX_SPEED);
    if (frame % 60 === 0) score++;

    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= GROUND_Y) { player.y = GROUND_Y; player.vy = 0; player.grounded = true; }
    player.rotation = player.grounded ? Math.sin(frame * 0.08) * 0.08 : player.vy * 0.02;

    // A/D (and arrows) horizontal movement - now playable with ASD / arrow keys
    const hSpeed = 4.8;
    if (keys['KeyA'] || keys['ArrowLeft']) player.x -= hSpeed;
    if (keys['KeyD'] || keys['ArrowRight']) player.x += hSpeed;
    player.x = Math.max(35, Math.min(canvas.width - 65, player.x));

    // AUTO MODE: perfect auto-jump to dodge humans + COLLECT EVERY STAR (predictive)
    if (autoMode && state === 'playing' && player.grounded) {
      const lookAhead = 150 + speed * 2.9;
      for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        const dist = o.x - player.x;
        if (dist > 8 && dist < lookAhead) {
          if (o.y + o.h >= GROUND_Y - 12) {
            jump();
            break;
          }
        }
      }

      // === SMART STAR COLLECTOR: jump for high/mid stars at the right time ===
      // We predict jump apex to line up perfectly with floating stars.
      const starLook = 195 + speed * 3.4;
      let jumpedForStar = false;
      for (let i = 0; i < collectibles.length; i++) {
        const c = collectibles[i];
        if (c.collected) continue;
        const dx = c.x - (player.x + 22);
        if (dx > 18 && dx < starLook) {
          const starHeight = GROUND_Y - c.y; // how high above ground (30/80/130)
          const isHigh = starHeight > 70;
          const isMidHigh = starHeight > 38;

          // Jump lead tuned to apex timing so we are rising or at peak when star passes us.
          // Jump apex ~19-21 frames. Distance = speed * lead.
          const framesToPeak = isHigh ? 19.5 : 17;
          const jumpLead = framesToPeak * speed * (isHigh ? 0.94 : 0.88);

          if (dx < jumpLead + (isHigh ? 18 : 6)) {
            jump();
            jumpedForStar = true;
            break;
          }
        }
      }

      // Aggressive auto-steer (faster in auto) — head toward the next best star we can reach
      let targetStar = null;
      let bestD = 9999;
      for (let i = 0; i < collectibles.length; i++) {
        const c = collectibles[i];
        if (c.collected) continue;
        const d = Math.abs(c.x - (player.x + 26));
        if (d < bestD && c.x > player.x - 55) {
          bestD = d;
          targetStar = c;
        }
      }
      if (targetStar && bestD < 320) {
        const steerSpeed = 5.8; // much stronger horizontal in auto so we line up perfectly
        const targetX = targetStar.x - 20;
        if (targetX < player.x - 4) player.x -= steerSpeed;
        else if (targetX > player.x + 4) player.x += steerSpeed;
      }
    }

    if (frame % Math.max(55 - Math.floor(score / 100), 28) === 0) spawnObstacle();
    if (frame % Math.max(90 - Math.floor(score / 80), 40) === 0) spawnCollectible();

    obstacles.forEach((o) => { o.x -= speed; });
    collectibles.forEach((c) => { c.x -= speed; c.spin += 0.08; });
    clouds.forEach((c) => { c.x -= c.speed; if (c.x + c.w < 0) c.x = canvas.width + 20; });
    tears.forEach((t) => { t.y += t.vy; t.life--; });
    tears = tears.filter((t) => t.life > 0);

    const pb = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const o of obstacles) if (rectsOverlap(pb, o)) { endGame(); return; }
    for (const c of collectibles) {
      if (!c.collected && rectsOverlap(pb, c)) {
        c.collected = true; pump++; score += 25;
        for (let i = 0; i < 5; i++) tears.push({ x: c.x, y: c.y, vy: -1, life: 30 });
      }
    }
    obstacles = obstacles.filter((o) => o.x + o.w > -20);
    collectibles = collectibles.filter((c) => c.x + c.w > -20 && !c.collected);
    updateHUD();
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#3d2518'); grad.addColorStop(0.5, '#5c3828'); grad.addColorStop(1, '#2a1a12');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    clouds.forEach((c) => {
      ctx.fillStyle = 'rgba(255,248,243,0.06)';
      ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w / 2, 20, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#1a1210'; ctx.fillRect(0, GROUND_Y + 52, canvas.width, canvas.height - GROUND_Y - 52);
    ctx.strokeStyle = 'rgba(201,111,74,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 52); ctx.lineTo(canvas.width, GROUND_Y + 52); ctx.stroke();
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.fillStyle = 'rgba(201,111,74,0.15)';
      ctx.fillRect(i - (frame * speed * 0.5) % 40, GROUND_Y + 58, 20, 4);
    }
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    ctx.rotate(player.rotation);
    if (flowerImgReady) {
      ctx.beginPath(); ctx.arc(0, 0, player.w / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(flowerImg, -player.w / 2, -player.h / 2, player.w, player.h);
    } else {
      // Fallback: draw a simple flower emoji circle so character is always visible
      ctx.fillStyle = '#c96f4a';
      ctx.beginPath(); ctx.arc(0, 0, player.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌸', 0, 0);
    }
    ctx.restore();

    // Auto glow ring (subtle perfect-collector aura)
    if (autoMode) {
      ctx.strokeStyle = 'rgba(78,205,196,0.55)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2 + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    if (frame % 30 < 15) {
      ctx.fillStyle = '#4ecdc4';
      ctx.beginPath(); ctx.ellipse(player.x + 34, player.y + 22, 4, 6, 0.3, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawObstacles() {
    ctx.font = '36px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    obstacles.forEach((o) => ctx.fillText(o.emoji, o.x + o.w / 2, o.y + o.h / 2));
  }

  function drawCollectibles() {
    collectibles.forEach((c) => {
      if (c.collected) return;
      ctx.save(); ctx.translate(c.x + c.w / 2, c.y + c.h / 2); ctx.rotate(c.spin);
      ctx.fillStyle = '#fff8f3'; ctx.shadowColor = '#c96f4a'; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(4, -4); ctx.lineTo(12, -4); ctx.lineTo(6, 2);
      ctx.lineTo(8, 12); ctx.lineTo(0, 7); ctx.lineTo(-8, 12); ctx.lineTo(-6, 2);
      ctx.lineTo(-12, -4); ctx.lineTo(-4, -4); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
  }

  function drawTears() {
    tears.forEach((t) => {
      ctx.globalAlpha = t.life / 30; ctx.fillStyle = '#4ecdc4';
      ctx.beginPath(); ctx.ellipse(t.x, t.y, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    if (state !== 'playing') return;
    const isMax = speed >= MAX_SPEED - 0.05;
    ctx.fillStyle = isMax ? '#4ecdc4' : 'rgba(255,248,243,0.7)';
    ctx.font = '600 14px Space Grotesk, sans-serif';
    ctx.textAlign = 'left';
    const speedStr = speed.toFixed(1) + (isMax ? ' (MAX)' : '');
    ctx.fillText(t('game.speed') + ': ' + speedStr, 16, 28);

    // Nice on-canvas AUTO indicator (visible when running perfectly)
    if (autoMode) {
      ctx.fillStyle = 'rgba(78, 205, 196, 0.92)';
      ctx.font = '700 12.5px Space Grotesk, sans-serif';
      ctx.textAlign = 'left';
      // place nicely on right side, adapts to resized canvas
      const rightTextX = Math.min(770, canvas.width - 130);
      ctx.fillText('★ AUTO — CATCHING EVERY STAR', rightTextX, 28);
    }
  }

  function draw() {
    ctx.save();
    if (shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      shakeTimer--;
    }
    drawBackground(); drawCollectibles(); drawObstacles(); drawTears(); drawPlayer(); drawHUD();
    ctx.restore();
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  function handleResize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const aspect = LOGIC_W / LOGIC_H;

    canvas.style.width = w + 'px';
    canvas.style.height = (w / aspect) + 'px';

    // Keep fixed logical resolution — scale via CSS only (prevents coordinate bugs)
    if (canvas.width !== LOGIC_W || canvas.height !== LOGIC_H) {
      canvas.width = LOGIC_W;
      canvas.height = LOGIC_H;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  // === AUTO INFINITE MODE (perfect star collector — catches every star, infinite run, no deaths) ===
  function setAutoMode(on) {
    autoMode = !!on;
    if (autoMode) {
      // force into play immediately, bypass start overlay and death overlay
      if (state !== 'playing') {
        resetGame();
        state = 'playing';
        overlay.classList.add('hidden');
        if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
      }
      autoLoops = autoLoops || 0;
    }
    updateHUD();
    if (autoBtnEl) {
      autoBtnEl.textContent = autoMode ? '∞ AUTO RUNNING (STOP)' : '∞ AUTO (infinite run)';
      autoBtnEl.style.borderColor = autoMode ? '#4ecdc4' : '';
      autoBtnEl.style.color = autoMode ? '#4ecdc4' : '';
    }
  }

  let autoBtnEl = null;

  function createAutoButton() {
    const headerRight = document.querySelector('#game .game-header');
    if (!headerRight) return null;
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.style.cssText = 'font-size:12px;padding:6px 10px;margin-left:10px;border-color:#c96f4a;color:#c96f4a';
    btn.textContent = '∞ AUTO (infinite run)';
    btn.title = 'Auto plays perfectly: dodges all humans + catches EVERY star. Infinite loops, no death screens. Score & pumps climb forever.';
    btn.addEventListener('click', () => {
      setAutoMode(!autoMode);
    });
    // place it nicely in the header next to stats
    headerRight.appendChild(btn);
    return btn;
  }

  function createShareRunButton() {
    const headerRight = document.querySelector('#game .game-header');
    if (!headerRight) return null;
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.style.cssText = 'font-size:11px;padding:5px 9px;margin-left:6px;border-color:#4ecdc4;color:#4ecdc4;opacity:0.9';
    btn.textContent = '⤴ Share run';
    btn.title = 'Copy a nice summary of your current score + pumps (great for X @getmisanthropic when showing the perfect AUTO)';
    btn.addEventListener('click', () => {
      const msg = `MISANTHROPIC RUN — Score: ${score}  Pumps: ${pump}${autoMode ? `  (AUTO×${autoLoops || 0})` : ''}\nCrying flower dodged humans & collected every star.\nPlay: https://misanthropic.site  CA: AWQSXRxiNUGLj9moJMFhq2axqwu6Dqerp16ftj4FjLyG\n\n@getmisanthropic`;
      navigator.clipboard.writeText(msg).then(() => {
        const old = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => { btn.textContent = old; }, 1400);
      }).catch(() => {
        prompt('Copy this run:', msg);
      });
    });
    headerRight.appendChild(btn);
    return btn;
  }

  // URL param support: ?auto (opens site + game runs in perfect AUTO mode catching every star forever)
  function checkUrlAuto() {
    try {
      const params = new URLSearchParams(location.search);
      if (params.has('auto')) {
        // delay a little so canvas/DOM ready
        setTimeout(() => setAutoMode(true), 420);
      }
    } catch (_) {}
  }

  startBtn?.addEventListener('click', startGame);
  restartBtn?.addEventListener('click', restartGame);

  // Mouse + touch jump
  canvas.addEventListener('click', () => { if (state === 'playing') jump(); });
  canvas.addEventListener('touchstart', (e) => {
    if (state === 'playing') {
      e.preventDefault();
      jump();
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (state === 'playing') {
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) {
        e.preventDefault();
        jump();
      }
    }
  });
  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Mobile on-screen controls (touchstart/touchend for held movement)
  const mobileControls = document.getElementById('gameMobileControls');
  const touchKeys = { left: false, right: false };

  function applyTouchKeys() {
    keys['KeyA'] = touchKeys.left;
    keys['ArrowLeft'] = touchKeys.left;
    keys['KeyD'] = touchKeys.right;
    keys['ArrowRight'] = touchKeys.right;
  }

  mobileControls?.querySelectorAll('.game-touch-btn').forEach((btn) => {
    const action = btn.dataset.action;
    const start = (e) => {
      e.preventDefault();
      if (action === 'jump') {
        if (state === 'playing') jump();
      } else if (action === 'left') {
        touchKeys.left = true;
        applyTouchKeys();
      } else if (action === 'right') {
        touchKeys.right = true;
        applyTouchKeys();
      }
      btn.classList.add('active');
    };
    const end = (e) => {
      e.preventDefault();
      if (action === 'left') touchKeys.left = false;
      if (action === 'right') touchKeys.right = false;
      applyTouchKeys();
      btn.classList.remove('active');
    };
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('touchcancel', end, { passive: false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
  });

  window.addEventListener('resize', handleResize);

  // create the auto infinite button + share run + support direct ?auto launch
  autoBtnEl = createAutoButton();
  createShareRunButton();
  checkUrlAuto();

  initClouds(); handleResize(); loop();
})();