// ============================================================
// GACHA UI — LEGENDARY
// Список и модалка легендарных рулеток титулов.
// ============================================================

function renderGachaList() {
  let el = document.getElementById('gacha-list');
  if (!el) return;
  let visible = Object.values(GACHA_POOLS).filter(g => !g.hidden);
  el.innerHTML = visible.map(g => {
    let spins = gameData.gachaSpinCount[g.id] || 0;
    let pityLeft = 100 - spins;
    let td = gameData.titles[g.classId] || { unlocked: [], active: null };
    let unlockedCount = td.unlocked.length;
    let hasLegendary = td.unlocked.includes('legendary');
    let isLegendaryPool = !!g.isLegendaryPool; // флаг золотого оформления
    let headerBg = isLegendaryPool
      ? 'background:linear-gradient(135deg, rgba(245,158,11,0.15), rgba(180,83,9,0.25))'
      : `background:linear-gradient(135deg, ${g.color}22, ${g.color}44)`;
    let nameStyle = isLegendaryPool
      ? 'class="gacha-legendary-title"'
      : `style="font-size:15px; font-weight:900; color:${g.color};"`;
    let cardBorder = isLegendaryPool
      ? 'border:1px solid #f59e0b; box-shadow: 0 0 18px rgba(245,158,11,0.35);'
      : `border:1px solid ${g.borderColor};`;

    return `
    <div class="gacha-card" style="${cardBorder} border-radius:14px; overflow:hidden; margin-bottom:12px; background:rgba(15,23,42,0.97);">
      <!-- Заголовок -->
      <div style="${headerBg}; padding:14px 16px; border-bottom:1px solid ${isLegendaryPool ? '#f59e0b44' : g.borderColor+'44'};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-size:11px; color:${isLegendaryPool ? '#fbbf24' : g.color}; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">✨ Рулетка</div>
            <div ${nameStyle}>${g.icon} ${g.name}</div>
            <div style="font-size:11px; color:#64748b; margin-top:3px; font-style:italic;">"${g.tagline}"</div>
          </div>
          <div style="text-align:right; flex-shrink:0; margin-left:10px;">
            <div style="font-size:10px; color:#475569;">Гарант</div>
            <div style="font-size:18px; font-weight:900; color:${pityLeft <= 10 ? '#fbbf24' : '#64748b'};">${pityLeft}</div>
          </div>
        </div>
      </div>
      <!-- Таблица дропа -->
      <div style="padding:12px 16px; display:grid; grid-template-columns:1fr 1fr; gap:6px; border-bottom:1px solid #1e293b;">
        ${['uncommon','rare','epic','legendary'].map(r => {
          let t = g.titles[r];
          let unlocked = td.unlocked.includes(r);
          // Легендарный всегда виден — он указан в названии рулетки
          let alwaysShow = r === 'legendary';
          let colors = { uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', legendary:'#f59e0b' };
          let pct = { uncommon:'15%', rare:'7%', epic:'2%', legendary:'0.4%' }[r];
          let displayName = (unlocked || alwaysShow) ? t.name : '???';
          let textColor = (unlocked || alwaysShow) ? (r === 'legendary' ? '#fbbf24' : '#f1f5f9') : '#334155';
          return `<div style="background:rgba(30,41,59,0.6); border-radius:8px; padding:8px; border:1px solid ${(unlocked || alwaysShow) ? colors[r]+'55' : '#1e293b'};">
            <div style="font-size:9px; color:${colors[r]}; font-weight:bold;">${t.label.toUpperCase()} · ${pct}</div>
            <div style="font-size:11px; color:${textColor}; margin-top:2px;">${displayName}</div>
            ${unlocked ? `<div style="font-size:9px; color:${colors[r]}; margin-top:2px;">✓ Выбито</div>` : ''}
          </div>`;
        }).join('')}
      </div>
      <!-- Кнопка прокрутки -->
      <div style="padding:12px 16px;">
        <button onclick="openGachaModal('${g.id}')"
          style="width:100%; background:${isLegendaryPool ? 'linear-gradient(135deg,#f59e0b,#b45309,#f59e0b)' : `linear-gradient(135deg, ${g.color}, ${g.borderColor})`}; border:none; border-radius:10px; padding:13px; color:white; font-size:15px; font-weight:900; cursor:pointer; letter-spacing:0.5px; ${isLegendaryPool ? 'box-shadow:0 0 12px rgba(245,158,11,0.5);' : ''}">
          🎲 Крутить — 10 💠
        </button>
        <div style="text-align:center; margin-top:6px; font-size:11px; color:#475569;">
          Открыто: ${unlockedCount}/4 · ${hasLegendary ? '👑 Легендарный получен!' : `Гарант через ${pityLeft} кр.`}
        </div>
      </div>
    </div>`;
  }).join('');
}

// Модальное окно с анимацией результата гачи
function openGachaModal(gachaId) {
  let pool = GACHA_POOLS[gachaId];
  if (!pool) return;
  if (gameData.lunarStones < 10) {
    showCodeResult('❌ Недостаточно Лунных камней!', false); return;
  }

  // Показываем анимацию прокрутки
  document.getElementById('modal-title').innerHTML = `${pool.icon} ${pool.name}`;
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = `
    <div style="text-align:center; padding:30px 0;">
      <div class="gacha-spin-anim" id="gacha-spinner">🎲</div>
      <div style="color:#64748b; font-size:13px; margin-top:12px;">Прокручиваю...</div>
    </div>`;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';

  // Крутим после короткой анимации
  setTimeout(() => {
    let res = rollGacha(gachaId);
    if (!res) { closeModal(); return; }
    showGachaResult(res);
    renderPremiumShop();
  }, 800);
}

