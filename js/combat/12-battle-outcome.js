// ============================================================
// BATTLE OUTCOME
// Победа/поражение, ежедневный подарок, осмотр персонажа, вкладка Арены.
// ============================================================

function checkWinner() {
  if (player.hp <= 0 || bot.hp <= 0) {
    gameIsOver = true;
    document.getElementById("btn-attack").style.display = "none"; document.getElementById("btn-defend").style.display = "none";
    document.getElementById("btn-skill").style.display = "none"; document.getElementById("btn-immortal").style.display = "none";

    if (dungeonState) {
      // === ДАНЖ РЕЖИМ ===
      if (player.hp <= 0) {
        // Игрок погиб — данж провален
        let failedDungeonName = DUNGEONS[dungeonState.dungeonId].name;
        dungeonState = null;
        document.getElementById("btn-return").style.display = "block";
        logToScreen(`<span class='text-dmg'>💀 Вы пали в ${failedDungeonName}. Прогресс потерян.</span>`);
        saveData();
      } else {
        // Победа над врагом

        // Проверяем: это был порабощённый?
        if (dungeonState.slave && bot === dungeonState.slave) {
          // Раб убит — возвращаем хранителя, начисляем ему хил
          let survived = dungeonState.slaveKeeper.summonSurvived;
          dungeonState.slaveKeeper.hp = Math.min(dungeonState.slaveKeeper.maxHp, dungeonState.slaveKeeper.hp + survived);
          dungeonState.slaveKeeper.summonActive = false;
          dungeonState.slave = null;
          let healMsg = survived > 0 ? ` (+${survived} ХП Хранителю за ${survived} ходов)` : '';
          let endMsg = `<span class='text-heal'>✅ ${bot.icon} Порабощённый повержен!${healMsg}</span><br>`;

          // Проверяем: не умер ли Хранитель пока шёл бой с рабом (яд/HoT)
          if (dungeonState.slaveKeeper.hp <= 0) {
            let failedDungeonName = DUNGEONS[dungeonState.dungeonId].name;
            dungeonState = null;
            document.getElementById("btn-return").style.display = "block";
            logToScreen(endMsg + `<span class='text-dmg'>💀 Хранитель пал от эффектов. Прогресс потерян.</span>`);
            saveData();
            return;
          }

          endMsg += `<span class="text-dmg">🧝🏻‍♂️ Хранитель храма возвращается в бой!</span>`;
          logToScreen(endMsg);
          saveData();
          bot = dungeonState.slaveKeeper;
          currentBotName = bot.name;
          document.getElementById("bot-card").className = "character border-mob-" + bot.tier;
          setTimeout(() => { gameIsOver = false; turnCount++; startTurnTimer(); updateScreen(); }, 2000);
          return;
        }

        let endMsg = `<span class='text-heal'>✅ ${bot.icon} ${bot.name} повержен!</span>`;

        // Лут с моба (не с босса)
        if (bot.tier !== 'boss' && bot.lootDrops) {
          let lootMsg = rollMobLoot(bot.lootDrops);
          endMsg += lootMsg;
        }

        dungeonState.enemyIndex++;
        dungeonState.playerHp = player.hp; // сохраняем HP

        if (dungeonState.enemyIndex < dungeonState.enemyQueue.length) {
          // Следующий враг на том же этаже
          endMsg += `<br><span class="text-info">Следующий враг на этаже...</span>`;
          logToScreen(endMsg);
          saveData();
          setTimeout(() => { startDungeonFight(); }, 2000);
        } else {
          // Этаж пройден
          let floorNum = dungeonState.floorIndex + 1;
          let totalFloors = DUNGEONS[dungeonState.dungeonId].floors.length;
          dungeonState.floorIndex++;

          if (dungeonState.floorIndex >= totalFloors) {
            // Данж полностью пройден — босс побеждён
            endMsg += grantBossReward(dungeonState.dungeonId);
            gameData.dungeonProgress[dungeonState.dungeonId] = totalFloors;
            dungeonState = null;
            saveData();
            document.getElementById("btn-return").style.display = "block";
            logToScreen(endMsg);
          } else {
            // Показываем экран передышки
            gameData.dungeonProgress[dungeonState.dungeonId] = floorNum;
            saveData();
            logToScreen(endMsg);
            document.getElementById("btn-return").style.display = "block";
            // Показываем кнопку "Следующий этаж"
            showFloorBreak(floorNum, totalFloors);
          }
        }
      }
    } else {
      // === АРЕНА РЕЖИМ ===
      simulateBots();
      document.getElementById("btn-return").style.display = "block";
      let endMsg = "";
      if (player.hp <= 0 && bot.hp <= 0) {
        endMsg = "<span class='text-skill'>💀 НИЧЬЯ! (LP не изменились)</span>";
      } else if (player.hp <= 0) {
        let lpLoss = calculateLpChange(gameData.lp, false); gameData.lp = Math.max(0, gameData.lp - lpLoss);
        endMsg = `<span class='text-dmg'>💀 ВЫ ПРОИГРАЛИ!</span> <span class="lp-loss">(-${lpLoss} LP)</span>`;
      } else {
        let lpGain = calculateLpChange(gameData.lp, true); gameData.lp += lpGain;
        if (!gameData.dailyGiftClaimed) {
          gameData.dailyWins = Math.min(5, (gameData.dailyWins || 0) + 1);
        }
        endMsg = `<span class='text-heal'>🏆 ПОБЕДА!</span> <span class="lp-gain">(+${lpGain} LP)</span><br>`;
        // Эффект победы
        if (gameData.activeVictoryEffect) {
          setTimeout(() => playVictoryEffect(gameData.activeVictoryEffect), 300);
        }
        let loot = rollLoot(gameData.lp);
        if (loot) {
          if (gameData.inventory.length < gameData.maxInventory) { gameData.inventory.push(loot); endMsg += `<br><br><span class="text-${loot.rarity}">🎁 Выпал предмет: ${loot.name}! Проверьте сумку.</span>`; }
          else { gameData.imperials += SELL_PRICES[loot.rarity]; endMsg += `<br><br><span class="text-info">💰 Сумка полна! Выпавший ${loot.name} продан за ${SELL_PRICES[loot.rarity]} 🪙.</span>`; }
        }
        // Дроп ключей
        let keyMsg = rollArenaKey(gameData.lp);
        if (keyMsg) endMsg += keyMsg;

        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
      }
      saveData(); logToScreen(endMsg);
    }
  }
}

