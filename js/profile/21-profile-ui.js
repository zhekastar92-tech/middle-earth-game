// ============================================================
// PROFILE UI
// Модалки сохранения/восстановления профиля.
// ============================================================

function updateBackupStatusLine() {
  let el = document.getElementById('backup-status-line');
  if (!el) return;
  try {
    let raw = localStorage.getItem('middleEarthBackup');
    if (!raw) { el.innerHTML = `<div style="font-size:11px; color:#64748b;">Ещё нет сохранённого кода. Совершите любое действие в игре — код создастся автоматически.</div>`; return; }
    let { ts } = JSON.parse(raw);
    if (!ts) { el.innerHTML = ''; return; }
    let diff = Math.floor((Date.now() - ts) / 1000);
    let ago = diff < 60 ? 'только что' : diff < 3600 ? `${Math.floor(diff/60)} мин. назад` : diff < 86400 ? `${Math.floor(diff/3600)} ч. назад` : `${Math.floor(diff/86400)} дн. назад`;
    let d = new Date(ts), pad = n => String(n).padStart(2,'0');
    let dateStr = `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    el.innerHTML = `<div style="display:flex;align-items:center;gap:6px;background:rgba(22,101,52,0.15);border:1px solid #166534;border-radius:8px;padding:7px 10px;">
      <span style="color:#4ade80;font-size:13px;">✅</span>
      <span style="font-size:11px;color:#4ade80;">Код актуален · обновлён <b>${ago}</b> <span style="color:#166534;">(${dateStr})</span></span></div>`;
  } catch(e) { el.innerHTML = ''; }
}

// --- UI: модальные окна сохранения/загрузки ---
function openSaveProfileModal() {
  let code = null, savedAt = null;
  try { let p = JSON.parse(localStorage.getItem('middleEarthBackup')||'null'); if (p) { code = p.code; savedAt = p.ts; } } catch(e) {}
  if (!code) code = encodeProfile();
  if (!code) { alert('Ошибка при создании кода. Попробуйте ещё раз.'); return; }
  let dateStr = '';
  if (savedAt) { let d = new Date(savedAt), pad = n => String(n).padStart(2,'0'); dateStr = `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} в ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  document.getElementById('modal-title').innerHTML = '💾 Резервная копия';
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-title').style.cssText = '';
  document.getElementById('modal-desc').style.cssText = '';
  document.getElementById('modal-desc').innerHTML = `
    <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;line-height:1.5;">Скопируйте этот код и сохраните в надёжном месте — в заметках или перешлите себе в Telegram.</div>
    ${dateStr ? `<div style="display:flex;align-items:center;gap:6px;background:rgba(22,101,52,0.2);border:1px solid #166534;border-radius:8px;padding:8px 12px;margin-bottom:10px;">
      <span style="color:#4ade80;font-size:14px;">✅</span><span style="font-size:11px;color:#4ade80;">Код актуален — обновлён <b>${dateStr}</b></span></div>` : ''}
    <div style="background:rgba(15,23,42,0.9);border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:12px;">
      <div style="font-size:9px;color:#475569;margin-bottom:6px;letter-spacing:1px;">ВАШ КОД СОХРАНЕНИЯ:</div>
      <div id="profile-code-display" style="font-family:monospace;font-size:11px;color:#67e8f9;word-break:break-all;line-height:1.6;">${code}</div>
    </div>
    <div style="font-size:10px;color:#475569;text-align:center;">🔒 Код зашифрован. Подделать без секретного ключа невозможно.</div>`;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:linear-gradient(135deg,#0e7490,#0891b2);flex:1;margin-right:6px;" onclick="copyProfileCode()">📋 Скопировать</button>
    <button class="action-btn" style="background:#334155;flex:0;padding:12px 16px;" onclick="closeModal()">✕</button>`;
  document.getElementById('item-modal').style.display = 'flex';
}

function copyProfileCode() {
  let code = (document.getElementById('profile-code-display')||{}).innerText || '';
  let done = () => { let btn = document.querySelector('#modal-actions button'); if (!btn) return; let orig = btn.innerHTML; btn.innerHTML = '✅ Скопировано!'; btn.style.background = '#059669'; setTimeout(()=>{btn.innerHTML=orig;btn.style.background='';},2000); };
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(done).catch(()=>fallbackCopy(code,done)); }
  else fallbackCopy(code, done);
}
function fallbackCopy(text, cb) {
  let ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); if (cb) cb(); } catch(e) {}
  document.body.removeChild(ta);
}

function openRestoreProfileModal() {
  document.getElementById('modal-title').innerHTML = '🔄 Восстановить профиль';
  document.getElementById('modal-title').className = 'text-skill';
  document.getElementById('modal-title').style.cssText = '';
  document.getElementById('modal-desc').style.cssText = '';
  document.getElementById('modal-desc').innerHTML = `
    <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;line-height:1.5;">Вставьте ваш код сохранения. <b style="color:#ef4444;">Внимание:</b> текущий прогресс будет заменён данными из кода.</div>
    <textarea id="restore-input" placeholder="ME-XXXXXX-XXXXXX-..."
      style="width:100%;height:90px;background:rgba(15,23,42,0.9);border:1px solid #334155;border-radius:8px;padding:10px;color:#e2e8f0;font-size:11px;font-family:monospace;resize:none;outline:none;box-sizing:border-box;"></textarea>
    <div id="restore-result" style="display:none;margin-top:8px;font-size:12px;font-weight:bold;text-align:center;"></div>`;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:linear-gradient(135deg,#b45309,#f59e0b);flex:1;margin-right:6px;" onclick="confirmRestoreProfile()">🔄 Восстановить</button>
    <button class="action-btn" style="background:#334155;flex:0;padding:12px 16px;" onclick="closeModal()">✕</button>`;
  document.getElementById('item-modal').style.display = 'flex';
}

function confirmRestoreProfile() {
  let code = (document.getElementById('restore-input')||{}).value.trim();
  if (!code) { showRestoreResult('Вставьте код сохранения!', false); return; }
  let result = decodeProfile(code);
  if (!result.ok) { showRestoreResult('❌ ' + result.reason, false); return; }
  let d = result.data;
  let rank = getRank(d.lp || 0);
  let cls = _CLSD[d.c] || d.c || 'warrior';
  let invCount = d.inv ? d.inv.split(',').filter(s => s && s !== '.').length : 0;
  document.getElementById('restore-result').innerHTML = `
    <div style="background:rgba(15,23,42,0.9);border:1px solid #334155;border-radius:10px;padding:12px;margin-top:10px;font-size:12px;text-align:left;">
      <div style="color:#94a3b8;font-size:10px;margin-bottom:8px;letter-spacing:1px;">ПРОФИЛЬ В КОДЕ:</div>
      <div style="color:#f1f5f9;margin-bottom:4px;">⚔️ Класс: <b>${CLASSES[cls]?.name || cls}</b></div>
      <div style="color:#f1f5f9;margin-bottom:4px;">${rank.icon} Ранг: <b>${rank.name} · ${d.lp || 0} LP</b></div>
      <div style="color:#fbbf24;margin-bottom:4px;">🪙 Империалы: <b>${(d.i||0).toLocaleString()}</b></div>
      <div style="color:#67e8f9;margin-bottom:4px;">💠 Лунных камней: <b>${d.ls||0}</b></div>
      <div style="color:#f1f5f9;margin-bottom:4px;">🎒 Предметов: <b>${invCount} / ${d.mi||6}</b></div>
    </div>
    <div style="color:#ef4444;font-size:11px;margin-top:10px;text-align:center;">Текущий прогресс будет заменён. Вы уверены?</div>`;
  document.getElementById('restore-result').style.display = 'block';
  window._pendingRestoreCode = code;
  document.getElementById('modal-actions').innerHTML = `
    <button class="action-btn" style="background:#ef4444;flex:1;margin-right:6px;" onclick="executeRestoreProfile()">✅ Да, применить</button>
    <button class="action-btn" style="background:#334155;flex:0;padding:12px 16px;" onclick="openRestoreProfileModal()">← Назад</button>`;
}

function executeRestoreProfile() {
  let code = window._pendingRestoreCode || '';
  window._pendingRestoreCode = null;
  let result = decodeProfile(code);
  if (!result.ok) { alert('Ошибка при восстановлении.'); return; }
  applyProfileSnapshot(result.data);
  closeModal();
  renderMainMenu(); updateHeroTab(); updateBagTab();
  setTimeout(() => showCodeResult('✅ Профиль восстановлен!', true), 300);
}

function showRestoreResult(msg, isSuccess) {
  let el = document.getElementById('restore-result');
  if (!el) return;
  el.innerText = msg;
  el.style.color = isSuccess ? '#10b981' : '#ef4444';
  el.style.display = 'block';
}
