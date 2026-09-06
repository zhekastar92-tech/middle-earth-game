// ============================================================
// ITEM GENERATION
// Генерация случайных предметов, перков, уников, названий; легендарная броня Стража.
// ============================================================

function rollLoot(lp) {
  let drops = getArenaDrops(lp); let roll = Math.random();
  if (roll < drops.epic) return generateItem('epic');
  if (roll < drops.epic + drops.rare) return generateItem('rare');
  if (roll < drops.epic + drops.rare + drops.uncommon) return generateItem('uncommon');
  if (roll < drops.epic + drops.rare + drops.uncommon + drops.common) return generateItem('common');
  return null;
}

// Дроп ключей на аренах (вызывается при победе)
function rollArenaKey(lp) {
  let msg = "";
  Object.values(DUNGEONS).forEach(dungeon => {
    let dropEntry = dungeon.keyArenaDrops.find(d => lp >= d.minLp && lp <= d.maxLp);
    if (dropEntry && Math.random() < dropEntry.chance) {
      gameData.keys[dungeon.keyId] = (gameData.keys[dungeon.keyId] || 0) + 1;
      msg += `<br><span class="text-skill">🗝️ Выпал ${dungeon.keyName}! Проверьте вкладку Подземелий.</span>`;
    }
  });
  return msg;
}

function rollBotItemForSlot(lp, slot) {
  if (lp >= 8000) return generateItem('epic', slot, Math.random() < 0.35);
  if (lp >= 7000) return generateItem('epic', slot, Math.random() < 0.20);
  if (lp >= 6000) return generateItem('epic', slot, Math.random() < 0.15);
  let arenaIdx = ARENAS.findIndex(a => lp <= a.maxLp);
  if (arenaIdx === -1) arenaIdx = ARENAS.length - 1;
  let rarity = null;
  if (arenaIdx <= 2) {
    let drops = getArenaDrops(lp); let r = Math.random();
    if (r < drops.epic * 3) rarity = 'epic';
    else if (r < (drops.epic + drops.rare) * 3) rarity = 'rare';
    else if (r < (drops.epic + drops.rare + drops.uncommon) * 3) rarity = 'uncommon';
    else if (r < (drops.epic + drops.rare + drops.uncommon + drops.common) * 3) rarity = 'common';
  } else if (arenaIdx === 3) { rarity = Math.random() < 0.5 ? 'epic' : 'rare'; }
  else if (arenaIdx === 4) { rarity = Math.random() < 0.8 ? 'epic' : 'rare'; }
  else { rarity = Math.random() < 0.95 ? 'epic' : 'rare'; }
  if (!rarity) return null;
  return generateItem(rarity, slot);
}

function generateItem(rarity, forceSlot = null, forceUnique = false) {
  const slots = ['head', 'body', 'arms', 'legs'];
  const slot = forceSlot ? forceSlot : slots[Math.floor(Math.random() * slots.length)];
  gameData.nextItemId++;
  let item = { id: gameData.nextItemId, classId: null, rarity: rarity, slot: slot, hp: 0, perk: null, unique: null };
  let isRareType2 = false;
  if (rarity === 'common') {
    item.hp = Math.floor(Math.random() * 2) + 1;
  } else if (rarity === 'uncommon') {
    item.hp = Math.floor(Math.random() * 2) + 1;
    if (Math.random() < 0.1) item.perk = generatePerk(slot, 1, 1, 1);
  } else if (rarity === 'rare') {
    item.hp = Math.floor(Math.random() * 2) + 2;
    if (Math.random() < 0.25) {
      isRareType2 = true;
      item.perk = generatePerk(slot, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 1);
    } else {
      if (Math.random() < 0.1) item.perk = generatePerk(slot, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 1);
    }
  } else if (rarity === 'epic') {
    item.hp = Math.floor(Math.random() * 3) + 3;
    item.perk = generatePerk(slot, Math.floor(Math.random() * 3) + 2, Math.floor(Math.random() * 3) + 2, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 2);
    if (forceUnique || Math.random() < 0.02) item.unique = generateUnique(slot);
  }
  item.name = generateItemName(rarity, slot, !!item.perk, !!item.unique, isRareType2);
  return item;
}

function generatePerk(slot, hVal, bVal, aVal, aCharges = 1) {
  if (slot === 'head') return { type: 'heal_once', val: hVal, desc: `Лечит ${hVal} ХП при падении здоровья.` };
  if (slot === 'body') return { type: 'block_pierce', val: bVal, desc: `Блокирует ${bVal} пробитого урона (1 раз).` };
  if (slot === 'arms') return { type: 'first_strike', val: aVal, charges: aCharges, desc: `Урон +${aVal} на первые ${aCharges} атак.` };
  return null;
}

