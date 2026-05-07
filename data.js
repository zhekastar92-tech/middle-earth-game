// ============================================================
// DATA.JS — База данных игры
// Все константы: тиры, оружие, экипировка, модули, карта
// ============================================================

// ============================================================
// ВАЛЮТА И СТАРТОВЫЙ КАПИТАЛ
// ============================================================

const CURRENCY_NAME = 'Коин';
const CURRENCY_ICON = '₵';
const STARTING_COINS = 5000;

// ============================================================
// ТИРЫ
// Тиры V и VI — задел на будущее, isActive: false
// ============================================================

const TIERS = {
  1: { name: 'Тир I',   label: 'I',   color: '#94a3b8', glowColor: 'rgba(148,163,184,0.4)', isActive: true  },
  2: { name: 'Тир II',  label: 'II',  color: '#4ade80', glowColor: 'rgba(74,222,128,0.4)',  isActive: true  },
  3: { name: 'Тир III', label: 'III', color: '#60a5fa', glowColor: 'rgba(96,165,250,0.4)',  isActive: true  },
  4: { name: 'Тир IV',  label: 'IV',  color: '#c084fc', glowColor: 'rgba(192,132,252,0.4)', isActive: true  },
  5: { name: 'Тир V',   label: 'V',   color: '#fb923c', glowColor: 'rgba(251,146,60,0.4)',  isActive: false },
  6: { name: 'Тир VI',  label: 'VI',  color: '#f43f5e', glowColor: 'rgba(244,63,94,0.4)',   isActive: false },
};

// ============================================================
// ТИПЫ ОРУЖИЯ
// slots — доступные слоты под модули
// ============================================================

const WEAPON_TYPES = {
  pistol: {
    id: 'pistol',
    name: 'Пистолет',
    icon: '🔫',
    slots: ['magazine'],
    shotsPerRound: { min: 2, max: 4 },
    desc: 'Резервное оружие. Мало выстрелов, всегда при себе.',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Дробовик',
    icon: '💥',
    slots: ['scope', 'grip', 'magazine', 'stock'],
    shotsPerRound: { min: 1, max: 2 },
    desc: 'Высокий урон в упор. Штраф точности на дистанции.',
  },
  smg: {
    id: 'smg',
    name: 'Пистолет-пулемёт',
    icon: '⚡',
    slots: ['magazine', 'grip', 'stock'],
    shotsPerRound: { min: 5, max: 8 },
    desc: 'Много выстрелов, низкий урон за пулю.',
  },
  rifle: {
    id: 'rifle',
    name: 'Автомат',
    icon: '🎯',
    slots: ['scope', 'grip', 'magazine', 'stock'],
    shotsPerRound: { min: 3, max: 6 },
    desc: 'Основной класс. Баланс урона, точности и скорострельности.',
  },
  sniper: {
    id: 'sniper',
    name: 'Снайперская винтовка',
    icon: '🔭',
    slots: ['scope', 'stock'],
    shotsPerRound: { min: 1, max: 2 },
    desc: 'Высокий урон, высокая точность. Мало выстрелов за раунд.',
  },
};

// ============================================================
// ОРУЖИЕ
// damage     — урон за одну пулю (базовый)
// accuracy   — базовый шанс попадания (0.0 — 1.0)
// magSize    — ёмкость магазина
// weight     — вес в кг
// tier       — тир (1–6)
// type       — ключ из WEAPON_TYPES
// price      — цена у торговца
// ============================================================

