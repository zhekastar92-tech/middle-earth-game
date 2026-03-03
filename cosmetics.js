// ============================================================
// cosmetics.js — всё что касается косметики:
//   - Базы данных гачи и мета-данные
//   - Рамки карточек (частицы, анимации)
//   - Эффекты появления в бою
//   - Эффекты победы
//   - Логика гачи (легендарная и мифическая)
//   - UI: модалки выбора косметики, рендер рулеток
//   - Награды Топ-10
// ============================================================

// ============================================================
// БАЗЫ ДАННЫХ: пулы гачи
// ============================================================

const GACHA_POOLS = {
  guardian: {
    id: 'guardian',
    hidden: true,
    isLegendaryPool: true,
    name: 'Страж Врат Вечности',
    tagline: 'уже в игре!',
    classId: 'guardian',
    icon: '🛡️',
    color: '#f59e0b',
    borderColor: '#b45309',
    victoryEffect: { id: 'arcane', name: '🔮 Мистический', chance: 0.002 },
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Железный страж',            chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Сияющий страж',             chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Несокрушимый Бастион Страж', chance: 0.02 },
      legendary: { label: 'Легендарный',name: 'Страж Врат Вечности',        chance: 0.004 }
    }
  },
  warrior: {
    id: 'warrior',
    hidden: false,
    isLegendaryPool: true,
    name: 'Воин Сын Императора',
    tagline: 'Склонитесь! Воин Сын Императора прибыл!',
    classId: 'warrior',
    icon: '⚔️',
    color: '#d97706',
    borderColor: '#b45309',
    victoryEffect: { id: 'inferno', name: '🔥 Адское пламя', chance: 0.002 },
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Доблестный воин',           chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Королевский воин',          chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Прославленный Герой-Воин',   chance: 0.02 },
      legendary: { label: 'Легендарный',name: 'Воин Сын Императора',        chance: 0.004 }
    }
  },
  darkknight: {
    id: 'darkknight',
    hidden: true,
    isLegendaryPool: true,
    name: 'Рыцарь Кровавого Затмения',
    tagline: 'Земля дрожит в страхе — Рыцарь Кровавого Затмения пробудился!',
    classId: 'darkknight',
    icon: '🦇',
    color: '#dc2626',
    borderColor: '#991b1b',
    victoryEffect: { id: 'blood', name: '🩸 Кровавая жатва', chance: 0.002 },
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Мрачный рыцарь',            chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Чёрный рыцарь',             chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Алый Легионер Рыцарь',       chance: 0.02 },
      legendary: { label: 'Легендарный',name: 'Рыцарь Кровавого Затмения',  chance: 0.004 }
    }
  },
  assassin: {
    id: 'assassin',
    hidden: true,
    isLegendaryPool: true,
    name: 'Космический Захватчик Убийца',
    tagline: 'Мир обречён... Космический Захватчик Убийца уже здесь...',
    classId: 'assassin',
    icon: '🌙',
    color: '#7c3aed',
    borderColor: '#6d28d9',
    victoryEffect: { id: 'storm', name: '⚡ Буря', chance: 0.002 },
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Тайный убийца',             chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Ночной убийца',             chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Убийца Ужас Империи',        chance: 0.02 },
      legendary: { label: 'Легендарный',name: 'Космический Захватчик Убийца',chance: 0.004 }
    }
  },
  priest: {
    id: 'priest',
    hidden: true,
    isLegendaryPool: true,
    name: 'Ослепительное Солнце Жрец',
    tagline: 'Ослепительное Солнце Жрец явился чтобы сжечь врагов',
    classId: 'priest',
    icon: '☀️',
    color: '#f59e0b',
    borderColor: '#d97706',
    victoryEffect: { id: 'ascend', name: '🌿 Вознесение', chance: 0.002 },
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Светлый жрец',              chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Великий жрец',              chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Жрец Карающая Длань',        chance: 0.02 },
      legendary: { label: 'Легендарный',name: 'Ослепительное Солнце Жрец',  chance: 0.004 }
    }
  }
};

const MYTHIC_GACHA_POOLS = {

  guardian: {
    id: 'guardian',
    hidden: true,
    classId: 'guardian',
    icon: '🛡️',
    color: '#f43f5e',
    borderColor: '#be123c',
    name: 'В сей смутный час, придёт он...',
    tagline: 'Страж явится — и хаос отступит.',
    cost: 25,
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Доблестный страж',         chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Страж Ордена Рассвета',    chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Страж Ордена Рассвета',    chance: 0.02 },
      mythic:    { label: 'Мифический', name: 'Хранитель Галактики',      chance: 0.002 }
    },
    frame:       { id: 'astral',        name: '🌠 Астрал',                chance: 0.004 },
    entryEffect: { id: 'materialize',   name: '🌫️ Материализация',        chance: 0.004 }
  },

  assassin: {
    id: 'assassin',
    hidden: true,
    classId: 'assassin',
    icon: '🌙',
    color: '#f43f5e',
    borderColor: '#be123c',
    name: 'Тень сквозь время',
    tagline: 'Когда звёзды гаснут — он уже здесь.',
    cost: 25,
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Призрак ночи',             chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Клинок Пустоты',           chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Убийца Богов',             chance: 0.02 },
      mythic:    { label: 'Мифический', name: 'Разрушитель Миров',        chance: 0.002 }
    },
    frame:       { id: 'void',          name: '🌌 Бездна',                chance: 0.004 },
    entryEffect: { id: 'rift',          name: '🌀 Разрыв пространства',   chance: 0.004 }
  },

  warrior: {
    id: 'warrior',
    hidden: false,
    classId: 'warrior',
    icon: '⚔️',
    color: '#f43f5e',
    borderColor: '#be123c',
    name: 'Гнев Перворождённых',
    tagline: 'Когда земля дрожит — это он идёт.',
    cost: 25,
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Воин орды',                chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Клинок Империи',           chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Гроза Тёмных Земель',      chance: 0.02 },
      mythic:    { label: 'Мифический', name: 'Гнев Перворождённых',      chance: 0.002 }
    },
    frame:       { id: 'lightning',     name: '⚡ Молния',                chance: 0.004 },
    entryEffect: { id: 'impact',        name: '💥 Удар с небес',          chance: 0.004 }
  },

  darkknight: {
    id: 'darkknight',
    hidden: true,
    classId: 'darkknight',
    icon: '🦇',
    color: '#f43f5e',
    borderColor: '#be123c',
    name: 'Печать Вечной Тьмы',
    tagline: 'Свет гаснет там, где ступает он.',
    cost: 25,
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Жнец душ',                 chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Страж Тьмы',               chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Владыка Проклятых',        chance: 0.02 },
      mythic:    { label: 'Мифический', name: 'Печать Вечной Тьмы',       chance: 0.002 }
    },
    frame:       { id: 'blood',         name: '🩸 Кровь Дракона',         chance: 0.004 },
    entryEffect: { id: 'flash',         name: '⚡ Вспышка',               chance: 0.004 }
  },

  priest: {
    id: 'priest',
    hidden: true,
    classId: 'priest',
    icon: '☀️',
    color: '#f43f5e',
    borderColor: '#be123c',
    name: 'Глас Небесного Суда',
    tagline: 'Ни тьма, ни смерть — лишь его слово.',
    cost: 25,
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Посланник Света',          chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Хранитель Веры',           chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Архиепископ Ордена',       chance: 0.02 },
      mythic:    { label: 'Мифический', name: 'Глас Небесного Суда',      chance: 0.002 }
    },
    frame:       { id: 'chaos',         name: '💥 Хаос',                  chance: 0.004 },
    entryEffect: { id: 'radiance',      name: '✨ Сияние Валинора',       chance: 0.004 }
  }
};

// ============================================================
// МЕТА-ДАННЫЕ КОСМЕТИКИ
// ============================================================

const FRAME_META = {
  lightning:   { name: '⚡ Молния',           rarity: 'mythic',    class: 'frame-lightning' },
  blood:       { name: '🩸 Кровь Дракона',    rarity: 'mythic',    class: 'frame-blood' },
  void:        { name: '🌌 Бездна',           rarity: 'mythic',    class: 'frame-void' },
  astral:      { name: '🌠 Астрал',           rarity: 'mythic',    class: 'frame-astral' },
  valinor:     { name: '✨ Золото Валинора',  rarity: 'top10',     class: 'frame-valinor' },
  chaos:       { name: '💥 Хаос',             rarity: 'mythic',    class: 'frame-chaos' }
};

const ENTRY_EFFECT_META = {
  slide:        { name: '🌟 Нисхождение',          rarity: 'top10',     cssClass: 'entry-anim-slide',       hasFlash: false, hasWave: false, hasRing: false },
  flash:        { name: '⚡ Вспышка',              rarity: 'mythic',    cssClass: 'entry-anim-flash',       hasFlash: false, hasWave: false, hasRing: false },
  materialize:  { name: '🌫️ Материализация',       rarity: 'mythic',    cssClass: 'entry-anim-materialize', hasFlash: false, hasWave: false, hasRing: false },
  impact:       { name: '💥 Удар с небес',         rarity: 'mythic',    cssClass: 'entry-anim-impact',      hasFlash: false, hasWave: true,  hasRing: false },
  rift:         { name: '🌀 Разрыв пространства',  rarity: 'mythic',    cssClass: 'entry-anim-rift',        hasFlash: true,  hasWave: false, hasRing: false },
  radiance:     { name: '✨ Сияние Валинора',      rarity: 'mythic',    cssClass: 'entry-anim-radiance',    hasFlash: false, hasWave: false, hasRing: true  }
};

const VICTORY_EFFECT_META = {
  gold:    { name: '✨ Золотой взрыв',    rarity: 'top10',   source: 'Топ-10 рейтинга' },
  arcane:  { name: '🔮 Мистический',      rarity: 'mythic',  source: 'Рулетка: Страж' },
  inferno: { name: '🔥 Адское пламя',     rarity: 'mythic',  source: 'Рулетка: Воин' },
  blood:   { name: '🩸 Кровавая жатва',   rarity: 'mythic',  source: 'Рулетка: Тёмный Рыцарь' },
  storm:   { name: '⚡ Буря',             rarity: 'mythic',  source: 'Рулетка: Убийца' },
  ascend:  { name: '🌿 Вознесение',       rarity: 'mythic',  source: 'Рулетка: Жрец' },
};

