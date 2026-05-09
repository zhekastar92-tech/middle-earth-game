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

// ============================================================
// БОЕВАЯ ЛОГИКА МОБОВ
// ============================================================

// Бросок атаки и блока моба (с учётом активных эффектов)
function rollDungeonMobAction(mob) {
  let atk = mob.attackMin + Math.floor(Math.random() * (mob.attackMax - mob.attackMin + 1));
  let blk = mob.blockMin + Math.floor(Math.random() * (mob.blockMax - mob.blockMin + 1));

  // «Подчинись мне!» — x2 атака
  if (mob.submitActive && mob.submitTurnsLeft > 0) {
    atk *= 2;
  }

  // УКУС — +3 к атаке, сбрасываем флаг
  if (mob.biteReady) {
    atk += 3;
    mob.biteReady = false;
  }

  return { atk, blk };
}

// Триггеры способностей моба ДО хода (submit — после, см. checkMobSubmitTrigger)
function checkMobAbilitiesPreTurn(mob) {
  let msg = "";

  // НАБЛЮДАТЕЛЬ: Болезнь — срабатывает каждые -10 хп
  if (mob.abilities.includes('disease')) {
    while (mob.diseaseHpThreshold > 0 && mob.hp <= mob.diseaseHpThreshold) {
      mob.diseaseHpThreshold -= 10;
      mob.diseaseActive = true;
      mob.diseaseTurnsLeft = 3;
      msg += `<span class="text-dmg">🦠 Болезнь! ${mob.name} блокирует всё лечение на 3 хода!</span><br>`;
    }
  }

  // ЛЕДИ СИЛЬВИЯ: Прими свою судьбу — после 3 ходов без урона
  if (mob.abilities.includes('fate') && !mob.fateActive) {
    mob.fateNoHitTurns++;
    if (mob.fateNoHitTurns >= 3) {
      mob.fateActive = true;
      mob.fateTurnsLeft = 3;
      mob.fateNoHitTurns = 0;
      msg += `<span class="text-dmg">😶 Леди Сильвия произносит: «Прими свою судьбу!» — Вы не можете блокировать 3 хода!</span><br>`;
    }
  }

  // ЛЕДИ СИЛЬВИЯ: Это ещё не конец — одноразово при HP <= 15
  if (mob.abilities.includes('notover') && !mob.notoverUsed && mob.hp <= 15 && mob.hp > 0) {
    mob.notoverUsed = true;
    mob.hp = Math.min(mob.maxHp, mob.hp + 3);
    mob.notoverHotLeft = 2;
    msg += `<span class="text-heal">💜 Леди Сильвия шепчет: «Это ещё не конец...» — +3 ХП!</span><br>`;
  }

  // КАМЕННЫЙ СТРАЖ: Каменная кожа — отражение урона при порогах HP
  if (mob.abilities.includes('stone_skin')) {
    if (mob.stoneSkinPhase === 1 && mob.hp <= 20) {
      mob.stoneSkinPhase = 2;
      mob.stoneSkinReflect = 1;
      msg += `<span class="text-dmg">🗿 Каменная кожа активирована! Каменный страж отражает 1 урона.</span><br>`;
    } else if (mob.stoneSkinPhase === 2 && mob.hp <= 8) {
      mob.stoneSkinPhase = 3;
      mob.stoneSkinReflect = 2;
      msg += `<span class="text-dmg">🗿 Каменная кожа усилилась! Каменный страж отражает 2 урона.</span><br>`;
    }
  }

  // ХРАНИТЕЛЬ ХРАМА: Здесь твоя погибель — если 3 хода без урона игроку
  if (mob.abilities.includes('doom') && !mob.doomActive) {
    mob.doomNoHitTurns++;
    if (mob.doomNoHitTurns > 3) {
      mob.doomActive = true;
      mob.doomTurnsLeft = 2;
      mob.doomNoHitTurns = 0;
      msg += `<span class="text-dmg">🧝🏻‍♂️ Хранитель шепчет: «Здесь твоя погибель...» — ваш блок = 0 на 2 хода!</span><br>`;
    }
  }

  // ХРАНИТЕЛЬ ХРАМА: Призыв Порабощённого — одноразово при потере 18 хп
  if (mob.abilities.includes('summon_slave') && !mob.summonUsed && mob.hp <= mob.maxHp - 18) {
    mob.summonUsed = true;
    mob.summonActive = true;
    mob.summonSurvived = 0;
    // Создаём порабощённого в dungeonState
    dungeonState.slave = initMob('enslaved');
    msg += `<span class="text-dmg">🧝🏻‍♂️ Хранитель взывает: «Пробуждайся, мой верный раб!» — появился 👳🏻‍♂️ Порабощённый!</span><br>`;
  }

  // ГИГАНТСКИЙ ЯЩЕР: Укус — срабатывает каждые -10 хп
  if (mob.abilities.includes('bite')) {
    while (mob.biteHpThreshold > 0 && mob.hp <= mob.biteHpThreshold) {
      mob.biteHpThreshold -= 10;
      msg += `<span class="text-dmg">🦖 Ящер приходит в ярость — следующая атака будет усиленной!</span><br>`;
      mob.biteReady = true;
    }
  }

  // МОРСКОЙ ДРАКОН: Не стоило меня злить — одноразово при потере 18 хп
  if (mob.abilities.includes('rage_hot') && !mob.rageHotUsed && mob.hp <= mob.maxHp - 18) {
    mob.rageHotUsed = true;
    mob.rageHotActive = true;
    msg += `<span class="text-dmg">🐉 Морской дракон рычит: «Не стоило меня злить!» — регенерация +1 ХП каждый ход!</span><br>`;
  }

  // МОРСКОЙ ДРАКОН: Узри мощь воды — строго на 20 ходу
  if (mob.abilities.includes('water_blast') && !mob.waterBlastUsed && typeof turnCount !== 'undefined' && turnCount >= 20) {
    mob.waterBlastUsed = true;
    // Наносим 5 урона игнорируя всё
    player.hp -= 5;
    if (player.hp < 0) player.hp = 0;
    // Накладываем Устрашение
    mob.waterBlastActive = true;
    mob.waterBlastTurnsLeft = 3;
    msg += `<span class="text-dmg">🌊 Морской дракон вздымается: «Узри мощь воды!» — 5 урона игнорируя броню!</span><br>`;
    msg += `<span class="text-dmg">😨 Устрашение! Ваши атака и блок снижены на 1 на 3 хода.</span><br>`;
  }

  return msg;
}

