// ============================================================
// DUNGEONS DATA
// Мобы и подземелья: DUNGEON_MOBS, DUNGEONS.
// ============================================================

// ============================================================
// DUNGEONS.JS — База данных подземелий
// Подключается в index.html ПЕРЕД script.js
// ============================================================
//
// Структура подземелья:
//   id            — уникальный ключ
//   name          — отображаемое название
//   icon          — эмодзи
//   dungeonClass  — CSS-класс для фона (задаётся в style.css)
//   keyId         — id ключа в gameData.keys
//   keyName       — отображаемое название ключа
//   keyShopPrice  — цена ключа у Дядюшки Ибн
//   keyArenaDrops — массив диапазонов LP и шансов выпадения ключа
//   floors        — этажи: каждый содержит массив enemies (id из DUNGEON_MOBS)
//   bossReward    — награды за убийство босса последнего этажа
//
// Структура моба:
//   id            — уникальный ключ
//   name          — отображаемое имя
//   icon          — эмодзи
//   tier          — 'normal' | 'elite' | 'boss'
//   hp            — здоровье
//   attackMin/Max — диапазон урона
//   blockMin/Max  — диапазон блока
//   abilities     — массив id способностей (логика в script.js)
//   lootDrops     — { rare: шанс, epic: шанс } | null (у боссов null)
//
// Доступные abilities:
//   'disease'     — Болезнь: блокирует лечение игрока на 3 хода
//   'fate'        — Прими судьбу: отключает блок игрока на 3 хода
//   'submit'      — Подчинись мне: x2 урон на 2 хода (триггер: 4+ урона за ход)
//   'notover'     — Это ещё не конец: лечение при HP<=15 + HoT 2 хода
//   'bite'        — Укус: каждые -10 хп следующая атака +3 урона
//   'hiss'        — Как ты с-с-смеешь: снижает урон на 1 на 2 хода (триггер: 4+ урона за ход)
//   'rage_hot'    — Не стоило меня злить: +1 хп каждый ход (триггер: потеря 18 хп)
//   'water_blast' — Узри мощь воды: 5 урона игнорируя броню + Устрашение на 3 хода (триггер: 20 ход)
// ============================================================


// ------------------------------------------------------------
// МОБЫ
// ------------------------------------------------------------

const DUNGEON_MOBS = {

  // === ЗАБРОШЕННАЯ УСАДЬБА ===

  wanderer: {
    id: 'wanderer',
    name: 'Весёлый скиталец',
    icon: '👻',
    tier: 'normal',
    hp: 20,
    attackMin: 1, attackMax: 3,
    blockMin: 1,  blockMax: 2,
    abilities: [],
    lootDrops: { rare: 0.30, epic: 0.01 }
  },

  observer: {
    id: 'observer',
    name: 'Наблюдатель',
    icon: '👽',
    tier: 'elite',
    hp: 25,
    attackMin: 1, attackMax: 3,
    blockMin: 1,  blockMax: 2,
    abilities: ['disease'],
    lootDrops: { rare: 0.50, epic: 0.03 }
  },

  sylvia: {
    id: 'sylvia',
    name: 'Леди Сильвия',
    icon: '🧕',
    tier: 'boss',
    hp: 30,
    attackMin: 1, attackMax: 3,
    blockMin: 1,  blockMax: 3,
    abilities: ['fate', 'submit', 'notover'],
    lootDrops: null
  },

  // === ЗАБЫТАЯ РЕКА ===

  lizard: {
    id: 'lizard',
    name: 'Ядовитая ящерица',
    icon: '🦎',
    tier: 'normal',
    hp: 20,
    attackMin: 1, attackMax: 3,
    blockMin: 1,  blockMax: 2,
    abilities: [],
    lootDrops: { rare: 0.35, epic: 0.015 }
  },

  croc: {
    id: 'croc',
    name: 'Злобный крокодил',
    icon: '🐊',
    tier: 'normal',
    hp: 20,
    attackMin: 1, attackMax: 2,
    blockMin: 1,  blockMax: 3,
    abilities: [],
    lootDrops: { rare: 0.35, epic: 0.015 }
  },

  giant_lizard: {
    id: 'giant_lizard',
    name: 'Гигантский ящер',
    icon: '🦖',
    tier: 'elite',
    hp: 25,
    attackMin: 1, attackMax: 3,
    blockMin: 1,  blockMax: 3,
    abilities: ['bite'],
    lootDrops: { rare: 0.55, epic: 0.04 }
  },

  sea_dragon: {
    id: 'sea_dragon',
    name: 'Морской дракон',
    icon: '🐉',
    tier: 'boss',
    hp: 30,
    attackMin: 1, attackMax: 3,
    blockMin: 1,  blockMax: 3,
    abilities: ['hiss', 'rage_hot', 'water_blast'],
    lootDrops: null
  },

  // === ДРЕВНИЙ ХРАМ ===

  seeker: {
    id: 'seeker',
    name: 'Труп искателя сокровищ',
    icon: '💀',
    tier: 'normal',
    hp: 25,
    attackMin: 1, attackMax: 3,
    blockMin: 1,  blockMax: 2,
    abilities: [],
    lootDrops: { rare: 0.40, epic: 0.02 }
  },

  snake: {
    id: 'snake',
    name: 'Ядовитая змея',
    icon: '🐍',
    tier: 'normal',
    hp: 15,
    attackMin: 3, attackMax: 4,
    blockMin: 1,  blockMax: 2,
    abilities: [],
    lootDrops: { rare: 0.40, epic: 0.02 }
  },

  stone_guard: {
    id: 'stone_guard',
    name: 'Каменный страж',
    icon: '🗿',
    tier: 'elite',
    hp: 30,
    attackMin: 1, attackMax: 3,
    blockMin: 1,  blockMax: 3,
    abilities: ['stone_skin'],
    lootDrops: { rare: 0.60, epic: 0.05 }
  },

  temple_keeper: {
    id: 'temple_keeper',
    name: 'Хранитель храма',
    icon: '🧝🏻‍♂️',
    tier: 'boss',
    hp: 30,
    attackMin: 1, attackMax: 3,
    blockMin: 1,  blockMax: 3,
    abilities: ['doom', 'summon_slave', 'suppress'],
    lootDrops: null
  },

  enslaved: {
    id: 'enslaved',
    name: 'Порабощённый',
    icon: '👳🏻‍♂️',
    tier: 'normal',
    hp: 15,
    attackMin: 1, attackMax: 2,
    blockMin: 2,  blockMax: 3,
    abilities: [],
    lootDrops: null
  },

  // === СЮДА ДОБАВЛЯТЬ МОБОВ НОВЫХ ДАНЖЕЙ ===

};


