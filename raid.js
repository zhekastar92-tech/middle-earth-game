// ============================================================
// RAID.JS — Рейд
// Генерация карты, движение, лут, ПВП, эвакуация, смерть
// ============================================================

// ============================================================
// ГЕНЕРАЦИЯ КАРТЫ
// ============================================================

function generateMap() {
  const { width, height, cellSpawnChances, safeRarity } = MAP_CONFIG;
  const cells = [];

  for (let y = 0; y < height; y++) {
    cells[y] = [];
    for (let x = 0; x < width; x++) {
      const zone = getMapZone(x, y);
      const isExit = MAP_CONFIG.extractionPoints.some(e => e.x === x && e.y === y);

      let cellType = 'empty';
      const roll = Math.random();
      if (!isExit) {
        if (roll < cellSpawnChances.loot) cellType = 'loot';
        else if (roll < cellSpawnChances.loot + cellSpawnChances.safe) cellType = 'safe';
      }

      // Редкость сейфа
      let safeType = null;
      if (cellType === 'safe') {
        const sr = Math.random();
        if (sr < safeRarity.elite) safeType = 'elite';
        else if (sr < safeRarity.elite + safeRarity.rare) safeType = 'rare';
        else safeType = 'common';
      }

      cells[y][x] = {
        x, y,
        type:     cellType,
        safeType,
        zone:     zone.id,
        isExit,
        looted:   false,
        visited:  false,
      };
    }
  }

  // Проставить выходы
  MAP_CONFIG.extractionPoints.forEach(ep => {
    cells[ep.y][ep.x].type   = 'exit';
    cells[ep.y][ep.x].isExit = true;
  });

  return cells;
}

// ============================================================
// СТАРТ РЕЙДА
// ============================================================

function startRaid() {
  if (!gameData.loadout.weapon || !gameData.loadout.ammoCount) return;

  // Рандомный спавн
  const x = randInt(0, MAP_CONFIG.width - 1);
  const y = randInt(0, MAP_CONFIG.height - 1);

  const map = generateMap();
  map[y][x].visited = true;

  gameData.raid = {
    active:    true,
    map,
    playerX:   x,
    playerY:   y,
    inCombat:  false,
    loot:      [],       // лут найденный в рейде
    totalWeight: 0,
    startLoadout: JSON.parse(JSON.stringify(gameData.loadout)), // snapshot снаряжения при входе
  };

  gameData.totalRaids++;
  saveData();
  switchTab('tab-raid');
}

// ============================================================
// РЕНДЕР РЕЙДА (основной экран)
// ============================================================

