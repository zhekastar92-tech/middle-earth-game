// ============================================================
// TITLES & BOT COSMETICS
// Активный титул игрока, генерация косметики ботов (титул/рамка/эффект).
// ============================================================

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
// ============================================================
// СИСТЕМА КОСМЕТИКИ БОТОВ
// ============================================================

// Базовые шансы (идентичны рулетке) * 10 = шанс бота по умолчанию
// Множители: 5000+ LP = x2, 6000+ LP = x3, топ-100 = x5
function _getBotCosmeticMult() {
  let lp = gameData.lp;
  // Проверяем топ-100: игрок среди топ-100 по лидерборду
  if (gameData.leaderboard && gameData.leaderboard.length >= 50) {
    let allLps = [...gameData.leaderboard.map(b => b.lp), lp].sort((a, b) => b - a);
    let playerPos = allLps.indexOf(lp); // 0-based
    // лидерборд 50 ботов + игрок = 51 запись, топ-100 = первые 50 позиций (0..49)
    if (playerPos <= 49) return 5;
  }
  if (lp >= 6000) return 3;
  if (lp >= 5000) return 2;
  return 1;
}

// Проверка: является ли игрок топ-100
function _isPlayerTop100() {
  if (!gameData.leaderboard || gameData.leaderboard.length < 50) return false;
  let allLps = [...gameData.leaderboard.map(b => b.lp), gameData.lp].sort((a, b) => b - a);
  return allLps.indexOf(gameData.lp) <= 49;
}

function rollBotTitle(classId) {
  // Устаревшая функция — оставлена для совместимости, теперь используем rollBotCosmetics
  return null;
}

// Основная функция: генерирует все косметические атрибуты бота
// Возвращает { title, frame, entryEffect }
function rollBotCosmetics(classId) {
  let mult = _getBotCosmeticMult();
  // базовый x10 (согласно ТЗ), затем * mult по LP/топ
  let m = 10 * mult;

  // ────────── ТИТУЛ ──────────
  // Собираем все пулы (легендарные + мифические) для данного класса
  let legendPool = GACHA_POOLS[classId];
  let mythicPool = MYTHIC_GACHA_POOLS[classId];

  let title = null;

  // Шансы из рулеток (базовые):
  // legendary: 0.4% → бот базово: 4%, mythic: 0.2% → бот базово: 2%
  // epic: 2% → 20%, rare: 7% → 70% (≥1 всегда будет), uncommon: 15% → capped 100%
  // Поэтому откатываем через отдельные броски с capping

  // Приоритет: mythic > legendary > epic > rare > uncommon
  // Каждый уровень — отдельный бросок с базовым шансом * m, cap 1.0
  function tryRoll(baseChance) {
    return Math.random() < Math.min(baseChance * m, 1.0);
  }

  // Мифический титул (только если есть мифический пул для класса)
  if (mythicPool && mythicPool.titles && mythicPool.titles.mythic) {
    if (tryRoll(mythicPool.titles.mythic.chance)) { // 0.2% base
      title = { rarity: 'mythic', name: mythicPool.titles.mythic.name, source: 'mythic' };
    }
  }

  // Если нет мифика — пробуем остальные мифические редкости (epic/rare/uncommon из mythicPool)
  if (!title && mythicPool && mythicPool.titles) {
    if (mythicPool.titles.epic && tryRoll(mythicPool.titles.epic.chance)) {
      title = { rarity: 'epic', name: mythicPool.titles.epic.name, source: 'mythic' };
    } else if (mythicPool.titles.rare && tryRoll(mythicPool.titles.rare.chance)) {
      title = { rarity: 'rare', name: mythicPool.titles.rare.name, source: 'mythic' };
    } else if (mythicPool.titles.uncommon && tryRoll(mythicPool.titles.uncommon.chance)) {
      title = { rarity: 'uncommon', name: mythicPool.titles.uncommon.name, source: 'mythic' };
    }
  }

  // Если нет — пробуем легендарный пул
  if (!title && legendPool && legendPool.titles) {
    if (legendPool.titles.legendary && tryRoll(legendPool.titles.legendary.chance)) { // 0.4% base
      title = { rarity: 'legendary', name: legendPool.titles.legendary.name, source: 'legend' };
    } else if (legendPool.titles.epic && tryRoll(legendPool.titles.epic.chance)) {
      title = { rarity: 'epic', name: legendPool.titles.epic.name, source: 'legend' };
    } else if (legendPool.titles.rare && tryRoll(legendPool.titles.rare.chance)) {
      title = { rarity: 'rare', name: legendPool.titles.rare.name, source: 'legend' };
    } else if (legendPool.titles.uncommon && tryRoll(legendPool.titles.uncommon.chance)) {
      title = { rarity: 'uncommon', name: legendPool.titles.uncommon.name, source: 'legend' };
    }
  }

  // ────────── РАМКА ──────────
  // Рамки есть только в мифических пулах, базовый шанс 0.4%
  let frame = null;
  if (mythicPool && mythicPool.frame) {
    if (tryRoll(mythicPool.frame.chance)) { // 0.4% base
      frame = mythicPool.frame.id;
    }
  }
  // Если не выпала рамка своего класса — попробуем любую мифическую рамку (x0.5 от шанса)
  if (!frame) {
    let allMythicPools = Object.values(MYTHIC_GACHA_POOLS).filter(p => p.frame);
    allMythicPools.forEach(p => {
      if (!frame && Math.random() < Math.min(p.frame.chance * m * 0.5, 1.0)) {
        frame = p.frame.id;
      }
    });
  }

  // ────────── ЭФФЕКТ ПОЯВЛЕНИЯ ──────────
  // Эффекты есть только в мифических пулах, базовый шанс 0.4%
  let entryEffect = null;
  if (mythicPool && mythicPool.entryEffect) {
    if (tryRoll(mythicPool.entryEffect.chance)) {
      entryEffect = mythicPool.entryEffect.id;
    }
  }
  // Если не выпал — попробуем любой мифический эффект (x0.5)
  if (!entryEffect) {
    let allMythicPools = Object.values(MYTHIC_GACHA_POOLS).filter(p => p.entryEffect);
    allMythicPools.forEach(p => {
      if (!entryEffect && Math.random() < Math.min(p.entryEffect.chance * m * 0.5, 1.0)) {
        entryEffect = p.entryEffect.id;
      }
    });
  }

  return { title, frame, entryEffect };
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

