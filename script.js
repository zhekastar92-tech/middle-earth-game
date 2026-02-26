// Безопасная загрузка Telegram API
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg && tg.expand) tg.expand();
const REAL_PLAYER_NAME = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user.first_name : "Вы";

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
  dailyWins: 0
  dailyGiftClaimed: false
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

// Миграция экипировки для новых классов
Object.keys(CLASSES).forEach(cls => {
  if (!gameData.equip[cls]) {
    gameData.equip[cls] = { head: null, body: null, arms: null, legs: null };
  }
});

// ============================================================
// ПОДЗЕМЕЛЬЯ
// ============================================================

const DUNGEONS = {
  mansion: {
    id: 'mansion',
    name: 'Заброшенная усадьба',
    icon: '🏚️',
    dungeonClass: 'dungeon-mansion',
    keyId: 'dusty_key',
    keyName: '🗝️ Пыльный ключ',
    keyShopPrice: 2000,
    keyArenaDrops: [
      { minLp: 1001, maxLp: 1800, chance: 0.05 },
      { minLp: 1801, maxLp: 3000, chance: 0.07 },
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
      bonusChestChance: 0.10,       // 10% на сундук
      bonusChestEpicChance: 0.10,   // из них 10% огромный, 90% большой
      bonusUniqueEpicChance: 0.005  // 0.5% эпик с уником
    }
  }
};

// Мобы подземелий
const DUNGEON_MOBS = {
  wanderer: {
    id: 'wanderer',
    name: 'Весёлый скиталец',
    icon: '👻',
    tier: 'normal',
    hp: 20,
    attackMin: 1, attackMax: 3,
    blockMin: 1, blockMax: 2,
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
    blockMin: 1, blockMax: 2,
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
  blockMin: 1, blockMax: 3,
  abilities: ['fate', 'submit', 'notover'],
  lootDrops: null
},
};

// ============================================================
// СОСТОЯНИЕ ПОДЗЕМЕЛЬЯ
// ============================================================

let dungeonState = null;

function initMob(mobId) {
  let template = DUNGEON_MOBS[mobId];
  let mob = {
    isMob: true,
    mobId: mobId,
    name: template.name,
    icon: template.icon,
    tier: template.tier,
    hp: template.hp,
    maxHp: template.hp,
    attackMin: template.attackMin,
    attackMax: template.attackMax,
    blockMin: template.blockMin,
    blockMax: template.blockMax,
    abilities: [...template.abilities],
    lootDrops: template.lootDrops,
    // Состояния умений
    diseaseActive: false,       // Наблюдатель: блокирует лечение
    diseaseTurnsLeft: 0,
    diseaseHpThreshold: template.hp - 10, // первый триггер на -10 хп
    fateActive: false,          // Сильвия: блокирует блок игрока
    fateTurnsLeft: 0,
    fateNoHitTurns: 0,          // счётчик ходов без урона
    submitActive: false,        // Сильвия: x2 урон
    submitTurnsLeft: 0,
    notoverUsed: false,         // Сильвия: лечение одноразовое
    notoverHotLeft: 0,          // HoT Сильвии
    stats: { dmgDealt: 0, dmgBlocked: 0, healed: 0 },
    // Заглушки для совместимости с боевыми функциями
    classId: null, className: template.name, lp: 0,
    skillReady: false, hotTurnsLeft: 0,
    usedInstinct: false, usedPrayer: false, poisoned: false,
    pursuitDmg: 0, retBlocks: 0, retBonus: 0,
    furyTurnsLeft: 0, immortalTurns: 0, usedImmortality: false,
    canHeal: true, courageThresholdDown: false, immortalTurnActive: false,
    eq: { head: null, body: null, arms: null, legs: null },
    eqP: { healOnce: 0, blockPierce: 0, strikes: 0, dmgB: 0, blockB: 0, healB: 0, dodge: 0, ignore: 0 }
  };
  return mob;
}

function startDungeon(dungeonId) {
  let dungeon = DUNGEONS[dungeonId];
  let keyCount = gameData.keys[dungeon.keyId] || 0;
  if (keyCount <= 0) {
    alert(`Нужен ${dungeon.keyName} для входа!`);
    return;
  }
  // Списываем ключ
  gameData.keys[dungeon.keyId] = keyCount - 1;
  saveData();

  dungeonState = {
    dungeonId: dungeonId,
    floorIndex: 0,
    enemyIndex: 0,
    playerHp: null, // будет задан при initChar
    mode: 'dungeon'
  };

  // Инициализируем игрока
  player = initChar(gameData.currentClass, false, gameData.lp);
  dungeonState.playerHp = player.hp;

  startDungeonFloor();
}

function startDungeonFloor() {
  let dungeon = DUNGEONS[dungeonState.dungeonId];
  let floor = dungeon.floors[dungeonState.floorIndex];

  // Строим очередь врагов этажа
  dungeonState.enemyQueue = floor.enemies.map(id => initMob(id));
  dungeonState.enemyIndex = 0;

  // Восстанавливаем HP игрока из сохранённого состояния
  player.hp = dungeonState.playerHp;

  startDungeonFight();
}

function startDungeonFight() {
  let dungeon = DUNGEONS[dungeonState.dungeonId];
  let floor = dungeon.floors[dungeonState.floorIndex];
  let floorNum = dungeonState.floorIndex + 1;
  let totalFloors = dungeon.floors.length;

  // Достаём следующего врага из очереди
  bot = dungeonState.enemyQueue[dungeonState.enemyIndex];

  gameIsOver = false; turnCount = 1;
  currentBotName = bot.name;

  let currentArena = getArena(gameData.lp);
  document.getElementById("battle-arena").className = "arena " + dungeon.dungeonClass;
  document.getElementById("player-card").className = "character " + getRank(player.lp).borderClass;
  document.getElementById("bot-card").className = "character border-mob-" + bot.tier;

  let enemyNum = dungeonState.enemyIndex + 1;
  let enemyTotal = dungeonState.enemyQueue.length;
  document.getElementById("combat-log").innerHTML = `<div class='log-entry text-skill'>🏚️ ${dungeon.name} — Этаж ${floorNum}/${totalFloors}. Враг ${enemyNum}/${enemyTotal}: ${bot.icon} ${bot.name}</div>`;

  document.getElementById("btn-return").style.display = "none";
  updateScreen();
  switchTab(null, "tab-battle");
  document.getElementById("main-screen").style.display = "none";
  document.getElementById("battle-screen").style.display = "block";
  startTurnTimer();
}

function rollDungeonMobAction(mob) {
  let atk = mob.attackMin + Math.floor(Math.random() * (mob.attackMax - mob.attackMin + 1));
  let blk = mob.blockMin + Math.floor(Math.random() * (mob.blockMax - mob.blockMin + 1));

  // Умение "Подчинись мне!" — x2 атака
  if (mob.submitActive && mob.submitTurnsLeft > 0) {
    atk *= 2;
  }

  return { atk, blk };
}

// Проверка триггеров умений моба ДО хода
function checkMobAbilitiesPreTurn(mob, playerLastDmg) {
  let msg = "";

  // === НАБЛЮДАТЕЛЬ: Болезнь ===
  if (mob.abilities.includes('disease')) {
    let threshold = mob.maxHp - 10;
    // Проверяем порог (каждые 10 хп потери)
    while (mob.diseaseHpThreshold > 0 && mob.hp <= mob.diseaseHpThreshold) {
      mob.diseaseHpThreshold -= 10;
      mob.diseaseActive = true;
      mob.diseaseTurnsLeft = 3;
      msg += `<span class="text-dmg">🦠 Болезнь! ${mob.name} блокирует всё лечение на 3 хода!</span><br>`;
    }
  }

  // === ЛЕДИ СИЛЬВИЯ: Прими свою судьбу ===
  if (mob.abilities.includes('fate') && !mob.fateActive) {
    mob.fateNoHitTurns++;
    if (mob.fateNoHitTurns >= 3) {
      mob.fateActive = true;
      mob.fateTurnsLeft = 3;
      mob.fateNoHitTurns = 0;
      msg += `<span class="text-dmg">😫 Леди Сильвия произносит: «Прими свою судьбу!» — Вы не можете блокировать 3 хода!</span><br>`;
    }
  }

  // === ЛЕДИ СИЛЬВИЯ: Подчинись мне! ===
  if (mob.abilities.includes('submit') && !mob.submitActive) {
    if (playerLastDmg >= 4) {
      mob.submitActive = true;
      mob.submitTurnsLeft = 2;
      msg += `<span class="text-dmg">😡 Леди Сильвия кричит: «Подчинись мне!» — Её урон x2 на 2 хода!</span><br>`;
    }
  }

  // === ЛЕДИ СИЛЬВИЯ: Это ещё не конец ===
  if (mob.abilities.includes('notover') && !mob.notoverUsed && mob.hp <= 15 && mob.hp > 0) {
  mob.notoverUsed = true;
  mob.hp = Math.min(mob.maxHp, mob.hp + 3);
  mob.notoverHotLeft = 2;
  msg += `<span class="text-heal">💜 Леди Сильвия шепчет: «Это ещё не конец...» — +3 ХП!</span><br>`;
  }

  return msg;
}

// Тик эффектов моба (в конце хода)
function tickMobEffects(mob, playerDmgThisTurn) {
  let msg = "";

  // Болезнь — тикаем таймер
  if (mob.diseaseActive) {
    mob.diseaseTurnsLeft--;
    if (mob.diseaseTurnsLeft <= 0) {
      mob.diseaseActive = false;
      msg += `<span class="text-info">🦠 Болезнь прошла — лечение восстановлено.</span><br>`;
    }
  }

  // Прими судьбу — тикаем таймер
  if (mob.fateActive) {
    mob.fateTurnsLeft--;
    if (mob.fateTurnsLeft <= 0) {
      mob.fateActive = false;
      mob.fateNoHitTurns = 0; // сброс счётчика для нового цикла
      msg += `<span class="text-info">😶 Эффект «Прими судьбу» закончился.</span><br>`;
    }
  }

  // Подчинись — тикаем таймер
  if (mob.submitActive) {
    mob.submitTurnsLeft--;
    if (mob.submitTurnsLeft <= 0) {
      mob.submitActive = false;
      msg += `<span class="text-info">😡 Эффект «Подчинись мне» закончился.</span><br>`;
    }
  }

  // Сильвия: HoT "Это ещё не конец"
  if (mob.notoverHotLeft > 0) {
  mob.hp = Math.min(mob.maxHp, mob.hp + 2);
  mob.notoverHotLeft--;
  msg += `<span class="text-heal">💜 Воля Сильвии: +2 ХП (осталось ${mob.notoverHotLeft} хода)</span><br>`;
  }

  // Сильвия: если нанесла урон в этот ход — сбрасываем счётчик безурона
  if (mob.abilities.includes('fate') && playerDmgThisTurn > 0 && !mob.fateActive) {
    mob.fateNoHitTurns = 0;
  }

  return msg;
}

// ============================================================
// БАЗА ДАННЫХ И РАНГИ
// ============================================================

function migrateItemNames() {
  const updateName = (item) => {
    if (!item) return;
    let oldNamePattern = `${RARITY_NAMES[item.rarity]} ${SLOT_NAMES[item.slot]}`;
    if (item.name === oldNamePattern) {
      item.name = generateItemName(item.rarity, item.slot, !!item.perk, !!item.unique, false);
    }
  };
  if (gameData.inventory) gameData.inventory.forEach(updateName);
  if (gameData.equip) {
    Object.values(gameData.equip).forEach(classEq => {
      if (classEq) { updateName(classEq.head); updateName(classEq.body); updateName(classEq.arms); updateName(classEq.legs); }
    });
  }
}
migrateItemNames();

let needsLbReset = !gameData.leaderboard || gameData.leaderboard.length === 0 || gameData.leaderboard[0].lp < 5000;
if (needsLbReset) {
  gameData.leaderboard = BOT_NAMES.map(name => ({ name: name, lp: Math.floor(Math.random() * 1001) + 7000 }));
}

function saveData() { localStorage.setItem('middleEarthData', JSON.stringify(gameData)); }

const RANKS = [
  { name: "Железо", icon: "🔘", maxLp: 300, borderClass: "border-iron", textClass: "", iconClass: "" },
  { name: "Бронза", icon: "🟤", maxLp: 600, borderClass: "border-bronze", textClass: "", iconClass: "" },
  { name: "Серебро", icon: "⚪", maxLp: 1000, borderClass: "border-silver", textClass: "", iconClass: "" },
  { name: "Золото", icon: "🟡", maxLp: 1400, borderClass: "border-gold", textClass: "", iconClass: "" },
  { name: "Изумруд", icon: "❇️", maxLp: 1800, borderClass: "border-emerald", textClass: "text-emerald", iconClass: "text-emerald" },
  { name: "Алмаз", icon: "💎", maxLp: 2400, borderClass: "border-diamond", textClass: "text-diamond", iconClass: "text-diamond" },
  { name: "Мастер", icon: "⚜️", maxLp: 3000, borderClass: "border-master", textClass: "text-master", iconClass: "text-master" },
  { name: "Грандмастер", icon: "🦅", maxLp: 3800, borderClass: "border-grandmaster", textClass: "text-grandmaster", iconClass: "text-grandmaster" },
  { name: "Владыка", icon: "🔱", maxLp: 5000, borderClass: "border-overlord", textClass: "text-overlord", iconClass: "text-overlord" },
  { name: "Феникс", icon: "🐦‍🔥", maxLp: 99999, borderClass: "border-phoenix", textClass: "text-phoenix", iconClass: "" }
];

