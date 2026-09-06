// ============================================================
// GACHA UI — MYTHIC & TOP10
// Награды топ-10, блок и модалка мифической рулетки.
// ============================================================

function grantTop10Rewards(place) {
  let rewards = [];

  // Рамка Золото Валинора — всем топ-10
  if (!gameData.unlockedFrames) gameData.unlockedFrames = [];
  if (!gameData.unlockedFrames.includes('valinor')) {
    gameData.unlockedFrames.push('valinor');
    rewards.push({ icon: '✨', text: 'Рамка «Золото Валинора»' });
  }

  // Эффект Нисхождение — всем топ-10
  if (!gameData.unlockedEffects) gameData.unlockedEffects = [];
  if (!gameData.unlockedEffects.includes('slide')) {
    gameData.unlockedEffects.push('slide');
    rewards.push({ icon: '🌟', text: 'Эффект «Нисхождение»' });
  }

  // Золотой эффект победы — всем топ-10
  if (!gameData.unlockedVictoryEffects.includes('gold')) {
    gameData.unlockedVictoryEffects.push('gold');
    rewards.push({ icon: '✨', text: 'Эффект победы «Золотой взрыв»' });
  }

  // Бонус Лунных камней за место (1-е — 2000, 2-3 — 1500, 4-10 — 1000)
  let stones = place === 1 ? 2000 : place <= 3 ? 1500 : 1000;
  gameData.lunarStones += stones;
  rewards.push({ icon: '💠', text: `+${stones} Лунных камней` });

  saveData();

  // Показываем модалку с наградами
  if (rewards.length === 0) return;
  let rewardsHtml = rewards.map(r => `
    <div style="display:flex;align-items:center;gap:10px;background:rgba(30,41,59,0.7);border:1px solid #fde68a44;border-radius:10px;padding:10px 14px;margin-bottom:8px;">
      <span style="font-size:22px;">${r.icon}</span>
      <span style="font-size:14px;color:#fde68a;font-weight:700;">${r.text}</span>
    </div>`).join('');

  let placeLabel = place === 1 ? '🥇 1-е место' : place === 2 ? '🥈 2-е место' : place === 3 ? '🥉 3-е место' : `#${place} место`;
  document.getElementById('modal-title').innerHTML = `🏆 Топ-10 — ${placeLabel}`;
  document.getElementById('modal-title').className = 'text-legendary';
  document.getElementById('modal-desc').innerHTML = `
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:36px;margin-bottom:8px;">🏆</div>
      <div style="font-size:13px;color:#fde68a;font-weight:700;letter-spacing:1px;">ЭКСКЛЮЗИВНЫЕ НАГРАДЫ РЕЙТИНГА</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px;">Только для игроков глобального топ-10</div>
    </div>
    ${rewardsHtml}`;
  document.getElementById('modal-actions').innerHTML = `<button class="action-btn" style="width:100%;background:linear-gradient(135deg,#78350f,#fbbf24);" onclick="closeModal()">Забрать награды</button>`;
  document.getElementById('item-modal').style.display = 'flex';
}

// Тестовая команда (убрать перед продом): в консоли написать testTop10(1)
window.testTop10 = function(place) { grantTop10Rewards(place || 1); };

