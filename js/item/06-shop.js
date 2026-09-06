// ============================================================
// SHOP
// Герольд Кожевник (слоты), Дядюшка Ибн (ключи), алхимик (зелья), Азартный Бак (сундуки).
// ============================================================

function getNextSlotCost() {
  let m = gameData.maxInventory;
  if (m >= 18) return null; if (m >= 15) return 50000; if (m >= 12) return 20000; if (m >= 9) return 5000; return 500;
}
function buyBagSlots() {
  let cost = getNextSlotCost(); if (!cost || gameData.imperials < cost) { alert("Недостаточно Империалов!"); return; }
  gameData.imperials -= cost; gameData.maxInventory += 3; saveData(); updateBagTab(); renderShop();
}
// Вспомогательная функция: бросает один сундук и возвращает предмет (без модалки)
function rollChestItem(type) {
  let rarity = 'common'; let forceUnique = false; let r = Math.random();
  if (type === 1) { if (r < 0.85) rarity = 'common'; else if (r < 0.99) rarity = 'uncommon'; else rarity = 'rare'; }
  else if (type === 2) { if (r < 0.60) rarity = 'common'; else if (r < 0.80) rarity = 'uncommon'; else if (r < 0.99) rarity = 'rare'; else rarity = 'epic'; }
  else if (type === 3) { if (r < 0.40) rarity = 'common'; else if (r < 0.70) rarity = 'uncommon'; else if (r < 0.97) rarity = 'rare'; else rarity = 'epic'; }
  else if (type === 4) {
    gameData.hugeChestPity += 1;
    if (gameData.hugeChestPity > 100) { rarity = 'epic'; forceUnique = true; gameData.hugeChestPity = 0; }
    else { if (r < 0.30) rarity = 'common'; else if (r < 0.60) rarity = 'uncommon'; else if (r < 0.95) rarity = 'rare'; else rarity = 'epic'; }
  }
  return generateItem(rarity, null, forceUnique);
}

function buyChest(type) {
  if (gameData.inventory.length >= gameData.maxInventory) { alert("Сумка полна! Продайте лишние вещи."); return; }
  let cost = [0, 100, 300, 500, 1000][type]; if (gameData.imperials < cost) { alert("Недостаточно Империалов!"); return; }
  gameData.imperials -= cost;
  let item = rollChestItem(type); gameData.inventory.push(item);
  saveData(); updateBagTab(); renderShop();
  openChestModal(item, type);
}

function buyChest10(type) {
  let cost = [0, 100, 300, 500, 1000][type];
  let totalCost = cost * 10;
  let freeSlots = gameData.maxInventory - gameData.inventory.length;
  if (freeSlots < 10) { alert(`Нужно минимум 10 свободных слотов в сумке! Сейчас свободно: ${freeSlots}.`); return; }
  if (gameData.imperials < totalCost) { alert(`Недостаточно Империалов! Нужно: ${totalCost} 🪙`); return; }
  gameData.imperials -= totalCost;
  let items = [];
  for (let i = 0; i < 10; i++) {
    let item = rollChestItem(type);
    gameData.inventory.push(item);
    items.push(item);
  }
  saveData(); updateBagTab(); renderShop();
  openChest10Modal(items, type);
}

// Хранилище предметов для модалки x10 (для индивидуальных действий)
let chest10Items = [];

function openChest10Modal(items, chestType) {
  chest10Items = items.slice(); // копия для управления
  _renderChest10Modal(chestType);
}

