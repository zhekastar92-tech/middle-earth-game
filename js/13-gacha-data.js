// ============================================================
// GACHA DATA
// Таблицы легендарных и мифических рулеток + мета рамок/эффектов появления/эффектов победы.
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
    hidden: true,
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
    hidden: false,
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

// Лoot-таблица гачи (одинакова для всех)
// uncommon: 15%, rare: 7%, epic: 2%, legendary: 0.4%
// imperials: 60% (разбивка внутри), keys: 16% (разбивка внутри)
// Остаток: ничего (6.6%)
// ============================================================
// МИФИЧЕСКИЕ РУЛЕТКИ (v0.5)
// uncommon:15%, rare:7%, epic:2%, mythic:0.2%
// frame:0.4%, entryEffect:0.4%
// imperials:~55%, keys:~20%, nothing:~0.8%
// Гарант 100 прокруток: 40% рамка / 40% эффект / 20% мифик (без повторок)
// ============================================================

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
    hidden: false,
    classId: 'assassin',
    icon: '🌙',
    color: '#7c3aed',
    borderColor: '#6d28d9',
    name: 'Гибнут планеты, содрогаются созвездия...',
    tagline: 'Его тень достигает даже богов.',
    cost: 25,
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Полуночный убийца',        chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Убийца Пустынный Кошмар',  chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Убийца Пустынный Кошмар',  chance: 0.02 },
      mythic:    { label: 'Мифический', name: 'Губитель Галактики',        chance: 0.002 }
    },
    frame:       { id: 'void',          name: '🌌 Бездна',                chance: 0.004 },
    entryEffect: { id: 'flash',         name: '⚡ Вспышка',               chance: 0.004 }
  },

  darkknight: {
    id: 'darkknight',
    hidden: true,
    classId: 'darkknight',
    icon: '🦇',
    color: '#dc2626',
    borderColor: '#991b1b',
    name: 'Его появление — конец всего',
    tagline: 'Небо меркнет. Он пришёл.',
    cost: 25,
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Отверженный рыцарь',       chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Рыцарь Инквизитор',        chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Рыцарь Инквизитор',        chance: 0.02 },
      mythic:    { label: 'Мифический', name: 'Вестник Апокалипсиса',     chance: 0.002 }
    },
    frame:       { id: 'blood',         name: '🩸 Кровь Дракона',          chance: 0.004 },
    entryEffect: { id: 'rift',          name: '🌀 Разрыв пространства',   chance: 0.004 }
  },

  priest: {
    id: 'priest',
    hidden: true,
    classId: 'priest',
    icon: '☀️',
    color: '#f59e0b',
    borderColor: '#d97706',
    name: 'Жизнь и смерть в его руках',
    tagline: 'Он решает — кому жить, кому нет.',
    cost: 25,
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Светлый жрец',       chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Странствующий жрец',     chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Жрец Ордена Рассвета',     chance: 0.02 },
      mythic:    { label: 'Мифический', name: 'Судья Созвездия',          chance: 0.002 }
    },
    frame:       { id: 'lightning',     name: '⚡ Молния',                 chance: 0.004 },
    entryEffect: { id: 'radiance',      name: '✨ Сияние Валинора',        chance: 0.004 }
  },

  warrior: {
    id: 'warrior',
    hidden: true,
    classId: 'warrior',
    icon: '⚔️',
    color: '#ef4444',
    borderColor: '#b91c1c',
    name: 'Горе тому, на кого падёт его взор',
    tagline: 'Один его взгляд — приговор.',
    cost: 25,
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Воин чести',               chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Воин Авангарда',           chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Воин Авангарда',           chance: 0.02 },
      mythic:    { label: 'Мифический', name: 'Падший Бог',               chance: 0.002 }
    },
    frame:       { id: 'chaos',         name: '💥 Хаос',                  chance: 0.004 },
    entryEffect: { id: 'impact',        name: '💥 Удар с небес',          chance: 0.004 }
  }

};

// Мета-данные рамок (для отображения в UI)
const FRAME_META = {
  lightning:   { name: '⚡ Молния',           rarity: 'mythic',    class: 'frame-lightning' },
  blood:       { name: '🩸 Кровь Дракона',    rarity: 'mythic',    class: 'frame-blood' },
  void:        { name: '🌌 Бездна',           rarity: 'mythic',    class: 'frame-void' },
  astral:      { name: '🌠 Астрал',           rarity: 'mythic',    class: 'frame-astral' },
  valinor:     { name: '✨ Золото Валинора',  rarity: 'top10',     class: 'frame-valinor' },
  chaos:       { name: '💥 Хаос',             rarity: 'mythic',    class: 'frame-chaos' }
};

// Мета-данные эффектов появления
const ENTRY_EFFECT_META = {
  slide:        { name: '🌟 Нисхождение',          rarity: 'top10',     cssClass: 'entry-anim-slide',       hasFlash: false, hasWave: false, hasRing: false },
  flash:        { name: '⚡ Вспышка',              rarity: 'mythic',    cssClass: 'entry-anim-flash',       hasFlash: false, hasWave: false, hasRing: false },
  materialize:  { name: '🌫️ Материализация',       rarity: 'mythic',    cssClass: 'entry-anim-materialize', hasFlash: false, hasWave: false, hasRing: false },
  impact:       { name: '💥 Удар с небес',         rarity: 'mythic',    cssClass: 'entry-anim-impact',      hasFlash: false, hasWave: true,  hasRing: false },
  rift:         { name: '🌀 Разрыв пространства',  rarity: 'mythic',    cssClass: 'entry-anim-rift',        hasFlash: true,  hasWave: false, hasRing: false },
  radiance:     { name: '✨ Сияние Валинора',      rarity: 'mythic',    cssClass: 'entry-anim-radiance',    hasFlash: false, hasWave: false, hasRing: true  }
};

// Мета-данные эффектов победы
const VICTORY_EFFECT_META = {
  gold:    { name: '✨ Золотой взрыв',    rarity: 'top10',   source: 'Топ-10 рейтинга' },
  arcane:  { name: '🔮 Мистический',      rarity: 'mythic',  source: 'Рулетка: Страж' },
  inferno: { name: '🔥 Адское пламя',     rarity: 'mythic',  source: 'Рулетка: Воин' },
  blood:   { name: '🩸 Кровавая жатва',   rarity: 'mythic',  source: 'Рулетка: Тёмный Рыцарь' },
  storm:   { name: '⚡ Буря',             rarity: 'mythic',  source: 'Рулетка: Убийца' },
  ascend:  { name: '🌿 Вознесение',       rarity: 'mythic',  source: 'Рулетка: Жрец' },
};
