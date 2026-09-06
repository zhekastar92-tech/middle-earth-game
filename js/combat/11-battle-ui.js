// ============================================================
// BATTLE UI
// Отрисовка панелей навыков, обновление экрана боя, боевой лог.
// ============================================================

function buildSkillHtml(char) {
  if (char.isMob) {
    // Отображение для моба
    let abilitiesDesc = char.abilities.map(a => {
      if (a === 'disease') return char.diseaseActive ? `<span style="color:#ef4444">🦠 Болезнь (${char.diseaseTurnsLeft})</span>` : `🦠 Болезнь`;
      if (a === 'fate') return char.fateActive ? `<span style="color:#ef4444">😶 Судьба (${char.fateTurnsLeft})</span>` : `😶 Судьба`;
      if (a === 'submit') return char.submitActive ? `<span style="color:#ef4444">😡 Подчинись (${char.submitTurnsLeft})</span>` : `😡 Подчинись`;
      if (a === 'notover') return char.notoverUsed ? (char.notoverHotLeft > 0 ? `<span style="color:#10b981">💜 Возрождение (${char.notoverHotLeft})</span>` : `💜 Исчерпано`) : `💜 Не конец`;
      if (a === 'bite') return char.biteReady ? `<span style="color:#ef4444">🦖 Укус (готов!)</span>` : `🦖 Укус`;
      if (a === 'hiss') return char.hissActive ? `<span style="color:#ef4444">🐉 Щит (${char.hissTurnsLeft})</span>` : `🐉 Щит`;
      if (a === 'rage_hot') return char.rageHotActive ? `<span style="color:#10b981">🐉 Ярость (+1ХП/ход)</span>` : `🐉 Ярость`;
      if (a === 'water_blast') return char.waterBlastUsed ? (char.waterBlastActive ? `<span style="color:#ef4444">🌊 Устрашение (${char.waterBlastTurnsLeft})</span>` : `🌊 Исчерпано`) : `🌊 Мощь воды`;
      if (a === 'stone_skin') return char.stoneSkinReflect ? `<span style="color:#94a3b8">🗿 Кожа (${char.stoneSkinReflect} отраж.)</span>` : `🗿 Каменная кожа`;
      if (a === 'doom') return char.doomActive ? `<span style="color:#ef4444">💀 Погибель (${char.doomTurnsLeft})</span>` : `💀 Погибель`;
      if (a === 'summon_slave') return char.summonUsed ? (char.summonActive ? `<span style="color:#ef4444">👳🏻‍♂️ Раб в бою!</span>` : `👳🏻‍♂️ Исчерпано`) : `👳🏻‍♂️ Призыв`;
      if (a === 'suppress') return char.suppressActive ? `<span style="color:#ef4444">😵 Угнетение (${char.suppressTurnsLeft})</span>` : `😵 Угнетение`;
      return a;
    }).join('<br>');
    return `<div class="skill-slot"><div class="skill-slot-title">${char.icon} ${char.name}</div><div class="skill-progress-text" style="color:#9ca3af; font-size:9px;">${abilitiesDesc || 'Нет умений'}</div></div>`;
  }

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
  if (char.classId === 'warrior') { p1State = char.hp <= 6 ? "Активно" : "Не активно"; p2State = char.hp <= 6 ? "Активно" : "Не активно"; }
  if (char.classId === 'assassin') {
    p1State = char.usedInstinct ? "ИСЧЕРПАН" : (char.hp <= 4 ? "ГОТОВ" : "");
    let currentDmg = Math.min(char.pursuitDmg, 13);
    p2State = char.poisoned ? "АКТИВНО" : `${currentDmg}/13`;
  }
  if (char.classId === 'guardian') { p1State = ""; p2State = `${char.retBlocks}/2 | Бонус: +${char.retBonus}`; }
  if (char.classId === 'priest') { p1State = char.usedPrayer ? "ИСЧЕРПАН" : ""; p2State = ""; }
  if (char.classId === 'darkknight') { p1State = char.courageThresholdDown ? "<span style='color:#ef4444'>Усиленный</span>" : "Обычный"; p2State = char.usedImmortality ? (char.immortalTurns > 0 ? "АКТИВНО" : "ИСЧЕРПАН") : "ГОТОВ"; }
  html += `<div class="skill-slot" style="opacity:0.8"><div class="skill-slot-title">🔵 ${info.p1}</div><div class="skill-progress-text" style="color:#9ca3af">${p1State}</div></div>`;
  html += `<div class="skill-slot" style="opacity:0.8"><div class="skill-slot-title">🔴 ${info.p2}</div><div class="skill-progress-text" style="color:#9ca3af">${p2State}</div></div>`;
  return html;
}

