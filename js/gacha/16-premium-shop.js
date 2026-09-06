// ============================================================
// PREMIUM SHOP
// Промокоды, обмен лунных камней на золото/сундуки/ключи, рендер Лунного магазина.
// ============================================================

const CODE_SECRET = 'MIDDLE_EARTH_2024';

function decodePromoCode(code) {
  let clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 12) return null;
  let payload = clean.slice(0, 8);
  let checksum = clean.slice(8, 12);
  // Проверяем контрольную сумму
  let expected = generateChecksum(payload + CODE_SECRET);
  if (expected !== checksum) return null;
  // Декодируем payload: первые 4 — номинал (base36), следующие 4 — уникальный ID
  try {
    let amount = parseInt(payload.slice(0, 4), 36);
    let uid = payload.slice(4, 8);
    let validAmounts = [50, 100, 200, 500, 1000, 5000];
    if (!validAmounts.includes(amount)) return null;
    return { amount, uid, fullId: payload };
  } catch(e) { return null; }
}

function generateChecksum(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  let result = Math.abs(hash).toString(36).toUpperCase().padStart(4, '0');
  return result.slice(0, 4);
}

function redeemCode() {
  let input = document.getElementById('promo-input');
  if (!input) return;
  let code = input.value.trim();
  if (!code) { showCodeResult('Введите код!', false); return; }

  let decoded = decodePromoCode(code);
  if (!decoded) { showCodeResult('❌ Неверный код', false); return; }

  if (gameData.usedCodes.includes(decoded.fullId)) {
    showCodeResult('❌ Код уже использован', false); return;
  }

  // Активируем
  gameData.lunarStones += decoded.amount;
  gameData.usedCodes.push(decoded.fullId);
  input.value = '';
  saveData();
  renderPremiumShop();
  showCodeResult(`✅ Получено ${decoded.amount} 💠 Лунных камней!`, true);
}