const ARENAS = [
  { name: "Каменный круг", icon: "🪨", maxLp: 300, arenaClass: "arena-stone" },
  { name: "Лунный чертог", icon: "🌘", maxLp: 600, arenaClass: "arena-moon" },
  { name: "Солнечное плато", icon: "💥", maxLp: 1000, arenaClass: "arena-sun" },
  { name: "Кристальный пик", icon: "🗻", maxLp: 1800, arenaClass: "arena-crystal" },
  { name: "Чёрные чертоги", icon: "🕋", maxLp: 3000, arenaClass: "arena-black" },
  { name: "Звёздный Олимп", icon: "🌌", maxLp: 99999, arenaClass: "arena-stars" }
];

function getRank(lp) {
  let rank = RANKS.find(r => lp <= r.maxLp) || RANKS[RANKS.length - 1];
  if (rank.name === "Феникс" && gameData.leaderboard && gameData.leaderboard.length >= 50) {
    let botLps = gameData.leaderboard.map(b => b.lp).sort((a, b) => b - a);
    let threshold = botLps[49] - 500;
    if (lp < threshold) return RANKS[RANKS.length - 2];
  }
  return rank;
}

function getArena(lp) { return ARENAS.find(a => lp <= a.maxLp) || ARENAS[ARENAS.length - 1]; }

function getArenaDrops(lp) {
  if (lp <= 300) return { common: 0.10, uncommon: 0.02, rare: 0, epic: 0 };
  if (lp <= 600) return { common: 0.25, uncommon: 0.10, rare: 0.02, epic: 0 };
  if (lp <= 1000) return { common: 0.25, uncommon: 0.20, rare: 0.05, epic: 0.002 };
  if (lp <= 1800) return { common: 0.15, uncommon: 0.25, rare: 0.15, epic: 0.004 };
  if (lp <= 3000) return { common: 0.05, uncommon: 0.15, rare: 0.20, epic: 0.01 };
  return { common: 0, uncommon: 0.05, rare: 0.20, epic: 0.03 };
}