const WEAPONS = {

  // === ПИСТОЛЕТЫ ===
  p_t1: {
    id: 'p_t1', type: 'pistol', tier: 1,
    name: 'ПМ', icon: '🔫',
    damage: 12, accuracy: 0.55, magSize: 8,
    weight: 0.8, price: 300,
    desc: 'Надёжный, но слабый. Стандартный пистолет тир I.',
  },
  p_t2: {
    id: 'p_t2', type: 'pistol', tier: 2,
    name: 'Глок-17', icon: '🔫',
    damage: 16, accuracy: 0.60, magSize: 10,
    weight: 0.9, price: 800,
    desc: 'Полимерный корпус, увеличенный магазин.',
  },
  p_t3: {
    id: 'p_t3', type: 'pistol', tier: 3,
    name: 'Берetta M9', icon: '🔫',
    damage: 20, accuracy: 0.65, magSize: 12,
    weight: 1.0, price: 2000,
    desc: 'Армейский стандарт. Надёжность и точность.',
  },
  p_t4: {
    id: 'p_t4', type: 'pistol', tier: 4,
    name: 'Desert Eagle', icon: '🔫',
    damage: 35, accuracy: 0.60, magSize: 7,
    weight: 1.5, price: 6000,
    desc: 'Мощный пистолет с огромным останавливающим действием.',
  },
  p_t5: {
    id: 'p_t5', type: 'pistol', tier: 5,
    name: '[ЗАГЛУШКА Т5 Пистолет]', icon: '🔫',
    damage: 40, accuracy: 0.65, magSize: 9,
    weight: 1.2, price: 15000,
    desc: 'Задел на будущее.', _inactive: true,
  },
  p_t6: {
    id: 'p_t6', type: 'pistol', tier: 6,
    name: '[ЗАГЛУШКА Т6 Пистолет]', icon: '🔫',
    damage: 50, accuracy: 0.70, magSize: 10,
    weight: 1.3, price: 30000,
    desc: 'Задел на будущее.', _inactive: true,
  },

  // === ДРОБОВИКИ ===
  sg_t1: {
    id: 'sg_t1', type: 'shotgun', tier: 1,
    name: 'Двустволка', icon: '💥',
    damage: 28, accuracy: 0.65, magSize: 2,
    weight: 3.2, price: 500,
    desc: 'Два выстрела и всё. Убийственна в упор.',
  },
  sg_t2: {
    id: 'sg_t2', type: 'shotgun', tier: 2,
    name: 'Mossberg 500', icon: '💥',
    damage: 34, accuracy: 0.60, magSize: 5,
    weight: 3.5, price: 1500,
    desc: 'Классика. Надёжный помповый дробовик.',
  },
  sg_t3: {
    id: 'sg_t3', type: 'shotgun', tier: 3,
    name: 'Remington 870', icon: '💥',
    damage: 40, accuracy: 0.65, magSize: 6,
    weight: 3.8, price: 3500,
    desc: 'Точный и мощный. Любимец полиции и бандитов.',
  },
  sg_t4: {
    id: 'sg_t4', type: 'shotgun', tier: 4,
    name: 'SPAS-12', icon: '💥',
    damage: 52, accuracy: 0.62, magSize: 8,
    weight: 4.4, price: 9000,
    desc: 'Полуавтомат. Высокий урон, высокая скорострельность.',
  },
  sg_t5: {
    id: 'sg_t5', type: 'shotgun', tier: 5,
    name: '[ЗАГЛУШКА Т5 Дробовик]', icon: '💥',
    damage: 60, accuracy: 0.65, magSize: 8,
    weight: 4.0, price: 20000,
    desc: 'Задел на будущее.', _inactive: true,
  },
  sg_t6: {
    id: 'sg_t6', type: 'shotgun', tier: 6,
    name: '[ЗАГЛУШКА Т6 Дробовик]', icon: '💥',
    damage: 72, accuracy: 0.68, magSize: 10,
    weight: 4.5, price: 40000,
    desc: 'Задел на будущее.', _inactive: true,
  },

  // === ПИСТОЛЕТЫ-ПУЛЕМЁТЫ ===
  smg_t1: {
    id: 'smg_t1', type: 'smg', tier: 1,
    name: 'ППШ-41', icon: '⚡',
    damage: 10, accuracy: 0.50, magSize: 35,
    weight: 3.6, price: 600,
    desc: 'Старый, но злобный. Огромный магазин, низкий урон.',
  },
  smg_t2: {
    id: 'smg_t2', type: 'smg', tier: 2,
    name: 'MP5', icon: '⚡',
    damage: 14, accuracy: 0.58, magSize: 30,
    weight: 2.9, price: 2000,
    desc: 'Легенда спецназа. Точный и компактный.',
  },
  smg_t3: {
    id: 'smg_t3', type: 'smg', tier: 3,
    name: 'UMP-45', icon: '⚡',
    damage: 18, accuracy: 0.60, magSize: 25,
    weight: 2.5, price: 4500,
    desc: 'Мощный патрон .45. Меньше выстрелов, больше урона.',
  },
  smg_t4: {
    id: 'smg_t4', type: 'smg', tier: 4,
    name: 'P90', icon: '⚡',
    damage: 20, accuracy: 0.65, magSize: 50,
    weight: 2.7, price: 10000,
    desc: 'Футуристичный. Огромный магазин, высокая точность.',
  },
  smg_t5: {
    id: 'smg_t5', type: 'smg', tier: 5,
    name: '[ЗАГЛУШКА Т5 ПП]', icon: '⚡',
    damage: 24, accuracy: 0.68, magSize: 45,
    weight: 2.8, price: 22000,
    desc: 'Задел на будущее.', _inactive: true,
  },
  smg_t6: {
    id: 'smg_t6', type: 'smg', tier: 6,
    name: '[ЗАГЛУШКА Т6 ПП]', icon: '⚡',
    damage: 30, accuracy: 0.72, magSize: 50,
    weight: 3.0, price: 45000,
    desc: 'Задел на будущее.', _inactive: true,
  },

  // === АВТОМАТЫ ===
  ar_t1: {
    id: 'ar_t1', type: 'rifle', tier: 1,
    name: 'АКС-74У', icon: '🎯',
    damage: 22, accuracy: 0.58, magSize: 30,
    weight: 3.0, price: 1000,
    desc: 'Короткий автомат. Дёшево и сердито.',
  },
  ar_t2: {
    id: 'ar_t2', type: 'rifle', tier: 2,
    name: 'АК-74М', icon: '🎯',
    damage: 26, accuracy: 0.62, magSize: 30,
    weight: 3.4, price: 2500,
    desc: 'Надёжный и проверенный. Основа любого рейда.',
  },
  ar_t3: {
    id: 'ar_t3', type: 'rifle', tier: 3,
    name: 'M4A1', icon: '🎯',
    damage: 30, accuracy: 0.68, magSize: 30,
    weight: 3.3, price: 5500,
    desc: 'Американская классика. Точен, удобен в управлении.',
  },
  ar_t4: {
    id: 'ar_t4', type: 'rifle', tier: 4,
    name: 'HK416', icon: '🎯',
    damage: 36, accuracy: 0.72, magSize: 30,
    weight: 3.5, price: 12000,
    desc: 'Немецкое качество. Один из лучших автоматов в мире.',
  },
  ar_t5: {
    id: 'ar_t5', type: 'rifle', tier: 5,
    name: '[ЗАГЛУШКА Т5 Автомат]', icon: '🎯',
    damage: 42, accuracy: 0.75, magSize: 30,
    weight: 3.6, price: 25000,
    desc: 'Задел на будущее.', _inactive: true,
  },
  ar_t6: {
    id: 'ar_t6', type: 'rifle', tier: 6,
    name: '[ЗАГЛУШКА Т6 Автомат]', icon: '🎯',
    damage: 52, accuracy: 0.80, magSize: 30,
    weight: 3.8, price: 50000,
    desc: 'Задел на будущее.', _inactive: true,
  },

  // === СНАЙПЕРСКИЕ ВИНТОВКИ ===
  sr_t1: {
    id: 'sr_t1', type: 'sniper', tier: 1,
    name: 'СВД', icon: '🔭',
    damage: 55, accuracy: 0.70, magSize: 10,
    weight: 4.3, price: 2000,
    desc: 'Советская классика. Надёжная полуавтоматическая снайперка.',
  },
  sr_t2: {
    id: 'sr_t2', type: 'sniper', tier: 2,
    name: 'Remington 700', icon: '🔭',
    damage: 70, accuracy: 0.75, magSize: 5,
    weight: 4.5, price: 5000,
    desc: 'Bolt-action. Убийственный урон, медленный перезаряд.',
  },
  sr_t3: {
    id: 'sr_t3', type: 'sniper', tier: 3,
    name: 'AWP', icon: '🔭',
    damage: 88, accuracy: 0.78, magSize: 5,
    weight: 6.8, price: 10000,
    desc: 'Арктический воин. Один выстрел — один труп.',
  },
  sr_t4: {
    id: 'sr_t4', type: 'sniper', tier: 4,
    name: 'Barrett M82', icon: '🔭',
    damage: 110, accuracy: 0.72, magSize: 10,
    weight: 14.0, price: 20000,
    desc: 'Противоматериальная винтовка. Пробивает любую броню.',
  },
  sr_t5: {
    id: 'sr_t5', type: 'sniper', tier: 5,
    name: '[ЗАГЛУШКА Т5 Снайперка]', icon: '🔭',
    damage: 130, accuracy: 0.76, magSize: 8,
    weight: 10.0, price: 35000,
    desc: 'Задел на будущее.', _inactive: true,
  },
  sr_t6: {
    id: 'sr_t6', type: 'sniper', tier: 6,
    name: '[ЗАГЛУШКА Т6 Снайперка]', icon: '🔭',
    damage: 160, accuracy: 0.80, magSize: 8,
    weight: 12.0, price: 65000,
    desc: 'Задел на будущее.', _inactive: true,
  },
};

