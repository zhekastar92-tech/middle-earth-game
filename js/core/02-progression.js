// ============================================================
// PROGRESSION
// Ежедневный сброс, миграция названий предметов, saveData, ранги/арены и их расчёты.
// ============================================================

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