function calculateLpChange(lp, isWin) {
  let min, max;
  if (lp <= 1000) { if (isWin) { min = 20; max = 30; } else { min = 10; max = 15; } }
  else if (lp <= 1800) { if (isWin) { min = 15; max = 20; } else { min = 15; max = 20; } }
  else if (lp <= 3000) { if (isWin) { min = 10; max = 15; } else { min = 15; max = 20; } }
  else { if (isWin) { min = 5; max = 10; } else { min = 15; max = 20; } }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================
// ТАБЫ
// ============================================================

function switchTab(btn, tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  if (btn) btn.classList.add('active');
  else {
    let fallbackBtn = document.querySelector(`[onclick="switchTab(this, '${tabId}')"]`);
    if (fallbackBtn) fallbackBtn.classList.add('active');
  }
  if (tabId === 'tab-battle') renderMainMenu();
  if (tabId === 'tab-hero') updateHeroTab();
  if (tabId === 'tab-bag') updateBagTab();
  if (tabId === 'tab-arenas') renderArenas();
  if (tabId === 'tab-shop') renderShop();
  if (tabId === 'tab-leaderboard') renderLeaderboard();
  if (tabId === 'tab-dungeons') renderDungeons();
}

// ============================================================
// ЛИДЕРБОРД
// ============================================================

function renderLeaderboard() {
  let allPlayers = [...gameData.leaderboard, { name: REAL_PLAYER_NAME, lp: gameData.lp, isPlayer: true }];
  allPlayers.sort((a, b) => b.lp - a.lp);
  let html = ''; let playerRank = -1;
  for (let i = 0; i < allPlayers.length; i++) { if (allPlayers[i].isPlayer) playerRank = i + 1; }
  for (let i = 0; i < 10 && i < allPlayers.length; i++) {
    let p = allPlayers[i];
    let rankIcon = (i === 0) ? '🥇' : (i === 1) ? '🥈' : (i === 2) ? '🥉' : `${i + 1}`;
    let pRank = getRank(p.lp);
    let nameClass = pRank.textClass ? `profile-name ${pRank.textClass}` : `profile-name`;
    let iconHtml = pRank.iconClass ? `<span class="${pRank.iconClass}">${pRank.icon}</span>` : pRank.icon;
    let textHtml = pRank.textClass ? `<span class="${pRank.textClass}">${pRank.name} | ${p.lp} LP</span>` : `${pRank.name} | ${p.lp} LP`;
    let borderStyle = p.isPlayer ? "border: 2px solid #e11d48; background: rgba(225, 29, 72, 0.2); box-shadow: 0 0 15px rgba(225, 29, 72, 0.4);" : "";
    html += `
    <div class="profile-header" style="margin-bottom: 10px; ${borderStyle}">
        <div style="display:flex; align-items:center; gap: 15px;">
            <div style="font-size: 20px; font-weight: 900; color: #fbbf24; width: 30px; text-align: center;">${rankIcon}</div>
            <div style="text-align: left;">
                <div class="${nameClass}">👤 ${p.name}</div>
                <div class="profile-rank">${iconHtml} ${textHtml}</div>
            </div>
        </div>
    </div>`;
  }
  if (playerRank > 10) {
    let displayRank = playerRank;
    if (playerRank === 51) {
      let lowestBotLp = allPlayers[49].lp;
      let gap = lowestBotLp - gameData.lp;
      if (gap > 500) { displayRank = "100+"; }
      else {
        let randomJitter = Math.floor(Math.random() * 4);
        displayRank = 50 + Math.floor(gap / 10) + randomJitter;
        if (displayRank > 100) displayRank = 100;
      }
    }
    let pRank = getRank(gameData.lp);
    let nameClass = pRank.textClass ? `profile-name ${pRank.textClass}` : `profile-name`;
    let iconHtml = pRank.iconClass ? `<span class="${pRank.iconClass}">${pRank.icon}</span>` : pRank.icon;
    let textHtml = pRank.textClass ? `<span class="${pRank.textClass}">${pRank.name} | ${gameData.lp} LP</span>` : `${pRank.name} | ${gameData.lp} LP`;
    html += `<div style="text-align: center; color: #94a3b8; font-weight: bold; margin: 15px 0; font-size: 20px;">...</div>`;
    html += `
    <div class="profile-header" style="margin-bottom: 10px; border: 2px solid #e11d48; background: rgba(225, 29, 72, 0.2); box-shadow: 0 0 15px rgba(225, 29, 72, 0.4);">
        <div style="display:flex; align-items:center; gap: 15px;">
            <div style="font-size: 20px; font-weight: 900; color: #fbbf24; min-width: 30px; text-align: center;">${displayRank}</div>
            <div style="text-align: left;">
                <div class="${nameClass}">👤 ${REAL_PLAYER_NAME}</div>
                <div class="profile-rank">${iconHtml} ${textHtml}</div>
            </div>
        </div>
    </div>`;
  }
  document.getElementById("leaderboard-content").innerHTML = html;
}

function simulateBots() {
  gameData.leaderboard.forEach(b => {
    let isWin = Math.random() < 0.5;
    let change = Math.floor(Math.random() * 6) + 5;
    if (isWin) b.lp += change; else b.lp = Math.max(0, b.lp - change);
  });
}

// ============================================================
// ГЛАВНОЕ МЕНЮ
// ============================================================

function updateMenuProfile() {
  let rank = getRank(gameData.lp);
  let nameClass = rank.textClass ? ` class="profile-name ${rank.textClass}"` : ` class="profile-name"`;
  let iconHtml = rank.iconClass ? `<span class="${rank.iconClass}">${rank.icon}</span>` : rank.icon;
  let textHtml = rank.textClass ? `<span class="${rank.textClass}">${rank.name} | ${gameData.lp} LP</span>` : `${rank.name} | ${gameData.lp} LP`;
  document.getElementById("menu-profile").innerHTML = `<div${nameClass}>👤 ${REAL_PLAYER_NAME}</div><div class="profile-rank">${iconHtml} ${textHtml}</div>`;
}

function renderMainMenu() {
  updateMenuProfile();
  let arena = getArena(gameData.lp);
  let arenaHtml = `
    <div style="font-size: 40px; margin-bottom: 10px;">${arena.icon}</div>
    <div class="class-title" style="color: #fff; text-shadow: 0 0 5px rgba(0,0,0,0.8); font-size: 22px;">${arena.name}</div>
    <button class="btn-fight-huge" onclick="startGame()">⚔️ В БОЙ</button>
  `;
  let arenaCard = document.getElementById("menu-arena-display");
  arenaCard.className = "class-card " + arena.arenaClass;
  arenaCard.innerHTML = arenaHtml;
  let cls = CLASSES[gameData.currentClass];
  let classHtml = `
    <div style="text-align:left;">
      <div class="class-title" style="margin:0; font-size: 18px;">${cls.name}</div>
      <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">Нажмите, чтобы сменить</div>
    </div>
    <div style="font-size:24px;">🔄</div>
  `;
  document.getElementById("menu-class-display").innerHTML = classHtml;
  // Ежедневный подарок
  let giftEl = document.getElementById("menu-daily-gift");
  if (gameData.dailyGiftClaimed) {
    giftEl.innerHTML = `<div style="color:#64748b; font-size:13px; padding: 12px;">🎁 Ежедневный подарок — получен. Завтра будет новый!</div>`;
  } else if (gameData.dailyWins >= 5) {
    giftEl.innerHTML = `<button class="btn-fight-huge" style="font-size:14px; padding:12px;" onclick="claimDailyGift()">🎁 Забрать подарок!</button>`;
  } else {
    giftEl.innerHTML = `<div style="background:rgba(30,41,59,0.8); border:1px solid #475569; border-radius:12px; padding:12px; color:#94a3b8; font-size:13px;">🎁 Ежедневный подарок — ${gameData.dailyWins}/5 побед на арене</div>`;
  }
}

function openClassModal() {
  let html = '';
  Object.keys(CLASSES).forEach(key => {
    let c = CLASSES[key]; let isSelected = gameData.currentClass === key;
    html += `
      <div class="class-card ${isSelected ? 'border-emerald' : ''}" style="margin-bottom:10px; border-width:2px; text-align:left; background: rgba(30, 41, 59, 1);" onclick="selectClass('${key}')">
         <div class="class-title" style="display:flex; justify-content:space-between;">${c.name} ${isSelected ? '✅' : ''}</div>
         <div class="class-desc" style="font-size:10px;">${c.p1} | ${c.p2}</div>
      </div>
    `;
  });
  document.getElementById("class-modal-list").innerHTML = html;
  document.getElementById("class-modal").style.display = "flex";
}
function selectClass(key) { gameData.currentClass = key; saveData(); document.getElementById("class-modal").style.display = "none"; renderMainMenu(); }
function closeClassModal() { document.getElementById("class-modal").style.display = "none"; }

// ============================================================
// ГЕНЕРАЦИЯ ПРЕДМЕТОВ
// ============================================================

function rollLoot(lp) {
  let drops = getArenaDrops(lp); let roll = Math.random();
  if (roll < drops.epic) return generateItem('epic');
  if (roll < drops.epic + drops.rare) return generateItem('rare');
  if (roll < drops.epic + drops.rare + drops.uncommon) return generateItem('uncommon');
  if (roll < drops.epic + drops.rare + drops.uncommon + drops.common) return generateItem('common');
  return null;
}

// Дроп ключей на аренах (вызывается при победе)
function rollArenaKey(lp) {
  let msg = "";
  Object.values(DUNGEONS).forEach(dungeon => {
    let dropEntry = dungeon.keyArenaDrops.find(d => lp >= d.minLp && lp <= d.maxLp);
    if (dropEntry && Math.random() < dropEntry.chance) {
      gameData.keys[dungeon.keyId] = (gameData.keys[dungeon.keyId] || 0) + 1;
      msg += `<br><span class="text-skill">🗝️ Выпал ${dungeon.keyName}! Проверьте вкладку Подземелий.</span>`;
    }
  });
  return msg;
}

function rollBotItemForSlot(lp, slot) {
  if (lp >= 8000) return generateItem('epic', slot, Math.random() < 0.35);
  if (lp >= 7000) return generateItem('epic', slot, Math.random() < 0.20);
  if (lp >= 6000) return generateItem('epic', slot, Math.random() < 0.15);
  let arenaIdx = ARENAS.findIndex(a => lp <= a.maxLp);
  if (arenaIdx === -1) arenaIdx = ARENAS.length - 1;
  let rarity = null;
  if (arenaIdx <= 2) {
    let drops = getArenaDrops(lp); let r = Math.random();
    if (r < drops.epic * 3) rarity = 'epic';
    else if (r < (drops.epic + drops.rare) * 3) rarity = 'rare';
    else if (r < (drops.epic + drops.rare + drops.uncommon) * 3) rarity = 'uncommon';
    else if (r < (drops.epic + drops.rare + drops.uncommon + drops.common) * 3) rarity = 'common';
  } else if (arenaIdx === 3) { rarity = Math.random() < 0.5 ? 'epic' : 'rare'; }
  else if (arenaIdx === 4) { rarity = Math.random() < 0.8 ? 'epic' : 'rare'; }
  else { rarity = Math.random() < 0.95 ? 'epic' : 'rare'; }
  if (!rarity) return null;
  return generateItem(rarity, slot);
}

function generateItem(rarity, forceSlot = null, forceUnique = false) {
  const slots = ['head', 'body', 'arms', 'legs'];
  const slot = forceSlot ? forceSlot : slots[Math.floor(Math.random() * slots.length)];
  gameData.nextItemId++;
  let item = { id: gameData.nextItemId, classId: null, rarity: rarity, slot: slot, hp: 0, perk: null, unique: null };
  let isRareType2 = false;
  if (rarity === 'common') {
    item.hp = Math.floor(Math.random() * 2) + 1;
  } else if (rarity === 'uncommon') {
    item.hp = Math.floor(Math.random() * 2) + 1;
    if (Math.random() < 0.1) item.perk = generatePerk(slot, 1, 1, 1);
  } else if (rarity === 'rare') {
    item.hp = Math.floor(Math.random() * 2) + 2;
    if (Math.random() < 0.25) {
      isRareType2 = true;
      item.perk = generatePerk(slot, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 1);
    } else {
      if (Math.random() < 0.1) item.perk = generatePerk(slot, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 1);
    }
  } else if (rarity === 'epic') {
    item.hp = Math.floor(Math.random() * 3) + 3;
    item.perk = generatePerk(slot, Math.floor(Math.random() * 3) + 2, Math.floor(Math.random() * 3) + 2, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 2);
    if (forceUnique || Math.random() < 0.02) item.unique = generateUnique(slot);
  }
  item.name = generateItemName(rarity, slot, !!item.perk, !!item.unique, isRareType2);
  return item;
}

function generatePerk(slot, hVal, bVal, aVal, aCharges = 1) {
  if (slot === 'head') return { type: 'heal_once', val: hVal, desc: `Лечит ${hVal} ХП при падении здоровья.` };
  if (slot === 'body') return { type: 'block_pierce', val: bVal, desc: `Блокирует ${bVal} пробитого урона (1 раз).` };
  if (slot === 'arms') return { type: 'first_strike', val: aVal, charges: aCharges, desc: `Урон +${aVal} на первые ${aCharges} атак.` };
  return null;
}

function generateUnique(slot) {
  if (slot === 'head') return { type: 'healBonus', val: 1, desc: `[УНИК] +1 ХП при избыточном блоке.` };
  if (slot === 'body') return { type: 'blockBonus', val: 1, desc: `[УНИК] +1 ко всем блокам.` };
  if (slot === 'arms') return { type: 'ignoreBlock', val: 1, desc: `[УНИК] Игнорирует 1 ед. блока врага.` };
  if (slot === 'legs') return { type: 'dodge', val: 0.15, desc: `[УНИК] 15% шанс избежать атаки.` };
}

function getPrefix(word, slot) {
  let f = word, p = word;
  if (word.endsWith("ый")) { f = word.slice(0, -2) + "ая"; p = word.slice(0, -2) + "ые"; }
  else if (word.endsWith("ий")) {
    if (word.match(/[гкхжшщч]ий$/)) { f = word.slice(0, -2) + "ая"; p = word.slice(0, -2) + "ие"; }
    else { f = word.slice(0, -2) + "яя"; p = word.slice(0, -2) + "ие"; }
  }
  else if (word.endsWith("ой")) { f = word.slice(0, -2) + "ая"; p = word.slice(0, -2) + "ые"; }
  if (slot === 'body') return f;
  if (slot === 'arms' || slot === 'legs') return p;
  return word;
}

function generateItemName(rarity, slot, hasPerk, hasUnique, isRareType2 = false, dungeonName = null) {
  if (dungeonName) return dungeonName;
  const slotName = SLOT_NAMES[slot];
  let prefixes = []; let suffixes = [];
  if (rarity === 'common') {
    prefixes = ["Грубый", "Старый", "Треснутый"];
  } else if (rarity === 'uncommon') {
    prefixes = ["Крепкий", "Усиленный", "Прочный", "Надёжный"];
  } else if (rarity === 'rare') {
    if (isRareType2) {
      prefixes = ["Рунный", "Сумрачный", "Туманный", "Морозный", "Обжигающий", "Призрачный", "Громовой"];
      suffixes = ["Теней", "Забвения", "Расплаты", "Скитальца", "Разлома", "Сокрушения"];
    } else {
      if (!hasPerk) {
        prefixes = ["Тяжёлый", "Усиленный", "Закалённый", "Мощный"];
      } else {
        prefixes = ["Стальной", "Окованный", "Кристальный", "Нерушимый", "Каменный"];
        suffixes = ["Стража", "Охотника", "Защиты", "Дозора", "Перевала", "Стойкости", "Бастиона"];
      }
    }
  } else if (rarity === 'epic') {
    if (!hasUnique) {
      prefixes = ["Пылающий", "Сияющий", "Древний", "Избранный", "Тайный", "Яростный", "Расколотый"];
      suffixes = ["Пепла", "Хаоса", "Порядка", "Заката", "Рассвета", "Титанов", "Лорда"];
    } else {
      prefixes = ["Небесный", "Звёздный", "Бессмертный", "Абсолютный"];
      suffixes = ["Мироздания", "Вечности", "Губителя", "Погибели"];
    }
  } else if (rarity === 'legendary') {
    prefixes = ["Легендарный", "Мифический", "Забытый"];
  }
  let prefix = prefixes.length > 0 ? getPrefix(prefixes[Math.floor(Math.random() * prefixes.length)], slot) : "";
  let suffix = suffixes.length > 0 ? " " + suffixes[Math.floor(Math.random() * suffixes.length)] : "";
  return `${prefix} ${slotName}${suffix}`.trim();
}

// ============================================================
// ИНВЕНТАРЬ И ЭКИПИРОВКА
// ============================================================

let selectedItem = null; let isEquipped = false;

function updateHeroTab() {
  let totalHp = 20; let currentEq = gameData.equip[gameData.currentClass];
  ['head', 'body', 'arms', 'legs'].forEach(slot => {
    let el = document.getElementById(`eq-${slot}`); let item = currentEq[slot];
    if (item) {
      totalHp += item.hp; el.className = `equip-slot rarity-${item.rarity} filled`; el.innerHTML = `<b>${item.name}</b><br>+${item.hp} ХП`;
      if (item.rarity === 'epic') el.innerHTML += `<br><span style="color:#ef4444; font-size:9px;">Привязано</span>`;
    } else { el.className = `equip-slot`; el.innerHTML = `${getSlotIcon(slot)}<br>${SLOT_NAMES[slot]}`; }
  });
  document.getElementById('hero-stats').innerText = `Максимальное ХП: ${totalHp}`;
}

function updateBagTab() {
  document.getElementById('bag-count').innerText = gameData.inventory.length;
  document.getElementById('bag-max').innerText = gameData.maxInventory;
  document.getElementById('imperial-amount').innerText = gameData.imperials;
  let shopBal = document.getElementById('shop-imperial-amount'); if (shopBal) shopBal.innerText = gameData.imperials;
  let grid = document.getElementById('inventory-grid'); grid.innerHTML = '';
  for (let i = 0; i < gameData.maxInventory; i++) {
    let item = gameData.inventory[i];
    if (item) { grid.innerHTML += `<div class="inv-slot rarity-${item.rarity} filled" onclick="openItemModalById('${item.id}', false)"><b>${item.name}</b><br>+${item.hp} ХП</div>`; }
    else { grid.innerHTML += `<div class="inv-slot">Пусто</div>`; }
  }
}

function getSlotIcon(slot) { return { head: "🪖", body: "👕", arms: "🧤", legs: "👢" }[slot]; }

function openItemModalById(id, equipped) {
  let currentEq = gameData.equip[gameData.currentClass];
  let item = equipped ? Object.values(currentEq).find(i => i && String(i.id) === String(id)) : gameData.inventory.find(i => i && String(i.id) === String(id));
  if (!item) return; selectedItem = item; isEquipped = equipped;
  document.getElementById('modal-title').innerText = item.name;
  document.getElementById('modal-title').className = `text-${item.rarity}`;
  let desc = `<b>Слот:</b> ${SLOT_NAMES[item.slot]}<br><b>Бонус:</b> +${item.hp} Макс ХП<br>`;
  if (item.perk) desc += `<br>🔸 ${item.perk.desc}`; if (item.unique) desc += `<br><b style="color:#fbbf24">${item.unique.desc}</b>`;
  if (equipped && item.rarity === 'epic') { desc += `<br><br><span style="color:#ef4444; font-weight:bold;">🔒 Привязано к герою</span><br><i>Эту вещь нельзя снять, только уничтожить (продать).</i>`; }
  desc += `<br><br><i>Цена продажи: ${SELL_PRICES[item.rarity]} 🪙</i>`;
  document.getElementById('modal-desc').innerHTML = desc;
  let acts = document.getElementById('modal-actions');
  if (equipped) {
    if (item.rarity === 'epic') { acts.innerHTML = `<button class="action-btn" style="background:#ef4444" onclick="sellEquippedItem()">Продать</button>`; }
    else { acts.innerHTML = `<button class="action-btn" style="background:#f59e0b" onclick="unequipItem()">Снять</button>`; }
  } else {
    acts.innerHTML = `<button class="action-btn" style="background:#22c55e" onclick="equipItem()">Надеть</button>
                      <button class="action-btn" style="background:#ef4444" onclick="sellItem()">Продать</button>`;
  }
  document.getElementById('item-modal').style.display = 'flex';
}
function openItemModal(slot, equipped) { let currentEq = gameData.equip[gameData.currentClass]; if (equipped && currentEq[slot]) openItemModalById(currentEq[slot].id, true); }
function closeModal() { document.getElementById('item-modal').style.display = 'none'; }

function equipItem() {
  let currentEq = gameData.equip[gameData.currentClass]; let oldItem = currentEq[selectedItem.slot];
  if (oldItem && oldItem.rarity === 'epic') { alert("Слот занят привязанной эпической вещью! Сначала продайте её."); return; }
  if (gameData.inventory.length >= gameData.maxInventory && oldItem) { alert("Сумка полна! Сначала освободите место."); return; }
  gameData.inventory = gameData.inventory.filter(i => i.id !== selectedItem.id); currentEq[selectedItem.slot] = selectedItem;
  if (oldItem) gameData.inventory.push(oldItem);
  saveData(); closeModal(); updateBagTab(); updateHeroTab();
}
function unequipItem() {
  if (gameData.inventory.length >= gameData.maxInventory) { alert("Сумка полна!"); return; }
  let currentEq = gameData.equip[gameData.currentClass]; currentEq[selectedItem.slot] = null;
  gameData.inventory.push(selectedItem); saveData(); closeModal(); updateBagTab(); updateHeroTab();
}
function sellItem() {
  gameData.imperials += SELL_PRICES[selectedItem.rarity]; gameData.inventory = gameData.inventory.filter(i => i.id !== selectedItem.id);
  saveData(); closeModal(); updateBagTab(); if (document.getElementById('tab-shop').classList.contains('active')) renderShop();
}
function executeSellEquipped() {
  gameData.imperials += SELL_PRICES[selectedItem.rarity]; gameData.equip[gameData.currentClass][selectedItem.slot] = null;
  saveData(); closeModal(); updateHeroTab(); updateBagTab(); if (document.getElementById('tab-shop').classList.contains('active')) renderShop();
}
function sellEquippedItem() {
  let msg = "Вы уверены? Вещь будет уничтожена и вы получите " + SELL_PRICES[selectedItem.rarity] + " 🪙.";
  if (tg && tg.showConfirm) {
    tg.showConfirm(msg, function (confirmed) { if (confirmed) executeSellEquipped(); });
  } else {
    if (confirm(msg)) executeSellEquipped();
  }
}

// ============================================================
// МАГАЗИН
// ============================================================

function getNextSlotCost() {
  let m = gameData.maxInventory;
  if (m >= 18) return null; if (m >= 15) return 50000; if (m >= 12) return 20000; if (m >= 9) return 5000; return 500;
}
function buyBagSlots() {
  let cost = getNextSlotCost(); if (!cost || gameData.imperials < cost) { alert("Недостаточно Империалов!"); return; }
  gameData.imperials -= cost; gameData.maxInventory += 3; saveData(); updateBagTab(); renderShop();
}
function buyChest(type) {
  if (gameData.inventory.length >= gameData.maxInventory) { alert("Сумка полна! Продайте лишние вещи."); return; }
  let cost = [0, 100, 300, 500, 1000][type]; if (gameData.imperials < cost) { alert("Недостаточно Империалов!"); return; }
  gameData.imperials -= cost; let rarity = 'common'; let forceUnique = false; let r = Math.random();
  if (type === 1) { if (r < 0.85) rarity = 'common'; else if (r < 0.99) rarity = 'uncommon'; else rarity = 'rare'; }
  else if (type === 2) { if (r < 0.60) rarity = 'common'; else if (r < 0.80) rarity = 'uncommon'; else if (r < 0.99) rarity = 'rare'; else rarity = 'epic'; }
  else if (type === 3) { if (r < 0.40) rarity = 'common'; else if (r < 0.70) rarity = 'uncommon'; else if (r < 0.97) rarity = 'rare'; else rarity = 'epic'; }
  else if (type === 4) {
    gameData.hugeChestPity += 1;
    if (gameData.hugeChestPity > 100) { rarity = 'epic'; forceUnique = true; gameData.hugeChestPity = 0; }
    else { if (r < 0.30) rarity = 'common'; else if (r < 0.60) rarity = 'uncommon'; else if (r < 0.95) rarity = 'rare'; else rarity = 'epic'; }
  }
  let item = generateItem(rarity, null, forceUnique); gameData.inventory.push(item);
  saveData(); updateBagTab(); renderShop(); openItemModalById(item.id, false);
}

function buyDungeonKey(keyId) {
  let dungeon = Object.values(DUNGEONS).find(d => d.keyId === keyId);
  if (!dungeon) return;
  if (gameData.imperials < dungeon.keyShopPrice) { alert("Недостаточно Империалов!"); return; }
  gameData.imperials -= dungeon.keyShopPrice;
  gameData.keys[keyId] = (gameData.keys[keyId] || 0) + 1;
  saveData(); renderShop();
  alert(`Куплен ${dungeon.keyName}!`);
}

function getPouchSlotCost() {
  let s = gameData.pouch.slots;
  if (s >= 6) return null;
  return 2000 * Math.pow(2, s); // 2000, 4000, 8000, 16000, 32000, 64000
}

function buyPouchSlot() {
  let cost = getPouchSlotCost();
  if (!cost || gameData.imperials < cost) { alert("Недостаточно Империалов!"); return; }
  gameData.imperials -= cost;
  gameData.pouch.slots++;
  saveData(); renderShop();
}

function buyPotion(type) {
  let potion = POTIONS[type];
  if (gameData.imperials < potion.cost) { alert("Недостаточно Империалов!"); return; }
  if (gameData.pouch.items.length >= gameData.pouch.slots) { 
    alert("Подсумок полон! Купите новые слоты у Герольда Кожевника."); return; 
  }
  gameData.imperials -= potion.cost;
  gameData.pouch.items.push({ type: type, name: potion.name, heal: potion.heal });
  saveData(); renderShop();
}

function renderShop() {
  let slotCost = getNextSlotCost(); let slotText = slotCost ? `+3 слота за ${slotCost} 🪙` : `Сумка максимальна (18)`;
  let pity = gameData.hugeChestPity || 0;

  // Секция ключей
  let keysHtml = '';
  Object.values(DUNGEONS).forEach(dungeon => {
    let owned = gameData.keys[dungeon.keyId] || 0;
    let canBuy = gameData.imperials >= dungeon.keyShopPrice;
    keysHtml += `
      <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(15,23,42,0.6); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
        <div style="text-align:left;">
          <div style="font-weight:bold; color:#fbbf24;">${dungeon.keyName}</div>
          <div style="font-size:11px; color:#94a3b8;">Имеется: ${owned} шт.</div>
        </div>
        <button class="action-btn" style="background:${canBuy ? '#b45309' : '#475569'}; padding: 8px 12px; font-size:12px; flex:0;" 
          ${!canBuy ? 'disabled' : ''} onclick="buyDungeonKey('${dungeon.keyId}')">
          ${dungeon.keyShopPrice} 🪙
        </button>
      </div>`;
  });

  let html = `
    <div class="class-card arena-stone" style="border: 2px solid #94a3b8; text-align: left;">
        <div class="class-title" style="color:#fbbf24">🎒 Герольд Кожевник</div>
        <div class="class-desc" style="margin-bottom: 10px;">Увеличивает вместимость вашей сумки. Текущий размер: ${gameData.maxInventory}/18.</div>
        <button class="action-btn" style="background: ${slotCost && gameData.imperials >= slotCost ? '#22c55e' : '#475569'}; padding: 10px; width: 100%; font-size:12px; margin-bottom:8px;" ${(!slotCost || gameData.imperials < slotCost) ? 'disabled' : ''} onclick="buyBagSlots()">🛒 ${slotText}</button>
        <div style="border-top: 1px solid #475569; margin: 10px 0; padding-top: 10px;">
            <div style="font-size:12px; color:#94a3b8; margin-bottom:8px;">🧰 Подсумок (для зелий): ${gameData.pouch.slots}/6 слотов</div>
            ${(() => { let pc = getPouchSlotCost(); return pc ? `<button class="action-btn" style="background:${gameData.imperials >= pc ? '#0369a1' : '#475569'}; padding: 10px; width: 100%; font-size:12px;" ${gameData.imperials < pc ? 'disabled' : ''} onclick="buyPouchSlot()">🧰 +1 слот подсумка — ${pc} 🪙</button>` : `<div style="color:#22c55e; font-size:12px;">Подсумок максимален (6 слотов)</div>`; })()}
        </div>
    </div>

    <div class="class-card" style="margin-top: 20px; border: 2px solid #b45309; text-align: left; background: rgba(30,20,5,0.8);">
        <div class="class-title" style="color:#f59e0b">🧕🏿 Дядюшка Ибн</div>
        <div class="class-desc" style="margin-bottom: 10px;">Торгует ключами от подземелий. Знает все тайные входы.</div>
        ${keysHtml}
    </div>

    <div class="class-card" style="margin-top: 20px; border: 2px solid #7c3aed; text-align: left; background: rgba(20,10,40,0.8);">
        <div class="class-title" style="color:#c084fc">🔮 Лавка алхимика</div>
        <div class="class-desc" style="margin-bottom: 10px;">Зелья для подземелий. Подсумок: ${gameData.pouch.items.length}/${gameData.pouch.slots} слотов.</div>
        ${Object.values(POTIONS).map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(15,23,42,0.6); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
            <div style="text-align:left;">
                <div style="font-weight:bold; color:#e9d5ff;">${p.name}</div>
                <div style="font-size:11px; color:#94a3b8;">+${p.heal} ХП</div>
            </div>
            <button class="action-btn" style="background:${gameData.imperials >= p.cost && gameData.pouch.items.length < gameData.pouch.slots ? '#6d28d9' : '#475569'}; padding: 8px 12px; font-size:12px; flex:0;" 
                ${gameData.imperials < p.cost || gameData.pouch.items.length >= gameData.pouch.slots ? 'disabled' : ''} 
                onclick="buyPotion('${p.id}')">
                ${p.cost} 🪙
            </button>
        </div>`).join('')}
    </div>

    <h3 style="margin-top: 20px; color:#f43f5e">🎲 Азартный Бак</h3>
    <div class="class-desc" style="margin-bottom:10px;">Продает сундуки. Гарант Огромного сундука: ${pity}/100.</div>
    <div class="class-grid">
        <div class="class-card" style="border-color:#9ca3af; padding: 10px;" onclick="buyChest(1)">
            <div class="class-title" style="color:#9ca3af; font-size:14px;">Сундучок</div>
            <div class="class-desc" style="font-size:10px; text-align:center;">85% ОБЫЧ<br>14% НЕОБЫЧ<br>1% РЕДК</div>
            <button class="action-btn" style="background:#475569; padding: 5px; width:100%; font-size:12px; margin-top:5px;">100 🪙</button>
        </div>
        <div class="class-card" style="border-color:#22c55e; padding: 10px;" onclick="buyChest(2)">
            <div class="class-title" style="color:#22c55e; font-size:14px;">Сундук</div>
            <div class="class-desc" style="font-size:10px; text-align:center;">60% ОБЫЧ | 20% НЕОБЫЧ<br>19% РЕДК | 1% ЭПИК</div>
            <button class="action-btn" style="background:#15803d; padding: 5px; width:100%; font-size:12px; margin-top:5px;">300 🪙</button>
        </div>
        <div class="class-card" style="border-color:#3b82f6; padding: 10px;" onclick="buyChest(3)">
            <div class="class-title" style="color:#3b82f6; font-size:14px;">Бол. сундук</div>
            <div class="class-desc" style="font-size:10px; text-align:center;">40% ОБЫЧ | 30% НЕОБЫЧ<br>27% РЕДК | 3% ЭПИК</div>
            <button class="action-btn" style="background:#1d4ed8; padding: 5px; width:100%; font-size:12px; margin-top:5px;">500 🪙</button>
        </div>
        <div class="class-card" style="border-color:#a855f7; padding: 10px; box-shadow: 0 0 10px rgba(168,85,247,0.4);" onclick="buyChest(4)">
            <div class="class-title" style="color:#a855f7; font-size:14px;">Огр. сундук</div>
            <div class="class-desc" style="font-size:10px; text-align:center;">30% ОБЫЧ | 30% НЕОБЫЧ<br>35% РЕДК | 5% ЭПИК</div>
            <button class="action-btn" style="background:#6b21a8; padding: 5px; width:100%; font-size:12px; margin-top:5px;">1000 🪙</button>
        </div>
    </div>`;
  document.getElementById('shop-content').innerHTML = html;
}

// ============================================================
// ЭКРАН ПОДЗЕМЕЛИЙ
// ============================================================

function renderDungeons() {
  let html = `<div style="margin-bottom:15px;"><h2>⚰️ Подземелья</h2><span style="font-size:12px; color:#94a3b8;">Требуют ключей. Ключи выпадают на аренах или покупаются у Дядюшки Ибн.</span></div>`;

  Object.values(DUNGEONS).forEach(dungeon => {
    let owned = gameData.keys[dungeon.keyId] || 0;
    let progress = gameData.dungeonProgress[dungeon.id] || 0;
    let totalFloors = dungeon.floors.length;
    let hasKey = owned > 0;

    html += `
      <div class="class-card ${dungeon.dungeonClass}" style="border-width: 2px; margin-bottom: 15px; text-align:left; cursor: ${hasKey ? 'pointer' : 'default'};" 
           onclick="${hasKey ? `startDungeon('${dungeon.id}')` : ''}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div class="class-title" style="color:#fff; text-shadow: 0 1px 4px rgba(0,0,0,0.8);">${dungeon.icon} ${dungeon.name}</div>
            <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">Этажей: ${totalFloors} | Прогресс: ${progress}/${totalFloors}</div>
            <div style="font-size:11px; color:#fbbf24; margin-top:4px;">${dungeon.keyName}: ${owned} шт.</div>
          </div>
          <div style="font-size:32px; margin-left:10px;">${hasKey ? '🗝️' : '🔒'}</div>
        </div>
        ${hasKey
        ? `<button class="btn-fight-huge" style="font-size:14px; padding:10px; margin-top:12px;">⚔️ Войти</button>`
        : `<div style="margin-top:10px; color:#64748b; font-size:12px;">Нет ключей. Фармите арены (от Серебра) или купите у Дядюшки Ибн.</div>`
      }
      </div>`;
  });

  document.getElementById('tab-dungeons').innerHTML = html;
}

// ============================================================
// БОЙ — ИНИЦИАЛИЗАЦИЯ
// ============================================================

let player = {}; let bot = {}; let gameIsOver = false;
let turnTimerId = null; let turnTimeLeft = 4000; const TURN_DURATION = 4000;
let queuedPlayerAction = 'skip'; let isTurnActive = false; let currentBotName = "Player";
let turnCount = 1;
let lastPlayerDmgThisTurn = 0; // для триггера Подчинись мне

function getHitAdj(val) { return val >= 3 ? "мощный" : (val <= 1 ? "слабый" : "обычный"); }
function getBlockAdj(val) { return val >= 3 ? "мощный" : (val <= 1 ? "слабый" : "обычный"); }

function getEquipHp(eq) { return Object.values(eq).reduce((sum, item) => sum + (item ? item.hp : 0), 0); }
function parsePerks(eq) {
  let p = { healOnce: 0, blockPierce: 0, strikes: 0, dmgB: 0, blockB: 0, healB: 0, dodge: 0, ignore: 0 };
  Object.values(eq).forEach(item => {
    if (!item) return;
    if (item.perk) {
      if (item.perk.type === 'heal_once') p.healOnce = item.perk.val;
      if (item.perk.type === 'block_pierce') p.blockPierce = item.perk.val;
      if (item.perk.type === 'first_strike') { p.strikes = item.perk.charges; p.dmgB = item.perk.val; }
    }
    if (item.unique) {
      if (item.unique.type === 'healBonus') p.healB = item.unique.val;
      if (item.unique.type === 'blockBonus') p.blockB = item.unique.val;
      if (item.unique.type === 'ignoreBlock') p.ignore = item.unique.val;
      if (item.unique.type === 'dodge') p.dodge = item.unique.val;
    }
  }); return p;
}

function initChar(classId, isBot, lp) {
  let eq = { head: null, body: null, arms: null, legs: null };
  if (isBot) { ['head', 'body', 'arms', 'legs'].forEach(slot => { let drop = rollBotItemForSlot(lp, slot); if (drop) eq[slot] = drop; }); }
  else { eq = gameData.equip[classId]; }
  let hpTotal = 20 + getEquipHp(eq);
  return {
    classId: classId, className: CLASSES[classId].name, hp: hpTotal, maxHp: hpTotal, lp: lp,
    stats: { dmgDealt: 0, dmgBlocked: 0, healed: 0 }, skillReady: false, hotTurnsLeft: 0,
    usedInstinct: false, usedPrayer: false, poisoned: false, pursuitDmg: 0, retBlocks: 0, retBonus: 0,
    furyTurnsLeft: 0, immortalTurns: 0, usedImmortality: false, canHeal: true, courageThresholdDown: false, immortalTurnActive: false,
    eq: eq, eqP: parsePerks(eq),
    isMob: false
  };
}

// ============================================================
// ТАЙМЕР И РЕГИСТРАЦИЯ ДЕЙСТВИЙ
// ============================================================

function startTurnTimer() {
  if (gameIsOver) return;
  queuedPlayerAction = 'skip'; isTurnActive = true;
  document.querySelectorAll('.controls .action-btn').forEach(btn => {
    if (btn.id !== 'btn-return') { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }
  });
  updateScreen();
  document.getElementById("turn-timer-container").style.display = "block";
  let textEl = document.getElementById("turn-timer-text");
  clearInterval(turnTimerId);
  let endTime = Date.now() + TURN_DURATION;
  turnTimerId = setInterval(() => {
    turnTimeLeft = Math.max(0, endTime - Date.now());
    textEl.innerText = (turnTimeLeft / 1000).toFixed(1);
    if (turnTimeLeft <= 1000) textEl.style.color = '#ef4444'; else textEl.style.color = '#10b981';
    if (turnTimeLeft <= 0) {
      clearInterval(turnTimerId); isTurnActive = false; textEl.innerText = "0.0"; playTurn(queuedPlayerAction);
    }
  }, 100);
}

function registerAction(action) {
  if (!isTurnActive || queuedPlayerAction !== 'skip') return;
  queuedPlayerAction = action;
  document.querySelectorAll('.controls .action-btn').forEach(btn => {
    if (btn.id !== 'btn-return') { btn.style.opacity = '0.4'; btn.style.pointerEvents = 'none'; }
  });
}

// ============================================================
// ЗАПУСК АРЕНЫ
// ============================================================

function startGame() {
  dungeonState = null; // сбрасываем данж режим
  player = initChar(gameData.currentClass, false, gameData.lp);
  const keys = Object.keys(CLASSES);
  let botLp = Math.max(0, gameData.lp + Math.floor(Math.random() * 41) - 20);
  bot = initChar(keys[Math.floor(Math.random() * keys.length)], true, botLp);
  gameIsOver = false; turnCount = 1; lastPlayerDmgThisTurn = 0;
  currentBotName = "Player " + (Math.floor(Math.random() * 999) + 1);
  let currentArena = getArena(gameData.lp); let pRank = getRank(player.lp); let bRank = getRank(bot.lp);
  document.getElementById("battle-arena").className = "arena " + currentArena.arenaClass;
  document.getElementById("player-card").className = "character " + pRank.borderClass;
  document.getElementById("bot-card").className = "character " + bRank.borderClass;
  document.getElementById("combat-log").innerHTML = `<div class='log-entry text-skill'>⚔️ Локация: ${currentArena.icon} ${currentArena.name}! Бой начинается.</div>`;
  document.getElementById("btn-return").style.display = "none";
  updateScreen(); switchTab(null, "tab-battle");
  document.getElementById("main-screen").style.display = "none"; document.getElementById("battle-screen").style.display = "block";
  startTurnTimer();
}

function returnToMenu() {
  renderMainMenu();
  document.getElementById("main-screen").style.display = "block";
  document.getElementById("battle-screen").style.display = "none";
}

function rollDice() { return Math.floor(Math.random() * 3) + 1; }

// ============================================================
// ОСНОВНОЙ ХОД
// ============================================================

function playTurn(playerChoice) {
  if (gameIsOver) return;
  lastPlayerDmgThisTurn = 0;

  let logMsg = `<div style="text-align:center; font-weight:900; color:#fbbf24; margin: 15px 0 10px 0; border-top: 1px solid #475569; padding-top: 10px;">━━━━━ Ход ${turnCount} ━━━━━</div>`;
  turnCount++;

  if (playerChoice === 'skip') { logMsg += `<span class="text-block">⏳ Вы не успели сделать выбор и пропускаете ход!</span><br>`; }

  // Проверяем умения моба ДО хода
  if (bot.isMob) {
    logMsg += checkMobAbilitiesPreTurn(bot, lastPlayerDmgThisTurn);
  }

  let botChoice;
  if (bot.isMob) {
    // Моб: просто атакует каждый ход
    botChoice = 'attack';
  } else {
    botChoice = bot.immortalTurns > 0 ? 'immortal' : (bot.skillReady ? 'skill' : (Math.random() < 0.5 ? 'attack' : 'defend'));
  }

  let pAttack = 0, pBlock = 0, bAttack = 0, bBlock = 0;
  let pIgnore = false, pDouble = false, pInvul = false;
  let bIgnore = false, bDouble = false, bInvul = false;
  let pUsedActiveSkill = false, bUsedActiveSkill = false;
  let pBonus = 0, bBonus = 0;

  if (playerChoice === 'immortal') { pAttack = rollDice(); pBlock = 3; pBonus += 1; }
  else if (playerChoice !== 'skip') { pAttack = rollDice(); pBlock = rollDice(); }

  if (bot.isMob) {
    let mobRoll = rollDungeonMobAction(bot);
    bAttack = mobRoll.atk;
    bBlock = mobRoll.blk;
    // Леди Сильвия: блокирует блок игрока
    if (bot.fateActive) {
      pBlock = 0;
      logMsg += `<span class="text-dmg">😶 «Прими свою судьбу» — вы не можете блокировать! (осталось ${bot.fateTurnsLeft} хода)</span><br>`;
    }
  } else {
    if (botChoice === 'immortal') { bAttack = rollDice(); bBlock = 3; bBonus += 1; }
    else { bAttack = rollDice(); bBlock = rollDice(); }
  }

  if (playerChoice === 'skill') {
    player.skillReady = false; playerChoice = 'attack'; pUsedActiveSkill = true;
    logMsg += `<span class="text-skill">🌟 ${REAL_PLAYER_NAME} применяет умение "${CLASSES[player.classId].activeName}"!</span><br>`;
    if (player.classId === 'warrior') pIgnore = true; if (player.classId === 'assassin') pDouble = true;
    if (player.classId === 'guardian') pInvul = true; if (player.classId === 'priest') player.hotTurnsLeft = 2;
    if (player.classId === 'darkknight') player.furyTurnsLeft = 3;
  }
  if (!bot.isMob && botChoice === 'skill') {
    bot.skillReady = false; botChoice = 'attack'; bUsedActiveSkill = true;
    logMsg += `<span class="text-skill">🌟 ${currentBotName} применяет умение "${CLASSES[bot.classId].activeName}"!</span><br>`;
    if (bot.classId === 'warrior') bIgnore = true; if (bot.classId === 'assassin') bDouble = true;
    if (bot.classId === 'guardian') bInvul = true; if (bot.classId === 'priest') bot.hotTurnsLeft = 2;
    if (bot.classId === 'darkknight') bot.furyTurnsLeft = 3;
  }

  if (!bot.isMob) {
    pBlock += player.eqP.blockB; bBlock += bot.eqP.blockB;
    bBlock = Math.max(0, bBlock - player.eqP.ignore); pBlock = Math.max(0, pBlock - bot.eqP.ignore);
  } else {
    pBlock += player.eqP.blockB;
    pBlock = Math.max(0, pBlock - (bot.eqP ? bot.eqP.ignore : 0));
  }

  if (!bot.isMob) {
    if (player.classId === 'warrior' && player.hp <= 6) pBonus += 2;
    if (bot.classId === 'warrior' && bot.hp <= 6) bBonus += 2;
    if (player.classId === 'guardian' && player.retBonus > 0 && playerChoice === 'attack' && !pInvul) { pBonus += player.retBonus; player.retBonus = 0; player.retBlocks = 0; }
    if (bot.classId === 'guardian' && bot.retBonus > 0 && botChoice === 'attack' && !bInvul) { bBonus += bot.retBonus; bot.retBonus = 0; bot.retBlocks = 0; }
    if (player.furyTurnsLeft > 0 && (playerChoice === 'attack' || playerChoice === 'immortal')) { pBonus += 1; logMsg += `<i class="text-info">🦇 Тёмная ярость: Урон +1</i><br>`; }
    if (bot.furyTurnsLeft > 0 && (botChoice === 'attack' || botChoice === 'immortal')) { bBonus += 1; logMsg += `<i class="text-info">🦇 Тёмная ярость ${currentBotName}: Урон +1</i><br>`; }
    if (playerChoice === 'attack' && player.eqP.strikes > 0) { pBonus += player.eqP.dmgB; player.eqP.strikes--; logMsg += `<i class="text-info">🧤 Перчатки: Урон +${player.eqP.dmgB}</i><br>`; }
    if (botChoice === 'attack' && bot.eqP.strikes > 0) { bBonus += bot.eqP.dmgB; bot.eqP.strikes--; logMsg += `<i class="text-info">🧤 ${currentBotName} использует перчатки!</i><br>`; }
  } else {
    // В данже перки игрока всё ещё работают
    if (player.classId === 'warrior' && player.hp <= 6) pBonus += 2;
    if (player.classId === 'guardian' && player.retBonus > 0 && playerChoice === 'attack' && !pInvul) { pBonus += player.retBonus; player.retBonus = 0; player.retBlocks = 0; }
    if (player.furyTurnsLeft > 0 && (playerChoice === 'attack' || playerChoice === 'immortal')) { pBonus += 1; logMsg += `<i class="text-info">🦇 Тёмная ярость: Урон +1</i><br>`; }
    if (playerChoice === 'attack' && player.eqP.strikes > 0) { pBonus += player.eqP.dmgB; player.eqP.strikes--; logMsg += `<i class="text-info">🧤 Перчатки: Урон +${player.eqP.dmgB}</i><br>`; }
  }

  pAttack += pBonus; bAttack += bBonus;
  if (pDouble) pAttack *= 2; if (bDouble) bAttack *= 2;

  let pAttacking = (playerChoice === 'attack' || playerChoice === 'immortal');
  let bAttacking = (bot.isMob) ? true : (botChoice === 'attack' || botChoice === 'immortal');
  let pDefending = (playerChoice === 'defend' || playerChoice === 'immortal');
  let bDefending = bot.isMob ? false : (botChoice === 'defend' || botChoice === 'immortal');

  if (bot.isMob) {
    // Моб всегда атакует, игрок может атаковать или защищаться
    if (pAttacking && bAttacking) {
      if (playerChoice === 'immortal') {
        logMsg += `<span class="text-skill">⚔️ Встречная атака! ${REAL_PLAYER_NAME} бессмертен!</span><br>`;
        logMsg += resolveCombat(bot, player, bAttack, pBlock, currentBotName, REAL_PLAYER_NAME, false, false);
        if (pAttack > 0) {
          let bDmgTaken = pAttack;
          if (bDmgTaken > 0) { logMsg += applyDamage(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill); lastPlayerDmgThisTurn += bDmgTaken; }
        }
      } else {
        logMsg += `<span class="text-skill">⚔️ Встречная атака!</span><br>`;
        logMsg += `🗡️ ${REAL_PLAYER_NAME} наносит ${getHitAdj(pAttack)} удар (${pAttack})<br>`;
        logMsg += `🗡️ ${currentBotName} наносит ${getHitAdj(bAttack)} удар (${bAttack})<br>`;
        // Игрок атакует моба
        let bDmgTaken = pAttack; // моб без уклонения
        if (bDmgTaken > 0) { logMsg += applyDamage(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill); lastPlayerDmgThisTurn += bDmgTaken; }
        // Моб атакует игрока
        let pDmgTaken = bAttack;
        if (Math.random() < player.eqP.dodge) { pDmgTaken = 0; logMsg += `<span class="text-info">👢 Сапоги: ${REAL_PLAYER_NAME} уклонился!</span><br>`; }
        if (player.classId === 'assassin' && player.hp <= 4 && !player.usedInstinct) { pDmgTaken = 0; player.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${REAL_PLAYER_NAME} уклонился!</span><br>`; }
        if (pInvul) pDmgTaken = 0;
        if (pDmgTaken > 0) logMsg += applyDamage(player, bot, pDmgTaken, REAL_PLAYER_NAME, bUsedActiveSkill);
      }
    } else if (!pAttacking) {
      // Игрок защищается — моб всё равно атакует
      logMsg += resolveCombat(bot, player, bAttack, pBlock, currentBotName, REAL_PLAYER_NAME, false, false);
    }
  } else {
    // Стандартная логика арены
    if (pAttacking && bAttacking) {
      if (playerChoice === 'immortal' && botChoice === 'immortal') {
        logMsg += `<span class="text-skill">⚔️ Битва бессмертных!</span><br>`;
        logMsg += resolveCombat(player, bot, pAttack, bBlock, REAL_PLAYER_NAME, currentBotName, pIgnore, pUsedActiveSkill);
        logMsg += resolveCombat(bot, player, bAttack, pBlock, currentBotName, REAL_PLAYER_NAME, bIgnore, bUsedActiveSkill);
      } else if (playerChoice === 'immortal' && botChoice === 'attack') {
        logMsg += `<span class="text-skill">⚔️ Встречная атака! ${REAL_PLAYER_NAME} бессмертен!</span><br>`;
        logMsg += resolveCombat(bot, player, bAttack, pBlock, currentBotName, REAL_PLAYER_NAME, bIgnore, bUsedActiveSkill);
        if (pAttack > 0) {
          let bDmgTaken = pAttack;
          if (bot.classId === 'assassin' && bot.hp <= 4 && !bot.usedInstinct) { bDmgTaken = 0; bot.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${currentBotName} уклонился!</span><br>`; }
          else if (Math.random() < bot.eqP.dodge) { bDmgTaken = 0; logMsg += `<span class="text-info">👢 ${currentBotName} уклонился!</span><br>`; }
          if (bInvul) bDmgTaken = 0;
          if (bDmgTaken > 0) logMsg += applyDamage(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill);
        }
      } else if (playerChoice === 'attack' && botChoice === 'immortal') {
        logMsg += `<span class="text-skill">⚔️ Встречная атака! ${currentBotName} бессмертен!</span><br>`;
        logMsg += resolveCombat(player, bot, pAttack, bBlock, REAL_PLAYER_NAME, currentBotName, pIgnore, pUsedActiveSkill);
        if (bAttack > 0) {
          let pDmgTaken = bAttack;
          if (player.classId === 'assassin' && player.hp <= 4 && !player.usedInstinct) { pDmgTaken = 0; player.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${REAL_PLAYER_NAME} уклонился!</span><br>`; }
          else if (Math.random() < player.eqP.dodge) { pDmgTaken = 0; logMsg += `<span class="text-info">👢 Сапоги: ${REAL_PLAYER_NAME} уклонился!</span><br>`; }
          if (pInvul) pDmgTaken = 0;
          if (pDmgTaken > 0) logMsg += applyDamage(player, bot, pDmgTaken, REAL_PLAYER_NAME, bUsedActiveSkill);
        }
      } else {
        let pDmgTaken = bAttack; let bDmgTaken = pAttack;
        if (player.classId === 'assassin' && player.hp <= 4 && !player.usedInstinct) { pDmgTaken = 0; player.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${REAL_PLAYER_NAME} уклонился!</span><br>`; }
        else if (Math.random() < player.eqP.dodge) { pDmgTaken = 0; logMsg += `<span class="text-info">👢 Сапоги: ${REAL_PLAYER_NAME} уклонился!</span><br>`; }
        if (bot.classId === 'assassin' && bot.hp <= 4 && !bot.usedInstinct) { bDmgTaken = 0; bot.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${currentBotName} уклонился!</span><br>`; }
        else if (Math.random() < bot.eqP.dodge) { bDmgTaken = 0; logMsg += `<span class="text-info">👢 ${currentBotName} уклонился!</span><br>`; }
        if (pInvul) pDmgTaken = 0; if (bInvul) bDmgTaken = 0;
        logMsg += `<span class="text-skill">⚔️ Встречная атака!</span><br>`;
        logMsg += `🗡️ ${REAL_PLAYER_NAME} наносит ${getHitAdj(pAttack)} удар (${pAttack})<br>`;
        logMsg += `🗡️ ${currentBotName} наносит ${getHitAdj(bAttack)} удар (${bAttack})<br>`;
        if (bDmgTaken > 0) logMsg += applyDamage(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill);
        if (pDmgTaken > 0) logMsg += applyDamage(player, bot, pDmgTaken, REAL_PLAYER_NAME, bUsedActiveSkill);
      }
    } else if (!pAttacking && !bAttacking) {
      logMsg += `<span class="text-block">🛡️ Никто не атаковал.</span><br>`;
    } else if (pAttacking && !bAttacking) {
      let bDefVal = bDefending ? bBlock : 0;
      logMsg += resolveCombat(player, bot, pAttack, (pIgnore ? 0 : bDefVal), REAL_PLAYER_NAME, currentBotName, pIgnore, pUsedActiveSkill);
    } else if (!pAttacking && bAttacking) {
      let pDefVal = pDefending ? pBlock : 0;
      logMsg += resolveCombat(bot, player, bAttack, (bIgnore ? 0 : pDefVal), currentBotName, REAL_PLAYER_NAME, bIgnore, bUsedActiveSkill);
    }
  }

  if (!bot.isMob) {
    if (player.furyTurnsLeft > 0) player.furyTurnsLeft--; if (bot.furyTurnsLeft > 0) bot.furyTurnsLeft--;
    if (player.immortalTurns > 0) player.immortalTurns--; if (bot.immortalTurns > 0) bot.immortalTurns--;
  } else {
    if (player.furyTurnsLeft > 0) player.furyTurnsLeft--;
    if (player.immortalTurns > 0) player.immortalTurns--;
  }

  // ЭФФЕКТЫ (яд, HoT, пассивки)
  let effectsMsg = "";

  // Болезнь Наблюдателя — блокируем canHeal игрока
  if (bot.isMob && bot.diseaseActive) {
    player.canHeal = false;
  } else if (bot.isMob && !bot.diseaseActive) {
    player.canHeal = true;
  }

  if (player.poisoned) { player.hp -= 1; effectsMsg += `<span class="text-dmg">☠️ Яд: 1 урон ${REAL_PLAYER_NAME}!</span><br>`; effectsMsg += checkImmortality(player, REAL_PLAYER_NAME); }
  if (!bot.isMob && bot.poisoned) { bot.hp -= 1; effectsMsg += `<span class="text-heal">☠️ Яд: 1 урон ${currentBotName}!</span><br>`; effectsMsg += checkImmortality(bot, currentBotName); }

  if (!bot.isMob) {
    effectsMsg += processHoT(player, bot, REAL_PLAYER_NAME, currentBotName);
    effectsMsg += processHoT(bot, player, currentBotName, REAL_PLAYER_NAME);
  } else {
    effectsMsg += processHoT(player, bot, REAL_PLAYER_NAME, currentBotName);
    // Тик умений моба
    effectsMsg += tickMobEffects(bot, lastPlayerDmgThisTurn);
  }

  if (player.canHeal && player.hp < player.maxHp && player.eqP.healOnce > 0) {
    let deficit = player.maxHp - player.hp; let healAmt = Math.min(deficit, player.eqP.healOnce);
    player.hp += healAmt; player.eqP.healOnce -= healAmt;
    effectsMsg += `<span class="text-heal">🪖 Шлем лечит ${REAL_PLAYER_NAME} +${healAmt} ХП</span><br>`;
  }
  if (!bot.isMob && bot.canHeal && bot.hp < bot.maxHp && bot.eqP.healOnce > 0) {
    let deficit = bot.maxHp - bot.hp; let healAmt = Math.min(deficit, bot.eqP.healOnce);
    bot.hp += healAmt; bot.eqP.healOnce -= healAmt;
    effectsMsg += `<span class="text-heal">🪖 Шлем лечит ${currentBotName} +${healAmt} ХП</span><br>`;
  }
  if (player.canHeal && player.classId === 'warrior' && player.hp > 0 && player.hp <= 6) { player.hp += 1; effectsMsg += `<span class="text-heal">🩸 Боевой раж: ${REAL_PLAYER_NAME} +1 ХП</span><br>`; }
  if (!bot.isMob && bot.canHeal && bot.classId === 'warrior' && bot.hp > 0 && bot.hp <= 6) { bot.hp += 1; effectsMsg += `<span class="text-heal">🩸 Боевой раж: ${currentBotName} +1 ХП</span><br>`; }

  // ФИКС РЫЦАРЯ: сбрасываем immortalTurnActive ПОСЛЕ всех эффектов
  player.immortalTurnActive = false;
  if (!bot.isMob) bot.immortalTurnActive = false;

  if (effectsMsg !== "") {
    logMsg += `<div class="text-skill" style="margin-top: 10px; margin-bottom: 5px;">🧿 Эффекты:</div>` + effectsMsg;
  }

  if (!bot.isMob) checkSkills(player, bot, REAL_PLAYER_NAME);
  else checkSkillsPlayerOnly(player, REAL_PLAYER_NAME);

  logToScreen(logMsg); updateScreen(); checkWinner();

  if (!gameIsOver) {
    document.getElementById("turn-timer-container").style.display = "none";
    setTimeout(() => { startTurnTimer(); }, 1500);
  } else { document.getElementById("turn-timer-container").style.display = "none"; }
}