// ============================================================
// ПАТРОНЫ
// Тиры патронов совпадают с тирами оружия
// damageBonus — прибавка к базовому урону оружия
// weight      — вес одного патрона
// ============================================================

const AMMO = {
  ammo_t1: {
    id: 'ammo_t1', tier: 1,
    name: 'Патроны Т-I', icon: '🟤',
    damageBonus: 0, armorPen: 0,
    weight: 0.01, price: 5,
    desc: 'Базовые патроны. Никаких бонусов.',
  },
  ammo_t2: {
    id: 'ammo_t2', tier: 2,
    name: 'Патроны Т-II', icon: '🟢',
    damageBonus: 3, armorPen: 0.05,
    weight: 0.012, price: 15,
    desc: 'Улучшенный порох. Немного больше урона.',
  },
  ammo_t3: {
    id: 'ammo_t3', tier: 3,
    name: 'Патроны Т-III', icon: '🔵',
    damageBonus: 6, armorPen: 0.12,
    weight: 0.013, price: 40,
    desc: 'Армейский стандарт. Частичное пробитие брони.',
  },
  ammo_t4: {
    id: 'ammo_t4', tier: 4,
    name: 'Патроны Т-IV', icon: '🟣',
    damageBonus: 10, armorPen: 0.22,
    weight: 0.015, price: 100,
    desc: 'Бронебойные. Хорошо пробивают экипировку тир I–II.',
  },
  ammo_t5: {
    id: 'ammo_t5', tier: 5,
    name: 'Патроны Т-V', icon: '🟠',
    damageBonus: 15, armorPen: 0.35,
    weight: 0.016, price: 250,
    desc: 'Задел на будущее.', _inactive: true,
  },
  ammo_t6: {
    id: 'ammo_t6', tier: 6,
    name: 'Патроны Т-VI', icon: '🔴',
    damageBonus: 22, armorPen: 0.50,
    weight: 0.018, price: 600,
    desc: 'Задел на будущее.', _inactive: true,
  },
};

