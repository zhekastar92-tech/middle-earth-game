// ============================================================
// SCRIPT.JS — Ядро игры
// gameData, сохранение, вкладки, инициализация, лидерборд
// ============================================================

// ============================================================
// СОСТОЯНИЕ ИГРЫ
// ============================================================

let gameData = {};

const SAVE_KEY = 'extractionGameData';
const SAVE_VERSION = 1;

function randomStartCoins() {
  // 20 000 000 — 20 999 999
  return 20000000 + Math.floor(Math.random() * 1000000);
}

// ============================================================
// СТАРТОВЫЙ СХРОН — пре-альфа тест
// Оружие тир 3-4, экипировка тир 3-4, патроны и аптечки
// ============================================================

function buildStarterStash() {
  const items = [];

  function addItem(sourceObj) {
    items.push({ ...sourceObj, _uid: Math.random().toString(36).slice(2, 10) + Date.now().toString(36), _addedAt: Date.now() });
  }

  // === ОРУЖИЕ — 3 варианта каждого типа (тир 3 и 4) ===

  // Пистолеты
  addItem(WEAPONS.p_t3);   // Берetta M9
  addItem(WEAPONS.p_t4);   // Desert Eagle
  addItem(WEAPONS.p_t3);   // ещё одна Берета как запас

  // Дробовики
  addItem(WEAPONS.sg_t3);  // Remington 870
  addItem(WEAPONS.sg_t4);  // SPAS-12
  addItem(WEAPONS.sg_t3);  // запасной

  // Пистолеты-пулемёты
  addItem(WEAPONS.smg_t3); // UMP-45
  addItem(WEAPONS.smg_t4); // P90
  addItem(WEAPONS.smg_t3); // запасной

  // Автоматы
  addItem(WEAPONS.ar_t3);  // M4A1
  addItem(WEAPONS.ar_t4);  // HK416
  addItem(WEAPONS.ar_t3);  // запасной

  // Снайперки
  addItem(WEAPONS.sr_t3);  // AWP
  addItem(WEAPONS.sr_t4);  // Barrett M82
  addItem(WEAPONS.sr_t3);  // запасная AWP

  // === ЭКИПИРОВКА — 3 варианта каждого типа (тир 3 и 4) ===

  // Шлемы
  addItem(EQUIPMENT.helmet_t3);
  addItem(EQUIPMENT.helmet_t4);
  addItem(EQUIPMENT.helmet_t3);

  // Бронежилеты
  addItem(EQUIPMENT.vest_t3);
  addItem(EQUIPMENT.vest_t4);
  addItem(EQUIPMENT.vest_t3);

  // Перчатки
  addItem(EQUIPMENT.gloves_t3);
  addItem(EQUIPMENT.gloves_t4);
  addItem(EQUIPMENT.gloves_t3);

  // Разгрузки
  addItem(EQUIPMENT.rig_t3);
  addItem(EQUIPMENT.rig_t4);
  addItem(EQUIPMENT.rig_t3);

  // Рюкзаки
  addItem(EQUIPMENT.backpack_t3);
  addItem(EQUIPMENT.backpack_t4);
  addItem(EQUIPMENT.backpack_t3);

  // === ПАТРОНЫ (запас для старта) ===
  const ammoT3 = { ...AMMO.ammo_t3, ammoCount: 120, weight: parseFloat((AMMO.ammo_t3.weight * 120).toFixed(2)) };
  const ammoT4 = { ...AMMO.ammo_t4, ammoCount: 90,  weight: parseFloat((AMMO.ammo_t4.weight * 90).toFixed(2))  };
  addItem(ammoT3);
  addItem(ammoT3);
  addItem(ammoT4);
  addItem(ammoT4);

  // === АПТЕЧКИ ===
  addItem(MEDKITS.medkit_large);
  addItem(MEDKITS.medkit_large);
  addItem(MEDKITS.surv_kit);
  addItem(MEDKITS.surv_kit);
  addItem(MEDKITS.bandage);
  addItem(MEDKITS.bandage);
  addItem(MEDKITS.bandage);

  // === КЛЮЧИ (чтобы можно было открывать сейфы) ===
  addItem(SAFE_KEYS.key_common);
  addItem(SAFE_KEYS.key_common);
  addItem(SAFE_KEYS.key_rare);
  addItem(SAFE_KEYS.key_elite);

  // === МОДУЛИ ===
  addItem(MODULES.scope_holo);
  addItem(MODULES.scope_sniper);
  addItem(MODULES.grip_tactical);
  addItem(MODULES.mag_drum);
  addItem(MODULES.mag_quad);
  addItem(MODULES.stock_tactical);

  return items;
}

