// ============================================================
// SETTINGS
// Вкладка Настройки: смена никнейма, статус бэкапа.
// ============================================================

const NICKNAME_CHANGE_COST = 500;
const NICKNAME_MAX_LEN = 20;
const NICKNAME_MIN_LEN = 2;

function renderSettings() {
  let currentNick = getPlayerName();
  let hasFree = !gameData.nicknameChanged;
  let ls = gameData.lunarStones;
  let canAfford = ls >= NICKNAME_CHANGE_COST;

  let costLabel = hasFree
    ? `<span style="color:#4ade80; font-weight:bold;">Бесплатно</span> <span style="color:#475569; font-size:10px;">(первый раз)</span>`
    : `<span style="color:${canAfford ? '#67e8f9' : '#ef4444'}; font-weight:bold;">${NICKNAME_CHANGE_COST} 💠</span>`;

  let btnStyle = (hasFree || canAfford)
    ? 'background:linear-gradient(135deg,#7c3aed,#a855f7);'
    : 'background:#374151; cursor:not-allowed; opacity:0.5;';

  let html = `
    <div style="background:rgba(15,23,42,0.95); border:1px solid #1e3a5f; border-radius:14px; padding:18px; margin-bottom:18px; text-align:center;">
      <div style="font-size:36px; margin-bottom:8px;">👤</div>
      <div style="font-size:20px; font-weight:900; color:#f1f5f9; letter-spacing:0.5px;">${currentNick}</div>
      ${gameData.nickname
        ? `<div style="font-size:11px; color:#64748b; margin-top:4px;">Кастомный ник · оригинальный: <b style="color:#475569;">${REAL_PLAYER_NAME}</b></div>`
        : `<div style="font-size:11px; color:#475569; margin-top:4px;">Имя из Telegram</div>`
      }
    </div>

    <div class="class-card" style="border:2px solid #7c3aed; background:rgba(20,10,40,0.95); margin-bottom:16px; text-align:left;">
      <div class="class-title" style="color:#c084fc; margin-bottom:4px;">✏️ Сменить никнейм</div>
      <div class="class-desc" style="margin-bottom:14px;">
        Первая смена — бесплатно. Каждая следующая — ${NICKNAME_CHANGE_COST} 💠.<br>
        Длина: ${NICKNAME_MIN_LEN}–${NICKNAME_MAX_LEN} симв. Буквы, цифры, _ и -.
      </div>
      <div style="margin-bottom:10px;">
        <input id="nickname-input" type="text" maxlength="${NICKNAME_MAX_LEN}"
          placeholder="Новый никнейм..." oninput="validateNicknameInput()"
          style="width:100%; box-sizing:border-box; background:rgba(30,41,59,0.9); border:1px solid #334155; border-radius:8px; padding:11px 14px; color:#e2e8f0; font-size:15px; outline:none; font-family:inherit;">
        <div id="nickname-hint" style="font-size:11px; color:#475569; margin-top:5px; min-height:16px;"></div>
      </div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <div style="font-size:12px; color:#94a3b8;">Стоимость: ${costLabel}</div>
        <div style="font-size:12px; color:#64748b;">Баланс: <b style="color:#67e8f9;">${ls} 💠</b></div>
      </div>
      <button id="nickname-btn" class="action-btn" style="${btnStyle} width:100%; padding:13px;"
        onclick="confirmNicknameChange()" ${hasFree || canAfford ? '' : 'disabled'}>
        ✏️ Сменить ник
      </button>
      ${gameData.nickname ? `
      <button class="action-btn" style="background:#1e293b; border:1px solid #334155; width:100%; padding:10px; margin-top:8px; font-size:12px; color:#94a3b8;"
        onclick="resetNickname()">↩️ Вернуть ник из Telegram</button>` : ''}
      <div id="nickname-result" style="display:none; margin-top:10px; font-size:13px; font-weight:bold; text-align:center;"></div>
    </div>

    <div style="background:rgba(5,20,10,0.9); border:1px solid #166534; border-radius:12px; padding:16px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <div style="font-size:22px;">💾</div>
        <div>
          <div style="font-weight:900; color:#22c55e; font-size:14px;">Резервная копия профиля</div>
          <div style="font-size:11px; color:#4ade80; margin-top:2px;">Код обновляется автоматически при каждом действии</div>
        </div>
      </div>
      <div id="backup-status-line" style="margin-bottom:12px;"></div>
      <div style="display:flex; gap:8px;">
        <button class="action-btn" style="background:linear-gradient(135deg,#166534,#15803d); flex:1; font-size:13px; padding:11px 8px;" onclick="openSaveProfileModal()">📋 Скопировать код</button>
        <button class="action-btn" style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8); flex:1; font-size:13px; padding:11px 8px;" onclick="openRestoreProfileModal()">🔄 Восстановить</button>
      </div>
    </div>
  `;

  document.getElementById('tab-settings').innerHTML = html;
  updateBackupStatusLine();
}