// «Подчинись мне» и «Как ты с-с-смеешь» — проверяются ПОСЛЕ боя (урон уже посчитан)
function checkMobSubmitTrigger(mob, playerDmgThisTurn, mobDmgThisTurn = 0) {
  let msg = "";

  // ЛЕДИ СИЛЬВИЯ: Подчинись мне
  if (mob.abilities.includes('submit') && !mob.submitActive && playerDmgThisTurn >= 4) {
    mob.submitActive = true;
    mob.submitTurnsLeft = 2;
    msg += `<span class="text-dmg">😡 Леди Сильвия кричит: «Подчинись мне!» — Её урон x2 на 2 хода!</span><br>`;
  }

  // МОРСКОЙ ДРАКОН: Как ты с-с-смеешь — триггер на 4+ суммарного урона за ход
  if (mob.abilities.includes('hiss') && !mob.hissActive && playerDmgThisTurn >= 4) {
    mob.hissActive = true;
    mob.hissTurnsLeft = 2;
    msg += `<span class="text-dmg">🐉 Дракон шипит: «Как ты с-с-смеешь...» — получаемый урон снижен на 1 на 2 хода!</span><br>`;
  }

  // ХРАНИТЕЛЬ ХРАМА: Подчинись моей воле — триггер на 4+ урона за ход, повторяется
  if (mob.abilities.includes('suppress') && !mob.suppressActive && playerDmgThisTurn >= 4) {
    mob.suppressActive = true;
    mob.suppressTurnsLeft = 2;
    msg += `<span class="text-dmg">🧝🏻‍♂️ Хранитель рычит: «Подчинись моей воле!» — ваша атака = 1 на 2 хода (Угнетение)!</span><br>`;
  }

  // ХРАНИТЕЛЬ ХРАМА: сбрасываем счётчик doom если босс нанёс урон игроку в этот ход
  if (mob.abilities.includes('doom') && mobDmgThisTurn > 0) {
    mob.doomNoHitTurns = 0;
  }

  return msg;
}