// ============================================================
// БЕССМЕРТИЕ, HoT, НАВЫКИ
// ============================================================

function checkImmortality(char, name) {
  if (char.hp <= 0 && char.classId === 'darkknight' && !char.usedImmortality) {
    char.hp = 1; char.usedImmortality = true; char.canHeal = false;
    char.immortalTurns = 2; char.immortalTurnActive = true;
    return `<span class="text-skill">💀 БЕССМЕРТИЕ! ${name} восстает из мертвых (1 ХП)!</span><br>`;
  }
  return "";
}

function processHoT(healer, target, hName, tName) {
  if (healer.hotTurnsLeft > 0) {
    let msg = "";
    if (healer.canHeal) {
      healer.hp += 2; if (healer.hp > healer.maxHp) healer.hp = healer.maxHp;
      msg = `💖 ${hName} лечит 2 ХП умением Сила жизни<br>`;
    }
    healer.hotTurnsLeft--;
    if (healer.classId === 'priest') { target.hp -= 2; msg += `🌟 Свет наносит ${tName} 2 урона!<br>`; msg += checkImmortality(target, tName); }
    return msg;
  } return "";
}

function resolveCombat(atkC, defC, aRoll, dBlock, aName, dName, ignBlock, isSkill = false) {
  let res = `🗡️ ${aName} наносит ${getHitAdj(aRoll)} удар (${aRoll})<br>`;
  if (!ignBlock) res += `🛡️ ${dName} ставит ${getBlockAdj(dBlock)} блок (${dBlock})<br>`;
  else res += `🛡️ ${dName} не может заблокировать удар!<br>`;

  if (!defC.isMob) {
    if (defC.classId === 'assassin' && defC.hp <= 4 && !defC.usedInstinct) { defC.usedInstinct = true; return res + `<span class="text-info">🌑 Инстинкт: ${dName} уклоняется!</span><br>`; }
    if (Math.random() < defC.eqP.dodge) return res + `<span class="text-info">👢 Сапоги: ${dName} уклоняется!</span><br>`;
  }

  let actualBlocked = ignBlock ? 0 : Math.min(aRoll, dBlock);
  defC.stats.dmgBlocked += actualBlocked;

  if (!defC.isMob && defC.classId === 'guardian') {
    defC.retBlocks += actualBlocked;
    while (defC.retBlocks >= 2 && defC.retBonus < 5) { defC.retBlocks -= 2; defC.retBonus += 1; }
  }

  if (aRoll > dBlock || ignBlock) {
    let dmg = ignBlock ? aRoll : (aRoll - dBlock);
    if (!defC.isMob && defC.eqP.blockPierce > 0) { let absorbed = Math.min(dmg, defC.eqP.blockPierce); dmg -= absorbed; defC.eqP.blockPierce = 0; res += `<span class="text-info">👕 Броня поглотила ${absorbed} урона!</span><br>`; }
    if (dmg > 0) res += applyDamage(defC, atkC, dmg, dName, isSkill);
  } else if (aRoll === dBlock) {
    res += `<span class="text-block">Идеальный блок!</span><br>`;
    if (!defC.isMob && defC.classId === 'guardian') { res += applyDamage(atkC, defC, 1, aName, false); res += `🗡️ <span class="text-info">Контратака!</span><br>`; }
  } else {
    let heal = dBlock - aRoll + (defC.eqP ? defC.eqP.healB : 0);
    if (defC.canHeal) {
      defC.hp = Math.min(defC.maxHp, defC.hp + heal); defC.stats.healed += heal;
      res += `✨ Избыточный блок! ${dName} +${heal} ХП<br>`;
    } else { res += `✨ Избыточный блок! Но ${dName} не может исцеляться.<br>`; }
    if (!defC.isMob && defC.classId === 'guardian') { res += applyDamage(atkC, defC, 1, aName, false); res += `🗡️ <span class="text-info">Контратака!</span><br>`; }
    if (!defC.isMob && defC.classId === 'priest') { res += applyDamage(atkC, defC, heal, aName, false); res += `🌟 Свет наносит ${aName} <span class="text-dmg">${heal} урона</span>!<br>`; }
  }
  return res;
}