// ============================================================
// МОДУЛИ ОРУЖИЯ
// type    — тип слота: scope | grip | magazine | stock
// bonus   — что даёт модуль
// ============================================================

const MODULES = {
  // ПРИЦЕЛЫ (scope) — точность
  scope_basic: {
    id: 'scope_basic', type: 'scope',
    name: 'Открытый прицел', icon: '🎯',
    accuracyBonus: 0.05,
    weight: 0.15, price: 500,
    desc: '+5% к точности.',
  },
  scope_red_dot: {
    id: 'scope_red_dot', type: 'scope',
    name: 'Красная точка', icon: '🔴',
    accuracyBonus: 0.08,
    weight: 0.20, price: 1500,
    desc: '+8% к точности.',
  },
  scope_holo: {
    id: 'scope_holo', type: 'scope',
    name: 'Голографический прицел', icon: '💠',
    accuracyBonus: 0.12,
    weight: 0.25, price: 4000,
    desc: '+12% к точности.',
  },
  scope_sniper: {
    id: 'scope_sniper', type: 'scope',
    name: 'Оптика 4x', icon: '🔭',
    accuracyBonus: 0.18,
    weight: 0.40, price: 8000,
    desc: '+18% к точности. Идеально для снайперки.',
  },

  // РУКОЯТИ (grip) — точность
  grip_basic: {
    id: 'grip_basic', type: 'grip',
    name: 'Угловая рукоять', icon: '✊',
    accuracyBonus: 0.04,
    weight: 0.10, price: 400,
    desc: '+4% к точности.',
  },
  grip_vert: {
    id: 'grip_vert', type: 'grip',
    name: 'Вертикальная рукоять', icon: '🖐️',
    accuracyBonus: 0.07,
    weight: 0.12, price: 1200,
    desc: '+7% к точности.',
  },
  grip_tactical: {
    id: 'grip_tactical', type: 'grip',
    name: 'Тактическая рукоять', icon: '🤜',
    accuracyBonus: 0.10,
    weight: 0.15, price: 3000,
    desc: '+10% к точности.',
  },

  // МАГАЗИНЫ (magazine) — ёмкость
  mag_extended: {
    id: 'mag_extended', type: 'magazine',
    name: 'Расширенный магазин', icon: '📦',
    magBonus: 5,
    weight: 0.20, price: 600,
    desc: '+5 патронов в магазине.',
  },
  mag_drum: {
    id: 'mag_drum', type: 'magazine',
    name: 'Барабанный магазин', icon: '🥁',
    magBonus: 15,
    weight: 0.50, price: 2500,
    desc: '+15 патронов в магазине.',
  },
  mag_quad: {
    id: 'mag_quad', type: 'magazine',
    name: 'Quadstack магазин', icon: '🗄️',
    magBonus: 10,
    weight: 0.35, price: 5000,
    desc: '+10 патронов. Компромисс между drum и стандартным.',
  },

  // ПРИКЛАДЫ (stock) — точность
  stock_basic: {
    id: 'stock_basic', type: 'stock',
    name: 'Складной приклад', icon: '📐',
    accuracyBonus: 0.04,
    weight: 0.30, price: 500,
    desc: '+4% к точности.',
  },
  stock_tactical: {
    id: 'stock_tactical', type: 'stock',
    name: 'Тактический приклад', icon: '📏',
    accuracyBonus: 0.08,
    weight: 0.40, price: 2000,
    desc: '+8% к точности.',
  },
  stock_precision: {
    id: 'stock_precision', type: 'stock',
    name: 'Прецизионный приклад', icon: '🔩',
    accuracyBonus: 0.13,
    weight: 0.50, price: 5500,
    desc: '+13% к точности.',
  },
};

// ============================================================
// ЭКИПИРОВКА
// slot        — helmet | vest | gloves | rig | backpack
// tier        — 1–6
// protection  — сколько урона поглощает (для helmet/vest)
// accuracyBonus — бонус к точности (gloves)
// magSlots    — сколько магазинов можно взять (rig)
// carryWeight — грузоподъёмность рюкзака (kg)
// weight      — вес самого предмета
// ============================================================