function renderRaidScreen() {
  if (!gameData.raid || !gameData.raid.active) return;
  const raid = gameData.raid;

  if (raid.inCombat && combatState && combatState.active) {
    renderCombat();
    return;
  }

  const el = document.getElementById('tab-raid');
  const cell = raid.map[raid.playerY][raid.playerX];
  const zone = getMapZone(raid.playerX, raid.playerY);
  const exits = MAP_CONFIG.extractionPoints;

  // Найти ближайший выход
  const nearestExit = exits.reduce((best, ep) => {
    const dist = Math.abs(ep.x - raid.playerX) + Math.abs(ep.y - raid.playerY);
    return dist < best.dist ? { ...ep, dist } : best;
  }, { dist: Infinity });

  // Вес инвентаря рейда
  const backpack = gameData.loadout.backpack ? EQUIPMENT[gameData.loadout.backpack] : null;
  const maxWeight = backpack ? backpack.carryWeight : 5;
  const currentWeight = raid.loot.reduce((s, i) => s + (i.weight || 0), 0);

  // Статус игрока из combat (если был бой)
  const playerHP = combatState ? combatState.playerHP : 100;
  const maxHP    = combatState ? combatState.maxHP    : 100;
  const limbs    = combatState ? combatState.limbs    : { arms: false, legs: false, chest: false };

  el.innerHTML = `
    <div class="raid-screen">

      <!-- Статус игрока -->
      <div class="raid-player-status">
        <div class="raid-hp">
          <div class="hp-bar-wrap">
            <div class="hp-bar hp-bar-player" style="width:${playerHP / maxHP * 100}%"></div>
          </div>
          <span>${playerHP} / ${maxHP} HP</span>
        </div>
        <div class="raid-limbs">
          ${limbs.arms  ? `<span class="limb-tag limb-arms">🤕 Руки</span>`  : ''}
          ${limbs.legs  ? `<span class="limb-tag limb-legs">🦽 Ноги</span>`  : ''}
          ${limbs.chest ? `<span class="limb-tag limb-chest">🩸 Грудь</span>` : ''}
        </div>
        <div class="raid-ammo">
          🔫 ${gameData.loadout.ammoCount} патр.
          &nbsp;|&nbsp;
          🎒 ${currentWeight.toFixed(1)} / ${maxWeight} кг
        </div>
      </div>

      <!-- Позиция и зона -->
      <div class="raid-location">
        <div class="location-zone zone-${zone.id}">${zone.label}</div>
        <div class="location-coords">[ ${raid.playerX} : ${raid.playerY} ]</div>
        <div class="location-exit">
          🚁 До выхода: ~${nearestExit.dist} кл. (${nearestExit.name})
        </div>
      </div>

      <!-- Текущая клетка -->
      <div class="cell-info cell-${cell.type}">
        ${renderCellInfo(cell)}
      </div>

      <!-- Навигация -->
      <div class="raid-nav">
        <div class="nav-compass">
          <button class="nav-btn nav-up"    onclick="movePlayer(0,-1)" ${canMove(0,-1) ? '' : 'disabled'}>▲</button>
          <div class="nav-mid">
            <button class="nav-btn nav-left"  onclick="movePlayer(-1,0)" ${canMove(-1,0) ? '' : 'disabled'}>◀</button>
            <div class="nav-center">🧭</div>
            <button class="nav-btn nav-right" onclick="movePlayer(1,0)"  ${canMove(1,0)  ? '' : 'disabled'}>▶</button>
          </div>
          <button class="nav-btn nav-down"  onclick="movePlayer(0,1)"  ${canMove(0,1)  ? '' : 'disabled'}>▼</button>
        </div>
      </div>

      <!-- Действия на клетке -->
      <div class="cell-actions">
        ${renderCellActions(cell)}
      </div>

      <!-- Инвентарь рейда -->
      ${raid.loot.length > 0 ? `
        <div class="raid-loot">
          <h4>🎒 Найдено (${currentWeight.toFixed(1)} кг)</h4>
          <div class="loot-list">
            ${raid.loot.map(item => `
              <div class="loot-item">
                <span>${item.icon} ${escHtml(item.name)}</span>
                <span class="loot-weight">${item.weight} кг</span>
                ${currentWeight > maxWeight ? `<button class="btn-drop" onclick="dropRaidItem('${item._uid}')">Выбросить</button>` : ''}
              </div>
            `).join('')}
          </div>
          ${currentWeight > maxWeight ? `<div class="overweight-warn">⚠️ Перегруз! Выбрось лишнее</div>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================
// ИНФОРМАЦИЯ О КЛЕТКЕ
// ============================================================

function renderCellInfo(cell) {
  if (cell.isExit) {
    return `
      <div class="cell-icon">🚁</div>
      <div class="cell-label">Точка эвакуации</div>
      <div class="cell-sub">Отсюда можно выбраться с найденным лутом</div>
    `;
  }
  if (cell.looted) {
    return `<div class="cell-icon">📭</div><div class="cell-label">Уже обыскано</div>`;
  }
  switch (cell.type) {
    case 'loot': return `<div class="cell-icon">📦</div><div class="cell-label">Здесь есть лут</div>`;
    case 'safe': {
      const safeIcons = { common: '🗄️', rare: '🔒', elite: '💰' };
      const safeLabels = { common: 'Обычный сейф', rare: 'Редкий сейф', elite: 'Элитный сейф' };
      return `<div class="cell-icon">${safeIcons[cell.safeType]}</div><div class="cell-label">${safeLabels[cell.safeType]}</div>`;
    }
    default:
      return `<div class="cell-icon">🌫️</div><div class="cell-label">Пусто</div>`;
  }
}

// ============================================================
// ДЕЙСТВИЯ НА КЛЕТКЕ
// ============================================================

function renderCellActions(cell) {
  const actions = [];

  if (cell.isExit) {
    actions.push(`<button class="btn-primary btn-extract" onclick="extractRaid()">🚁 ЭВАКУИРОВАТЬСЯ</button>`);
  }

  if (!cell.looted) {
    if (cell.type === 'loot') {
      actions.push(`<button class="btn-secondary" onclick="searchCell()">🔍 Обыскать</button>`);
    }
    if (cell.type === 'safe') {
      const keyId = getSafeKeyId(cell.safeType);
      const hasKey = gameData.stash.items.some(i => i.id === keyId) ||
                     gameData.loadout.medkits.some(i => i.id === keyId);
      actions.push(`
        <button class="btn-secondary" onclick="openSafe()" ${hasKey ? '' : 'disabled'}
                title="${hasKey ? 'Открыть сейф' : 'Нет подходящего ключа'}">
          🔑 Открыть сейф ${hasKey ? '' : '(нет ключа)'}
        </button>
      `);
    }
  }

  // Аптечки
  const meds = gameData.loadout.medkits;
  if (meds && meds.length > 0) {
    actions.push(`
      <div class="medkit-bar">
        ${meds.map(m => `
          <button class="btn-medkit" onclick="useFieldMedkit('${m._uid}')">
            ${m.icon} ${m.name}
          </button>
        `).join('')}
      </div>
    `);
  }

  return actions.join('') || '<div class="no-actions">Нечего делать здесь</div>';
}

// ============================================================
// ДВИЖЕНИЕ
// ============================================================

function canMove(dx, dy) {
  const raid = gameData.raid;
  if (!raid) return false;
  const nx = raid.playerX + dx;
  const ny = raid.playerY + dy;
  return nx >= 0 && nx < MAP_CONFIG.width && ny >= 0 && ny < MAP_CONFIG.height;
}

function movePlayer(dx, dy) {
  const raid = gameData.raid;
  if (!raid || !raid.active) return;
  if (!canMove(dx, dy)) return;

  raid.playerX += dx;
  raid.playerY += dy;

  const cell = raid.map[raid.playerY][raid.playerX];
  cell.visited = true;

  // Кровотечение при переходе
  if (combatState && combatState.limbs && combatState.limbs.chest) {
    combatState.playerHP = Math.max(1, combatState.playerHP - LIMB_THRESHOLDS.chest.penaltyValue);
    showToast(`🩸 Кровотечение: −${LIMB_THRESHOLDS.chest.penaltyValue} HP`, 'danger');

    if (combatState.playerHP <= 0) {
      playerDied();
      return;
    }
  }

  // Проверка ПВП
  const zone = getMapZone(raid.playerX, raid.playerY);
  if (Math.random() < zone.pvpChance) {
    triggerPVP();
    return;
  }

  saveData();
  renderRaidScreen();
}

// ============================================================
// ПВП ТРИГГЕР
// ============================================================

function triggerPVP() {
  const raid = gameData.raid;
  raid.inCombat = true;

  // Генерация рандомного противника
  const enemy = generateEnemy();
  saveData();

  showToast(`⚠️ Контакт! ${enemy.icon} ${enemy.name}`, 'danger');

  initCombat(enemy);
}

function generateEnemy() {
  // Рандомное снаряжение врага — тир зависит от зоны
  const zone = getMapZone(gameData.raid.playerX, gameData.raid.playerY);
  const tierMap = { safe: [1, 2], mid: [2, 3], hot: [3, 4] };
  const tierRange = tierMap[zone.id];
  const tier = randInt(tierRange[0], tierRange[1]);

  const names = LEADERBOARD_NAMES;
  const name = names[randInt(0, names.length - 1)];

  // Статы врага на основе тира
  const tierMultiplier = tier * 0.8 + 0.4;
  const armorValue = Math.round(tier * 15 + randInt(0, 10));

  return {
    name,
    icon:       '🔴',
    tier,
    hp:         Math.round(80 + tier * 20 + randInt(0, 20)),
    damage:     Math.round(12 + tier * 6 + randInt(0, 8)),
    accuracy:   Math.min(0.75, 0.40 + tier * 0.07),
    armorValue,
    aggression: 0.3 + Math.random() * 0.5,
    // Лут который выпадет при убийстве
    lootPool:   generateEnemyLoot(tier),
  };
}

function generateEnemyLoot(tier) {
  const pool = [];

  // Оружие (всегда есть)
  const weaponTypes = Object.keys(WEAPON_TYPES);
  const wType = weaponTypes[randInt(0, weaponTypes.length - 1)];
  const weapons = Object.values(WEAPONS).filter(w => w.type === wType && w.tier === tier && !w._inactive);
  if (weapons.length > 0) pool.push({ ...weapons[randInt(0, weapons.length - 1)], _uid: generateUid() });

  // Патроны
  const ammoKey = `ammo_t${tier}`;
  if (AMMO[ammoKey] && !AMMO[ammoKey]._inactive) {
    const count = randInt(10, 30);
    pool.push({ ...AMMO[ammoKey], ammoCount: count, weight: AMMO[ammoKey].weight * count, _uid: generateUid() });
  }

  // Экипировка (30% шанс)
  if (Math.random() < 0.30) {
    const slots = ['helmet', 'vest'];
    const slot = slots[randInt(0, slots.length - 1)];
    const items = Object.values(EQUIPMENT).filter(e => e.slot === slot && e.tier === tier && !e._inactive);
    if (items.length > 0) pool.push({ ...items[randInt(0, items.length - 1)], _uid: generateUid() });
  }

  return pool;
}

// ============================================================
// ПОСЛЕ БОЯ
// ============================================================

// Вызывается из combat.js при победе
function onCombatWin(enemy) {
  gameData.raid.inCombat = false;
}

function afterCombatWin() {
  const enemy = combatState.enemy;
  const loot = enemy.lootPool || [];
  const backpack = gameData.loadout.backpack ? EQUIPMENT[gameData.loadout.backpack] : null;
  const maxWeight = backpack ? backpack.carryWeight : 5;
  const currentWeight = gameData.raid.loot.reduce((s, i) => s + (i.weight || 0), 0);

  // Добавить лут врага в рейдовый инвентарь
  loot.forEach(item => {
    const newWeight = currentWeight + (item.weight || 0);
    if (newWeight <= maxWeight) {
      gameData.raid.loot.push(item);
    }
  });

  saveData();
  renderRaidScreen();
}

// Вызывается из combat.js при поражении
function onCombatLose() {
  playerDied();
}

function afterCombatLose() {
  renderRaidScreen();
}

// ============================================================
// ОБЫСК КЛЕТКИ
// ============================================================

function searchCell() {
  const raid = gameData.raid;
  const cell = raid.map[raid.playerY][raid.playerX];
  if (cell.looted) return;

  cell.looted = true;
  const zone = getMapZone(raid.playerX, raid.playerY);
  const loot = generateCellLoot(zone.id);

  if (loot.length === 0) {
    showToast('Ничего не нашёл', 'info');
    saveData();
    renderRaidScreen();
    return;
  }

  // Добавить в инвентарь с учётом веса
  const backpack = gameData.loadout.backpack ? EQUIPMENT[gameData.loadout.backpack] : null;
  const maxWeight = backpack ? backpack.carryWeight : 5;
  let added = 0;

  loot.forEach(item => {
    const currentW = raid.loot.reduce((s, i) => s + (i.weight || 0), 0);
    if (currentW + item.weight <= maxWeight) {
      raid.loot.push(item);
      added++;
    }
  });

  showToast(added > 0 ? `Найдено: ${added} предм.` : 'Рюкзак полон!', added > 0 ? 'success' : 'warning');
  saveData();
  renderRaidScreen();
}

function generateCellLoot(zoneId) {
  const tierByZone = { safe: [1, 2], mid: [2, 3], hot: [3, 4] };
  const range = tierByZone[zoneId] || [1, 2];
  const tier = randInt(range[0], range[1]);
  const loot = [];

  const roll = Math.random();

  if (roll < 0.40) {
    // Патроны
    const ammoKey = `ammo_t${tier}`;
    if (AMMO[ammoKey] && !AMMO[ammoKey]._inactive) {
      const count = randInt(5, 20);
      loot.push({ ...AMMO[ammoKey], ammoCount: count, weight: +(AMMO[ammoKey].weight * count).toFixed(2), _uid: generateUid() });
    }
  } else if (roll < 0.65) {
    // Оружие
    const allWeapons = Object.values(WEAPONS).filter(w => w.tier === tier && !w._inactive);
    if (allWeapons.length > 0) loot.push({ ...allWeapons[randInt(0, allWeapons.length - 1)], _uid: generateUid() });
  } else if (roll < 0.80) {
    // Экипировка
    const allEquip = Object.values(EQUIPMENT).filter(e => e.tier === tier && !e._inactive);
    if (allEquip.length > 0) loot.push({ ...allEquip[randInt(0, allEquip.length - 1)], _uid: generateUid() });
  } else if (roll < 0.90) {
    // Аптечка
    const meds = Object.values(MEDKITS);
    loot.push({ ...meds[randInt(0, meds.length - 1)], _uid: generateUid() });
  } else {
    // Модуль
    const mods = Object.values(MODULES);
    loot.push({ ...mods[randInt(0, mods.length - 1)], _uid: generateUid() });
  }

  return loot;
}

// ============================================================
// СЕЙФ
// ============================================================

function getSafeKeyId(safeType) {
  const map = { common: 'key_common', rare: 'key_rare', elite: 'key_elite' };
  return map[safeType] || 'key_common';
}

function openSafe() {
  const raid = gameData.raid;
  const cell = raid.map[raid.playerY][raid.playerX];
  if (cell.looted) return;

  const keyId = getSafeKeyId(cell.safeType);

  // Найти и использовать ключ
  const keyIdx = gameData.stash.items.findIndex(i => i.id === keyId);
  if (keyIdx === -1) {
    showToast('Нет подходящего ключа', 'warning');
    return;
  }

  gameData.stash.items.splice(keyIdx, 1);
  cell.looted = true;

  // Лут сейфа лучше обычного
  const tierByType = { common: [1, 2], rare: [2, 3], elite: [3, 4] };
  const range = tierByType[cell.safeType];
  const tier = randInt(range[0], range[1]);

  const safeCount = { common: 2, rare: 3, elite: 4 }[cell.safeType];
  const loot = [];

  for (let i = 0; i < safeCount; i++) {
    const items = [...Object.values(WEAPONS), ...Object.values(EQUIPMENT), ...Object.values(MODULES)]
      .filter(item => item.tier === tier && !item._inactive);
    if (items.length > 0) loot.push({ ...items[randInt(0, items.length - 1)], _uid: generateUid() });
  }

  const backpack = gameData.loadout.backpack ? EQUIPMENT[gameData.loadout.backpack] : null;
  const maxWeight = backpack ? backpack.carryWeight : 5;
  let added = 0;

  loot.forEach(item => {
    const currentW = raid.loot.reduce((s, i) => s + (i.weight || 0), 0);
    if (currentW + item.weight <= maxWeight) {
      raid.loot.push(item);
      added++;
    }
  });

  showToast(`Сейф вскрыт! Найдено: ${added} предм.`, 'success');
  saveData();
  renderRaidScreen();
}

// ============================================================
// АПТЕЧКА В ПОЛЕ
// ============================================================

function useFieldMedkit(uid) {
  const idx = gameData.loadout.medkits.findIndex(m => m._uid === uid);
  if (idx === -1) return;

  const med = gameData.loadout.medkits[idx];

  // Обновить HP в combatState если есть, иначе локально
  if (combatState) {
    const healed = Math.min(med.healAmount, combatState.maxHP - combatState.playerHP);
    combatState.playerHP += healed;
    if (med.healsLimb) {
      if (combatState.limbs.chest) combatState.limbs.chest = false;
      else if (combatState.limbs.legs) combatState.limbs.legs = false;
      else if (combatState.limbs.arms) combatState.limbs.arms = false;
    }
    showToast(`${med.icon} +${healed} HP`, 'success');
  }

  gameData.loadout.medkits.splice(idx, 1);
  saveData();
  renderRaidScreen();
}

// ============================================================
// ВЫБРОСИТЬ ПРЕДМЕТ
// ============================================================

function dropRaidItem(uid) {
  const raid = gameData.raid;
  const idx = raid.loot.findIndex(i => i._uid === uid);
  if (idx === -1) return;
  const item = raid.loot[idx];
  raid.loot.splice(idx, 1);
  showToast(`Выброшено: ${item.name}`, 'info');
  saveData();
  renderRaidScreen();
}

// ============================================================
// ЭВАКУАЦИЯ
// ============================================================

function extractRaid() {
  const raid = gameData.raid;
  const cell = raid.map[raid.playerY][raid.playerX];
  if (!cell.isExit) return;

  // Проверить перегруз
  const backpack = gameData.loadout.backpack ? EQUIPMENT[gameData.loadout.backpack] : null;
  const maxWeight = backpack ? backpack.carryWeight : 5;
  const currentWeight = raid.loot.reduce((s, i) => s + (i.weight || 0), 0);

  if (currentWeight > maxWeight) {
    showToast('⚠️ Перегруз! Выброси лишнее перед эвакуацией', 'warning');
    return;
  }

  // Перенести лут в схрон
  raid.loot.forEach(item => {
    gameData.stash.items.push(item);
  });

  const lootCount = raid.loot.length;
  const coinsFromRaid = 0; // Коины из рейда пока не реализованы отдельно

  // Завершить рейд
  gameData.raid = null;
  saveData();

  showToast(`🚁 Эвакуация! Доставлено в схрон: ${lootCount} предм.`, 'success');
  switchTab('tab-stash');
}

// ============================================================
// СМЕРТЬ ИГРОКА
// ============================================================

function playerDied() {
  gameData.totalDeaths++;

  // Потерять всё снаряжение
  gameData.loadout = {
    weapon: null, ammo: null, ammoCount: 0,
    modules: { scope: null, grip: null, magazine: null, stock: null },
    helmet: null, vest: null, gloves: null, rig: null, backpack: null,
    medkits: [],
  };

  gameData.raid = null;
  combatState = null;

  saveData();

  const el = document.getElementById('tab-raid');
  el.innerHTML = `
    <div class="death-screen">
      <div class="death-icon">💀</div>
      <h2 class="death-title">ВЫ ПОГИБЛИ</h2>
      <p class="death-sub">Всё снаряжение и найденный лут потеряны</p>
      <div class="death-stats">
        <div class="stat-row"><span>Всего рейдов</span><span>${gameData.totalRaids}</span></div>
        <div class="stat-row"><span>Всего смертей</span><span>${gameData.totalDeaths}</span></div>
        <div class="stat-row"><span>Убийств</span><span>${gameData.totalKills}</span></div>
      </div>
      <button class="btn-primary btn-large" onclick="switchTab('tab-traders')">
        🏪 В магазин — закупиться заново
      </button>
      <button class="btn-secondary" onclick="switchTab('tab-home')">
        🏠 Главная
      </button>
    </div>
  `;
}