// Тик эффектов моба в конце хода
function tickMobEffects(mob, playerDmgThisTurn) {
  let msg = "";

  if (mob.diseaseActive) {
    mob.diseaseTurnsLeft--;
    if (mob.diseaseTurnsLeft <= 0) {
      mob.diseaseActive = false;
      msg += `<span class="text-info">🦠 Болезнь прошла — лечение восстановлено.</span><br>`;
    }
  }

  if (mob.fateActive) {
    mob.fateTurnsLeft--;
    if (mob.fateTurnsLeft <= 0) {
      mob.fateActive = false;
      mob.fateNoHitTurns = 0;
      msg += `<span class="text-info">😶 Эффект «Прими судьбу» закончился.</span><br>`;
    }
  }

  if (mob.submitActive) {
    mob.submitTurnsLeft--;
    if (mob.submitTurnsLeft <= 0) {
      mob.submitActive = false;
      msg += `<span class="text-info">😡 Эффект «Подчинись мне» закончился.</span><br>`;
    }
  }

  // Сильвия: HoT «Это ещё не конец»
  if (mob.notoverHotLeft > 0) {
    mob.hp = Math.min(mob.maxHp, mob.hp + 2);
    mob.notoverHotLeft--;
    msg += `<span class="text-heal">💜 Воля Сильвии: +2 ХП (осталось ${mob.notoverHotLeft} хода)</span><br>`;
  }

  // Сильвия: если игрок нанёс урон — сбрасываем счётчик безударных ходов
  if (mob.abilities.includes('fate') && playerDmgThisTurn > 0 && !mob.fateActive) {
    mob.fateNoHitTurns = 0;
  }

  // КАМЕННЫЙ СТРАЖ: сброс отражения если моб умер (обрабатывается в applyDamage)
  // здесь только тик для совместимости

  // ХРАНИТЕЛЬ ХРАМА: Doom тик
  if (mob.doomActive) {
    mob.doomTurnsLeft--;
    if (mob.doomTurnsLeft <= 0) {
      mob.doomActive = false;
      mob.doomNoHitTurns = 0;
      msg += `<span class="text-info">🧝🏻‍♂️ Эффект «Здесь твоя погибель» закончился.</span><br>`;
    }
  }

  // ХРАНИТЕЛЬ ХРАМА: Suppress тик
  if (mob.suppressActive) {
    mob.suppressTurnsLeft--;
    if (mob.suppressTurnsLeft <= 0) {
      mob.suppressActive = false;
      msg += `<span class="text-info">🧝🏻‍♂️ Угнетение спало — ваша атака восстановлена.</span><br>`;
    }
  }

  // ХРАНИТЕЛЬ ХРАМА: счётчик ходов порабощённого
  // Когда мы сражаемся с Порабощённым, текущий mob — это раб, не Хранитель.
  // Хранитель в это время хранится в dungeonState.slaveKeeper — тикаем его напрямую.
  if (dungeonState && dungeonState.slaveKeeper && dungeonState.slaveKeeper.summonActive && dungeonState.slave && dungeonState.slave.hp > 0) {
    dungeonState.slaveKeeper.summonSurvived++;
  } else if (mob.summonActive && dungeonState && dungeonState.slave && dungeonState.slave.hp > 0) {
    // Запасной путь: если Хранитель ещё не переключён в slaveKeeper
    mob.summonSurvived++;
  }

  // МОРСКОЙ ДРАКОН: Как ты с-с-смеешь — тик таймера
  if (mob.hissActive) {
    mob.hissTurnsLeft--;
    if (mob.hissTurnsLeft <= 0) {
      mob.hissActive = false;
      msg += `<span class="text-info">🐉 Эффект «Как ты с-с-смеешь» закончился.</span><br>`;
    }
  }

  // МОРСКОЙ ДРАКОН: Не стоило меня злить — +1 ХП каждый ход
  if (mob.rageHotActive) {
    mob.hp = Math.min(mob.maxHp, mob.hp + 1);
    msg += `<span class="text-heal">🐉 Ярость дракона: +1 ХП регенерации.</span><br>`;
  }

  // МОРСКОЙ ДРАКОН: Устрашение — тик таймера
  if (mob.waterBlastActive) {
    mob.waterBlastTurnsLeft--;
    if (mob.waterBlastTurnsLeft <= 0) {
      mob.waterBlastActive = false;
      msg += `<span class="text-info">😨 Устрашение прошло — ваши характеристики восстановлены.</span><br>`;
    }
  }

  return msg;
}