function showGachaResult(res) {
  let { result, isGuaranteed, pool, spinsLeft } = res;
  let mainHtml = '';
  let rarityColors = { uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', legendary:'#f59e0b' };

  if (result.type === 'title') {
    let color = rarityColors[result.rarity];
    let label = { uncommon:'Необычный', rare:'Редкий', epic:'Эпический', legendary:'Легендарный' }[result.rarity];
    let titleHtml = getTitleHtml(result.rarity, result.value);
    let isDuplicate = !!result.dupComp;
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        ${isGuaranteed ? '<div style="color:#fbbf24; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✨ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✨</div>' : ''}
        ${isDuplicate ? '<div style="color:#f59e0b; font-size:11px; letter-spacing:1px; font-weight:bold; margin-bottom:8px;">↩️ ДУБЛЬ — КОМПЕНСАЦИЯ</div>' : ''}
        <div style="font-size:48px; margin-bottom:12px; animation: gacha-pop 0.4s ease-out;">${isDuplicate ? '↩️' : '👑'}</div>
        <div style="font-size:11px; color:${color}; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">${label.toUpperCase()} ТИТУЛ</div>
        <div style="font-size:20px; font-weight:900; margin-bottom:8px;">${titleHtml}</div>
        ${isDuplicate
          ? `<div style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b44; border-radius:8px; padding:8px 14px; font-size:14px; color:#fbbf24; font-weight:bold; margin-bottom:12px;">Компенсация: ${result.dupComp}</div>`
          : `<div style="font-size:12px; color:#64748b; margin-bottom:16px;">Для класса: ${CLASSES[pool.classId].name}</div>
        <div style="background:rgba(30,41,59,0.8); border-radius:10px; padding:10px; font-size:12px; color:#475569;">
          Выберите титул в меню <b style="color:#94a3b8;">Герой</b> → 👑 Активный титул
        </div>`}
      </div>`;
  } else if (result.type === 'victoryEffect') {
    let isDuplicate = !!result.dupComp;
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        ${isGuaranteed ? '<div style="color:#fbbf24; font-size:11px; letter-spacing:2px; font-weight:bold; margin-bottom:8px;">✨ ГАРАНТИРОВАННАЯ ПРОКРУТКА ✨</div>' : ''}
        ${isDuplicate ? '<div style="color:#f59e0b; font-size:11px; letter-spacing:1px; font-weight:bold; margin-bottom:8px;">↩️ ДУБЛЬ — КОМПЕНСАЦИЯ</div>' : ''}
        <div style="font-size:48px; margin-bottom:12px;">🏆</div>
        <div style="font-size:11px; color:#ef4444; font-weight:900; letter-spacing:2px; margin-bottom:8px;">МИФИЧЕСКИЙ ЭФФЕКТ ПОБЕДЫ</div>
        <div style="font-size:22px; font-weight:900; color:#f1f5f9; margin-bottom:10px;">${result.name}</div>
        ${isDuplicate
          ? `<div style="background:rgba(245,158,11,0.1);border:1px solid #f59e0b44;border-radius:8px;padding:8px 14px;font-size:14px;color:#fbbf24;font-weight:bold;">Компенсация: ${result.dupComp}</div>`
          : `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:10px;font-size:12px;color:#94a3b8;">
              Воспроизводится при <b style="color:#f1f5f9;">победе в бою</b>.<br>Выбрать в профиле персонажа.
            </div>`}
      </div>`;
  } else if (result.type === 'imperials') {
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        <div style="font-size:48px; margin-bottom:12px;">🪙</div>
        <div style="font-size:11px; color:#f59e0b; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">НАГРАДА</div>
        <div style="font-size:28px; font-weight:900; color:#fbbf24;">${result.value.toLocaleString()} 🪙</div>
        <div style="font-size:12px; color:#64748b; margin-top:8px;">Добавлено на счёт</div>
      </div>`;
  } else if (result.type === 'key') {
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        <div style="font-size:48px; margin-bottom:12px;">🗝️</div>
        <div style="font-size:11px; color:#d97706; font-weight:bold; letter-spacing:2px; margin-bottom:8px;">КЛЮЧ</div>
        <div style="font-size:22px; font-weight:900; color:#fbbf24;">${result.keyName}</div>
        <div style="font-size:12px; color:#64748b; margin-top:8px;">Добавлен в инвентарь</div>
      </div>`;
  } else {
    mainHtml = `
      <div style="text-align:center; padding:10px 0 20px;">
        <div style="font-size:48px; margin-bottom:12px;">💨</div>
        <div style="font-size:14px; color:#475569;">Ничего...</div>
        <div style="font-size:11px; color:#334155; margin-top:6px;">Не повезло в этот раз</div>
      </div>`;
  }

  document.getElementById('modal-desc').innerHTML = `
    ${mainHtml}
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.8); border-radius:10px; padding:10px 14px; margin-top:8px;">
      <span style="font-size:12px; color:#64748b;">До гаранта: <b style="color:#94a3b8;">${spinsLeft}</b></span>
      <span style="font-size:12px; color:#64748b;">Баланс: <b style="color:#67e8f9;">${gameData.lunarStones} 💠</b></span>
    </div>`;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:linear-gradient(135deg,${pool.color},${pool.borderColor}); flex:1; margin-right:6px;" onclick="closeModal(); openGachaModal('${pool.id}')">🎲 Ещё раз</button>
    <button class="action-btn" style="background:#334155; flex:0; padding:12px 16px;" onclick="closeModal()">✕</button>`;
  let closeBtnG = document.getElementById('modal-close-btn'); if (closeBtnG) closeBtnG.style.display = 'none';
}

