// Инициализация Telegram API
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем игру на весь экран
const REAL_PLAYER_NAME = tg.initDataUnsafe?.user?.first_name || "Вы";

// Система рангов и арен
const RANKS = [
  { name: "Новичок", icon: "🪨", maxLp: 99, arenaClass: "arena-wood", borderClass: "border-wood" },
  { name: "Боец", icon: "🥉", maxLp: 299, arenaClass: "arena-bronze", borderClass: "border-bronze" },
  { name: "Гладиатор", icon: "🥈", maxLp: 599, arenaClass: "arena-silver", borderClass: "border-silver" },
  { name: "Чемпион", icon: "🥇", maxLp: 9999, arenaClass: "arena-gold", borderClass: "border-gold" }
];

// Получение LP из памяти телефона (или 0, если первый вход)
let playerLp = parseInt(localStorage.getItem('middleEarthLp')) || 0;

function getRank(lp) {
  return RANKS.find(r => lp <= r.maxLp) || RANKS[RANKS.length - 1];
}

const CLASSES = {
  warrior: { name: "Воин", activeName: "На вылет", reqType: "dmgDealt", reqAmt: 5, activeMsg: "Пробой брони активирован!", p1: "Берсерк", p2: "Боевой раж" },
  assassin: { name: "Убийца", activeName: "Двойной удар", reqType: "dmgDealt", reqAmt: 4, activeMsg: "Двойной урон готов!", p1: "Инстинкт выживания", p2: "Преследование" },
  guardian: { name: "Страж", activeName: "Оплот", reqType: "dmgBlocked", reqAmt: 5, activeMsg: "Абсолютный блок и контратака!", p1: "Контратака", p2: "Возмездие" },
  priest: { name: "Жрец", activeName: "Сила жизни", reqType: "healed", reqAmt: 3, activeMsg: "Благословение исцеления наложено!", p1: "Молитва", p2: "Обжигающий свет" }
};

let player = {}; let bot = {}; let gameIsOver = false;

function rollDice() { return Math.floor(Math.random() * 3) + 1; }
function showScreen(id) { document.getElementById("main-screen").style.display="none"; document.getElementById("battle-screen").style.display="none"; document.getElementById(id).style.display="block"; }

// Обновление шапки профиля в меню
function updateMenuProfile() {
  let rank = getRank(playerLp);
  document.getElementById("menu-profile").innerHTML = `
    <div class="profile-name">👤 ${REAL_PLAYER_NAME}</div>
    <div class="profile-rank">${rank.icon} ${rank.name} | ${playerLp} LP</div>
  `;
}
updateMenuProfile();

function initChar(classId, isBot) {
  return {
    classId: classId, className: CLASSES[classId].name, hp: 20, maxHp: 20,
    stats: { dmgDealt: 0, dmgBlocked: 0, healed: 0 }, skillReady: false,
    hotTurnsLeft: 0, usedInstinct: false, usedPrayer: false, poisoned: false, pursuitDmg: 0, retBlocks: 0, retBonus: 0
  };
}

function startGame(selectedClassId) {
  player = initChar(selectedClassId, false);
  const keys = Object.keys(CLASSES);
  bot = initChar(keys[Math.floor(Math.random() * keys.length)], true);
  
  // Имитация рейтинга бота (+- 20 LP от игрока)
  bot.lp = Math.max(0, playerLp + Math.floor(Math.random() * 41) - 20);
  
  gameIsOver = false;
  
  // Установка визуального оформления арены
  let currentRank = getRank(playerLp);
  let arenaElement = document.getElementById("battle-arena");
  arenaElement.className = "arena " + currentRank.arenaClass;
  
  document.getElementById("player-card").className = "character " + currentRank.borderClass;
  document.getElementById("bot-card").className = "character " + getRank(bot.lp).borderClass;

  document.getElementById("combat-log").innerHTML = `<div class='log-entry text-skill'>⚔️ Добро пожаловать на арену: ${currentRank.name}!</div>`;
  document.getElementById("btn-return").style.display = "none";
  updateScreen(); showScreen("battle-screen");
}

function returnToMenu() { 
  updateMenuProfile();
  showScreen("main-screen"); 
}

