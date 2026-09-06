// ============================================================
// CORE DATA
// Имя игрока, ников ботов, gameData (модель сохранения) + загрузка из localStorage, классы, справочники предметов.
// ============================================================

// Безопасная загрузка Telegram API
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg && tg.expand) tg.expand();
const REAL_PLAYER_NAME = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user.first_name : "Вы";

// Возвращает актуальный ник игрока (кастомный или из Telegram)
function getPlayerName() {
  return (gameData && gameData.nickname) ? gameData.nickname : REAL_PLAYER_NAME;
}

const BOT_NAMES = ["Nagibator228", "0xVortex", "SlavaCritam", "Gromila", "xXShadowXx", "DedNaRage", "Zerkon", "Blysk", "Krovnik", "HealPlzBro", "TankBezMozgov", "1337Reaper", "Morozko", "CtrlAltDefeat", "SibirWolf", "TryHarder", "VanyokPro", "NoScope404", "PyatkaCrit", "KRAKEN99", "BabkaNaBafoh", "UltraDPS", "ZloyKot", "AfkLegend", "RushB", "ShizaMage", "777Storm", "OrelBezKryil", "DarkKolya", "MetaSlave", "VodkaBuff", "Rekrut", "Xx_NeKrO_xX", "Leshiy", "1HPHero", "ToxicRain", "BorodaPlay", "ImbaOrNot", "DedInside", "BaikalBlade", "NerfMePls", "Zhivoy", "404Skill", "GigaChadRU", "Molotok", "SosedSverhu", "KritVSpinu", "Shadow228", "PupsikWar", "HardbassGod"];

// БАЗА ДАННЫХ И МИГРАЦИЯ
let gameData = {
  lp: 0, imperials: 0, inventory: [], maxInventory: 6, hugeChestPity: 0, currentClass: 'warrior',
  nextItemId: 0,
  leaderboard: [],
  equip: { warrior: { head: null, body: null, arms: null, legs: null } },
  keys: {},
  dungeonProgress: {},
  pouch: { slots: 0, items: [] },
  dailyWins: 0,
  dailyGiftClaimed: false,
  lastDailyDate: '',
  lunarStones: 0,
  usedCodes: [],
  titles: {},        // { classId: { unlocked: ['uncommon',...], active: 'epic' } }
  gachaSpinCount: {}, // { gachaId: N } — счётчик прокруток для гаранта
  botBoostWins: {},  // { botIndex: оставшихся_побед } — буст ботов упавших ниже 6500
  // v0.5 — косметика
  entryEffect: null,
  cardFrame: null,
  mythicTitles: {},
  mythicGachaSpinCount: {},
  unlockedFrames: [],
  unlockedEffects: [],
  unlockedVictoryEffects: [],
  activeVictoryEffect: null,
  nickname: null,
  nicknameChanged: false
};

try {
  let saved = JSON.parse(localStorage.getItem('middleEarthData'));
  if (saved && typeof saved === 'object') {
    gameData.lp = saved.lp || 0; gameData.imperials = saved.imperials || 0;
    gameData.inventory = saved.inventory || []; gameData.maxInventory = saved.maxInventory || 6;
    gameData.hugeChestPity = saved.hugeChestPity || 0; gameData.currentClass = saved.currentClass || 'warrior';
    gameData.nextItemId = saved.nextItemId || 0;
    if (saved.equip && saved.equip.warrior) { gameData.equip = saved.equip; }
    else if (saved.equip) { gameData.equip.warrior = saved.equip; }
    if (saved.leaderboard && saved.leaderboard.length === 50) gameData.leaderboard = saved.leaderboard;
    gameData.keys = saved.keys || {};
    gameData.dungeonProgress = saved.dungeonProgress || {};
    gameData.pouch = saved.pouch || { slots: 0, items: [] };
    gameData.dailyWins = saved.dailyWins || 0;
    gameData.dailyGiftClaimed = saved.dailyGiftClaimed || false;
    gameData.lastDailyDate = saved.lastDailyDate || '';
    gameData.lunarStones = saved.lunarStones || 0;
    gameData.usedCodes = saved.usedCodes || [];
    gameData.titles = saved.titles || {};
    gameData.gachaSpinCount = saved.gachaSpinCount || {};
    gameData.botBoostWins = saved.botBoostWins || {};
    // v0.5 миграция
    gameData.entryEffect = saved.entryEffect || null;
    gameData.cardFrame = saved.cardFrame || null;
    gameData.mythicTitles = saved.mythicTitles || {};
    gameData.mythicGachaSpinCount = saved.mythicGachaSpinCount || {};
    gameData.unlockedFrames = saved.unlockedFrames || [];
    gameData.unlockedEffects = saved.unlockedEffects || [];
    gameData.unlockedVictoryEffects = saved.unlockedVictoryEffects || [];
    gameData.activeVictoryEffect = saved.activeVictoryEffect || null;
    gameData.nickname = saved.nickname || null;
    gameData.nicknameChanged = saved.nicknameChanged || false;
  }
} catch (e) {}

const CLASSES = {
  warrior: { name: "Воин", activeName: "На вылет", reqType: "dmgDealt", reqAmt: 5, p1: "Берсерк", p2: "Боевой раж" },
  assassin: { name: "Убийца", activeName: "Двойной удар", reqType: "dmgDealt", reqAmt: 4, p1: "Инстинкт выживания", p2: "Преследование" },
  guardian: { name: "Страж", activeName: "Оплот", reqType: "dmgBlocked", reqAmt: 5, p1: "Контратака", p2: "Возмездие" },
  priest: { name: "Жрец", activeName: "Сила жизни", reqType: "healed", reqAmt: 3, p1: "Молитва", p2: "Обжигающий свет" },
  darkknight: { name: "Тёмный Рыцарь", activeName: "Тёмная ярость", reqType: "healed", reqAmt: 3, p1: "Кураж", p2: "Бессмертие" }
};

const SLOT_NAMES = { head: "Шлем", body: "Броня", arms: "Перчатки", legs: "Сапоги" };
const RARITY_NAMES = { common: "Обычный", uncommon: "Необычный", rare: "Редкий", epic: "Эпический" };
const SELL_PRICES = { common: 10, uncommon: 50, rare: 200, epic: 1000 };
const POTIONS = {
  small:  { id: 'small',  name: '🧪 Малое зелье',   heal: 8,  cost: 350 },
  medium: { id: 'medium', name: '🧪 Среднее зелье',  heal: 13, cost: 450 },
  large:  { id: 'large',  name: '🧪 Большое зелье',  heal: 20, cost: 650 }
};