const EQUIPMENT = {

  // === ШЛЕМЫ ===
  helmet_t1: {
    id: 'helmet_t1', slot: 'helmet', tier: 1,
    name: 'Стальной шлем', icon: '⛑️',
    protection: 15, weight: 1.2, price: 800,
    desc: 'Базовая защита головы. Лучше чем ничего.',
  },
  helmet_t2: {
    id: 'helmet_t2', slot: 'helmet', tier: 2,
    name: 'Баллистический шлем', icon: '🪖',
    protection: 25, weight: 1.4, price: 2000,
    desc: 'Держит пистолетные пули.',
  },
  helmet_t3: {
    id: 'helmet_t3', slot: 'helmet', tier: 3,
    name: 'Тактический шлем FAST', icon: '🪖',
    protection: 38, weight: 1.0, price: 5000,
    desc: 'Лёгкий и надёжный. Спецназовский стандарт.',
  },
  helmet_t4: {
    id: 'helmet_t4', slot: 'helmet', tier: 4,
    name: 'Шлем PASGT Tier IV', icon: '🪖',
    protection: 55, weight: 1.6, price: 12000,
    desc: 'Тяжёлая защита. Держит винтовочные пули.',
  },
  helmet_t5: {
    id: 'helmet_t5', slot: 'helmet', tier: 5,
    name: '[ЗАГЛУШКА Т5 Шлем]', icon: '🪖',
    protection: 70, weight: 1.8, price: 28000,
    desc: 'Задел на будущее.', _inactive: true,
  },
  helmet_t6: {
    id: 'helmet_t6', slot: 'helmet', tier: 6,
    name: '[ЗАГЛУШКА Т6 Шлем]', icon: '🪖',
    protection: 90, weight: 2.0, price: 55000,
    desc: 'Задел на будущее.', _inactive: true,
  },

  // === БРОНЕЖИЛЕТЫ ===
  vest_t1: {
    id: 'vest_t1', slot: 'vest', tier: 1,
    name: 'Мягкий бронежилет', icon: '🦺',
    protection: 20, weight: 3.0, price: 1000,
    desc: 'Держит пистолетные пули. Не защищает от автоматов.',
  },
  vest_t2: {
    id: 'vest_t2', slot: 'vest', tier: 2,
    name: 'Бронежилет 2-го класса', icon: '🦺',
    protection: 35, weight: 4.5, price: 3000,
    desc: 'Армейский стандарт. Держит дробь и пистолетный огонь.',
  },
  vest_t3: {
    id: 'vest_t3', slot: 'vest', tier: 3,
    name: 'Плитоноска Т-III', icon: '🦺',
    protection: 52, weight: 6.0, price: 7000,
    desc: 'Керамические пластины. Держит большинство автоматов.',
  },
  vest_t4: {
    id: 'vest_t4', slot: 'vest', tier: 4,
    name: 'Плитоноска Т-IV', icon: '🛡️',
    protection: 72, weight: 8.5, price: 16000,
    desc: 'Стальные пластины. Серьёзная защита от винтовок.',
  },
  vest_t5: {
    id: 'vest_t5', slot: 'vest', tier: 5,
    name: '[ЗАГЛУШКА Т5 Жилет]', icon: '🛡️',
    protection: 90, weight: 9.0, price: 35000,
    desc: 'Задел на будущее.', _inactive: true,
  },
  vest_t6: {
    id: 'vest_t6', slot: 'vest', tier: 6,
    name: '[ЗАГЛУШКА Т6 Жилет]', icon: '🛡️',
    protection: 115, weight: 10.0, price: 70000,
    desc: 'Задел на будущее.', _inactive: true,
  },

  // === ТАКТИЧЕСКИЕ ПЕРЧАТКИ ===
  gloves_t1: {
    id: 'gloves_t1', slot: 'gloves', tier: 1,
    name: 'Тканевые перчатки', icon: '🧤',
    accuracyBonus: 0.03, weight: 0.1, price: 300,
    desc: '+3% к точности. Лучше голых рук.',
  },
  gloves_t2: {
    id: 'gloves_t2', slot: 'gloves', tier: 2,
    name: 'Кожаные перчатки', icon: '🧤',
    accuracyBonus: 0.06, weight: 0.15, price: 900,
    desc: '+6% к точности.',
  },
  gloves_t3: {
    id: 'gloves_t3', slot: 'gloves', tier: 3,
    name: 'Тактические перчатки', icon: '🥊',
    accuracyBonus: 0.10, weight: 0.20, price: 2500,
    desc: '+10% к точности. Спецназовский стандарт.',
  },
  gloves_t4: {
    id: 'gloves_t4', slot: 'gloves', tier: 4,
    name: 'Перчатки снайпера', icon: '🥊',
    accuracyBonus: 0.15, weight: 0.25, price: 7000,
    desc: '+15% к точности. Прецизионный контроль отдачи.',
  },
  gloves_t5: {
    id: 'gloves_t5', slot: 'gloves', tier: 5,
    name: '[ЗАГЛУШКА Т5 Перчатки]', icon: '🥊',
    accuracyBonus: 0.20, weight: 0.28, price: 18000,
    desc: 'Задел на будущее.', _inactive: true,
  },
  gloves_t6: {
    id: 'gloves_t6', slot: 'gloves', tier: 6,
    name: '[ЗАГЛУШКА Т6 Перчатки]', icon: '🥊',
    accuracyBonus: 0.26, weight: 0.30, price: 38000,
    desc: 'Задел на будущее.', _inactive: true,
  },

  // === РАЗГРУЗКИ ===
  // magSlots — кол-во доп. магазинов которые можно взять
  // medSlots — кол-во аптечек которые можно взять
  rig_t1: {
    id: 'rig_t1', slot: 'rig', tier: 1,
    name: 'Поясной подсумок', icon: '👜',
    magSlots: 2, medSlots: 1, weight: 0.5, price: 600,
    desc: '2 доп. магазина, 1 аптечка.',
  },
  rig_t2: {
    id: 'rig_t2', slot: 'rig', tier: 2,
    name: 'Нагрудная разгрузка', icon: '🎽',
    magSlots: 4, medSlots: 2, weight: 1.0, price: 1800,
    desc: '4 доп. магазина, 2 аптечки.',
  },
  rig_t3: {
    id: 'rig_t3', slot: 'rig', tier: 3,
    name: 'Тактическая разгрузка', icon: '🎽',
    magSlots: 6, medSlots: 3, weight: 1.5, price: 4500,
    desc: '6 доп. магазинов, 3 аптечки.',
  },
  rig_t4: {
    id: 'rig_t4', slot: 'rig', tier: 4,
    name: 'Оператор-Rig', icon: '🦸',
    magSlots: 8, medSlots: 4, weight: 2.0, price: 11000,
    desc: '8 доп. магазинов, 4 аптечки. Максимальная огневая мощь.',
  },
  rig_t5: {
    id: 'rig_t5', slot: 'rig', tier: 5,
    name: '[ЗАГЛУШКА Т5 Разгрузка]', icon: '🦸',
    magSlots: 10, medSlots: 5, weight: 2.3, price: 25000,
    desc: 'Задел на будущее.', _inactive: true,
  },
  rig_t6: {
    id: 'rig_t6', slot: 'rig', tier: 6,
    name: '[ЗАГЛУШКА Т6 Разгрузка]', icon: '🦸',
    magSlots: 12, medSlots: 6, weight: 2.5, price: 50000,
    desc: 'Задел на будущее.', _inactive: true,
  },

  // === РЮКЗАКИ ===
  // carryWeight — сколько кг можно нести (не включая то что надето)
  backpack_t1: {
    id: 'backpack_t1', slot: 'backpack', tier: 1,
    name: 'Школьный рюкзак', icon: '🎒',
    carryWeight: 5, weight: 0.5, price: 400,
    desc: '5 кг вместимость. Немного, но лучше чем ничего.',
  },
  backpack_t2: {
    id: 'backpack_t2', slot: 'backpack', tier: 2,
    name: 'Туристический рюкзак', icon: '🎒',
    carryWeight: 10, weight: 1.0, price: 1200,
    desc: '10 кг вместимость.',
  },
  backpack_t3: {
    id: 'backpack_t3', slot: 'backpack', tier: 3,
    name: 'Тактический рюкзак', icon: '🎒',
    carryWeight: 18, weight: 1.5, price: 3500,
    desc: '18 кг. Основной рейдовый рюкзак.',
  },
  backpack_t4: {
    id: 'backpack_t4', slot: 'backpack', tier: 4,
    name: 'Рюкзак ALICE', icon: '🎒',
    carryWeight: 28, weight: 2.0, price: 9000,
    desc: '28 кг. Армейский. Унесёшь почти всё.',
  },
  backpack_t5: {
    id: 'backpack_t5', slot: 'backpack', tier: 5,
    name: '[ЗАГЛУШКА Т5 Рюкзак]', icon: '🎒',
    carryWeight: 40, weight: 2.5, price: 22000,
    desc: 'Задел на будущее.', _inactive: true,
  },
  backpack_t6: {
    id: 'backpack_t6', slot: 'backpack', tier: 6,
    name: '[ЗАГЛУШКА Т6 Рюкзак]', icon: '🎒',
    carryWeight: 55, weight: 3.0, price: 45000,
    desc: 'Задел на будущее.', _inactive: true,
  },
};

