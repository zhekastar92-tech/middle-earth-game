// ============================================================
// COMBAT SETUP
// Состояние боя, инициализация персонажа, таймер хода, запуск арены (startGame).
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

  // Генерируем косметику бота: титул, рамку, эффект появления
  let botCosmetics = rollBotCosmetics(botClassId);
  bot.activeTitle = botCosmetics.title;
  bot.cardFrame = botCosmetics.frame || null;
  bot.entryEffect = botCosmetics.entryEffect || null;

  gameIsOver = false; turnCount = 1; lastPlayerDmgThisTurn = 0; lastMobDmgThisTurn = 0;
  currentBotName = "Player " + (Math.floor(Math.random() * 999) + 1);
  let currentArena = getArena(gameData.lp); let pRank = getRank(player.lp); let bRank = getRank(bot.lp);
  document.getElementById("battle-arena").className = "arena " + currentArena.arenaClass;

  // Применяем пользовательскую рамку игрока (приоритет над ранговой)
  let playerCardClass = "character ";
  if (gameData.cardFrame && FRAME_META[gameData.cardFrame]) {
    playerCardClass += "has-frame " + FRAME_META[gameData.cardFrame].class;
  } else {
    playerCardClass += pRank.borderClass;
  }
  document.getElementById("player-card").className = playerCardClass;

  // Применяем рамку бота (мифическая рамка приоритетнее ранговой)
  let botCard = document.getElementById("bot-card");
  if (bot.cardFrame && FRAME_META[bot.cardFrame]) {
    botCard.className = "character has-frame " + FRAME_META[bot.cardFrame].class;
  } else {
    botCard.className = "character " + bRank.borderClass;
  }
  applyFrameToCard(document.getElementById("player-card"), gameData.cardFrame);
  applyFrameToCard(botCard, bot.cardFrame);

  document.getElementById("combat-log").innerHTML = `<div class='log-entry text-skill'>⚔️ Локация: ${currentArena.icon} ${currentArena.name}! Бой начинается.</div>`;
  document.getElementById("btn-return").style.display = "none";
  updateScreen(); switchTab(null, "tab-battle");

  document.getElementById("main-screen").style.display = "none";
  document.getElementById("battle-screen").style.display = "block";

  // Скрываем обе карточки ДО анимаций появления
  let playerCard = document.getElementById("player-card");
  let hasPlayerEffect = gameData.entryEffect && ENTRY_EFFECT_META[gameData.entryEffect];
  let hasBotEffect = bot.entryEffect && ENTRY_EFFECT_META[bot.entryEffect];

  if (hasPlayerEffect) playerCard.classList.add("entry-hidden");
  if (hasBotEffect) botCard.classList.add("entry-hidden");

  if (hasPlayerEffect && hasBotEffect) {
    // Оба с эффектами: игрок первый, потом бот → потом таймер
    playEntryEffect(playerCard, function() {
      setTimeout(() => playBotEntryEffect(botCard, function() { startTurnTimer(); }), 400);
    });
  } else if (hasPlayerEffect) {
    // Только игрок
    playEntryEffect(playerCard, function() { startTurnTimer(); });
  } else if (hasBotEffect) {
    // Только бот
    playBotEntryEffect(botCard, function() { startTurnTimer(); });
  } else {
    // Никого — сразу
    startTurnTimer();
  }
}
