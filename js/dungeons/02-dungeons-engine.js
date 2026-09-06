// ============================================================
// DUNGEONS ENGINE
// Состояние подземелья, инициализация мобов, запуск данжа/этажа/боя.
// ============================================================

// ============================================================
// СОСТОЯНИЕ ПОДЗЕМЕЛЬЯ
// ============================================================

let dungeonState = null;

// Создаёт объект моба для боя на основе шаблона из DUNGEON_MOBS
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
    diseaseActive: false,         // Наблюдатель: блокирует лечение
    diseaseTurnsLeft: 0,
    diseaseHpThreshold: template.hp - 10, // первый триггер на -10 хп
    fateActive: false,            // Сильвия: блокирует блок игрока
    fateTurnsLeft: 0,
    fateNoHitTurns: 0,            // счётчик ходов без урона
    submitActive: false,          // Сильвия: x2 урон
    submitTurnsLeft: 0,
    notoverUsed: false,           // Сильвия: лечение одноразовое
    notoverHotLeft: 0,            // HoT Сильвии
    // Гигантский ящер
    biteHpThreshold: template.hp - 10, // триггер укуса на -10 хп
    // Каменный страж
    stoneSkinPhase: 1,            // 1 = первый триггер (≤20), 2 = второй (≤8)
    // Хранитель храма
    doomActive: false,            // Здесь твоя погибель: блок=0
    doomTurnsLeft: 0,
    doomNoHitTurns: 0,            // счётчик ходов без урона
    suppressUsed: false,          // Подчинись моей воле: одноразовый дебаф
    suppressActive: false,
    suppressTurnsLeft: 0,
    summonUsed: false,            // Пробуждайся: призыв порабощённого
    summonActive: false,          // идёт фаза порабощённого
    summonSurvived: 0,            // сколько ходов прожил раб
    // Морской дракон
    hissActive: false,            // Как ты с-с-смеешь: снижение урона на 1
    hissTurnsLeft: 0,
    rageHotActive: false,         // Не стоило меня злить: +1 хп каждый ход
    rageHotUsed: false,
    waterBlastUsed: false,        // Узри мощь воды: одноразово на 20 ходу
    waterBlastActive: false,      // дебаф Устрашения на игроке
    waterBlastTurnsLeft: 0,
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

// Запуск подземелья: списывает ключ, инициализирует игрока, запускает первый этаж
function startDungeon(dungeonId) {
  let dungeon = DUNGEONS[dungeonId];
  let keyCount = gameData.keys[dungeon.keyId] || 0;
  if (keyCount <= 0) {
    alert(`Нужен ${dungeon.keyName} для входа!`);
    return;
  }
  gameData.keys[dungeon.keyId] = keyCount - 1;
  saveData();

  dungeonState = {
    dungeonId: dungeonId,
    floorIndex: 0,
    enemyIndex: 0,
    playerHp: null,
    mode: 'dungeon'
  };

  player = initChar(gameData.currentClass, false, gameData.lp);
  dungeonState.playerHp = player.hp;

  startDungeonFloor();
}

// Инициализирует этаж: строит очередь врагов, восстанавливает HP игрока
function startDungeonFloor() {
  let dungeon = DUNGEONS[dungeonState.dungeonId];
  let floor = dungeon.floors[dungeonState.floorIndex];

  dungeonState.enemyQueue = floor.enemies.map(id => initMob(id));
  dungeonState.enemyIndex = 0;

  player.hp = dungeonState.playerHp;

  startDungeonFight();
}

// Запускает бой со следующим врагом в очереди
function startDungeonFight() {
  let dungeon = DUNGEONS[dungeonState.dungeonId];
  let floor = dungeon.floors[dungeonState.floorIndex];
  let floorNum = dungeonState.floorIndex + 1;
  let totalFloors = dungeon.floors.length;

  bot = dungeonState.enemyQueue[dungeonState.enemyIndex];

  gameIsOver = false; turnCount = 1;
  currentBotName = bot.name;

  document.getElementById("battle-arena").className = "arena " + dungeon.dungeonClass;
  // Применяем пользовательскую рамку (приоритет над ранговой)
  let playerCardClass = "character ";
  if (gameData.cardFrame && typeof FRAME_META !== 'undefined' && FRAME_META[gameData.cardFrame]) {
    playerCardClass += "has-frame " + FRAME_META[gameData.cardFrame].class;
  } else {
    playerCardClass += getRank(player.lp).borderClass;
  }
  document.getElementById("player-card").className = playerCardClass;
  document.getElementById("bot-card").className = "character border-mob-" + bot.tier;
  if (typeof applyFrameToCard === 'function') applyFrameToCard(document.getElementById("player-card"), gameData.cardFrame);

  let enemyNum = dungeonState.enemyIndex + 1;
  let enemyTotal = dungeonState.enemyQueue.length;
  document.getElementById("combat-log").innerHTML = `<div class='log-entry text-skill'>${dungeon.icon} ${dungeon.name} — Этаж ${floorNum}/${totalFloors}. Враг ${enemyNum}/${enemyTotal}: ${bot.icon} ${bot.name}</div>`;

  document.getElementById("btn-return").style.display = "none";
  updateScreen();
  switchTab(null, "tab-battle");
  document.getElementById("main-screen").style.display = "none";
  document.getElementById("battle-screen").style.display = "block";
  // Эффект появления только при первом враге каждого этажа
  if (dungeonState.enemyIndex === 0 && typeof playEntryEffect === 'function') {
    let playerCard = document.getElementById("player-card");
    let hasEntryEffect = gameData.entryEffect && typeof ENTRY_EFFECT_META !== 'undefined' && ENTRY_EFFECT_META[gameData.entryEffect];
    if (hasEntryEffect) {
      playerCard.classList.add("entry-hidden");
    }
    playEntryEffect(playerCard, function() { startTurnTimer(); });
  } else {
    startTurnTimer();
  }
}