function applyDamage(t, a, dmg, tName, isSkill = false) {
  let res = `💥 ${tName} получает <span class="text-dmg">${dmg} урона</span><br>`;
  t.hp -= dmg;
  if (!isSkill && a && !a.isMob) a.stats.dmgDealt += dmg;
  if (a && !a.isMob && a.classId === 'assassin') a.pursuitDmg += dmg;

  if (a && !a.isMob && a.classId === 'darkknight') {
    if (a.hp <= 4) a.courageThresholdDown = true;
    let thresh = a.courageThresholdDown ? 1 : 2;
    if (dmg >= thresh && a.canHeal) {
      let h = 1; a.hp = Math.min(a.maxHp, a.hp + h); a.stats.healed += h;
      res += `🦇 <span class="text-heal">Кураж: Тёмный Рыцарь +${h} ХП</span><br>`;
    }
  }

  if (!t.isMob && t.classId === 'priest' && t.hp <= 8 && t.hp > 0 && !t.usedPrayer && t.canHeal) {
    t.usedPrayer = true; let h = Math.min(6, t.maxHp - t.hp); t.hp += h;
    res += `🙏 <span class="text-heal">Молитва: ${tName} +${h} ХП!</span><br>`;
  }

  if (!t.isMob && t.hp <= 0 && t.classId === 'darkknight') {
    if (!t.usedImmortality) { res += checkImmortality(t, tName); }
    else if (t.immortalTurnActive) { t.hp = 1; res += `<span class="text-skill">🛡️ Смерть отступает!</span><br>`; }
  }
  return res;
}

