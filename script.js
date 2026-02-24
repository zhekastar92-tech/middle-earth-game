// Безопасная загрузка Telegram API
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg && tg.expand) tg.expand();
const REAL_PLAYER_NAME = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user.first_name : "Вы";

// БАЗА ДАННЫХ (Бронебойная защита от старых сохранений)
let gameData = { lp: 0, imperials: 0, inventory: [], equip: { head: null, body: null, arms: null, legs: null } };
try {
  let saved = JSON.parse(localStorage.getItem('middleEarthData'));
  if (saved && typeof saved === 'object') {
    gameData.lp = saved.lp || 0;
    gameData.imperials = saved.imperials || 0;
    gameData.inventory = saved.inventory || [];
    gameData.equip = saved.equip || { head: null, body: null, arms: null, legs: null };
  }
} catch (e) {}

function saveData() { localStorage.setItem('middleEarthData', JSON.stringify(gameData)); }

const RANKS = [
  { name: "Железо", icon: "🔘", maxLp: 300, arenaClass: "arena-iron", borderClass: "border-iron", textClass: "" },
  { name: "Бронза", icon: "🟤", maxLp: 600, arenaClass: "arena-bronze", borderClass: "border-bronze", textClass: "" },
  { name: "Серебро", icon: "⚪", maxLp: 1000, arenaClass: "arena-silver", borderClass: "border-silver", textClass: "" },
  { name: "Золото", icon: "🟡", maxLp: 1400, arenaClass: "arena-gold", borderClass: "border-gold", textClass: "" },
  { name: "Изумруд", icon: "❇️", maxLp: 1800, arenaClass: "arena-emerald", borderClass: "border-emerald", textClass: "" },
  { name: "Алмаз", icon: "💎", maxLp: 2400, arenaClass: "arena-diamond", borderClass: "border-diamond", textClass: "" },
  { name: "Мастер", icon: "📀", maxLp: 3000, arenaClass: "arena-master", borderClass: "border-master", textClass: "text-master" },
  { name: "Грандмастер", icon: "💿", maxLp: 3800, arenaClass: "arena-grandmaster", borderClass: "border-grandmaster", textClass: "text-grandmaster" },
  { name: "Владыка", icon: "👹", maxLp: 5000, arenaClass: "arena-overlord", borderClass: "border-overlord", textClass: "text-overlord" },
  { name: "Феникс", icon: "🐦‍🔥", maxLp: 99999, arenaClass: "arena-phoenix", borderClass: "border-phoenix", textClass: "text-phoenix" }
];

function getRank(lp) { return RANKS.find(r => lp <= r.maxLp) || RANKS[RANKS.length - 1]; }

// НОВОЕ: Отдельная база шансов для Арен (Яма, Колизей и т.д.)
function getArenaDrops(lp) {
  if (lp <= 300) return { common: 0.1, uncommon: 0.005, rare: 0, epic: 0 }; 
  if (lp <= 600) return { common: 0.2, uncommon: 0.01, rare: 0, epic: 0 }; 
  if (lp <= 1400) return { common: 0.5, uncommon: 0.05, rare: 0.005, epic: 0 }; 
  if (lp <= 2400) return { common: 0, uncommon: 0.2, rare: 0.02, epic: 0.004 }; 
  if (lp <= 3800) return { common: 0, uncommon: 0.3, rare: 0.1, epic: 0.02 };
  return { common: 0, uncommon: 0, rare: 0.2, epic: 0.05 }; 
}