function updateScreen() {
  if (player.hp < 0) player.hp = 0; if (bot.hp < 0) bot.hp = 0;
  let pRank = getRank(gameData.lp);

  let playerTitle = getActiveTitle(player.classId);
  document.getElementById("ui-player-name").innerText = getPlayerName();
  document.getElementById("ui-player-name").className = "char-name " + (pRank.textClass || "");
  let playerSubEl = document.getElementById("ui-player-sub");
  if (playerSubEl) {
    let newPlayerSubHtml = playerTitle ? getTitleHtml(playerTitle.rarity, playerTitle.name) : `<span style="color:#64748b;">${player.className}</span>`;
    if (playerSubEl.innerHTML !== newPlayerSubHtml) playerSubEl.innerHTML = newPlayerSubHtml;
  }
  document.getElementById("ui-player-rank").innerHTML = (pRank.iconClass ? `<span class="${pRank.iconClass}">${pRank.icon}</span> ` : `${pRank.icon} `) + (pRank.textClass ? `<span class="${pRank.textClass}">${gameData.lp} LP</span>` : `${gameData.lp} LP`);

  if (bot.isMob) {
    let iconBg = '';
    if (bot.tier === 'elite') {
      iconBg = 'background: linear-gradient(135deg, #f59e0b, #fde68a, #b45309); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 0 6px rgba(245,158,11,0.7));';
    } else if (bot.tier === 'boss') {
      iconBg = 'background: linear-gradient(135deg, #dc2626, #7f1d1d, #ef4444, #991b1b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 0 10px rgba(220,38,38,0.9));';
    }
    document.getElementById("ui-bot-name").innerHTML = iconBg
      ? `<span style="${iconBg} font-size:18px;">${bot.icon}</span> ${bot.name}`
      : `${bot.icon} ${bot.name}`;
    document.getElementById("ui-bot-name").className = "char-name";
    let mobSubEl = document.getElementById("ui-bot-sub");
    if (mobSubEl) mobSubEl.innerHTML = '';
    let tierLabel = bot.tier === 'boss' ? '👑 БОСС' : (bot.tier === 'elite' ? '⭐ Элитный' : 'Обычный');
    document.getElementById("ui-bot-rank").innerHTML = tierLabel;
  } else {
    let bRank = getRank(bot.lp);
    document.getElementById("ui-bot-name").innerText = currentBotName;
    document.getElementById("ui-bot-name").className = "char-name " + (bRank.textClass || "");
    let botSubEl = document.getElementById("ui-bot-sub");
    if (botSubEl) {
      let newBotSubHtml = bot.activeTitle ? getTitleHtml(bot.activeTitle.rarity, bot.activeTitle.name) : `<span style="color:#64748b;">${bot.className}</span>`;
      if (botSubEl.innerHTML !== newBotSubHtml) botSubEl.innerHTML = newBotSubHtml;
    }
    document.getElementById("ui-bot-rank").innerHTML = (bRank.iconClass ? `<span class="${bRank.iconClass}">${bRank.icon}</span> ` : `${bRank.icon} `) + (bRank.textClass ? `<span class="${bRank.textClass}">${bot.lp} LP</span>` : `${bot.lp} LP`);
  }

  document.getElementById("ui-player-hp-fill").style.width = (player.hp / player.maxHp) * 100 + "%";
  document.getElementById("ui-player-hp-text").innerText = `${player.hp} / ${player.maxHp}`;
  document.getElementById("ui-bot-hp-fill").style.width = (bot.hp / bot.maxHp) * 100 + "%";
  document.getElementById("ui-bot-hp-text").innerText = `${bot.hp} / ${bot.maxHp}`;

  document.getElementById("ui-player-skills").innerHTML = buildSkillHtml(player);
  document.getElementById("ui-bot-skills").innerHTML = buildSkillHtml(bot);

  if (player.immortalTurns > 0 && !gameIsOver) {
    document.getElementById("btn-attack").style.display = "none"; document.getElementById("btn-defend").style.display = "none";
    document.getElementById("btn-skill").style.display = "none"; document.getElementById("btn-immortal").style.display = "block";
  } else if (player.skillReady && !gameIsOver) {
    document.getElementById("btn-attack").style.display = "none"; document.getElementById("btn-defend").style.display = "none";
    document.getElementById("btn-immortal").style.display = "none"; document.getElementById("btn-skill").style.display = "block";
  } else if (!gameIsOver) {
    document.getElementById("btn-attack").style.display = "block";
    // Скрываем блок если достигнут порог блоков подряд
    document.getElementById("btn-defend").style.display = player.blockStreak >= player.blockStreakMax ? "none" : "block";
    document.getElementById("btn-skill").style.display = "none"; document.getElementById("btn-immortal").style.display = "none";
  }
}

function logToScreen(msg) { document.getElementById("combat-log").innerHTML = `<div class='log-entry'>${msg}</div>` + document.getElementById("combat-log").innerHTML; }