function defaultGameData() {
  return {
    version: SAVE_VERSION,

    // Профиль
    playerName: 'Оператор',
    coins: randomStartCoins(),
    totalRaids: 0,
    totalKills: 0,
    totalDeaths: 0,
    totalCoinsEarned: 0,
    totalCoinsLost: 0,

    // Схрон
    stash: {
      items: buildStarterStash(),
    },

    // Снаряжение которое игрок надевает перед рейдом
    loadout: {
      weapon:    null,  // id оружия
      ammo:      null,  // id патронов
      ammoCount: 0,     // сколько патронов взято
      modules: {        // установленные модули { scope: id|null, grip: id|null, ... }
        scope:    null,
        grip:     null,
        magazine: null,
        stock:    null,
      },
      helmet:    null,
      vest:      null,
      gloves:    null,
      rig:       null,
      backpack:  null,
      medkits:   [],    // аптечки взятые в рейд [{id, ...medData}]
    },

    // Текущий рейд (null если не в рейде)
    raid: null,

    // Лидерборд — боты
    leaderboard: [],

    // Настройки
    settings: {
      soundEnabled: true,
      animationsEnabled: true,
    },
  };
}

// ============================================================
// СОХРАНЕНИЕ / ЗАГРУЗКА
// ============================================================

function saveData() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameData));
  } catch (e) {
    console.error('Ошибка сохранения:', e);
  }
}

function loadData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SAVE_VERSION) return false;
    // Мёрдж: дефолт как основа, поверх — сохранённое
    gameData = deepMerge(defaultGameData(), parsed);
    return true;
  } catch (e) {
    console.error('Ошибка загрузки:', e);
    return false;
  }
}

function resetData() {
  if (!confirm('Сбросить прогресс? Это действие необратимо.')) return;
  localStorage.removeItem(SAVE_KEY);
  gameData = defaultGameData();
  generateLeaderboard();
  saveData();
  renderCurrentTab();
  showToast('Прогресс сброшен', 'warning');
}

// Глубокий мёрдж двух объектов (дефолт + сохранение)
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ============================================================
// ЛИДЕРБОРД
// ============================================================

function generateLeaderboard() {
  // Генерируем 49 ботов (игрок будет вставлен как ~40-е место)
  // Якорные точки: 1-е место ~89M, 40-е место ~20M (игрок), 50-е ~18M
  // Строим диапазон монет: от 89M (1-е) до 18M (50-е) с убыванием

  const bots = LEADERBOARD_NAMES.slice(0, 49).map((name, i) => {
    // i = 0..48, нам нужно 49 ботов
    // Итоговая сортировка расставит всё по местам
    // Задаём монеты по позиции через интерполяцию
    // Позиции 1..39 — выше игрока (>20M), 40..49 — ниже (18-20M)
    let coins;
    if (i === 0) {
      // Будущее 1-е место — ~89M с небольшим рандомом
      coins = 89000000 + Math.floor(Math.random() * 500000);
    } else if (i < 39) {
      // Места 2–39: плавно убывают от ~88M до ~21M
      const t = i / 38; // 0..1
      const top = 88500000;
      const bot = 21000000;
      coins = Math.round(top - (top - bot) * t) + Math.floor(Math.random() * 400000);
    } else {
      // Места 41–49 (после игрока): от ~19.5M до ~18M
      const t = (i - 39) / 9; // 0..1
      coins = Math.round(19500000 - 1500000 * t) + Math.floor(Math.random() * 300000);
    }

    return {
      name,
      coins,
      kills: Math.floor(Math.random() * 1200) + 50,
      raids: Math.floor(Math.random() * 600) + 20,
      isBot: true,
    };
  });

  gameData.leaderboard = bots;
  gameData.leaderboard.sort((a, b) => b.coins - a.coins);
}

