// ============================================================
// INVENTORY & HERO TAB
// Вкладки Герой/Сумка, модалка предмета, экипировка/снятие/продажа.
// ============================================================

let selectedItem = null; let isEquipped = false;

function updateHeroTab() {
  let totalHp = 20; let currentEq = gameData.equip[gameData.currentClass];
  ['head', 'body', 'arms', 'legs'].forEach(slot => {
    let el = document.getElementById(`eq-${slot}`); let item = currentEq[slot];
    if (item) {
      totalHp += item.hp; el.className = `equip-slot rarity-${item.rarity} filled`; el.innerHTML = `<b>${item.name}</b><br>+${item.hp} ХП`;
      if (item.rarity === 'epic') el.innerHTML += `<br><span style="color:#ef4444; font-size:9px;">Привязано</span>`;
    } else { el.className = `equip-slot`; el.innerHTML = `${getSlotIcon(slot)}<br>${SLOT_NAMES[slot]}`; }
  });
  document.getElementById('hero-stats').innerText = `Максимальное ХП: ${totalHp}`;

  // Кнопка титула (легендарная + мифическая гача)
  let titleEl = document.getElementById('hero-title-btn');
  if (titleEl) {
    // Определяем активный титул — сначала мифический, потом обычный
    let classId = gameData.currentClass;
    let mt = gameData.mythicTitles[classId];
    let td = gameData.titles[classId];
    let mythicPool = MYTHIC_GACHA_POOLS[classId];
    let legendPool = GACHA_POOLS[classId];

    let titleDisplay = '';
    // Проверяем мифический активный
    if (mt && mt.active === 'mythic' && mythicPool) {
      titleDisplay = getTitleHtml('mythic', mythicPool.titles.mythic.name);
    } else if (mt && mt.active && mt.active !== 'mythic' && mythicPool && mythicPool.titles[mt.active]) {
      titleDisplay = getTitleHtml(mt.active, mythicPool.titles[mt.active].name);
    } else if (td && td.active && legendPool && legendPool.titles[td.active]) {
      titleDisplay = getTitleHtml(td.active, legendPool.titles[td.active].name);
    } else {
      titleDisplay = '<span style="color:#475569;">Без титула</span>';
    }

    // Активная рамка
    let frameName = gameData.cardFrame && FRAME_META[gameData.cardFrame] ? FRAME_META[gameData.cardFrame].name : '<span style="color:#475569;">Ранговая</span>';
    // Активный эффект появления
    let effectName = gameData.entryEffect && ENTRY_EFFECT_META[gameData.entryEffect] ? ENTRY_EFFECT_META[gameData.entryEffect].name : '<span style="color:#475569;">Нет</span>';
    // Активный эффект победы
    let victoryName = gameData.activeVictoryEffect && VICTORY_EFFECT_META[gameData.activeVictoryEffect] ? VICTORY_EFFECT_META[gameData.activeVictoryEffect].name : '<span style="color:#475569;">Нет</span>';

    titleEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:12px; padding:14px 16px; cursor:pointer;" onclick="openTitleModal()">
          <div>
            <div style="font-size:11px; color:#64748b; margin-bottom:4px;">👑 Активный титул</div>
            <div style="font-size:14px;">${titleDisplay}</div>
          </div>
          <div style="color:#475569; font-size:18px;">›</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:12px; padding:14px 16px; cursor:pointer;" onclick="openEntryEffectModal()">
          <div>
            <div style="font-size:11px; color:#64748b; margin-bottom:4px;">✨ Эффект появления</div>
            <div style="font-size:14px;">${effectName}</div>
          </div>
          <div style="color:#475569; font-size:18px;">›</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:12px; padding:14px 16px; cursor:pointer;" onclick="openVictoryEffectModal()">
          <div>
            <div style="font-size:11px; color:#64748b; margin-bottom:4px;">🏆 Эффект победы</div>
            <div style="font-size:14px;">${victoryName}</div>
          </div>
          <div style="color:#475569; font-size:18px;">›</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:12px; padding:14px 16px; cursor:pointer;" onclick="openCardFrameModal()">
          <div>
            <div style="font-size:11px; color:#64748b; margin-bottom:4px;">🖼️ Рамка карточки</div>
            <div style="font-size:14px;">${frameName}</div>
          </div>
          <div style="color:#475569; font-size:18px;">›</div>
        </div>
      </div>`;
  }
}

function updateBagTab() {
  document.getElementById('bag-count').innerText = gameData.inventory.length;
  document.getElementById('bag-max').innerText = gameData.maxInventory;
  document.getElementById('imperial-amount').innerText = gameData.imperials;
  let shopBal = document.getElementById('shop-imperial-amount'); if (shopBal) shopBal.innerText = gameData.imperials;

  // Сетка инвентаря
  let grid = document.getElementById('inventory-grid'); grid.innerHTML = '';
  for (let i = 0; i < gameData.maxInventory; i++) {
    let item = gameData.inventory[i];
    if (item) { grid.innerHTML += `<div class="inv-slot rarity-${item.rarity} filled" onclick="openItemModalById('${item.id}', false)"><b>${item.name}</b><br>+${item.hp} ХП</div>`; }
    else { grid.innerHTML += `<div class="inv-slot">Пусто</div>`; }
  }

  // Подсумок
  let pouchEl = document.getElementById('pouch-section');
  if (!pouchEl) return;
  let slots = gameData.pouch.slots;
  if (slots === 0) {
    pouchEl.innerHTML = `
      <div style="margin-top:20px; background:rgba(30,41,59,0.7); border:1px dashed #475569; border-radius:12px; padding:15px; text-align:center; color:#64748b; font-size:13px;">
        🧰 Подсумок не куплен<br>
        <span style="font-size:11px;">Купите слоты у Герольда Кожевника в Магазине</span>
      </div>`;
    return;
  }
  let pouchGrid = '';
  for (let i = 0; i < slots; i++) {
    let potion = gameData.pouch.items[i];
    if (potion) {
      pouchGrid += `<div class="inv-slot pouch-slot filled" style="border-color:#7c3aed; background:rgba(124,58,237,0.15);">
        <span style="font-size:16px;">🧪</span><br>
        <b style="font-size:9px; color:#e9d5ff;">${potion.name.replace('🧪 ', '')}</b><br>
        <span style="font-size:9px; color:#a78bfa;">+${potion.heal} ХП</span>
      </div>`;
    } else {
      pouchGrid += `<div class="inv-slot pouch-slot" style="border-color:#4c1d95; color:#6d28d9;">Пусто</div>`;
    }
  }
  pouchEl.innerHTML = `
    <div style="margin-top:20px;">
      <h3 style="text-align:left; font-size:14px; margin-bottom:10px; color:#a78bfa;">🧰 Подсумок (${gameData.pouch.items.length}/${slots})</h3>
      <div class="inventory-grid">${pouchGrid}</div>
    </div>`;
}

function getSlotIcon(slot) { return { head: "🪖", body: "👕", arms: "🧤", legs: "👢" }[slot]; }

function openItemModalById(id, equipped) {
  let currentEq = gameData.equip[gameData.currentClass];
  let item = equipped ? Object.values(currentEq).find(i => i && String(i.id) === String(id)) : gameData.inventory.find(i => i && String(i.id) === String(id));
  if (!item) return; selectedItem = item; isEquipped = equipped;
  document.getElementById('modal-title').innerText = item.name;
  document.getElementById('modal-title').className = `text-${item.rarity}`;
  let desc = `<b>Слот:</b> ${SLOT_NAMES[item.slot]}<br><b>Бонус:</b> +${item.hp} Макс ХП<br>`;
  if (item.perk) desc += `<br>🔸 ${item.perk.desc}`; if (item.unique) desc += `<br><b style="color:#fbbf24">${item.unique.desc}</b>`; if (item.legendary) desc += `<br><b style="color:#f59e0b; text-shadow:0 0 8px rgba(245,158,11,0.6);">${item.legendary.desc}</b>`; if (item.classId) desc += `<br><span style="color:#64748b; font-size:11px;">Только для: ${CLASSES[item.classId]?.name || item.classId}</span>`;
  if (equipped && item.rarity === 'epic') { desc += `<br><br><span style="color:#ef4444; font-weight:bold;">🔒 Привязано к герою</span><br><i>Эту вещь нельзя снять, только уничтожить (продать).</i>`; }
  desc += `<br><br><i>Цена продажи: ${SELL_PRICES[item.rarity]} 🪙</i>`;
  document.getElementById('modal-desc').innerHTML = desc;
  let acts = document.getElementById('modal-actions');
  if (equipped) {
    if (item.rarity === 'epic') { acts.innerHTML = `<button class="action-btn" style="background:#ef4444" onclick="sellEquippedItem()">Продать</button>`; }
    else { acts.innerHTML = `<button class="action-btn" style="background:#f59e0b" onclick="unequipItem()">Снять</button>`; }
  } else {
    acts.innerHTML = `<button class="action-btn" style="background:#22c55e" onclick="equipItem()">Надеть</button>
                      <button class="action-btn" style="background:#ef4444" onclick="sellItem()">Продать</button>`;
  }
  document.getElementById('item-modal').style.display = 'flex';
}
function openItemModal(slot, equipped) { let currentEq = gameData.equip[gameData.currentClass]; if (equipped && currentEq[slot]) openItemModalById(currentEq[slot].id, true); }
function closeModal() { document.getElementById('item-modal').style.display = 'none'; let cb = document.getElementById('modal-close-btn'); if (cb) cb.style.display = 'block'; }

function equipItem() {
  let currentEq = gameData.equip[gameData.currentClass]; let oldItem = currentEq[selectedItem.slot];
  if (oldItem && oldItem.rarity === 'epic') { alert("Слот занят привязанной эпической вещью! Сначала продайте её."); return; }
  if (gameData.inventory.length >= gameData.maxInventory && oldItem) { alert("Сумка полна! Сначала освободите место."); return; }
  gameData.inventory = gameData.inventory.filter(i => i.id !== selectedItem.id); currentEq[selectedItem.slot] = selectedItem;
  if (oldItem) gameData.inventory.push(oldItem);
  saveData(); closeModal(); updateBagTab(); updateHeroTab();
}
function unequipItem() {
  if (gameData.inventory.length >= gameData.maxInventory) { alert("Сумка полна!"); return; }
  let currentEq = gameData.equip[gameData.currentClass]; currentEq[selectedItem.slot] = null;
  gameData.inventory.push(selectedItem); saveData(); closeModal(); updateBagTab(); updateHeroTab();
}
function sellItem() {
  gameData.imperials += SELL_PRICES[selectedItem.rarity]; gameData.inventory = gameData.inventory.filter(i => i.id !== selectedItem.id);
  saveData(); closeModal(); updateBagTab(); if (document.getElementById('tab-shop').classList.contains('active')) renderShop();
}
function executeSellEquipped() {
  gameData.imperials += SELL_PRICES[selectedItem.rarity]; gameData.equip[gameData.currentClass][selectedItem.slot] = null;
  saveData(); closeModal(); updateHeroTab(); updateBagTab(); if (document.getElementById('tab-shop').classList.contains('active')) renderShop();
}
function sellEquippedItem() {
  // БАГ-ФИКС: tg.showConfirm устарел и ненадёжен; window.confirm заблокирован в Telegram WebApp.
  // Используем встроенное подтверждение внутри модалки — работает везде.
  let price = SELL_PRICES[selectedItem.rarity];
  let acts = document.getElementById('modal-actions');
  acts.innerHTML = `
    <div style="width:100%; text-align:center; color:#fbbf24; font-size:13px; margin-bottom:8px;">
      Вещь будет уничтожена. Получите <b>${price} 🪙</b>. Уверены?
    </div>
    <button class="action-btn" style="background:#ef4444; flex:1;" onclick="executeSellEquipped()">✓ Да, продать</button>
    <button class="action-btn" style="background:#475569; flex:1;" onclick="cancelSellEquipped()">✗ Отмена</button>
  `;
}
function cancelSellEquipped() {
  // Возвращаем кнопку продажи
  let acts = document.getElementById('modal-actions');
  acts.innerHTML = `<button class="action-btn" style="background:#ef4444" onclick="sellEquippedItem()">Продать</button>`;
}
