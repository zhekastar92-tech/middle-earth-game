// ============================================================
// COMBAT ENGINE
// Основной ход боя: playTurn и применение урона к мобу.
// ============================================================

function applyDmgToMob(mob, attacker, dmg, mobName, isSkill) {
  if (mob.hissActive && dmg > 0) {
    dmg = Math.max(0, dmg - 1);
    if (dmg === 0) return `<span class="text-info">🐉 «Как ты с-с-смеешь» поглощает весь урон!</span><br>`;
  }
  let msg = applyDamage(mob, attacker, dmg, mobName, isSkill);
  // Каменная кожа — отражает урон игроку после получения удара
  if (mob.stoneSkinReflect && dmg > 0 && attacker === player) {
    let reflect = mob.stoneSkinReflect;
    player.hp = Math.max(0, player.hp - reflect);
    msg += `<span class="text-dmg">🗿 Каменная кожа: ${reflect} урона отражено обратно!</span><br>`;
  }
  return msg;
}

function playTurn(playerChoice) {
  if (gameIsOver) return;
  lastPlayerDmgThisTurn = 0;
  lastMobDmgThisTurn = 0;

  // Переключаем на порабощённого если хранитель его только что призвал
  if (bot.isMob && bot.summonActive && dungeonState && dungeonState.slave && bot !== dungeonState.slave) {
    dungeonState.slaveKeeper = bot;
    bot = dungeonState.slave;
    currentBotName = bot.name;
    document.getElementById("bot-card").className = "character border-mob-normal";
    document.getElementById("combat-log").innerHTML += `<div class="log-entry"><span class="text-dmg">👳🏻‍♂️ Порабощённый вступает в бой! Победите его, чтобы продолжить.</span></div>`;
    updateScreen();
  }

  let logMsg = `<div style="text-align:center; font-weight:900; color:#fbbf24; margin: 15px 0 10px 0; border-top: 1px solid #475569; padding-top: 10px;">━━━━━ Ход ${turnCount} ━━━━━</div>`;
  turnCount++;

  if (playerChoice === 'skip') { logMsg += `<span class="text-block">⏳ Вы не успели сделать выбор и пропускаете ход!</span><br>`; }

  // Проверяем умения моба ДО хода (только триггеры не зависящие от урона)
  if (bot.isMob) {
    logMsg += checkMobAbilitiesPreTurn(bot);
  }

  let botChoice;
  if (bot.isMob) {
    // Моб: просто атакует каждый ход
    botChoice = 'attack';
  } else {
    if (bot.immortalTurns > 0) {
      botChoice = 'immortal';
    } else if (bot.skillReady) {
      botChoice = 'skill';
    } else if (bot.blockStreak >= bot.blockStreakMax) {
      // Три блока подряд — принудительная атака
      botChoice = 'attack';
    } else {
      botChoice = Math.random() < 0.5 ? 'attack' : 'defend';
    }
  }

  let pAttack = 0, pBlock = 0, bAttack = 0, bBlock = 0;
  let pIgnore = false, pDouble = false, pInvul = false;
  let bIgnore = false, bDouble = false, bInvul = false;
  let pUsedActiveSkill = false, bUsedActiveSkill = false;
  let pBonus = 0, bBonus = 0;

  if (playerChoice === 'immortal') { pAttack = rollDice(); pBlock = 3; pBonus += 1; }
  else if (playerChoice !== 'skip') { pAttack = rollDice(); pBlock = rollDice(); }

  if (bot.isMob) {
    let mobRoll = rollDungeonMobAction(bot);
    bAttack = mobRoll.atk;
    bBlock = mobRoll.blk;
    // Леди Сильвия: блокирует блок игрока
    if (bot.fateActive) {
      pBlock = 0;
      logMsg += `<span class="text-dmg">😶 «Прими свою судьбу» — вы не можете блокировать! (осталось ${bot.fateTurnsLeft} хода)</span><br>`;
    }
    // Хранитель: Здесь твоя погибель — блок игрока = 0
    if (bot.doomActive) {
      pBlock = 0;
      logMsg += `<span class="text-dmg">💀 «Здесь твоя погибель...» — вы не можете блокировать! (осталось ${bot.doomTurnsLeft} хода)</span><br>`;
    }
    // Морской дракон: Устрашение — снижает атаку и блок игрока (до min 1)
    if (bot.waterBlastActive) {
      pAttack = Math.max(1, pAttack - 1);
      pBlock  = Math.max(1, pBlock  - 1);
      logMsg += `<span class="text-dmg">😨 Устрашение: ваши атака и блок снижены на 1! (осталось ${bot.waterBlastTurnsLeft} хода)</span><br>`;
    }
    // Хранитель: Угнетение — базовая атака = 1, бонусы от умений/предметов сохраняются
    if (bot.suppressActive) {
      pAttack = 1;
      logMsg += `<span class="text-dmg">😵 Угнетение: ваша атака = 1! (осталось ${bot.suppressTurnsLeft} хода)</span><br>`;
    }
  } else {
    if (botChoice === 'immortal') { bAttack = rollDice(); bBlock = 3; bBonus += 1; }
    else { bAttack = rollDice(); bBlock = rollDice(); }
  }

  if (playerChoice === 'skill') {
    player.skillReady = false; playerChoice = 'attack'; pUsedActiveSkill = true;
    logMsg += `<span class="text-skill">🌟 ${getPlayerName()} применяет умение "${CLASSES[player.classId].activeName}"!</span><br>`;
    if (player.classId === 'warrior') pIgnore = true; if (player.classId === 'assassin') pDouble = true;
    if (player.classId === 'guardian') pInvul = true; if (player.classId === 'priest') player.hotTurnsLeft = 2;
    if (player.classId === 'darkknight') player.furyTurnsLeft = 3;
  }
  if (!bot.isMob && botChoice === 'skill') {
    bot.skillReady = false; botChoice = 'attack'; bUsedActiveSkill = true;
    logMsg += `<span class="text-skill">🌟 ${currentBotName} применяет умение "${CLASSES[bot.classId].activeName}"!</span><br>`;
    if (bot.classId === 'warrior') bIgnore = true; if (bot.classId === 'assassin') bDouble = true;
    if (bot.classId === 'guardian') bInvul = true; if (bot.classId === 'priest') bot.hotTurnsLeft = 2;
    if (bot.classId === 'darkknight') bot.furyTurnsLeft = 3;
  }

  // Обновляем счётчики блоков подряд
  if (playerChoice === 'defend') {
    player.blockStreak++;
  } else if (playerChoice !== 'skip') {
    // атака, навык, бессмертие — сбрасываем счётчик
    player.blockStreak = 0;
  }
  if (!bot.isMob) {
    if (botChoice === 'defend') {
      bot.blockStreak++;
    } else {
      bot.blockStreak = 0;
    }
  }

  if (!bot.isMob) {
    pBlock += player.eqP.blockB; bBlock += bot.eqP.blockB;
    bBlock = Math.max(0, bBlock - player.eqP.ignore); pBlock = Math.max(0, pBlock - bot.eqP.ignore);
  } else {
    pBlock += player.eqP.blockB;
    pBlock = Math.max(0, pBlock - (bot.eqP ? bot.eqP.ignore : 0));
  }

  if (!bot.isMob) {
    if (player.classId === 'warrior' && player.hp <= 6) pBonus += 2;
    if (bot.classId === 'warrior' && bot.hp <= 6) bBonus += 2;
    if (player.classId === 'guardian' && player.retBonus > 0 && playerChoice === 'attack' && !pInvul) { pBonus += player.retBonus; player.retBonus = 0; player.retBlocks = 0; }
    if (bot.classId === 'guardian' && bot.retBonus > 0 && botChoice === 'attack' && !bInvul) { bBonus += bot.retBonus; bot.retBonus = 0; bot.retBlocks = 0; }
    if (player.furyTurnsLeft > 0 && (playerChoice === 'attack' || playerChoice === 'immortal')) { pBonus += 1; logMsg += `<i class="text-info">🦇 Тёмная ярость: Урон +1</i><br>`; }
    if (bot.furyTurnsLeft > 0 && (botChoice === 'attack' || botChoice === 'immortal')) { bBonus += 1; logMsg += `<i class="text-info">🦇 Тёмная ярость ${currentBotName}: Урон +1</i><br>`; }
    if (playerChoice === 'attack' && player.eqP.strikes > 0) { pBonus += player.eqP.dmgB; player.eqP.strikes--; logMsg += `<i class="text-info">🧤 Перчатки: Урон +${player.eqP.dmgB}</i><br>`; }
    if (botChoice === 'attack' && bot.eqP.strikes > 0) { bBonus += bot.eqP.dmgB; bot.eqP.strikes--; logMsg += `<i class="text-info">🧤 ${currentBotName} использует перчатки!</i><br>`; }
  } else {
    // В данже перки игрока всё ещё работают
    if (player.classId === 'warrior' && player.hp <= 6) pBonus += 2;
    if (player.classId === 'guardian' && player.retBonus > 0 && playerChoice === 'attack' && !pInvul) { pBonus += player.retBonus; player.retBonus = 0; player.retBlocks = 0; }
    if (player.furyTurnsLeft > 0 && (playerChoice === 'attack' || playerChoice === 'immortal')) { pBonus += 1; logMsg += `<i class="text-info">🦇 Тёмная ярость: Урон +1</i><br>`; }
    if (playerChoice === 'attack' && player.eqP.strikes > 0) { pBonus += player.eqP.dmgB; player.eqP.strikes--; logMsg += `<i class="text-info">🧤 Перчатки: Урон +${player.eqP.dmgB}</i><br>`; }
  }

  pAttack += pBonus; bAttack += bBonus;
  if (pDouble) pAttack *= 2; if (bDouble) bAttack *= 2;

  let pAttacking = (playerChoice === 'attack' || playerChoice === 'immortal');
  let bAttacking = (bot.isMob) ? true : (botChoice === 'attack' || botChoice === 'immortal');
  let pDefending = (playerChoice === 'defend' || playerChoice === 'immortal');
  let bDefending = bot.isMob ? false : (botChoice === 'defend' || botChoice === 'immortal');

  if (bot.isMob) {
    // Моб всегда атакует, игрок может атаковать или защищаться
    if (pAttacking && bAttacking) {
      if (playerChoice === 'immortal') {
        logMsg += `<span class="text-skill">⚔️ Встречная атака! ${getPlayerName()} бессмертен!</span><br>`;
        logMsg += resolveCombat(bot, player, bAttack, pBlock, currentBotName, getPlayerName(), false, false);
        if (pAttack > 0) {
          let bDmgTaken = pAttack;
          if (bDmgTaken > 0) { logMsg += applyDmgToMob(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill); lastPlayerDmgThisTurn += Math.max(0, bot.hissActive ? bDmgTaken - 1 : bDmgTaken); }
        }
      } else {
        logMsg += `<span class="text-skill">⚔️ Встречная атака!</span><br>`;
        logMsg += `🗡️ ${getPlayerName()} наносит ${getHitAdj(pAttack)} удар (${pAttack})<br>`;
        logMsg += `🗡️ ${currentBotName} наносит ${getHitAdj(bAttack)} удар (${bAttack})<br>`;
        // Игрок атакует моба — моб блокирует своим bBlock
        let bDmgTaken = Math.max(0, pAttack - bBlock);
        if (bBlock > 0) logMsg += `<span class="text-block">🛡️ ${currentBotName} блокирует ${bBlock} урона!</span><br>`;
        if (bDmgTaken > 0) { logMsg += applyDmgToMob(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill); lastPlayerDmgThisTurn += Math.max(0, bot.hissActive ? bDmgTaken - 1 : bDmgTaken); }
        // Моб атакует игрока
        let pDmgTaken = bAttack;
        if (Math.random() < player.eqP.dodge) { pDmgTaken = 0; logMsg += `<span class="text-info">👢 Сапоги: ${getPlayerName()} уклонился!</span><br>`; }
        if (player.classId === 'assassin' && player.hp <= 4 && !player.usedInstinct) { pDmgTaken = 0; player.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${getPlayerName()} уклонился!</span><br>`; }
        if (pInvul) pDmgTaken = 0;
        if (pDmgTaken > 0) { logMsg += applyDamage(player, bot, pDmgTaken, getPlayerName(), bUsedActiveSkill); lastMobDmgThisTurn += pDmgTaken; }
      }
    } else if (!pAttacking) {
      // Игрок защищается — моб всё равно атакует
      let hpBefore = player.hp;
      logMsg += resolveCombat(bot, player, bAttack, pBlock, currentBotName, getPlayerName(), false, false);
      lastMobDmgThisTurn += Math.max(0, hpBefore - player.hp);
    }
  } else {
    // Стандартная логика арены
    if (pAttacking && bAttacking) {
      if (playerChoice === 'immortal' && botChoice === 'immortal') {
        logMsg += `<span class="text-skill">⚔️ Битва бессмертных!</span><br>`;
        logMsg += resolveCombat(player, bot, pAttack, bBlock, getPlayerName(), currentBotName, pIgnore, pUsedActiveSkill);
        logMsg += resolveCombat(bot, player, bAttack, pBlock, currentBotName, getPlayerName(), bIgnore, bUsedActiveSkill);
      } else if (playerChoice === 'immortal' && botChoice === 'attack') {
        logMsg += `<span class="text-skill">⚔️ Встречная атака! ${getPlayerName()} бессмертен!</span><br>`;
        logMsg += resolveCombat(bot, player, bAttack, pBlock, currentBotName, getPlayerName(), bIgnore, bUsedActiveSkill);
        if (pAttack > 0) {
          let bDmgTaken = pAttack;
          if (bot.classId === 'assassin' && bot.hp <= 4 && !bot.usedInstinct) { bDmgTaken = 0; bot.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${currentBotName} уклонился!</span><br>`; }
          else if (Math.random() < bot.eqP.dodge) { bDmgTaken = 0; logMsg += `<span class="text-info">👢 ${currentBotName} уклонился!</span><br>`; }
          if (bInvul) bDmgTaken = 0;
          if (bDmgTaken > 0) logMsg += applyDamage(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill);
        }
      } else if (playerChoice === 'attack' && botChoice === 'immortal') {
        logMsg += `<span class="text-skill">⚔️ Встречная атака! ${currentBotName} бессмертен!</span><br>`;
        logMsg += resolveCombat(player, bot, pAttack, bBlock, getPlayerName(), currentBotName, pIgnore, pUsedActiveSkill);
        if (bAttack > 0) {
          let pDmgTaken = bAttack;
          if (player.classId === 'assassin' && player.hp <= 4 && !player.usedInstinct) { pDmgTaken = 0; player.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${getPlayerName()} уклонился!</span><br>`; }
          else if (Math.random() < player.eqP.dodge) { pDmgTaken = 0; logMsg += `<span class="text-info">👢 Сапоги: ${getPlayerName()} уклонился!</span><br>`; }
          if (pInvul) pDmgTaken = 0;
          if (pDmgTaken > 0) logMsg += applyDamage(player, bot, pDmgTaken, getPlayerName(), bUsedActiveSkill);
        }
      } else {
        let pDmgTaken = bAttack; let bDmgTaken = pAttack;
        if (player.classId === 'assassin' && player.hp <= 4 && !player.usedInstinct) { pDmgTaken = 0; player.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${getPlayerName()} уклонился!</span><br>`; }
        else if (Math.random() < player.eqP.dodge) { pDmgTaken = 0; logMsg += `<span class="text-info">👢 Сапоги: ${getPlayerName()} уклонился!</span><br>`; }
        if (bot.classId === 'assassin' && bot.hp <= 4 && !bot.usedInstinct) { bDmgTaken = 0; bot.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: ${currentBotName} уклонился!</span><br>`; }
        else if (Math.random() < bot.eqP.dodge) { bDmgTaken = 0; logMsg += `<span class="text-info">👢 ${currentBotName} уклонился!</span><br>`; }
        if (pInvul) pDmgTaken = 0; if (bInvul) bDmgTaken = 0;
        logMsg += `<span class="text-skill">⚔️ Встречная атака!</span><br>`;
        logMsg += `🗡️ ${getPlayerName()} наносит ${getHitAdj(pAttack)} удар (${pAttack})<br>`;
        logMsg += `🗡️ ${currentBotName} наносит ${getHitAdj(bAttack)} удар (${bAttack})<br>`;
        if (bDmgTaken > 0) logMsg += applyDamage(bot, player, bDmgTaken, currentBotName, pUsedActiveSkill);
        if (pDmgTaken > 0) logMsg += applyDamage(player, bot, pDmgTaken, getPlayerName(), bUsedActiveSkill);
      }
    } else if (!pAttacking && !bAttacking) {
      logMsg += `<span class="text-block">🛡️ Никто не атаковал.</span><br>`;
    } else if (pAttacking && !bAttacking) {
      let bDefVal = bDefending ? bBlock : 0;
      logMsg += resolveCombat(player, bot, pAttack, (pIgnore ? 0 : bDefVal), getPlayerName(), currentBotName, pIgnore, pUsedActiveSkill);
    } else if (!pAttacking && bAttacking) {
      let pDefVal = pDefending ? pBlock : 0;
      logMsg += resolveCombat(bot, player, bAttack, (bIgnore ? 0 : pDefVal), currentBotName, getPlayerName(), bIgnore, bUsedActiveSkill);
    }
  }

  // checkMobSubmitTrigger вызывается ПОСЛЕ фазы эффектов — см. ниже

  // Тикаем fury/immortal бота (не игрока — игрок тикается после updateScreen)
  if (!bot.isMob) {
    if (player.furyTurnsLeft > 0) player.furyTurnsLeft--;
    if (bot.furyTurnsLeft > 0) bot.furyTurnsLeft--;
    if (bot.immortalTurns > 0) bot.immortalTurns--;
  } else {
    if (player.furyTurnsLeft > 0) player.furyTurnsLeft--;
  }

  // ЭФФЕКТЫ (яд, HoT, пассивки)
  let effectsMsg = "";

  // БАГ-ФИКС 2: canHeal обновляем здесь (до эффектов), а не в середине хода
  if (bot.isMob) {
    player.canHeal = !bot.diseaseActive;
  }

  if (player.poisoned) {
    player.hp -= 1;
    effectsMsg += `<span class="text-dmg">☠️ Яд: 1 урон ${getPlayerName()}!</span><br>`;
    // БАГ-ФИКС: Тёмный Рыцарь не должен умирать от яда при активном бессмертии
    if (player.hp <= 0 && player.classId === 'darkknight' && player.immortalTurnActive) {
      player.hp = 1;
      effectsMsg += `<span class="text-skill">🛡️ Смерть отступает!</span><br>`;
    } else { effectsMsg += checkImmortality(player, getPlayerName()); }
  }
  if (bot.isMob && bot.poisoned) { bot.hp -= 1; lastPlayerDmgThisTurn += 1; effectsMsg += `<span class="text-heal">☠️ Яд: 1 урон ${currentBotName}!</span><br>`; }
  if (!bot.isMob && bot.poisoned) {
    bot.hp -= 1;
    effectsMsg += `<span class="text-heal">☠️ Яд: 1 урон ${currentBotName}!</span><br>`;
    // БАГ-ФИКС: аналогично для бота-Тёмного Рыцаря
    if (bot.hp <= 0 && bot.classId === 'darkknight' && bot.immortalTurnActive) {
      bot.hp = 1;
      effectsMsg += `<span class="text-skill">🛡️ Смерть отступает!</span><br>`;
    } else { effectsMsg += checkImmortality(bot, currentBotName); }
  }

  if (!bot.isMob) {
    effectsMsg += processHoT(player, bot, getPlayerName(), currentBotName);
    effectsMsg += processHoT(bot, player, currentBotName, getPlayerName());
  } else {
    effectsMsg += processHoT(player, bot, getPlayerName(), currentBotName);
    effectsMsg += tickMobEffects(bot, lastPlayerDmgThisTurn);
    // После тика пересчитываем canHeal (болезнь могла закончиться)
    player.canHeal = !bot.diseaseActive;
  }

  if (player.canHeal && player.hp < player.maxHp && player.eqP.healOnce > 0) {
    let deficit = player.maxHp - player.hp; let healAmt = Math.min(deficit, player.eqP.healOnce);
    player.hp += healAmt; player.eqP.healOnce -= healAmt;
    effectsMsg += `<span class="text-heal">🪖 Шлем лечит ${getPlayerName()} +${healAmt} ХП</span><br>`;
  }
  if (!bot.isMob && bot.canHeal && bot.hp < bot.maxHp && bot.eqP.healOnce > 0) {
    let deficit = bot.maxHp - bot.hp; let healAmt = Math.min(deficit, bot.eqP.healOnce);
    bot.hp += healAmt; bot.eqP.healOnce -= healAmt;
    effectsMsg += `<span class="text-heal">🪖 Шлем лечит ${currentBotName} +${healAmt} ХП</span><br>`;
  }
  if (player.canHeal && player.classId === 'warrior' && player.hp > 0 && player.hp <= 6) { player.hp += 1; effectsMsg += `<span class="text-heal">🩸 Боевой раж: ${getPlayerName()} +1 ХП</span><br>`; }
  if (!bot.isMob && bot.canHeal && bot.classId === 'warrior' && bot.hp > 0 && bot.hp <= 6) { bot.hp += 1; effectsMsg += `<span class="text-heal">🩸 Боевой раж: ${currentBotName} +1 ХП</span><br>`; }

  // immortalTurnActive сбрасываем ПОСЛЕ эффектов (фикс смерти от яда)
  player.immortalTurnActive = false;
  if (!bot.isMob) bot.immortalTurnActive = false;

  if (effectsMsg !== "") {
    logMsg += `<div class="text-skill" style="margin-top: 10px; margin-bottom: 5px;">🧿 Эффекты:</div>` + effectsMsg;
  }

  // Submit проверяем ПОСЛЕ всей фазы эффектов — теперь учитывает урон от HoT и яда
  if (bot.isMob) {
    logMsg += checkMobSubmitTrigger(bot, lastPlayerDmgThisTurn, lastMobDmgThisTurn);
  }

  // БАГ-ФИКС checkSkills: боты тоже должны накапливать и использовать навыки
  if (!bot.isMob) {
    checkSkills(player, bot, getPlayerName());
    checkSkills(bot, player, currentBotName);
  } else {
    checkSkillsPlayerOnly(player, getPlayerName());
  }

  // БАГ-ФИКС бессмертия: immortalTurns игрока уменьшаем ПОСЛЕ updateScreen
  // иначе кнопка «Возмездие» пропадает на ход раньше
  logToScreen(logMsg); updateScreen();
  if (player.immortalTurns > 0) player.immortalTurns--;
  checkWinner();

  if (!gameIsOver) {
    document.getElementById("turn-timer-container").style.display = "none";
    setTimeout(() => { startTurnTimer(); }, 1500);
  } else { document.getElementById("turn-timer-container").style.display = "none"; }
}