function validateNicknameInput() {
  let input = document.getElementById('nickname-input');
  let hint = document.getElementById('nickname-hint');
  let btn = document.getElementById('nickname-btn');
  if (!input || !hint) return;
  let val = input.value;
  // Фильтруем недопустимые символы на лету
  let clean = val.replace(/[^a-zA-Zа-яА-ЯёЁ0-9_\-]/g, '');
  if (clean !== val) { input.value = clean; val = clean; }
  let hasFree = !gameData.nicknameChanged;
  let canAfford = gameData.lunarStones >= NICKNAME_CHANGE_COST;
  if (val.length === 0) {
    hint.innerText = ''; hint.style.color = '#475569';
  } else if (val.length < NICKNAME_MIN_LEN) {
    hint.innerText = `Слишком короткий (мин. ${NICKNAME_MIN_LEN} символа)`; hint.style.color = '#ef4444';
  } else {
    hint.innerText = `✓ Выглядит хорошо · ${val.length}/${NICKNAME_MAX_LEN}`; hint.style.color = '#4ade80';
  }
  if (btn) {
    let ok = val.length >= NICKNAME_MIN_LEN && (hasFree || canAfford);
    btn.disabled = !ok;
    btn.style.opacity = ok ? '1' : '0.5';
    btn.style.cursor = ok ? 'pointer' : 'not-allowed';
  }
}

function confirmNicknameChange() {
  let input = document.getElementById('nickname-input');
  if (!input) return;
  let newNick = input.value.trim();
  if (newNick.length < NICKNAME_MIN_LEN) { showNicknameResult(`Ник слишком короткий (мин. ${NICKNAME_MIN_LEN} символа)`, false); return; }
  if (newNick.length > NICKNAME_MAX_LEN) { showNicknameResult(`Ник слишком длинный (макс. ${NICKNAME_MAX_LEN} символов)`, false); return; }
  if (!/^[a-zA-Zа-яА-ЯёЁ0-9_\-]+$/.test(newNick)) { showNicknameResult('Недопустимые символы', false); return; }
  if (newNick === getPlayerName()) { showNicknameResult('Это уже ваш текущий ник', false); return; }
  if (!gameData.nicknameChanged) {
    // Первая смена — бесплатно
  } else {
    if (gameData.lunarStones < NICKNAME_CHANGE_COST) { showNicknameResult(`Недостаточно 💠 (нужно ${NICKNAME_CHANGE_COST})`, false); return; }
    gameData.lunarStones -= NICKNAME_CHANGE_COST;
  }
  gameData.nickname = newNick;
  gameData.nicknameChanged = true;
  saveData();
  renderSettings();
  if (document.getElementById('menu-profile')) renderMainMenu();
  showNicknameResult(`✅ Никнейм изменён на «${newNick}»!`, true);
}

function resetNickname() {
  gameData.nickname = null;
  saveData();
  renderSettings();
  if (document.getElementById('menu-profile')) renderMainMenu();
  showNicknameResult('↩️ Ник сброшен — используется имя из Telegram', true);
}

function showNicknameResult(msg, ok) {
  let el = document.getElementById('nickname-result');
  if (!el) return;
  el.innerText = msg;
  el.style.color = ok ? '#4ade80' : '#ef4444';
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}