// ------------------------------------------------------------
// ПОДЗЕМЕЛЬЯ
// ------------------------------------------------------------

const DUNGEONS = {

  // === 1. ЗАБРОШЕННАЯ УСАДЬБА ===
  mansion: {
    id: 'mansion',
    name: 'Заброшенная усадьба',
    icon: '🏚️',
    dungeonClass: 'dungeon-mansion',
    keyId: 'dusty_key',
    keyName: '🗝️ Пыльный ключ',
    keyShopPrice: 2000,
    keyArenaDrops: [
      { minLp: 1001, maxLp: 1800,  chance: 0.05 },
      { minLp: 1801, maxLp: 3000,  chance: 0.07 },
      { minLp: 3001, maxLp: 99999, chance: 0.10 }
    ],
    floors: [
      { enemies: ['wanderer'] },
      { enemies: ['wanderer', 'wanderer'] },
      { enemies: ['wanderer', 'wanderer', 'observer'] },
      { enemies: ['sylvia'] }
    ],
    bossReward: {
      imperials: 500,
      guaranteedRarity: 'rare',
      epicChance: 0.05,
      bonusChestChance: 0.10,
      bonusChestEpicChance: 0.10,
      bonusUniqueEpicChance: 0.005,
      keyDrop: { chance: 0.05, keyId: 'wood_key', keyName: '🗝️ Древесный ключ' }
    }
  },

  // === 2. ЗАБЫТАЯ РЕКА ===
  river: {
    id: 'river',
    name: 'Забытая река',
    icon: '🏞️',
    dungeonClass: 'dungeon-river',
    keyId: 'wood_key',
    keyName: '🗝️ Древесный ключ',
    keyShopPrice: 3000,
    keyArenaDrops: [
      { minLp: 1001, maxLp: 1800,  chance: 0.04 },
      { minLp: 1801, maxLp: 3000,  chance: 0.06 },
      { minLp: 3001, maxLp: 99999, chance: 0.09 }
    ],
    floors: [
      { enemies: ['lizard'] },
      { enemies: ['lizard', 'croc'] },
      { enemies: ['croc', 'croc', 'giant_lizard'] },
      { enemies: ['sea_dragon'] }
    ],
    bossReward: {
      imperials: 700,
      guaranteedRarity: 'rare',
      epicChance: 0.07,
      bonusChestChance: 0.15,
      bonusChestEpicChance: 0.20,
      bonusUniqueEpicChance: 0.007,
      keyDrop: { chance: 0.10, keyId: 'ancient_key', keyName: '🗝️ Древний ключ' }
    }
  },

  // === 3. ДРЕВНИЙ ХРАМ ===
  temple: {
    id: 'temple',
    name: 'Древний храм',
    icon: '🕌',
    dungeonClass: 'dungeon-temple',
    keyId: 'ancient_key',
    keyName: '🗝️ Древний ключ',
    keyShopPrice: 0,         // нельзя купить за золото
    keyLunarPrice: 20,       // цена в лунных монетах
    keyArenaDrops: [
      { minLp: 1001, maxLp: 1800,  chance: 0.03 },
      { minLp: 1801, maxLp: 3000,  chance: 0.05 },
      { minLp: 3001, maxLp: 99999, chance: 0.08 }
    ],
    floors: [
      { enemies: ['seeker'] },
      { enemies: ['seeker', 'snake'] },
      { enemies: ['snake', 'snake', 'stone_guard'] },
      { enemies: ['temple_keeper'] }
    ],
    bossReward: {
      imperials: 1000,
      guaranteedCount: 2,       // 2 гарантированных предмета
      guaranteedRarity: 'rare',
      epicChance: 0.10,
      bonusChestChance: 0.25,
      bonusChestEpicChance: 0.20,
      bonusLunarChance: 0.10,   // 10% на лунные монеты
      bonusLunarMin: 5,
      bonusLunarMax: 20,
      bonusUniqueEpicChance: 0.01,
      legendaryArmorChance: 0.004 // 0.4% легендарная броня стража
    }
  },

  // === 4. СЮДА ДОБАВЛЯТЬ НОВЫЕ ДАНЖИ ===

};