function showCodeResult(msg, isSuccess) {
  let el = document.getElementById('code-result');
  if (!el) return;
  el.innerText = msg;
  el.style.color = isSuccess ? '#10b981' : '#ef4444';
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function buyWithLunar(type, cost) {
  if (gameData.lunarStones < cost) {
    showCodeResult('❌ Недостаточно Лунных камней!', false); return;
  }
  gameData.lunarStones -= cost;

  if (type === 'gold_2000')   { gameData.imperials += 2000; showCodeResult('+2 000 🪙 получено!', true); }
  else if (type === 'gold_5000')   { gameData.imperials += 5000; showCodeResult('+5 000 🪙 получено!', true); }
  else if (type === 'gold_10000')  { gameData.imperials += 10000; showCodeResult('+10 000 🪙 получено!', true); }
  else if (type === 'gold_25000')  { gameData.imperials += 25000; showCodeResult('+25 000 🪙 получено!', true); }
  else if (type === 'gold_50000')  { gameData.imperials += 50000; showCodeResult('+50 000 🪙 получено!', true); }
  else if (type === 'gold_100000') { gameData.imperials += 100000; showCodeResult('+100 000 🪙 получено!', true); }
  else if (type === 'chest_1') { openChestLunar(1); }
  else if (type === 'chest_3') { openChestLunar(3); }
  else if (type === 'chest_4') { openChestLunar(4); }

  saveData();
  renderPremiumShop();
}

function openChestLunar(chestType) {
  if (gameData.inventory.length >= gameData.maxInventory) {
    showCodeResult('❌ Сумка полна! Камни возвращены.', false);
    gameData.lunarStones += [0,2,0,3,0,0,0,7][chestType]; // возврат
    return;
  }
  let rarity = 'common'; let r = Math.random();
  if (chestType === 1) { if (r < 0.85) rarity='common'; else if (r < 0.99) rarity='uncommon'; else rarity='rare'; }
  else if (chestType === 3) { if (r < 0.40) rarity='common'; else if (r < 0.70) rarity='uncommon'; else if (r < 0.97) rarity='rare'; else rarity='epic'; }
  else if (chestType === 4) {
    gameData.hugeChestPity++;
    if (gameData.hugeChestPity > 100) { rarity='epic'; gameData.hugeChestPity=0; }
    else { if (r < 0.30) rarity='common'; else if (r < 0.60) rarity='uncommon'; else if (r < 0.95) rarity='rare'; else rarity='epic'; }
  }
  let item = generateItem(rarity);
  gameData.inventory.push(item);
  saveData();
  // Показываем красивую анимацию — как для сундуков за золото
  openChestModal(item, chestType);
}

function buyLunarKey(keyId, cost) {
  if (gameData.lunarStones < cost) { showCodeResult('❌ Недостаточно Лунных камней!', false); return; }
  gameData.lunarStones -= cost;
  gameData.keys[keyId] = (gameData.keys[keyId] || 0) + 1;
  saveData();
  let names = { ancient_key: '🗝️ Древний ключ' };
  showCodeResult(`✅ Куплен ${names[keyId] || 'ключ'}! В наличии: ${gameData.keys[keyId]} шт.`, true);
  renderPremiumShop();
}

function renderPremiumShop() {
  let ls = gameData.lunarStones;
  let canBuy = (cost) => ls >= cost;

  // Золото
  let goldItems = [
    { type: 'gold_2000',   gold: '2 000',   cost: 20  },
    { type: 'gold_5000',   gold: '5 000',   cost: 40  },
    { type: 'gold_10000',  gold: '10 000',  cost: 70  },
    { type: 'gold_25000',  gold: '25 000',  cost: 150 },
    { type: 'gold_50000',  gold: '50 000',  cost: 250 },
    { type: 'gold_100000', gold: '100 000', cost: 400 },
  ];
  let goldHtml = goldItems.map(g => `
    <div onclick="${canBuy(g.cost) ? `buyWithLunar('${g.type}', ${g.cost})` : ''}"
      style="background:rgba(30,41,59,0.8); border:1px solid ${canBuy(g.cost) ? '#f59e0b' : '#374151'}; border-radius:10px; padding:12px 8px; text-align:center; cursor:${canBuy(g.cost) ? 'pointer' : 'default'}; opacity:${canBuy(g.cost) ? '1' : '0.5'}; transition:all 0.2s;">
      <div style="font-size:22px;">🪙</div>
      <div style="font-weight:900; color:#fbbf24; font-size:13px; margin:4px 0;">${g.gold}</div>
      <div style="background:${canBuy(g.cost) ? 'rgba(15,118,110,0.4)' : 'rgba(55,65,81,0.4)'}; border-radius:6px; padding:4px 6px; font-size:12px; color:${canBuy(g.cost) ? '#5eead4' : '#64748b'}; font-weight:bold;">${g.cost} 💠</div>
    </div>`).join('');

  // Сундуки
  let chestItems = [
    { type: 'chest_1', icon: '📦', name: 'Сундук',        cost: 2, desc: '85% обыч · 14% необыч · 1% редк' },
    { type: 'chest_3', icon: '🗃️',  name: 'Бол. сундук',  cost: 3, desc: '40% обыч · 30% необыч · 27% редк · 3% эпик' },
    { type: 'chest_4', icon: '💰',  name: 'Огр. сундук',  cost: 7, desc: '30% обыч · 30% необыч · 35% редк · 5% эпик' },
  ];
  let chestHtml = chestItems.map(c => `
    <div onclick="${canBuy(c.cost) ? `buyWithLunar('${c.type}', ${c.cost})` : ''}"
      style="background:rgba(30,41,59,0.8); border:1px solid ${canBuy(c.cost) ? '#7c3aed' : '#374151'}; border-radius:10px; padding:12px 8px; text-align:center; cursor:${canBuy(c.cost) ? 'pointer' : 'default'}; opacity:${canBuy(c.cost) ? '1' : '0.5'};">
      <div style="font-size:28px;">${c.icon}</div>
      <div style="font-weight:900; color:#e9d5ff; font-size:13px; margin:4px 0;">${c.name}</div>
      <div style="font-size:9px; color:#94a3b8; margin-bottom:6px;">${c.desc}</div>
      <div style="background:${canBuy(c.cost) ? 'rgba(109,40,217,0.4)' : 'rgba(55,65,81,0.4)'}; border-radius:6px; padding:4px 6px; font-size:12px; color:${canBuy(c.cost) ? '#c4b5fd' : '#64748b'}; font-weight:bold;">${c.cost} 💠</div>
    </div>`).join('');

  let html = `
    <!-- Баланс -->
    <div style="background:rgba(15,23,42,0.9); border:1px solid #1e3a5f; border-radius:12px; padding:14px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
      <div style="color:#94a3b8; font-size:13px;">Ваш баланс</div>
      <div style="font-size:20px; font-weight:900; color:#67e8f9;">${ls} 💠</div>
    </div>

    <!-- МИФИЧЕСКАЯ РУЛЕТКА — самый верх -->
    <div id="mythic-gacha-block"></div>

    <!-- Легендарные рулетки -->
    <div class="class-card" style="border:2px solid #a855f7; background:rgba(20,10,40,0.95); margin-bottom:16px; text-align:left;">
      <div class="class-title" style="color:#d946ef; margin-bottom:4px;">✨ Косметика — Рулетки титулов</div>
      <div class="class-desc" style="margin-bottom:14px;">Получи уникальный титул для своего класса. Титул отображается под ником в бою.</div>
      <div id="gacha-list"></div>
    </div>

    <!-- Золото -->
    <div class="class-card" style="border:2px solid #b45309; background:rgba(25,15,0,0.9); margin-bottom:16px; text-align:left;">
      <div class="class-title" style="color:#fbbf24; margin-bottom:4px;">🪙 Золото</div>
      <div class="class-desc" style="margin-bottom:14px;">Обменяйте Лунные камни на Империалы.</div>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;">${goldHtml}</div>
    </div>

    <!-- Сундуки -->
    <div class="class-card" style="border:2px solid #7c3aed; background:rgba(20,10,40,0.9); margin-bottom:16px; text-align:left;">
      <div class="class-title" style="color:#c084fc; margin-bottom:4px;">📦 Сундуки</div>
      <div class="class-desc" style="margin-bottom:14px;">Экипировка за Лунные камни.</div>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;">${chestHtml}</div>
    </div>

    <!-- Ключи -->
    <div class="class-card" style="border:2px solid #374151; background:rgba(15,20,30,0.9); margin-bottom:16px; text-align:left;">
      <div class="class-title" style="color:#fbbf24; margin-bottom:8px;">🗝️ Ключи подземелий</div>
      <div onclick="buyLunarKey('ancient_key', 20)" style="cursor:pointer; background:rgba(30,41,59,0.8); border:1px solid #334155; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:13px; font-weight:bold; color:#f1f5f9;">🗝️ Древний ключ</div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">Для 🕌 Древний храм · Нельзя купить за золото</div>
          <div style="font-size:11px; color:#475569; margin-top:1px;">В наличии: <span id="lunar-ancient-key-count">0</span> шт.</div>
        </div>
        <div style="font-size:14px; font-weight:900; color:#67e8f9; white-space:nowrap;">20 💠</div>
      </div>
    </div>


    <!-- Ввод кода -->
    <div style="margin-top:20px; background:rgba(15,23,42,0.8); border:1px solid #1e3a5f; border-radius:12px; padding:16px;">
      <div style="font-size:13px; color:#64748b; margin-bottom:10px; text-align:center;">Есть промокод? Введите ниже</div>
      <div style="display:flex; gap:8px;">
        <input id="promo-input" type="text" placeholder="XXXX-XXXX-XXXX"
          style="flex:1; background:rgba(30,41,59,0.9); border:1px solid #334155; border-radius:8px; padding:10px 12px; color:#e2e8f0; font-size:14px; font-family:monospace; outline:none; text-transform:uppercase;"
          oninput="this.value=this.value.toUpperCase()">
        <button class="action-btn" style="background:linear-gradient(135deg,#0e7490,#0891b2); padding:10px 16px; font-size:13px; flex:0; white-space:nowrap;" onclick="redeemCode()">
          Активировать
        </button>
      </div>
      <div id="code-result" style="display:none; margin-top:8px; font-size:13px; font-weight:bold; text-align:center;"></div>
    </div>
  `;

  document.getElementById('tab-premium').innerHTML = html;
  renderMythicGachaBlock();
  renderGachaList();
  // Обновляем счётчик ключа в Лунном магазине
  let ancEl = document.getElementById('lunar-ancient-key-count');
  if (ancEl) ancEl.innerText = gameData.keys['ancient_key'] || 0;
}