// ============================================================
// АПТЕЧКИ
// healAmount     — сколько HP восстанавливает
// healsLimb      — лечит ли повреждённые конечности
// weight         — вес
// ============================================================

const MEDKITS = {
  bandage: {
    id: 'bandage', name: 'Бинт', icon: '🩹',
    healAmount: 15, healsLimb: false,
    weight: 0.1, price: 150,
    desc: 'Останавливает кровотечение. +15 HP.',
  },
  medkit_small: {
    id: 'medkit_small', name: 'Аптечка', icon: '🩺',
    healAmount: 35, healsLimb: false,
    weight: 0.5, price: 500,
    desc: 'Базовая аптечка. +35 HP.',
  },
  medkit_large: {
    id: 'medkit_large', name: 'Полевая аптечка', icon: '🏥',
    healAmount: 70, healsLimb: true,
    weight: 1.0, price: 1500,
    desc: '+70 HP и восстанавливает одну повреждённую конечность.',
  },
  surv_kit: {
    id: 'surv_kit', name: 'Набор выживания', icon: '💊',
    healAmount: 100, healsLimb: true,
    weight: 1.5, price: 4000,
    desc: 'Полное восстановление HP и всех конечностей.',
  },
};

// ============================================================
// КЛЮЧИ ОТ СЕЙФОВ
// ============================================================

const SAFE_KEYS = {
  key_common: {
    id: 'key_common', name: 'Ржавый ключ', icon: '🗝️',
    weight: 0.05, price: 500,
    desc: 'Открывает обычные сейфы на карте.',
  },
  key_rare: {
    id: 'key_rare', name: 'Бронированный ключ', icon: '🔑',
    weight: 0.05, price: 2000,
    desc: 'Открывает редкие сейфы. Внутри хорошие вещи.',
  },
  key_elite: {
    id: 'key_elite', name: 'Золотой ключ', icon: '✨',
    weight: 0.05, price: 8000,
    desc: 'Открывает элитные сейфы. Лучший лут на карте.',
  },
};