function renderMythicGachaBlock() {
  let el = document.getElementById('mythic-gacha-block');
  if (!el) return;

  // Находим единственную активную мифическую рулетку (hidden: false)
  let pool = Object.values(MYTHIC_GACHA_POOLS).find(p => !p.hidden);
  if (!pool) { el.innerHTML = ''; return; }

  let classId = pool.classId;
  let mt = gameData.mythicTitles[classId] || { unlocked: [], active: null };
  let spins = gameData.mythicGachaSpinCount[pool.id] || 0;
  let pityLeft = 100 - spins;

  let rarityColors = { uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', mythic:'#ef4444' };
  let titlesHtml = ['uncommon','rare','epic','mythic'].map(r => {
    let t = pool.titles[r];
    let unlocked = r === 'mythic' ? mt.unlocked.includes('mythic') : mt.unlocked.includes(r);
    let col = rarityColors[r];
    let pct = { uncommon:'15%', rare:'7%', epic:'2%', mythic:'0.2%' }[r];
    let displayName = unlocked ? t.name : '???';
    let textColor = unlocked ? (r === 'mythic' ? '#fca5a5' : '#f1f5f9') : '#334155';
    return `<div style="background:rgba(40,10,10,0.7); border-radius:8px; padding:8px; border:1px solid ${unlocked ? col+'55' : '#1e293b'};">
      <div style="font-size:9px; color:${col}; font-weight:bold;">${t.label.toUpperCase()} · ${pct}</div>
      <div style="font-size:11px; color:${textColor}; margin-top:2px;">${displayName}</div>
      ${unlocked ? `<div style="font-size:9px; color:${col}; margin-top:2px;">✓ Выбито</div>` : ''}
    </div>`;
  }).join('');

  let frameUnlocked = gameData.unlockedFrames && gameData.unlockedFrames.includes(pool.frame.id);
  let effectUnlocked = gameData.unlockedEffects && gameData.unlockedEffects.includes(pool.entryEffect.id);
  let cosmHtml = `
    <div style="background:rgba(40,10,10,0.7); border-radius:8px; padding:8px; border:1px solid ${frameUnlocked ? '#ef444455' : '#1e293b'};">
      <div style="font-size:9px; color:#ef4444; font-weight:bold;">РАМКА · 0.4%</div>
      <div style="font-size:11px; color:${frameUnlocked ? '#f1f5f9' : '#334155'}; margin-top:2px;">${frameUnlocked ? pool.frame.name : '???'}</div>
      ${frameUnlocked ? '<div style="font-size:9px; color:#ef4444; margin-top:2px;">✓ Выбито</div>' : ''}
    </div>
    <div style="background:rgba(40,10,10,0.7); border-radius:8px; padding:8px; border:1px solid ${effectUnlocked ? '#ef444455' : '#1e293b'};">
      <div style="font-size:9px; color:#ef4444; font-weight:bold;">ЭФФЕКТ · 0.4%</div>
      <div style="font-size:11px; color:${effectUnlocked ? '#f1f5f9' : '#334155'}; margin-top:2px;">${effectUnlocked ? pool.entryEffect.name : '???'}</div>
      ${effectUnlocked ? '<div style="font-size:9px; color:#ef4444; margin-top:2px;">✓ Выбито</div>' : ''}
    </div>`;

  el.innerHTML = `
  <div style="
    border:2px solid #7f0000;
    border-radius:14px;
    overflow:hidden;
    margin-bottom:16px;
    background: linear-gradient(160deg, #0d0202, #1a0505);
    box-shadow: 0 0 28px rgba(220,38,38,0.25), 0 0 60px rgba(127,0,0,0.12);
    position:relative;
  ">
    <!-- Верхний блик -->
    <div style="position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg, transparent, rgba(239,68,68,0.6), rgba(220,38,38,0.9), rgba(239,68,68,0.6), transparent); pointer-events:none;"></div>

    <!-- Заголовок -->
    <div style="background:linear-gradient(135deg, rgba(127,0,0,0.4), rgba(60,0,0,0.6)); padding:16px; border-bottom:1px solid #7f000066; position:relative;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="font-size:9px; color:#ef4444; font-weight:900; letter-spacing:2px; text-transform:uppercase; background:rgba(220,38,38,0.15); border:1px solid rgba(220,38,38,0.4); border-radius:20px; padding:2px 8px;">✦ Мифическая рулетка</span>
          </div>
          <div style="font-size:15px; font-weight:900; color:#fca5a5; text-shadow:0 0 12px rgba(239,68,68,0.6); margin-bottom:3px;">${pool.icon} ${pool.name}</div>
          <div style="font-size:11px; color:#7f1d1d; font-style:italic;">"${pool.tagline}"</div>
        </div>
        <div style="text-align:right; flex-shrink:0; margin-left:10px;">
          <div style="font-size:10px; color:#7f1d1d;">Гарант</div>
          <div style="font-size:20px; font-weight:900; color:${pityLeft <= 15 ? '#ef4444' : '#7f1d1d'};">${pityLeft}</div>
        </div>
      </div>
    </div>

    <!-- Титулы -->
    <div style="padding:12px 16px; display:grid; grid-template-columns:1fr 1fr; gap:6px; border-bottom:1px solid #1e293b;">
      ${titlesHtml}
    </div>

    <!-- Рамка + Эффект -->
    <div style="padding:10px 16px 0; display:grid; grid-template-columns:1fr 1fr; gap:6px; border-bottom:1px solid #1e293b; padding-bottom:10px;">
      ${cosmHtml}
    </div>

    <!-- Кнопка -->
    <div style="padding:14px 16px;">
      <button onclick="openMythicGachaModal('${pool.id}')"
        style="width:100%; background:linear-gradient(135deg,#7f0000,#dc2626,#7f0000); background-size:200% 100%; border:none; border-radius:10px; padding:14px; color:white; font-size:15px; font-weight:900; cursor:pointer; letter-spacing:0.5px; box-shadow:0 0 16px rgba(220,38,38,0.5); animation:legendary-shimmer 3s linear infinite;">
        🎲 Крутить — ${pool.cost} 💠
      </button>
      <div style="text-align:center; margin-top:6px; font-size:11px; color:#7f1d1d;">
        Открыто: ${mt.unlocked.length}/4 тит. · ${frameUnlocked ? '🖼️' : '🔒'} рамка · ${effectUnlocked ? '✨' : '🔒'} эффект · Гарант через ${pityLeft} кр.
      </div>
    </div>
  </div>`;
}

function openMythicGachaModal(gachaId) {
  let pool = MYTHIC_GACHA_POOLS[gachaId];
  if (!pool) return;
  if (gameData.lunarStones < pool.cost) {
    showCodeResult(`❌ Нужно ${pool.cost} 💠!`, false); return;
  }
  document.getElementById('modal-title').innerHTML = `${pool.icon} ${pool.name}`;
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = `
    <div style="text-align:center; padding:30px 0;">
      <div class="gacha-spin-anim" style="filter:drop-shadow(0 0 12px rgba(220,38,38,0.8));">🎲</div>
      <div style="color:#7f1d1d; font-size:13px; margin-top:12px;">Врата открываются...</div>
    </div>`;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';

  setTimeout(() => {
    let res = rollMythicGacha(gachaId);
    if (!res) { closeModal(); return; }
    showMythicGachaResult(res);
    renderPremiumShop();
  }, 900);
}

function showMythicGachaResult(res) {
  let { result, isGuaranteed, pool, spinsLeft } = res;
  let mainHtml = '';

  if (result.type === 'mythic_title' || result.type === 'title') {
    let rarityColors = { uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', mythic:'#ef4444' };
    let labels = { uncommon:'Необычный', rare:'Редкий', epic:'Эпический', mythic:'✦ Мифический' };
    let rarity = result.type === 'mythic_title' ? 'mythic' : result.rarity;
    let color = rarityColors[rarity];
    let titleHtml = getTitleHtml(rarity, result.value);
    let isDup = !!result.dupComp;
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        ${isGuaranteed ? '<div style="color:#ef4444; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✦ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✦</div>' : ''}
        ${isDup ? '<div style="color:#f59e0b; font-size:11px; letter-spacing:1px; font-weight:bold; margin-bottom:8px;">↩️ ДУБЛЬ — КОМПЕНСАЦИЯ</div>' : ''}
        <div style="font-size:48px; margin-bottom:12px; animation:gacha-pop 0.4s ease-out;">${isDup ? '↩️' : '👑'}</div>
        <div style="font-size:11px; color:${color}; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">${labels[rarity]} ТИТУЛ</div>
        <div style="font-size:20px; font-weight:900; margin-bottom:8px; margin-top:6px;">${titleHtml}</div>
        ${isDup
          ? `<div style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b44; border-radius:8px; padding:8px 14px; font-size:14px; color:#fbbf24; font-weight:bold; margin-bottom:12px;">Компенсация: ${result.dupComp}</div>`
          : `<div style="font-size:12px; color:#64748b; margin-bottom:12px;">Выберите титул: <b style="color:#94a3b8;">Герой → 👑 Активный титул</b></div>`}
      </div>`;
  } else if (result.type === 'frame') {
    let isDup = !!result.dupComp;
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        ${isGuaranteed ? '<div style="color:#ef4444; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✦ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✦</div>' : ''}
        ${isDup ? '<div style="color:#f59e0b; font-size:11px; margin-bottom:8px; font-weight:bold;">↩️ ДУБЛЬ — КОМПЕНСАЦИЯ</div>' : ''}
        <div style="font-size:48px; margin-bottom:12px; animation:gacha-pop 0.4s ease-out;">🖼️</div>
        <div style="font-size:11px; color:#ef4444; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">РАМКА КАРТОЧКИ</div>
        <div style="font-size:20px; font-weight:900; color:#fca5a5;">${result.value}</div>
        ${isDup ? `<div style="margin-top:10px; color:#fbbf24; font-weight:bold;">${result.dupComp}</div>` : '<div style="font-size:12px; color:#64748b; margin-top:8px;">Активируй: Герой → 🖼️ Рамка карточки</div>'}
      </div>`;
  } else if (result.type === 'effect') {
    let isDup = !!result.dupComp;
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        ${isGuaranteed ? '<div style="color:#ef4444; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✦ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✦</div>' : ''}
        ${isDup ? '<div style="color:#f59e0b; font-size:11px; margin-bottom:8px; font-weight:bold;">↩️ ДУБЛЬ — КОМПЕНСАЦИЯ</div>' : ''}
        <div style="font-size:48px; margin-bottom:12px; animation:gacha-pop 0.4s ease-out;">✨</div>
        <div style="font-size:11px; color:#ef4444; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">ЭФФЕКТ ПОЯВЛЕНИЯ</div>
        <div style="font-size:20px; font-weight:900; color:#fca5a5;">${result.value}</div>
        ${isDup ? `<div style="margin-top:10px; color:#fbbf24; font-weight:bold;">${result.dupComp}</div>` : '<div style="font-size:12px; color:#64748b; margin-top:8px;">Активируй: Герой → ✨ Эффект появления</div>'}
      </div>`;
  } else if (result.type === 'comp_all') {
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        <div style="color:#ef4444; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✦ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✦</div>
        <div style="font-size:48px; margin-bottom:12px;">💠</div>
        <div style="font-size:14px; color:#67e8f9; font-weight:bold;">Всё уже получено!</div>
        <div style="font-size:20px; font-weight:900; color:#fbbf24; margin-top:8px;">+1000 💠 компенсация</div>
      </div>`;
  } else if (result.type === 'imperials') {
    mainHtml = `<div style="text-align:center; padding:10px 0 20px;"><div style="font-size:48px; margin-bottom:12px;">🪙</div><div style="font-size:28px; font-weight:900; color:#fbbf24;">${result.value.toLocaleString()} 🪙</div></div>`;
  } else if (result.type === 'key') {
    mainHtml = `<div style="text-align:center; padding:10px 0 20px;"><div style="font-size:48px; margin-bottom:12px;">🗝️</div><div style="font-size:22px; font-weight:900; color:#fbbf24;">${result.keyName}</div></div>`;
  } else {
    mainHtml = `<div style="text-align:center; padding:10px 0 20px;"><div style="font-size:48px; margin-bottom:12px;">💨</div><div style="font-size:14px; color:#475569;">Ничего...</div></div>`;
  }

  document.getElementById('modal-desc').innerHTML = `
    ${mainHtml}
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.8); border-radius:10px; padding:10px 14px; margin-top:8px;">
      <span style="font-size:12px; color:#64748b;">До гаранта: <b style="color:#94a3b8;">${spinsLeft}</b></span>
      <span style="font-size:12px; color:#64748b;">Баланс: <b style="color:#67e8f9;">${gameData.lunarStones} 💠</b></span>
    </div>`;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:linear-gradient(135deg,#7f0000,#dc2626); flex:1; margin-right:6px;" onclick="closeModal(); openMythicGachaModal('${pool.id}')">🎲 Ещё раз</button>
    <button class="action-btn" style="background:#334155; flex:0; padding:12px 16px;" onclick="closeModal()">✕</button>`;
}