function playTurn(playerChoice) {
  if (gameIsOver) return;
  let logMsg = "";
  
  if (player.poisoned) { player.hp -= 1; logMsg += `<span class="text-dmg">☠️ Яд (Преследование) наносит вам 1 урон!</span><br>`; }
  if (bot.poisoned) { bot.hp -= 1; logMsg += `<span class="text-heal">☠️ Яд (Преследование) наносит врагу 1 урон!</span><br>`; }

  logMsg += processHoT(player, bot, REAL_PLAYER_NAME, "Враг");
  logMsg += processHoT(bot, player, "Враг", REAL_PLAYER_NAME);

  let botChoice = bot.skillReady ? 'skill' : (Math.random() < 0.5 ? 'attack' : 'defend');

  let pAttack = rollDice(); let pBlock = rollDice();
  let bAttack = rollDice(); let bBlock = rollDice();
  let pIgnore = false; let pDouble = false; let pInvul = false;
  let bIgnore = false; let bDouble = false; let bInvul = false;

  if (playerChoice === 'skill') {
    player.skillReady = false; playerChoice = 'attack';
    logMsg += `<span class="text-skill">🌟 Вы применяете "${CLASSES[player.classId].activeName}"!</span><br>`;
    if (player.classId === 'warrior') pIgnore = true;
    if (player.classId === 'assassin') pDouble = true;
    if (player.classId === 'guardian') pInvul = true;
    if (player.classId === 'priest') player.hotTurnsLeft = 2;
  }
  if (botChoice === 'skill') {
    bot.skillReady = false; botChoice = 'attack';
    logMsg += `<span class="text-skill">⚠️ Враг применяет "${CLASSES[bot.classId].activeName}"!</span><br>`;
    if (bot.classId === 'warrior') bIgnore = true;
    if (bot.classId === 'assassin') bDouble = true;
    if (bot.classId === 'guardian') bInvul = true;
    if (bot.classId === 'priest') bot.hotTurnsLeft = 2;
  }

  let pBonus = 0; let bBonus = 0;
  if (player.classId === 'warrior' && player.hp <= 6) { pBonus += 2; logMsg += `<span class="text-skill">🔥 Берсерк: Ваша атака +2!</span><br>`; }
  if (bot.classId === 'warrior' && bot.hp <= 6) { bBonus += 2; logMsg += `<span class="text-skill">🔥 Берсерк: Атака врага +2!</span><br>`; }
  
  if (player.classId === 'guardian' && player.retBonus > 0 && playerChoice === 'attack' && !pInvul) { pBonus += player.retBonus; logMsg += `<span class="text-skill">⚡ Возмездие: Ваша атака +${player.retBonus}!</span><br>`; player.retBonus = 0; player.retBlocks = 0; }
  if (bot.classId === 'guardian' && bot.retBonus > 0 && botChoice === 'attack' && !bInvul) { bBonus += bot.retBonus; logMsg += `<span class="text-skill">⚡ Возмездие: Атака врага +${bot.retBonus}!</span><br>`; bot.retBonus = 0; bot.retBlocks = 0; }

  pAttack += pBonus; bAttack += bBonus;
  if (pDouble) pAttack *= 2; if (bDouble) bAttack *= 2;

  if (playerChoice === 'attack' && botChoice === 'attack') {
    let pDmgTaken = bAttack; let bDmgTaken = pAttack;
    if (player.classId === 'assassin' && player.hp <= 4 && !player.usedInstinct) { pDmgTaken = 0; player.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт выживания: Вы уклонились!</span><br>`; }
    if (bot.classId === 'assassin' && bot.hp <= 4 && !bot.usedInstinct) { bDmgTaken = 0; bot.usedInstinct = true; logMsg += `<span class="text-info">🌑 Инстинкт выживания: Враг уклонился!</span><br>`; }
    if (pInvul) pDmgTaken = 0; if (bInvul) bDmgTaken = 0;

    logMsg += `⚔️ Встречная атака! Вы бьете (${pAttack}), Враг бьет (${bAttack}).<br>`;
    if (bDmgTaken > 0) logMsg += applyDamage(bot, player, bDmgTaken, "Враг");
    if (pDmgTaken > 0) logMsg += applyDamage(player, bot, pDmgTaken, REAL_PLAYER_NAME);

  } else if (playerChoice === 'defend' && botChoice === 'defend') {
    logMsg += `<span class="text-block">🛡️ Оба приготовились к защите. Никто не получил урона.</span>`;
  } else if (playerChoice === 'attack' && botChoice === 'defend') {
    logMsg += resolveCombat(player, bot, pAttack, (pIgnore ? 0 : bBlock), REAL_PLAYER_NAME, "Враг", pIgnore, pDouble);
  } else if (playerChoice === 'defend' && botChoice === 'attack') {
    logMsg += resolveCombat(bot, player, bAttack, (bIgnore ? 0 : pBlock), "Враг", REAL_PLAYER_NAME, bIgnore, bDouble);
  }

  if (player.classId === 'warrior' && player.hp > 0 && player.hp < 10) { player.hp += 1; logMsg += `<span class="text-heal">🩸 Боевой раж восстанавливает вам 1 ХП.</span><br>`; }
  if (bot.classId === 'warrior' && bot.hp > 0 && bot.hp < 10) { bot.hp += 1; logMsg += `<span class="text-dmg">🩸 Боевой раж восстанавливает врагу 1 ХП.</span><br>`; }

  checkSkills(player, bot, "Вы"); checkSkills(bot, player, "Враг");
  logToScreen(logMsg); updateScreen(); checkWinner();
}

function processHoT(healer, target, hName, tName) {
  let msg = "";
  if (healer.hotTurnsLeft > 0) {
    healer.hp += 2; if (healer.hp > healer.maxHp) healer.hp = healer.maxHp;
    healer.hotTurnsLeft--;
    msg += `💖 <i>${hName} лечит <span class="text-heal">2 ХП</span> от Силы жизни.</i><br>`;
    if (healer.classId === 'priest') {
      target.hp -= 2; msg += `🌟 Обжигающий свет наносит ${tName} <span class="text-dmg">2 урона</span>!<br>`;
    }
  }
  return msg;
}

function resolveCombat(atkChar, defChar, atkRoll, defBlock, atkName, defName, ignoredBlock, doubleDmg) {
  let res = `🗡️ ${atkName} бьет (${atkRoll}), блок: ${ignoredBlock ? '0 (Пробит)' : defBlock}.<br>`;
  if (defChar.classId === 'assassin' && defChar.hp <= 4 && !defChar.usedInstinct) {
    defChar.usedInstinct = true; return res + `<span class="text-info">🌑 Инстинкт выживания: ${defName} уклоняется от атаки!</span>`;
  }
  if (atkRoll > defBlock || ignoredBlock) {
    let dmg = ignoredBlock ? atkRoll : (atkRoll - defBlock);
    res += applyDamage(defChar, atkChar, dmg, defName);
  } else if (atkRoll === defBlock) {
    res += `<span class="text-block">Идеальный блок!</span><br>`;
    atkChar.stats.dmgBlocked += atkRoll; defChar.stats.dmgBlocked += defBlock;
    res += processCounter(defChar, atkChar, defName, atkName);
    processRetribution(defChar, defBlock);
  } else {
    let heal = defBlock - atkRoll;
    defChar.hp += heal; if (defChar.hp > defChar.maxHp) defChar.hp = defChar.maxHp;
    defChar.stats.healed += heal; defChar.stats.dmgBlocked += atkRoll;
    res += `✨ Избыточный блок! ${defName} лечит <span class="text-heal">${heal} ХП</span>.<br>`;
    res += processCounter(defChar, atkChar, defName, atkName);
    processRetribution(defChar, atkRoll);
    if (defChar.classId === 'priest') { atkChar.hp -= heal; res += `🌟 Обжигающий свет наносит ${atkName} <span class="text-dmg">${heal} урона</span>!<br>`; }
  }
  return res;
}

function applyDamage(target, attacker, dmg, tName) {
  let res = `💥 ${tName} получает <span class="text-dmg">${dmg} урона</span>.<br>`;
  target.hp -= dmg; attacker.stats.dmgDealt += dmg;
  if (attacker.classId === 'assassin') attacker.pursuitDmg += dmg;
  if (target.classId === 'priest' && target.hp <= 8 && target.hp > 0 && !target.usedPrayer) {
    target.usedPrayer = true; let heal = Math.min(6, target.maxHp - target.hp); target.hp += heal;
    res += `🙏 <span class="text-heal">Молитва восстанавливает ${tName} ${heal} ХП!</span><br>`;
  }
  return res;
}

function processCounter(defChar, atkChar, defName, atkName) {
  if (defChar.classId === 'guardian') { atkChar.hp -= 1; return `🗡️ <span class="text-info">Контратака наносит ${atkName} 1 урон!</span><br>`; }
  return "";
}

function processRetribution(defChar, blockedAmt) {
  if (defChar.classId === 'guardian') {
    defChar.retBlocks += blockedAmt;
    while(defChar.retBlocks >= 2 && defChar.retBonus < 5) { defChar.retBlocks -= 2; defChar.retBonus += 1; }
  }
}

function checkSkills(char, target, name) {
  let info = CLASSES[char.classId];
  if (!char.skillReady && char.stats[info.reqType] >= info.reqAmt) {
    char.skillReady = true; char.stats[info.reqType] = 0;
  }
  if (char.classId === 'assassin' && char.pursuitDmg >= 13 && !target.poisoned) {
    target.poisoned = true; logToScreen(`<span class="text-info">☠️ Преследование! ${name === REAL_PLAYER_NAME ? "Враг отравлен" : "Вы отравлены"}!</span>`);
  }
}

function buildSkillHtml(char) {
  let info = CLASSES[char.classId]; let pct = Math.min(100, (char.stats[info.reqType] / info.reqAmt) * 100);
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

function updateScreen() {
  if (player.hp < 0) player.hp = 0; if (bot.hp < 0) bot.hp = 0;
  
  let pRank = getRank(playerLp);
  let bRank = getRank(bot.lp);

  document.getElementById("ui-player-name").innerText = `${REAL_PLAYER_NAME} (${player.className})`;
  document.getElementById("ui-player-rank").innerText = `${pRank.icon} ${playerLp} LP`;
  
  document.getElementById("ui-bot-name").innerText = `Враг (${bot.className})`;
  document.getElementById("ui-bot-rank").innerText = `${bRank.icon} ${bot.lp} LP`;

  document.getElementById("ui-player-hp-fill").style.width = (player.hp / player.maxHp) * 100 + "%";
  document.getElementById("ui-player-hp-text").innerText = `${player.hp} / ${player.maxHp} ХП`;
  document.getElementById("ui-bot-hp-fill").style.width = (bot.hp / bot.maxHp) * 100 + "%";
  document.getElementById("ui-bot-hp-text").innerText = `${bot.hp} / ${bot.maxHp} ХП`;
  
  document.getElementById("ui-player-skills").innerHTML = buildSkillHtml(player);
  document.getElementById("ui-bot-skills").innerHTML = buildSkillHtml(bot);

  if (player.skillReady && !gameIsOver) {
    document.getElementById("btn-attack").style.display = "none"; document.getElementById("btn-defend").style.display = "none";
    document.getElementById("btn-skill").style.display = "block"; document.getElementById("btn-skill").innerText = `✨ Применить: ${CLASSES[player.classId].activeName}!`;
  } else if (!gameIsOver) {
    document.getElementById("btn-attack").style.display = "block"; document.getElementById("btn-defend").style.display = "block"; document.getElementById("btn-skill").style.display = "none";
  }
}

function logToScreen(msg) { document.getElementById("combat-log").innerHTML = `<div class='log-entry'>${msg}</div>` + document.getElementById("combat-log").innerHTML; }

function checkWinner() {
  if (player.hp <= 0 || bot.hp <= 0) {
    gameIsOver = true; document.getElementById("btn-attack").style.display = "none"; document.getElementById("btn-defend").style.display = "none";
    document.getElementById("btn-skill").style.display = "none"; document.getElementById("btn-return").style.display = "block";
    
    let endMsg = "";
    if (player.hp <= 0 && bot.hp <= 0) {
      endMsg = "<span class='text-skill'>💀 НИЧЬЯ! Оба бойца пали на арене. (LP не изменились)</span>";
    } else if (player.hp <= 0) {
      playerLp = Math.max(0, playerLp - 15);
      endMsg = `<span class='text-dmg'>💀 ВЫ ПРОИГРАЛИ!</span> <span class="lp-loss">(-15 LP)</span>`;
    } else {
      playerLp += 25;
      endMsg = `<span class='text-heal'>🏆 ВЫ ПОБЕДИЛИ!</span> <span class="lp-gain">(+25 LP)</span>`;
      tg.HapticFeedback.notificationOccurred('success'); // Телеграм виброотклик!
    }
    
    // Сохраняем в память устройства
    localStorage.setItem('middleEarthLp', playerLp);
    logToScreen(endMsg);
  }
}