// ============================================================
// ОТОБРАЖЕНИЕ ТИТУЛОВ
// ============================================================

function getTitleHtml(rarity, name) {
  const styles = {
    uncommon:  'color:#22c55e;',
    rare:      'color:#3b82f6;',
    epic:      'color:#a855f7;',
    legendary: 'background:linear-gradient(90deg,#f59e0b,#fde68a,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:900;',
    mythic:    'background:linear-gradient(90deg,#ef4444,#fca5a5,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:900;'
  };
  let s = styles[rarity] || '';
  return `<span style="${s}">${name}</span>`;
}

// ============================================================
// БОТ-ЗАГОЛОВОК: случайный титул при инициализации
// ============================================================

function rollBotTitle(classId) {
  let pool = GACHA_POOLS[classId];
  if (!pool || pool.hidden) return null;
  let r = Math.random();
  if (r < 0.004) return 'legendary';
  if (r < 0.024) return 'epic';
  if (r < 0.094) return 'rare';
  if (r < 0.244) return 'uncommon';
  return null;
}

// ============================================================
// РАМКИ КАРТОЧЕК — частицы и inner-элементы
// ============================================================

const _frameParticleTimers = new Map();

function startFrameParticles(cardEl) {
  stopFrameParticles(cardEl);
  let frameId = cardEl._frameId = Date.now();

  _addFrameInner(cardEl);

  let cls = cardEl.className;

  if (cls.includes('frame-blood')) {
    let t = setInterval(() => {
      if (cardEl._frameId !== frameId) { clearInterval(t); return; }
      _spawnBloodSpark(cardEl);
    }, 280);
    _frameParticleTimers.set(cardEl, t);
  }

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
  let inner = cardEl.querySelector('.frame-inner-el');
  if (inner) inner.remove();
}