function checkSkills(c, t, name) {
  let info = CLASSES[c.classId];
  if (!c.skillReady && c.stats[info.reqType] >= info.reqAmt) { c.skillReady = true; c.stats[info.reqType] = 0; }
  if (c.classId === 'assassin' && c.pursuitDmg >= 13 && !t.poisoned) { t.poisoned = true; logToScreen(`<span class="text-info">☠️ ${name === REAL_PLAYER_NAME ? "Враг отравлен" : "Вы отравлены"}!</span>`); }
}

function checkSkillsPlayerOnly(c, name) {
  let info = CLASSES[c.classId];
  if (!c.skillReady && c.stats[info.reqType] >= info.reqAmt) { c.skillReady = true; c.stats[info.reqType] = 0; }
  if (c.classId === 'assassin' && c.pursuitDmg >= 13 && !bot.poisoned) {
    bot.poisoned = true; logToScreen(`<span class="text-info">☠️ Враг отравлен!</span>`);
  }
}

// ============================================================
// ОБНОВЛЕНИЕ ЭКРАНА
// ============================================================

function buildSkillHtml(char) {
  if (char.isMob) {
    // Отображение для моба
    let abilitiesDesc = char.abilities.map(a => {
      if (a === 'disease') return char.diseaseActive ? `<span style="color:#ef4444">🦠 Болезнь (${char.diseaseTurnsLeft})</span>` : `🦠 Болезнь`;
      if (a === 'fate') return char.fateActive ? `<span style="color:#ef4444">😶 Судьба (${char.fateTurnsLeft})</span>` : `😶 Судьба`;
      if (a === 'submit') return char.submitActive ? `<span style="color:#ef4444">😡 Подчинись (${char.submitTurnsLeft})</span>` : `😡 Подчинись`;
      if (a === 'notover') return char.notoverUsed ? (char.notoverHotLeft > 0 ? `<span style="color:#10b981">💜 Возрождение (${char.notoverHotLeft})</span>` : `💜 Исчерпано`) : `💜 Не конец`;
      return a;
    }).join('<br>');
    return `<div class="skill-slot"><div class="skill-slot-title">${char.icon} ${char.name}</div><div class="skill-progress-text" style="color:#9ca3af; font-size:9px;">${abilitiesDesc || 'Нет умений'}</div></div>`;
  }

  let info = CLASSES[char.classId];
  let pct = Math.min(100, (char.stats[info.reqType] / info.reqAmt) * 100);
  let html = `
    <div class="skill-slot">
      <div class="skill-fill ${char.skillReady ? 'skill-ready-fill' : ''}" style="width:${char.skillReady ? 100 : pct}%"></div>
      <div class="skill-slot-title">⭐ ${info.activeName}</div>
      <div class="skill-progress-text">${char.skillReady ? 'ГОТОВ' : `${char.stats[info.reqType]}/${info.reqAmt}`}</div>
    </div>
  `;
  let p1State = "Активен"; let p2State = "Активен";
  if (char.classId === 'warrior') { p1State = char.hp <= 6 ? "Активно" : "Не активно"; p2State = char.hp <= 6 ? "Активно" : "Не активно"; }
  if (char.classId === 'assassin') {
    p1State = char.usedInstinct ? "ИСЧЕРПАН" : (char.hp <= 4 ? "ГОТОВ" : "");
    let currentDmg = Math.min(char.pursuitDmg, 13);
    p2State = char.poisoned ? "АКТИВНО" : `${currentDmg}/13`;
  }
  if (char.classId === 'guardian') { p1State = ""; p2State = `${char.retBlocks}/2 | Бонус: +${char.retBonus}`; }
  if (char.classId === 'priest') { p1State = char.usedPrayer ? "ИСЧЕРПАН" : ""; p2State = ""; }
  if (char.classId === 'darkknight') { p1State = char.courageThresholdDown ? "<span style='color:#ef4444'>Усиленный</span>" : "Обычный"; p2State = char.usedImmortality ? (char.immortalTurns > 0 ? "АКТИВНО" : "ИСЧЕРПАН") : "ГОТОВ"; }
  html += `<div class="skill-slot" style="opacity:0.8"><div class="skill-slot-title">🔵 ${info.p1}</div><div class="skill-progress-text" style="color:#9ca3af">${p1State}</div></div>`;
  html += `<div class="skill-slot" style="opacity:0.8"><div class="skill-slot-title">🔴 ${info.p2}</div><div class="skill-progress-text" style="color:#9ca3af">${p2State}</div></div>`;
  return html;
}

