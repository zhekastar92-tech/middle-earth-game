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
  gachaSpinCount: {} // { gachaId: N } — счётчик прокруток для гаранта
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

  // Кнопка титула
  let titleEl = document.getElementById('hero-title-btn');
  if (titleEl) {
    let td = gameData.titles[gameData.currentClass];
    let activeRarity = td && td.active ? td.active : null;
    let pool = GACHA_POOLS[gameData.currentClass];
    let titleDisplay = '';
    if (activeRarity && pool) {
      titleDisplay = getTitleHtml(activeRarity, pool.titles[activeRarity].name);
    } else {
      titleDisplay = '<span style="color:#475569;">Без титула</span>';
    }
    titleEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:12px; padding:14px 16px; cursor:pointer;" onclick="openTitleModal()">
        <div>
          <div style="font-size:11px; color:#64748b; margin-bottom:4px;">👑 Активный титул</div>
          <div style="font-size:14px;">${titleDisplay}</div>
        </div>
        <div style="color:#475569; font-size:18px;">›</div>
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
    blockStreak: 0,      // сколько блоков подряд поставлено
    blockStreakMax: 3,   // порог — после него следующий ход принудительно атака
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

// Применяет урон к мобу с учётом эффекта «Как ты с-с-смеешь» (hiss)
function applyDmgToMob(mob, attacker, dmg, mobName, isSkill) {
  if (mob.hissActive && dmg > 0) {
    dmg = Math.max(0, dmg - 1);
    if (dmg === 0) return `<span class="text-info">🐉 «Как ты с-с-смеешь» поглощает весь урон!</span><br>`;
  }
  return applyDamage(mob, attacker, dmg, mobName, isSkill);
}

function playTurn(playerChoice) {
  if (gameIsOver) return;
  lastPlayerDmgThisTurn = 0;

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
    // Морской дракон: Устрашение — снижает атаку и блок игрока (до min 1)
    if (bot.waterBlastActive) {
      pAttack = Math.max(1, pAttack - 1);
      pBlock  = Math.max(1, pBlock  - 1);
      logMsg += `<span class="text-dmg">😨 Устрашение: ваши атака и блок снижены на 1! (осталось ${bot.waterBlastTurnsLeft} хода)</span><br>`;
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
        // Игрок атакует моба
        let bDmgTaken = pAttack; // моб без уклонения
        if (bDmgTaken > 0) { logMsg += applyDmgToMob(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill); lastPlayerDmgThisTurn += Math.max(0, bot.hissActive ? bDmgTaken - 1 : bDmgTaken); }
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
    logMsg += checkMobSubmitTrigger(bot, lastPlayerDmgThisTurn);
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
// rollMobLoot, grantBossReward, showFloorBreak, continueToNextFloor, exitDungeon — см. dungeons.js

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
        if (a === 'bite') desc += `🦖 <b>Укус</b> — каждые -10 ХП: следующая атака +3 урона<br>`;
        if (a === 'hiss') desc += `🐉 <b>Как ты с-с-смеешь...</b> — при 4+ урона за ход: снижает получаемый урон на 1 на 2 хода<br>`;
        if (a === 'rage_hot') desc += `🐉 <b>Не стоило меня злить</b> — при потере 18 ХП: регенерация +1 ХП каждый ход<br>`;
        if (a === 'water_blast') desc += `🌊 <b>Узри мощь воды</b> — на 20 ходу: 5 урона игнорируя броню + Устрашение (-1 атака и блок на 3 хода)<br>`;
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
    hidden: false, // ← true = скрыта. Поменять на false чтобы открыть
    name: 'Страж Врат Вечности',
    tagline: 'уже в игре!',
    classId: 'guardian',
    icon: '🛡️',
    color: '#f59e0b',
    borderColor: '#b45309',
    titles: {
      uncommon:  { label: 'Необычный',  name: 'Железный страж',            chance: 0.15 },
      rare:      { label: 'Редкий',     name: 'Сияющий страж',             chance: 0.07 },
      epic:      { label: 'Эпический',  name: 'Несокрушимый Бастион Страж', chance: 0.02 },
      legendary: { label: 'Легендарный',name: 'Страж Врат Вечности',        chance: 0.004 }
    }
  },
  warrior: {
    id: 'warrior',
    hidden: true, // ← поменять на false чтобы открыть
    name: 'Воин Сын Императора',
    tagline: 'Склонитесь! Воин Сын Императора прибыл!',
    classId: 'warrior',
    icon: '⚔️',
    color: '#d97706',
    borderColor: '#b45309',
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
    name: 'Рыцарь Кровавого Затмения',
    tagline: 'Земля дрожит в страхе — Рыцарь Кровавого Затмения пробудился!',
    classId: 'darkknight',
    icon: '🦇',
    color: '#dc2626',
    borderColor: '#991b1b',
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
    name: 'Космический Захватчик Убийца',
    tagline: 'Мир обречён... Космический Захватчик Убийца уже здесь...',
    classId: 'assassin',
    icon: '🌙',
    color: '#7c3aed',
    borderColor: '#6d28d9',
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
    name: 'Ослепительное Солнце Жрец',
    tagline: 'Ослепительное Солнце Жрец явился чтобы сжечь врагов',
    classId: 'priest',
    icon: '☀️',
    color: '#f59e0b',
    borderColor: '#d97706',
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
    // Гарант — легендарный титул
    result = { type: 'title', rarity: 'legendary', value: pool.titles.legendary.name };
    gameData.gachaSpinCount[gachaId] = 0;
  } else if (r < 0.004) {
    result = { type: 'title', rarity: 'legendary', value: pool.titles.legendary.name };
    gameData.gachaSpinCount[gachaId] = 0;
  } else if (r < 0.004 + 0.02) {
    result = { type: 'title', rarity: 'epic', value: pool.titles.epic.name };
  } else if (r < 0.004 + 0.02 + 0.07) {
    result = { type: 'title', rarity: 'rare', value: pool.titles.rare.name };
  } else if (r < 0.004 + 0.02 + 0.07 + 0.15) {
    result = { type: 'title', rarity: 'uncommon', value: pool.titles.uncommon.name };
  } else if (r < 0.244 + 0.60) {
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
  } else if (r < 0.844 + 0.16) {
    // Ключи
    let kr = Math.random();
    let keyId, keyName;
    if (kr < 0.65) { keyId = 'dusty_key'; keyName = '🗝️ Пыльный ключ'; }
    else { keyId = 'wood_key'; keyName = '🗝️ Древесный ключ'; }
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

// Получить активный титул для класса (строка для отображения)
function getActiveTitle(classId) {
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

  if (!pool) {
    slotsHtml += `<div style="color:#475569; text-align:center; padding:20px; font-size:13px;">Для этого класса рулетка ещё не открыта</div>`;
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
  saveData();
  openTitleModal();
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
    showCodeResult('❌ Сумка полна!', false);
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
  openItemModalById(item.id, false);
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

    <!-- Косметика — рулетки ПЕРВОЙ -->
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

    <!-- Ключи (скоро) -->
    <div class="class-card" style="border:2px solid #374151; background:rgba(15,20,30,0.7); margin-bottom:16px; text-align:left; opacity:0.7;">
      <div class="class-title" style="color:#94a3b8; margin-bottom:4px;">🗝️ Ключи подземелий</div>
      <div class="class-desc">Эксклюзивные ключи за Лунные камни.</div>
      <div style="margin-top:12px; text-align:center; color:#475569; font-size:13px; font-style:italic; padding:10px;">⏳ Скоро — новые подземелья</div>
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
  renderGachaList();
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
    let isLegendaryPool = g.color === '#f59e0b'; // Страж Врат — золотая рулетка
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
}

// ============================================================
// СТАРТ
// ============================================================

renderMainMenu();
