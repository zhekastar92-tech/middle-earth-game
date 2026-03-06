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
  activeVictoryEffect: null
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

// ============================================================
// ЕЖЕДНЕВНЫЙ СБРОС
// ============================================================

function getTodayDate() {
  let d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function checkDailyReset() {
  let today = getTodayDate();
  if (gameData.lastDailyDate !== today) {
    gameData.dailyWins = 0;
    gameData.dailyGiftClaimed = false;
    gameData.lastDailyDate = today;
    saveData();
  }
}

checkDailyReset();

// Миграция экипировки для новых классов
Object.keys(CLASSES).forEach(cls => {
  if (!gameData.equip[cls]) {
    gameData.equip[cls] = { head: null, body: null, arms: null, legs: null };
  }
});

// DUNGEONS и DUNGEON_MOBS — см. dungeons.js

// dungeonState и функции подземелья — см. dungeons.js

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

let needsLbReset = !gameData.leaderboard || gameData.leaderboard.length === 0 || gameData.leaderboard.every(b => b.lp < 3000);
if (needsLbReset) {
  gameData.leaderboard = BOT_NAMES.map(name => ({ name: name, lp: Math.floor(Math.random() * 1001) + 7000 }));
}

function saveData() {
  localStorage.setItem('middleEarthData', JSON.stringify(gameData));
  // Автоматически обновляем резервный код при каждом сохранении
  try {
    let code = encodeProfile();
    if (code) {
      localStorage.setItem('middleEarthBackup', JSON.stringify({
        code: code,
        ts: Date.now()
      }));
    }
  } catch(e) {}
}

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
  else if (lp <= 6000) { if (isWin) { min = 10; max = 15; } else { min = 15; max = 20; } }
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
  if (tabId === 'tab-premium') renderPremiumShop();
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
  gameData.leaderboard.forEach((b, idx) => {
    // Проверяем: нужен ли буст (упал ниже 6500 и буст ещё не назначен)
    if (b.lp < 6500 && !gameData.botBoostWins[idx]) {
      gameData.botBoostWins[idx] = 100; // назначаем 100 бустовых боёв
    }

    let isBoosted = gameData.botBoostWins[idx] > 0;
    let winChance = isBoosted ? 0.90 : 0.50;
    let isWin = Math.random() < winChance;
    let change = Math.floor(Math.random() * 6) + 5;

    if (isWin) {
      b.lp += change;
    } else {
      b.lp = Math.max(0, b.lp - change);
    }

    // Тикаем счётчик буста
    if (isBoosted) {
      gameData.botBoostWins[idx]--;
      if (gameData.botBoostWins[idx] <= 0) {
        delete gameData.botBoostWins[idx]; // буст закончился
      }
    }
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
// ЛЕГЕНДАРНЫЕ ПРЕДМЕТЫ
// ============================================================

const LEGENDARY_ITEMS = {
  guardian_body: {
    id: 'guardian_body',
    classId: 'guardian',
    name: 'Доспех Священного Стража',
    slot: 'body',
    rarity: 'legendary',
    hpMin: 5, hpMax: 6,
    perk: null,   // генерируется при создании: block_pierce 4-5
    unique: null, // [УНИК] +1 блок
    legendary: null // [ЛЕГ] +1-3 к blockStreakMax
  }
};

function generateLegendaryArmor() {
  gameData.nextItemId++;
  let bp = 4 + Math.floor(Math.random() * 2); // 4 или 5
  let legBonus = 1 + Math.floor(Math.random() * 3); // 1, 2 или 3
  let hp = 5 + Math.floor(Math.random() * 2);
  return {
    id: gameData.nextItemId,
    classId: 'guardian',
    name: 'Доспех Священного Стража',
    slot: 'body',
    rarity: 'legendary',
    hp: hp,
    perk:    { type: 'block_pierce', val: bp, desc: `Блокирует ${bp} пробитого урона (1 раз).` },
    unique:  { type: 'blockBonus',   val: 1,  desc: `[УНИК] +1 ко всем блокам.` },
    legendary: { type: 'blockStreakBonus', val: legBonus, desc: `[ЛЕГ] +${legBonus} к макс. блокам подряд.` }
  };
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

  // Кнопка титула (легендарная + мифическая гача)
  let titleEl = document.getElementById('hero-title-btn');
  if (titleEl) {
    // Определяем активный титул — сначала мифический, потом обычный
    let classId = gameData.currentClass;
    let mt = gameData.mythicTitles[classId];
    let td = gameData.titles[classId];
    let mythicPool = MYTHIC_GACHA_POOLS[classId];
    let legendPool = GACHA_POOLS[classId];

    let titleDisplay = '';
    // Проверяем мифический активный
    if (mt && mt.active === 'mythic' && mythicPool) {
      titleDisplay = getTitleHtml('mythic', mythicPool.titles.mythic.name);
    } else if (mt && mt.active && mt.active !== 'mythic' && mythicPool && mythicPool.titles[mt.active]) {
      titleDisplay = getTitleHtml(mt.active, mythicPool.titles[mt.active].name);
    } else if (td && td.active && legendPool && legendPool.titles[td.active]) {
      titleDisplay = getTitleHtml(td.active, legendPool.titles[td.active].name);
    } else {
      titleDisplay = '<span style="color:#475569;">Без титула</span>';
    }

    // Активная рамка
    let frameName = gameData.cardFrame && FRAME_META[gameData.cardFrame] ? FRAME_META[gameData.cardFrame].name : '<span style="color:#475569;">Ранговая</span>';
    // Активный эффект появления
    let effectName = gameData.entryEffect && ENTRY_EFFECT_META[gameData.entryEffect] ? ENTRY_EFFECT_META[gameData.entryEffect].name : '<span style="color:#475569;">Нет</span>';
    // Активный эффект победы
    let victoryName = gameData.activeVictoryEffect && VICTORY_EFFECT_META[gameData.activeVictoryEffect] ? VICTORY_EFFECT_META[gameData.activeVictoryEffect].name : '<span style="color:#475569;">Нет</span>';

    titleEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:12px; padding:14px 16px; cursor:pointer;" onclick="openTitleModal()">
          <div>
            <div style="font-size:11px; color:#64748b; margin-bottom:4px;">👑 Активный титул</div>
            <div style="font-size:14px;">${titleDisplay}</div>
          </div>
          <div style="color:#475569; font-size:18px;">›</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:12px; padding:14px 16px; cursor:pointer;" onclick="openEntryEffectModal()">
          <div>
            <div style="font-size:11px; color:#64748b; margin-bottom:4px;">✨ Эффект появления</div>
            <div style="font-size:14px;">${effectName}</div>
          </div>
          <div style="color:#475569; font-size:18px;">›</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:12px; padding:14px 16px; cursor:pointer;" onclick="openVictoryEffectModal()">
          <div>
            <div style="font-size:11px; color:#64748b; margin-bottom:4px;">🏆 Эффект победы</div>
            <div style="font-size:14px;">${victoryName}</div>
          </div>
          <div style="color:#475569; font-size:18px;">›</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:12px; padding:14px 16px; cursor:pointer;" onclick="openCardFrameModal()">
          <div>
            <div style="font-size:11px; color:#64748b; margin-bottom:4px;">🖼️ Рамка карточки</div>
            <div style="font-size:14px;">${frameName}</div>
          </div>
          <div style="color:#475569; font-size:18px;">›</div>
        </div>
      </div>`;
  }
}

function updateBagTab() {
  document.getElementById('bag-count').innerText = gameData.inventory.length;
  document.getElementById('bag-max').innerText = gameData.maxInventory;
  document.getElementById('imperial-amount').innerText = gameData.imperials;
  let shopBal = document.getElementById('shop-imperial-amount'); if (shopBal) shopBal.innerText = gameData.imperials;

  // Сетка инвентаря
  let grid = document.getElementById('inventory-grid'); grid.innerHTML = '';
  for (let i = 0; i < gameData.maxInventory; i++) {
    let item = gameData.inventory[i];
    if (item) { grid.innerHTML += `<div class="inv-slot rarity-${item.rarity} filled" onclick="openItemModalById('${item.id}', false)"><b>${item.name}</b><br>+${item.hp} ХП</div>`; }
    else { grid.innerHTML += `<div class="inv-slot">Пусто</div>`; }
  }

  // Подсумок
  let pouchEl = document.getElementById('pouch-section');
  if (!pouchEl) return;
  let slots = gameData.pouch.slots;
  if (slots === 0) {
    pouchEl.innerHTML = `
      <div style="margin-top:20px; background:rgba(30,41,59,0.7); border:1px dashed #475569; border-radius:12px; padding:15px; text-align:center; color:#64748b; font-size:13px;">
        🧰 Подсумок не куплен<br>
        <span style="font-size:11px;">Купите слоты у Герольда Кожевника в Магазине</span>
      </div>`;
    return;
  }
  let pouchGrid = '';
  for (let i = 0; i < slots; i++) {
    let potion = gameData.pouch.items[i];
    if (potion) {
      pouchGrid += `<div class="inv-slot pouch-slot filled" style="border-color:#7c3aed; background:rgba(124,58,237,0.15);">
        <span style="font-size:16px;">🧪</span><br>
        <b style="font-size:9px; color:#e9d5ff;">${potion.name.replace('🧪 ', '')}</b><br>
        <span style="font-size:9px; color:#a78bfa;">+${potion.heal} ХП</span>
      </div>`;
    } else {
      pouchGrid += `<div class="inv-slot pouch-slot" style="border-color:#4c1d95; color:#6d28d9;">Пусто</div>`;
    }
  }
  pouchEl.innerHTML = `
    <div style="margin-top:20px;">
      <h3 style="text-align:left; font-size:14px; margin-bottom:10px; color:#a78bfa;">🧰 Подсумок (${gameData.pouch.items.length}/${slots})</h3>
      <div class="inventory-grid">${pouchGrid}</div>
    </div>`;
}

function getSlotIcon(slot) { return { head: "🪖", body: "👕", arms: "🧤", legs: "👢" }[slot]; }

function openItemModalById(id, equipped) {
  let currentEq = gameData.equip[gameData.currentClass];
  let item = equipped ? Object.values(currentEq).find(i => i && String(i.id) === String(id)) : gameData.inventory.find(i => i && String(i.id) === String(id));
  if (!item) return; selectedItem = item; isEquipped = equipped;
  document.getElementById('modal-title').innerText = item.name;
  document.getElementById('modal-title').className = `text-${item.rarity}`;
  let desc = `<b>Слот:</b> ${SLOT_NAMES[item.slot]}<br><b>Бонус:</b> +${item.hp} Макс ХП<br>`;
  if (item.perk) desc += `<br>🔸 ${item.perk.desc}`; if (item.unique) desc += `<br><b style="color:#fbbf24">${item.unique.desc}</b>`; if (item.legendary) desc += `<br><b style="color:#f59e0b; text-shadow:0 0 8px rgba(245,158,11,0.6);">${item.legendary.desc}</b>`; if (item.classId) desc += `<br><span style="color:#64748b; font-size:11px;">Только для: ${CLASSES[item.classId]?.name || item.classId}</span>`;
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
function closeModal() { document.getElementById('item-modal').style.display = 'none'; let cb = document.getElementById('modal-close-btn'); if (cb) cb.style.display = 'block'; }

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
  saveData(); updateBagTab(); renderShop();
  openChestModal(item, type);
}

const CHEST_DATA = [
  null,
  { name: 'Сундучок',      icon: '📦' },
  { name: 'Сундук',        icon: '🗃️' },
  { name: 'Большой сундук',icon: '🧳' },
  { name: 'Огромный сундук',icon: '💎' }
];

function openChestModal(item, chestType) {
  const rarityGlow = { common: '#94a3b8', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7' };
  const rarityLabel = { common: 'ОБЫЧНЫЙ', uncommon: 'НЕОБЫЧНЫЙ', rare: 'РЕДКИЙ', epic: 'ЭПИЧЕСКИЙ' };
  const color = rarityGlow[item.rarity];
  const chest = CHEST_DATA[chestType];

  document.getElementById('modal-title').innerHTML = `${chest.icon} ${chest.name}`;
  document.getElementById('modal-title').style.cssText = 'color:#fbbf24; font-size:18px;';
  document.getElementById('modal-title').className = '';

  document.getElementById('modal-desc').style.cssText = 'background:transparent; padding:0;';
  document.getElementById('modal-desc').innerHTML = `
    <div style="text-align:center; padding:10px 0;">
      <div style="position:relative; display:inline-block; margin-bottom:12px;">
        <div style="
          width:80px; height:80px; border-radius:50%;
          background: radial-gradient(circle, ${color}33, transparent 70%);
          border: 2px solid ${color};
          box-shadow: 0 0 30px ${color}, 0 0 60px ${color}44;
          display:flex; align-items:center; justify-content:center;
          font-size:40px; margin:0 auto;
          animation: chestPulse 0.8s ease-in-out infinite alternate;
        ">${chest.icon}</div>
      </div>
      <div style="
        display:inline-block; padding:4px 14px; border-radius:20px;
        border: 1px solid ${color}; color:${color};
        background: ${color}22; font-size:11px; font-weight:900;
        letter-spacing:2px; margin-bottom:12px;
      ">${rarityLabel[item.rarity]}</div>
      <div class="text-${item.rarity}" style="font-size:18px; font-weight:900; margin:10px 0 6px;">${item.name}</div>
      <div style="color:#94a3b8; font-size:13px; margin-bottom:6px;">${SLOT_NAMES[item.slot]} · +${item.hp} Макс ХП</div>
      ${item.perk ? `<div style="color:#38bdf8; font-size:12px; margin-top:6px;">🔸 ${item.perk.desc}</div>` : ''}
      ${item.unique ? `<div style="color:#fbbf24; font-size:12px; margin-top:4px; font-weight:bold;">${item.unique.desc}</div>` : ''}
      ${item.legendary ? `<div style="color:#f59e0b; font-size:12px; margin-top:4px; font-weight:bold; text-shadow:0 0 6px rgba(245,158,11,0.5);">${item.legendary.desc}</div>` : ''}
      ${item.classId ? `<div style="color:#64748b; font-size:11px; margin-top:4px;">Только для: ${CLASSES[item.classId]?.name || item.classId}</div>` : ''}
      <div style="color:#64748b; font-size:11px; margin-top:14px;">Цена продажи: ${SELL_PRICES[item.rarity]} 🪙</div>
    </div>
  `;

  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:#22c55e; flex:1;" onclick="closeModal()">В сумку ✓</button>
    <button class="action-btn" style="background:#ef4444; flex:1;" onclick="sellChestItem()">Продать ${SELL_PRICES[item.rarity]} 🪙</button>
  `;
  selectedItem = item; isEquipped = false;
  document.getElementById('item-modal').style.display = 'flex';
}

function sellChestItem() {
  gameData.imperials += SELL_PRICES[selectedItem.rarity];
  gameData.inventory = gameData.inventory.filter(i => i.id !== selectedItem.id);
  saveData(); closeModal(); updateBagTab();
  if (document.getElementById('tab-shop').classList.contains('active')) renderShop();
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
  let slotCost = getNextSlotCost();
  let pity = gameData.hugeChestPity || 0;

  let keysHtml = '';
  Object.values(DUNGEONS).forEach(dungeon => {
    if (!dungeon.keyShopPrice) return; // ключ нельзя купить за золото
    let owned = gameData.keys[dungeon.keyId] || 0;
    let canBuy = gameData.imperials >= dungeon.keyShopPrice;
    keysHtml += `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.6); padding:10px; border-radius:8px; margin-bottom:8px;"><div><div style="font-weight:bold; color:#fbbf24;">${dungeon.keyName}</div><div style="font-size:11px; color:#94a3b8;">Имеется: ${owned} шт.</div></div><button class="action-btn" style="background:${canBuy ? '#b45309' : '#475569'}; padding:8px 12px; font-size:12px; flex:0;" ${!canBuy ? 'disabled' : ''} onclick="buyDungeonKey('${dungeon.keyId}')">${dungeon.keyShopPrice} 🪙</button></div>`;
  });

  let pc = getPouchSlotCost();
  let pouchHtml = pc
    ? `<button class="action-btn" style="background:${gameData.imperials >= pc ? '#0e7490' : '#475569'}; padding:10px; width:100%; font-size:12px;" ${gameData.imperials < pc ? 'disabled' : ''} onclick="buyPouchSlot()">🧰 +1 слот подсумка — ${pc} 🪙</button>`
    : `<div style="color:#22c55e; font-size:12px; padding:8px 0;">✅ Подсумок максимален (6 слотов)</div>`;
  let bagHtml = slotCost
    ? `<button class="action-btn" style="background:${gameData.imperials >= slotCost ? '#0f766e' : '#475569'}; padding:10px; width:100%; font-size:12px;" ${gameData.imperials < slotCost ? 'disabled' : ''} onclick="buyBagSlots()">🎒 +3 слота сумки — ${slotCost} 🪙</button>`
    : `<div style="color:#22c55e; font-size:12px; padding:8px 0;">✅ Сумка максимальна (18 слотов)</div>`;

  let html = `
    <div class="class-card" style="border:2px solid #0d9488; text-align:left; background:rgba(5,25,20,0.85); box-shadow:0 0 15px rgba(13,148,136,0.2);">
      <div class="class-title" style="color:#2dd4bf;">🎒 Герольд Кожевник</div>
      <div class="class-desc" style="margin-bottom:12px; color:#94a3b8;">Мастер кожевного дела. Расширяет сумку и подсумок.</div>
      <div style="display:flex; justify-content:space-between; font-size:11px; color:#5eead4; margin-bottom:10px;"><span>🎒 Сумка: ${gameData.maxInventory}/18</span><span>🧰 Подсумок: ${gameData.pouch.slots}/6</span></div>
      <div style="display:flex; flex-direction:column; gap:8px;">${bagHtml}${pouchHtml}</div>
    </div>

    <div class="class-card" style="margin-top:16px; border:2px solid #b45309; text-align:left; background:rgba(30,20,5,0.8);">
      <div class="class-title" style="color:#f59e0b">🧕🏿 Дядюшка Ибн</div>
      <div class="class-desc" style="margin-bottom:10px;">Торгует ключами от подземелий. Знает все тайные входы.</div>
      ${keysHtml}
    </div>

    <div class="class-card" style="margin-top:16px; border:2px solid #7c3aed; text-align:left; background:rgba(20,10,40,0.8);">
      <div class="class-title" style="color:#c084fc">🔮 Лавка алхимика</div>
      <div class="class-desc" style="margin-bottom:10px;">Зелья для подземелий. Подсумок: ${gameData.pouch.items.length}/${gameData.pouch.slots} слотов.</div>
      ${Object.values(POTIONS).map(p => `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.6); padding:10px; border-radius:8px; margin-bottom:8px;"><div><div style="font-weight:bold; color:#e9d5ff;">${p.name}</div><div style="font-size:11px; color:#94a3b8;">+${p.heal} ХП</div></div><button class="action-btn" style="background:${gameData.imperials >= p.cost && gameData.pouch.items.length < gameData.pouch.slots ? '#6d28d9' : '#475569'}; padding:8px 12px; font-size:12px; flex:0;" ${gameData.imperials < p.cost || gameData.pouch.items.length >= gameData.pouch.slots ? 'disabled' : ''} onclick="buyPotion('${p.id}')">${p.cost} 🪙</button></div>`).join('')}
    </div>

    <div class="class-card" style="margin-top:16px; border:2px solid #e11d48; text-align:left; background:rgba(25,5,10,0.95); box-shadow:0 0 25px rgba(225,29,72,0.25);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div class="class-title" style="color:#fb7185; margin:0; font-size:20px;">🎲 Азартный Бак</div>
        <div style="font-size:11px; color:#f43f5e; font-weight:bold; background:rgba(225,29,72,0.15); padding:4px 10px; border-radius:12px; border:1px solid #e11d48;">Гарант: ${pity}/100</div>
      </div>
      <div class="class-desc" style="margin-bottom:14px;">Вскрывает сундуки с экипировкой.</div>
      <div style="display:flex; flex-direction:column; gap:10px;">

        <div onclick="buyChest(1)" style="display:flex; align-items:center; gap:12px; background:rgba(30,30,35,0.9); border:1px solid #6b7280; border-radius:12px; padding:12px; cursor:pointer;">
          <div style="font-size:28px; flex-shrink:0;">📦</div>
          <div style="flex:1; text-align:left;">
            <div style="font-weight:bold; color:#9ca3af; font-size:14px; margin-bottom:3px;">Сундучок</div>
            <div style="font-size:10px; color:#64748b;">85% Обычный · 14% Необычный · 1% Редкий</div>
          </div>
          <div style="background:#374151; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:13px; white-space:nowrap; flex-shrink:0;">100 🪙</div>
        </div>

        <div onclick="buyChest(2)" style="display:flex; align-items:center; gap:12px; background:rgba(5,25,10,0.9); border:1px solid #22c55e; border-radius:12px; padding:12px; cursor:pointer; box-shadow:0 0 8px rgba(34,197,94,0.2);">
          <div style="font-size:28px; flex-shrink:0;">🗃️</div>
          <div style="flex:1; text-align:left;">
            <div style="font-weight:bold; color:#22c55e; font-size:14px; margin-bottom:3px;">Сундук</div>
            <div style="font-size:10px; color:#64748b;">60% Обычный · 20% Необычный · 19% Редкий · <span style="color:#22c55e">1% Эпик</span></div>
          </div>
          <div style="background:#15803d; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:13px; white-space:nowrap; flex-shrink:0;">300 🪙</div>
        </div>

        <div onclick="buyChest(3)" style="display:flex; align-items:center; gap:12px; background:rgba(5,10,30,0.9); border:1px solid #3b82f6; border-radius:12px; padding:12px; cursor:pointer; box-shadow:0 0 8px rgba(59,130,246,0.25);">
          <div style="font-size:28px; flex-shrink:0;">🧳</div>
          <div style="flex:1; text-align:left;">
            <div style="font-weight:bold; color:#60a5fa; font-size:14px; margin-bottom:3px;">Большой сундук</div>
            <div style="font-size:10px; color:#64748b;">40% Обычный · 30% Необычный · 27% Редкий · <span style="color:#60a5fa">3% Эпик</span></div>
          </div>
          <div style="background:#1d4ed8; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:13px; white-space:nowrap; flex-shrink:0;">500 🪙</div>
        </div>

        <div onclick="buyChest(4)" style="display:flex; align-items:center; gap:12px; background:rgba(20,5,40,0.95); border:2px solid #a855f7; border-radius:12px; padding:14px; cursor:pointer; box-shadow:0 0 15px rgba(168,85,247,0.35), inset 0 0 20px rgba(168,85,247,0.05);">
          <div style="font-size:34px; flex-shrink:0;">💎</div>
          <div style="flex:1; text-align:left;">
            <div style="font-weight:bold; color:#d8b4fe; font-size:15px; margin-bottom:3px;">Огромный сундук</div>
            <div style="font-size:10px; color:#64748b;">30% Обычный · 30% Необычный · 35% Редкий · <span style="color:#d8b4fe; font-weight:bold;">5% Эпик</span></div>
            <div style="color:#9333ea; font-size:10px; margin-top:4px;">✨ Гарант уникального эпика каждые 100 открытий</div>
          </div>
          <div style="background:#6b21a8; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:13px; white-space:nowrap; flex-shrink:0;">1000 🪙</div>
        </div>

      </div>
    </div>`;

  document.getElementById('shop-content').innerHTML = html;
}

// renderDungeons — см. dungeons.js

// ============================================================
// БОЙ — ИНИЦИАЛИЗАЦИЯ
// ============================================================

let player = {}; let bot = {}; let gameIsOver = false;
let turnTimerId = null; let turnTimeLeft = 4000; const TURN_DURATION = 4000;
let queuedPlayerAction = 'skip'; let isTurnActive = false; let currentBotName = "Player";
let turnCount = 1;
let lastPlayerDmgThisTurn = 0; // для триггера Подчинись мне
let lastMobDmgThisTurn = 0;    // для триггера doom Хранителя (сколько урона нанёс моб игроку)

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
    if (item.legendary) {
      if (item.legendary.type === 'blockStreakBonus') p.blockStreakBonus = item.legendary.val;
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
    blockStreak: 0,      // сколько блоков подряд поставлено
    blockStreakMax: 3 + (parsePerks(eq).blockStreakBonus || 0), // +бонус от легендарного доспеха
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
  let botClassId = keys[Math.floor(Math.random() * keys.length)];
  bot = initChar(botClassId, true, botLp);
  let botTitleRarity = rollBotTitle(botClassId);
  bot.activeTitle = botTitleRarity ? { rarity: botTitleRarity, name: GACHA_POOLS[botClassId].titles[botTitleRarity].name } : null;
  gameIsOver = false; turnCount = 1; lastPlayerDmgThisTurn = 0; lastMobDmgThisTurn = 0;
  currentBotName = "Player " + (Math.floor(Math.random() * 999) + 1);
  let currentArena = getArena(gameData.lp); let pRank = getRank(player.lp); let bRank = getRank(bot.lp);
  document.getElementById("battle-arena").className = "arena " + currentArena.arenaClass;
  // Применяем пользовательскую рамку (приоритет над ранговой)
  let playerCardClass = "character ";
  if (gameData.cardFrame && FRAME_META[gameData.cardFrame]) {
    playerCardClass += "has-frame " + FRAME_META[gameData.cardFrame].class;
  } else {
    playerCardClass += pRank.borderClass;
  }
  document.getElementById("player-card").className = playerCardClass;
  document.getElementById("bot-card").className = "character " + bRank.borderClass;
  applyFrameToCard(document.getElementById("player-card"), gameData.cardFrame);
  document.getElementById("combat-log").innerHTML = `<div class='log-entry text-skill'>⚔️ Локация: ${currentArena.icon} ${currentArena.name}! Бой начинается.</div>`;
  document.getElementById("btn-return").style.display = "none";
  updateScreen(); switchTab(null, "tab-battle");
  // Скрываем карточку ДО показа battle-screen (ещё невидима)
  let playerCard = document.getElementById("player-card");
  let hasEntryEffect = gameData.entryEffect && ENTRY_EFFECT_META[gameData.entryEffect];
  if (hasEntryEffect) {
    playerCard.classList.add("entry-hidden");
  }
  document.getElementById("main-screen").style.display = "none";
  document.getElementById("battle-screen").style.display = "block";
  playEntryEffect(playerCard, function() { startTurnTimer(); });
}

// ============================================================
// ЭФФЕКТ ПОЯВЛЕНИЯ В БОЮ
// ============================================================

// ============================================================
// СПАУНЕРЫ ЧАСТИЦ ДЛЯ РАМОК
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
  renderMainMenu();
  document.getElementById("main-screen").style.display = "block";
  document.getElementById("battle-screen").style.display = "none";
}

function rollDice() { return Math.floor(Math.random() * 3) + 1; }

// ============================================================
// ОСНОВНОЙ ХОД
// ============================================================

// Применяет урон к мобу с учётом эффектов hiss и stone_skin
function applyDmgToMob(mob, attacker, dmg, mobName, isSkill) {
  if (mob.hissActive && dmg > 0) {
    dmg = Math.max(0, dmg - 1);
    if (dmg === 0) return `<span class="text-info">🐉 «Как ты с-с-смеешь» поглощает весь урон!</span><br>`;
  }
  let msg = applyDamage(mob, attacker, dmg, mobName, isSkill);
  // Каменная кожа — отражает урон игроку после получения удара
  if (mob.stoneSkinReflect && dmg > 0 && attacker === player) {
    let reflect = mob.stoneSkinReflect;
    player.hp = Math.max(0, player.hp - reflect);
    msg += `<span class="text-dmg">🗿 Каменная кожа: ${reflect} урона отражено обратно!</span><br>`;
  }
  return msg;
}

function playTurn(playerChoice) {
  if (gameIsOver) return;
  lastPlayerDmgThisTurn = 0;
  lastMobDmgThisTurn = 0;

  // Переключаем на порабощённого если хранитель его только что призвал
  if (bot.isMob && bot.summonActive && dungeonState && dungeonState.slave && bot !== dungeonState.slave) {
    dungeonState.slaveKeeper = bot;
    bot = dungeonState.slave;
    currentBotName = bot.name;
    document.getElementById("bot-card").className = "character border-mob-normal";
    document.getElementById("combat-log").innerHTML += `<div class="log-entry"><span class="text-dmg">👳🏻‍♂️ Порабощённый вступает в бой! Победите его, чтобы продолжить.</span></div>`;
    updateScreen();
  }

  let logMsg = `<div style="text-align:center; font-weight:900; color:#fbbf24; margin: 15px 0 10px 0; border-top: 1px solid #475569; padding-top: 10px;">━━━━━ Ход ${turnCount} ━━━━━</div>`;
  turnCount++;

  if (playerChoice === 'skip') { logMsg += `<span class="text-block">⏳ Вы не успели сделать выбор и пропускаете ход!</span><br>`; }

  // Проверяем умения моба ДО хода (только триггеры не зависящие от урона)
  if (bot.isMob) {
    logMsg += checkMobAbilitiesPreTurn(bot);
  }

  let botChoice;
  if (bot.isMob) {
    // Моб: просто атакует каждый ход
    botChoice = 'attack';
  } else {
    if (bot.immortalTurns > 0) {
      botChoice = 'immortal';
    } else if (bot.skillReady) {
      botChoice = 'skill';
    } else if (bot.blockStreak >= bot.blockStreakMax) {
      // Три блока подряд — принудительная атака
      botChoice = 'attack';
    } else {
      botChoice = Math.random() < 0.5 ? 'attack' : 'defend';
    }
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
    // Хранитель: Здесь твоя погибель — блок игрока = 0
    if (bot.doomActive) {
      pBlock = 0;
      logMsg += `<span class="text-dmg">💀 «Здесь твоя погибель...» — вы не можете блокировать! (осталось ${bot.doomTurnsLeft} хода)</span><br>`;
    }
    // Морской дракон: Устрашение — снижает атаку и блок игрока (до min 1)
    if (bot.waterBlastActive) {
      pAttack = Math.max(1, pAttack - 1);
      pBlock  = Math.max(1, pBlock  - 1);
      logMsg += `<span class="text-dmg">😨 Устрашение: ваши атака и блок снижены на 1! (осталось ${bot.waterBlastTurnsLeft} хода)</span><br>`;
    }
    // Хранитель: Угнетение — базовая атака = 1, бонусы от умений/предметов сохраняются
    if (bot.suppressActive) {
      pAttack = 1;
      logMsg += `<span class="text-dmg">😵 Угнетение: ваша атака = 1! (осталось ${bot.suppressTurnsLeft} хода)</span><br>`;
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

  // Обновляем счётчики блоков подряд
  if (playerChoice === 'defend') {
    player.blockStreak++;
  } else if (playerChoice !== 'skip') {
    // атака, навык, бессмертие — сбрасываем счётчик
    player.blockStreak = 0;
  }
  if (!bot.isMob) {
    if (botChoice === 'defend') {
      bot.blockStreak++;
    } else {
      bot.blockStreak = 0;
    }
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
          if (bDmgTaken > 0) { logMsg += applyDmgToMob(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill); lastPlayerDmgThisTurn += Math.max(0, bot.hissActive ? bDmgTaken - 1 : bDmgTaken); }
        }
      } else {
        logMsg += `<span class="text-skill">⚔️ Встречная атака!</span><br>`;
        logMsg += `🗡️ ${REAL_PLAYER_NAME} наносит ${getHitAdj(pAttack)} удар (${pAttack})<br>`;
        logMsg += `🗡️ ${currentBotName} наносит ${getHitAdj(bAttack)} удар (${bAttack})<br>`;
        // Игрок атакует моба — моб блокирует своим bBlock
        let bDmgTaken = Math.max(0, pAttack - bBlock);
        if (bBlock > 0) logMsg += `<span class="text-block">🛡️ ${currentBotName} блокирует ${bBlock} урона!</span><br>`;
        if (bDmgTaken > 0) { logMsg += applyDmgToMob(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill); lastPlayerDmgThisTurn += Math.max(0, bot.hissActive ? bDmgTaken - 1 : bDmgTaken); }
        // Моб атакует игрока
        let pDmgTaken = bAttack;
        if (Math.random() < player.eqP.dodge) { pDmgTaken = 0; logMsg += `<span class="text-info">👢 Сапоги: ${REAL_PLAYER_NAME} уклонился!</span><br>`; }
        if (player.classId === 'assassin' && player.hp <= 4 && !player.usedInstinct) { pDmgTaken = 0; player.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${REAL_PLAYER_NAME} уклонился!</span><br>`; }
        if (pInvul) pDmgTaken = 0;
        if (pDmgTaken > 0) { logMsg += applyDamage(player, bot, pDmgTaken, REAL_PLAYER_NAME, bUsedActiveSkill); lastMobDmgThisTurn += pDmgTaken; }
      }
    } else if (!pAttacking) {
      // Игрок защищается — моб всё равно атакует
      let hpBefore = player.hp;
      logMsg += resolveCombat(bot, player, bAttack, pBlock, currentBotName, REAL_PLAYER_NAME, false, false);
      lastMobDmgThisTurn += Math.max(0, hpBefore - player.hp);
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

  // checkMobSubmitTrigger вызывается ПОСЛЕ фазы эффектов — см. ниже

  // Тикаем fury/immortal бота (не игрока — игрок тикается после updateScreen)
  if (!bot.isMob) {
    if (player.furyTurnsLeft > 0) player.furyTurnsLeft--;
    if (bot.furyTurnsLeft > 0) bot.furyTurnsLeft--;
    if (bot.immortalTurns > 0) bot.immortalTurns--;
  } else {
    if (player.furyTurnsLeft > 0) player.furyTurnsLeft--;
  }

  // ЭФФЕКТЫ (яд, HoT, пассивки)
  let effectsMsg = "";

  // БАГ-ФИКС 2: canHeal обновляем здесь (до эффектов), а не в середине хода
  if (bot.isMob) {
    player.canHeal = !bot.diseaseActive;
  }

  if (player.poisoned) { player.hp -= 1; effectsMsg += `<span class="text-dmg">☠️ Яд: 1 урон ${REAL_PLAYER_NAME}!</span><br>`; effectsMsg += checkImmortality(player, REAL_PLAYER_NAME); }
  if (bot.isMob && bot.poisoned) { bot.hp -= 1; lastPlayerDmgThisTurn += 1; effectsMsg += `<span class="text-heal">☠️ Яд: 1 урон ${currentBotName}!</span><br>`; }
  if (!bot.isMob && bot.poisoned) { bot.hp -= 1; effectsMsg += `<span class="text-heal">☠️ Яд: 1 урон ${currentBotName}!</span><br>`; effectsMsg += checkImmortality(bot, currentBotName); }

  if (!bot.isMob) {
    effectsMsg += processHoT(player, bot, REAL_PLAYER_NAME, currentBotName);
    effectsMsg += processHoT(bot, player, currentBotName, REAL_PLAYER_NAME);
  } else {
    effectsMsg += processHoT(player, bot, REAL_PLAYER_NAME, currentBotName);
    effectsMsg += tickMobEffects(bot, lastPlayerDmgThisTurn);
    // После тика пересчитываем canHeal (болезнь могла закончиться)
    player.canHeal = !bot.diseaseActive;
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

  // immortalTurnActive сбрасываем ПОСЛЕ эффектов (фикс смерти от яда)
  player.immortalTurnActive = false;
  if (!bot.isMob) bot.immortalTurnActive = false;

  if (effectsMsg !== "") {
    logMsg += `<div class="text-skill" style="margin-top: 10px; margin-bottom: 5px;">🧿 Эффекты:</div>` + effectsMsg;
  }

  // Submit проверяем ПОСЛЕ всей фазы эффектов — теперь учитывает урон от HoT и яда
  if (bot.isMob) {
    logMsg += checkMobSubmitTrigger(bot, lastPlayerDmgThisTurn, lastMobDmgThisTurn);
  }

  // БАГ-ФИКС checkSkills: боты тоже должны накапливать и использовать навыки
  if (!bot.isMob) {
    checkSkills(player, bot, REAL_PLAYER_NAME);
    checkSkills(bot, player, currentBotName);
  } else {
    checkSkillsPlayerOnly(player, REAL_PLAYER_NAME);
  }

  // БАГ-ФИКС бессмертия: immortalTurns игрока уменьшаем ПОСЛЕ updateScreen
  // иначе кнопка «Возмездие» пропадает на ход раньше
  logToScreen(logMsg); updateScreen();
  if (player.immortalTurns > 0) player.immortalTurns--;
  checkWinner();

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
    if (healer.classId === 'priest') {
      target.hp -= 2;
      msg += `🌟 Свет наносит ${tName} 2 урона!<br>`;
      msg += checkImmortality(target, tName);
      // Учитываем урон от Обжигающего света для триггера Сильвии
      if (target.isMob) lastPlayerDmgThisTurn += 2;
    }
    return msg;
  } return "";
}

function resolveCombat(atkC, defC, aRoll, dBlock, aName, dName, ignBlock, isSkill = false) {
  let res = `🗡️ ${aName} наносит ${getHitAdj(aRoll)} удар (${aRoll})<br>`;

  // БАГ-ФИКС 1: уклонение проверяем ДО вывода строки блока
  if (!defC.isMob) {
    if (defC.classId === 'assassin' && defC.hp <= 4 && !defC.usedInstinct) {
      defC.usedInstinct = true;
      return res + `<span class="text-info">🌑 Инстинкт: ${dName} уклоняется!</span><br>`;
    }
    if (Math.random() < defC.eqP.dodge) return res + `<span class="text-info">👢 Сапоги: ${dName} уклоняется!</span><br>`;
  }

  if (!ignBlock) res += `🛡️ ${dName} ставит ${getBlockAdj(dBlock)} блок (${dBlock})<br>`;
  else res += `🛡️ ${dName} не может заблокировать удар!<br>`;

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
      if (a === 'bite') return char.biteReady ? `<span style="color:#ef4444">🦖 Укус (готов!)</span>` : `🦖 Укус`;
      if (a === 'hiss') return char.hissActive ? `<span style="color:#ef4444">🐉 Щит (${char.hissTurnsLeft})</span>` : `🐉 Щит`;
      if (a === 'rage_hot') return char.rageHotActive ? `<span style="color:#10b981">🐉 Ярость (+1ХП/ход)</span>` : `🐉 Ярость`;
      if (a === 'water_blast') return char.waterBlastUsed ? (char.waterBlastActive ? `<span style="color:#ef4444">🌊 Устрашение (${char.waterBlastTurnsLeft})</span>` : `🌊 Исчерпано`) : `🌊 Мощь воды`;
      if (a === 'stone_skin') return char.stoneSkinReflect ? `<span style="color:#94a3b8">🗿 Кожа (${char.stoneSkinReflect} отраж.)</span>` : `🗿 Каменная кожа`;
      if (a === 'doom') return char.doomActive ? `<span style="color:#ef4444">💀 Погибель (${char.doomTurnsLeft})</span>` : `💀 Погибель`;
      if (a === 'summon_slave') return char.summonUsed ? (char.summonActive ? `<span style="color:#ef4444">👳🏻‍♂️ Раб в бою!</span>` : `👳🏻‍♂️ Исчерпано`) : `👳🏻‍♂️ Призыв`;
      if (a === 'suppress') return char.suppressActive ? `<span style="color:#ef4444">😵 Угнетение (${char.suppressTurnsLeft})</span>` : `😵 Угнетение`;
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

  let playerTitle = getActiveTitle(player.classId);
  document.getElementById("ui-player-name").innerText = REAL_PLAYER_NAME;
  document.getElementById("ui-player-name").className = "char-name " + (pRank.textClass || "");
  let playerSubEl = document.getElementById("ui-player-sub");
  if (playerSubEl) {
    let newPlayerSubHtml = playerTitle ? getTitleHtml(playerTitle.rarity, playerTitle.name) : `<span style="color:#64748b;">${player.className}</span>`;
    if (playerSubEl.innerHTML !== newPlayerSubHtml) playerSubEl.innerHTML = newPlayerSubHtml;
  }
  document.getElementById("ui-player-rank").innerHTML = (pRank.iconClass ? `<span class="${pRank.iconClass}">${pRank.icon}</span> ` : `${pRank.icon} `) + (pRank.textClass ? `<span class="${pRank.textClass}">${gameData.lp} LP</span>` : `${gameData.lp} LP`);

  if (bot.isMob) {
    let iconBg = '';
    if (bot.tier === 'elite') {
      iconBg = 'background: linear-gradient(135deg, #f59e0b, #fde68a, #b45309); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 0 6px rgba(245,158,11,0.7));';
    } else if (bot.tier === 'boss') {
      iconBg = 'background: linear-gradient(135deg, #dc2626, #7f1d1d, #ef4444, #991b1b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 0 10px rgba(220,38,38,0.9));';
    }
    document.getElementById("ui-bot-name").innerHTML = iconBg
      ? `<span style="${iconBg} font-size:18px;">${bot.icon}</span> ${bot.name}`
      : `${bot.icon} ${bot.name}`;
    document.getElementById("ui-bot-name").className = "char-name";
    let mobSubEl = document.getElementById("ui-bot-sub");
    if (mobSubEl) mobSubEl.innerHTML = '';
    let tierLabel = bot.tier === 'boss' ? '👑 БОСС' : (bot.tier === 'elite' ? '⭐ Элитный' : 'Обычный');
    document.getElementById("ui-bot-rank").innerHTML = tierLabel;
  } else {
    let bRank = getRank(bot.lp);
    document.getElementById("ui-bot-name").innerText = currentBotName;
    document.getElementById("ui-bot-name").className = "char-name " + (bRank.textClass || "");
    let botSubEl = document.getElementById("ui-bot-sub");
    if (botSubEl) {
      let newBotSubHtml = bot.activeTitle ? getTitleHtml(bot.activeTitle.rarity, bot.activeTitle.name) : `<span style="color:#64748b;">${bot.className}</span>`;
      if (botSubEl.innerHTML !== newBotSubHtml) botSubEl.innerHTML = newBotSubHtml;
    }
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
    document.getElementById("btn-attack").style.display = "block";
    // Скрываем блок если достигнут порог блоков подряд
    document.getElementById("btn-defend").style.display = player.blockStreak >= player.blockStreakMax ? "none" : "block";
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
        let failedDungeonName = DUNGEONS[dungeonState.dungeonId].name;
        dungeonState = null;
        document.getElementById("btn-return").style.display = "block";
        logToScreen(`<span class='text-dmg'>💀 Вы пали в ${failedDungeonName}. Прогресс потерян.</span>`);
        saveData();
      } else {
        // Победа над врагом

        // Проверяем: это был порабощённый?
        if (dungeonState.slave && bot === dungeonState.slave) {
          // Раб убит — возвращаем хранителя, начисляем ему хил
          let survived = dungeonState.slaveKeeper.summonSurvived;
          dungeonState.slaveKeeper.hp = Math.min(dungeonState.slaveKeeper.maxHp, dungeonState.slaveKeeper.hp + survived);
          dungeonState.slaveKeeper.summonActive = false;
          dungeonState.slave = null;
          let healMsg = survived > 0 ? ` (+${survived} ХП Хранителю за ${survived} ходов)` : '';
          let endMsg = `<span class='text-heal'>✅ ${bot.icon} Порабощённый повержен!${healMsg}</span><br>`;

          // Проверяем: не умер ли Хранитель пока шёл бой с рабом (яд/HoT)
          if (dungeonState.slaveKeeper.hp <= 0) {
            let failedDungeonName = DUNGEONS[dungeonState.dungeonId].name;
            dungeonState = null;
            document.getElementById("btn-return").style.display = "block";
            logToScreen(endMsg + `<span class='text-dmg'>💀 Хранитель пал от эффектов. Прогресс потерян.</span>`);
            saveData();
            return;
          }

          endMsg += `<span class="text-dmg">🧝🏻‍♂️ Хранитель храма возвращается в бой!</span>`;
          logToScreen(endMsg);
          saveData();
          bot = dungeonState.slaveKeeper;
          currentBotName = bot.name;
          document.getElementById("bot-card").className = "character border-mob-" + bot.tier;
          setTimeout(() => { gameIsOver = false; turnCount++; startTurnTimer(); updateScreen(); }, 2000);
          return;
        }

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
        // Эффект победы
        if (gameData.activeVictoryEffect) {
          setTimeout(() => playVictoryEffect(gameData.activeVictoryEffect), 300);
        }
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
// rollMobLoot, grantBossReward, showFloorBreak, continueToNextFloor, exitDungeon — см. dungeons.js

function claimDailyGift() {
  if (gameData.dailyWins < 5 || gameData.dailyGiftClaimed) return;
  gameData.dailyGiftClaimed = true;

  // Гарантированный Пыльный ключ
  gameData.keys['dusty_key'] = (gameData.keys['dusty_key'] || 0) + 1;
  let bonusMsg = '';

  // 20% — Древесный ключ
  if (Math.random() < 0.20) {
    gameData.keys['wood_key'] = (gameData.keys['wood_key'] || 0) + 1;
    bonusMsg += '\n+1 🗝️ Древесный ключ (бонус!)';
  }
  // 5% — Древний ключ
  if (Math.random() < 0.05) {
    gameData.keys['ancient_key'] = (gameData.keys['ancient_key'] || 0) + 1;
    bonusMsg += '\n+1 🗝️ Древний ключ (редкий бонус!)';
  }

  saveData(); renderMainMenu();
  alert('🎁 Подарок получен!\n+1 🗝️ Пыльный ключ' + bonusMsg);
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
        if (a === 'bite') desc += `🦖 <b>Укус</b> — каждые -10 ХП: следующая атака +3 урона<br>`;
        if (a === 'hiss') desc += `🐉 <b>Как ты с-с-смеешь...</b> — при 4+ урона за ход: снижает получаемый урон на 1 на 2 хода<br>`;
        if (a === 'rage_hot') desc += `🐉 <b>Не стоило меня злить</b> — при потере 18 ХП: регенерация +1 ХП каждый ход<br>`;
        if (a === 'water_blast') desc += `🌊 <b>Узри мощь воды</b> — на 20 ходу: 5 урона игнорируя броню + Устрашение (-1 атака и блок на 3 хода)<br>`;
        if (a === 'stone_skin') desc += `🗿 <b>Каменная кожа</b> — при ≤20 ХП: отражает 1 урон; при ≤8 ХП: отражает 2 урона<br>`;
        if (a === 'doom') desc += `💀 <b>Здесь твоя погибель</b> — если 3 хода без урона: блок игрока = 0 на 2 хода<br>`;
        if (a === 'summon_slave') desc += `👳🏻‍♂️ <b>Пробуждайся мой верный раб</b> — при потере 18 ХП: призывает Порабощённого; восстанавливает ХП за каждый его прожитый ход<br>`;
        if (a === 'suppress') desc += `😵 <b>Подчинись моей воле</b> — при 4+ урона за ход: атака игрока = 1 на 2 хода (Угнетение)<br>`;
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
        if (item.legendary) desc += `<span style="font-size:10px; color:#f59e0b; font-weight:bold;">🔸 ${item.legendary.desc}</span><br>`;
        if (item.classId) desc += `<span style="font-size:10px; color:#64748b;">Только для: ${CLASSES[item.classId]?.name || item.classId}</span><br>`;
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
    dungeon.keyArenaDrops.forEach(dropEntry => {
      if (a.maxLp >= dropEntry.minLp && (idx === ARENAS.length - 1 || a.maxLp <= dropEntry.maxLp || dropEntry.minLp <= a.maxLp)) {
        // Показываем если хотя бы часть диапазона арены попадает в диапазон дропа ключа
        if (dropEntry.minLp <= a.maxLp && (idx === 0 || dropEntry.maxLp >= (idx > 0 ? ARENAS[idx-1].maxLp + 1 : 0))) {
          keyInfo += `<br>🗝️ <b>${dungeon.keyName}:</b> ${(dropEntry.chance * 100).toFixed(0)}% шанс<br>`;
        }
      }
    });
  });
  if (keyInfo) desc += `<br><b>Ключи подземелий:</b>${keyInfo}`;

  document.getElementById('modal-desc').innerHTML = desc;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}

// ============================================================
// БАЗА ДАННЫХ ГАЧИ И ТИТУЛЫ
// ============================================================

const GACHA_POOLS = {
  guardian: {
    id: 'guardian',
    hidden: false,
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
    hidden: false,
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
      uncommon:  { label: 'Необычный',  name: 'Странствующий жрец',       chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Жрец Ордена Рассвета',     chance: 0.07 },
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


function rollGacha(gachaId) {
  let pool = GACHA_POOLS[gachaId];
  if (!pool) return null;
  let cost = 10;
  if (gameData.lunarStones < cost) { showCodeResult('❌ Недостаточно Лунных камней!', false); return null; }
  gameData.lunarStones -= cost;

  // Счётчик гаранта
  if (!gameData.gachaSpinCount[gachaId]) gameData.gachaSpinCount[gachaId] = 0;
  gameData.gachaSpinCount[gachaId]++;
  let spins = gameData.gachaSpinCount[gachaId];

  let result = { type: null, value: null, rarity: null };
  let r = Math.random();
  let isGuaranteed = spins >= 100;

  if (isGuaranteed) {
    // Гарант: 70% легендарный титул, 30% эффект победы (без повторок)
    let ve = pool.victoryEffect;
    let hasVE = ve && typeof VICTORY_EFFECT_META !== 'undefined';
    let veAlreadyOwned = hasVE && gameData.unlockedVictoryEffects.includes(ve.id);
    let titleAlreadyOwned = gameData.titles[pool.classId]?.unlocked?.includes('legendary');

    // Если эффект уже есть — всегда даём титул (и наоборот)
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
    // 0.2% — эффект победы вне гаранта
    let ve = pool.victoryEffect;
    if (ve && typeof VICTORY_EFFECT_META !== 'undefined' && !gameData.unlockedVictoryEffects.includes(ve.id)) {
      result = { type: 'victoryEffect', rarity: 'mythic', value: ve.id, name: ve.name };
      gameData.unlockedVictoryEffects.push(ve.id);
      gameData.gachaSpinCount[gachaId] = 0;
    } else {
      // Уже есть — компенсация 200 💠
      gameData.lunarStones += 200;
      result = { type: 'victoryEffect', rarity: 'mythic', value: ve?.id, name: ve?.name, dupComp: '+200 💠 (дубль)' };
    }
  } else if (r < 0.006) {
    result = { type: 'title', rarity: 'legendary', value: pool.titles.legendary.name };
    gameData.gachaSpinCount[gachaId] = 0;
  } else if (r < 0.006 + 0.02) {
    result = { type: 'title', rarity: 'epic', value: pool.titles.epic.name };
  } else if (r < 0.026 + 0.07) {
    result = { type: 'title', rarity: 'rare', value: pool.titles.rare.name };
  } else if (r < 0.096 + 0.15) {
    result = { type: 'title', rarity: 'uncommon', value: pool.titles.uncommon.name };
  } else if (r < 0.246 + 0.60) {
    // Империалы
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
    // Ключи
    let kr = Math.random();
    let keyId, keyName;
    if (kr < 0.55)      { keyId = 'dusty_key';   keyName = '🗝️ Пыльный ключ'; }
    else if (kr < 0.85) { keyId = 'wood_key';    keyName = '🗝️ Древесный ключ'; }
    else                { keyId = 'ancient_key'; keyName = '🗝️ Древний ключ'; }
    result = { type: 'key', value: keyId, keyName };
    gameData.keys[keyId] = (gameData.keys[keyId] || 0) + 1;
  } else {
    // Пусто (6.6%)
    result = { type: 'nothing' };
  }

  // Разблокируем титул или даём компенсацию за дубль
  if (result.type === 'title') {
    if (!gameData.titles[pool.classId]) gameData.titles[pool.classId] = { unlocked: [], active: null };
    let td = gameData.titles[pool.classId];
    if (!td.unlocked.includes(result.rarity)) {
      td.unlocked.push(result.rarity);
    } else {
      // Уже есть — компенсация
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
// МИФИЧЕСКАЯ ГАЧА
// ============================================================

function rollMythicGacha(gachaId) {
  let pool = MYTHIC_GACHA_POOLS[gachaId];
  if (!pool) return null;
  const cost = pool.cost; // 25 💠
  if (gameData.lunarStones < cost) { showCodeResult('❌ Недостаточно Лунных камней!', false); return null; }
  gameData.lunarStones -= cost;

  if (!gameData.mythicGachaSpinCount[gachaId]) gameData.mythicGachaSpinCount[gachaId] = 0;
  gameData.mythicGachaSpinCount[gachaId]++;
  let spins = gameData.mythicGachaSpinCount[gachaId];
  let isGuaranteed = spins >= 100;

  // Состояние разблокировок
  if (!gameData.mythicTitles[gachaId]) gameData.mythicTitles[gachaId] = { unlocked: [], active: null };
  let mt = gameData.mythicTitles[gachaId];
  let hasFrame   = gameData.cardFrame === pool.frame.id;
  let hasEffect  = gameData.entryEffect === pool.entryEffect.id;
  let hasMythic  = mt.unlocked.includes('mythic');

  let result = { type: null, value: null, rarity: null };

  if (isGuaranteed) {
    // Гарант 40/40/20 без повторок
    let options = [];
    if (!hasFrame)   options.push({ w: 40, t: 'frame' });
    if (!hasEffect)  options.push({ w: 40, t: 'effect' });
    if (!hasMythic)  options.push({ w: 20, t: 'mythic_title' });
    if (options.length === 0) {
      // Всё уже есть — компенсация
      result = { type: 'comp_all', value: 1000 };
      gameData.lunarStones += 1000;
    } else {
      // Взвешенный выбор
      let total = options.reduce((s, o) => s + o.w, 0);
      let rr = Math.random() * total;
      let chosen = options[0].t;
      for (let o of options) { if (rr < o.w) { chosen = o.t; break; } rr -= o.w; }
      result = { type: chosen };
    }
    gameData.mythicGachaSpinCount[gachaId] = 0;
  } else {
    let r = Math.random();
    // Мифик титул 0.2%
    if (r < 0.002) {
      result = { type: 'mythic_title' };
    // Эпик 2%
    } else if (r < 0.002 + 0.02) {
      result = { type: 'title', rarity: 'epic' };
    // Редкий 7%
    } else if (r < 0.002 + 0.02 + 0.07) {
      result = { type: 'title', rarity: 'rare' };
    // Необычный 15%
    } else if (r < 0.002 + 0.02 + 0.07 + 0.15) {
      result = { type: 'title', rarity: 'uncommon' };
    // Рамка 0.4%
    } else if (r < 0.242 + 0.004) {
      result = { type: 'frame' };
    // Эффект 0.4%
    } else if (r < 0.246 + 0.004) {
      result = { type: 'effect' };
    // Ключи ~20%
    } else if (r < 0.25 + 0.20) {
      let kr = Math.random();
      let keyId, keyName;
      if (kr < 0.40)      { keyId = 'dusty_key';   keyName = '🗝️ Пыльный ключ'; }
      else if (kr < 0.70) { keyId = 'wood_key';    keyName = '🗝️ Древесный ключ'; }
      else if (kr < 0.92) { keyId = 'ancient_key'; keyName = '🗝️ Древний ключ'; }
      else                { keyId = 'ancient_key'; keyName = '🗝️ Древний ключ'; } // больше шанс редкого
      gameData.keys[keyId] = (gameData.keys[keyId] || 0) + 1;
      result = { type: 'key', value: keyId, keyName };
    // Империалы ~54%
    } else {
      let ir = Math.random();
      let imperials = ir < 0.01 ? 50000 : ir < 0.05 ? 10000 : ir < 0.20 ? 5000 : ir < 0.50 ? 2000 : 1000;
      gameData.imperials += imperials;
      result = { type: 'imperials', value: imperials };
    }
  }

  // Применяем результат
  if (result.type === 'mythic_title') {
    if (!mt.unlocked.includes('mythic')) {
      mt.unlocked.push('mythic');
      result.value = pool.titles.mythic.name;
      result.rarity = 'mythic';
      if (isGuaranteed) gameData.mythicGachaSpinCount[gachaId] = 0;
    } else {
      result.dupComp = '+1000 💠 (дубль)';
      result.value = pool.titles.mythic.name;
      result.rarity = 'mythic';
      gameData.lunarStones += 1000;
    }
  } else if (result.type === 'title') {
    if (!mt.unlocked.includes(result.rarity)) {
      mt.unlocked.push(result.rarity);
      result.value = pool.titles[result.rarity].name;
    } else {
      result.dupComp = result.rarity === 'uncommon' ? '+5000 🪙 (дубль)' : result.rarity === 'rare' ? '+20 💠 (дубль)' : '+100 💠 (дубль)';
      result.value = pool.titles[result.rarity].name;
      if (result.rarity === 'uncommon') gameData.imperials += 5000;
      else if (result.rarity === 'rare') gameData.lunarStones += 20;
      else gameData.lunarStones += 100;
    }
  } else if (result.type === 'frame') {
    if (gameData.cardFrame !== pool.frame.id) {
      gameData.cardFrame = pool.cardFrame || pool.frame.id;
      // Разблокируем рамку: помечаем в отдельном массиве
      if (!gameData.unlockedFrames) gameData.unlockedFrames = [];
      if (!gameData.unlockedFrames.includes(pool.frame.id)) gameData.unlockedFrames.push(pool.frame.id);
      result.value = pool.frame.name;
    } else {
      result.dupComp = '+500 💠 (дубль)';
      gameData.lunarStones += 500;
      result.value = pool.frame.name;
    }
  } else if (result.type === 'effect') {
    if (!gameData.unlockedEffects) gameData.unlockedEffects = [];
    if (!gameData.unlockedEffects.includes(pool.entryEffect.id)) {
      gameData.unlockedEffects.push(pool.entryEffect.id);
      gameData.entryEffect = pool.entryEffect.id;
      result.value = pool.entryEffect.name;
    } else {
      result.dupComp = '+500 💠 (дубль)';
      gameData.lunarStones += 500;
      result.value = pool.entryEffect.name;
    }
  }

  saveData();
  return { result, isGuaranteed, pool, spinsLeft: 100 - gameData.mythicGachaSpinCount[gachaId] };
}

// Получить активный титул для класса (строка для отображения)
function getActiveTitle(classId) {
  // Приоритет: мифический > легендарный
  let mt = gameData.mythicTitles && gameData.mythicTitles[classId];
  if (mt && mt.active) {
    let mpool = MYTHIC_GACHA_POOLS[classId];
    if (mpool && mpool.titles[mt.active]) {
      return { rarity: mt.active, name: mpool.titles[mt.active].name };
    }
  }
  let td = gameData.titles[classId];
  if (!td || !td.active) return null;
  let pool = GACHA_POOLS[classId];
  if (!pool) return null;
  return { rarity: td.active, name: pool.titles[td.active].name };
}

// Получить HTML отображения титула по редкости
function getTitleHtml(rarity, name) {
  if (rarity === 'uncommon') {
    return `<span class="title-uncommon">${name}</span>`;
  } else if (rarity === 'rare') {
    return `<span class="title-rare">${name}</span>`;
  } else if (rarity === 'epic') {
    return `<span class="title-epic">${name}</span>`;
  } else if (rarity === 'legendary') {
    return `<span class="title-legendary">${name}</span>`;
  } else if (rarity === 'mythic') {
    return `<span class="title-mythic-wrap"><span class="title-mythic">${name}</span></span>`;
  }
  return name;
}

// Назначить случайный титул боту (имитация реального игрока)
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

// Модальное окно выбора титула (из меню Герой)
function openTitleModal() {
  let classId = gameData.currentClass;
  let td = gameData.titles[classId] || { unlocked: [], active: null };
  let pool = GACHA_POOLS[classId];

  let slotsHtml = '';
  // Кнопка "без титула"
  let isNone = td.active === null;
  slotsHtml += `<div onclick="setTitle(null)" style="cursor:pointer; padding:12px; border-radius:10px; margin-bottom:8px; background:${isNone ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.6)'}; border:1px solid ${isNone ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center;">
    <span style="color:#94a3b8;">— Без титула</span>
    ${isNone ? '<span style="color:#6366f1; font-size:11px;">✓ Активен</span>' : ''}
  </div>`;

  // Мифические титулы
  let mt = gameData.mythicTitles[classId] || { unlocked: [], active: null };
  let mythicPool = MYTHIC_GACHA_POOLS[classId];
  let mythicActiveIsSet = mt.active !== null && mt.active !== undefined;
  // "Без титула" активно только если и legend, и mythic не активны
  let isNoneActive = td.active === null && !mythicActiveIsSet;

  // Перерисуем "без титула" с учётом мифика
  slotsHtml = `<div onclick="setTitle(null)" style="cursor:pointer; padding:12px; border-radius:10px; margin-bottom:8px; background:${isNoneActive ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.6)'}; border:1px solid ${isNoneActive ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center;">
    <span style="color:#94a3b8;">— Без титула</span>
    ${isNoneActive ? '<span style="color:#6366f1; font-size:11px;">✓ Активен</span>' : ''}
  </div>`;

  // Мифические титулы — сверху
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

  // Легендарные титулы
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

function openEntryEffectModal() {
  let html = '<div style="font-size:12px; color:#64748b; margin-bottom:12px;">Эффект воспроизводится при входе в бой и на каждый новый этаж данжа.</div>';

  // Кнопка "без эффекта"
  let isNone = !gameData.entryEffect;
  html += `<div onclick="setEntryEffect(null)" style="cursor:pointer; padding:12px; border-radius:10px; margin-bottom:8px; background:${isNone ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.6)'}; border:1px solid ${isNone ? '#6366f1' : '#334155'}; display:flex; justify-content:space-between; align-items:center;">
    <span style="color:#94a3b8;">— Без эффекта</span>
    ${isNone ? '<span style="color:#6366f1; font-size:11px;">✓ Активен</span>' : ''}
  </div>`;

  let rarityColors = { epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444', top10: '#fde68a' };
  let rarityLabels = { epic: 'Эпический', legendary: 'Легендарный', mythic: 'Мифический', top10: '🏆 Топ-10 · Глобальный рейтинг' };

  // Сортируем по редкости
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

  // Ранговая (дефолт)
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

  // Без эффекта
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

function setTitle(rarity) {
  let classId = gameData.currentClass;
  if (!gameData.titles[classId]) gameData.titles[classId] = { unlocked: [], active: null };
  gameData.titles[classId].active = rarity;
  // Сбрасываем мифический если выбрали легендарный
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
  // Сбрасываем легендарный
  if (!gameData.titles[classId]) gameData.titles[classId] = { unlocked: [], active: null };
  gameData.titles[classId].active = null;
  saveData();
  openTitleModal();
  updateHeroTab();
}

// ============================================================
// ПРЕМИУМ МАГАЗИН
// ============================================================

// Алгоритм проверки кода (должен совпадать с admin.html)
// Формат кода: XXXX-XXXX-XXXX где последние 4 символа — контрольная сумма
const CODE_SECRET = 'MIDDLE_EARTH_2024';

function decodePromoCode(code) {
  let clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 12) return null;
  let payload = clean.slice(0, 8);
  let checksum = clean.slice(8, 12);
  // Проверяем контрольную сумму
  let expected = generateChecksum(payload + CODE_SECRET);
  if (expected !== checksum) return null;
  // Декодируем payload: первые 4 — номинал (base36), следующие 4 — уникальный ID
  try {
    let amount = parseInt(payload.slice(0, 4), 36);
    let uid = payload.slice(4, 8);
    let validAmounts = [50, 100, 200, 500, 1000, 5000];
    if (!validAmounts.includes(amount)) return null;
    return { amount, uid, fullId: payload };
  } catch(e) { return null; }
}

function generateChecksum(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  let result = Math.abs(hash).toString(36).toUpperCase().padStart(4, '0');
  return result.slice(0, 4);
}

function redeemCode() {
  let input = document.getElementById('promo-input');
  if (!input) return;
  let code = input.value.trim();
  if (!code) { showCodeResult('Введите код!', false); return; }

  let decoded = decodePromoCode(code);
  if (!decoded) { showCodeResult('❌ Неверный код', false); return; }

  if (gameData.usedCodes.includes(decoded.fullId)) {
    showCodeResult('❌ Код уже использован', false); return;
  }

  // Активируем
  gameData.lunarStones += decoded.amount;
  gameData.usedCodes.push(decoded.fullId);
  input.value = '';
  saveData();
  renderPremiumShop();
  showCodeResult(`✅ Получено ${decoded.amount} 💠 Лунных камней!`, true);
}

function showCodeResult(msg, isSuccess) {
  let el = document.getElementById('code-result');
  if (!el) return;
  el.innerText = msg;
  el.style.color = isSuccess ? '#10b981' : '#ef4444';
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function buyWithLunar(type, cost) {
  if (gameData.lunarStones < cost) {
    showCodeResult('❌ Недостаточно Лунных камней!', false); return;
  }
  gameData.lunarStones -= cost;

  if (type === 'gold_2000')   { gameData.imperials += 2000; showCodeResult('+2 000 🪙 получено!', true); }
  else if (type === 'gold_5000')   { gameData.imperials += 5000; showCodeResult('+5 000 🪙 получено!', true); }
  else if (type === 'gold_10000')  { gameData.imperials += 10000; showCodeResult('+10 000 🪙 получено!', true); }
  else if (type === 'gold_25000')  { gameData.imperials += 25000; showCodeResult('+25 000 🪙 получено!', true); }
  else if (type === 'gold_50000')  { gameData.imperials += 50000; showCodeResult('+50 000 🪙 получено!', true); }
  else if (type === 'gold_100000') { gameData.imperials += 100000; showCodeResult('+100 000 🪙 получено!', true); }
  else if (type === 'chest_1') { openChestLunar(1); }
  else if (type === 'chest_3') { openChestLunar(3); }
  else if (type === 'chest_4') { openChestLunar(4); }

  saveData();
  renderPremiumShop();
}

function openChestLunar(chestType) {
  if (gameData.inventory.length >= gameData.maxInventory) {
    showCodeResult('❌ Сумка полна! Камни возвращены.', false);
    gameData.lunarStones += [0,2,0,3,0,0,0,7][chestType]; // возврат
    return;
  }
  let rarity = 'common'; let r = Math.random();
  if (chestType === 1) { if (r < 0.85) rarity='common'; else if (r < 0.99) rarity='uncommon'; else rarity='rare'; }
  else if (chestType === 3) { if (r < 0.40) rarity='common'; else if (r < 0.70) rarity='uncommon'; else if (r < 0.97) rarity='rare'; else rarity='epic'; }
  else if (chestType === 4) {
    gameData.hugeChestPity++;
    if (gameData.hugeChestPity > 100) { rarity='epic'; gameData.hugeChestPity=0; }
    else { if (r < 0.30) rarity='common'; else if (r < 0.60) rarity='uncommon'; else if (r < 0.95) rarity='rare'; else rarity='epic'; }
  }
  let item = generateItem(rarity);
  gameData.inventory.push(item);
  saveData();
  // Показываем красивую анимацию — как для сундуков за золото
  openChestModal(item, chestType);
}

function buyLunarKey(keyId, cost) {
  if (gameData.lunarStones < cost) { showCodeResult('❌ Недостаточно Лунных камней!', false); return; }
  gameData.lunarStones -= cost;
  gameData.keys[keyId] = (gameData.keys[keyId] || 0) + 1;
  saveData();
  let names = { ancient_key: '🗝️ Древний ключ' };
  showCodeResult(`✅ Куплен ${names[keyId] || 'ключ'}! В наличии: ${gameData.keys[keyId]} шт.`, true);
  renderPremiumShop();
}

function renderPremiumShop() {
  let ls = gameData.lunarStones;
  let canBuy = (cost) => ls >= cost;

  // Золото
  let goldItems = [
    { type: 'gold_2000',   gold: '2 000',   cost: 20  },
    { type: 'gold_5000',   gold: '5 000',   cost: 40  },
    { type: 'gold_10000',  gold: '10 000',  cost: 70  },
    { type: 'gold_25000',  gold: '25 000',  cost: 150 },
    { type: 'gold_50000',  gold: '50 000',  cost: 250 },
    { type: 'gold_100000', gold: '100 000', cost: 400 },
  ];
  let goldHtml = goldItems.map(g => `
    <div onclick="${canBuy(g.cost) ? `buyWithLunar('${g.type}', ${g.cost})` : ''}"
      style="background:rgba(30,41,59,0.8); border:1px solid ${canBuy(g.cost) ? '#f59e0b' : '#374151'}; border-radius:10px; padding:12px 8px; text-align:center; cursor:${canBuy(g.cost) ? 'pointer' : 'default'}; opacity:${canBuy(g.cost) ? '1' : '0.5'}; transition:all 0.2s;">
      <div style="font-size:22px;">🪙</div>
      <div style="font-weight:900; color:#fbbf24; font-size:13px; margin:4px 0;">${g.gold}</div>
      <div style="background:${canBuy(g.cost) ? 'rgba(15,118,110,0.4)' : 'rgba(55,65,81,0.4)'}; border-radius:6px; padding:4px 6px; font-size:12px; color:${canBuy(g.cost) ? '#5eead4' : '#64748b'}; font-weight:bold;">${g.cost} 💠</div>
    </div>`).join('');

  // Сундуки
  let chestItems = [
    { type: 'chest_1', icon: '📦', name: 'Сундук',        cost: 2, desc: '85% обыч · 14% необыч · 1% редк' },
    { type: 'chest_3', icon: '🗃️',  name: 'Бол. сундук',  cost: 3, desc: '40% обыч · 30% необыч · 27% редк · 3% эпик' },
    { type: 'chest_4', icon: '💰',  name: 'Огр. сундук',  cost: 7, desc: '30% обыч · 30% необыч · 35% редк · 5% эпик' },
  ];
  let chestHtml = chestItems.map(c => `
    <div onclick="${canBuy(c.cost) ? `buyWithLunar('${c.type}', ${c.cost})` : ''}"
      style="background:rgba(30,41,59,0.8); border:1px solid ${canBuy(c.cost) ? '#7c3aed' : '#374151'}; border-radius:10px; padding:12px 8px; text-align:center; cursor:${canBuy(c.cost) ? 'pointer' : 'default'}; opacity:${canBuy(c.cost) ? '1' : '0.5'};">
      <div style="font-size:28px;">${c.icon}</div>
      <div style="font-weight:900; color:#e9d5ff; font-size:13px; margin:4px 0;">${c.name}</div>
      <div style="font-size:9px; color:#94a3b8; margin-bottom:6px;">${c.desc}</div>
      <div style="background:${canBuy(c.cost) ? 'rgba(109,40,217,0.4)' : 'rgba(55,65,81,0.4)'}; border-radius:6px; padding:4px 6px; font-size:12px; color:${canBuy(c.cost) ? '#c4b5fd' : '#64748b'}; font-weight:bold;">${c.cost} 💠</div>
    </div>`).join('');

  let html = `
    <!-- Баланс -->
    <div style="background:rgba(15,23,42,0.9); border:1px solid #1e3a5f; border-radius:12px; padding:14px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
      <div style="color:#94a3b8; font-size:13px;">Ваш баланс</div>
      <div style="font-size:20px; font-weight:900; color:#67e8f9;">${ls} 💠</div>
    </div>

    <!-- МИФИЧЕСКАЯ РУЛЕТКА — самый верх -->
    <div id="mythic-gacha-block"></div>

    <!-- Легендарные рулетки -->
    <div class="class-card" style="border:2px solid #a855f7; background:rgba(20,10,40,0.95); margin-bottom:16px; text-align:left;">
      <div class="class-title" style="color:#d946ef; margin-bottom:4px;">✨ Косметика — Рулетки титулов</div>
      <div class="class-desc" style="margin-bottom:14px;">Получи уникальный титул для своего класса. Титул отображается под ником в бою.</div>
      <div id="gacha-list"></div>
    </div>

    <!-- Золото -->
    <div class="class-card" style="border:2px solid #b45309; background:rgba(25,15,0,0.9); margin-bottom:16px; text-align:left;">
      <div class="class-title" style="color:#fbbf24; margin-bottom:4px;">🪙 Золото</div>
      <div class="class-desc" style="margin-bottom:14px;">Обменяйте Лунные камни на Империалы.</div>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;">${goldHtml}</div>
    </div>

    <!-- Сундуки -->
    <div class="class-card" style="border:2px solid #7c3aed; background:rgba(20,10,40,0.9); margin-bottom:16px; text-align:left;">
      <div class="class-title" style="color:#c084fc; margin-bottom:4px;">📦 Сундуки</div>
      <div class="class-desc" style="margin-bottom:14px;">Экипировка за Лунные камни.</div>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;">${chestHtml}</div>
    </div>

    <!-- Ключи -->
    <div class="class-card" style="border:2px solid #374151; background:rgba(15,20,30,0.9); margin-bottom:16px; text-align:left;">
      <div class="class-title" style="color:#fbbf24; margin-bottom:8px;">🗝️ Ключи подземелий</div>
      <div onclick="buyLunarKey('ancient_key', 20)" style="cursor:pointer; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:13px; font-weight:bold; color:#f1f5f9;">🗝️ Древний ключ</div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">Для 🕌 Древний храм · Нельзя купить за золото</div>
          <div style="font-size:11px; color:#475569; margin-top:1px;">В наличии: <span id="lunar-ancient-key-count">0</span> шт.</div>
        </div>
        <div style="font-size:14px; font-weight:900; color:#67e8f9; white-space:nowrap;">20 💠</div>
      </div>
    </div>



    <!-- Резервная копия профиля -->
    <div style="margin-top:20px; background:rgba(5,20,10,0.9); border:1px solid #166534; border-radius:12px; padding:16px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <div style="font-size:22px;">💾</div>
        <div>
          <div style="font-weight:900; color:#22c55e; font-size:14px;">Резервная копия профиля</div>
          <div style="font-size:11px; color:#4ade80; margin-top:2px;">Код обновляется автоматически при каждом действии</div>
        </div>
      </div>
      <div id="backup-status-line" style="margin-bottom:12px;"></div>
      <div style="display:flex; gap:8px;">
        <button class="action-btn" style="background:linear-gradient(135deg,#166534,#15803d); flex:1; font-size:13px; padding:11px 8px;" onclick="openSaveProfileModal()">
          📋 Скопировать код
        </button>
        <button class="action-btn" style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8); flex:1; font-size:13px; padding:11px 8px;" onclick="openRestoreProfileModal()">
          🔄 Восстановить
        </button>
      </div>
    </div>

    <!-- Ввод кода -->
    <div style="margin-top:20px; background:rgba(15,23,42,0.8); border:1px solid #1e3a5f; border-radius:12px; padding:16px;">
      <div style="font-size:13px; color:#64748b; margin-bottom:10px; text-align:center;">Есть промокод? Введите ниже</div>
      <div style="display:flex; gap:8px;">
        <input id="promo-input" type="text" placeholder="XXXX-XXXX-XXXX"
          style="flex:1; background:rgba(30,41,59,0.9); border:1px solid #334155; border-radius:8px; padding:10px 12px; color:#e2e8f0; font-size:14px; font-family:monospace; outline:none; text-transform:uppercase;"
          oninput="this.value=this.value.toUpperCase()">
        <button class="action-btn" style="background:linear-gradient(135deg,#0e7490,#0891b2); padding:10px 16px; font-size:13px; flex:0; white-space:nowrap;" onclick="redeemCode()">
          Активировать
        </button>
      </div>
      <div id="code-result" style="display:none; margin-top:8px; font-size:13px; font-weight:bold; text-align:center;"></div>
    </div>
  `;

  document.getElementById('tab-premium').innerHTML = html;
  renderMythicGachaBlock();
  renderGachaList();
  // Обновляем счётчик ключа в Лунном магазине
  let ancEl = document.getElementById('lunar-ancient-key-count');
  if (ancEl) ancEl.innerText = gameData.keys['ancient_key'] || 0;
  // Показываем статус последнего автосохранения
  updateBackupStatusLine();
}

// ============================================================
// ЭФФЕКТЫ ПОБЕДЫ — воспроизводятся на арене
// ============================================================

function playVictoryEffect(effectId) {
  let arena = document.getElementById('battle-arena');
  if (!arena) return;

  // Убираем старый оверлей если есть
  let old = arena.querySelector('.victory-overlay');
  if (old) old.remove();

  let overlay = document.createElement('div');
  overlay.className = 'victory-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:50;overflow:hidden;border-radius:inherit;';
  arena.style.position = 'relative';
  arena.appendChild(overlay);

  const W = arena.offsetWidth, H = arena.offsetHeight;

  // Авто-очистка через 3.5 сек
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
  // Вспышка
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
// ТОП-10 ГЛОБАЛЬНЫЙ РЕЙТИНГ — Эксклюзивные награды
// ============================================================
// Вызывается когда сервер подтверждает место игрока в топ-10
// place: 1..10
function grantTop10Rewards(place) {
  let rewards = [];

  // Рамка Золото Валинора — всем топ-10
  if (!gameData.unlockedFrames) gameData.unlockedFrames = [];
  if (!gameData.unlockedFrames.includes('valinor')) {
    gameData.unlockedFrames.push('valinor');
    rewards.push({ icon: '✨', text: 'Рамка «Золото Валинора»' });
  }

  // Эффект Нисхождение — всем топ-10
  if (!gameData.unlockedEffects) gameData.unlockedEffects = [];
  if (!gameData.unlockedEffects.includes('slide')) {
    gameData.unlockedEffects.push('slide');
    rewards.push({ icon: '🌟', text: 'Эффект «Нисхождение»' });
  }

  // Золотой эффект победы — всем топ-10
  if (!gameData.unlockedVictoryEffects.includes('gold')) {
    gameData.unlockedVictoryEffects.push('gold');
    rewards.push({ icon: '✨', text: 'Эффект победы «Золотой взрыв»' });
  }

  // Бонус Лунных камней за место (1-е — 2000, 2-3 — 1500, 4-10 — 1000)
  let stones = place === 1 ? 2000 : place <= 3 ? 1500 : 1000;
  gameData.lunarStones += stones;
  rewards.push({ icon: '💠', text: `+${stones} Лунных камней` });

  saveData();

  // Показываем модалку с наградами
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

// Тестовая команда (убрать перед продом): в консоли написать testTop10(1)
window.testTop10 = function(place) { grantTop10Rewards(place || 1); };

function renderMythicGachaBlock() {
  let el = document.getElementById('mythic-gacha-block');
  if (!el) return;

  // Находим единственную активную мифическую рулетку (hidden: false)
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
  <div style="
    border:2px solid #7f0000;
    border-radius:14px;
    overflow:hidden;
    margin-bottom:16px;
    background: linear-gradient(160deg, #0d0202, #1a0505);
    box-shadow: 0 0 28px rgba(220,38,38,0.25), 0 0 60px rgba(127,0,0,0.12);
    position:relative;
  ">
    <!-- Верхний блик -->
    <div style="position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg, transparent, rgba(239,68,68,0.6), rgba(220,38,38,0.9), rgba(239,68,68,0.6), transparent); pointer-events:none;"></div>

    <!-- Заголовок -->
    <div style="background:linear-gradient(135deg, rgba(127,0,0,0.4), rgba(60,0,0,0.6)); padding:16px; border-bottom:1px solid #7f000066; position:relative;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="font-size:9px; color:#ef4444; font-weight:900; letter-spacing:2px; text-transform:uppercase; background:rgba(220,38,38,0.15); border:1px solid rgba(220,38,38,0.4); border-radius:20px; padding:2px 8px;">✦ Мифическая рулетка</span>
          </div>
          <div style="font-size:15px; font-weight:900; color:#fca5a5; text-shadow:0 0 12px rgba(239,68,68,0.6); margin-bottom:3px;">${pool.icon} ${pool.name}</div>
          <div style="font-size:11px; color:#7f1d1d; font-style:italic;">"${pool.tagline}"</div>
        </div>
        <div style="text-align:right; flex-shrink:0; margin-left:10px;">
          <div style="font-size:10px; color:#7f1d1d;">Гарант</div>
          <div style="font-size:20px; font-weight:900; color:${pityLeft <= 15 ? '#ef4444' : '#7f1d1d'};">${pityLeft}</div>
        </div>
      </div>
    </div>

    <!-- Титулы -->
    <div style="padding:12px 16px; display:grid; grid-template-columns:1fr 1fr; gap:6px; border-bottom:1px solid #1e293b;">
      ${titlesHtml}
    </div>

    <!-- Рамка + Эффект -->
    <div style="padding:10px 16px 0; display:grid; grid-template-columns:1fr 1fr; gap:6px; border-bottom:1px solid #1e293b; padding-bottom:10px;">
      ${cosmHtml}
    </div>

    <!-- Кнопка -->
    <div style="padding:14px 16px;">
      <button onclick="openMythicGachaModal('${pool.id}')"
        style="width:100%; background:linear-gradient(135deg,#7f0000,#dc2626,#7f0000); background-size:200% 100%; border:none; border-radius:10px; padding:14px; color:white; font-size:15px; font-weight:900; cursor:pointer; letter-spacing:0.5px; box-shadow:0 0 16px rgba(220,38,38,0.5); animation:legendary-shimmer 3s linear infinite;">
        🎲 Крутить — ${pool.cost} 💠
      </button>
      <div style="text-align:center; margin-top:6px; font-size:11px; color:#7f1d1d;">
        Открыто: ${mt.unlocked.length}/4 тит. · ${frameUnlocked ? '🖼️' : '🔒'} рамка · ${effectUnlocked ? '✨' : '🔒'} эффект · Гарант через ${pityLeft} кр.
      </div>
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
        ${isDup
          ? `<div style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b44; border-radius:8px; padding:8px 14px; font-size:14px; color:#fbbf24; font-weight:bold; margin-bottom:12px;">Компенсация: ${result.dupComp}</div>`
          : `<div style="font-size:12px; color:#64748b; margin-bottom:12px;">Выберите титул: <b style="color:#94a3b8;">Герой → 👑 Активный титул</b></div>`}
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
        ${isDup ? `<div style="margin-top:10px; color:#fbbf24; font-weight:bold;">${result.dupComp}</div>` : '<div style="font-size:12px; color:#64748b; margin-top:8px;">Активируй: Герой → 🖼️ Рамка карточки</div>'}
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
        ${isDup ? `<div style="margin-top:10px; color:#fbbf24; font-weight:bold;">${result.dupComp}</div>` : '<div style="font-size:12px; color:#64748b; margin-top:8px;">Активируй: Герой → ✨ Эффект появления</div>'}
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
    mainHtml = `<div style="text-align:center; padding:10px 0 20px;"><div style="font-size:48px; margin-bottom:12px;">🪙</div><div style="font-size:28px; font-weight:900; color:#fbbf24;">${result.value.toLocaleString()} 🪙</div></div>`;
  } else if (result.type === 'key') {
    mainHtml = `<div style="text-align:center; padding:10px 0 20px;"><div style="font-size:48px; margin-bottom:12px;">🗝️</div><div style="font-size:22px; font-weight:900; color:#fbbf24;">${result.keyName}</div></div>`;
  } else {
    mainHtml = `<div style="text-align:center; padding:10px 0 20px;"><div style="font-size:48px; margin-bottom:12px;">💨</div><div style="font-size:14px; color:#475569;">Ничего...</div></div>`;
  }

  document.getElementById('modal-desc').innerHTML = `
    ${mainHtml}
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.8); border-radius:10px; padding:10px 14px; margin-top:8px;">
      <span style="font-size:12px; color:#64748b;">До гаранта: <b style="color:#94a3b8;">${spinsLeft}</b></span>
      <span style="font-size:12px; color:#64748b;">Баланс: <b style="color:#67e8f9;">${gameData.lunarStones} 💠</b></span>
    </div>`;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:linear-gradient(135deg,#7f0000,#dc2626); flex:1; margin-right:6px;" onclick="closeModal(); openMythicGachaModal('${pool.id}')">🎲 Ещё раз</button>
    <button class="action-btn" style="background:#334155; flex:0; padding:12px 16px;" onclick="closeModal()">✕</button>`;
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
    let isLegendaryPool = !!g.isLegendaryPool; // флаг золотого оформления
    let headerBg = isLegendaryPool
      ? 'background:linear-gradient(135deg, rgba(245,158,11,0.15), rgba(180,83,9,0.25))'
      : `background:linear-gradient(135deg, ${g.color}22, ${g.color}44)`;
    let nameStyle = isLegendaryPool
      ? 'class="gacha-legendary-title"'
      : `style="font-size:15px; font-weight:900; color:${g.color};"`;
    let cardBorder = isLegendaryPool
      ? 'border:1px solid #f59e0b; box-shadow: 0 0 18px rgba(245,158,11,0.35);'
      : `border:1px solid ${g.borderColor};`;

    return `
    <div class="gacha-card" style="${cardBorder} border-radius:14px; overflow:hidden; margin-bottom:12px; background:rgba(15,23,42,0.97);">
      <!-- Заголовок -->
      <div style="${headerBg}; padding:14px 16px; border-bottom:1px solid ${isLegendaryPool ? '#f59e0b44' : g.borderColor+'44'};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-size:11px; color:${isLegendaryPool ? '#fbbf24' : g.color}; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">✨ Рулетка</div>
            <div ${nameStyle}>${g.icon} ${g.name}</div>
            <div style="font-size:11px; color:#64748b; margin-top:3px; font-style:italic;">"${g.tagline}"</div>
          </div>
          <div style="text-align:right; flex-shrink:0; margin-left:10px;">
            <div style="font-size:10px; color:#475569;">Гарант</div>
            <div style="font-size:18px; font-weight:900; color:${pityLeft <= 10 ? '#fbbf24' : '#64748b'};">${pityLeft}</div>
          </div>
        </div>
      </div>
      <!-- Таблица дропа -->
      <div style="padding:12px 16px; display:grid; grid-template-columns:1fr 1fr; gap:6px; border-bottom:1px solid #1e293b;">
        ${['uncommon','rare','epic','legendary'].map(r => {
          let t = g.titles[r];
          let unlocked = td.unlocked.includes(r);
          // Легендарный всегда виден — он указан в названии рулетки
          let alwaysShow = r === 'legendary';
          let colors = { uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', legendary:'#f59e0b' };
          let pct = { uncommon:'15%', rare:'7%', epic:'2%', legendary:'0.4%' }[r];
          let displayName = (unlocked || alwaysShow) ? t.name : '???';
          let textColor = (unlocked || alwaysShow) ? (r === 'legendary' ? '#fbbf24' : '#f1f5f9') : '#334155';
          return `<div style="background:rgba(30,41,59,0.6); border-radius:8px; padding:8px; border:1px solid ${(unlocked || alwaysShow) ? colors[r]+'55' : '#1e293b'};">
            <div style="font-size:9px; color:${colors[r]}; font-weight:bold;">${t.label.toUpperCase()} · ${pct}</div>
            <div style="font-size:11px; color:${textColor}; margin-top:2px;">${displayName}</div>
            ${unlocked ? `<div style="font-size:9px; color:${colors[r]}; margin-top:2px;">✓ Выбито</div>` : ''}
          </div>`;
        }).join('')}
      </div>
      <!-- Кнопка прокрутки -->
      <div style="padding:12px 16px;">
        <button onclick="openGachaModal('${g.id}')"
          style="width:100%; background:${isLegendaryPool ? 'linear-gradient(135deg,#f59e0b,#b45309,#f59e0b)' : `linear-gradient(135deg, ${g.color}, ${g.borderColor})`}; border:none; border-radius:10px; padding:13px; color:white; font-size:15px; font-weight:900; cursor:pointer; letter-spacing:0.5px; ${isLegendaryPool ? 'box-shadow:0 0 12px rgba(245,158,11,0.5);' : ''}">
          🎲 Крутить — 10 💠
        </button>
        <div style="text-align:center; margin-top:6px; font-size:11px; color:#475569;">
          Открыто: ${unlockedCount}/4 · ${hasLegendary ? '👑 Легендарный получен!' : `Гарант через ${pityLeft} кр.`}
        </div>
      </div>
    </div>`;
  }).join('');
}

// Модальное окно с анимацией результата гачи
function openGachaModal(gachaId) {
  let pool = GACHA_POOLS[gachaId];
  if (!pool) return;
  if (gameData.lunarStones < 10) {
    showCodeResult('❌ Недостаточно Лунных камней!', false); return;
  }

  // Показываем анимацию прокрутки
  document.getElementById('modal-title').innerHTML = `${pool.icon} ${pool.name}`;
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = `
    <div style="text-align:center; padding:30px 0;">
      <div class="gacha-spin-anim" id="gacha-spinner">🎲</div>
      <div style="color:#64748b; font-size:13px; margin-top:12px;">Прокручиваю...</div>
    </div>`;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';

  // Крутим после короткой анимации
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
        <div style="font-size:48px; margin-bottom:12px; animation: gacha-pop 0.4s ease-out;">${isDuplicate ? '↩️' : '👑'}</div>
        <div style="font-size:11px; color:${color}; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">${label.toUpperCase()} ТИТУЛ</div>
        <div style="font-size:20px; font-weight:900; margin-bottom:8px;">${titleHtml}</div>
        ${isDuplicate
          ? `<div style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b44; border-radius:8px; padding:8px 14px; font-size:14px; color:#fbbf24; font-weight:bold; margin-bottom:12px;">Компенсация: ${result.dupComp}</div>`
          : `<div style="font-size:12px; color:#64748b; margin-bottom:16px;">Для класса: ${CLASSES[pool.classId].name}</div>
        <div style="background:rgba(30,41,59,0.8); border-radius:10px; padding:10px; font-size:12px; color:#475569;">
          Выберите титул в меню <b style="color:#94a3b8;">Герой</b> → 👑 Активный титул
        </div>`}
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
          ? `<div style="background:rgba(245,158,11,0.1);border:1px solid #f59e0b44;border-radius:8px;padding:8px 14px;font-size:14px;color:#fbbf24;font-weight:bold;">Компенсация: ${result.dupComp}</div>`
          : `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:10px;font-size:12px;color:#94a3b8;">
              Воспроизводится при <b style="color:#f1f5f9;">победе в бою</b>.<br>Выбрать в профиле персонажа.
            </div>`}
      </div>`;
  } else if (result.type === 'imperials') {
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        <div style="font-size:48px; margin-bottom:12px;">🪙</div>
        <div style="font-size:11px; color:#f59e0b; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">НАГРАДА</div>
        <div style="font-size:28px; font-weight:900; color:#fbbf24;">${result.value.toLocaleString()} 🪙</div>
        <div style="font-size:12px; color:#64748b; margin-top:8px;">Добавлено на счёт</div>
      </div>`;
  } else if (result.type === 'key') {
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        <div style="font-size:48px; margin-bottom:12px;">🗝️</div>
        <div style="font-size:11px; color:#d97706; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">КЛЮЧ</div>
        <div style="font-size:22px; font-weight:900; color:#fbbf24;">${result.keyName}</div>
        <div style="font-size:12px; color:#64748b; margin-top:8px;">Добавлен в инвентарь</div>
      </div>`;
  } else {
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        <div style="font-size:48px; margin-bottom:12px;">💨</div>
        <div style="font-size:14px; color:#475569;">Ничего...</div>
        <div style="font-size:11px; color:#334155; margin-top:6px;">Не повезло в этот раз</div>
      </div>`;
  }

  document.getElementById('modal-desc').innerHTML = `
    ${mainHtml}
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.8); border-radius:10px; padding:10px 14px; margin-top:8px;">
      <span style="font-size:12px; color:#64748b;">До гаранта: <b style="color:#94a3b8;">${spinsLeft}</b></span>
      <span style="font-size:12px; color:#64748b;">Баланс: <b style="color:#67e8f9;">${gameData.lunarStones} 💠</b></span>
    </div>`;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:linear-gradient(135deg,${pool.color},${pool.borderColor}); flex:1; margin-right:6px;" onclick="closeModal(); openGachaModal('${pool.id}')">🎲 Ещё раз</button>
    <button class="action-btn" style="background:#334155; flex:0; padding:12px 16px;" onclick="closeModal()">✕</button>`;
  let closeBtnG = document.getElementById('modal-close-btn'); if (closeBtnG) closeBtnG.style.display = 'none';
}

// ============================================================
// СИСТЕМА СОХРАНЕНИЯ ПРОФИЛЯ
// ============================================================

const PROFILE_SECRET = 'ME_PROFILE_2024_SAVE';

// --- Кодовые таблицы ---
const _B64A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const _RD   = ['common','uncommon','rare','epic','legendary'];
const _RE   = Object.fromEntries(_RD.map((v,i)=>[v,i]));
const _SD   = ['head','body','arms','legs'];
const _SE   = Object.fromEntries(_SD.map((v,i)=>[v,i]));
const _PD   = ['none','heal_once','block_pierce','first_strike'];
const _PE   = Object.fromEntries(_PD.map((v,i)=>[v,i]));
const _UD   = ['none','healBonus','blockBonus','ignoreBlock','dodge'];
const _UE   = Object.fromEntries(_UD.map((v,i)=>[v,i]));
const _CD   = ['','warrior','assassin','guardian','priest','darkknight'];
const _CE   = Object.fromEntries(_CD.map((v,i)=>[v,i]));
const _KE   = { dusty_key:'dk', wood_key:'wk', ancient_key:'ak' };
const _KD   = Object.fromEntries(Object.entries(_KE).map(([a,b])=>[b,a]));
const _CLS  = { warrior:'w', assassin:'a', guardian:'g', priest:'p', darkknight:'d' };
const _CLSD = Object.fromEntries(Object.entries(_CLS).map(([a,b])=>[b,a]));
const _TC   = { uncommon:'u', rare:'r', epic:'e', legendary:'l', mythic:'m' };
const _TD   = Object.fromEntries(Object.entries(_TC).map(([a,b])=>[b,a]));
const _POT  = { small:'S', medium:'M', large:'L' };
const _POTD = Object.fromEntries(Object.entries(_POT).map(([a,b])=>[b,a]));
const _POTH = { small:8, medium:13, large:20 };
const _POTN = { small:'🧪 Малое зелье', medium:'🧪 Среднее зелье', large:'🧪 Большое зелье' };
const _DE   = { mansion:'m', river:'r', temple:'t' };
const _DD   = Object.fromEntries(Object.entries(_DE).map(([a,b])=>[b,a]));

// --- Упаковка/распаковка предметов (битовый формат, 7 символов base64url) ---
function packItem(item) {
  if (!item) return '';
  let b = 0n, pos = 0;
  const push = (v, bits) => { b |= (BigInt(v) & ((1n << BigInt(bits)) - 1n)) << BigInt(pos); pos += bits; };
  push(item.id % 4096, 12);
  push(_RE[item.rarity] ?? 0, 3);
  push(_SE[item.slot]   ?? 0, 2);
  push(Math.min(item.hp || 0, 15), 4);
  push(item.perk ? (_PE[item.perk.type] ?? 0) : 0, 3);
  push(item.perk ? Math.min(item.perk.val || 0, 7) : 0, 3);
  push(item.perk?.charges ? Math.min(item.perk.charges, 3) : 0, 2);
  push(item.unique ? (_UE[item.unique.type] ?? 0) : 0, 3);
  push(item.unique ? (item.unique.type === 'dodge' ? 15 : Math.min(item.unique.val || 0, 7)) : 0, 3);
  push(item.legendary ? 1 : 0, 1);
  push(item.legendary ? Math.min(item.legendary.val || 0, 7) : 0, 3);
  push(_CE[item.classId ?? ''] ?? 0, 3);
  let r = '', tmp = b;
  for (let i = 0; i < 7; i++) { r += _B64A[Number(tmp & 63n)]; tmp >>= 6n; }
  return r;
}

function unpackItem(str) {
  if (!str || str.length < 7) return null;
  let b = 0n;
  for (let i = str.length - 1; i >= 0; i--) b = (b << 6n) | BigInt(_B64A.indexOf(str[i]));
  const pop = bits => { let v = Number(b & ((1n << BigInt(bits)) - 1n)); b >>= BigInt(bits); return v; };
  let id = pop(12), rarity = _RD[pop(3)]||'common', slot = _SD[pop(2)]||'head', hp = pop(4);
  let pt = pop(3), pv = pop(3), pc = pop(2);
  let ut = pop(3), uv = pop(3);
  let lt = pop(1), lv = pop(3);
  let ci = pop(3);
  let item = { id, rarity, slot, hp, perk: null, unique: null, legendary: null, classId: _CD[ci]||null, name: '' };
  if (pt > 0) {
    let type = _PD[pt];
    item.perk = { type, val: pv };
    if (type === 'first_strike') item.perk.charges = pc;
    if (type === 'heal_once')    item.perk.desc = `Лечит ${pv} ХП при падении здоровья.`;
    if (type === 'block_pierce') item.perk.desc = `Блокирует ${pv} пробитого урона (1 раз).`;
    if (type === 'first_strike') item.perk.desc = `Урон +${pv} на первые ${pc} атак.`;
  }
  if (ut > 0) {
    let type = _UD[ut], val = type === 'dodge' ? 0.15 : uv;
    item.unique = { type, val };
    if (type === 'healBonus')   item.unique.desc = `[УНИК] +1 ХП при избыточном блоке.`;
    if (type === 'blockBonus')  item.unique.desc = `[УНИК] +1 ко всем блокам.`;
    if (type === 'ignoreBlock') item.unique.desc = `[УНИК] Игнорирует 1 ед. блока врага.`;
    if (type === 'dodge')       item.unique.desc = `[УНИК] 15% шанс избежать атаки.`;
  }
  if (lt) item.legendary = { type: 'blockStreakBonus', val: lv, desc: `[ЛЕГ] +${lv} к макс. блокам подряд.` };
  item.name = generateItemName(rarity, slot, !!item.perk, !!item.unique, false);
  return item;
}

// --- Упаковка экипировки, ключей, подсумка, данжей, титулов, спинов ---
function packEquip(equip) {
  let r = {};
  Object.keys(equip).forEach(cls => {
    let eq = equip[cls];
    r[cls] = [eq.head, eq.body, eq.arms, eq.legs].map(i => i ? packItem(i) : '.').join(',');
  });
  return r;
}
function unpackEquip(packed) {
  let r = {};
  Object.keys(packed).forEach(cls => {
    let parts = packed[cls].split(',');
    r[cls] = { head: parts[0]!=='.'?unpackItem(parts[0]):null, body: parts[1]!=='.'?unpackItem(parts[1]):null, arms: parts[2]!=='.'?unpackItem(parts[2]):null, legs: parts[3]!=='.'?unpackItem(parts[3]):null };
  });
  Object.keys(CLASSES).forEach(c => { if (!r[c]) r[c] = { head:null, body:null, arms:null, legs:null }; });
  return r;
}

function packKeys(k) { return Object.entries(k).filter(([,v])=>v>0).map(([k,v])=>(_KE[k]||k)+':'+v).join(','); }
function unpackKeys(s) { if (!s) return {}; let r={}; s.split(',').forEach(p=>{let[k,v]=p.split(':');if(k)r[_KD[k]||k]=parseInt(v)||0;}); return r; }

function packPouch(p) { return p.slots+'|'+(p.items||[]).map(x=>_POT[x.type]||x.type).join(''); }
function unpackPouch(s) { if (!s) return {slots:0,items:[]}; let[sl,it]=s.split('|'); return {slots:parseInt(sl)||0,items:(it||'').split('').filter(Boolean).map(c=>{let t=_POTD[c]||c;return{type:t,name:_POTN[t]||t,heal:_POTH[t]||0};})}; }

function packDp(dp) { return Object.entries(dp).filter(([,v])=>v>0).map(([k,v])=>(_DE[k]||k)+':'+v).join(','); }
function unpackDp(s) { if (!s) return {}; let r={}; s.split(',').forEach(p=>{let[k,v]=p.split(':');if(k)r[_DD[k]||k]=parseInt(v)||0;}); return r; }

function packTitles(ttl) { return Object.entries(ttl).filter(([,v])=>v&&v.unlocked&&v.unlocked.length).map(([c,v])=>(_CLS[c]||c)+':'+v.unlocked.map(r=>_TC[r]||r).join('')+':'+(_TC[v.active]||v.active||'')).join(';'); }
function unpackTitles(s) { if (!s) return {}; let r={}; s.split(';').forEach(p=>{let[c,ul,act]=p.split(':'); r[_CLSD[c]||c]={unlocked:(ul||'').split('').map(x=>_TD[x]||x),active:_TD[act]||act||null};}); return r; }

function packSpins(obj) { let s=Object.entries(obj).filter(([,v])=>v>0).map(([k,v])=>(_CLS[k]||k)+':'+v).join(','); return s||undefined; }
function unpackSpins(s) { if (!s) return {}; let r={}; s.split(',').forEach(p=>{let[k,v]=p.split(':');if(k)r[_CLSD[k]||k]=parseInt(v)||0;}); return r; }

// --- Контрольная подпись ---
function profileChecksum(payload) {
  let str = payload + PROFILE_SECRET;
  let h1 = 0, h2 = 0x9e3779b9;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0xcc9e2d51); h1 = (h1 << 15) | (h1 >>> 17); h1 = Math.imul(h1, 0x1b873593);
    h2 = Math.imul(h2 ^ c, 0x85ebca6b); h2 ^= h1;
  }
  h1 ^= str.length; h2 ^= str.length;
  h1 = Math.imul(h1 ^ (h1 >>> 16), 0x85ebca6b); h1 = Math.imul(h1 ^ (h1 >>> 13), 0xc2b2ae35);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 0x85ebca6b); h2 = Math.imul(h2 ^ (h2 >>> 13), 0xc2b2ae35);
  return (Math.abs(h1) + Math.abs(h2)).toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
}

// --- Кодирование / декодирование профиля ---
function encodeProfile() {
  try {
    let snap = {
      lp: gameData.lp,
      i:  gameData.imperials,
      ls: gameData.lunarStones,
      c:  _CLS[gameData.currentClass] || gameData.currentClass,
      inv: gameData.inventory.map(packItem).join(','),
      mi:  gameData.maxInventory > 6 ? gameData.maxInventory : undefined,
      eq:  packEquip(gameData.equip),
      k:   packKeys(gameData.keys),
      dp:  packDp(gameData.dungeonProgress),
      po:  packPouch(gameData.pouch),
      pt:  gameData.hugeChestPity || undefined,
      t:   packTitles(gameData.titles),
      gs:  packSpins(gameData.gachaSpinCount),
      mt:  packTitles(gameData.mythicTitles),
      mg:  packSpins(gameData.mythicGachaSpinCount),
      ef:  gameData.entryEffect  || undefined,
      cf:  gameData.cardFrame    || undefined,
      uf:  gameData.unlockedFrames.length         ? gameData.unlockedFrames.join(',')         : undefined,
      ue:  gameData.unlockedEffects.length        ? gameData.unlockedEffects.join(',')        : undefined,
      uve: gameData.unlockedVictoryEffects.length ? gameData.unlockedVictoryEffects.join(',') : undefined,
      ave: gameData.activeVictoryEffect || undefined,
      dw:  gameData.dailyWins        || undefined,
      dgc: gameData.dailyGiftClaimed || undefined,
      ldd: gameData.lastDailyDate    || undefined,
      uc:  gameData.usedCodes.length ? gameData.usedCodes.join(',') : undefined,
      nid: gameData.nextItemId       || undefined
    };
    Object.keys(snap).forEach(k => snap[k] === undefined && delete snap[k]);
    let safe = btoa(unescape(encodeURIComponent(JSON.stringify(snap)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    let full = safe + profileChecksum(safe);
    let blocks = [];
    for (let i = 0; i < full.length; i += 6) blocks.push(full.slice(i, i + 6));
    return 'ME-' + blocks.join('-');
  } catch(e) { return null; }
}

function decodeProfile(code) {
  try {
    let clean = code.replace(/^ME-/i, '').replace(/-/g, '');
    let payload = clean.slice(0, -8);
    let checksum = clean.slice(-8).toUpperCase();
    if (profileChecksum(payload) !== checksum) return { ok: false, reason: 'Подпись не совпадает. Код повреждён или подделан.' };
    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    let data = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (!data || typeof data !== 'object') return { ok: false, reason: 'Не удалось прочитать код. Проверьте что скопировали полностью.' };
    return { ok: true, data };
  } catch(e) { return { ok: false, reason: 'Не удалось прочитать код. Проверьте что скопировали полностью.' }; }
}

function applyProfileSnapshot(data) {
  gameData.lp           = data.lp  || 0;
  gameData.imperials    = data.i   || 0;
  gameData.lunarStones  = data.ls  || 0;
  gameData.maxInventory = data.mi  || 6;
  gameData.currentClass = _CLSD[data.c] || data.c || 'warrior';
  gameData.inventory    = (data.inv || '').split(',').filter(s => s && s !== '.').map(unpackItem).filter(Boolean);
  gameData.equip        = unpackEquip(data.eq || {});
  gameData.keys         = unpackKeys(data.k   || '');
  gameData.dungeonProgress = unpackDp(data.dp || '');
  gameData.pouch        = unpackPouch(data.po || '0|');
  gameData.hugeChestPity = data.pt || 0;
  gameData.titles               = unpackTitles(data.t  || '');
  gameData.gachaSpinCount       = unpackSpins(data.gs  || '');
  gameData.mythicTitles         = unpackTitles(data.mt || '');
  gameData.mythicGachaSpinCount = unpackSpins(data.mg  || '');
  gameData.entryEffect  = data.ef  || null;
  gameData.cardFrame    = data.cf  || null;
  gameData.unlockedFrames         = data.uf  ? data.uf.split(',').filter(Boolean)  : [];
  gameData.unlockedEffects        = data.ue  ? data.ue.split(',').filter(Boolean)  : [];
  gameData.unlockedVictoryEffects = data.uve ? data.uve.split(',').filter(Boolean) : [];
  gameData.activeVictoryEffect    = data.ave || null;
  gameData.dailyWins        = data.dw  || 0;
  gameData.dailyGiftClaimed = data.dgc || false;
  gameData.lastDailyDate    = data.ldd || '';
  gameData.usedCodes        = data.uc  ? data.uc.split(',').filter(Boolean) : [];
  gameData.nextItemId       = data.nid || 0;
  Object.keys(CLASSES).forEach(c => { if (!gameData.equip[c]) gameData.equip[c] = { head:null, body:null, arms:null, legs:null }; });
  saveData();
}

// --- UI: статус резервной копии ---
function updateBackupStatusLine() {
  let el = document.getElementById('backup-status-line');
  if (!el) return;
  try {
    let raw = localStorage.getItem('middleEarthBackup');
    if (!raw) { el.innerHTML = `<div style="font-size:11px; color:#64748b;">Ещё нет сохранённого кода. Совершите любое действие в игре — код создастся автоматически.</div>`; return; }
    let { ts } = JSON.parse(raw);
    if (!ts) { el.innerHTML = ''; return; }
    let diff = Math.floor((Date.now() - ts) / 1000);
    let ago = diff < 60 ? 'только что' : diff < 3600 ? `${Math.floor(diff/60)} мин. назад` : diff < 86400 ? `${Math.floor(diff/3600)} ч. назад` : `${Math.floor(diff/86400)} дн. назад`;
    let d = new Date(ts), pad = n => String(n).padStart(2,'0');
    let dateStr = `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    el.innerHTML = `<div style="display:flex;align-items:center;gap:6px;background:rgba(22,101,52,0.15);border:1px solid #166534;border-radius:8px;padding:7px 10px;">
      <span style="color:#4ade80;font-size:13px;">✅</span>
      <span style="font-size:11px;color:#4ade80;">Код актуален · обновлён <b>${ago}</b> <span style="color:#166534;">(${dateStr})</span></span></div>`;
  } catch(e) { el.innerHTML = ''; }
}

// --- UI: модальные окна сохранения/загрузки ---
function openSaveProfileModal() {
  let code = null, savedAt = null;
  try { let p = JSON.parse(localStorage.getItem('middleEarthBackup')||'null'); if (p) { code = p.code; savedAt = p.ts; } } catch(e) {}
  if (!code) code = encodeProfile();
  if (!code) { alert('Ошибка при создании кода. Попробуйте ещё раз.'); return; }
  let dateStr = '';
  if (savedAt) { let d = new Date(savedAt), pad = n => String(n).padStart(2,'0'); dateStr = `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} в ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  document.getElementById('modal-title').innerHTML = '💾 Резервная копия';
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-title').style.cssText = '';
  document.getElementById('modal-desc').style.cssText = '';
  document.getElementById('modal-desc').innerHTML = `
    <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;line-height:1.5;">Скопируйте этот код и сохраните в надёжном месте — в заметках или перешлите себе в Telegram.</div>
    ${dateStr ? `<div style="display:flex;align-items:center;gap:6px;background:rgba(22,101,52,0.2);border:1px solid #166534;border-radius:8px;padding:8px 12px;margin-bottom:10px;">
      <span style="color:#4ade80;font-size:14px;">✅</span><span style="font-size:11px;color:#4ade80;">Код актуален — обновлён <b>${dateStr}</b></span></div>` : ''}
    <div style="background:rgba(15,23,42,0.9);border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:12px;">
      <div style="font-size:9px;color:#475569;margin-bottom:6px;letter-spacing:1px;">ВАШ КОД СОХРАНЕНИЯ:</div>
      <div id="profile-code-display" style="font-family:monospace;font-size:11px;color:#67e8f9;word-break:break-all;line-height:1.6;">${code}</div>
    </div>
    <div style="font-size:10px;color:#475569;text-align:center;">🔒 Код зашифрован. Подделать без секретного ключа невозможно.</div>`;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:linear-gradient(135deg,#0e7490,#0891b2);flex:1;margin-right:6px;" onclick="copyProfileCode()">📋 Скопировать</button>
    <button class="action-btn" style="background:#334155;flex:0;padding:12px 16px;" onclick="closeModal()">✕</button>`;
  document.getElementById('item-modal').style.display = 'flex';
}

function copyProfileCode() {
  let code = (document.getElementById('profile-code-display')||{}).innerText || '';
  let done = () => { let btn = document.querySelector('#modal-actions button'); if (!btn) return; let orig = btn.innerHTML; btn.innerHTML = '✅ Скопировано!'; btn.style.background = '#059669'; setTimeout(()=>{btn.innerHTML=orig;btn.style.background='';},2000); };
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(done).catch(()=>fallbackCopy(code,done)); }
  else fallbackCopy(code, done);
}
function fallbackCopy(text, cb) {
  let ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); if (cb) cb(); } catch(e) {}
  document.body.removeChild(ta);
}

function openRestoreProfileModal() {
  document.getElementById('modal-title').innerHTML = '🔄 Восстановить профиль';
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-title').style.cssText = '';
  document.getElementById('modal-desc').style.cssText = '';
  document.getElementById('modal-desc').innerHTML = `
    <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;line-height:1.5;">Вставьте ваш код сохранения. <b style="color:#ef4444;">Внимание:</b> текущий прогресс будет заменён данными из кода.</div>
    <textarea id="restore-input" placeholder="ME-XXXXXX-XXXXXX-..."
      style="width:100%;height:90px;background:rgba(15,23,42,0.9);border:1px solid #334155;border-radius:8px;padding:10px;color:#e2e8f0;font-size:11px;font-family:monospace;resize:none;outline:none;box-sizing:border-box;"></textarea>
    <div id="restore-result" style="display:none;margin-top:8px;font-size:12px;font-weight:bold;text-align:center;"></div>`;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:linear-gradient(135deg,#b45309,#f59e0b);flex:1;margin-right:6px;" onclick="confirmRestoreProfile()">🔄 Восстановить</button>
    <button class="action-btn" style="background:#334155;flex:0;padding:12px 16px;" onclick="closeModal()">✕</button>`;
  document.getElementById('item-modal').style.display = 'flex';
}

function confirmRestoreProfile() {
  let code = (document.getElementById('restore-input')||{}).value.trim();
  if (!code) { showRestoreResult('Вставьте код сохранения!', false); return; }
  let result = decodeProfile(code);
  if (!result.ok) { showRestoreResult('❌ ' + result.reason, false); return; }
  let d = result.data;
  let rank = getRank(d.lp || 0);
  let cls = _CLSD[d.c] || d.c || 'warrior';
  let invCount = d.inv ? d.inv.split(',').filter(s => s && s !== '.').length : 0;
  document.getElementById('restore-result').innerHTML = `
    <div style="background:rgba(15,23,42,0.9);border:1px solid #334155;border-radius:10px;padding:12px;margin-top:10px;font-size:12px;text-align:left;">
      <div style="color:#94a3b8;font-size:10px;margin-bottom:8px;letter-spacing:1px;">ПРОФИЛЬ В КОДЕ:</div>
      <div style="color:#f1f5f9;margin-bottom:4px;">⚔️ Класс: <b>${CLASSES[cls]?.name || cls}</b></div>
      <div style="color:#f1f5f9;margin-bottom:4px;">${rank.icon} Ранг: <b>${rank.name} · ${d.lp || 0} LP</b></div>
      <div style="color:#fbbf24;margin-bottom:4px;">🪙 Империалы: <b>${(d.i||0).toLocaleString()}</b></div>
      <div style="color:#67e8f9;margin-bottom:4px;">💠 Лунных камней: <b>${d.ls||0}</b></div>
      <div style="color:#f1f5f9;margin-bottom:4px;">🎒 Предметов: <b>${invCount} / ${d.mi||6}</b></div>
    </div>
    <div style="color:#ef4444;font-size:11px;margin-top:10px;text-align:center;">Текущий прогресс будет заменён. Вы уверены?</div>`;
  document.getElementById('restore-result').style.display = 'block';
  window._pendingRestoreCode = code;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:#ef4444;flex:1;margin-right:6px;" onclick="executeRestoreProfile()">✅ Да, применить</button>
    <button class="action-btn" style="background:#334155;flex:0;padding:12px 16px;" onclick="openRestoreProfileModal()">← Назад</button>`;
}

function executeRestoreProfile() {
  let code = window._pendingRestoreCode || '';
  window._pendingRestoreCode = null;
  let result = decodeProfile(code);
  if (!result.ok) { alert('Ошибка при восстановлении.'); return; }
  applyProfileSnapshot(result.data);
  closeModal();
  renderMainMenu(); updateHeroTab(); updateBagTab();
  setTimeout(() => showCodeResult('✅ Профиль восстановлен!', true), 300);
}

function showRestoreResult(msg, isSuccess) {
  let el = document.getElementById('restore-result');
  if (!el) return;
  el.innerText = msg;
  el.style.color = isSuccess ? '#10b981' : '#ef4444';
  el.style.display = 'block';
}

// ============================================================
// СТАРТ
// ============================================================

renderMainMenu();
