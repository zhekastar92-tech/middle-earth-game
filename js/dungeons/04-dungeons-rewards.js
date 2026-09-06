// ============================================================
// DUNGEONS REWARDS
// Лут с мобов и награда за прохождение данжа.
// ============================================================

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

  // Ключ следующего данжа с боссов 1 и 2
  if (reward.keyDrop) {
    if (Math.random() < reward.keyDrop.chance) {
      gameData.keys[reward.keyDrop.keyId] = (gameData.keys[reward.keyDrop.keyId] || 0) + 1;
      msg += `<span class="text-skill">🗝️ Выпал ${reward.keyDrop.keyName}!</span><br>`;
    }
  }

  // Гарантированные предметы (1 или 2 в зависимости от данжа)
  let itemCount = reward.guaranteedCount || 1;
  for (let i = 0; i < itemCount; i++) {
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
  }

  // Бонусный сундук
  if (Math.random() < reward.bonusChestChance) {
    let isHuge = Math.random() < reward.bonusChestEpicChance;
    let chestType = isHuge ? 4 : 3;
    msg += `<span class="text-skill">🎲 Бонус: ${isHuge ? 'Огромный' : 'Большой'} сундук!</span><br>`;
    let chestRarity = 'common'; let cr = Math.random();
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

  // Бонусные лунные камни (только храм)
  if (reward.bonusLunarChance && Math.random() < reward.bonusLunarChance) {
    let lunarAmt = reward.bonusLunarMin + Math.floor(Math.random() * (reward.bonusLunarMax - reward.bonusLunarMin + 1));
    gameData.lunarStones += lunarAmt;
    msg += `<span class="text-skill">💠 Бонус: +${lunarAmt} Лунных камней!</span><br>`;
  }

  // Эпик с уником
  if (Math.random() < reward.bonusUniqueEpicChance) {
    let uniqueItem = generateItem('epic', null, true);
    msg += `<span class="text-epic" style="font-weight:900">✨ УДАЧА! Выпал уникальный эпик: ${uniqueItem.name}!</span><br>`;
    if (gameData.inventory.length < gameData.maxInventory) { gameData.inventory.push(uniqueItem); }
    else { gameData.imperials += SELL_PRICES['epic']; msg += `<span class="text-info">💰 Продан за ${SELL_PRICES['epic']} 🪙.</span><br>`; }
  }

  // 0.4% Легендарная броня стража (только храм)
  if (reward.legendaryArmorChance && Math.random() < reward.legendaryArmorChance) {
    let legendaryArmor = generateLegendaryArmor();
    msg += `<span style="color:#f59e0b; font-weight:900; text-shadow:0 0 10px rgba(245,158,11,0.8);">👑 ЛЕГЕНДАРНО! Выпал ${legendaryArmor.name}!</span><br>`;
    if (gameData.inventory.length < gameData.maxInventory) { gameData.inventory.push(legendaryArmor); }
    else { gameData.imperials += 50000; msg += `<span class="text-info">💰 Сумка полна! Продан за 50 000 🪙.</span><br>`; }
  }

  if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  return msg;
}