// Лут с обычного/элитного моба
// rollMobLoot, grantBossReward, showFloorBreak, continueToNextFloor, exitDungeon — см. dungeons.js

function claimDailyGift() {
  if (gameData.dailyWins < 5 || gameData.dailyGiftClaimed) return;
  gameData.dailyGiftClaimed = true;

  // Гарантированный Пыльный ключ
  gameData.keys['dusty_key'] = (gameData.keys['dusty_key'] || 0) + 1;
  let bonusMsg = '';

  // 20% — Древесный ключ
  if (Math.random() < 0.20) {
    gameData.keys['wood_key'] = (gameData.keys['wood_key'] || 0) + 1;
    bonusMsg += '\n+1 🗝️ Древесный ключ (бонус!)';
  }
  // 5% — Древний ключ
  if (Math.random() < 0.05) {
    gameData.keys['ancient_key'] = (gameData.keys['ancient_key'] || 0) + 1;
    bonusMsg += '\n+1 🗝️ Древний ключ (редкий бонус!)';
  }

  saveData(); renderMainMenu();
  alert('🎁 Подарок получен!\n+1 🗝️ Пыльный ключ' + bonusMsg);
}

// ============================================================
// ОСМОТР ПЕРСОНАЖА
// ============================================================

function openCharModal(isPlayer) {
  if (!player.classId && !bot.isMob) return;
  let c = isPlayer ? player : bot;
  document.getElementById('modal-title').innerText = isPlayer ? "Осмотр: Вы" : `Осмотр: ${bot.isMob ? bot.name : "Враг"}`;
  document.getElementById('modal-title').className = "text-skill";
  let desc = `<b>Класс:</b> ${c.className}<br><b>ХП:</b> ${c.hp} / ${c.maxHp}<br>`;

  if (bot.isMob && !isPlayer) {
    desc += `<br><b>Тип:</b> ${c.tier === 'boss' ? '👑 Босс' : c.tier === 'elite' ? '⭐ Элитный' : '👻 Обычный'}<br>`;
    desc += `<b>Атака:</b> ${c.attackMin}-${c.attackMax} | <b>Блок:</b> ${c.blockMin}-${c.blockMax}<br>`;
    if (c.abilities.length > 0) {
      desc += `<hr style="border-color:#475569; margin:10px 0;"><b>Умения:</b><br>`;
      c.abilities.forEach(a => {
        if (a === 'disease') desc += `🦠 <b>Болезнь</b> — блокирует лечение на 3 хода<br>`;
        if (a === 'fate') desc += `😶 <b>Прими судьбу</b> — отключает блок игрока на 3 хода<br>`;
        if (a === 'submit') desc += `😡 <b>Подчинись мне</b> — x2 урон на 2 хода<br>`;
        if (a === 'notover') desc += `💜 <b>Это ещё не конец</b> — мгновенное восстановление и регенерация<br>`;
        if (a === 'bite') desc += `🦖 <b>Укус</b> — каждые -10 ХП: следующая атака +3 урона<br>`;
        if (a === 'hiss') desc += `🐉 <b>Как ты с-с-смеешь...</b> — при 4+ урона за ход: снижает получаемый урон на 1 на 2 хода<br>`;
        if (a === 'rage_hot') desc += `🐉 <b>Не стоило меня злить</b> — при потере 18 ХП: регенерация +1 ХП каждый ход<br>`;
        if (a === 'water_blast') desc += `🌊 <b>Узри мощь воды</b> — на 20 ходу: 5 урона игнорируя броню + Устрашение (-1 атака и блок на 3 хода)<br>`;
        if (a === 'stone_skin') desc += `🗿 <b>Каменная кожа</b> — при ≤20 ХП: отражает 1 урон; при ≤8 ХП: отражает 2 урона<br>`;
        if (a === 'doom') desc += `💀 <b>Здесь твоя погибель</b> — если 3 хода без урона: блок игрока = 0 на 2 хода<br>`;
        if (a === 'summon_slave') desc += `👳🏻‍♂️ <b>Пробуждайся мой верный раб</b> — при потере 18 ХП: призывает Порабощённого; восстанавливает ХП за каждый его прожитый ход<br>`;
        if (a === 'suppress') desc += `😵 <b>Подчинись моей воле</b> — при 4+ урона за ход: атака игрока = 1 на 2 хода (Угнетение)<br>`;
     });
    }
  } else if (!bot.isMob || isPlayer) {
    desc += `<hr style="border-color:#475569; margin:10px 0;"><b>Экипировка:</b><br><br>`;
    let hasItems = false;
    ['head', 'body', 'arms', 'legs'].forEach(s => {
      let item = c.eq[s];
      if (item) {
        hasItems = true; desc += `<b class="text-${item.rarity}">${item.name}</b> (+${item.hp} ХП)<br>`;
        if (item.perk) desc += `<span style="font-size:10px; color:#9ca3af">🔸 ${item.perk.desc}</span><br>`;
        if (item.unique) desc += `<span style="font-size:10px; color:#fbbf24">🔸 ${item.unique.desc}</span><br>`;
        if (item.legendary) desc += `<span style="font-size:10px; color:#f59e0b; font-weight:bold;">🔸 ${item.legendary.desc}</span><br>`;
        if (item.classId) desc += `<span style="font-size:10px; color:#64748b;">Только для: ${CLASSES[item.classId]?.name || item.classId}</span><br>`;
        desc += `<br>`;
      }
    });
    if (!hasItems) desc += `<span style="color:#9ca3af">Нет предметов</span>`;
  }

  document.getElementById('modal-desc').innerHTML = desc;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}