function _renderChest10Modal(chestType) {
  const rarityGlow = { common: '#94a3b8', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7' };
  const rarityLabel = { common: 'ОБЫ', uncommon: 'НЕО', rare: 'РЕД', epic: 'ЭПИ' };
  const chest = CHEST_DATA[chestType];

  // Статистика только по оставшимся предметам (ещё не проданным)
  let counts = { common: 0, uncommon: 0, rare: 0, epic: 0 };
  chest10Items.forEach(i => { if (i) counts[i.rarity]++; });
  let statsHtml = '';
  if (counts.epic > 0) statsHtml += `<span style="color:#a855f7; font-weight:bold;">✨ ${counts.epic}× Эпик</span> `;
  if (counts.rare > 0) statsHtml += `<span style="color:#3b82f6;">💎 ${counts.rare}× Редкий</span> `;
  if (counts.uncommon > 0) statsHtml += `<span style="color:#22c55e;">🟢 ${counts.uncommon}× Необычный</span> `;
  if (counts.common > 0) statsHtml += `<span style="color:#94a3b8;">⬜ ${counts.common}× Обычный</span>`;
  if (!statsHtml) statsHtml = `<span style="color:#64748b;">Все предметы розданы</span>`;

  let itemsHtml = chest10Items.map((item, idx) => {
    if (!item) return ''; // уже продан
    const c = rarityGlow[item.rarity];
    const price = SELL_PRICES[item.rarity];
    return `<div id="chest10-row-${idx}" style="display:flex; align-items:center; gap:8px; padding:7px 8px; border-radius:8px;
      background:rgba(0,0,0,0.3); border:1px solid ${c}44; margin-bottom:5px;">
      <div style="width:26px; height:26px; border-radius:50%; border:1px solid ${c};
        background:radial-gradient(circle, ${c}33, transparent); display:flex; align-items:center;
        justify-content:center; font-size:9px; font-weight:900; color:${c}; flex-shrink:0;">
        ${rarityLabel[item.rarity]}
      </div>
      <div style="flex:1; text-align:left; min-width:0;">
        <div class="text-${item.rarity}" style="font-size:12px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${item.name}${item.unique ? ' ★' : ''}${item.legendary ? ' 🌟' : ''}
        </div>
        <div style="color:#64748b; font-size:10px;">${SLOT_NAMES[item.slot]} · +${item.hp} ХП</div>
      </div>
      <div style="display:flex; gap:4px; flex-shrink:0;">
        <button class="action-btn" style="background:#ef4444; padding:5px 8px; font-size:11px; flex:0;"
          onclick="chest10SellOne(${idx}, ${chestType})">💰 ${price}</button>
      </div>
    </div>`;
  }).join('');

  // Считаем суммарную цену оставшихся
  let totalSellAll = chest10Items.reduce((sum, i) => i ? sum + SELL_PRICES[i.rarity] : sum, 0);

  document.getElementById('modal-title').innerHTML = `${chest.icon} ${chest.name} ×10`;
  document.getElementById('modal-title').style.cssText = 'color:#fbbf24; font-size:17px;';
  document.getElementById('modal-title').className = '';
  document.getElementById('modal-desc').style.cssText = 'background:transparent; padding:0;';
  document.getElementById('modal-desc').innerHTML = `
    <div style="text-align:center; margin-bottom:8px; font-size:12px; line-height:1.7;">${statsHtml}</div>
    <div style="max-height:300px; overflow-y:auto; padding-right:2px;" id="chest10-list">${itemsHtml}</div>
  `;
  let remaining = chest10Items.filter(i => !!i).length;
  document.getElementById('modal-actions').innerHTML = remaining > 0 ? `
    <button class="action-btn" style="background:#22c55e; flex:1;" onclick="chest10KeepAll()">✓ Забрать всё</button>
    <button class="action-btn" style="background:#ef4444; flex:1;" onclick="chest10SellAll(${chestType})">💰 Продать всё (${totalSellAll} 🪙)</button>
  ` : `<button class="action-btn" style="background:#475569; width:100%;" onclick="closeModal()">Закрыть</button>`;
  selectedItem = null; isEquipped = false;
  document.getElementById('item-modal').style.display = 'flex';
}

function chest10SellOne(idx, chestType) {
  let item = chest10Items[idx];
  if (!item) return;
  gameData.imperials += SELL_PRICES[item.rarity];
  // Убираем из инвентаря
  gameData.inventory = gameData.inventory.filter(i => i.id !== item.id);
  chest10Items[idx] = null;
  saveData(); updateBagTab();
  _renderChest10Modal(chestType);
}

function chest10SellAll(chestType) {
  chest10Items.forEach(item => {
    if (!item) return;
    gameData.imperials += SELL_PRICES[item.rarity];
    gameData.inventory = gameData.inventory.filter(i => i.id !== item.id);
  });
  chest10Items = [];
  saveData(); updateBagTab();
  _renderChest10Modal(chestType);
}

function chest10KeepAll() {
  chest10Items = [];
  closeModal();
  if (document.getElementById('tab-shop').classList.contains('active')) renderShop();
}

const CHEST_DATA = [
  null,
  { name: 'Сундучок',      icon: '📦' },
  { name: 'Сундук',        icon: '🗃️' },
  { name: 'Большой сундук',icon: '🧳' },
  { name: 'Огромный сундук',icon: '💎' }
];

function openChestModal(item, chestType) {
  const rarityGlow = { common: '#94a3b8', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7' };
  const rarityLabel = { common: 'ОБЫЧНЫЙ', uncommon: 'НЕОБЫЧНЫЙ', rare: 'РЕДКИЙ', epic: 'ЭПИЧЕСКИЙ' };
  const color = rarityGlow[item.rarity];
  const chest = CHEST_DATA[chestType];

  document.getElementById('modal-title').innerHTML = `${chest.icon} ${chest.name}`;
  document.getElementById('modal-title').style.cssText = 'color:#fbbf24; font-size:18px;';
  document.getElementById('modal-title').className = '';

  document.getElementById('modal-desc').style.cssText = 'background:transparent; padding:0;';
  document.getElementById('modal-desc').innerHTML = `
    <div style="text-align:center; padding:10px 0;">
      <div style="position:relative; display:inline-block; margin-bottom:12px;">
        <div style="
          width:80px; height:80px; border-radius:50%;
          background: radial-gradient(circle, ${color}33, transparent 70%);
          border: 2px solid ${color};
          box-shadow: 0 0 30px ${color}, 0 0 60px ${color}44;
          display:flex; align-items:center; justify-content:center;
          font-size:40px; margin:0 auto;
          animation: chestPulse 0.8s ease-in-out infinite alternate;
        ">${chest.icon}</div>
      </div>
      <div style="
        display:inline-block; padding:4px 14px; border-radius:20px;
        border: 1px solid ${color}; color:${color};
        background: ${color}22; font-size:11px; font-weight:900;
        letter-spacing:2px; margin-bottom:12px;
      ">${rarityLabel[item.rarity]}</div>
      <div class="text-${item.rarity}" style="font-size:18px; font-weight:900; margin:10px 0 6px;">${item.name}</div>
      <div style="color:#94a3b8; font-size:13px; margin-bottom:6px;">${SLOT_NAMES[item.slot]} · +${item.hp} Макс ХП</div>
      ${item.perk ? `<div style="color:#38bdf8; font-size:12px; margin-top:6px;">🔸 ${item.perk.desc}</div>` : ''}
      ${item.unique ? `<div style="color:#fbbf24; font-size:12px; margin-top:4px; font-weight:bold;">${item.unique.desc}</div>` : ''}
      ${item.legendary ? `<div style="color:#f59e0b; font-size:12px; margin-top:4px; font-weight:bold; text-shadow:0 0 6px rgba(245,158,11,0.5);">${item.legendary.desc}</div>` : ''}
      ${item.classId ? `<div style="color:#64748b; font-size:11px; margin-top:4px;">Только для: ${CLASSES[item.classId]?.name || item.classId}</div>` : ''}
      <div style="color:#64748b; font-size:11px; margin-top:14px;">Цена продажи: ${SELL_PRICES[item.rarity]} 🪙</div>
    </div>
  `;

  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:#22c55e; flex:1;" onclick="closeModal()">В сумку ✓</button>
    <button class="action-btn" style="background:#ef4444; flex:1;" onclick="sellChestItem()">Продать ${SELL_PRICES[item.rarity]} 🪙</button>
  `;
  selectedItem = item; isEquipped = false;
  document.getElementById('item-modal').style.display = 'flex';
}

function sellChestItem() {
  gameData.imperials += SELL_PRICES[selectedItem.rarity];
  gameData.inventory = gameData.inventory.filter(i => i.id !== selectedItem.id);
  saveData(); closeModal(); updateBagTab();
  if (document.getElementById('tab-shop').classList.contains('active')) renderShop();
}

function buyDungeonKey(keyId) {
  let dungeon = Object.values(DUNGEONS).find(d => d.keyId === keyId);
  if (!dungeon) return;
  if (gameData.imperials < dungeon.keyShopPrice) { alert("Недостаточно Империалов!"); return; }
  gameData.imperials -= dungeon.keyShopPrice;
  gameData.keys[keyId] = (gameData.keys[keyId] || 0) + 1;
  saveData(); renderShop();
  alert(`Куплен ${dungeon.keyName}!`);
}

function getPouchSlotCost() {
  let s = gameData.pouch.slots;
  if (s >= 6) return null;
  return 2000 * Math.pow(2, s); // 2000, 4000, 8000, 16000, 32000, 64000
}

function buyPouchSlot() {
  let cost = getPouchSlotCost();
  if (!cost || gameData.imperials < cost) { alert("Недостаточно Империалов!"); return; }
  gameData.imperials -= cost;
  gameData.pouch.slots++;
  saveData(); renderShop();
}

function buyPotion(type) {
  let potion = POTIONS[type];
  if (gameData.imperials < potion.cost) { alert("Недостаточно Империалов!"); return; }
  if (gameData.pouch.items.length >= gameData.pouch.slots) { 
    alert("Подсумок полон! Купите новые слоты у Герольда Кожевника."); return; 
  }
  gameData.imperials -= potion.cost;
  gameData.pouch.items.push({ type: type, name: potion.name, heal: potion.heal });
  saveData(); renderShop();
}

function renderShop() {
  let slotCost = getNextSlotCost();
  let pity = gameData.hugeChestPity || 0;

  let keysHtml = '';
  Object.values(DUNGEONS).forEach(dungeon => {
    if (!dungeon.keyShopPrice) return; // ключ нельзя купить за золото
    let owned = gameData.keys[dungeon.keyId] || 0;
    let canBuy = gameData.imperials >= dungeon.keyShopPrice;
    keysHtml += `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.6); padding:10px; border-radius:8px; margin-bottom:8px;"><div><div style="font-weight:bold; color:#fbbf24;">${dungeon.keyName}</div><div style="font-size:11px; color:#94a3b8;">Имеется: ${owned} шт.</div></div><button class="action-btn" style="background:${canBuy ? '#b45309' : '#475569'}; padding:8px 12px; font-size:12px; flex:0;" ${!canBuy ? 'disabled' : ''} onclick="buyDungeonKey('${dungeon.keyId}')">${dungeon.keyShopPrice} 🪙</button></div>`;
  });

  let pc = getPouchSlotCost();
  let pouchHtml = pc
    ? `<button class="action-btn" style="background:${gameData.imperials >= pc ? '#0e7490' : '#475569'}; padding:10px; width:100%; font-size:12px;" ${gameData.imperials < pc ? 'disabled' : ''} onclick="buyPouchSlot()">🧰 +1 слот подсумка — ${pc} 🪙</button>`
    : `<div style="color:#22c55e; font-size:12px; padding:8px 0;">✅ Подсумок максимален (6 слотов)</div>`;
  let bagHtml = slotCost
    ? `<button class="action-btn" style="background:${gameData.imperials >= slotCost ? '#0f766e' : '#475569'}; padding:10px; width:100%; font-size:12px;" ${gameData.imperials < slotCost ? 'disabled' : ''} onclick="buyBagSlots()">🎒 +3 слота сумки — ${slotCost} 🪙</button>`
    : `<div style="color:#22c55e; font-size:12px; padding:8px 0;">✅ Сумка максимальна (18 слотов)</div>`;

  let html = `
    <div class="class-card" style="border:2px solid #0d9488; text-align:left; background:rgba(5,25,20,0.85); box-shadow:0 0 15px rgba(13,148,136,0.2);">
      <div class="class-title" style="color:#2dd4bf;">🎒 Герольд Кожевник</div>
      <div class="class-desc" style="margin-bottom:12px; color:#94a3b8;">Мастер кожевного дела. Расширяет сумку и подсумок.</div>
      <div style="display:flex; justify-content:space-between; font-size:11px; color:#5eead4; margin-bottom:10px;"><span>🎒 Сумка: ${gameData.maxInventory}/18</span><span>🧰 Подсумок: ${gameData.pouch.slots}/6</span></div>
      <div style="display:flex; flex-direction:column; gap:8px;">${bagHtml}${pouchHtml}</div>
    </div>

    <div class="class-card" style="margin-top:16px; border:2px solid #b45309; text-align:left; background:rgba(30,20,5,0.8);">
      <div class="class-title" style="color:#f59e0b">🧕🏿 Дядюшка Ибн</div>
      <div class="class-desc" style="margin-bottom:10px;">Торгует ключами от подземелий. Знает все тайные входы.</div>
      ${keysHtml}
    </div>

    <div class="class-card" style="margin-top:16px; border:2px solid #7c3aed; text-align:left; background:rgba(20,10,40,0.8);">
      <div class="class-title" style="color:#c084fc">🔮 Лавка алхимика</div>
      <div class="class-desc" style="margin-bottom:10px;">Зелья для подземелий. Подсумок: ${gameData.pouch.items.length}/${gameData.pouch.slots} слотов.</div>
      ${Object.values(POTIONS).map(p => `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.6); padding:10px; border-radius:8px; margin-bottom:8px;"><div><div style="font-weight:bold; color:#e9d5ff;">${p.name}</div><div style="font-size:11px; color:#94a3b8;">+${p.heal} ХП</div></div><button class="action-btn" style="background:${gameData.imperials >= p.cost && gameData.pouch.items.length < gameData.pouch.slots ? '#6d28d9' : '#475569'}; padding:8px 12px; font-size:12px; flex:0;" ${gameData.imperials < p.cost || gameData.pouch.items.length >= gameData.pouch.slots ? 'disabled' : ''} onclick="buyPotion('${p.id}')">${p.cost} 🪙</button></div>`).join('')}
    </div>

    <div class="class-card" style="margin-top:16px; border:2px solid #e11d48; text-align:left; background:rgba(25,5,10,0.95); box-shadow:0 0 25px rgba(225,29,72,0.25);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div class="class-title" style="color:#fb7185; margin:0; font-size:20px;">🎲 Азартный Бак</div>
        <div style="font-size:11px; color:#f43f5e; font-weight:bold; background:rgba(225,29,72,0.15); padding:4px 10px; border-radius:12px; border:1px solid #e11d48;">Гарант: ${pity}/100</div>
      </div>
      <div class="class-desc" style="margin-bottom:14px;">Вскрывает сундуки с экипировкой.</div>
      <div style="display:flex; flex-direction:column; gap:10px;">

        <div style="display:flex; flex-direction:column; gap:6px;">
          <div onclick="buyChest(1)" style="display:flex; align-items:center; gap:12px; background:rgba(30,30,35,0.9); border:1px solid #6b7280; border-radius:12px; padding:12px; cursor:pointer;">
            <div style="font-size:28px; flex-shrink:0;">📦</div>
            <div style="flex:1; text-align:left;">
              <div style="font-weight:bold; color:#9ca3af; font-size:14px; margin-bottom:3px;">Сундучок</div>
              <div style="font-size:10px; color:#64748b;">85% Обычный · 14% Необычный · 1% Редкий</div>
            </div>
            <div style="background:#374151; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:13px; white-space:nowrap; flex-shrink:0;">100 🪙</div>
          </div>
          <div onclick="buyChest10(1)" style="display:flex; align-items:center; justify-content:space-between; background:rgba(30,30,35,0.7); border:1px dashed #6b7280; border-radius:10px; padding:8px 12px; cursor:pointer; opacity:0.85;">
            <div style="font-size:11px; color:#9ca3af;">📦×10 — Открыть сразу 10 Сундучков</div>
            <div style="background:#374151; padding:5px 10px; border-radius:6px; font-weight:bold; font-size:12px; white-space:nowrap;">1 000 🪙</div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <div onclick="buyChest(2)" style="display:flex; align-items:center; gap:12px; background:rgba(5,25,10,0.9); border:1px solid #22c55e; border-radius:12px; padding:12px; cursor:pointer; box-shadow:0 0 8px rgba(34,197,94,0.2);">
            <div style="font-size:28px; flex-shrink:0;">🗃️</div>
            <div style="flex:1; text-align:left;">
              <div style="font-weight:bold; color:#22c55e; font-size:14px; margin-bottom:3px;">Сундук</div>
              <div style="font-size:10px; color:#64748b;">60% Обычный · 20% Необычный · 19% Редкий · <span style="color:#22c55e">1% Эпик</span></div>
            </div>
            <div style="background:#15803d; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:13px; white-space:nowrap; flex-shrink:0;">300 🪙</div>
          </div>
          <div onclick="buyChest10(2)" style="display:flex; align-items:center; justify-content:space-between; background:rgba(5,25,10,0.7); border:1px dashed #22c55e; border-radius:10px; padding:8px 12px; cursor:pointer; opacity:0.85;">
            <div style="font-size:11px; color:#22c55e;">🗃️×10 — Открыть сразу 10 Сундуков</div>
            <div style="background:#15803d; padding:5px 10px; border-radius:6px; font-weight:bold; font-size:12px; white-space:nowrap;">3 000 🪙</div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <div onclick="buyChest(3)" style="display:flex; align-items:center; gap:12px; background:rgba(5,10,30,0.9); border:1px solid #3b82f6; border-radius:12px; padding:12px; cursor:pointer; box-shadow:0 0 8px rgba(59,130,246,0.25);">
            <div style="font-size:28px; flex-shrink:0;">🧳</div>
            <div style="flex:1; text-align:left;">
              <div style="font-weight:bold; color:#60a5fa; font-size:14px; margin-bottom:3px;">Большой сундук</div>
              <div style="font-size:10px; color:#64748b;">40% Обычный · 30% Необычный · 27% Редкий · <span style="color:#60a5fa">3% Эпик</span></div>
            </div>
            <div style="background:#1d4ed8; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:13px; white-space:nowrap; flex-shrink:0;">500 🪙</div>
          </div>
          <div onclick="buyChest10(3)" style="display:flex; align-items:center; justify-content:space-between; background:rgba(5,10,30,0.7); border:1px dashed #3b82f6; border-radius:10px; padding:8px 12px; cursor:pointer; opacity:0.85;">
            <div style="font-size:11px; color:#60a5fa;">🧳×10 — Открыть сразу 10 Больших сундуков</div>
            <div style="background:#1d4ed8; padding:5px 10px; border-radius:6px; font-weight:bold; font-size:12px; white-space:nowrap;">5 000 🪙</div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <div onclick="buyChest(4)" style="display:flex; align-items:center; gap:12px; background:rgba(20,5,40,0.95); border:2px solid #a855f7; border-radius:12px; padding:14px; cursor:pointer; box-shadow:0 0 15px rgba(168,85,247,0.35), inset 0 0 20px rgba(168,85,247,0.05);">
            <div style="font-size:34px; flex-shrink:0;">💎</div>
            <div style="flex:1; text-align:left;">
              <div style="font-weight:bold; color:#d8b4fe; font-size:15px; margin-bottom:3px;">Огромный сундук</div>
              <div style="font-size:10px; color:#64748b;">30% Обычный · 30% Необычный · 35% Редкий · <span style="color:#d8b4fe; font-weight:bold;">5% Эпик</span></div>
              <div style="color:#9333ea; font-size:10px; margin-top:4px;">✨ Гарант уникального эпика каждые 100 открытий</div>
            </div>
            <div style="background:#6b21a8; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:13px; white-space:nowrap; flex-shrink:0;">1000 🪙</div>
          </div>
          <div onclick="buyChest10(4)" style="display:flex; align-items:center; justify-content:space-between; background:rgba(20,5,40,0.8); border:1px dashed #a855f7; border-radius:10px; padding:8px 12px; cursor:pointer; box-shadow:0 0 8px rgba(168,85,247,0.2);">
            <div>
              <div style="font-size:11px; color:#d8b4fe; font-weight:bold;">💎×10 — Открыть сразу 10 Огромных сундуков</div>
              <div style="font-size:10px; color:#9333ea; margin-top:2px;">✨ Учитывается гарант · Нужно 10 свободных слотов</div>
            </div>
            <div style="background:#6b21a8; padding:5px 10px; border-radius:6px; font-weight:bold; font-size:12px; white-space:nowrap;">10 000 🪙</div>
          </div>
        </div>

      </div>
    </div>`;

  document.getElementById('shop-content').innerHTML = html;
}