function updateScreen() {
  if (player.hp < 0) player.hp = 0; if (bot.hp < 0) bot.hp = 0;
  let pRank = getRank(gameData.lp);

  document.getElementById("ui-player-name").innerText = `${REAL_PLAYER_NAME} (${player.className})`;
  document.getElementById("ui-player-name").className = "char-name " + (pRank.textClass || "");
  document.getElementById("ui-player-rank").innerHTML = (pRank.iconClass ? `<span class="${pRank.iconClass}">${pRank.icon}</span> ` : `${pRank.icon} `) + (pRank.textClass ? `<span class="${pRank.textClass}">${gameData.lp} LP</span>` : `${gameData.lp} LP`);

  if (bot.isMob) {
    document.getElementById("ui-bot-name").innerText = `${bot.icon} ${bot.name}`;
    document.getElementById("ui-bot-name").className = "char-name";
    let tierLabel = bot.tier === 'boss' ? '👑 БОСС' : (bot.tier === 'elite' ? '⭐ Элитный' : 'Обычный');
    document.getElementById("ui-bot-rank").innerHTML = tierLabel;
  } else {
    let bRank = getRank(bot.lp);
    document.getElementById("ui-bot-name").innerText = `${currentBotName} (${bot.className})`;
    document.getElementById("ui-bot-name").className = "char-name " + (bRank.textClass || "");
    document.getElementById("ui-bot-rank").innerHTML = (bRank.iconClass ? `<span class="${bRank.iconClass}">${bRank.icon}</span> ` : `${bRank.icon} `) + (bRank.textClass ? `<span class="${bRank.textClass}">${bot.lp} LP</span>` : `${bot.lp} LP`);
  }

  document.getElementById("ui-player-hp-fill").style.width = (player.hp / player.maxHp) * 100 + "%";
  document.getElementById("ui-player-hp-text").innerText = `${player.hp} / ${player.maxHp}`;
  document.getElementById("ui-bot-hp-fill").style.width = (bot.hp / bot.maxHp) * 100 + "%";
  document.getElementById("ui-bot-hp-text").innerText = `${bot.hp} / ${bot.maxHp}`;

  document.getElementById("ui-player-skills").innerHTML = buildSkillHtml(player);
  document.getElementById("ui-bot-skills").innerHTML = buildSkillHtml(bot);

  if (player.immortalTurns > 0 && !gameIsOver) {
    document.getElementById("btn-attack").style.display = "none"; document.getElementById("btn-defend").style.display = "none";
    document.getElementById("btn-skill").style.display = "none"; document.getElementById("btn-immortal").style.display = "block";
  } else if (player.skillReady && !gameIsOver) {
    document.getElementById("btn-attack").style.display = "none"; document.getElementById("btn-defend").style.display = "none";
    document.getElementById("btn-immortal").style.display = "none"; document.getElementById("btn-skill").style.display = "block";
  } else if (!gameIsOver) {
    document.getElementById("btn-attack").style.display = "block"; document.getElementById("btn-defend").style.display = "block";
    document.getElementById("btn-skill").style.display = "none"; document.getElementById("btn-immortal").style.display = "none";
  }
}

function logToScreen(msg) { document.getElementById("combat-log").innerHTML = `<div class='log-entry'>${msg}</div>` + document.getElementById("combat-log").innerHTML; }

// ============================================================
// ПОБЕДА И ПОРАЖЕНИЕ
// ============================================================

function checkWinner() {
  if (player.hp <= 0 || bot.hp <= 0) {
    gameIsOver = true;
    document.getElementById("btn-attack").style.display = "none"; document.getElementById("btn-defend").style.display = "none";
    document.getElementById("btn-skill").style.display = "none"; document.getElementById("btn-immortal").style.display = "none";

    if (dungeonState) {
      // === ДАНЖ РЕЖИМ ===
      if (player.hp <= 0) {
        // Игрок погиб — данж провален
        dungeonState = null;
        document.getElementById("btn-return").style.display = "block";
        logToScreen(`<span class='text-dmg'>💀 Вы пали в ${DUNGEONS[dungeonState ? dungeonState.dungeonId : 'mansion'].name}. Прогресс потерян.</span>`);
        saveData();
      } else {
        // Победа над врагом
        let endMsg = `<span class='text-heal'>✅ ${bot.icon} ${bot.name} повержен!</span>`;

        // Лут с моба (не с босса)
        if (bot.tier !== 'boss' && bot.lootDrops) {
          let lootMsg = rollMobLoot(bot.lootDrops);
          endMsg += lootMsg;
        }

        dungeonState.enemyIndex++;
        dungeonState.playerHp = player.hp; // сохраняем HP

        if (dungeonState.enemyIndex < dungeonState.enemyQueue.length) {
          // Следующий враг на том же этаже
          endMsg += `<br><span class="text-info">Следующий враг на этаже...</span>`;
          logToScreen(endMsg);
          saveData();
          setTimeout(() => { startDungeonFight(); }, 2000);
        } else {
          // Этаж пройден
          let floorNum = dungeonState.floorIndex + 1;
          let totalFloors = DUNGEONS[dungeonState.dungeonId].floors.length;
          dungeonState.floorIndex++;

          if (dungeonState.floorIndex >= totalFloors) {
            // Данж полностью пройден — босс побеждён
            endMsg += grantBossReward(dungeonState.dungeonId);
            gameData.dungeonProgress[dungeonState.dungeonId] = totalFloors;
            dungeonState = null;
            saveData();
            document.getElementById("btn-return").style.display = "block";
            logToScreen(endMsg);
          } else {
            // Показываем экран передышки
            gameData.dungeonProgress[dungeonState.dungeonId] = floorNum;
            saveData();
            logToScreen(endMsg);
            document.getElementById("btn-return").style.display = "block";
            // Показываем кнопку "Следующий этаж"
            showFloorBreak(floorNum, totalFloors);
          }
        }
      }
    } else {
      // === АРЕНА РЕЖИМ ===
      simulateBots();
      document.getElementById("btn-return").style.display = "block";
      let endMsg = "";
      if (player.hp <= 0 && bot.hp <= 0) {
        endMsg = "<span class='text-skill'>💀 НИЧЬЯ! (LP не изменились)</span>";
      } else if (player.hp <= 0) {
        let lpLoss = calculateLpChange(gameData.lp, false); gameData.lp = Math.max(0, gameData.lp - lpLoss);
        endMsg = `<span class='text-dmg'>💀 ВЫ ПРОИГРАЛИ!</span> <span class="lp-loss">(-${lpLoss} LP)</span>`;
      } else {
        let lpGain = calculateLpChange(gameData.lp, true); gameData.lp += lpGain;
        if (!gameData.dailyGiftClaimed) {
          gameData.dailyWins = Math.min(5, (gameData.dailyWins || 0) + 1);
        }
        endMsg = `<span class='text-heal'>🏆 ПОБЕДА!</span> <span class="lp-gain">(+${lpGain} LP)</span><br>`;
        let loot = rollLoot(gameData.lp);
        if (loot) {
          if (gameData.inventory.length < gameData.maxInventory) { gameData.inventory.push(loot); endMsg += `<br><br><span class="text-${loot.rarity}">🎁 Выпал предмет: ${loot.name}! Проверьте сумку.</span>`; }
          else { gameData.imperials += SELL_PRICES[loot.rarity]; endMsg += `<br><br><span class="text-info">💰 Сумка полна! Выпавший ${loot.name} продан за ${SELL_PRICES[loot.rarity]} 🪙.</span>`; }
        }
        // Дроп ключей
        let keyMsg = rollArenaKey(gameData.lp);
        if (keyMsg) endMsg += keyMsg;

        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
      }
      saveData(); logToScreen(endMsg);
    }
  }
}

