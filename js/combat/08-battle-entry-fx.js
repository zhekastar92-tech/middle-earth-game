// ============================================================
// BATTLE ENTRY EFFECTS
// Частицы рамок и JS rAF-анимации появления персонажей на арене.
// ============================================================

const _frameParticleTimers = new Map();

function startFrameParticles(cardEl) {
  stopFrameParticles(cardEl);
  let frameId = cardEl._frameId = Date.now();

  // Добавляем inner-элементы для рамок которым они нужны
  _addFrameInner(cardEl);

  let cls = cardEl.className;

  // 🩸 Кровь — искры снизу
  if (cls.includes('frame-blood')) {
    let t = setInterval(() => {
      if (cardEl._frameId !== frameId) { clearInterval(t); return; }
      _spawnBloodSpark(cardEl);
    }, 280);
    _frameParticleTimers.set(cardEl, t);
  }

  // 🌌 Бездна — звёзды снизу
  if (cls.includes('frame-void')) {
    let t = setInterval(() => {
      if (cardEl._frameId !== frameId) { clearInterval(t); return; }
      _spawnVoidStar(cardEl);
    }, 340);
    _frameParticleTimers.set(cardEl, t);
  }
}

function stopFrameParticles(cardEl) {
  let t = _frameParticleTimers.get(cardEl);
  if (t) { clearInterval(t); _frameParticleTimers.delete(cardEl); }
  cardEl._frameId = null;
  // Убираем inner-элементы
  let inner = cardEl.querySelector('.frame-inner-el');
  if (inner) inner.remove();
}

function _addFrameInner(cardEl) {
  // Убираем старый если есть
  let old = cardEl.querySelector('.frame-inner-el');
  if (old) old.remove();

  let cls = cardEl.className;
  let el = null;

  if (cls.includes('frame-astral')) {
    el = document.createElement('div');
    el.className = 'frame-inner-el frame-astral-inner';
  } else if (cls.includes('frame-valinor')) {
    el = document.createElement('div');
    el.className = 'frame-inner-el frame-valinor-inner';
  }

  if (el) cardEl.appendChild(el);
}

function _spawnBloodSpark(cardEl) {
  let rect = cardEl.getBoundingClientRect();
  if (!rect.width) return;
  let spark = document.createElement('div');
  spark.className = 'frame-blood-spark';
  let colors = ['rgba(255,150,50,0.95)', 'rgba(239,68,68,0.9)', 'rgba(255,200,50,0.85)', 'rgba(220,38,38,0.9)'];
  let col = colors[Math.floor(Math.random() * colors.length)];
  let x = 10 + Math.random() * 80; // % от ширины
  let driftX = (Math.random() - 0.5) * 18;
  let size = 1.5 + Math.random() * 2;
  spark.style.cssText = `left:${x}%;bottom:8%;width:${size}px;height:${size}px;background:${col};--sx:${driftX}px;`;
  cardEl.appendChild(spark);
  setTimeout(() => { if (spark.parentNode) spark.remove(); }, 1450);
}

function _spawnVoidStar(cardEl) {
  let star = document.createElement('div');
  star.className = 'frame-void-star';
  let chars = ['✦', '✧', '★', '·', '✦'];
  let ch = chars[Math.floor(Math.random() * chars.length)];
  let x = 8 + Math.random() * 84;
  let driftX = (Math.random() - 0.5) * 14;
  let opacity = 0.6 + Math.random() * 0.4;
  let size = 6 + Math.random() * 4;
  star.textContent = ch;
  star.style.cssText = `left:${x}%;bottom:10%;font-size:${size}px;color:rgba(167,139,250,${opacity});--sx:${driftX}px;`;
  cardEl.appendChild(star);
  setTimeout(() => { if (star.parentNode) star.remove(); }, 1850);
}

// Запускаем частицы когда рамка применяется в бою
function applyFrameToCard(cardEl, frameId) {
  stopFrameParticles(cardEl);
  if (frameId && typeof FRAME_META !== 'undefined' && FRAME_META[frameId]) {
    // Класс уже установлен снаружи, просто запускаем частицы
    setTimeout(() => startFrameParticles(cardEl), 100);
  }
}

