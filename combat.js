// ============================================================
// COMBAT.JS — Боевой движок
// Броски, выстрелы, зоны попадания, конечности, раунды
// ============================================================

// ============================================================
// СОСТОЯНИЕ БОЯ
// ============================================================

let combatState = null;

function initCombat(enemyData) {
  combatState = {
    active:    true,
    round:     1,
    playerHP:  100,
    maxHP:     100,
    enemyHP:   100,
    enemyMaxHP:100,
    enemy:     enemyData,

    // Статусы конечностей
    limbs: {
      arms:  false,  // true = повреждены
      legs:  false,
      chest: false,
    },

    // Патроны в текущем магазине
    currentMagAmmo: calcCurrentMagSize(),

    // Логи раундов
    log: [],

    // Ждём выбора тактики игроком
    awaitingAction: true,
    playerChoice:   null,
  };

  renderCombat();
}

// ============================================================
// ОСНОВНОЙ ХОД — РАУНД
// ============================================================

function playRound(tacticId) {
  if (!combatState || !combatState.active) return;
  if (!COMBAT_TACTICS[tacticId]) return;

  const tactic = COMBAT_TACTICS[tacticId];

  // Проверка блокировки тактики
  if (tactic.requiresLegs && combatState.limbs.legs) {
    showToast('Тактика недоступна — ноги повреждены', 'warning');
    return;
  }

  combatState.awaitingAction = false;
  combatState.playerChoice = tacticId;

  const roundLog = [];

  // --- ХОД ИГРОКА ---
  const playerResult = resolvePlayerAttack(tactic);
  roundLog.push(...playerResult.log);
  combatState.enemyHP = Math.max(0, combatState.enemyHP - playerResult.totalDamage);

  // --- ХОД ВРАГА ---
  if (combatState.enemyHP > 0) {
    const enemyTactic = pickEnemyTactic();
    const enemyResult = resolveEnemyAttack(enemyTactic, tactic);
    roundLog.push(...enemyResult.log);
    combatState.playerHP = Math.max(0, combatState.playerHP - enemyResult.totalDamage);
  }

  // --- ОБНОВИТЬ СТАТУСЫ КОНЕЧНОСТЕЙ ---
  updateLimbStatus(roundLog);

  // --- КРОВОТЕЧЕНИЕ ---
  if (combatState.limbs.chest && combatState.playerHP > 0) {
    const bleed = LIMB_THRESHOLDS.chest.penaltyValue;
    combatState.playerHP = Math.max(0, combatState.playerHP - bleed);
    roundLog.push({ type: 'bleed', text: `🩸 Кровотечение: −${bleed} HP` });
  }

  // Сохранить лог раунда
  combatState.log.push({
    round: combatState.round,
    entries: roundLog,
  });

  combatState.round++;

  // --- ИСХОД ---
  if (combatState.enemyHP <= 0 && combatState.playerHP <= 0) {
    endCombat('draw');
  } else if (combatState.enemyHP <= 0) {
    endCombat('win');
  } else if (combatState.playerHP <= 0) {
    endCombat('lose');
  } else {
    combatState.awaitingAction = true;
    renderCombat();
  }
}

// ============================================================
// АТАКА ИГРОКА
// ============================================================