function generateUnique(slot) {
  if (slot === 'head') return { type: 'healBonus', val: 1, desc: `[УНИК] +1 ХП при избыточном блоке.` };
  if (slot === 'body') return { type: 'blockBonus', val: 1, desc: `[УНИК] +1 ко всем блокам.` };
  if (slot === 'arms') return { type: 'ignoreBlock', val: 1, desc: `[УНИК] Игнорирует 1 ед. блока врага.` };
  if (slot === 'legs') return { type: 'dodge', val: 0.15, desc: `[УНИК] 15% шанс избежать атаки.` };
}

function getPrefix(word, slot) {
  let f = word, p = word;
  if (word.endsWith("ый")) { f = word.slice(0, -2) + "ая"; p = word.slice(0, -2) + "ые"; }
  else if (word.endsWith("ий")) {
    if (word.match(/[гкхжшщч]ий$/)) { f = word.slice(0, -2) + "ая"; p = word.slice(0, -2) + "ие"; }
    else { f = word.slice(0, -2) + "яя"; p = word.slice(0, -2) + "ие"; }
  }
  else if (word.endsWith("ой")) { f = word.slice(0, -2) + "ая"; p = word.slice(0, -2) + "ые"; }
  if (slot === 'body') return f;
  if (slot === 'arms' || slot === 'legs') return p;
  return word;
}

function generateItemName(rarity, slot, hasPerk, hasUnique, isRareType2 = false, dungeonName = null) {
  if (dungeonName) return dungeonName;
  const slotName = SLOT_NAMES[slot];
  let prefixes = []; let suffixes = [];
  if (rarity === 'common') {
    prefixes = ["Грубый", "Старый", "Треснутый"];
  } else if (rarity === 'uncommon') {
    prefixes = ["Крепкий", "Усиленный", "Прочный", "Надёжный"];
  } else if (rarity === 'rare') {
    if (isRareType2) {
      prefixes = ["Рунный", "Сумрачный", "Туманный", "Морозный", "Обжигающий", "Призрачный", "Громовой"];
      suffixes = ["Теней", "Забвения", "Расплаты", "Скитальца", "Разлома", "Сокрушения"];
    } else {
      if (!hasPerk) {
        prefixes = ["Тяжёлый", "Усиленный", "Закалённый", "Мощный"];
      } else {
        prefixes = ["Стальной", "Окованный", "Кристальный", "Нерушимый", "Каменный"];
        suffixes = ["Стража", "Охотника", "Защиты", "Дозора", "Перевала", "Стойкости", "Бастиона"];
      }
    }
  } else if (rarity === 'epic') {
    if (!hasUnique) {
      prefixes = ["Пылающий", "Сияющий", "Древний", "Избранный", "Тайный", "Яростный", "Расколотый"];
      suffixes = ["Пепла", "Хаоса", "Порядка", "Заката", "Рассвета", "Титанов", "Лорда"];
    } else {
      prefixes = ["Небесный", "Звёздный", "Бессмертный", "Абсолютный"];
      suffixes = ["Мироздания", "Вечности", "Губителя", "Погибели"];
    }
  } else if (rarity === 'legendary') {
    prefixes = ["Легендарный", "Мифический", "Забытый"];
  }
  let prefix = prefixes.length > 0 ? getPrefix(prefixes[Math.floor(Math.random() * prefixes.length)], slot) : "";
  let suffix = suffixes.length > 0 ? " " + suffixes[Math.floor(Math.random() * suffixes.length)] : "";
  return `${prefix} ${slotName}${suffix}`.trim();
}

// ============================================================
// ЛЕГЕНДАРНЫЕ ПРЕДМЕТЫ
// ============================================================

const LEGENDARY_ITEMS = {
  guardian_body: {
    id: 'guardian_body',
    classId: 'guardian',
    name: 'Доспех Священного Стража',
    slot: 'body',
    rarity: 'legendary',
    hpMin: 5, hpMax: 6,
    perk: null,   // генерируется при создании: block_pierce 4-5
    unique: null, // [УНИК] +1 блок
    legendary: null // [ЛЕГ] +1-3 к blockStreakMax
  }
};

function generateLegendaryArmor() {
  gameData.nextItemId++;
  let bp = 4 + Math.floor(Math.random() * 2); // 4 или 5
  let legBonus = 1 + Math.floor(Math.random() * 3); // 1, 2 или 3
  let hp = 5 + Math.floor(Math.random() * 2);
  return {
    id: gameData.nextItemId,
    classId: 'guardian',
    name: 'Доспех Священного Стража',
    slot: 'body',
    rarity: 'legendary',
    hp: hp,
    perk:    { type: 'block_pierce', val: bp, desc: `Блокирует ${bp} пробитого урона (1 раз).` },
    unique:  { type: 'blockBonus',   val: 1,  desc: `[УНИК] +1 ко всем блокам.` },
    legendary: { type: 'blockStreakBonus', val: legBonus, desc: `[ЛЕГ] +${legBonus} к макс. блокам подряд.` }
  };
}