// ============================================================
// КОНФИГУРАЦИЯ КАРТЫ
// ============================================================

const MAP_CONFIG = {
  width: 20,   // клеток по X
  height: 20,  // клеток по Y

  // Зоны по удалённости от центра (в клетках)
  zones: {
    safe:     { maxDist: 6,  pvpChance: 0.10, lootQuality: 'low',    label: 'Безопасная зона'  },
    mid:      { maxDist: 10, pvpChance: 0.25, lootQuality: 'medium', label: 'Нейтральная зона' },
    hot:      { maxDist: 99, pvpChance: 0.45, lootQuality: 'high',   label: 'Горячая зона'     },
  },

  // Фиксированные выходы (координаты на краях карты)
  extractionPoints: [
    { id: 'exit_nw', x: 0,  y: 0,  name: 'Северный выход',   icon: '🚁' },
    { id: 'exit_ne', x: 19, y: 0,  name: 'Восточный выход',  icon: '🚁' },
    { id: 'exit_sw', x: 0,  y: 19, name: 'Западный выход',   icon: '🚁' },
    { id: 'exit_se', x: 19, y: 19, name: 'Южный выход',      icon: '🚁' },
  ],

  // Шансы спауна объектов на клетке при генерации карты
  cellSpawnChances: {
    loot:  0.40,  // шанс что на клетке есть лут
    safe:  0.08,  // шанс что на клетке есть сейф
    empty: 0.52,  // пустая клетка
  },

  // Шансы редкости сейфа
  safeRarity: {
    common: 0.60,
    rare:   0.30,
    elite:  0.10,
  },
};

// ============================================================
// ПОРОГИ КОНЕЧНОСТЕЙ
// При падении HP ниже порога — статус активируется
// ============================================================

const LIMB_THRESHOLDS = {
  arms: {
    threshold: 0.70,  // < 70% HP
    label: 'Руки повреждены',
    icon: '🤕',
    effect: 'accuracyPenalty',
    penaltyValue: 0.20,  // -20% к точности
    desc: 'Повреждены руки. −20% к точности.',
  },
  legs: {
    threshold: 0.50,  // < 50% HP
    label: 'Ноги повреждены',
    icon: '🦽',
    effect: 'tacticsBlocked',
    desc: 'Повреждены ноги. Агрессивные тактики недоступны.',
  },
  chest: {
    threshold: 0.30,  // < 30% HP
    label: 'Грудь пробита',
    icon: '🩸',
    effect: 'bleedPerCell',
    penaltyValue: 4,   // 4 HP при переходе на каждую клетку
    desc: 'Пробита грудь. −4 HP при каждом переходе на клетку.',
  },
};

// ============================================================
// БОЕВЫЕ ТАКТИКИ (действия за раунд)
// category: aggressive | balanced | defensive
// Тактики с requiresLegs: false — заблокированы при ранении ног
// ============================================================

const COMBAT_TACTICS = {
  cover_fire: {
    id: 'cover_fire',
    name: 'За укрытие',
    icon: '🧱',
    category: 'balanced',
    requiresLegs: false,
    shotsModifier: { min: 3, max: 5 },
    defenseBonus: 0.30,
    desc: 'Укрыться и сделать 3–5 выстрелов. +30% защита в этом раунде.',
  },
  suppression: {
    id: 'suppression',
    name: 'Шквальный огонь',
    icon: '🔥',
    category: 'aggressive',
    requiresLegs: false,
    shotsModifier: { min: 7, max: 10 },
    defenseBonus: 0,
    accuracyPenalty: 0.10,
    desc: 'Выпустить 7–10 пуль. −10% точности из-за спешки.',
  },
  aimed_shot: {
    id: 'aimed_shot',
    name: 'Прицельный выстрел',
    icon: '🎯',
    category: 'balanced',
    requiresLegs: false,
    shotsModifier: { min: 1, max: 2 },
    accuracyBonus: 0.20,
    desc: '1–2 выстрела с большой точностью. +20% к попаданию.',
  },
  rush: {
    id: 'rush',
    name: 'Рывок',
    icon: '💨',
    category: 'aggressive',
    requiresLegs: true,  // заблокировано при ранении ног
    shotsModifier: { min: 2, max: 4 },
    defenseBonus: -0.20,
    damageBonus: 0.20,
    desc: 'Рвануть к противнику. −20% защита, +20% урон.',
  },
  full_defense: {
    id: 'full_defense',
    name: 'Глухая оборона',
    icon: '🛡️',
    category: 'defensive',
    requiresLegs: false,
    shotsModifier: { min: 0, max: 0 },
    defenseBonus: 0.60,
    desc: 'Не стрелять, максимальная защита. +60% к защите.',
  },
  reload: {
    id: 'reload',
    name: 'Перезарядка',
    icon: '🔄',
    category: 'defensive',
    requiresLegs: false,
    shotsModifier: { min: 0, max: 0 },
    defenseBonus: 0.30,
    reloadMag: true,
    desc: 'Поменять магазин. +30% защита, выстрелов нет.',
  },
  retreat: {
    id: 'retreat',
    name: 'Отход',
    icon: '🏃',
    category: 'defensive',
    requiresLegs: true,  // заблокировано при ранении ног
    shotsModifier: { min: 1, max: 2 },
    defenseBonus: 0.40,
    fleeChance: 0.40,
    desc: 'Попытаться выйти из боя. 40% шанс побега.',
  },
};

