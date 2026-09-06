// ============================================================
// SCREENS & MAIN MENU
// Переключение вкладок, лидерборд (+симуляция ботов), главное меню, выбор класса.
// ============================================================

function switchTab(btn, tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  if (btn) btn.classList.add('active');
  else {
    let fallbackBtn = document.querySelector(`[onclick="switchTab(this, '${tabId}')"]`);
    if (fallbackBtn) fallbackBtn.classList.add('active');
  }
  if (tabId === 'tab-battle') renderMainMenu();
  if (tabId === 'tab-hero') updateHeroTab();
  if (tabId === 'tab-bag') updateBagTab();
  if (tabId === 'tab-arenas') renderArenas();
  if (tabId === 'tab-shop') renderShop();
  if (tabId === 'tab-leaderboard') renderLeaderboard();
  if (tabId === 'tab-dungeons') renderDungeons();
  if (tabId === 'tab-premium') renderPremiumShop();
  if (tabId === 'tab-settings') renderSettings();
}

// ============================================================
// ЛИДЕРБОРД
// ============================================================

function renderLeaderboard() {
  let allPlayers = [...gameData.leaderboard, { name: getPlayerName(), lp: gameData.lp, isPlayer: true }];
  allPlayers.sort((a, b) => b.lp - a.lp);
  let html = ''; let playerRank = -1;
  for (let i = 0; i < allPlayers.length; i++) { if (allPlayers[i].isPlayer) playerRank = i + 1; }
  for (let i = 0; i < 10 && i < allPlayers.length; i++) {
    let p = allPlayers[i];
    let rankIcon = (i === 0) ? '🥇' : (i === 1) ? '🥈' : (i === 2) ? '🥉' : `${i + 1}`;
    let pRank = getRank(p.lp);
    let nameClass = pRank.textClass ? `profile-name ${pRank.textClass}` : `profile-name`;
    let iconHtml = pRank.iconClass ? `<span class="${pRank.iconClass}">${pRank.icon}</span>` : pRank.icon;
    let textHtml = pRank.textClass ? `<span class="${pRank.textClass}">${pRank.name} | ${p.lp} LP</span>` : `${pRank.name} | ${p.lp} LP`;
    let borderStyle = p.isPlayer ? "border: 2px solid #e11d48; background: rgba(225, 29, 72, 0.2); box-shadow: 0 0 15px rgba(225, 29, 72, 0.4);" : "";
    html += `
    <div class="profile-header" style="margin-bottom: 10px; ${borderStyle}">
        <div style="display:flex; align-items:center; gap: 15px;">
            <div style="font-size: 20px; font-weight: 900; color: #fbbf24; width: 30px; text-align: center;">${rankIcon}</div>
            <div style="text-align: left;">
                <div class="${nameClass}">👤 ${p.name}</div>
                <div class="profile-rank">${iconHtml} ${textHtml}</div>
            </div>
        </div>
    </div>`;
  }
  if (playerRank > 10) {
    let displayRank = playerRank;
    if (playerRank === 51) {
      let lowestBotLp = allPlayers[49].lp;
      let gap = lowestBotLp - gameData.lp;
      if (gap > 500) { displayRank = "100+"; }
      else {
        let randomJitter = Math.floor(Math.random() * 4);
        displayRank = 50 + Math.floor(gap / 10) + randomJitter;
        if (displayRank > 100) displayRank = 100;
      }
    }
    let pRank = getRank(gameData.lp);
    let nameClass = pRank.textClass ? `profile-name ${pRank.textClass}` : `profile-name`;
    let iconHtml = pRank.iconClass ? `<span class="${pRank.iconClass}">${pRank.icon}</span>` : pRank.icon;
    let textHtml = pRank.textClass ? `<span class="${pRank.textClass}">${pRank.name} | ${gameData.lp} LP</span>` : `${pRank.name} | ${gameData.lp} LP`;
    html += `<div style="text-align: center; color: #94a3b8; font-weight: bold; margin: 15px 0; font-size: 20px;">...</div>`;
    html += `
    <div class="profile-header" style="margin-bottom: 10px; border: 2px solid #e11d48; background: rgba(225, 29, 72, 0.2); box-shadow: 0 0 15px rgba(225, 29, 72, 0.4);">
        <div style="display:flex; align-items:center; gap: 15px;">
            <div style="font-size: 20px; font-weight: 900; color: #fbbf24; min-width: 30px; text-align: center;">${displayRank}</div>
            <div style="text-align: left;">
                <div class="${nameClass}">👤 ${getPlayerName()}</div>
                <div class="profile-rank">${iconHtml} ${textHtml}</div>
            </div>
        </div>
    </div>`;
  }
  document.getElementById("leaderboard-content").innerHTML = html;
}