function resolvePlayerAttack(tactic) {
  const log = [];
  const stats = calcLoadoutStats();
  const lo = gameData.loadout;

  // Количество выстрелов
  const { min, max } = tactic.shotsModifier;
  const shots = min === 0 && max === 0 ? 0 : randInt(min, max);

  if (shots === 0) {
    if (tactic.reloadMag) {
      combatState.currentMagAmmo = calcCurrentMagSize();
      log.push({ type: 'reload', text: `🔄 Вы перезарядились (${combatState.currentMagAmmo} патр.)` });
    } else {
      log.push({ type: 'defense', text: `🛡️ Вы в укрытии, не стреляете` });
    }
    return { totalDamage: 0, log };
  }

  // Нельзя выстрелить больше чем есть в магазине
  const actualShots = Math.min(shots, combatState.currentMagAmmo);
  if (actualShots <= 0) {
    log.push({ type: 'empty', text: `🚫 Пустой магазин! Патроны кончились.` });
    return { totalDamage: 0, log };
  }

  combatState.currentMagAmmo -= actualShots;
  // Расход патронов из общего запаса
  gameData.loadout.ammoCount = Math.max(0, gameData.loadout.ammoCount - actualShots);

  log.push({ type: 'shots', text: `🔫 Вы производите ${actualShots} выстр. (осталось ${combatState.currentMagAmmo} в магазине)` });

  // Точность с модификаторами тактики
  let acc = stats.accuracy;
  if (tactic.accuracyBonus) acc += tactic.accuracyBonus;
  if (tactic.accuracyPenalty) acc -= tactic.accuracyPenalty;
  if (combatState.limbs.arms) acc -= LIMB_THRESHOLDS.arms.penaltyValue;
  acc = Math.max(0.05, Math.min(0.99, acc));

  // Попадания
  let hits = 0;
  for (let i = 0; i < actualShots; i++) {
    if (Math.random() < acc) hits++;
  }

  if (hits === 0) {
    log.push({ type: 'miss', text: `💨 Все выстрелы мимо` });
    return { totalDamage: 0, log };
  }

  log.push({ type: 'hit', text: `✅ Попаданий: ${hits} из ${actualShots}` });

  // Урон за попадания
  let totalDamage = 0;
  const ammo = lo.ammo ? AMMO[lo.ammo] : null;
  const weapon = lo.weapon ? WEAPONS[lo.weapon] : null;
  const baseDmg = weapon ? weapon.damage + (ammo ? ammo.damageBonus : 0) : 10;
  const armorPen = ammo ? ammo.armorPen : 0;
  const enemyArmor = combatState.enemy.armorValue || 0;

  for (let i = 0; i < hits; i++) {
    const zone = rollHitZone();
    const rawDmg = Math.round(baseDmg * zone.damageMultiplier);

    // Пробитие брони
    const effectiveArmor = Math.round(enemyArmor * (1 - armorPen));
    const finalDmg = Math.max(1, rawDmg - effectiveArmor);

    totalDamage += finalDmg;

    if (tactic.damageBonus) {
      const bonus = Math.round(finalDmg * tactic.damageBonus);
      totalDamage += bonus;
    }

    log.push({
      type: 'damage',
      text: `💥 ${zone.name} [${zone.icon}]: ${rawDmg} − ${effectiveArmor} брони = ${finalDmg} урона`,
    });
  }

  log.push({ type: 'total', text: `📊 Итого нанесено: ${totalDamage} урона` });

  return { totalDamage, log };
}

// ============================================================
// АТАКА ВРАГА
// ============================================================

function resolveEnemyAttack(enemyTactic, playerTactic) {
  const log = [];
  const enemy = combatState.enemy;

  const shots = randInt(enemyTactic.shotsModifier.min, enemyTactic.shotsModifier.max);

  if (shots === 0) {
    log.push({ type: 'enemy-defense', text: `${enemy.icon} ${enemy.name} уходит в укрытие` });
    return { totalDamage: 0, log };
  }

  log.push({ type: 'enemy-shots', text: `${enemy.icon} ${enemy.name} производит ${shots} выстр.` });

  let acc = enemy.accuracy || 0.50;
  if (enemyTactic.accuracyBonus) acc += enemyTactic.accuracyBonus;
  if (enemyTactic.accuracyPenalty) acc -= enemyTactic.accuracyPenalty;

  // Защитный бонус тактики игрока снижает точность врага
  if (playerTactic.defenseBonus) {
    acc -= playerTactic.defenseBonus * 0.5;
  }
  acc = Math.max(0.05, Math.min(0.99, acc));

  let hits = 0;
  for (let i = 0; i < shots; i++) {
    if (Math.random() < acc) hits++;
  }

  if (hits === 0) {
    log.push({ type: 'enemy-miss', text: `💨 ${enemy.name}: все мимо` });
    return { totalDamage: 0, log };
  }

  log.push({ type: 'enemy-hit', text: `⚠️ ${enemy.name} попал ${hits} раз` });

  // Броня игрока
  const vest = gameData.loadout.vest ? EQUIPMENT[gameData.loadout.vest] : null;
  const helmet = gameData.loadout.helmet ? EQUIPMENT[gameData.loadout.helmet] : null;

  let totalDamage = 0;

  for (let i = 0; i < hits; i++) {
    const zone = rollHitZone();
    const rawDmg = Math.round((enemy.damage || 20) * zone.damageMultiplier);

    let armor = 0;
    if (zone.name === 'Голова' && helmet) armor = helmet.protection;
    else if (['Грудь', 'Тело'].includes(zone.name) && vest) armor = vest.protection;

    const finalDmg = Math.max(1, rawDmg - armor);
    totalDamage += finalDmg;

    log.push({
      type: 'enemy-damage',
      text: `🩸 Вы: ${zone.name} [${zone.icon}] ${rawDmg} − ${armor} брони = ${finalDmg} урона`,
    });
  }

  log.push({ type: 'enemy-total', text: `📊 Вы получили: ${totalDamage} урона` });

  return { totalDamage, log };
}

// ============================================================
// ЗОНЫ ПОПАДАНИЯ — РАНДОМНЫЙ БРОСОК
// ============================================================