// НОВОЕ: Динамический калькулятор LP
function calculateLpChange(lp, isWin) {
  let min, max;
  if (lp <= 1400) { // До Изумруда
    if (isWin) { min = 20; max = 30; } else { min = 10; max = 15; }
  } else if (lp <= 2400) { // Изумруд и Алмаз
    if (isWin) { min = 15; max = 20; } else { min = 15; max = 20; }
  } else if (lp <= 5000) { // Мастер, Грандмастер, Владыка
    if (isWin) { min = 10; max = 15; } else { min = 15; max = 20; }
  } else { // Феникс
    if (isWin) { min = 5; max = 10; } else { min = 15; max = 20; }
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const CLASSES = {
  warrior: { name: "Воин", activeName: "На вылет", reqType: "dmgDealt", reqAmt: 5, p1: "Берсерк", p2: "Боевой раж" },
  assassin: { name: "Убийца", activeName: "Двойной удар", reqType: "dmgDealt", reqAmt: 4, p1: "Инстинкт выживания", p2: "Преследование" },
  guardian: { name: "Страж", activeName: "Оплот", reqType: "dmgBlocked", reqAmt: 5, p1: "Контратака", p2: "Возмездие" },
  priest: { name: "Жрец", activeName: "Сила жизни", reqType: "healed", reqAmt: 3, p1: "Молитва", p2: "Обжигающий свет" }
};

const SLOT_NAMES = { head: "Шлем", body: "Броня", arms: "Перчатки", legs: "Сапоги" };
const RARITY_NAMES = { common: "Обычный", uncommon: "Необычный", rare: "Редкий", epic: "Эпический" };
const SELL_PRICES = { common: 10, uncommon: 100, rare: 500, epic: 1000 };

// НАВИГАЦИЯ (Безопасный метод без event)
function switchTab(btn, tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  
  if (btn) btn.classList.add('active');
  else {
    let fallbackBtn = document.querySelector(`[onclick="switchTab(this, '${tabId}')"]`);
    if (fallbackBtn) fallbackBtn.classList.add('active');
  }
  
  if(tabId === 'tab-hero') updateHeroTab();
  if(tabId === 'tab-bag') updateBagTab();
}

function updateMenuProfile() {
  let rank = getRank(gameData.lp);
  // Добавляем свечение ника даже в главное меню
  let nameClass = rank.textClass ? ` class="profile-name ${rank.textClass}"` : ` class="profile-name"`;
  document.getElementById("menu-profile").innerHTML = `<div${nameClass}>👤 ${REAL_PLAYER_NAME}</div><div class="profile-rank">${rank.icon} ${rank.name} | ${gameData.lp} LP</div>`;
}

// ГЕНЕРАТОР ПРЕДМЕТОВ
function rollLoot(lp) {
  let drops = getArenaDrops(lp); // Теперь берем шансы из Арен, а не из рангов
  let roll = Math.random();
  if (roll < drops.epic) return generateItem('epic');
  if (roll < drops.epic + drops.rare) return generateItem('rare');
  if (roll < drops.epic + drops.rare + drops.uncommon) return generateItem('uncommon');
  if (roll < drops.epic + drops.rare + drops.uncommon + drops.common) return generateItem('common');
  return null;
}

function generateItem(rarity) {
  const slots = ['head', 'body', 'arms', 'legs'];
  const slot = slots[Math.floor(Math.random() * slots.length)];
  let item = { id: Date.now() + Math.floor(Math.random()*1000), rarity: rarity, slot: slot, hp: 0, perk: null, unique: null };
  
  if (rarity === 'common') {
    item.hp = Math.floor(Math.random() * 2) + 1;
  } else if (rarity === 'uncommon') {
    item.hp = Math.floor(Math.random() * 2) + 1;
    if (Math.random() < 0.1) item.perk = generatePerk(slot, 1, 1, 1);
  } else if (rarity === 'rare') {
    item.hp = Math.floor(Math.random() * 2) + 2;
    if (Math.random() < 0.1) item.perk = generatePerk(slot, Math.floor(Math.random()*2)+1, Math.floor(Math.random()*2)+1, Math.floor(Math.random()*2)+1);
  } else if (rarity === 'epic') {
    item.hp = Math.floor(Math.random() * 3) + 3;
    item.perk = generatePerk(slot, Math.floor(Math.random()*3)+2, Math.floor(Math.random()*3)+2, Math.floor(Math.random()*2)+1, Math.floor(Math.random()*2)+2);
    if (Math.random() < 0.02) item.unique = generateUnique(slot);
  }
  item.name = `${RARITY_NAMES[rarity]} ${SLOT_NAMES[slot]}`;
  return item;
}

function generatePerk(slot, hVal, bVal, aVal, aCharges=1) {
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

// ИНВЕНТАРЬ
let selectedItem = null; let isEquipped = false;
function updateHeroTab() {
  let totalHp = 20;
  ['head', 'body', 'arms', 'legs'].forEach(slot => {
    let el = document.getElementById(`eq-${slot}`);
    let item = gameData.equip[slot];
    if (item) {
      totalHp += item.hp;
      el.className = `equip-slot rarity-${item.rarity} filled`;
      el.innerHTML = `<b>${item.name}</b><br>+${item.hp} ХП`;
    } else {
      el.className = `equip-slot`; el.innerHTML = `${getSlotIcon(slot)}<br>${SLOT_NAMES[slot]}`;
    }
  });
  document.getElementById('hero-stats').innerText = `Максимальное ХП: ${totalHp}`;
}

function updateBagTab() {
  document.getElementById('bag-count').innerText = gameData.inventory.length;
  document.getElementById('imperial-amount').innerText = gameData.imperials;
  let grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';
  for(let i=0; i<6; i++) {
    let item = gameData.inventory[i];
    if (item) {
      grid.innerHTML += `<div class="inv-slot rarity-${item.rarity} filled" onclick="openItemModalById('${item.id}', false)"><b>${item.name}</b><br>+${item.hp} ХП</div>`;
    } else {
      grid.innerHTML += `<div class="inv-slot">Пусто</div>`;
    }
  }
}

function getSlotIcon(slot) { return { head: "🪖", body: "👕", arms: "🧤", legs: "👢" }[slot]; }

function openItemModalById(id, equipped) {
  // Исправлено: теперь код принудительно переводит оба ID в текст перед сравнением (String)
  let item = equipped ? Object.values(gameData.equip).find(i => i && String(i.id) === String(id)) : gameData.inventory.find(i => i && String(i.id) === String(id));
  if (!item) return;
  selectedItem = item; isEquipped = equipped;
  
  document.getElementById('modal-title').innerText = item.name;
  document.getElementById('modal-title').className = `text-${item.rarity}`;
  let desc = `<b>Слот:</b> ${SLOT_NAMES[item.slot]}<br><b>Бонус:</b> +${item.hp} Макс ХП<br>`;
  if (item.perk) desc += `<br>🔸 ${item.perk.desc}`;
  if (item.unique) desc += `<br><b style="color:#fbbf24">${item.unique.desc}</b>`;
  if (!equipped) desc += `<br><br><i>Цена продажи: ${SELL_PRICES[item.rarity]} 🪙</i>`;
  document.getElementById('modal-desc').innerHTML = desc;
  
  let acts = document.getElementById('modal-actions');
  if (equipped) {
    acts.innerHTML = `<button class="action-btn" style="background:#f59e0b" onclick="unequipItem()">Снять</button>`;
  } else {
    acts.innerHTML = `<button class="action-btn" style="background:#22c55e" onclick="equipItem()">Надеть</button>
                      <button class="action-btn" style="background:#ef4444" onclick="sellItem()">Продать</button>`;
  }
  document.getElementById('item-modal').style.display = 'flex';
}

function openItemModal(slot, equipped) {
  if (equipped && gameData.equip[slot]) openItemModalById(gameData.equip[slot].id, true);
}
function closeModal() { document.getElementById('item-modal').style.display = 'none'; }

function equipItem() {
  if(gameData.inventory.length >= 6 && gameData.equip[selectedItem.slot]) { alert("Сумка полна! Сначала освободите место."); return; }
  let oldItem = gameData.equip[selectedItem.slot];
  gameData.inventory = gameData.inventory.filter(i => i.id !== selectedItem.id);
  gameData.equip[selectedItem.slot] = selectedItem;
  if(oldItem) gameData.inventory.push(oldItem);
  saveData(); closeModal(); updateBagTab(); updateHeroTab();
}
function unequipItem() {
  if(gameData.inventory.length >= 6) { alert("Сумка полна!"); return; }
  gameData.equip[selectedItem.slot] = null;
  gameData.inventory.push(selectedItem);
  saveData(); closeModal(); updateBagTab(); updateHeroTab();
}
function sellItem() {
  gameData.imperials += SELL_PRICES[selectedItem.rarity];
  gameData.inventory = gameData.inventory.filter(i => i.id !== selectedItem.id);
  saveData(); closeModal(); updateBagTab();
}

// БОЕВАЯ СИСТЕМА
let player = {}; let bot = {}; let gameIsOver = false;

function getEquipHp(eq) { return Object.values(eq).reduce((sum, item) => sum + (item ? item.hp : 0), 0); }
function parsePerks(eq) {
  let p = { healOnce:0, blockPierce:0, strikes:0, dmgB:0, blockB:0, healB:0, dodge:0, ignore:0 };
  Object.values(eq).forEach(item => {
    if(!item) return;
    if(item.perk) {
      if(item.perk.type === 'heal_once') p.healOnce = item.perk.val;
      if(item.perk.type === 'block_pierce') p.blockPierce = item.perk.val;
      if(item.perk.type === 'first_strike') { p.strikes = item.perk.charges; p.dmgB = item.perk.val; }
    }
    if(item.unique) {
      if(item.unique.type === 'healBonus') p.healB = item.unique.val;
      if(item.unique.type === 'blockBonus') p.blockB = item.unique.val;
      if(item.unique.type === 'ignoreBlock') p.ignore = item.unique.val;
      if(item.unique.type === 'dodge') p.dodge = item.unique.val;
    }
  });
  return p;
}

function initChar(classId, isBot, lp) {
  let eq = { head:null, body:null, arms:null, legs:null };
  if(isBot) {
    ['head','body','arms','legs'].forEach(s => { let drop = rollLoot(lp); if(drop) { drop.slot = s; eq[s] = drop; } });
  } else { eq = gameData.equip; }
  
  let hpTotal = 20 + getEquipHp(eq);
  return {
    classId: classId, className: CLASSES[classId].name, hp: hpTotal, maxHp: hpTotal, lp: lp,
    stats: { dmgDealt: 0, dmgBlocked: 0, healed: 0 }, skillReady: false, hotTurnsLeft: 0,
    usedInstinct: false, usedPrayer: false, poisoned: false, pursuitDmg: 0, retBlocks: 0, retBonus: 0,
    eq: eq, // <- НОВОЕ: Сохраняем физические предметы в память бойца
    eqP: parsePerks(eq) 
  };
}

function startGame(selectedClassId) {
  player = initChar(selectedClassId, false, gameData.lp);
  const keys = Object.keys(CLASSES);
  let botLp = Math.max(0, gameData.lp + Math.floor(Math.random() * 41) - 20);
  bot = initChar(keys[Math.floor(Math.random() * keys.length)], true, botLp);
  gameIsOver = false;
  
  let currentRank = getRank(gameData.lp);
  document.getElementById("battle-arena").className = "arena " + currentRank.arenaClass;
  document.getElementById("player-card").className = "character " + currentRank.borderClass;
  document.getElementById("bot-card").className = "character " + getRank(bot.lp).borderClass;

  document.getElementById("combat-log").innerHTML = `<div class='log-entry text-skill'>⚔️ Арена: ${currentRank.name}! Бой начинается.</div>`;
  document.getElementById("btn-return").style.display = "none";
  
  updateScreen(); 
  switchTab(null, "tab-battle"); 
  document.getElementById("main-screen").style.display = "none"; 
  document.getElementById("battle-screen").style.display = "block";
}

function returnToMenu() { 
  updateMenuProfile(); 
  document.getElementById("main-screen").style.display = "block"; 
  document.getElementById("battle-screen").style.display = "none"; 
}

function rollDice() { return Math.floor(Math.random() * 3) + 1; }

function playTurn(playerChoice) {
  if (gameIsOver) return;
  let logMsg = "";
  
  if (player.poisoned) { player.hp -= 1; logMsg += `<span class="text-dmg">☠️ Яд: 1 урон вам!</span><br>`; }
  if (bot.poisoned) { bot.hp -= 1; logMsg += `<span class="text-heal">☠️ Яд: 1 урон врагу!</span><br>`; }

  logMsg += processHoT(player, bot, REAL_PLAYER_NAME, "Враг"); 
  logMsg += processHoT(bot, player, "Враг", REAL_PLAYER_NAME);

  let botChoice = bot.skillReady ? 'skill' : (Math.random() < 0.5 ? 'attack' : 'defend');

  let pAttack = rollDice(); let pBlock = rollDice(); let bAttack = rollDice(); let bBlock = rollDice();
  let pIgnore = false; let pDouble = false; let pInvul = false;
  let bIgnore = false; let bDouble = false; let bInvul = false;

  if (playerChoice === 'skill') {
    player.skillReady = false; playerChoice = 'attack'; logMsg += `<span class="text-skill">🌟 Вы: "${CLASSES[player.classId].activeName}"!</span><br>`;
    if (player.classId === 'warrior') pIgnore = true; if (player.classId === 'assassin') pDouble = true;
    if (player.classId === 'guardian') pInvul = true; if (player.classId === 'priest') player.hotTurnsLeft = 2;
  }
  if (botChoice === 'skill') {
    bot.skillReady = false; botChoice = 'attack'; logMsg += `<span class="text-skill">⚠️ Враг: "${CLASSES[bot.classId].activeName}"!</span><br>`;
    if (bot.classId === 'warrior') bIgnore = true; if (bot.classId === 'assassin') bDouble = true;
    if (bot.classId === 'guardian') bInvul = true; if (bot.classId === 'priest') bot.hotTurnsLeft = 2;
  }

  pBlock += player.eqP.blockB; bBlock += bot.eqP.blockB;
  bBlock = Math.max(0, bBlock - player.eqP.ignore); pBlock = Math.max(0, pBlock - bot.eqP.ignore);

  let pBonus = 0; let bBonus = 0;
  if (player.classId === 'warrior' && player.hp <= 6) pBonus += 2; if (bot.classId === 'warrior' && bot.hp <= 6) bBonus += 2;
  if (player.classId === 'guardian' && player.retBonus > 0 && playerChoice === 'attack' && !pInvul) { pBonus += player.retBonus; player.retBonus = 0; player.retBlocks = 0; }
  if (bot.classId === 'guardian' && bot.retBonus > 0 && botChoice === 'attack' && !bInvul) { bBonus += bot.retBonus; bot.retBonus = 0; bot.retBlocks = 0; }

  if (playerChoice === 'attack' && player.eqP.strikes > 0) { pBonus += player.eqP.dmgB; player.eqP.strikes--; logMsg += `<i class="text-info">🧤 Перчатки: Урон +${player.eqP.dmgB}</i><br>`; }
  if (botChoice === 'attack' && bot.eqP.strikes > 0) { bBonus += bot.eqP.dmgB; bot.eqP.strikes--; logMsg += `<i class="text-info">🧤 Враг использует перчатки!</i><br>`; }

  pAttack += pBonus; bAttack += bBonus;
  if (pDouble) pAttack *= 2; if (bDouble) bAttack *= 2;

  if (playerChoice === 'attack' && botChoice === 'attack') {
    let pDmgTaken = bAttack; let bDmgTaken = pAttack;
    
    if (player.classId === 'assassin' && player.hp <= 4 && !player.usedInstinct) { pDmgTaken = 0; player.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: Вы уклонились!</span><br>`; }
    else if (Math.random() < player.eqP.dodge) { pDmgTaken = 0; logMsg += `<span class="text-info">👢 Сапоги: Вы уклонились!</span><br>`; }
    
    if (bot.classId === 'assassin' && bot.hp <= 4 && !bot.usedInstinct) { bDmgTaken = 0; bot.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт: Враг уклонился!</span><br>`; }
    else if (Math.random() < bot.eqP.dodge) { bDmgTaken = 0; logMsg += `<span class="text-info">👢 Враг уклонился!</span><br>`; }

    if (pInvul) pDmgTaken = 0; if (bInvul) bDmgTaken = 0;

    logMsg += `⚔️ Встречная атака! Вы бьете (${pAttack}), Враг бьет (${bAttack}).<br>`;
    if (bDmgTaken > 0) logMsg += applyDamage(bot, player, bDmgTaken, "Враг");
    if (pDmgTaken > 0) logMsg += applyDamage(player, bot, pDmgTaken, REAL_PLAYER_NAME);

  } else if (playerChoice === 'defend' && botChoice === 'defend') {
    logMsg += `<span class="text-block">🛡️ Оба защищаются.</span>`;
  } else if (playerChoice === 'attack' && botChoice === 'defend') {
    logMsg += resolveCombat(player, bot, pAttack, (pIgnore ? 0 : bBlock), REAL_PLAYER_NAME, "Враг", pIgnore);
  } else if (playerChoice === 'defend' && botChoice === 'attack') {
    logMsg += resolveCombat(bot, player, bAttack, (bIgnore ? 0 : pBlock), "Враг", REAL_PLAYER_NAME, bIgnore);
  }

  // Экипировка: Хил при падении ХП (С умным расчетом дефицита)
  if (player.hp < player.maxHp && player.eqP.healOnce > 0) { 
    let deficit = player.maxHp - player.hp; // Считаем, сколько ХП не хватает до фулла
    let healAmt = Math.min(deficit, player.eqP.healOnce); // Берем ровно столько, сколько нужно
    player.hp += healAmt; 
    player.eqP.healOnce -= healAmt; // Вычитаем только потраченное
    logMsg += `<span class="text-heal">🪖 Шлем лечит вам ${healAmt} ХП (осталось заряда: ${player.eqP.healOnce}).</span><br>`; 
  }
  if (bot.hp < bot.maxHp && bot.eqP.healOnce > 0) { 
    let deficit = bot.maxHp - bot.hp; 
    let healAmt = Math.min(deficit, bot.eqP.healOnce); 
    bot.hp += healAmt; 
    bot.eqP.healOnce -= healAmt; 
  }
  if (player.classId === 'warrior' && player.hp > 0 && player.hp < 10) { player.hp += 1; logMsg += `<span class="text-heal">🩸 Боевой раж: +1 ХП.</span><br>`; }
  if (bot.classId === 'warrior' && bot.hp > 0 && bot.hp < 10) { bot.hp += 1; }

  checkSkills(player, bot, "Вы"); checkSkills(bot, player, "Враг");
  logToScreen(logMsg); updateScreen(); checkWinner();
}

function processHoT(healer, target, hName, tName) {
  if (healer.hotTurnsLeft > 0) {
    healer.hp += 2; if (healer.hp > healer.maxHp) healer.hp = healer.maxHp; healer.hotTurnsLeft--;
    let m = `💖 <i>${hName} лечит <span class="text-heal">2 ХП</span> (Сила жизни).</i><br>`;
    if (healer.classId === 'priest') { target.hp -= 2; m += `🌟 Свет наносит ${tName} <span class="text-dmg">2 урона</span>!<br>`; }
    return m;
  } return "";
}

function resolveCombat(atkC, defC, aRoll, dBlock, aName, dName, ignBlock) {
  let res = `🗡️ ${aName} бьет (${aRoll}), блок: ${ignBlock ? '0' : dBlock}.<br>`;
  
  if (defC.classId === 'assassin' && defC.hp <= 4 && !defC.usedInstinct) { defC.usedInstinct = true; return res + `<span class="text-info">🌑 Инстинкт: ${dName} уклоняется!</span>`; }
  if (Math.random() < defC.eqP.dodge) return res + `<span class="text-info">👢 Сапоги: ${dName} уклоняется!</span>`;

  if (aRoll > dBlock || ignBlock) {
    let dmg = ignBlock ? aRoll : (aRoll - dBlock);
    if (defC.eqP.blockPierce > 0) {
      let absorbed = Math.min(dmg, defC.eqP.blockPierce);
      dmg -= absorbed; defC.eqP.blockPierce = 0;
      res += `<span class="text-info">👕 Броня поглотила ${absorbed} урона!</span><br>`;
    }
    if(dmg > 0) res += applyDamage(defC, atkC, dmg, dName);
  } else if (aRoll === dBlock) {
    res += `<span class="text-block">Идеальный блок!</span><br>`;
    atkC.stats.dmgBlocked += aRoll; defC.stats.dmgBlocked += dBlock;
    if (defC.classId === 'guardian') { atkC.hp -= 1; res += `🗡️ <span class="text-info">Контратака: 1 урон!</span><br>`; }
    if (defC.classId === 'guardian') { defC.retBlocks += dBlock; while(defC.retBlocks >= 2 && defC.retBonus < 5) { defC.retBlocks -= 2; defC.retBonus += 1; } }
  } else {
    let heal = dBlock - aRoll + defC.eqP.healB;
    defC.hp = Math.min(defC.maxHp, defC.hp + heal);
    defC.stats.healed += heal; defC.stats.dmgBlocked += aRoll;
    res += `✨ Избыточный блок! ${dName} лечит <span class="text-heal">${heal} ХП</span>.<br>`;
    if (defC.classId === 'guardian') { atkC.hp -= 1; res += `🗡️ <span class="text-info">Контратака: 1 урон!</span><br>`; }
    if (defC.classId === 'guardian') { defC.retBlocks += aRoll; while(defC.retBlocks >= 2 && defC.retBonus < 5) { defC.retBlocks -= 2; defC.retBonus += 1; } }
    if (defC.classId === 'priest') { atkC.hp -= heal; res += `🌟 Свет наносит ${aName} <span class="text-dmg">${heal} урона</span>!<br>`; }
  }
  return res;
}

function applyDamage(t, a, dmg, tName) {
  let res = `💥 ${tName} получает <span class="text-dmg">${dmg} урона</span>.<br>`;
  t.hp -= dmg; a.stats.dmgDealt += dmg;
  if (a.classId === 'assassin') a.pursuitDmg += dmg;
  if (t.classId === 'priest' && t.hp <= 8 && t.hp > 0 && !t.usedPrayer) {
    t.usedPrayer = true; let h = Math.min(6, t.maxHp - t.hp); t.hp += h;
    res += `🙏 <span class="text-heal">Молитва: +${h} ХП!</span><br>`;
  } return res;
}

function checkSkills(c, t, name) {
  let info = CLASSES[c.classId];
  if (!c.skillReady && c.stats[info.reqType] >= info.reqAmt) { c.skillReady = true; c.stats[info.reqType] = 0; }
  if (c.classId === 'assassin' && c.pursuitDmg >= 13 && !t.poisoned) { t.poisoned = true; logToScreen(`<span class="text-info">☠️ ${name === REAL_PLAYER_NAME ? "Враг отравлен" : "Вы отравлены"}!</span>`); }
}


function buildSkillHtml(char) {
  let info = CLASSES[char.classId]; 
  let pct = Math.min(100, (char.stats[info.reqType] / info.reqAmt) * 100);
  let html = `
    <div class="skill-slot">
      <div class="skill-fill ${char.skillReady ? 'skill-ready-fill' : ''}" style="width:${char.skillReady ? 100 : pct}%"></div>
      <div class="skill-slot-title">⭐ ${info.activeName}</div>
      <div class="skill-progress-text">${char.skillReady ? 'ГОТОВ' : `${char.stats[info.reqType]}/${info.reqAmt}`}</div>
    </div>
  `;
  
  let p1State = "Активен"; let p2State = "Активен";
  if (char.classId === 'warrior') { p1State = char.hp <= 6 ? "ОНЛАЙН (+2)" : "ХП ≤ 6"; p2State = char.hp < 10 ? "ОНЛАЙН" : "ХП < 10"; }
  if (char.classId === 'assassin') { p1State = char.usedInstinct ? "ИСЧЕРПАН" : (char.hp <= 4 ? "ГОТОВ" : "ХП ≤ 4"); p2State = char.poisoned ? "ОТРАВЛЕНО" : `${char.pursuitDmg}/13`; }
  if (char.classId === 'guardian') { p1State = "Авто (Блок)"; p2State = `Бонус: +${char.retBonus}`; }
  if (char.classId === 'priest') { p1State = char.usedPrayer ? "ИСЧЕРПАН" : (char.hp <= 8 ? "ГОТОВ" : "ХП ≤ 8"); p2State = "Авто (Лечение)"; }

  html += `<div class="skill-slot" style="opacity:0.8"><div class="skill-slot-title">🔵 ${info.p1}</div><div class="skill-progress-text" style="color:#9ca3af">${p1State}</div></div>`;
  html += `<div class="skill-slot" style="opacity:0.8"><div class="skill-slot-title">🔴 ${info.p2}</div><div class="skill-progress-text" style="color:#9ca3af">${p2State}</div></div>`;
  return html;
}

function updateMenuProfile() {
  let rank = getRank(gameData.lp);
  // Добавляем свечение ника даже в главное меню
  let nameClass = rank.textClass ? ` class="profile-name ${rank.textClass}"` : ` class="profile-name"`;
  document.getElementById("menu-profile").innerHTML = `<div${nameClass}>👤 ${REAL_PLAYER_NAME}</div><div class="profile-rank">${rank.icon} ${rank.name} | ${gameData.lp} LP</div>`;
}

function updateScreen() {
  if (player.hp < 0) player.hp = 0; if (bot.hp < 0) bot.hp = 0;
  let pRank = getRank(gameData.lp); let bRank = getRank(bot.lp);
  
  // Добавляем классы свечения для ников
  document.getElementById("ui-player-name").innerText = `${REAL_PLAYER_NAME} (${player.className})`;
  document.getElementById("ui-player-name").className = "char-name " + (pRank.textClass || "");
  document.getElementById("ui-player-rank").innerText = `${pRank.icon} ${gameData.lp} LP`;
  
  document.getElementById("ui-bot-name").innerText = `Враг (${bot.className})`;
  document.getElementById("ui-bot-name").className = "char-name " + (bRank.textClass || "");
  document.getElementById("ui-bot-rank").innerText = `${bRank.icon} ${bot.lp} LP`;
  
  document.getElementById("ui-player-hp-fill").style.width = (player.hp / player.maxHp) * 100 + "%";
  document.getElementById("ui-player-hp-text").innerText = `${player.hp} / ${player.maxHp}`;
  document.getElementById("ui-bot-hp-fill").style.width = (bot.hp / bot.maxHp) * 100 + "%";
  document.getElementById("ui-bot-hp-text").innerText = `${bot.hp} / ${bot.maxHp}`;
  
  // ИСПРАВЛЕНО: Возвращаем правильную отрисовку всех 3 навыков для обоих бойцов
  document.getElementById("ui-player-skills").innerHTML = buildSkillHtml(player);
  document.getElementById("ui-bot-skills").innerHTML = buildSkillHtml(bot);
  
  if (player.skillReady && !gameIsOver) {
    document.getElementById("btn-attack").style.display = "none"; document.getElementById("btn-defend").style.display = "none";
    document.getElementById("btn-skill").style.display = "block";
  } else if (!gameIsOver) {
    document.getElementById("btn-attack").style.display = "block"; document.getElementById("btn-defend").style.display = "block";
    document.getElementById("btn-skill").style.display = "none";
  }
}

function logToScreen(msg) { document.getElementById("combat-log").innerHTML = `<div class='log-entry'>${msg}</div>` + document.getElementById("combat-log").innerHTML; }

function checkWinner() {
  if (player.hp <= 0 || bot.hp <= 0) {
    gameIsOver = true; 
    document.getElementById("btn-attack").style.display = "none"; document.getElementById("btn-defend").style.display = "none";
    document.getElementById("btn-skill").style.display = "none"; document.getElementById("btn-return").style.display = "block";
    
    let endMsg = "";
    if (player.hp <= 0 && bot.hp <= 0) { 
      endMsg = "<span class='text-skill'>💀 НИЧЬЯ! (LP не изменились)</span>"; 
    }
    else if (player.hp <= 0) {
      let lpLoss = calculateLpChange(gameData.lp, false); // Динамическая потеря
      gameData.lp = Math.max(0, gameData.lp - lpLoss);
      endMsg = `<span class='text-dmg'>💀 ВЫ ПРОИГРАЛИ!</span> <span class="lp-loss">(-${lpLoss} LP)</span>`;
    } else {
      let lpGain = calculateLpChange(gameData.lp, true); // Динамическая победа
      gameData.lp += lpGain;
      endMsg = `<span class='text-heal'>🏆 ПОБЕДА!</span> <span class="lp-gain">(+${lpGain} LP)</span><br>`;
      
      let loot = rollLoot(gameData.lp);
      if(loot) {
        if(gameData.inventory.length < 6) { 
          gameData.inventory.push(loot); 
          endMsg += `<br><br><span class="text-${loot.rarity}">🎁 Выпал предмет: ${loot.name}! Проверьте сумку.</span>`; 
        } else { 
          gameData.imperials += SELL_PRICES[loot.rarity]; 
          endMsg += `<br><br><span class="text-info">💰 Сумка полна! Выпавший ${loot.name} продан за ${SELL_PRICES[loot.rarity]} 🪙.</span>`; 
        }
      }
      if(tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    }
    saveData(); logToScreen(endMsg);
  }
}

// ОСМОТР ПЕРСОНАЖЕЙ В БОЮ
function openCharModal(isPlayer) {
  if (!player.classId || !bot.classId) return; // Защита от клика до старта боя
  let c = isPlayer ? player : bot;
  
  document.getElementById('modal-title').innerText = isPlayer ? "Осмотр: Вы" : "Осмотр: Враг";
  document.getElementById('modal-title').className = "text-skill";
  
  let desc = `<b>Класс:</b> ${c.className}<br>`;
  desc += `<b>ХП:</b> ${c.hp} / ${c.maxHp}<br><hr style="border-color:#475569; margin:10px 0;">`;
  desc += `<b>Экипировка:</b><br><br>`;
  
  let hasItems = false;
  ['head', 'body', 'arms', 'legs'].forEach(s => {
    let item = c.eq[s];
    if (item) {
      hasItems = true;
      desc += `<b class="text-${item.rarity}">${item.name}</b> (+${item.hp} ХП)<br>`;
      if (item.perk) desc += `<span style="font-size:10px; color:#9ca3af">🔸 ${item.perk.desc}</span><br>`;
      if (item.unique) desc += `<span style="font-size:10px; color:#fbbf24">🔸 ${item.unique.desc}</span><br>`;
      desc += `<br>`;
    }
  });
  if (!hasItems) desc += `<span style="color:#9ca3af">Нет предметов</span>`;
  
  document.getElementById('modal-desc').innerHTML = desc;
  document.getElementById('modal-actions').innerHTML = ''; // Прячем кнопки "Надеть/Продать"
  document.getElementById('item-modal').style.display = 'flex';
}

updateMenuProfile();