function _addFrameInner(cardEl) {
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
  let x = 10 + Math.random() * 80;
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

function applyFrameToCard(cardEl, frameId) {
  stopFrameParticles(cardEl);
  if (frameId && typeof FRAME_META !== 'undefined' && FRAME_META[frameId]) {
    setTimeout(() => startFrameParticles(cardEl), 100);
  }
}

// ============================================================
// ЭФФЕКТЫ ПОЯВЛЕНИЯ — JS-анимации через rAF
// ============================================================

// Утилиты
function _easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function _easeElastic(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
}
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

function playEntryEffect(cardEl, callback) {
  let effectId = gameData.entryEffect;
  if (!effectId || !ENTRY_EFFECT_META[effectId]) {
    cardEl.classList.remove('entry-hidden');
    if (callback) callback();
    return;
  }

  setTimeout(() => {
    cardEl.classList.remove('entry-hidden');
    cardEl.style.overflow = 'visible';

    switch (effectId) {
      case 'slide':       _animSlide(cardEl, callback);        break;
      case 'flash':       _animFlash(cardEl, callback);        break;
      case 'materialize': _animMaterialize(cardEl, callback);  break;
      case 'impact':      _animImpact(cardEl, callback);       break;
      case 'rift':        _animRift(cardEl, callback);         break;
      case 'radiance':    _animRadiance(cardEl, callback);     break;
      default:
        if (callback) callback();
    }
  }, 2000);
}

// 🌟 Слайд снизу
function _animSlide(el, cb) {
  _rAF(550, p => {
    let e = _easeElastic(p);
    let y = (1 - e) * 30;
    let op = Math.min(p * 3, 1);
    el.style.opacity = op;
    el.style.transform = `translateY(${y}px)`;
  }, () => { _clearStyle(el); if (cb) cb(); });
}

// ⚡ Вспышка
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

// 🌫️ Материализация
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

// 💥 Удар с небес
function _animImpact(el, cb) {
  let wave = document.createElement('div');
  wave.style.cssText = 'position:absolute;bottom:-4px;left:5px;right:5px;height:2px;border-radius:1px;transform-origin:center;background:linear-gradient(90deg,transparent,rgba(251,191,36,0.75),rgba(253,230,138,0.95),rgba(251,191,36,0.75),transparent);pointer-events:none;z-index:5;';
  el.appendChild(wave);

  _rAF(650, p => {
    let e = _easeOut(p);
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

// 🌀 Разрыв пространства
function _animRift(el, cb) {
  let flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;border-radius:12px;pointer-events:none;z-index:10;background:transparent;';
  el.appendChild(flash);

  _rAF(950, p => {
    let e = _easeOut(p);
    let op, scale, blur, bright;
    if (p < 0.38) {
      let pp = p / 0.38;
      op = pp; scale = pp * 1.12; blur = (1 - pp) * 22; bright = 1 + (1 - pp) * 5;
    } else if (p < 0.65) {
      let pp = (p - 0.38) / 0.27;
      op = 1; scale = 1.12 - pp * 0.15; blur = 0; bright = 1 + (1 - pp) * 0.1;
    } else {
      op = 1; scale = 0.97 + (p - 0.65) / 0.35 * 0.03; blur = 0; bright = 1;
    }
    el.style.opacity = op;
    el.style.transform = `scale(${scale})`;
    el.style.filter = `blur(${blur}px) brightness(${bright})`;
    let fOp = p > 0.32 && p < 0.72 ? Math.sin((p - 0.32) / 0.40 * Math.PI) * 0.5 : 0;
    flash.style.background = `rgba(109,40,217,${fOp * 0.8})`;
  }, () => {
    _clearStyle(el);
    if (flash.parentNode) flash.remove();
    if (cb) cb();
  });
}

// ✨ Сияние Валинора
function _animRadiance(el, cb) {
  let ring = document.createElement('div');
  ring.style.cssText = 'position:absolute;inset:-7px;border:2px solid rgba(253,230,138,0.7);border-radius:12px;pointer-events:none;z-index:10;';
  el.appendChild(ring);

  _rAF(900, p => {
    let e = _easeOut(p);
    let scale, op, blur, bright, glow;
    if (p < 0.30) {
      let pp = p / 0.30;
      scale = 0.4 + pp * 0.7; op = pp; blur = (1 - pp) * 8; bright = 1 + (1 - pp) * 5; glow = pp * 80;
    } else if (p < 0.58) {
      let pp = (p - 0.30) / 0.28;
      scale = 1.1 - pp * 0.12; op = 1; blur = pp * 0; bright = 2.8 - pp * 1.6; glow = 80 - pp * 52;
    } else {
      let pp = (p - 0.58) / 0.42;
      scale = 0.98 + pp * 0.02; op = 1; blur = 0; bright = 1.2 - pp * 0.2; glow = 28 - pp * 28;
    }
    el.style.opacity = op;
    el.style.transform = `scale(${scale})`;
    el.style.filter = `brightness(${bright}) blur(${blur}px)`;
    el.style.boxShadow = glow > 0 ? `0 0 ${glow}px rgba(253,230,138,0.9)` : '';
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

// ============================================================
// ЭФФЕКТЫ ПОБЕДЫ
// ============================================================

function playVictoryEffect(effectId) {
  let arena = document.getElementById('battle-arena');
  if (!arena) return;

  let old = arena.querySelector('.victory-overlay');
  if (old) old.remove();

  let overlay = document.createElement('div');
  overlay.className = 'victory-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:50;overflow:hidden;border-radius:inherit;';
  arena.style.position = 'relative';
  arena.appendChild(overlay);

  const W = arena.offsetWidth, H = arena.offsetHeight;

  let cleanupTimer = setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 3500);

  switch(effectId) {
    case 'gold':    _victory_gold(overlay, W, H, cleanupTimer);    break;
    case 'arcane':  _victory_arcane(overlay, W, H, cleanupTimer);  break;
    case 'inferno': _victory_inferno(overlay, W, H, cleanupTimer); break;
    case 'blood':   _victory_blood(overlay, W, H, cleanupTimer);   break;
    case 'storm':   _victory_storm(overlay, W, H, cleanupTimer);   break;
    case 'ascend':  _victory_ascend(overlay, W, H, cleanupTimer);  break;
  }
}

// Вспомогательные функции эффектов победы
function _vCanvas(overlay, W, H) {
  let c = document.createElement('canvas');
  c.width = W; c.height = H;
  c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  overlay.appendChild(c);
  return c.getContext('2d');
}
function _vLabel(overlay, text, color, shadow) {
  let el = document.createElement('div');
  el.style.cssText = `position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) scale(0);
    font-size:19px;font-weight:900;color:${color};text-shadow:${shadow};
    white-space:nowrap;letter-spacing:2px;z-index:5;
    transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);`;
  el.textContent = text;
  overlay.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.style.transform = 'translate(-50%,-50%) scale(1)'));
  setTimeout(() => { el.style.transition='opacity 0.6s'; el.style.opacity='0'; }, 1900);
  return el;
}
function _rAFLoop(duration, fn, done) {
  let s=null;
  function step(ts){ if(!s)s=ts; let p=Math.min((ts-s)/duration,1); fn(p,ts-s); if(p<1)requestAnimationFrame(step); else if(done)done(); }
  requestAnimationFrame(step);
}

// ✨ Золотой взрыв
function _victory_gold(ov, W, H) {
  let flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:rgba(251,191,36,0);transition:background 0.15s;';
  ov.appendChild(flash);
  requestAnimationFrame(()=>{ flash.style.background='rgba(251,191,36,0.45)'; setTimeout(()=>{ flash.style.transition='background 0.7s'; flash.style.background='rgba(251,191,36,0)'; },150); });

  _vLabel(ov, '✦ ПОБЕДА ✦', '#fbbf24', '0 0 20px rgba(251,191,36,0.9),0 0 40px rgba(245,158,11,0.6)');
  let ctx = _vCanvas(ov, W, H);
  let parts = [];
  for(let i=0;i<50;i++){
    let a=Math.random()*Math.PI*2, sp=1.8+Math.random()*3.5;
    parts.push({ x:W/2,y:H/2, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.2,
      size:5+Math.random()*10, ch:['★','✦','✧','·'][Math.floor(Math.random()*4)],
      color:['#fbbf24','#fde68a','#f59e0b','#fff8c0'][Math.floor(Math.random()*4)],
      life:1, decay:0.01+Math.random()*0.016, gravity:0.055 });
  }
  _rAFLoop(3000, ()=>{
    ctx.clearRect(0,0,W,H);
    parts.forEach(p=>{ if(p.life<=0)return; p.x+=p.vx; p.y+=p.vy; p.vy+=p.gravity; p.vx*=0.98; p.life-=p.decay;
      ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color; ctx.font=`${p.size}px serif`; ctx.fillText(p.ch,p.x,p.y); });
    ctx.globalAlpha=1;
  });
}

// 🔮 Мистический
function _victory_arcane(ov, W, H) {
  _vLabel(ov, '✦ ПОБЕДА ✦', '#c4b5fd', '0 0 20px rgba(168,85,247,0.9),0 0 40px rgba(99,102,241,0.6)');
  let ctx = _vCanvas(ov, W, H);
  let rings=[{r:0,s:2.2,col:'#a855f7',a:0.9},{r:0,s:1.6,col:'#818cf8',a:0.7},{r:0,s:1.0,col:'#06b6d4',a:0.5}];
  let runes=[]; let rc=['✦','⬡','◈','✧','⬢']; let rc2=['#a855f7','#818cf8','#c4b5fd','#06b6d4'];
  for(let i=0;i<28;i++){ let a=Math.random()*Math.PI*2;
    runes.push({ angle:a, orbitR:40+Math.random()*55, orbitSpeed:(Math.random()-0.5)*0.04,
      ch:rc[Math.floor(Math.random()*rc.length)], color:rc2[Math.floor(Math.random()*rc2.length)],
      size:8+Math.random()*8, life:1, decay:0.007+Math.random()*0.012 }); }
  _rAFLoop(3000, (p,el)=>{
    ctx.clearRect(0,0,W,H);
    rings.forEach((r,i)=>{ if(el<i*200)return; r.r+=r.s; let a=r.a*Math.max(0,1-r.r/(Math.max(W,H)*0.85));
      if(a<=0)return; ctx.globalAlpha=a; ctx.strokeStyle=r.col; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(W/2,H/2,r.r,0,Math.PI*2); ctx.stroke(); });
    runes.forEach(r=>{ if(r.life<=0)return; r.angle+=r.orbitSpeed; r.life-=r.decay;
      ctx.globalAlpha=Math.max(0,r.life); ctx.fillStyle=r.color; ctx.font=`${r.size}px serif`;
      ctx.fillText(r.ch, W/2+Math.cos(r.angle)*r.orbitR, H/2+Math.sin(r.angle)*r.orbitR); });
    ctx.globalAlpha=1;
  });
}

// 🔥 Адское пламя
function _victory_inferno(ov, W, H) {
  let fb = document.createElement('div');
  fb.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(0deg,rgba(180,0,0,0.6) 0%,rgba(239,68,68,0.25) 60%,transparent 100%);opacity:0;transition:opacity 0.2s;';
  ov.appendChild(fb);
  requestAnimationFrame(()=>{ fb.style.opacity='1'; setTimeout(()=>{ fb.style.transition='opacity 0.9s'; fb.style.opacity='0'; },500); });
  _vLabel(ov, '🔥 ПОБЕДА 🔥', '#fbbf24', '0 0 16px rgba(239,68,68,1),0 0 32px rgba(251,191,36,0.8)');
  let ctx = _vCanvas(ov, W, H);
  let embers=[];
  for(let i=0;i<65;i++) embers.push({ x:Math.random()*W, y:H+5, vx:(Math.random()-0.5)*1.5, vy:-(2+Math.random()*4),
    size:2+Math.random()*5.5, color:['#ef4444','#f97316','#fbbf24','#dc2626','#ff6b35'][Math.floor(Math.random()*5)],
    life:0.7+Math.random()*0.3, decay:0.008+Math.random()*0.016, wobble:Math.random()*6, wobbleSpeed:0.05+Math.random()*0.1 });
  _rAFLoop(3000, (p,el)=>{
    if(el<1600&&Math.random()<0.35) embers.push({ x:Math.random()*W, y:H+3, vx:(Math.random()-0.5)*1.5, vy:-(2+Math.random()*4),
      size:2+Math.random()*5, color:['#ef4444','#f97316','#fbbf24'][Math.floor(Math.random()*3)],
      life:0.6+Math.random()*0.4, decay:0.01+Math.random()*0.018, wobble:0, wobbleSpeed:0.06+Math.random()*0.1 });
    ctx.clearRect(0,0,W,H);
    embers.forEach(e=>{ if(e.life<=0)return; e.wobble+=e.wobbleSpeed; e.x+=e.vx+Math.sin(e.wobble)*0.5; e.y+=e.vy; e.life-=e.decay;
      ctx.globalAlpha=Math.max(0,e.life); ctx.fillStyle=e.color;
      ctx.beginPath(); ctx.arc(e.x,e.y,e.size/2,0,Math.PI*2); ctx.fill(); });
    ctx.globalAlpha=1;
  });
}

// 🩸 Кровавая жатва
function _victory_blood(ov, W, H) {
  let fl = document.createElement('div');
  fl.style.cssText = 'position:absolute;inset:0;border-radius:inherit;background:rgba(160,0,0,0.5);opacity:0;transition:opacity 0.1s;';
  ov.appendChild(fl);
  requestAnimationFrame(()=>{ fl.style.opacity='1'; setTimeout(()=>{ fl.style.transition='opacity 1.1s'; fl.style.opacity='0'; },200); });
  _vLabel(ov, '🩸 ПОБЕДА 🩸', '#fca5a5', '0 0 16px rgba(220,38,38,1),0 0 35px rgba(185,28,28,0.8)');
  let ctx = _vCanvas(ov, W, H);
  let drops=[];
  for(let i=0;i<45;i++) drops.push({ x:Math.random()*W, y:-(5+Math.random()*25), vx:(Math.random()-0.5)*0.5, vy:2.5+Math.random()*4,
    r:2+Math.random()*4, color:['rgba(220,38,38,0.9)','rgba(185,28,28,0.85)','rgba(239,68,68,0.8)'][Math.floor(Math.random()*3)],
    life:1, splat:false, splatParts:null, delay:Math.random()*600 });
  _rAFLoop(3000, (p,el)=>{
    ctx.clearRect(0,0,W,H);
    drops.forEach(d=>{ if(el<d.delay)return;
      if(!d.splat){ if(d.y<H-6){ d.x+=d.vx; d.y+=d.vy; d.vy*=1.01;
        ctx.globalAlpha=0.85; ctx.fillStyle=d.color;
        ctx.beginPath(); ctx.ellipse(d.x,d.y,d.r*0.6,d.r,0,0,Math.PI*2); ctx.fill();
      } else { d.splat=true; d.splatParts=[]; for(let i=0;i<5;i++){ let a=Math.random()*Math.PI; d.splatParts.push({dx:Math.cos(a)*(5+Math.random()*12),life:0.7}); } }
      } else { d.splatParts.forEach(s=>{ s.life-=0.03; if(s.life<=0)return;
        ctx.globalAlpha=s.life*0.7; ctx.fillStyle=d.color;
        ctx.beginPath(); ctx.arc(d.x+s.dx,H-4,1.5,0,Math.PI*2); ctx.fill(); }); }
    });
    ctx.globalAlpha=1;
  });
}

// ⚡ Буря
function _victory_storm(ov, W, H) {
  _vLabel(ov, '⚡ ПОБЕДА ⚡', '#67e8f9', '0 0 16px rgba(6,182,212,1),0 0 35px rgba(99,102,241,0.8)');
  let ctx = _vCanvas(ov, W, H);
  function mkBolt(x1,y1,x2,y2,r,d){ if(d===0)return[[x1,y1],[x2,y2]]; let mx=(x1+x2)/2+(Math.random()-0.5)*r,my=(y1+y2)/2+(Math.random()-0.5)*r*0.3; return[...mkBolt(x1,y1,mx,my,r/2,d-1),...mkBolt(mx,my,x2,y2,r/2,d-1).slice(1)]; }
  let bolts=[0,180,360,580,820].map(delay=>{ let x=W*0.15+Math.random()*W*0.7; return { delay, pts:mkBolt(x,-5,x+(Math.random()-0.5)*40,H+5,35,5), alpha:1, color:Math.random()<0.5?'#67e8f9':'#a78bfa', w:1.5+Math.random() }; });
  let sparks=[];
  for(let i=0;i<30;i++) sparks.push({ x:Math.random()*W, y:20+Math.random()*(H-40), len:15+Math.random()*40, angle:(Math.random()-0.5)*0.4, color:['#67e8f9','#a78bfa','#c4b5fd','#22d3ee'][Math.floor(Math.random()*4)], life:0.9+Math.random()*0.1, decay:0.02+Math.random()*0.03, delay:Math.random()*800 });
  _rAFLoop(3000, (p,el)=>{
    ctx.clearRect(0,0,W,H);
    bolts.forEach(b=>{ if(el<b.delay)return; let age=el-b.delay; b.alpha=age<100?1:Math.max(0,1-(age-100)/300); if(b.alpha<=0)return;
      ctx.globalAlpha=b.alpha; ctx.strokeStyle=b.color; ctx.lineWidth=b.w;
      ctx.shadowBlur=8; ctx.shadowColor=b.color;
      ctx.beginPath(); b.pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke(); ctx.shadowBlur=0; });
    sparks.forEach(s=>{ if(el<s.delay||s.life<=0)return; s.life-=s.decay;
      ctx.globalAlpha=Math.max(0,s.life); ctx.strokeStyle=s.color; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(s.x+Math.cos(s.angle)*s.len,s.y+Math.sin(s.angle)*s.len); ctx.stroke(); });
    ctx.globalAlpha=1;
  });
}

// 🌿 Вознесение
function _victory_ascend(ov, W, H) {
  let ray = document.createElement('div');
  ray.style.cssText = 'position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:55px;height:100%;background:linear-gradient(0deg,rgba(74,222,128,0.22) 0%,rgba(16,185,129,0.08) 55%,transparent 100%);opacity:0;transition:opacity 0.3s;';
  ov.appendChild(ray);
  requestAnimationFrame(()=>{ ray.style.opacity='1'; setTimeout(()=>{ ray.style.transition='opacity 1.2s'; ray.style.opacity='0'; },1400); });
  _vLabel(ov, '✦ ПОБЕДА ✦', '#4ade80', '0 0 16px rgba(74,222,128,0.9),0 0 35px rgba(16,185,129,0.6)');
  let ctx = _vCanvas(ov, W, H);
  let chars=['✦','·','★','⬡','✧'], colors=['#4ade80','#86efac','#bbf7d0','#10b981','#6ee7b7'];
  let leaves=[];
  for(let i=0;i<55;i++) leaves.push({ x:5+Math.random()*90, y:H*0.4+Math.random()*H*0.5, vx:(Math.random()-0.5)*0.8, vy:-(0.9+Math.random()*2),
    ch:chars[Math.floor(Math.random()*chars.length)], color:colors[Math.floor(Math.random()*colors.length)],
    size:7+Math.random()*9, life:0.85+Math.random()*0.15, decay:0.005+Math.random()*0.01,
    wobble:Math.random()*Math.PI*2, wobbleSpeed:0.02+Math.random()*0.04, delay:Math.random()*600 });
  _rAFLoop(3000, (p,el)=>{
    ctx.clearRect(0,0,W,H);
    leaves.forEach(l=>{ if(el<l.delay||l.life<=0)return; l.wobble+=l.wobbleSpeed; l.x+=l.vx+Math.sin(l.wobble)*0.4; l.y+=l.vy; l.life-=l.decay;
      ctx.globalAlpha=Math.max(0,l.life); ctx.fillStyle=l.color; ctx.font=`${l.size}px serif`;
      ctx.fillText(l.ch, W*l.x/100, l.y); });
    ctx.globalAlpha=1;
  });
}

// ============================================================
// НАГРАДЫ ТОП-10
// ============================================================

function grantTop10Rewards(place) {
  let rewards = [];

  if (!gameData.unlockedFrames) gameData.unlockedFrames = [];
  if (!gameData.unlockedFrames.includes('valinor')) {
    gameData.unlockedFrames.push('valinor');
    rewards.push({ icon: '✨', text: 'Рамка «Золото Валинора»' });
  }

  if (!gameData.unlockedEffects) gameData.unlockedEffects = [];
  if (!gameData.unlockedEffects.includes('slide')) {
    gameData.unlockedEffects.push('slide');
    rewards.push({ icon: '🌟', text: 'Эффект «Нисхождение»' });
  }

  if (!gameData.unlockedVictoryEffects.includes('gold')) {
    gameData.unlockedVictoryEffects.push('gold');
    rewards.push({ icon: '✨', text: 'Эффект победы «Золотой взрыв»' });
  }

  let stones = place === 1 ? 2000 : place <= 3 ? 1500 : 1000;
  gameData.lunarStones += stones;
  rewards.push({ icon: '💠', text: `+${stones} Лунных камней` });

  saveData();

  if (rewards.length === 0) return;
  let rewardsHtml = rewards.map(r => `
    <div style="display:flex;align-items:center;gap:10px;background:rgba(30,41,59,0.7);border:1px solid #fde68a44;border-radius:10px;padding:10px 14px;margin-bottom:8px;">
      <span style="font-size:22px;">${r.icon}</span>
      <span style="font-size:14px;color:#fde68a;font-weight:700;">${r.text}</span>
    </div>`).join('');

  let placeLabel = place === 1 ? '🥇 1-е место' : place === 2 ? '🥈 2-е место' : place === 3 ? '🥉 3-е место' : `#${place} место`;
  document.getElementById('modal-title').innerHTML = `🏆 Топ-10 — ${placeLabel}`;
  document.getElementById('modal-title').className = 'text-legendary';
  document.getElementById('modal-desc').innerHTML = `
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:36px;margin-bottom:8px;">🏆</div>
      <div style="font-size:13px;color:#fde68a;font-weight:700;letter-spacing:1px;">ЭКСКЛЮЗИВНЫЕ НАГРАДЫ РЕЙТИНГА</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px;">Только для игроков глобального топ-10</div>
    </div>
    ${rewardsHtml}`;
  document.getElementById('modal-actions').innerHTML = `<button class="action-btn" style="width:100%;background:linear-gradient(135deg,#78350f,#fbbf24);" onclick="closeModal()">Забрать награды</button>`;
  document.getElementById('item-modal').style.display = 'flex';
}

window.testTop10 = function(place) { grantTop10Rewards(place || 1); };

// ============================================================
// ЛОГИКА ГАЧИ — Легендарная рулетка
// ============================================================

function rollGacha(gachaId) {
  let pool = GACHA_POOLS[gachaId];
  if (!pool) return null;
  let cost = 10;
  if (gameData.lunarStones < cost) { showCodeResult('❌ Недостаточно Лунных камней!', false); return null; }
  gameData.lunarStones -= cost;

  if (!gameData.gachaSpinCount[gachaId]) gameData.gachaSpinCount[gachaId] = 0;
  gameData.gachaSpinCount[gachaId]++;
  let spins = gameData.gachaSpinCount[gachaId];

  let result = { type: null, value: null, rarity: null };
  let r = Math.random();
  let isGuaranteed = spins >= 100;

  if (isGuaranteed) {
    let ve = pool.victoryEffect;
    let hasVE = ve && typeof VICTORY_EFFECT_META !== 'undefined';
    let veAlreadyOwned = hasVE && gameData.unlockedVictoryEffects.includes(ve.id);
    let titleAlreadyOwned = gameData.titles[pool.classId]?.unlocked?.includes('legendary');

    if (hasVE && !veAlreadyOwned && (titleAlreadyOwned || Math.random() < 0.30)) {
      result = { type: 'victoryEffect', rarity: 'mythic', value: ve.id, name: ve.name };
      if (!gameData.unlockedVictoryEffects.includes(ve.id)) {
        gameData.unlockedVictoryEffects.push(ve.id);
      }
    } else {
      result = { type: 'title', rarity: 'legendary', value: pool.titles.legendary.name };
    }
    gameData.gachaSpinCount[gachaId] = 0;
  } else if (r < 0.002) {
    let ve = pool.victoryEffect;
    if (ve && typeof VICTORY_EFFECT_META !== 'undefined' && !gameData.unlockedVictoryEffects.includes(ve.id)) {
      result = { type: 'victoryEffect', rarity: 'mythic', value: ve.id, name: ve.name };
      gameData.unlockedVictoryEffects.push(ve.id);
      gameData.gachaSpinCount[gachaId] = 0;
    } else {
      gameData.lunarStones += 200;
      result = { type: 'victoryEffect', rarity: 'mythic', value: ve?.id, name: ve?.name, dupComp: '+200 💠 (дубль)' };
    }
  } else if (r < 0.002 + 0.004) {
    result = { type: 'title', rarity: 'legendary', value: pool.titles.legendary.name };
    gameData.gachaSpinCount[gachaId] = 0;
  } else if (r < 0.006 + 0.02) {
    result = { type: 'title', rarity: 'epic', value: pool.titles.epic.name };
  } else if (r < 0.006 + 0.02 + 0.07) {
    result = { type: 'title', rarity: 'rare', value: pool.titles.rare.name };
  } else if (r < 0.006 + 0.02 + 0.07 + 0.15) {
    result = { type: 'title', rarity: 'uncommon', value: pool.titles.uncommon.name };
  } else if (r < 0.246 + 0.60) {
    let ir = Math.random();
    let imperials = 0;
    if (ir < 0.01) imperials = 50000;
    else if (ir < 0.05) imperials = 10000;
    else if (ir < 0.20) imperials = 5000;
    else if (ir < 0.50) imperials = 2000;
    else imperials = 1000;
    result = { type: 'imperials', value: imperials };
    gameData.imperials += imperials;
  } else if (r < 0.846 + 0.16) {
    let kr = Math.random();
    let keyId, keyName;
    if (kr < 0.55)      { keyId = 'dusty_key';   keyName = '🗝️ Пыльный ключ'; }
    else if (kr < 0.85) { keyId = 'wood_key';    keyName = '🗝️ Древесный ключ'; }
    else                { keyId = 'ancient_key'; keyName = '🗝️ Древний ключ'; }
    gameData.keys[keyId] = (gameData.keys[keyId] || 0) + 1;
    result = { type: 'key', keyId, keyName };
  } else {
    result = { type: 'nothing' };
  }

  if (result.type === 'title') {
    if (!gameData.titles[pool.classId]) gameData.titles[pool.classId] = { unlocked: [], active: null };
    let td = gameData.titles[pool.classId];
    if (!td.unlocked.includes(result.rarity)) {
      td.unlocked.push(result.rarity);
    } else {
      const dupComp = { uncommon: { type: 'imperials', val: 5000 }, rare: { type: 'lunar', val: 20 }, epic: { type: 'lunar', val: 100 }, legendary: { type: 'lunar', val: 500 } };
      let comp = dupComp[result.rarity];
      if (comp.type === 'imperials') { gameData.imperials += comp.val; result.dupComp = `+${comp.val.toLocaleString()} 🪙 (дубль)`; }
      else { gameData.lunarStones += comp.val; result.dupComp = `+${comp.val} 💠 (дубль)`; }
    }
  }

  saveData();
  return { result, isGuaranteed, pool, spinsLeft: 100 - gameData.gachaSpinCount[gachaId] };
}

// ============================================================
// ЛОГИКА ГАЧИ — Мифическая рулетка
// ============================================================

function rollMythicGacha(gachaId) {
  let pool = MYTHIC_GACHA_POOLS[gachaId];
  if (!pool) return null;
  let cost = pool.cost || 25;
  if (gameData.lunarStones < cost) { showCodeResult(`❌ Нужно ${cost} 💠!`, false); return null; }
  gameData.lunarStones -= cost;

  if (!gameData.mythicGachaSpinCount[gachaId]) gameData.mythicGachaSpinCount[gachaId] = 0;
  gameData.mythicGachaSpinCount[gachaId]++;
  let spins = gameData.mythicGachaSpinCount[gachaId];
  let isGuaranteed = spins >= 100;

  if (!gameData.mythicTitles[gachaId]) gameData.mythicTitles[gachaId] = { unlocked: [], active: null };
  let mt = gameData.mythicTitles[gachaId];

  let result = { type: null, value: null };

  if (isGuaranteed) {
    gameData.mythicGachaSpinCount[gachaId] = 0;
    let frameOwned = gameData.unlockedFrames.includes(pool.frame.id);
    let effectOwned = gameData.unlockedEffects.includes(pool.entryEffect.id);
    let mythicOwned = mt.unlocked.includes('mythic');
    if (frameOwned && effectOwned && mythicOwned) {
      gameData.lunarStones += 1000;
      result = { type: 'comp_all' };
    } else {
      let choices = [];
      if (!frameOwned) choices.push('frame', 'frame');
      if (!effectOwned) choices.push('effect', 'effect');
      if (!mythicOwned) choices.push('mythic');
      let pick = choices[Math.floor(Math.random() * choices.length)];
      if (pick === 'frame') {
        gameData.unlockedFrames.push(pool.frame.id);
        result = { type: 'frame', value: pool.frame.name };
      } else if (pick === 'effect') {
        gameData.unlockedEffects.push(pool.entryEffect.id);
        result = { type: 'effect', value: pool.entryEffect.name };
      } else {
        mt.unlocked.push('mythic');
        result = { type: 'mythic_title', value: pool.titles.mythic.name };
      }
    }
  } else {
    let r = Math.random();
    if (r < 0.002) {
      if (!mt.unlocked.includes('mythic')) {
        mt.unlocked.push('mythic');
        result = { type: 'mythic_title', value: pool.titles.mythic.name };
        gameData.mythicGachaSpinCount[gachaId] = 0;
      } else {
        gameData.lunarStones += 500;
        result = { type: 'mythic_title', value: pool.titles.mythic.name, dupComp: '+500 💠 (дубль)' };
      }
    } else if (r < 0.002 + 0.004) {
      if (!gameData.unlockedFrames.includes(pool.frame.id)) {
        gameData.unlockedFrames.push(pool.frame.id);
        result = { type: 'frame', value: pool.frame.name };
        gameData.mythicGachaSpinCount[gachaId] = 0;
      } else {
        gameData.lunarStones += 300;
        result = { type: 'frame', value: pool.frame.name, dupComp: '+300 💠 (дубль)' };
      }
    } else if (r < 0.002 + 0.004 + 0.004) {
      if (!gameData.unlockedEffects.includes(pool.entryEffect.id)) {
        gameData.unlockedEffects.push(pool.entryEffect.id);
        result = { type: 'effect', value: pool.entryEffect.name };
        gameData.mythicGachaSpinCount[gachaId] = 0;
      } else {
        gameData.lunarStones += 300;
        result = { type: 'effect', value: pool.entryEffect.name, dupComp: '+300 💠 (дубль)' };
      }
    } else if (r < 0.01 + 0.02) {
      let rarity = 'epic';
      if (!mt.unlocked.includes(rarity)) { mt.unlocked.push(rarity); result = { type: 'title', rarity, value: pool.titles[rarity].name }; }
      else { gameData.lunarStones += 100; result = { type: 'title', rarity, value: pool.titles[rarity].name, dupComp: '+100 💠 (дубль)' }; }
    } else if (r < 0.03 + 0.07) {
      let rarity = 'rare';
      if (!mt.unlocked.includes(rarity)) { mt.unlocked.push(rarity); result = { type: 'title', rarity, value: pool.titles[rarity].name }; }
      else { gameData.lunarStones += 20; result = { type: 'title', rarity, value: pool.titles[rarity].name, dupComp: '+20 💠 (дубль)' }; }
    } else if (r < 0.1 + 0.15) {
      let rarity = 'uncommon';
      if (!mt.unlocked.includes(rarity)) { mt.unlocked.push(rarity); result = { type: 'title', rarity, value: pool.titles[rarity].name }; }
      else { gameData.imperials += 5000; result = { type: 'title', rarity, value: pool.titles[rarity].name, dupComp: '+5000 🪙 (дубль)' }; }
    } else if (r < 0.25 + 0.55) {
      let ir = Math.random();
      let imperials = ir < 0.05 ? 10000 : ir < 0.20 ? 5000 : ir < 0.50 ? 2000 : 1000;
      result = { type: 'imperials', value: imperials };
      gameData.imperials += imperials;
    } else if (r < 0.80 + 0.20) {
      let kr = Math.random();
      let keyId = kr < 0.40 ? 'dusty_key' : kr < 0.75 ? 'wood_key' : 'ancient_key';
      let keyName = { dusty_key: '🗝️ Пыльный ключ', wood_key: '🗝️ Древесный ключ', ancient_key: '🗝️ Древний ключ' }[keyId];
      gameData.keys[keyId] = (gameData.keys[keyId] || 0) + 1;
      result = { type: 'key', keyId, keyName };
    } else {
      result = { type: 'nothing' };
    }
  }

  saveData();
  return { result, isGuaranteed, pool, spinsLeft: 100 - gameData.mythicGachaSpinCount[gachaId] };
}

// ============================================================
// UI — МОДАЛКИ ВЫБОРА КОСМЕТИКИ
// ============================================================

function openTitleModal() {
  let classId = gameData.currentClass;
  let td = gameData.titles[classId] || { unlocked: [], active: null };
  let pool = GACHA_POOLS[classId];
  let mt = gameData.mythicTitles[classId] || { unlocked: [], active: null };
  let mythicPool = MYTHIC_GACHA_POOLS[classId];
  let mythicActiveIsSet = mt.active !== null && mt.active !== undefined;
  let isNoneActive = td.active === null && !mythicActiveIsSet;

  let slotsHtml = `<div onclick="setTitle(null)" style="cursor:pointer; padding:12px; border-radius:10px; margin-bottom:8px; background:${isNoneActive ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.6)'}; border:1px solid ${isNoneActive ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center;">
    <span style="color:#94a3b8;">— Без титула</span>
    ${isNoneActive ? '<span style="color:#6366f1; font-size:11px;">✓ Активен</span>' : ''}
  </div>`;

  if (mythicPool) {
    ['uncommon','rare','epic','mythic'].forEach(r => {
      let unlocked = r === 'mythic' ? mt.unlocked.includes('mythic') : mt.unlocked.includes(r);
      let isActive = mt.active === r;
      let title = mythicPool.titles[r];
      let rarityColor = { uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', mythic:'#ef4444' }[r];
      let nameHtml = unlocked ? getTitleHtml(r, title.name) : `<span style="color:#334155;">???</span>`;
      let label = { uncommon:'Необычный', rare:'Редкий', epic:'Эпический', mythic:'✦ Мифический' }[r];
      slotsHtml += `<div onclick="${unlocked ? `setMythicTitle('${r}')` : ''}" style="cursor:${unlocked ? 'pointer' : 'default'}; padding:12px; border-radius:10px; margin-bottom:8px; background:${isActive ? 'rgba(239,68,68,0.15)' : (unlocked ? 'rgba(30,41,59,0.6)' : 'rgba(15,23,42,0.4)')}; border:1px solid ${isActive ? '#ef4444' : (r === 'mythic' ? '#7f0000' : '#334155')}; display:flex; justify-content:space-between; align-items:center; opacity:${unlocked ? '1' : '0.4'};">
        <div>
          <div style="font-size:10px; color:${rarityColor}; margin-bottom:3px;">${label} · Мифическая рулетка</div>
          <div style="font-size:14px;">${nameHtml}</div>
        </div>
        ${isActive ? '<span style="color:#ef4444; font-size:11px;">✓ Активен</span>' : (unlocked ? '<span style="color:#475569; font-size:11px;">Выбрать</span>' : '<span style="font-size:16px;">🔒</span>')}
      </div>`;
    });
    slotsHtml += `<div style="border-top:1px solid #1e293b; margin: 8px 0 12px; text-align:center; font-size:10px; color:#334155; padding-top:8px; letter-spacing:1px;">— Легендарные рулетки —</div>`;
  }

  if (!pool) {
    slotsHtml += `<div style="color:#475569; text-align:center; padding:20px; font-size:13px;">Для этого класса легендарная рулетка ещё не открыта</div>`;
  } else {
    ['uncommon','rare','epic','legendary'].forEach(r => {
      let unlocked = td.unlocked.includes(r);
      let isActive = td.active === r;
      let title = pool.titles[r];
      let nameHtml = unlocked ? getTitleHtml(r, title.name) : `<span style="color:#334155;">???</span>`;
      let label = { uncommon:'Необычный', rare:'Редкий', epic:'Эпический', legendary:'Легендарный' }[r];
      slotsHtml += `<div onclick="${unlocked ? `setTitle('${r}')` : ''}" style="cursor:${unlocked ? 'pointer' : 'default'}; padding:12px; border-radius:10px; margin-bottom:8px; background:${isActive ? 'rgba(99,102,241,0.2)' : (unlocked ? 'rgba(30,41,59,0.6)' : 'rgba(15,23,42,0.4)')}; border:1px solid ${isActive ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center; opacity:${unlocked ? '1' : '0.4'};">
        <div>
          <div style="font-size:10px; color:#64748b; margin-bottom:3px;">${label}</div>
          <div style="font-size:14px;">${nameHtml}</div>
        </div>
        ${isActive ? '<span style="color:#6366f1; font-size:11px;">✓ Активен</span>' : (unlocked ? '<span style="color:#475569; font-size:11px;">Выбрать</span>' : '<span style="font-size:16px;">🔒</span>')}
      </div>`;
    });
  }

  document.getElementById('modal-title').innerText = '👑 Выбор титула';
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = `
    <div style="font-size:12px; color:#64748b; margin-bottom:12px;">Титул отображается под ником в бою. Привязан к классу.</div>
    ${slotsHtml}`;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}

function setTitle(rarity) {
  let classId = gameData.currentClass;
  if (!gameData.titles[classId]) gameData.titles[classId] = { unlocked: [], active: null };
  gameData.titles[classId].active = rarity;
  if (!gameData.mythicTitles[classId]) gameData.mythicTitles[classId] = { unlocked: [], active: null };
  gameData.mythicTitles[classId].active = null;
  saveData();
  openTitleModal();
  updateHeroTab();
}

function setMythicTitle(rarity) {
  let classId = gameData.currentClass;
  if (!gameData.mythicTitles[classId]) gameData.mythicTitles[classId] = { unlocked: [], active: null };
  gameData.mythicTitles[classId].active = rarity;
  if (!gameData.titles[classId]) gameData.titles[classId] = { unlocked: [], active: null };
  gameData.titles[classId].active = null;
  saveData();
  openTitleModal();
  updateHeroTab();
}

function openEntryEffectModal() {
  let html = '<div style="font-size:12px; color:#64748b; margin-bottom:12px;">Эффект воспроизводится при входе в бой и на каждый новый этаж данжа.</div>';

  let isNone = !gameData.entryEffect;
  html += `<div onclick="setEntryEffect(null)" style="cursor:pointer; padding:12px; border-radius:10px; margin-bottom:8px; background:${isNone ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.6)'}; border:1px solid ${isNone ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center;">
    <span style="color:#94a3b8;">— Без эффекта</span>
    ${isNone ? '<span style="color:#6366f1; font-size:11px;">✓ Активен</span>' : ''}
  </div>`;

  let rarityColors = { epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444', top10: '#fde68a' };
  let rarityLabels = { epic: 'Эпический', legendary: 'Легендарный', mythic: 'Мифический', top10: '🏆 Топ-10 · Глобальный рейтинг' };
  let order = ['epic','legendary','mythic','top10'];
  let allEffects = Object.entries(ENTRY_EFFECT_META).sort((a,b) => order.indexOf(a[1].rarity) - order.indexOf(b[1].rarity));

  allEffects.forEach(([id, meta]) => {
    let unlocked = gameData.unlockedEffects && gameData.unlockedEffects.includes(id);
    let isActive = gameData.entryEffect === id;
    let col = rarityColors[meta.rarity] || '#94a3b8';
    html += `<div onclick="${unlocked ? `setEntryEffect('${id}')` : ''}" style="cursor:${unlocked ? 'pointer' : 'default'}; padding:12px; border-radius:10px; margin-bottom:8px; background:${isActive ? 'rgba(99,102,241,0.2)' : (unlocked ? 'rgba(30,41,59,0.6)' : 'rgba(15,23,42,0.4)')}; border:1px solid ${isActive ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center; opacity:${unlocked ? '1' : '0.4'};">
      <div>
        <div style="font-size:10px; color:${col}; margin-bottom:3px;">${rarityLabels[meta.rarity] || ''}</div>
        <div style="font-size:14px; color:#f1f5f9;">${meta.name}</div>
      </div>
      ${isActive ? '<span style="color:#6366f1; font-size:11px;">✓ Активен</span>' : (unlocked ? '<span style="color:#475569; font-size:11px;">Выбрать</span>' : '<span style="font-size:16px;">🔒</span>')}
    </div>`;
  });

  document.getElementById('modal-title').innerText = '✨ Эффект появления';
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = html;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}

function setEntryEffect(id) {
  gameData.entryEffect = id;
  saveData();
  openEntryEffectModal();
  updateHeroTab();
}

function openCardFrameModal() {
  let html = '<div style="font-size:12px; color:#64748b; margin-bottom:12px;">Рамка заменяет стандартную ранговую рамку вашей карточки в бою.</div>';

  let isDefault = !gameData.cardFrame;
  html += `<div onclick="setCardFrame(null)" style="cursor:pointer; padding:12px; border-radius:10px; margin-bottom:8px; background:${isDefault ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.6)'}; border:1px solid ${isDefault ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center;">
    <div>
      <div style="font-size:10px; color:#64748b; margin-bottom:3px;">По умолчанию</div>
      <span style="color:#94a3b8; font-size:14px;">🏅 Ранговая</span>
    </div>
    ${isDefault ? '<span style="color:#6366f1; font-size:11px;">✓ Активна</span>' : ''}
  </div>`;

  let rarityColors = { epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444', top10: '#fde68a' };
  let rarityLabels = { epic: 'Эпическая', legendary: 'Легендарная', mythic: 'Мифическая', top10: '🏆 Топ-10 · Глобальный рейтинг' };
  let order = ['epic','legendary','mythic','top10'];
  let allFrames = Object.entries(FRAME_META).sort((a,b) => order.indexOf(a[1].rarity) - order.indexOf(b[1].rarity));

  allFrames.forEach(([id, meta]) => {
    let unlocked = gameData.unlockedFrames && gameData.unlockedFrames.includes(id);
    let isActive = gameData.cardFrame === id;
    let col = rarityColors[meta.rarity] || '#94a3b8';
    html += `<div onclick="${unlocked ? `setCardFrame('${id}')` : ''}" style="cursor:${unlocked ? 'pointer' : 'default'}; padding:12px; border-radius:10px; margin-bottom:8px; background:${isActive ? 'rgba(99,102,241,0.2)' : (unlocked ? 'rgba(30,41,59,0.6)' : 'rgba(15,23,42,0.4)')}; border:1px solid ${isActive ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center; opacity:${unlocked ? '1' : '0.4'};">
      <div>
        <div style="font-size:10px; color:${col}; margin-bottom:3px;">${rarityLabels[meta.rarity] || ''}</div>
        <div style="font-size:14px; color:#f1f5f9;">${meta.name}</div>
      </div>
      ${isActive ? '<span style="color:#6366f1; font-size:11px;">✓ Активна</span>' : (unlocked ? '<span style="color:#475569; font-size:11px;">Выбрать</span>' : '<span style="font-size:16px;">🔒</span>')}
    </div>`;
  });

  document.getElementById('modal-title').innerText = '🖼️ Рамка карточки';
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = html;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}

function setCardFrame(id) {
  gameData.cardFrame = id;
  saveData();
  openCardFrameModal();
  updateHeroTab();
}

function openVictoryEffectModal() {
  let html = '<div style="font-size:12px; color:#64748b; margin-bottom:12px;">Эффект воспроизводится на арене после победы в бою.</div>';

  let isNone = !gameData.activeVictoryEffect;
  html += `<div onclick="setVictoryEffect(null)" style="cursor:pointer; padding:12px; border-radius:10px; margin-bottom:8px; background:${isNone ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.6)'}; border:1px solid ${isNone ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center;">
    <span style="color:#94a3b8;">— Без эффекта</span>
    ${isNone ? '<span style="color:#6366f1; font-size:11px;">✓ Активен</span>' : ''}
  </div>`;

  let rarityColors = { mythic: '#ef4444', top10: '#fde68a' };
  let rarityLabels = { mythic: 'Мифический', top10: '🏆 Топ-10 · Глобальный рейтинг' };
  let order = ['mythic', 'top10'];
  let allEffects = Object.entries(VICTORY_EFFECT_META).sort((a,b) => order.indexOf(a[1].rarity) - order.indexOf(b[1].rarity));

  allEffects.forEach(([id, meta]) => {
    let unlocked = gameData.unlockedVictoryEffects && gameData.unlockedVictoryEffects.includes(id);
    let isActive = gameData.activeVictoryEffect === id;
    let col = rarityColors[meta.rarity] || '#94a3b8';
    let label = rarityLabels[meta.rarity] || '';
    html += `<div onclick="${unlocked ? `setVictoryEffect('${id}')` : ''}" style="cursor:${unlocked ? 'pointer' : 'default'}; padding:12px; border-radius:10px; margin-bottom:8px; background:${isActive ? 'rgba(99,102,241,0.2)' : (unlocked ? 'rgba(30,41,59,0.6)' : 'rgba(15,23,42,0.4)')}; border:1px solid ${isActive ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center; opacity:${unlocked ? '1' : '0.45'};">
      <div>
        <div style="font-size:10px; color:${col}; margin-bottom:3px; font-weight:700;">${label}</div>
        <div style="font-size:14px; color:#f1f5f9;">${meta.name}</div>
        <div style="font-size:10px; color:#475569; margin-top:2px;">${meta.source}</div>
      </div>
      ${isActive ? '<span style="color:#6366f1; font-size:11px;">✓ Активен</span>' : (unlocked ? '<span style="color:#475569; font-size:11px;">Выбрать</span>' : '<span style="font-size:16px;">🔒</span>')}
    </div>`;
  });

  document.getElementById('modal-title').innerText = '🏆 Эффект победы';
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = html;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}

function setVictoryEffect(id) {
  gameData.activeVictoryEffect = id;
  saveData();
  openVictoryEffectModal();
  updateHeroTab();
}

// ============================================================
// UI — РЕНДЕР РУЛЕТОК В ПРЕМИУМ-ШОПЕ
// ============================================================

function renderMythicGachaBlock() {
  let el = document.getElementById('mythic-gacha-block');
  if (!el) return;

  let pool = Object.values(MYTHIC_GACHA_POOLS).find(p => !p.hidden);
  if (!pool) { el.innerHTML = ''; return; }

  let classId = pool.classId;
  let mt = gameData.mythicTitles[classId] || { unlocked: [], active: null };
  let spins = gameData.mythicGachaSpinCount[pool.id] || 0;
  let pityLeft = 100 - spins;

  let rarityColors = { uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', mythic:'#ef4444' };
  let titlesHtml = ['uncommon','rare','epic','mythic'].map(r => {
    let t = pool.titles[r];
    let unlocked = r === 'mythic' ? mt.unlocked.includes('mythic') : mt.unlocked.includes(r);
    let col = rarityColors[r];
    let pct = { uncommon:'15%', rare:'7%', epic:'2%', mythic:'0.2%' }[r];
    let displayName = unlocked ? t.name : '???';
    let textColor = unlocked ? (r === 'mythic' ? '#fca5a5' : '#f1f5f9') : '#334155';
    return `<div style="background:rgba(40,10,10,0.7); border-radius:8px; padding:8px; border:1px solid ${unlocked ? col+'55' : '#1e293b'};">
      <div style="font-size:9px; color:${col}; font-weight:bold;">${t.label.toUpperCase()} · ${pct}</div>
      <div style="font-size:11px; color:${textColor}; margin-top:2px;">${displayName}</div>
      ${unlocked ? `<div style="font-size:9px; color:${col}; margin-top:2px;">✓ Выбито</div>` : ''}
    </div>`;
  }).join('');

  let frameUnlocked = gameData.unlockedFrames && gameData.unlockedFrames.includes(pool.frame.id);
  let effectUnlocked = gameData.unlockedEffects && gameData.unlockedEffects.includes(pool.entryEffect.id);
  let cosmHtml = `
    <div style="background:rgba(40,10,10,0.7); border-radius:8px; padding:8px; border:1px solid ${frameUnlocked ? '#ef444455' : '#1e293b'};">
      <div style="font-size:9px; color:#ef4444; font-weight:bold;">РАМКА · 0.4%</div>
      <div style="font-size:11px; color:${frameUnlocked ? '#f1f5f9' : '#334155'}; margin-top:2px;">${frameUnlocked ? pool.frame.name : '???'}</div>
      ${frameUnlocked ? '<div style="font-size:9px; color:#ef4444; margin-top:2px;">✓ Выбито</div>' : ''}
    </div>
    <div style="background:rgba(40,10,10,0.7); border-radius:8px; padding:8px; border:1px solid ${effectUnlocked ? '#ef444455' : '#1e293b'};">
      <div style="font-size:9px; color:#ef4444; font-weight:bold;">ЭФФЕКТ · 0.4%</div>
      <div style="font-size:11px; color:${effectUnlocked ? '#f1f5f9' : '#334155'}; margin-top:2px;">${effectUnlocked ? pool.entryEffect.name : '???'}</div>
      ${effectUnlocked ? '<div style="font-size:9px; color:#ef4444; margin-top:2px;">✓ Выбито</div>' : ''}
    </div>`;

  el.innerHTML = `
  <div style="border:2px solid #7f0000; border-radius:14px; overflow:hidden; margin-bottom:16px; background:linear-gradient(160deg,#0d0202,#1a0505); box-shadow:0 0 28px rgba(220,38,38,0.25),0 0 60px rgba(127,0,0,0.12); position:relative;">
    <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(239,68,68,0.6),rgba(220,38,38,0.9),rgba(239,68,68,0.6),transparent);pointer-events:none;"></div>
    <div style="background:linear-gradient(135deg,rgba(127,0,0,0.4),rgba(60,0,0,0.6));padding:16px;border-bottom:1px solid #7f000066;position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="font-size:9px;color:#ef4444;font-weight:900;letter-spacing:2px;text-transform:uppercase;background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.4);border-radius:20px;padding:2px 8px;">✦ Мифическая рулетка</span>
          </div>
          <div style="font-size:15px;font-weight:900;color:#fca5a5;text-shadow:0 0 12px rgba(239,68,68,0.6);margin-bottom:3px;">${pool.icon} ${pool.name}</div>
          <div style="font-size:11px;color:#7f1d1d;font-style:italic;">"${pool.tagline}"</div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:10px;">
          <div style="font-size:10px;color:#7f1d1d;">Гарант</div>
          <div style="font-size:20px;font-weight:900;color:${pityLeft<=15?'#ef4444':'#7f1d1d'};">${pityLeft}</div>
        </div>
      </div>
    </div>
    <div style="padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:6px;border-bottom:1px solid #1e293b;">${titlesHtml}</div>
    <div style="padding:10px 16px 0;display:grid;grid-template-columns:1fr 1fr;gap:6px;border-bottom:1px solid #1e293b;padding-bottom:10px;">${cosmHtml}</div>
    <div style="padding:14px 16px;">
      <button onclick="openMythicGachaModal('${pool.id}')" style="width:100%;background:linear-gradient(135deg,#7f0000,#dc2626,#7f0000);background-size:200% 100%;border:none;border-radius:10px;padding:14px;color:white;font-size:15px;font-weight:900;cursor:pointer;letter-spacing:0.5px;box-shadow:0 0 16px rgba(220,38,38,0.5);animation:legendary-shimmer 3s linear infinite;">
        🎲 Крутить — ${pool.cost} 💠
      </button>
      <div style="text-align:center;margin-top:6px;font-size:11px;color:#7f1d1d;">Открыто: ${mt.unlocked.length}/4 тит. · ${frameUnlocked?'🖼️':'🔒'} рамка · ${effectUnlocked?'✨':'🔒'} эффект · Гарант через ${pityLeft} кр.</div>
    </div>
  </div>`;
}

function openMythicGachaModal(gachaId) {
  let pool = MYTHIC_GACHA_POOLS[gachaId];
  if (!pool) return;
  if (gameData.lunarStones < pool.cost) {
    showCodeResult(`❌ Нужно ${pool.cost} 💠!`, false); return;
  }
  document.getElementById('modal-title').innerHTML = `${pool.icon} ${pool.name}`;
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = `
    <div style="text-align:center; padding:30px 0;">
      <div class="gacha-spin-anim" style="filter:drop-shadow(0 0 12px rgba(220,38,38,0.8));">🎲</div>
      <div style="color:#7f1d1d; font-size:13px; margin-top:12px;">Врата открываются...</div>
    </div>`;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';

  setTimeout(() => {
    let res = rollMythicGacha(gachaId);
    if (!res) { closeModal(); return; }
    showMythicGachaResult(res);
    renderPremiumShop();
  }, 900);
}

function showMythicGachaResult(res) {
  let { result, isGuaranteed, pool, spinsLeft } = res;
  let mainHtml = '';

  if (result.type === 'mythic_title' || result.type === 'title') {
    let rarityColors = { uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', mythic:'#ef4444' };
    let labels = { uncommon:'Необычный', rare:'Редкий', epic:'Эпический', mythic:'✦ Мифический' };
    let rarity = result.type === 'mythic_title' ? 'mythic' : result.rarity;
    let color = rarityColors[rarity];
    let titleHtml = getTitleHtml(rarity, result.value);
    let isDup = !!result.dupComp;
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        ${isGuaranteed ? '<div style="color:#ef4444; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✦ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✦</div>' : ''}
        ${isDup ? '<div style="color:#f59e0b; font-size:11px; letter-spacing:1px; font-weight:bold; margin-bottom:8px;">↩️ ДУБЛЬ — КОМПЕНСАЦИЯ</div>' : ''}
        <div style="font-size:48px; margin-bottom:12px; animation:gacha-pop 0.4s ease-out;">${isDup ? '↩️' : '👑'}</div>
        <div style="font-size:11px; color:${color}; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">${labels[rarity]} ТИТУЛ</div>
        <div style="font-size:20px; font-weight:900; margin-bottom:8px; margin-top:6px;">${titleHtml}</div>
        ${isDup ? `<div style="background:rgba(245,158,11,0.1);border:1px solid #f59e0b44;border-radius:8px;padding:8px 14px;font-size:14px;color:#fbbf24;font-weight:bold;margin-bottom:12px;">Компенсация: ${result.dupComp}</div>`
               : `<div style="font-size:12px;color:#64748b;margin-bottom:12px;">Выберите титул: <b style="color:#94a3b8;">Герой → 👑 Активный титул</b></div>`}
      </div>`;
  } else if (result.type === 'frame') {
    let isDup = !!result.dupComp;
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        ${isGuaranteed ? '<div style="color:#ef4444; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✦ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✦</div>' : ''}
        ${isDup ? '<div style="color:#f59e0b; font-size:11px; margin-bottom:8px; font-weight:bold;">↩️ ДУБЛЬ — КОМПЕНСАЦИЯ</div>' : ''}
        <div style="font-size:48px; margin-bottom:12px; animation:gacha-pop 0.4s ease-out;">🖼️</div>
        <div style="font-size:11px; color:#ef4444; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">РАМКА КАРТОЧКИ</div>
        <div style="font-size:20px; font-weight:900; color:#fca5a5;">${result.value}</div>
        ${isDup ? `<div style="margin-top:10px;color:#fbbf24;font-weight:bold;">${result.dupComp}</div>` : '<div style="font-size:12px;color:#64748b;margin-top:8px;">Активируй: Герой → 🖼️ Рамка карточки</div>'}
      </div>`;
  } else if (result.type === 'effect') {
    let isDup = !!result.dupComp;
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        ${isGuaranteed ? '<div style="color:#ef4444; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✦ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✦</div>' : ''}
        ${isDup ? '<div style="color:#f59e0b; font-size:11px; margin-bottom:8px; font-weight:bold;">↩️ ДУБЛЬ — КОМПЕНСАЦИЯ</div>' : ''}
        <div style="font-size:48px; margin-bottom:12px; animation:gacha-pop 0.4s ease-out;">✨</div>
        <div style="font-size:11px; color:#ef4444; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">ЭФФЕКТ ПОЯВЛЕНИЯ</div>
        <div style="font-size:20px; font-weight:900; color:#fca5a5;">${result.value}</div>
        ${isDup ? `<div style="margin-top:10px;color:#fbbf24;font-weight:bold;">${result.dupComp}</div>` : '<div style="font-size:12px;color:#64748b;margin-top:8px;">Активируй: Герой → ✨ Эффект появления</div>'}
      </div>`;
  } else if (result.type === 'comp_all') {
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        <div style="color:#ef4444; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✦ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✦</div>
        <div style="font-size:48px; margin-bottom:12px;">💠</div>
        <div style="font-size:14px; color:#67e8f9; font-weight:bold;">Всё уже получено!</div>
        <div style="font-size:20px; font-weight:900; color:#fbbf24; margin-top:8px;">+1000 💠 компенсация</div>
      </div>`;
  } else if (result.type === 'imperials') {
    mainHtml = `<div style="text-align:center;padding:10px 0 20px;"><div style="font-size:48px;margin-bottom:12px;">🪙</div><div style="font-size:28px;font-weight:900;color:#fbbf24;">${result.value.toLocaleString()} 🪙</div></div>`;
  } else if (result.type === 'key') {
    mainHtml = `<div style="text-align:center;padding:10px 0 20px;"><div style="font-size:48px;margin-bottom:12px;">🗝️</div><div style="font-size:22px;font-weight:900;color:#fbbf24;">${result.keyName}</div></div>`;
  } else {
    mainHtml = `<div style="text-align:center;padding:10px 0 20px;"><div style="font-size:48px;margin-bottom:12px;">💨</div><div style="font-size:14px;color:#475569;">Ничего...</div></div>`;
  }

  document.getElementById('modal-desc').innerHTML = `
    ${mainHtml}
    <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(15,23,42,0.8);border-radius:10px;padding:10px 14px;margin-top:8px;">
      <span style="font-size:12px;color:#64748b;">До гаранта: <b style="color:#94a3b8;">${spinsLeft}</b></span>
      <span style="font-size:12px;color:#64748b;">Баланс: <b style="color:#67e8f9;">${gameData.lunarStones} 💠</b></span>
    </div>`;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:linear-gradient(135deg,#7f0000,#dc2626);flex:1;margin-right:6px;" onclick="closeModal();openMythicGachaModal('${pool.id}')">🎲 Ещё раз</button>
    <button class="action-btn" style="background:#334155;flex:0;padding:12px 16px;" onclick="closeModal()">✕</button>`;
}

function renderGachaList() {
  let el = document.getElementById('gacha-list');
  if (!el) return;
  let visible = Object.values(GACHA_POOLS).filter(g => !g.hidden);
  el.innerHTML = visible.map(g => {
    let spins = gameData.gachaSpinCount[g.id] || 0;
    let pityLeft = 100 - spins;
    let td = gameData.titles[g.classId] || { unlocked: [], active: null };
    let unlockedCount = td.unlocked.length;
    let hasLegendary = td.unlocked.includes('legendary');
    let isLegendaryPool = !!g.isLegendaryPool;
    let headerBg = isLegendaryPool
      ? 'background:linear-gradient(135deg,rgba(245,158,11,0.15),rgba(180,83,9,0.25))'
      : `background:linear-gradient(135deg,${g.color}22,${g.color}44)`;
    let nameStyle = isLegendaryPool
      ? 'class="gacha-legendary-title"'
      : `style="font-size:15px;font-weight:900;color:${g.color};"`;
    let cardBorder = isLegendaryPool
      ? 'border:1px solid #f59e0b;box-shadow:0 0 18px rgba(245,158,11,0.35);'
      : `border:1px solid ${g.borderColor};`;

    return `
    <div class="gacha-card" style="${cardBorder}border-radius:14px;overflow:hidden;margin-bottom:12px;background:rgba(15,23,42,0.97);">
      <div style="${headerBg};padding:14px 16px;border-bottom:1px solid ${isLegendaryPool ? '#f59e0b44' : g.borderColor+'44'};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:11px;color:${isLegendaryPool?'#fbbf24':g.color};font-weight:bold;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">✨ Рулетка</div>
            <div ${nameStyle}>${g.icon} ${g.name}</div>
            <div style="font-size:11px;color:#64748b;margin-top:3px;font-style:italic;">"${g.tagline}"</div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:10px;">
            <div style="font-size:10px;color:#475569;">Гарант</div>
            <div style="font-size:18px;font-weight:900;color:${pityLeft<=10?'#fbbf24':'#64748b'};">${pityLeft}</div>
          </div>
        </div>
      </div>
      <div style="padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:6px;border-bottom:1px solid #1e293b;">
        ${['uncommon','rare','epic','legendary'].map(r => {
          let t = g.titles[r];
          let unlocked = td.unlocked.includes(r);
          let alwaysShow = r === 'legendary';
          let colors = { uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', legendary:'#f59e0b' };
          let pct = { uncommon:'15%', rare:'7%', epic:'2%', legendary:'0.4%' }[r];
          let displayName = (unlocked || alwaysShow) ? t.name : '???';
          let textColor = (unlocked || alwaysShow) ? (r === 'legendary' ? '#fbbf24' : '#f1f5f9') : '#334155';
          return `<div style="background:rgba(30,41,59,0.6);border-radius:8px;padding:8px;border:1px solid ${(unlocked||alwaysShow)?colors[r]+'55':'#1e293b'};">
            <div style="font-size:9px;color:${colors[r]};font-weight:bold;">${t.label.toUpperCase()} · ${pct}</div>
            <div style="font-size:11px;color:${textColor};margin-top:2px;">${displayName}</div>
            ${unlocked ? `<div style="font-size:9px;color:${colors[r]};margin-top:2px;">✓ Выбито</div>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div style="padding:12px 16px;">
        <button onclick="openGachaModal('${g.id}')" style="width:100%;background:${isLegendaryPool?'linear-gradient(135deg,#f59e0b,#b45309,#f59e0b)':`linear-gradient(135deg,${g.color},${g.borderColor})`};border:none;border-radius:10px;padding:13px;color:white;font-size:15px;font-weight:900;cursor:pointer;letter-spacing:0.5px;${isLegendaryPool?'box-shadow:0 0 12px rgba(245,158,11,0.5);':''}">
          🎲 Крутить — 10 💠
        </button>
        <div style="text-align:center;margin-top:6px;font-size:11px;color:#475569;">
          Открыто: ${unlockedCount}/4 · ${hasLegendary ? '👑 Легендарный получен!' : `Гарант через ${pityLeft} кр.`}
        </div>
      </div>
    </div>`;
  }).join('');
}

function openGachaModal(gachaId) {
  let pool = GACHA_POOLS[gachaId];
  if (!pool) return;
  if (gameData.lunarStones < 10) {
    showCodeResult('❌ Недостаточно Лунных камней!', false); return;
  }

  document.getElementById('modal-title').innerHTML = `${pool.icon} ${pool.name}`;
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = `
    <div style="text-align:center; padding:30px 0;">
      <div class="gacha-spin-anim" id="gacha-spinner">🎲</div>
      <div style="color:#64748b; font-size:13px; margin-top:12px;">Прокручиваю...</div>
    </div>`;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';

  setTimeout(() => {
    let res = rollGacha(gachaId);
    if (!res) { closeModal(); return; }
    showGachaResult(res);
    renderPremiumShop();
  }, 800);
}

function showGachaResult(res) {
  let { result, isGuaranteed, pool, spinsLeft } = res;
  let mainHtml = '';
  let rarityColors = { uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', legendary:'#f59e0b' };

  if (result.type === 'title') {
    let color = rarityColors[result.rarity];
    let label = { uncommon:'Необычный', rare:'Редкий', epic:'Эпический', legendary:'Легендарный' }[result.rarity];
    let titleHtml = getTitleHtml(result.rarity, result.value);
    let isDuplicate = !!result.dupComp;
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        ${isGuaranteed ? '<div style="color:#fbbf24; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✨ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✨</div>' : ''}
        ${isDuplicate ? '<div style="color:#f59e0b; font-size:11px; letter-spacing:1px; font-weight:bold; margin-bottom:8px;">↩️ ДУБЛЬ — КОМПЕНСАЦИЯ</div>' : ''}
        <div style="font-size:48px; margin-bottom:12px; animation:gacha-pop 0.4s ease-out;">${isDuplicate ? '↩️' : '👑'}</div>
        <div style="font-size:11px; color:${color}; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">${label.toUpperCase()} ТИТУЛ</div>
        <div style="font-size:20px; font-weight:900; margin-bottom:8px;">${titleHtml}</div>
        ${isDuplicate
          ? `<div style="background:rgba(245,158,11,0.1);border:1px solid #f59e0b44;border-radius:8px;padding:8px 14px;font-size:14px;color:#fbbf24;font-weight:bold;margin-bottom:12px;">Компенсация: ${result.dupComp}</div>`
          : `<div style="font-size:12px;color:#64748b;margin-bottom:16px;">Для класса: ${CLASSES[pool.classId].name}</div>
          <div style="background:rgba(30,41,59,0.8);border-radius:10px;padding:10px;font-size:12px;color:#475569;">Выберите титул в меню <b style="color:#94a3b8;">Герой</b> → 👑 Активный титул</div>`}
      </div>`;
  } else if (result.type === 'victoryEffect') {
    let isDuplicate = !!result.dupComp;
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        ${isGuaranteed ? '<div style="color:#fbbf24; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✨ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✨</div>' : ''}
        ${isDuplicate ? '<div style="color:#f59e0b; font-size:11px; letter-spacing:1px; font-weight:bold; margin-bottom:8px;">↩️ ДУБЛЬ — КОМПЕНСАЦИЯ</div>' : ''}
        <div style="font-size:48px; margin-bottom:12px;">🏆</div>
        <div style="font-size:11px; color:#ef4444; font-weight:900; letter-spacing:2px; margin-bottom:8px;">МИФИЧЕСКИЙ ЭФФЕКТ ПОБЕДЫ</div>
        <div style="font-size:22px; font-weight:900; color:#f1f5f9; margin-bottom:10px;">${result.name}</div>
        ${isDuplicate
          ? `<div style="background:rgba(245,158,11,0.1);border:1px solid #f59e0b44;border-radius:8px;padding:8px 14px;font-size:14px;color:#fbbf24;font-weight:bold;">${result.dupComp}</div>`
          : `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:10px;font-size:12px;color:#94a3b8;">Воспроизводится при <b style="color:#f1f5f9;">победе в бою</b>.<br>Выбрать в профиле персонажа.</div>`}
      </div>`;
  } else if (result.type === 'imperials') {
    mainHtml = `<div style="text-align:center;padding:10px 0 20px;"><div style="font-size:48px;margin-bottom:12px;">🪙</div><div style="font-size:11px;color:#f59e0b;font-weight:bold;letter-spacing:2px;margin-bottom:8px;">НАГРАДА</div><div style="font-size:28px;font-weight:900;color:#fbbf24;">${result.value.toLocaleString()} 🪙</div><div style="font-size:12px;color:#64748b;margin-top:8px;">Добавлено на счёт</div></div>`;
  } else if (result.type === 'key') {
    mainHtml = `<div style="text-align:center;padding:10px 0 20px;"><div style="font-size:48px;margin-bottom:12px;">🗝️</div><div style="font-size:11px;color:#d97706;font-weight:bold;letter-spacing:2px;margin-bottom:8px;">КЛЮЧ</div><div style="font-size:22px;font-weight:900;color:#fbbf24;">${result.keyName}</div><div style="font-size:12px;color:#64748b;margin-top:8px;">Добавлен в инвентарь</div></div>`;
  } else {
    mainHtml = `<div style="text-align:center;padding:10px 0 20px;"><div style="font-size:48px;margin-bottom:12px;">💨</div><div style="font-size:14px;color:#475569;">Ничего...</div><div style="font-size:11px;color:#334155;margin-top:6px;">Не повезло в этот раз</div></div>`;
  }

  document.getElementById('modal-desc').innerHTML = `
    ${mainHtml}
    <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(15,23,42,0.8);border-radius:10px;padding:10px 14px;margin-top:8px;">
      <span style="font-size:12px;color:#64748b;">До гаранта: <b style="color:#94a3b8;">${spinsLeft}</b></span>
      <span style="font-size:12px;color:#64748b;">Баланс: <b style="color:#67e8f9;">${gameData.lunarStones} 💠</b></span>
    </div>`;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:linear-gradient(135deg,${pool.color},${pool.borderColor});flex:1;margin-right:6px;" onclick="closeModal();openGachaModal('${pool.id}')">🎲 Ещё раз</button>
    <button class="action-btn" style="background:#334155;flex:0;padding:12px 16px;" onclick="closeModal()">✕</button>`;
  let closeBtnG = document.getElementById('modal-close-btn'); if (closeBtnG) closeBtnG.style.display = 'none';
}