// Лут с обычного/элитного моба
function rollMobLoot(lootDrops) {
  let msg = "";
  let r = Math.random();
  let rarity = null;
  if (r < lootDrops.epic) rarity = 'epic';
  else if (r < lootDrops.epic + lootDrops.rare) rarity = 'rare';
  if (rarity) {
    let item = generateItem(rarity);
    if (gameData.inventory.length < gameData.maxInventory) {
      gameData.inventory.push(item);
      msg += `<br><span class="text-${rarity}">🎁 Дроп: ${item.name}!</span>`;
    } else {
      gameData.imperials += SELL_PRICES[rarity];
      msg += `<br><span class="text-info">💰 Сумка полна! ${item.name} продан за ${SELL_PRICES[rarity]} 🪙.</span>`;
    }
  }
  return msg;
}

// Награда за убийство босса
function grantBossReward(dungeonId) {
  let dungeon = DUNGEONS[dungeonId];
  let reward = dungeon.bossReward;
  let msg = `<br><span class="text-skill">🏆 ДАНЖ ПРОЙДЕН! ${dungeon.icon} ${dungeon.name}</span><br>`;

  // Империалы
  gameData.imperials += reward.imperials;
  msg += `<span class="text-heal">💰 +${reward.imperials} Империалов!</span><br>`;

  // Гарантированный предмет
  let r = Math.random();
  let lootRarity = r < reward.epicChance ? 'epic' : reward.guaranteedRarity;
  let lootItem = generateItem(lootRarity);
  if (gameData.inventory.length < gameData.maxInventory) {
    gameData.inventory.push(lootItem);
    msg += `<span class="text-${lootRarity}">🎁 Награда: ${lootItem.name}!</span><br>`;
  } else {
    gameData.imperials += SELL_PRICES[lootRarity];
    msg += `<span class="text-info">💰 Сумка полна! ${lootItem.name} продан за ${SELL_PRICES[lootRarity]} 🪙.</span><br>`;
  }

  // Бонусный сундук
  if (Math.random() < reward.bonusChestChance) {
    let isHuge = Math.random() < reward.bonusChestEpicChance;
    let chestType = isHuge ? 4 : 3;
    msg += `<span class="text-skill">🎲 Бонус: ${isHuge ? 'Огромный' : 'Большой'} сундук!</span><br>`;
    // Открываем сундук автоматически
    let chestRarity = 'common';
    let cr = Math.random();
    if (chestType === 3) { if (cr < 0.40) chestRarity = 'common'; else if (cr < 0.70) chestRarity = 'uncommon'; else if (cr < 0.97) chestRarity = 'rare'; else chestRarity = 'epic'; }
    else { if (cr < 0.30) chestRarity = 'common'; else if (cr < 0.60) chestRarity = 'uncommon'; else if (cr < 0.95) chestRarity = 'rare'; else chestRarity = 'epic'; }
    let chestItem = generateItem(chestRarity);
    if (gameData.inventory.length < gameData.maxInventory) {
      gameData.inventory.push(chestItem);
      msg += `<span class="text-${chestRarity}">📦 Из сундука: ${chestItem.name}!</span><br>`;
    } else {
      gameData.imperials += SELL_PRICES[chestRarity];
      msg += `<span class="text-info">💰 Сумка полна! ${chestItem.name} продан.</span><br>`;
    }
  }

  // 0.5% эпик с уником
  if (Math.random() < reward.bonusUniqueEpicChance) {
    let uniqueItem = generateItem('epic', null, true);
    msg += `<span class="text-epic" style="font-weight:900">✨ УДАЧА! Выпал уникальный эпик: ${uniqueItem.name}!</span><br>`;
    if (gameData.inventory.length < gameData.maxInventory) { gameData.inventory.push(uniqueItem); }
    else { gameData.imperials += SELL_PRICES['epic']; msg += `<span class="text-info">💰 Продан за ${SELL_PRICES['epic']} 🪙.</span><br>`; }
  }

  if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  return msg;
}

// Экран передышки между этажами
function showFloorBreak(completedFloor, totalFloors) {
  let dungeon = DUNGEONS[dungeonState.dungeonId];
  document.getElementById("controls").innerHTML = `
    <div style="width:100%; text-align:center;">
      <div style="color:#fbbf24; font-weight:900; font-size:16px; margin-bottom:10px;">
        ⚔️ Этаж ${completedFloor}/${totalFloors} пройден!
      </div>
      <div style="color:#10b981; margin-bottom:15px;">❤️ Ваше HP: ${player.hp} / ${player.maxHp}</div>
      <button class="action-btn" style="background:linear-gradient(135deg,#b45309,#f59e0b); width:100%; margin-bottom:10px;" onclick="continueToNextFloor()">
        ⚔️ Следующий этаж
      </button>
      <button class="action-btn btn-return" style="display:block; width:100%;" onclick="exitDungeon()">
        🚪 Выйти из подземелья
      </button>
    </div>
  `;
}

function continueToNextFloor() {
  // Восстанавливаем стандартные кнопки управления
  document.getElementById("controls").innerHTML = `
    <button class="action-btn btn-attack" id="btn-attack" onclick="registerAction('attack')">🗡️ Атака</button>
    <button class="action-btn btn-defend" id="btn-defend" onclick="registerAction('defend')">🛡️ Защита</button>
    <button class="action-btn btn-skill" id="btn-skill" onclick="registerAction('skill')">✨ Навык!</button>
    <button class="action-btn" id="btn-immortal" style="background: linear-gradient(135deg, #4c1d95, #000000); display: none; width: 100%; box-shadow: 0 0 15px rgba(124, 58, 237, 0.6);" onclick="registerAction('immortal')">💀 Возмездие</button>
    <button class="action-btn btn-return" id="btn-return" onclick="returnToMenu()">В меню</button>
  `;
  startDungeonFloor();
}

function exitDungeon() {
  dungeonState = null;
  returnToMenu();
}

function claimDailyGift() {
  if (gameData.dailyWins < 5 || gameData.dailyGiftClaimed) return;
  gameData.dailyGiftClaimed = true;
  gameData.keys['dusty_key'] = (gameData.keys['dusty_key'] || 0) + 1;
  saveData(); renderMainMenu();
  alert('🎁 Подарок получен! +1 🗝️ Пыльный ключ');
}

// ============================================================
// ОСМОТР ПЕРСОНАЖА
// ============================================================

function openCharModal(isPlayer) {
  if (!player.classId && !bot.isMob) return;
  let c = isPlayer ? player : bot;
  document.getElementById('modal-title').innerText = isPlayer ? "Осмотр: Вы" : `Осмотр: ${bot.isMob ? bot.name : "Враг"}`;
  document.getElementById('modal-title').className = "text-skill";
  let desc = `<b>Класс:</b> ${c.className}<br><b>ХП:</b> ${c.hp} / ${c.maxHp}<br>`;

  if (bot.isMob && !isPlayer) {
    desc += `<br><b>Тип:</b> ${c.tier === 'boss' ? '👑 Босс' : c.tier === 'elite' ? '⭐ Элитный' : '👻 Обычный'}<br>`;
    desc += `<b>Атака:</b> ${c.attackMin}-${c.attackMax} | <b>Блок:</b> ${c.blockMin}-${c.blockMax}<br>`;
    if (c.abilities.length > 0) {
      desc += `<hr style="border-color:#475569; margin:10px 0;"><b>Умения:</b><br>`;
      c.abilities.forEach(a => {
        if (a === 'disease') desc += `🦠 <b>Болезнь</b> — блокирует лечение на 3 хода<br>`;
        if (a === 'fate') desc += `😶 <b>Прими судьбу</b> — отключает блок игрока на 3 хода<br>`;
        if (a === 'submit') desc += `😡 <b>Подчинись мне</b> — x2 урон на 2 хода<br>`;
        if (a === 'notover') desc += `💜 <b>Это ещё не конец</b> — мгновенное восстановление и регенерация<br>`;
     });
    }
  } else if (!bot.isMob || isPlayer) {
    desc += `<hr style="border-color:#475569; margin:10px 0;"><b>Экипировка:</b><br><br>`;
    let hasItems = false;
    ['head', 'body', 'arms', 'legs'].forEach(s => {
      let item = c.eq[s];
      if (item) {
        hasItems = true; desc += `<b class="text-${item.rarity}">${item.name}</b> (+${item.hp} ХП)<br>`;
        if (item.perk) desc += `<span style="font-size:10px; color:#9ca3af">🔸 ${item.perk.desc}</span><br>`;
        if (item.unique) desc += `<span style="font-size:10px; color:#fbbf24">🔸 ${item.unique.desc}</span><br>`;
        desc += `<br>`;
      }
    });
    if (!hasItems) desc += `<span style="color:#9ca3af">Нет предметов</span>`;
  }

  document.getElementById('modal-desc').innerHTML = desc;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}

// ============================================================
// АРЕНЫ (таб)
// ============================================================

function renderArenas() {
  let html = '<div style="margin-bottom:15px;"><h2>Список Арен</h2><span style="font-size:12px; color:#94a3b8;">Нажмите на арену, чтобы увидеть награды</span></div><div class="class-grid">';
  let prevLp = 0;
  ARENAS.forEach((a, idx) => {
    html += `<div class="class-card ${a.arenaClass}" style="border-width: 2px;" onclick="openArenaModal(${idx})"><div class="class-title" style="color: #fff; text-shadow: 0 0 5px rgba(0,0,0,0.8);">${a.icon} ${a.name}</div><div class="class-desc" style="color: #fbbf24; font-weight: bold; text-align: center; font-size: 13px;">${prevLp} - ${a.maxLp === 99999 ? '∞' : a.maxLp} LP</div></div>`;
    prevLp = a.maxLp + 1;
  });
  html += '</div>'; document.getElementById('tab-arenas').innerHTML = html;
}

function openArenaModal(idx) {
  let a = ARENAS[idx]; let prevLp = idx === 0 ? 0 : ARENAS[idx - 1].maxLp + 1; let drops = getArenaDrops(a.maxLp === 99999 ? 3500 : a.maxLp);
  document.getElementById('modal-title').innerText = `${a.icon} ${a.name}`; document.getElementById('modal-title').className = "text-skill";
  let desc = `<div style="text-align:center; margin-bottom: 10px; font-weight:bold;">${prevLp} - ${a.maxLp === 99999 ? '∞' : a.maxLp} LP</div><hr style="border-color:#475569; margin:10px 0;"><b>Шансы за победу:</b><br><br>`;
  if (drops.common > 0) desc += `<span class="text-common">Обычный:</span> ${(drops.common * 100).toFixed(1)}%<br>`;
  if (drops.uncommon > 0) desc += `<span class="text-uncommon">Необычный:</span> ${(drops.uncommon * 100).toFixed(1)}%<br>`;
  if (drops.rare > 0) desc += `<span class="text-rare">Редкий:</span> ${(drops.rare * 100).toFixed(1)}%<br>`;
  if (drops.epic > 0) desc += `<span class="text-epic">Эпический:</span> ${(drops.epic * 100).toFixed(1)}%<br>`;
  let emptyChance = 1 - (drops.common + drops.uncommon + drops.rare + drops.epic);
  if (emptyChance > 0.001) desc += `<br><span style="color:#64748b">Ничего не выпадет: ${(emptyChance * 100).toFixed(1)}%</span><br>`;

  // Добавляем инфу о ключах
  let keyInfo = "";
  Object.values(DUNGEONS).forEach(dungeon => {
    if (a.maxLp >= dungeon.keyArenaMinLp) {
      keyInfo += `<br>🗝️ <b>${dungeon.keyName}:</b> ${(dungeon.keyArenaDropChance * 100).toFixed(0)}% шанс<br>`;
    }
  });
  if (keyInfo) desc += `<br><b>Ключи подземелий:</b>${keyInfo}`;

  document.getElementById('modal-desc').innerHTML = desc;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}

// ============================================================
// СТАРТ
// ============================================================

renderMainMenu();
