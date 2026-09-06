// ============================================================
// DUNGEONS UI
// Вкладка Подземелья, экран передышки, подсумок.
// ============================================================

// ============================================================
// UI ПОДЗЕМЕЛЬЯ
// ============================================================

// Отрисовка вкладки «Подземелья»
function renderDungeons() {
  let html = `<div style="margin-bottom:15px;"><h2>⚰️ Подземелья</h2><span style="font-size:12px; color:#94a3b8;">Требуют ключей. Ключи выпадают на аренах или покупаются у Дядюшки Ибн.</span></div>`;

  Object.values(DUNGEONS).forEach(dungeon => {
    let owned = gameData.keys[dungeon.keyId] || 0;
    let progress = gameData.dungeonProgress[dungeon.id] || 0;
    let totalFloors = dungeon.floors.length;
    let hasKey = owned > 0;

    html += `
      <div class="class-card ${dungeon.dungeonClass}" style="border-width: 2px; margin-bottom: 15px; text-align:left; cursor: ${hasKey ? 'pointer' : 'default'};"
           onclick="${hasKey ? `startDungeon('${dungeon.id}')` : ''}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div class="class-title" style="color:#fff; text-shadow: 0 1px 4px rgba(0,0,0,0.8);">${dungeon.icon} ${dungeon.name}</div>
            <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">Этажей: ${totalFloors} | Прогресс: ${progress}/${totalFloors}</div>
            <div style="font-size:11px; color:#fbbf24; margin-top:4px;">${dungeon.keyName}: ${owned} шт.</div>
          </div>
          <div style="font-size:32px; margin-left:10px;">${hasKey ? '🗝️' : '🔒'}</div>
        </div>
        ${hasKey
          ? `<button class="btn-fight-huge" style="font-size:14px; padding:10px; margin-top:12px;">⚔️ Войти</button>`
          : `<div style="margin-top:10px; color:#64748b; font-size:12px;">Нет ключей. Фармите арены (от Серебра) или купите у Дядюшки Ибн.</div>`
        }
      </div>`;
  });

  document.getElementById('tab-dungeons').innerHTML = html;
}

// Экран передышки между этажами
function showFloorBreak(completedFloor, totalFloors) {
  let pouchCount = gameData.pouch.items.length;
  let pouchBtn = pouchCount > 0
    ? `<button class="action-btn" style="background:linear-gradient(135deg,#4c1d95,#7c3aed); width:100%; margin-bottom:10px;" onclick="openPouchModal()">
        🧰 Подсумок (${pouchCount} зел.)
      </button>`
    : `<div style="color:#4c1d95; font-size:12px; margin-bottom:10px; padding:8px; border:1px dashed #4c1d95; border-radius:8px;">🧰 Подсумок пуст</div>`;

  document.getElementById("controls").innerHTML = `
    <div style="width:100%; text-align:center;">
      <div style="color:#fbbf24; font-weight:900; font-size:16px; margin-bottom:10px;">
        ⚔️ Этаж ${completedFloor}/${totalFloors} пройден!
      </div>
      <div style="color:#10b981; margin-bottom:15px;">❤️ Ваше HP: ${player.hp} / ${player.maxHp}</div>
      ${pouchBtn}
      <button class="action-btn" style="background:linear-gradient(135deg,#b45309,#f59e0b); width:100%; margin-bottom:10px;" onclick="continueToNextFloor()">
        ⚔️ Следующий этаж
      </button>
      <button class="action-btn btn-return" style="display:block; width:100%;" onclick="exitDungeon()">
        🚪 Выйти из подземелья
      </button>
    </div>
  `;
}

// Модальное окно подсумка между этажами
function openPouchModal() {
  let items = gameData.pouch.items;
  if (items.length === 0) { alert('Подсумок пуст!'); return; }

  let slotsHtml = items.map((potion, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.7); border:1px solid #7c3aed; border-radius:10px; padding:12px; margin-bottom:8px;">
      <div style="text-align:left;">
        <div style="font-weight:bold; color:#e9d5ff;">${potion.name}</div>
        <div style="font-size:11px; color:#a78bfa;">+${potion.heal} ХП · Текущее HP: ${player.hp}/${player.maxHp}</div>
      </div>
      <button class="action-btn" style="background:${player.hp >= player.maxHp ? '#475569' : '#6d28d9'}; padding:8px 14px; font-size:13px; flex:0;"
        ${player.hp >= player.maxHp ? 'disabled' : ''} onclick="usePotion(${idx})">
        Выпить
      </button>
    </div>`).join('');

  document.getElementById('modal-title').innerText = '🧰 Подсумок';
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-desc').innerHTML = `
    <div style="margin-bottom:8px; font-size:12px; color:#94a3b8;">Зелья можно использовать только между этажами.</div>
    ${slotsHtml}`;
  document.getElementById('modal-actions').innerHTML = '';
  document.getElementById('item-modal').style.display = 'flex';
}

// Использование зелья из подсумка
function usePotion(idx) {
  let potion = gameData.pouch.items[idx];
  if (!potion) return;
  if (player.hp >= player.maxHp) { alert('HP уже полное!'); return; }

  let healAmt = Math.min(potion.heal, player.maxHp - player.hp);
  player.hp += healAmt;
  dungeonState.playerHp = player.hp; // синхронизируем с сохранённым состоянием

  gameData.pouch.items.splice(idx, 1);
  saveData();

  // Обновляем экран боя и модалку
  updateScreen();
  // Если в подсумке ещё что-то есть — обновляем модалку, иначе закрываем
  if (gameData.pouch.items.length > 0) {
    openPouchModal();
  } else {
    closeModal();
  }
  // Обновляем кнопку подсумка на экране передышки
  let pouchBtn = document.querySelector('[onclick="openPouchModal()"]');
  if (pouchBtn) {
    let remaining = gameData.pouch.items.length;
    if (remaining > 0) {
      pouchBtn.innerText = `🧰 Подсумок (${remaining} зел.)`;
    } else {
      pouchBtn.outerHTML = `<div style="color:#4c1d95; font-size:12px; margin-bottom:10px; padding:8px; border:1px dashed #4c1d95; border-radius:8px;">🧰 Подсумок пуст</div>`;
    }
  }
}

// Кнопка «Следующий этаж» — восстанавливает кнопки управления и запускает этаж
function continueToNextFloor() {
  document.getElementById("controls").innerHTML = `
    <button class="action-btn btn-attack" id="btn-attack" onclick="registerAction('attack')">🗡️ Атака</button>
    <button class="action-btn btn-defend" id="btn-defend" onclick="registerAction('defend')">🛡️ Защита</button>
    <button class="action-btn btn-skill" id="btn-skill" onclick="registerAction('skill')">✨ Навык!</button>
    <button class="action-btn" id="btn-immortal" style="background: linear-gradient(135deg, #4c1d95, #000000); display: none; width: 100%; box-shadow: 0 0 15px rgba(124, 58, 237, 0.6);" onclick="registerAction('immortal')">💀 Возмездие</button>
    <button class="action-btn btn-return" id="btn-return" onclick="returnToMenu()">В меню</button>
  `;
  startDungeonFloor();
}

// Выход из подземелья без завершения
function exitDungeon() {
  dungeonState = null;
  returnToMenu();
}
