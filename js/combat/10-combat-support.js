// ============================================================
// COMBAT SUPPORT
// Бессмертие, HoT, разрешение обмена ударами, применение урона, прогресс навыков.
// ============================================================

function checkImmortality(char, name) {
  if (char.hp <= 0 && char.classId === 'darkknight' && !char.usedImmortality) {
    char.hp = 1; char.usedImmortality = true; char.canHeal = false;
    char.immortalTurns = 2; char.immortalTurnActive = true;
    return `<span class="text-skill">💀 БЕССМЕРТИЕ! ${name} восстает из мертвых (1 ХП)!</span><br>`;
  }
  return "";
}

function processHoT(healer, target, hName, tName) {
  if (healer.hotTurnsLeft > 0) {
    let msg = "";
    if (healer.canHeal) {
      healer.hp += 2; if (healer.hp > healer.maxHp) healer.hp = healer.maxHp;
      msg = `💖 ${hName} лечит 2 ХП умением Сила жизни<br>`;
    }
    healer.hotTurnsLeft--;
    if (healer.classId === 'priest') {
      target.hp -= 2;
      msg += `🌟 Свет наносит ${tName} 2 урона!<br>`;
      // БАГ-ФИКС: проверяем immortalTurnActive для Тёмного Рыцаря при уроне от эффектов
      if (target.hp <= 0 && target.classId === 'darkknight' && target.immortalTurnActive) {
        target.hp = 1;
        msg += `<span class="text-skill">🛡️ Смерть отступает!</span><br>`;
      } else { msg += checkImmortality(target, tName); }
      // Учитываем урон от Обжигающего света для триггера Сильвии
      if (target.isMob) lastPlayerDmgThisTurn += 2;
    }
    return msg;
  } return "";
}

function resolveCombat(atkC, defC, aRoll, dBlock, aName, dName, ignBlock, isSkill = false) {
  let res = `🗡️ ${aName} наносит ${getHitAdj(aRoll)} удар (${aRoll})<br>`;

  // БАГ-ФИКС 1: уклонение проверяем ДО вывода строки блока
  if (!defC.isMob) {
    if (defC.classId === 'assassin' && defC.hp <= 4 && !defC.usedInstinct) {
      defC.usedInstinct = true;
      return res + `<span class="text-info">🌑 Инстинкт: ${dName} уклоняется!</span><br>`;
    }
    if (Math.random() < defC.eqP.dodge) return res + `<span class="text-info">👢 Сапоги: ${dName} уклоняется!</span><br>`;
  }

  if (!ignBlock) res += `🛡️ ${dName} ставит ${getBlockAdj(dBlock)} блок (${dBlock})<br>`;
  else res += `🛡️ ${dName} не может заблокировать удар!<br>`;

  let actualBlocked = ignBlock ? 0 : Math.min(aRoll, dBlock);
  defC.stats.dmgBlocked += actualBlocked;

  if (!defC.isMob && defC.classId === 'guardian') {
    defC.retBlocks += actualBlocked;
    while (defC.retBlocks >= 2 && defC.retBonus < 5) { defC.retBlocks -= 2; defC.retBonus += 1; }
  }

  if (aRoll > dBlock || ignBlock) {
    let dmg = ignBlock ? aRoll : (aRoll - dBlock);
    if (!defC.isMob && defC.eqP.blockPierce > 0) { let absorbed = Math.min(dmg, defC.eqP.blockPierce); dmg -= absorbed; defC.eqP.blockPierce = 0; res += `<span class="text-info">👕 Броня поглотила ${absorbed} урона!</span><br>`; }
    if (dmg > 0) res += applyDamage(defC, atkC, dmg, dName, isSkill);
  } else if (aRoll === dBlock) {
    res += `<span class="text-block">Идеальный блок!</span><br>`;
    if (!defC.isMob && defC.classId === 'guardian') { res += applyDamage(atkC, defC, 1, aName, false); res += `🗡️ <span class="text-info">Контратака!</span><br>`; }
  } else {
    let heal = dBlock - aRoll + (defC.eqP ? defC.eqP.healB : 0);
    if (defC.canHeal) {
      defC.hp = Math.min(defC.maxHp, defC.hp + heal); defC.stats.healed += heal;
      res += `✨ Избыточный блок! ${dName} +${heal} ХП<br>`;
    } else { res += `✨ Избыточный блок! Но ${dName} не может исцеляться.<br>`; }
    if (!defC.isMob && defC.classId === 'guardian') { res += applyDamage(atkC, defC, 1, aName, false); res += `🗡️ <span class="text-info">Контратака!</span><br>`; }
    if (!defC.isMob && defC.classId === 'priest') { res += applyDamage(atkC, defC, heal, aName, false); res += `🌟 Свет наносит ${aName} <span class="text-dmg">${heal} урона</span>!<br>`; }
  }
  return res;
}

function applyDamage(t, a, dmg, tName, isSkill = false) {
  let res = `💥 ${tName} получает <span class="text-dmg">${dmg} урона</span><br>`;
  t.hp -= dmg;
  if (!isSkill && a && !a.isMob) a.stats.dmgDealt += dmg;
  if (a && !a.isMob && a.classId === 'assassin') a.pursuitDmg += dmg;

  if (a && !a.isMob && a.classId === 'darkknight') {
    if (a.hp <= 4) a.courageThresholdDown = true;
    let thresh = a.courageThresholdDown ? 1 : 2;
    if (dmg >= thresh && a.canHeal) {
      let h = 1; a.hp = Math.min(a.maxHp, a.hp + h); a.stats.healed += h;
      res += `🦇 <span class="text-heal">Кураж: Тёмный Рыцарь +${h} ХП</span><br>`;
    }
  }

  if (!t.isMob && t.classId === 'priest' && t.hp <= 8 && t.hp > 0 && !t.usedPrayer && t.canHeal) {
    t.usedPrayer = true; let h = Math.min(6, t.maxHp - t.hp); t.hp += h;
    res += `🙏 <span class="text-heal">Молитва: ${tName} +${h} ХП!</span><br>`;
  }

  if (!t.isMob && t.hp <= 0 && t.classId === 'darkknight') {
    if (!t.usedImmortality) { res += checkImmortality(t, tName); }
    else if (t.immortalTurnActive) { t.hp = 1; res += `<span class="text-skill">🛡️ Смерть отступает!</span><br>`; }
  }
  return res;
}

function checkSkills(c, t, name) {
  let info = CLASSES[c.classId];
  if (!c.skillReady && c.stats[info.reqType] >= info.reqAmt) { c.skillReady = true; c.stats[info.reqType] = 0; }
  if (c.classId === 'assassin' && c.pursuitDmg >= 13 && !t.poisoned) { t.poisoned = true; logToScreen(`<span class="text-info">☠️ ${name === getPlayerName() ? "Враг отравлен" : "Вы отравлены"}!</span>`); }
}

function checkSkillsPlayerOnly(c, name) {
  let info = CLASSES[c.classId];
  if (!c.skillReady && c.stats[info.reqType] >= info.reqAmt) { c.skillReady = true; c.stats[info.reqType] = 0; }
  if (c.classId === 'assassin' && c.pursuitDmg >= 13 && !bot.poisoned) {
    bot.poisoned = true; logToScreen(`<span class="text-info">☠️ Враг отравлен!</span>`);
  }
}
