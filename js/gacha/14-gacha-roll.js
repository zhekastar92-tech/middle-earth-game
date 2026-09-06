// ============================================================
// GACHA ROLL
// Броски обычной и мифической рулеток (rollGacha, rollMythicGacha).
// ============================================================

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