// ============================================================
// JS-анимация эффекта появления — без CSS animation, только rAF
// Работает гарантированно в любом мобильном WebView включая Telegram
function playEntryEffect(cardEl, callback) {
  let effectId = gameData.entryEffect;
  if (!effectId || !ENTRY_EFFECT_META[effectId]) {
    cardEl.classList.remove('entry-hidden');
    if (callback) callback();
    return;
  }

  setTimeout(() => {
    // Убираем скрытие
    cardEl.classList.remove('entry-hidden');
    cardEl.style.overflow = 'visible';

    // Запускаем нужную анимацию
    switch (effectId) {
      case 'slide':    _animSlide(cardEl, callback);       break;
      case 'flash':    _animFlash(cardEl, callback);       break;
      case 'materialize': _animMaterialize(cardEl, callback); break;
      case 'impact':   _animImpact(cardEl, callback);      break;
      case 'rift':     _animRift(cardEl, callback);        break;
      case 'radiance': _animRadiance(cardEl, callback);    break;
      default:
        if (callback) callback();
    }
  }, 2000);
}

// Эффект появления для бота — аналог playEntryEffect но читает bot.entryEffect
function playBotEntryEffect(cardEl, callback) {
  let effectId = bot.entryEffect;
  if (!effectId || !ENTRY_EFFECT_META[effectId]) {
    cardEl.classList.remove('entry-hidden');
    if (callback) callback();
    return;
  }
  setTimeout(() => {
    cardEl.classList.remove('entry-hidden');
    cardEl.style.overflow = 'visible';
    switch (effectId) {
      case 'slide':        _animSlide(cardEl, callback);        break;
      case 'flash':        _animFlash(cardEl, callback);        break;
      case 'materialize':  _animMaterialize(cardEl, callback);  break;
      case 'impact':       _animImpact(cardEl, callback);       break;
      case 'rift':         _animRift(cardEl, callback);         break;
      case 'radiance':     _animRadiance(cardEl, callback);     break;
      default: if (callback) callback();
    }
  }, 1500); // Бот появляется чуть быстрее (без задержки ожидания UI)
}

// Утилита: easeOut кубический
function _easeOut(t) { return 1 - Math.pow(1 - t, 3); }
// Утилита: упругий выброс
function _easeElastic(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
}
// Запускает rAF-цикл duration мс, вызывает fn(progress 0..1) каждый кадр, потом done()
function _rAF(duration, fn, done) {
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    let p = Math.min((ts - start) / duration, 1);
    fn(p);
    if (p < 1) requestAnimationFrame(step);
    else { fn(1); if (done) done(); }
  }
  requestAnimationFrame(step);
}
function _clearStyle(el) {
  el.style.opacity = '';
  el.style.transform = '';
  el.style.filter = '';
  el.style.boxShadow = '';
}

// ⚡ Слайд снизу (Эпик)
function _animSlide(el, cb) {
  _rAF(550, p => {
    let e = _easeElastic(p);
    let y = (1 - e) * 30;
    let op = Math.min(p * 3, 1);
    el.style.opacity = op;
    el.style.transform = `translateY(${y}px)`;
  }, () => { _clearStyle(el); if (cb) cb(); });
}

// 💥 Вспышка (Эпик)
function _animFlash(el, cb) {
  _rAF(500, p => {
    let e = _easeOut(p);
    let op = p < 0.3 ? (p / 0.3) : 1;
    let blur = p < 0.3 ? (1 - p/0.3) * 6 : 0;
    let bright = p < 0.3 ? (1 + (1 - p/0.3) * 3) : 1;
    let scale = p < 0.3 ? (0.87 + e * 0.18) : 1;
    el.style.opacity = op;
    el.style.transform = `scale(${scale})`;
    el.style.filter = `brightness(${bright}) blur(${blur}px)`;
  }, () => { _clearStyle(el); if (cb) cb(); });
}

// 🌫️ Материализация (Легенда)
function _animMaterialize(el, cb) {
  _rAF(850, p => {
    let e = _easeOut(p);
    let op = p < 0.45 ? (p / 0.45) * 0.8 : (0.8 + (p - 0.45) / 0.55 * 0.2);
    let blur = (1 - e) * 12;
    let scale = 1 + (1 - e) * 0.2;
    let bright = 1 + (1 - e) * 1.5;
    el.style.opacity = Math.min(op, 1);
    el.style.transform = `scale(${scale})`;
    el.style.filter = `blur(${blur}px) brightness(${bright})`;
  }, () => { _clearStyle(el); if (cb) cb(); });
}