function rollHitZone() {
  const zones = Object.values(HIT_ZONES);
  const totalWeight = zones.reduce((s, z) => s + z.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const zone of zones) {
    rand -= zone.weight;
    if (rand <= 0) return zone;
  }
  return zones[zones.length - 1];
}

// ============================================================
// ИИ ВРАГА — выбор тактики
// ============================================================

function pickEnemyTactic() {
  const enemy = combatState.enemy;
  const hpRatio = combatState.enemyHP / combatState.enemyMaxHP;

  // Раненый враг уходит в защиту
  if (hpRatio < 0.35) {
    const defensiveTactics = Object.values(COMBAT_TACTICS).filter(t => t.category === 'defensive');
    return defensiveTactics[randInt(0, defensiveTactics.length - 1)];
  }

  // Агрессивный враг — больше атакует
  const aggressionBias = enemy.aggression || 0.5;
  if (Math.random() < aggressionBias) {
    const aggressiveTactics = Object.values(COMBAT_TACTICS).filter(t => t.category === 'aggressive');
    return aggressiveTactics[randInt(0, aggressiveTactics.length - 1)];
  }

  const allTactics = Object.values(COMBAT_TACTICS);
  return allTactics[randInt(0, allTactics.length - 1)];
}

// ============================================================
// ОБНОВЛЕНИЕ КОНЕЧНОСТЕЙ
// ============================================================

function updateLimbStatus(log) {
  const ratio = combatState.playerHP / combatState.maxHP;

  if (ratio < LIMB_THRESHOLDS.chest.threshold && !combatState.limbs.chest) {
    combatState.limbs.chest = true;
    log.push({ type: 'limb', text: `🩸 ${LIMB_THRESHOLDS.chest.desc}` });
  }
  if (ratio < LIMB_THRESHOLDS.legs.threshold && !combatState.limbs.legs) {
    combatState.limbs.legs = true;
    log.push({ type: 'limb', text: `🦽 ${LIMB_THRESHOLDS.legs.desc}` });
  }
  if (ratio < LIMB_THRESHOLDS.arms.threshold && !combatState.limbs.arms) {
    combatState.limbs.arms = true;
    log.push({ type: 'limb', text: `🤕 ${LIMB_THRESHOLDS.arms.desc}` });
  }
}

// Применить аптечку в бою
function useMedkit(medkitUid) {
  if (!combatState || !combatState.active) return;

  const idx = gameData.loadout.medkits.findIndex(m => m._uid === medkitUid);
  if (idx === -1) return;

  const med = gameData.loadout.medkits[idx];
  const healed = Math.min(med.healAmount, combatState.maxHP - combatState.playerHP);
  combatState.playerHP += healed;

  if (med.healsLimb) {
    // Лечит самую тяжёлую конечность
    if (combatState.limbs.chest) {
      combatState.limbs.chest = false;
    } else if (combatState.limbs.legs) {
      combatState.limbs.legs = false;
    } else if (combatState.limbs.arms) {
      combatState.limbs.arms = false;
    }
  }

  gameData.loadout.medkits.splice(idx, 1);

  combatState.log.push({
    round: combatState.round,
    entries: [{ type: 'heal', text: `💊 Использована ${med.name}: +${healed} HP` }],
  });

  saveData();
  renderCombat();
}

// ============================================================
// ИСХОД БОЯ
// ============================================================

function endCombat(result) {
  combatState.active = false;
  combatState.result = result;

  if (result === 'win') {
    gameData.totalKills++;
    // Лут с врага — передаётся в raid.js
    if (typeof onCombatWin === 'function') onCombatWin(combatState.enemy);
  } else if (result === 'lose') {
    // Смерть — обрабатывается в raid.js
    if (typeof onCombatLose === 'function') onCombatLose();
  } else {
    // Ничья — оба упали
    if (typeof onCombatLose === 'function') onCombatLose();
  }

  saveData();
  renderCombat();
}

// ============================================================
// РЕНДЕР БОЕВОГО ЭКРАНА
// ============================================================