function simulateBots() {
  gameData.leaderboard.forEach((b, idx) => {
    // Проверяем: нужен ли буст (упал ниже 6500 и буст ещё не назначен)
    if (b.lp < 6500 && !gameData.botBoostWins[idx]) {
      gameData.botBoostWins[idx] = 100; // назначаем 100 бустовых боёв
    }

    let isBoosted = gameData.botBoostWins[idx] > 0;
    let winChance = isBoosted ? 0.90 : 0.50;
    let isWin = Math.random() < winChance;
    let change = Math.floor(Math.random() * 6) + 5;

    if (isWin) {
      b.lp += change;
    } else {
      b.lp = Math.max(0, b.lp - change);
    }

    // Тикаем счётчик буста
    if (isBoosted) {
      gameData.botBoostWins[idx]--;
      if (gameData.botBoostWins[idx] <= 0) {
        delete gameData.botBoostWins[idx]; // буст закончился
      }
    }
  });
}

// ============================================================
// ГЛАВНОЕ МЕНЮ
// ============================================================

function updateMenuProfile() {
  let rank = getRank(gameData.lp);
  let nameClass = rank.textClass ? ` class="profile-name ${rank.textClass}"` : ` class="profile-name"`;
  let iconHtml = rank.iconClass ? `<span class="${rank.iconClass}">${rank.icon}</span>` : rank.icon;
  let textHtml = rank.textClass ? `<span class="${rank.textClass}">${rank.name} | ${gameData.lp} LP</span>` : `${rank.name} | ${gameData.lp} LP`;
  document.getElementById("menu-profile").innerHTML = `<div${nameClass}>👤 ${getPlayerName()}</div><div class="profile-rank">${iconHtml} ${textHtml}</div>`;
}

function renderMainMenu() {
  updateMenuProfile();
  let arena = getArena(gameData.lp);
  let arenaHtml = `
    <div style="font-size: 40px; margin-bottom: 10px;">${arena.icon}</div>
    <div class="class-title" style="color: #fff; text-shadow: 0 0 5px rgba(0,0,0,0.8); font-size: 22px;">${arena.name}</div>
    <button class="btn-fight-huge" onclick="startGame()">⚔️ В БОЙ</button>
  `;
  let arenaCard = document.getElementById("menu-arena-display");
  arenaCard.className = "class-card " + arena.arenaClass;
  arenaCard.innerHTML = arenaHtml;
  let cls = CLASSES[gameData.currentClass];
  let classHtml = `
    <div style="text-align:left;">
      <div class="class-title" style="margin:0; font-size: 18px;">${cls.name}</div>
      <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">Нажмите, чтобы сменить</div>
    </div>
    <div style="font-size:24px;">🔄</div>
  `;
  document.getElementById("menu-class-display").innerHTML = classHtml;
  // Ежедневный подарок
  let giftEl = document.getElementById("menu-daily-gift");
  if (gameData.dailyGiftClaimed) {
    giftEl.innerHTML = `<div style="color:#64748b; font-size:13px; padding: 12px;">🎁 Ежедневный подарок — получен. Завтра будет новый!</div>`;
  } else if (gameData.dailyWins >= 5) {
    giftEl.innerHTML = `<button class="btn-fight-huge" style="font-size:14px; padding:12px;" onclick="claimDailyGift()">🎁 Забрать подарок!</button>`;
  } else {
    giftEl.innerHTML = `<div style="background:rgba(30,41,59,0.8); border:1px solid #475569; border-radius:12px; padding:12px; color:#94a3b8; font-size:13px;">🎁 Ежедневный подарок — ${gameData.dailyWins}/5 побед на арене</div>`;
  }
}

function openClassModal() {
  let html = '';
  Object.keys(CLASSES).forEach(key => {
    let c = CLASSES[key]; let isSelected = gameData.currentClass === key;
    html += `
      <div class="class-card ${isSelected ? 'border-emerald' : ''}" style="margin-bottom:10px; border-width:2px; text-align:left; background: rgba(30, 41, 59, 1);" onclick="selectClass('${key}')">
         <div class="class-title" style="display:flex; justify-content:space-between;">${c.name} ${isSelected ? '✅' : ''}</div>
         <div class="class-desc" style="font-size:10px;">${c.p1} | ${c.p2}</div>
      </div>
    `;
  });
  document.getElementById("class-modal-list").innerHTML = html;
  document.getElementById("class-modal").style.display = "flex";
}
function selectClass(key) { gameData.currentClass = key; saveData(); document.getElementById("class-modal").style.display = "none"; renderMainMenu(); }
function closeClassModal() { document.getElementById("class-modal").style.display = "none"; }