// ============================================================
// АРЕНЫ (таб)
// ============================================================

function renderArenas() {
  let html = '<div style="margin-bottom:15px;"><h2>Список Арен</h2><span style="font-size:12px; color:#94a3b8;">Нажмите на арену, чтобы увидеть награды</span></div><div class="class-grid">';
  let prevLp = 0;
  ARENAS.forEach((a, idx) => {
    html += `<div class="class-card ${a.arenaClass}" style="border-width: 2px;" onclick="openArenaModal(${idx})"><div class="class-title" style="color: #fff; text-shadow: 0 0 5px rgba(0,0,0,0.8);">${a.icon} ${a.name}</div><div class="class-desc" style="color: #fbbf24; font-weight: bold; text-align: center; font-size: 13px;">${prevLp} - ${a.maxLp === 99999 ? '∞' : a.maxLp} LP</div></div>`;
    prevLp = a.maxLp + 1;
  });
  html += '</div>'; document.getElementById('tab-arenas').innerHTML = html;
}

function openArenaModal(idx) {
  let a = ARENAS[idx]; let prevLp = idx === 0 ? 0 : ARENAS[idx - 1].maxLp + 1; let drops = getArenaDrops(a.maxLp === 99999 ? 3500 : a.maxLp);
  document.getElementById('modal-title').innerText = `${a.icon} ${a.name}`; document.getElementById('modal-title').className = "text-skill";
  let desc = `<div style="text-align:center; margin-bottom: 10px; font-weight:bold;">${prevLp} - ${a.maxLp === 99999 ? '∞' : a.maxLp} LP</div><hr style="border-color:#475569; margin:10px 0;"><b>Шансы за победу:</b><br><br>`;
  if (drops.common > 0) desc += `<span class="text-common">Обычный:</span> ${(drops.common * 100).toFixed(1)}%<br>`;
  if (drops.uncommon > 0) desc += `<span class="text-uncommon">Необычный:</span> ${(drops.uncommon * 100).toFixed(1)}%<br>`;
  if (drops.rare > 0) desc += `<span class="text-rare">Редкий:</span> ${(drops.rare * 100).toFixed(1)}%<br>`;
  if (drops.epic > 0) desc += `<span class="text-epic">Эпический:</span> ${(drops.epic * 100).toFixed(1)}%<br>`;
  let emptyChance = 1 - (drops.common + drops.uncommon + drops.rare + drops.epic);
  if (emptyChance > 0.001) desc += `<br><span style="color:#64748b">Ничего не выпадет: ${(emptyChance * 100).toFixed(1)}%</span><br>`;

  // Добавляем инфу о ключах
  let keyInfo = "";
  Object.values(DUNGEONS).forEach(dungeon => {
    dungeon.keyArenaDrops.forEach(dropEntry => {
      if (a.maxLp >= dropEntry.minLp && (idx === ARENAS.length - 1 || a.maxLp <= dropEntry.maxLp || dropEntry.minLp <= a.maxLp)) {
        // Показываем если хотя бы часть диапазона арены попадает в диапазон дропа ключа
        if (dropEntry.minLp <= a.maxLp && (idx === 0 || dropEntry.maxLp >= (idx > 0 ? ARENAS[idx-1].maxLp + 1 : 0))) {
          keyInfo += `<br>🗝️ <b>${dungeon.keyName}:</b> ${(dropEntry.chance * 100).toFixed(0)}% шанс<br>`;
        }
      }
    });
  });
  if (keyInfo) desc += `<br><b>Ключи подземелий:</b>${keyInfo}`;

  document.getElementById('modal-desc').innerHTML = desc;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}
