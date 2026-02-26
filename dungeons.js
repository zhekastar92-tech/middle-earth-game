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
//   'disease'  — Болезнь: блокирует лечение игрока на 3 хода
//   'fate'     — Прими судьбу: отключает блок игрока на 3 хода
//   'submit'   — Подчинись мне: x2 урон на 2 хода
//   'notover'  — Это ещё не конец: лечение при низком HP + регенерация
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
      bonusChestChance: 0.10,      // 10% шанс бонусного сундука
      bonusChestEpicChance: 0.10,  // из них 10% огромный, 90% большой
      bonusUniqueEpicChance: 0.005 // 0.5% эпик с уникальным свойством
    }
  },

  // === 2-4. СЮДА ДОБАВЛЯТЬ НОВЫЕ ДАНЖИ ===

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
  document.getElementById("player-card").className = "character " + getRank(player.lp).borderClass;
  document.getElementById("bot-card").className = "character border-mob-" + bot.tier;

  let enemyNum = dungeonState.enemyIndex + 1;
  let enemyTotal = dungeonState.enemyQueue.length;
  document.getElementById("combat-log").innerHTML = `<div class='log-entry text-skill'>${dungeon.icon} ${dungeon.name} — Этаж ${floorNum}/${totalFloors}. Враг ${enemyNum}/${enemyTotal}: ${bot.icon} ${bot.name}</div>`;

  document.getElementById("btn-return").style.display = "none";
  updateScreen();
  switchTab(null, "tab-battle");
  document.getElementById("main-screen").style.display = "none";
  document.getElementById("battle-screen").style.display = "block";
  startTurnTimer();
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

  return msg;
}

// «Подчинись мне» — проверяется ПОСЛЕ боя, когда урон игрока уже посчитан
function checkMobSubmitTrigger(mob, playerDmgThisTurn) {
  let msg = "";
  if (mob.abilities.includes('submit') && !mob.submitActive && playerDmgThisTurn >= 4) {
    mob.submitActive = true;
    mob.submitTurnsLeft = 2;
    msg += `<span class="text-dmg">😡 Леди Сильвия кричит: «Подчинись мне!» — Её урон x2 на 2 хода!</span><br>`;
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