// ============================================================
// ЗОНЫ ПОПАДАНИЯ
// Вес — относительная вероятность попадания в эту зону
// ============================================================

const HIT_ZONES = {
  head:  { name: 'Голова',  icon: '💀', weight: 0.10, damageMultiplier: 2.5, isLethal: true  },
  chest: { name: 'Грудь',   icon: '🫁', weight: 0.40, damageMultiplier: 1.0, isLethal: false },
  arms:  { name: 'Руки',    icon: '💪', weight: 0.25, damageMultiplier: 0.7, isLethal: false },
  legs:  { name: 'Ноги',    icon: '🦵', weight: 0.25, damageMultiplier: 0.7, isLethal: false },
};

// ============================================================
// ЛИДЕРБОРД — эмуляция игроков
// ============================================================

const LEADERBOARD_NAMES = [
  'GhostOperator', 'XxShadowRunnerxX', 'Tarkov_Rat', 'BulletFarmer99',
  'Silent_Loot', 'NightStalker228', 'ChadExtractor', 'LonerInTheZone',
  'QuietProfessional', 'GearFearNone', 'RaidOrDie', 'PackRat_Pro',
  'FullSendRaid', 'Scav_Hunter', 'DarkZone_King', 'InsuredGear',
  'OneManArmy', 'CashAndCarry', 'LegendaryLoOt', 'WipeKing777',
  'ZeroFearZone', 'BloodMoney_RU', 'BlackMarket_Boss', 'SilentProfit',
  'GoldenBackpack', 'RiskyBusiness', 'DeadDropDealer', 'ExfilKing',
  'NightRaider404', 'StashGoals', 'Operator_Zero', 'PointManPro',
  'ClearanceLevel5', 'UnsafeSafe', 'ChokepointGod', 'BossHunter',
  'FleaMarket_Lord', 'ContrabandKing', 'SectorClear', 'DeadReckon',
  'SniperNest', 'ThermalScope', 'BloodTrail', 'SupplyRun_Pro',
  'HeadshotOnly', 'ArmorPiercer', 'HotZoneHero', 'MapControl',
  'BreachAndClear', 'AlphaExtract',
];

// ============================================================
// ТОРГОВЦЫ (задел — наполнять будем позже)
// ============================================================

const TRADERS = {
  gunsmith: {
    id: 'gunsmith',
    name: 'Оружейник',
    icon: '🔧',
    nickname: 'Дядя Вася',
    desc: 'Торгует оружием, патронами и модулями. Любит чистое оружие.',
    inventory: [], // заполняется позже
  },
  junk_dealer: {
    id: 'junk_dealer',
    name: 'Барахольщик',
    icon: '🗃️',
    nickname: 'Крыса',
    desc: 'Торгует экипировкой, аптечками и ключами. Берёт всё.',
    inventory: [], // заполняется позже
  },
  black_market: {
    id: 'black_market',
    name: 'Чёрный рынок',
    icon: '🕶️',
    nickname: '???',
    desc: 'Анонимные лоты. Цены меняются. Никто не знает кто продаёт.',
    listings: [], // динамические лоты — заполняется позже
  },
};

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ DATA
// ============================================================

// Получить все активные предметы по слоту экипировки
function getEquipmentBySlot(slot) {
  return Object.values(EQUIPMENT).filter(e => e.slot === slot && !e._inactive);
}

// Получить все активные оружия по типу
function getWeaponsByType(type) {
  return Object.values(WEAPONS).filter(w => w.type === type && !w._inactive);
}

// Получить все активные патроны
function getActiveAmmo() {
  return Object.values(AMMO).filter(a => !a._inactive);
}

// Получить все активные тиры
function getActiveTiers() {
  return Object.entries(TIERS).filter(([, t]) => t.isActive).map(([k, t]) => ({ ...t, num: parseInt(k) }));
}

// Цвет тира по номеру
function getTierColor(tierNum) {
  return TIERS[tierNum] ? TIERS[tierNum].color : '#94a3b8';
}

// Рассчитать суммарный вес загрузки (экипировка + оружие + лут)
function calcTotalWeight(items) {
  return items.reduce((sum, item) => sum + (item.weight || 0), 0);
}

// Получить зону карты по расстоянию от центра
function getMapZone(x, y) {
  const cx = Math.floor(MAP_CONFIG.width / 2);
  const cy = Math.floor(MAP_CONFIG.height / 2);
  const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
  if (dist <= MAP_CONFIG.zones.safe.maxDist) return { ...MAP_CONFIG.zones.safe, id: 'safe' };
  if (dist <= MAP_CONFIG.zones.mid.maxDist)  return { ...MAP_CONFIG.zones.mid,  id: 'mid'  };
  return { ...MAP_CONFIG.zones.hot, id: 'hot' };
}