// Симуляция движения ботов на лидерборде
function simulateBots() {
  gameData.leaderboard.forEach(entry => {
    if (!entry.isBot) return;
    const change = Math.floor((Math.random() - 0.48) * 3000);
    entry.coins = Math.max(1000, entry.coins + change);
  });
  // Переставить лидерборд с учётом игрока
  updateLeaderboardPlayer();
}

function updateLeaderboardPlayer() {
  // Удалить старую запись игрока если есть
  gameData.leaderboard = gameData.leaderboard.filter(e => !e.isPlayer);
  // Добавить текущую
  gameData.leaderboard.push({
    name: gameData.playerName,
    coins: gameData.coins,
    kills: gameData.totalKills,
    raids: gameData.totalRaids,
    isBot: false,
    isPlayer: true,
  });
  gameData.leaderboard.sort((a, b) => b.coins - a.coins);
}

function getPlayerRank() {
  updateLeaderboardPlayer();
  return gameData.leaderboard.findIndex(e => e.isPlayer) + 1;
}

// ============================================================
// СИСТЕМА ВКЛАДОК
// ============================================================

let currentTab = 'tab-home';

function switchTab(tabId) {
  // Скрыть все вкладки
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));

  // Показать нужную
  const content = document.getElementById(tabId);
  const btn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  if (content) content.classList.add('active');
  if (btn) btn.classList.add('active');

  currentTab = tabId;

  // Рендерить содержимое вкладки
  switch (tabId) {
    case 'tab-home':      renderHome();      break;
    case 'tab-stash':     renderStash();     break;
    case 'tab-loadout':   renderLoadout();   break;
    case 'tab-traders':   renderTraders();   break;
    case 'tab-raid':      renderRaid();      break;
    case 'tab-leaderboard': renderLeaderboard(); break;
  }
}

function renderCurrentTab() {
  switchTab(currentTab);
}

// ============================================================
// РЕНДЕР — ГЛАВНАЯ
// ============================================================