function renderCombat() {
  if (!combatState) return;
  const el = document.getElementById('tab-raid');
  if (!el) return;

  const cs = combatState;
  const enemy = cs.enemy;
  const stats = calcLoadoutStats();

  el.innerHTML = `
    <div class="combat-screen">

      <!-- Статус игрока -->
      <div class="combat-player">
        <div class="combatant-header">
          <span class="combatant-name">👤 ${escHtml(gameData.playerName)}</span>
          <span class="combatant-hp">${cs.playerHP} / ${cs.maxHP} HP</span>
        </div>
        <div class="hp-bar-wrap">
          <div class="hp-bar hp-bar-player" style="width:${cs.playerHP / cs.maxHP * 100}%"></div>
        </div>
        <div class="limb-status">
          ${cs.limbs.arms  ? `<span class="limb-tag limb-arms">${LIMB_THRESHOLDS.arms.icon} ${LIMB_THRESHOLDS.arms.label}</span>`  : ''}
          ${cs.limbs.legs  ? `<span class="limb-tag limb-legs">${LIMB_THRESHOLDS.legs.icon} ${LIMB_THRESHOLDS.legs.label}</span>`  : ''}
          ${cs.limbs.chest ? `<span class="limb-tag limb-chest">${LIMB_THRESHOLDS.chest.icon} ${LIMB_THRESHOLDS.chest.label}</span>` : ''}
        </div>
        <div class="ammo-status">
          🔫 Магазин: ${cs.currentMagAmmo} | Запас: ${gameData.loadout.ammoCount}
        </div>
      </div>

      <div class="combat-vs">⚔️ Раунд ${cs.round}</div>

      <!-- Враг -->
      <div class="combat-enemy">
        <div class="combatant-header">
          <span class="combatant-name">${enemy.icon} ${escHtml(enemy.name)}</span>
          <span class="combatant-hp">${cs.enemyHP} / ${cs.enemyMaxHP} HP</span>
        </div>
        <div class="hp-bar-wrap">
          <div class="hp-bar hp-bar-enemy" style="width:${cs.enemyHP / cs.enemyMaxHP * 100}%"></div>
        </div>
        <div class="enemy-tier">
          <span style="color:${getTierColor(enemy.tier || 1)}">Тир ${enemy.tier || 1}</span>
        </div>
      </div>

      <!-- Лог последнего раунда -->
      <div class="combat-log">
        ${cs.log.length > 0 ? renderLastRoundLog() : '<div class="log-placeholder">Выбери тактику для первого раунда</div>'}
      </div>

      <!-- Итог боя -->
      ${!cs.active ? renderCombatResult() : ''}

      <!-- Тактики -->
      ${cs.active && cs.awaitingAction ? renderTacticButtons() : ''}

      <!-- Аптечки -->
      ${cs.active ? renderMedkitButtons() : ''}
    </div>
  `;
}

function renderLastRoundLog() {
  if (!combatState.log.length) return '';
  const last = combatState.log[combatState.log.length - 1];
  return last.entries.map(e => `
    <div class="log-entry log-${e.type}">${e.text}</div>
  `).join('');
}

function renderTacticButtons() {
  const cs = combatState;
  return `
    <div class="tactic-buttons">
      <div class="tactic-label">Выбери тактику:</div>
      <div class="tactic-grid">
        ${Object.values(COMBAT_TACTICS).map(t => {
          const blocked = t.requiresLegs && cs.limbs.legs;
          return `
            <button class="btn-tactic btn-${t.category} ${blocked ? 'blocked' : ''}"
                    ${blocked ? 'disabled' : ''}
                    onclick="playRound('${t.id}')"
                    title="${t.desc}">
              <span class="tactic-icon">${t.icon}</span>
              <span class="tactic-name">${t.name}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderMedkitButtons() {
  const meds = gameData.loadout.medkits;
  if (!meds || meds.length === 0) return '';
  return `
    <div class="medkit-bar">
      ${meds.map(m => `
        <button class="btn-medkit" onclick="useMedkit('${m._uid}')" title="${m.desc}">
          ${m.icon} ${m.name} (+${m.healAmount})
        </button>
      `).join('')}
    </div>
  `;
}

function renderCombatResult() {
  const cs = combatState;
  const isWin = cs.result === 'win';
  return `
    <div class="combat-result ${isWin ? 'result-win' : 'result-lose'}">
      <div class="result-icon">${isWin ? '🏆' : '💀'}</div>
      <div class="result-text">${isWin ? 'ПРОТИВНИК УНИЧТОЖЕН' : 'ВЫ ПОГИБЛИ'}</div>
      <button class="btn-primary" onclick="${isWin ? 'afterCombatWin()' : 'afterCombatLose()'}">
        ${isWin ? 'Забрать лут' : 'Продолжить'}
      </button>
    </div>
  `;
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ
// ============================================================

function calcCurrentMagSize() {
  const lo = gameData.loadout;
  const weapon = lo.weapon ? WEAPONS[lo.weapon] : null;
  if (!weapon) return 0;
  let size = weapon.magSize;
  const magMod = lo.modules && lo.modules.magazine ? MODULES[lo.modules.magazine] : null;
  if (magMod && magMod.magBonus) size += magMod.magBonus;
  return Math.min(size, gameData.loadout.ammoCount);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