// 🔨 Удар с небес (Легенда)
function _animImpact(el, cb) {
  // Волна под карточкой
  let wave = document.createElement('div');
  wave.style.cssText = 'position:absolute;bottom:-4px;left:5px;right:5px;height:2px;border-radius:1px;transform-origin:center;background:linear-gradient(90deg,transparent,rgba(251,191,36,0.75),rgba(253,230,138,0.95),rgba(251,191,36,0.75),transparent);pointer-events:none;z-index:5;';
  el.appendChild(wave);

  _rAF(650, p => {
    let e = _easeOut(p);
    // Падение: 0→55% быстро, потом отскок
    let y, scale, op;
    if (p < 0.55) {
      let pp = p / 0.55;
      y = (1 - pp) * (-55);
      scale = 0.82 + pp * 0.23;
      op = Math.min(pp * 2, 1);
    } else {
      let pp = (p - 0.55) / 0.45;
      y = pp < 0.4 ? 5 * (1 - pp/0.4) : 0;
      scale = 1.05 - pp * 0.05;
      op = 1;
    }
    el.style.opacity = op;
    el.style.transform = `translateY(${y}px) scale(${scale})`;
    // Волна расходится в момент удара
    if (p >= 0.55) {
      let wp = (p - 0.55) / 0.45;
      wave.style.transform = `scaleX(${1 + wp})`;
      wave.style.opacity = (1 - wp) * 0.8;
    }
  }, () => {
    _clearStyle(el);
    if (wave.parentNode) wave.remove();
    if (cb) cb();
  });
}

// 🌀 Разрыв пространства (Миф)
function _animRift(el, cb) {
  // Вспышка-оверлей
  let flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;border-radius:12px;pointer-events:none;z-index:10;background:transparent;';
  el.appendChild(flash);

  _rAF(950, p => {
    let e = _easeOut(p);
    let op, scale, blur, bright;
    if (p < 0.38) {
      let pp = p / 0.38;
      op = pp;
      scale = pp * 1.12;
      blur = (1 - pp) * 22;
      bright = 1 + (1 - pp) * 5;
    } else if (p < 0.65) {
      let pp = (p - 0.38) / 0.27;
      op = 1;
      scale = 1.12 - pp * 0.15;
      blur = 0;
      bright = 1 + (1 - pp) * 0.1;
    } else {
      op = 1; scale = 0.97 + (p - 0.65) / 0.35 * 0.03; blur = 0; bright = 1;
    }
    el.style.opacity = op;
    el.style.transform = `scale(${scale})`;
    el.style.filter = `blur(${blur}px) brightness(${bright})`;
    // Вспышка фиолетовая в середине
    let fOp = p > 0.32 && p < 0.72 ? Math.sin((p - 0.32) / 0.40 * Math.PI) * 0.5 : 0;
    flash.style.background = `rgba(109,40,217,${fOp * 0.8})`;
  }, () => {
    _clearStyle(el);
    if (flash.parentNode) flash.remove();
    if (cb) cb();
  });
}

// ✨ Сияние Валинора (Миф)
function _animRadiance(el, cb) {
  // Кольцо
  let ring = document.createElement('div');
  ring.style.cssText = 'position:absolute;inset:-7px;border:2px solid rgba(253,230,138,0.7);border-radius:12px;pointer-events:none;z-index:10;';
  el.appendChild(ring);

  _rAF(900, p => {
    let e = _easeOut(p);
    let scale, op, blur, bright, glow;
    if (p < 0.30) {
      let pp = p / 0.30;
      scale = 0.4 + pp * 0.7;
      op = pp;
      blur = (1 - pp) * 8;
      bright = 1 + (1 - pp) * 5;
      glow = pp * 80;
    } else if (p < 0.58) {
      let pp = (p - 0.30) / 0.28;
      scale = 1.1 - pp * 0.12;
      op = 1;
      blur = pp * 0; bright = 2.8 - pp * 1.6; glow = 80 - pp * 52;
    } else {
      let pp = (p - 0.58) / 0.42;
      scale = 0.98 + pp * 0.02;
      op = 1; blur = 0; bright = 1.2 - pp * 0.2; glow = 28 - pp * 28;
    }
    el.style.opacity = op;
    el.style.transform = `scale(${scale})`;
    el.style.filter = `brightness(${bright}) blur(${blur}px)`;
    el.style.boxShadow = glow > 0 ? `0 0 ${glow}px rgba(253,230,138,0.9)` : '';
    // Кольцо расширяется
    let rScale = 0.75 + p * 2.25;
    let rOp = (1 - p) * 0.95;
    ring.style.transform = `scale(${rScale})`;
    ring.style.opacity = rOp;
  }, () => {
    _clearStyle(el);
    if (ring.parentNode) ring.remove();
    if (cb) cb();
  });
}

function returnToMenu() {
  stopFrameParticles(document.getElementById("player-card"));
  stopFrameParticles(document.getElementById("bot-card"));
  renderMainMenu();
  document.getElementById("main-screen").style.display = "block";
  document.getElementById("battle-screen").style.display = "none";
}

function rollDice() { return Math.floor(Math.random() * 3) + 1; }