// ============================================================
// ЛOOT И НАГРАДЫ
// ============================================================

// Лут с обычного / элитного моба
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

// Награда за убийство босса (последний этаж)
function grantBossReward(dungeonId) {
  let dungeon = DUNGEONS[dungeonId];
  let reward = dungeon.bossReward;
  let msg = `<br><span class="text-skill">🏆 ДАНЖ ПРОЙДЕН! ${dungeon.icon} ${dungeon.name}</span><br>`;

  gameData.imperials += reward.imperials;
  msg += `<span class="text-heal">💰 +${reward.imperials} Империалов!</span><br>`;

  // Ключ следующего данжа с боссов 1 и 2
  if (reward.keyDrop) {
    if (Math.random() < reward.keyDrop.chance) {
      gameData.keys[reward.keyDrop.keyId] = (gameData.keys[reward.keyDrop.keyId] || 0) + 1;
      msg += `<span class="text-skill">🗝️ Выпал ${reward.keyDrop.keyName}!</span><br>`;
    }
  }

  // Гарантированные предметы (1 или 2 в зависимости от данжа)
  let itemCount = reward.guaranteedCount || 1;
  for (let i = 0; i < itemCount; i++) {
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
  }

  // Бонусный сундук
  if (Math.random() < reward.bonusChestChance) {
    let isHuge = Math.random() < reward.bonusChestEpicChance;
    let chestType = isHuge ? 4 : 3;
    msg += `<span class="text-skill">🎲 Бонус: ${isHuge ? 'Огромный' : 'Большой'} сундук!</span><br>`;
    let chestRarity = 'common'; let cr = Math.random();
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

  // Бонусные лунные камни (только храм)
  if (reward.bonusLunarChance && Math.random() < reward.bonusLunarChance) {
    let lunarAmt = reward.bonusLunarMin + Math.floor(Math.random() * (reward.bonusLunarMax - reward.bonusLunarMin + 1));
    gameData.lunarStones += lunarAmt;
    msg += `<span class="text-skill">💠 Бонус: +${lunarAmt} Лунных камней!</span><br>`;
  }

  // Эпик с уником
  if (Math.random() < reward.bonusUniqueEpicChance) {
    let uniqueItem = generateItem('epic', null, true);
    msg += `<span class="text-epic" style="font-weight:900">✨ УДАЧА! Выпал уникальный эпик: ${uniqueItem.name}!</span><br>`;
    if (gameData.inventory.length < gameData.maxInventory) { gameData.inventory.push(uniqueItem); }
    else { gameData.imperials += SELL_PRICES['epic']; msg += `<span class="text-info">💰 Продан за ${SELL_PRICES['epic']} 🪙.</span><br>`; }
  }

  // 0.4% Легендарная броня стража (только храм)
  if (reward.legendaryArmorChance && Math.random() < reward.legendaryArmorChance) {
    let legendaryArmor = generateLegendaryArmor();
    msg += `<span style="color:#f59e0b; font-weight:900; text-shadow:0 0 10px rgba(245,158,11,0.8);">👑 ЛЕГЕНДАРНО! Выпал ${legendaryArmor.name}!</span><br>`;
    if (gameData.inventory.length < gameData.maxInventory) { gameData.inventory.push(legendaryArmor); }
    else { gameData.imperials += 50000; msg += `<span class="text-info">💰 Сумка полна! Продан за 50 000 🪙.</span><br>`; }
  }

  if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  return msg;
}

// ============================================================
// UI ПОДЗЕМЕЛЬЯ
// ============================================================

// Отрисовка вкладки «Подземелья»
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

// Экран передышки между этажами
function showFloorBreak(completedFloor, totalFloors) {
  let pouchCount = gameData.pouch.items.length;
  let pouchBtn = pouchCount > 0
    ? `<button class="action-btn" style="background:linear-gradient(135deg,#4c1d95,#7c3aed); width:100%; margin-bottom:10px;" onclick="openPouchModal()">
        🧰 Подсумок (${pouchCount} зел.)
      </button>`
    : `<div style="color:#4c1d95; font-size:12px; margin-bottom:10px; padding:8px; border:1px dashed #4c1d95; border-radius:8px;">🧰 Подсумок пуст</div>`;

  document.getElementById("controls").innerHTML = `
    <div style="width:100%; text-align:center;">
      <div style="color:#fbbf24; font-weight:900; font-size:16px; margin-bottom:10px;">
        ⚔️ Этаж ${completedFloor}/${totalFloors} пройден!
      </div>
      <div style="color:#10b981; margin-bottom:15px;">❤️ Ваше HP: ${player.hp} / ${player.maxHp}</div>
      ${pouchBtn}
      <button class="action-btn" style="background:linear-gradient(135deg,#b45309,#f59e0b); width:100%; margin-bottom:10px;" onclick="continueToNextFloor()">
        ⚔️ Следующий этаж
      </button>
      <button class="action-btn btn-return" style="display:block; width:100%;" onclick="exitDungeon()">
        🚪 Выйти из подземелья
      </button>
    </div>
  `;
}

// Модальное окно подсумка между этажами
function openPouchModal() {
  let items = gameData.pouch.items;
  if (items.length === 0) { alert('Подсумок пуст!'); return; }

  let slotsHtml = items.map((potion, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.7); border:1px solid #7c3aed; border-radius:10px; padding:12px; margin-bottom:8px;">
      <div style="text-align:left;">
        <div style="font-weight:bold; color:#e9d5ff;">${potion.name}</div>
        <div style="font-size:11px; color:#a78bfa;">+${potion.heal} ХП · Текущее HP: ${player.hp}/${player.maxHp}</div>
      </div>
      <button class="action-btn" style="background:${player.hp >= player.maxHp ? '#475569' : '#6d28d9'}; padding:8px 14px; font-size:13px; flex:0;"
        ${player.hp >= player.maxHp ? 'disabled' : ''} onclick="usePotion(${idx})">
        Выпить
      </button>
    </div>`).join('');

  document.getElementById('modal-title').innerText = '🧰 Подсумок';
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = `
    <div style="margin-bottom:8px; font-size:12px; color:#94a3b8;">Зелья можно использовать только между этажами.</div>
    ${slotsHtml}`;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}

// Использование зелья из подсумка
function usePotion(idx) {
  let potion = gameData.pouch.items[idx];
  if (!potion) return;
  if (player.hp >= player.maxHp) { alert('HP уже полное!'); return; }

  let healAmt = Math.min(potion.heal, player.maxHp - player.hp);
  player.hp += healAmt;
  dungeonState.playerHp = player.hp; // синхронизируем с сохранённым состоянием

  gameData.pouch.items.splice(idx, 1);
  saveData();

  // Обновляем экран боя и модалку
  updateScreen();
  // Если в подсумке ещё что-то есть — обновляем модалку, иначе закрываем
  if (gameData.pouch.items.length > 0) {
    openPouchModal();
  } else {
    closeModal();
  }
  // Обновляем кнопку подсумка на экране передышки
  let pouchBtn = document.querySelector('[onclick="openPouchModal()"]');
  if (pouchBtn) {
    let remaining = gameData.pouch.items.length;
    if (remaining > 0) {
      pouchBtn.innerText = `🧰 Подсумок (${remaining} зел.)`;
    } else {
      pouchBtn.outerHTML = `<div style="color:#4c1d95; font-size:12px; margin-bottom:10px; padding:8px; border:1px dashed #4c1d95; border-radius:8px;">🧰 Подсумок пуст</div>`;
    }
  }
}

// Кнопка «Следующий этаж» — восстанавливает кнопки управления и запускает этаж
function continueToNextFloor() {
  document.getElementById("controls").innerHTML = `
    <button class="action-btn btn-attack" id="btn-attack" onclick="registerAction('attack')">🗡️ Атака</button>
    <button class="action-btn btn-defend" id="btn-defend" onclick="registerAction('defend')">🛡️ Защита</button>
    <button class="action-btn btn-skill" id="btn-skill" onclick="registerAction('skill')">✨ Навык!</button>
    <button class="action-btn" id="btn-immortal" style="background: linear-gradient(135deg, #4c1d95, #000000); display: none; width: 100%; box-shadow: 0 0 15px rgba(124, 58, 237, 0.6);" onclick="registerAction('immortal')">💀 Возмездие</button>
    <button class="action-btn btn-return" id="btn-return" onclick="returnToMenu()">В меню</button>
  `;
  startDungeonFloor();
}

// Выход из подземелья без завершения
function exitDungeon() {
  dungeonState = null;
  returnToMenu();
}