function renderHome() {
  const rank = getPlayerRank();
  const el = document.getElementById('tab-home');
  el.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">🪖</div>
      <div class="profile-info">
        <div class="profile-name">${escHtml(gameData.playerName)}</div>
        <div class="profile-rank"># ${rank} в рейтинге</div>
      </div>
      <div class="profile-coins">${CURRENCY_ICON} ${fmtNum(gameData.coins)}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${gameData.totalRaids}</div>
        <div class="stat-label">Рейдов</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${gameData.totalKills}</div>
        <div class="stat-label">Убийств</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${gameData.totalDeaths}</div>
        <div class="stat-label">Смертей</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${gameData.totalRaids > 0 ? Math.round((gameData.totalRaids - gameData.totalDeaths) / gameData.totalRaids * 100) : 0}%</div>
        <div class="stat-label">Выживаемость</div>
      </div>
    </div>

    <div class="home-actions">
      <button class="btn-primary btn-large" onclick="switchTab('tab-raid')">
        🎯 В РЕЙД
      </button>
      <button class="btn-secondary" onclick="switchTab('tab-loadout')">
        🎒 Снаряжение
      </button>
    </div>

    <div class="home-tip">
      <span class="tip-icon">💡</span>
      <span>Снарядись перед рейдом. При смерти — теряешь всё.</span>
    </div>

    <div class="reset-zone">
      <button class="btn-danger-ghost" onclick="resetData()">Сбросить прогресс</button>
    </div>
  `;
}

// ============================================================
// РЕНДЕР — СХРОН
// ============================================================

function renderStash() {
  const el = document.getElementById('tab-stash');
  const items = gameData.stash.items;

  const totalWeight = items.reduce((s, i) => s + (i.weight || 0), 0);

  el.innerHTML = `
    <div class="section-header">
      <h2>📦 Схрон</h2>
      <div class="stash-weight">${totalWeight.toFixed(1)} кг</div>
    </div>

    ${items.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">Схрон пуст</div>
        <div class="empty-sub">Иди на рейд и принеси лут</div>
      </div>
    ` : `
      <div class="stash-grid">
        ${items.map(item => renderStashItem(item)).join('')}
      </div>
    `}
  `;
}

function renderStashItem(item) {
  const tierColor = getTierColor(item.tier || 1);
  return `
    <div class="stash-item" style="border-color: ${tierColor}33; --tier-color: ${tierColor}">
      <div class="item-icon">${item.icon || '📦'}</div>
      <div class="item-info">
        <div class="item-name">${escHtml(item.name)}</div>
        <div class="item-tier" style="color: ${tierColor}">${item.tier ? TIERS[item.tier].label : ''}</div>
      </div>
      <div class="item-weight">${item.weight ? item.weight.toFixed(1) + ' кг' : ''}</div>
      <div class="item-actions">
        <button class="btn-icon btn-sell" onclick="sellItem('${item._uid}')">
          ${CURRENCY_ICON} Продать
        </button>
      </div>
    </div>
  `;
}

function sellItem(uid) {
  const idx = gameData.stash.items.findIndex(i => i._uid === uid);
  if (idx === -1) return;
  const item = gameData.stash.items[idx];
  const price = Math.floor((item.price || 100) * 0.6); // продажа за 60%
  gameData.coins += price;
  gameData.stash.items.splice(idx, 1);
  saveData();
  renderStash();
  showToast(`Продано: +${CURRENCY_ICON}${fmtNum(price)}`, 'success');
}

// ============================================================
// РЕНДЕР — СНАРЯЖЕНИЕ (LOADOUT)
// ============================================================

function renderLoadout() {
  const el = document.getElementById('tab-loadout');
  const lo = gameData.loadout;

  el.innerHTML = `
    <div class="section-header">
      <h2>🎒 Снаряжение</h2>
    </div>

    <div class="loadout-grid">
      ${renderLoadoutSlot('weapon',   '🔫', 'Оружие',    lo.weapon)}
      ${renderLoadoutSlot('ammo',     '📦', 'Патроны',   lo.ammo)}
      ${renderLoadoutSlot('helmet',   '🪖', 'Шлем',      lo.helmet)}
      ${renderLoadoutSlot('vest',     '🦺', 'Бронежилет',lo.vest)}
      ${renderLoadoutSlot('gloves',   '🧤', 'Перчатки',  lo.gloves)}
      ${renderLoadoutSlot('rig',      '🎽', 'Разгрузка', lo.rig)}
      ${renderLoadoutSlot('backpack', '🎒', 'Рюкзак',    lo.backpack)}
    </div>

    <div class="loadout-modules">
      <h3>🔩 Модули оружия</h3>
      ${lo.weapon ? renderModuleSlots() : '<div class="empty-sub">Сначала выбери оружие</div>'}
    </div>

    <div class="loadout-weight">
      <span>Общий вес загрузки:</span>
      <span class="weight-value">${calcLoadoutWeight().toFixed(1)} кг</span>
    </div>

    <div class="loadout-summary">
      ${renderLoadoutStats()}
    </div>
  `;
}

function renderLoadoutSlot(slotId, icon, label, itemId) {
  const item = itemId ? findItemById(itemId) : null;
  const tierColor = item ? getTierColor(item.tier || 1) : '#334155';
  return `
    <div class="loadout-slot ${item ? 'filled' : 'empty'}"
         style="--tier-color: ${tierColor}"
         onclick="openSlotPicker('${slotId}')">
      <div class="slot-icon">${item ? item.icon : icon}</div>
      <div class="slot-info">
        <div class="slot-label">${label}</div>
        <div class="slot-value">${item ? escHtml(item.name) : 'Пусто'}</div>
      </div>
      ${item ? `<div class="slot-tier" style="color:${tierColor}">T${item.tier}</div>` : ''}
    </div>
  `;
}

function renderModuleSlots() {
  const weaponId = gameData.loadout.weapon;
  if (!weaponId) return '';
  const weapon = WEAPONS[weaponId];
  if (!weapon) return '';

  return weapon.type && WEAPON_TYPES[weapon.type]
    ? WEAPON_TYPES[weapon.type].slots.map(slotType => {
        const modId = gameData.loadout.modules[slotType];
        const mod = modId ? MODULES[modId] : null;
        const slotNames = { scope: 'Прицел', grip: 'Рукоять', magazine: 'Магазин', stock: 'Приклад' };
        return `
          <div class="module-slot ${mod ? 'filled' : 'empty'}"
               onclick="openModulePicker('${slotType}')">
            <div class="slot-icon">${mod ? mod.icon : '➕'}</div>
            <div class="slot-info">
              <div class="slot-label">${slotNames[slotType]}</div>
              <div class="slot-value">${mod ? escHtml(mod.name) : 'Пусто'}</div>
            </div>
          </div>
        `;
      }).join('')
    : '';
}

function renderLoadoutStats() {
  const stats = calcLoadoutStats();
  return `
    <div class="stat-row"><span>Точность</span><span>${Math.round(stats.accuracy * 100)}%</span></div>
    <div class="stat-row"><span>Урон/пуля</span><span>${stats.damage}</span></div>
    <div class="stat-row"><span>Магазин</span><span>${stats.magSize} патр.</span></div>
    <div class="stat-row"><span>Броня (тело)</span><span>${stats.vestProtection}</span></div>
    <div class="stat-row"><span>Броня (голова)</span><span>${stats.helmetProtection}</span></div>
  `;
}

function calcLoadoutStats() {
  const lo = gameData.loadout;
  const weapon = lo.weapon ? WEAPONS[lo.weapon] : null;
  const gloves = lo.gloves ? EQUIPMENT[lo.gloves] : null;
  const vest = lo.vest ? EQUIPMENT[lo.vest] : null;
  const helmet = lo.helmet ? EQUIPMENT[lo.helmet] : null;
  const ammo = lo.ammo ? AMMO[lo.ammo] : null;

  let accuracy = weapon ? weapon.accuracy : 0;
  if (gloves) accuracy += gloves.accuracyBonus || 0;

  // Модули
  Object.entries(lo.modules).forEach(([, modId]) => {
    if (!modId) return;
    const mod = MODULES[modId];
    if (!mod) return;
    if (mod.accuracyBonus) accuracy += mod.accuracyBonus;
  });

  let magSize = weapon ? weapon.magSize : 0;
  const magMod = lo.modules.magazine ? MODULES[lo.modules.magazine] : null;
  if (magMod && magMod.magBonus) magSize += magMod.magBonus;

  const damage = weapon ? weapon.damage + (ammo ? ammo.damageBonus : 0) : 0;

  return {
    accuracy: Math.min(0.99, accuracy),
    damage,
    magSize,
    vestProtection: vest ? vest.protection : 0,
    helmetProtection: helmet ? helmet.protection : 0,
  };
}

function calcLoadoutWeight() {
  const lo = gameData.loadout;
  let w = 0;
  ['weapon', 'helmet', 'vest', 'gloves', 'rig', 'backpack'].forEach(slot => {
    if (lo[slot]) {
      const item = findItemById(lo[slot]);
      if (item) w += item.weight || 0;
    }
  });
  Object.values(lo.modules).forEach(modId => {
    if (modId && MODULES[modId]) w += MODULES[modId].weight || 0;
  });
  return w;
}

// ============================================================
// ПИКЕР ПРЕДМЕТОВ ДЛЯ СНАРЯЖЕНИЯ
// ============================================================

function openSlotPicker(slotId) {
  const el = document.getElementById('tab-loadout');

  // Собираем доступные предметы из схрона для данного слота
  let candidates = [];

  if (slotId === 'weapon') {
    candidates = gameData.stash.items.filter(i => i.type && WEAPON_TYPES[i.type]);
  } else if (slotId === 'ammo') {
    candidates = gameData.stash.items.filter(i => AMMO[i.id]);
  } else {
    candidates = gameData.stash.items.filter(i => i.slot === slotId);
  }

  const currentId = gameData.loadout[slotId];

  const itemsHtml = candidates.length === 0
    ? '<div class="empty-sub">В схроне нет подходящих предметов</div>'
    : candidates.map(item => {
        const tierColor = getTierColor(item.tier || 1);
        const isEquipped = item._uid === currentId || item.id === currentId;
        const extraInfo = slotId === 'ammo' ? ` · ${item.ammoCount} шт.`
          : item.protection ? ` · Броня: ${item.protection}`
          : item.carryWeight ? ` · ${item.carryWeight} кг`
          : item.accuracyBonus ? ` · +${Math.round(item.accuracyBonus * 100)}% точн.`
          : '';
        return `
          <div class="picker-item ${isEquipped ? 'picker-equipped' : ''}"
               style="border-color: ${tierColor}55"
               onclick="equipItem('${slotId}', '${item._uid}')">
            <div class="picker-icon">${item.icon || '📦'}</div>
            <div class="picker-info">
              <div class="picker-name">${escHtml(item.name)}</div>
              <div class="picker-sub" style="color:${tierColor}">
                ${item.tier ? 'Тир ' + item.tier : ''}${extraInfo}
              </div>
            </div>
            ${isEquipped ? '<div class="picker-badge">✓ В слоте</div>' : ''}
          </div>
        `;
      }).join('');

  const slotNames = {
    weapon: 'Оружие', ammo: 'Патроны', helmet: 'Шлем',
    vest: 'Бронежилет', gloves: 'Перчатки', rig: 'Разгрузка', backpack: 'Рюкзак',
  };

  const unequipBtn = currentId
    ? `<button class="btn-secondary picker-unequip" onclick="unequipSlot('${slotId}')">✕ Снять</button>`
    : '';

  el.innerHTML = `
    <div class="section-header">
      <button class="btn-back" onclick="renderLoadout()">← Назад</button>
      <h2>Выбор: ${slotNames[slotId] || slotId}</h2>
    </div>
    ${unequipBtn}
    <div class="picker-list">
      ${itemsHtml}
    </div>
  `;
}

function openModulePicker(slotType) {
  const el = document.getElementById('tab-loadout');

  const candidates = gameData.stash.items.filter(i => i.type === slotType && MODULES[i.id]);
  const currentId = gameData.loadout.modules[slotType];

  const itemsHtml = candidates.length === 0
    ? '<div class="empty-sub">В схроне нет подходящих модулей</div>'
    : candidates.map(item => {
        const isEquipped = item.id === currentId;
        return `
          <div class="picker-item ${isEquipped ? 'picker-equipped' : ''}"
               onclick="equipModule('${slotType}', '${item.id}')">
            <div class="picker-icon">${item.icon || '🔩'}</div>
            <div class="picker-info">
              <div class="picker-name">${escHtml(item.name)}</div>
              <div class="picker-sub">${escHtml(item.desc || '')}</div>
            </div>
            ${isEquipped ? '<div class="picker-badge">✓ В слоте</div>' : ''}
          </div>
        `;
      }).join('');

  const slotNames = { scope: 'Прицел', grip: 'Рукоять', magazine: 'Магазин', stock: 'Приклад' };

  const unequipBtn = currentId
    ? `<button class="btn-secondary picker-unequip" onclick="unequipModule('${slotType}')">✕ Снять</button>`
    : '';

  el.innerHTML = `
    <div class="section-header">
      <button class="btn-back" onclick="renderLoadout()">← Назад</button>
      <h2>Модуль: ${slotNames[slotType] || slotType}</h2>
    </div>
    ${unequipBtn}
    <div class="picker-list">
      ${itemsHtml}
    </div>
  `;
}

function equipItem(slotId, uid) {
  const item = gameData.stash.items.find(i => i._uid === uid);
  if (!item) return;

  if (slotId === 'ammo') {
    gameData.loadout.ammo = item.id;
    gameData.loadout.ammoCount = item.ammoCount || 0;
  } else {
    gameData.loadout[slotId] = item.id;
  }

  saveData();
  renderLoadout();
  showToast(`✓ ${item.name} — надет`, 'success');
}

function unequipSlot(slotId) {
  if (slotId === 'ammo') {
    gameData.loadout.ammo = null;
    gameData.loadout.ammoCount = 0;
  } else {
    gameData.loadout[slotId] = null;
  }
  saveData();
  renderLoadout();
  showToast('Предмет снят', 'info');
}

function equipModule(slotType, modId) {
  gameData.loadout.modules[slotType] = modId;
  saveData();
  renderLoadout();
  showToast(`✓ Модуль установлен`, 'success');
}

function unequipModule(slotType) {
  gameData.loadout.modules[slotType] = null;
  saveData();
  renderLoadout();
  showToast('Модуль снят', 'info');
}

// ============================================================
// РЕНДЕР — ТОРГОВЦЫ (ЗАДЕЛ)
// ============================================================

function renderTraders() {
  const el = document.getElementById('tab-traders');
  el.innerHTML = `
    <div class="section-header">
      <h2>🏪 Торговцы</h2>
    </div>
    <div class="traders-grid">
      ${Object.values(TRADERS).map(t => `
        <div class="trader-card" onclick="openTrader('${t.id}')">
          <div class="trader-icon">${t.icon}</div>
          <div class="trader-info">
            <div class="trader-name">${t.name}</div>
            <div class="trader-nick">"${t.nickname}"</div>
            <div class="trader-desc">${t.desc}</div>
          </div>
          <div class="trader-arrow">›</div>
        </div>
      `).join('')}
    </div>
    <div class="wip-banner">
      🚧 Торговцы в разработке. Скоро откроются.
    </div>
  `;
}

function openTrader(traderId) {
  showToast('Торговец скоро откроется', 'info');
}

// ============================================================
// РЕНДЕР — РЕЙД (вход)
// Если рейд активен — передать управление raid.js
// ============================================================

function renderRaid() {
  const el = document.getElementById('tab-raid');

  if (gameData.raid && gameData.raid.active) {
    // Рейд идёт — рендерит raid.js
    if (typeof renderRaidScreen === 'function') renderRaidScreen();
    return;
  }

  // Экран подготовки к рейду
  const stats = calcLoadoutStats();
  const hasWeapon = !!gameData.loadout.weapon;
  const hasAmmo = !!gameData.loadout.ammo && gameData.loadout.ammoCount > 0;

  el.innerHTML = `
    <div class="section-header">
      <h2>🎯 Рейд</h2>
    </div>

    <div class="raid-prep">
      <div class="prep-block">
        <h3>Текущее снаряжение</h3>
        <div class="prep-stats">
          <div class="prep-row ${!hasWeapon ? 'warn' : ''}">
            <span>Оружие</span>
            <span>${hasWeapon ? escHtml(WEAPONS[gameData.loadout.weapon].name) : '⚠️ Не выбрано'}</span>
          </div>
          <div class="prep-row ${!hasAmmo ? 'warn' : ''}">
            <span>Патроны</span>
            <span>${hasAmmo ? `${gameData.loadout.ammoCount} шт.` : '⚠️ Нет патронов'}</span>
          </div>
          <div class="prep-row">
            <span>Точность</span>
            <span>${Math.round(stats.accuracy * 100)}%</span>
          </div>
          <div class="prep-row">
            <span>Броня</span>
            <span>${stats.vestProtection}</span>
          </div>
        </div>
      </div>

      <div class="raid-warning">
        <span class="warn-icon">☠️</span>
        <span>При смерти в рейде вы теряете всё снаряжение и лут</span>
      </div>

      <button class="btn-primary btn-large btn-raid"
        ${!hasWeapon || !hasAmmo ? 'disabled' : ''}
        onclick="startRaid()">
        ${!hasWeapon ? '⚠️ Нет оружия' : !hasAmmo ? '⚠️ Нет патронов' : '🚁 НАЧАТЬ РЕЙД'}
      </button>

      ${!hasWeapon || !hasAmmo ? `
        <button class="btn-secondary" onclick="switchTab('tab-traders')">
          Купить снаряжение
        </button>
      ` : ''}
    </div>
  `;
}

// ============================================================
// РЕНДЕР — ЛИДЕРБОРД
// ============================================================

function renderLeaderboard() {
  const el = document.getElementById('tab-leaderboard');
  updateLeaderboardPlayer();
  const top = gameData.leaderboard.slice(0, 50);
  const playerRank = getPlayerRank();

  el.innerHTML = `
    <div class="section-header">
      <h2>🏆 Рейтинг</h2>
      <div class="player-rank-badge">Ваше место: #${playerRank}</div>
    </div>

    <div class="leaderboard-list">
      ${top.map((entry, i) => {
        const rank = i + 1;
        const isPlayer = entry.isPlayer;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        return `
          <div class="lb-row ${isPlayer ? 'lb-player' : ''}">
            <div class="lb-rank">${medal}</div>
            <div class="lb-name">${escHtml(entry.name)}${isPlayer ? ' 👤' : ''}</div>
            <div class="lb-coins">${CURRENCY_ICON} ${fmtNum(entry.coins)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ
// ============================================================

// Найти предмет по id во всех справочниках
function findItemById(id) {
  return WEAPONS[id] || EQUIPMENT[id] || AMMO[id] || MODULES[id] || MEDKITS[id] || SAFE_KEYS[id] || null;
}

// Добавить предмет в схрон
function addToStash(itemId, extraData = {}) {
  const item = findItemById(itemId);
  if (!item) return;
  const entry = {
    ...item,
    ...extraData,
    _uid: generateUid(),
    _addedAt: Date.now(),
  };
  gameData.stash.items.push(entry);
}

// Генерация уникального ID
function generateUid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Безопасный HTML
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Форматирование числа с разделителями
function fmtNum(n) {
  return Number(n).toLocaleString('ru-RU');
}

// Toast-уведомление
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const loaded = loadData();
  if (!loaded) {
    gameData = defaultGameData();
    generateLeaderboard();
    saveData();
  }

  // Навигация
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      if (tabId) switchTab(tabId);
    });
  });

  // Первая вкладка
  switchTab('tab-home');

  // Симуляция ботов каждые 30 секунд
  setInterval(() => {
    simulateBots();
    saveData();
    if (currentTab === 'tab-leaderboard') renderLeaderboard();
  }, 30000);

  console.log('Extraction Game — загружено');
});
