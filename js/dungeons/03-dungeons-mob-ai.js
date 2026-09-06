// ============================================================
// DUNGEONS MOB AI
// Броски действий мобов и триггеры/тики их способностей.
// ============================================================

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
