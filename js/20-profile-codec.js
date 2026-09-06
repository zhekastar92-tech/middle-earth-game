// ============================================================
// PROFILE CODEC
// Упаковка/распаковка профиля в код бэкапа (encode/decode/apply).
// ============================================================

const PROFILE_SECRET = 'ME_PROFILE_2024_SAVE';

// --- Кодовые таблицы ---
const _B64A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const _RD   = ['common','uncommon','rare','epic','legendary'];
const _RE   = Object.fromEntries(_RD.map((v,i)=>[v,i]));
const _SD   = ['head','body','arms','legs'];
const _SE   = Object.fromEntries(_SD.map((v,i)=>[v,i]));
const _PD   = ['none','heal_once','block_pierce','first_strike'];
const _PE   = Object.fromEntries(_PD.map((v,i)=>[v,i]));
const _UD   = ['none','healBonus','blockBonus','ignoreBlock','dodge'];
const _UE   = Object.fromEntries(_UD.map((v,i)=>[v,i]));
const _CD   = ['','warrior','assassin','guardian','priest','darkknight'];
const _CE   = Object.fromEntries(_CD.map((v,i)=>[v,i]));
const _KE   = { dusty_key:'dk', wood_key:'wk', ancient_key:'ak' };
const _KD   = Object.fromEntries(Object.entries(_KE).map(([a,b])=>[b,a]));
const _CLS  = { warrior:'w', assassin:'a', guardian:'g', priest:'p', darkknight:'d' };
const _CLSD = Object.fromEntries(Object.entries(_CLS).map(([a,b])=>[b,a]));
const _TC   = { uncommon:'u', rare:'r', epic:'e', legendary:'l', mythic:'m' };
const _TD   = Object.fromEntries(Object.entries(_TC).map(([a,b])=>[b,a]));
const _POT  = { small:'S', medium:'M', large:'L' };
const _POTD = Object.fromEntries(Object.entries(_POT).map(([a,b])=>[b,a]));
const _POTH = { small:8, medium:13, large:20 };
const _POTN = { small:'🧪 Малое зелье', medium:'🧪 Среднее зелье', large:'🧪 Большое зелье' };
const _DE   = { mansion:'m', river:'r', temple:'t' };
const _DD   = Object.fromEntries(Object.entries(_DE).map(([a,b])=>[b,a]));

// --- Упаковка/распаковка предметов (битовый формат, 7 символов base64url) ---
function packItem(item) {
  if (!item) return '';
  let b = 0n, pos = 0;
  const push = (v, bits) => { b |= (BigInt(v) & ((1n << BigInt(bits)) - 1n)) << BigInt(pos); pos += bits; };
  push(item.id % 4096, 12);
  push(_RE[item.rarity] ?? 0, 3);
  push(_SE[item.slot]   ?? 0, 2);
  push(Math.min(item.hp || 0, 15), 4);
  push(item.perk ? (_PE[item.perk.type] ?? 0) : 0, 3);
  push(item.perk ? Math.min(item.perk.val || 0, 7) : 0, 3);
  push(item.perk?.charges ? Math.min(item.perk.charges, 3) : 0, 2);
  push(item.unique ? (_UE[item.unique.type] ?? 0) : 0, 3);
  push(item.unique ? (item.unique.type === 'dodge' ? 15 : Math.min(item.unique.val || 0, 7)) : 0, 3);
  push(item.legendary ? 1 : 0, 1);
  push(item.legendary ? Math.min(item.legendary.val || 0, 7) : 0, 3);
  push(_CE[item.classId ?? ''] ?? 0, 3);
  let r = '', tmp = b;
  for (let i = 0; i < 7; i++) { r += _B64A[Number(tmp & 63n)]; tmp >>= 6n; }
  return r;
}

function unpackItem(str) {
  if (!str || str.length < 7) return null;
  let b = 0n;
  for (let i = str.length - 1; i >= 0; i--) b = (b << 6n) | BigInt(_B64A.indexOf(str[i]));
  const pop = bits => { let v = Number(b & ((1n << BigInt(bits)) - 1n)); b >>= BigInt(bits); return v; };
  let id = pop(12), rarity = _RD[pop(3)]||'common', slot = _SD[pop(2)]||'head', hp = pop(4);
  let pt = pop(3), pv = pop(3), pc = pop(2);
  let ut = pop(3), uv = pop(3);
  let lt = pop(1), lv = pop(3);
  let ci = pop(3);
  let item = { id, rarity, slot, hp, perk: null, unique: null, legendary: null, classId: _CD[ci]||null, name: '' };
  if (pt > 0) {
    let type = _PD[pt];
    item.perk = { type, val: pv };
    if (type === 'first_strike') item.perk.charges = pc;
    if (type === 'heal_once')    item.perk.desc = `Лечит ${pv} ХП при падении здоровья.`;
    if (type === 'block_pierce') item.perk.desc = `Блокирует ${pv} пробитого урона (1 раз).`;
    if (type === 'first_strike') item.perk.desc = `Урон +${pv} на первые ${pc} атак.`;
  }
  if (ut > 0) {
    let type = _UD[ut], val = type === 'dodge' ? 0.15 : uv;
    item.unique = { type, val };
    if (type === 'healBonus')   item.unique.desc = `[УНИК] +1 ХП при избыточном блоке.`;
    if (type === 'blockBonus')  item.unique.desc = `[УНИК] +1 ко всем блокам.`;
    if (type === 'ignoreBlock') item.unique.desc = `[УНИК] Игнорирует 1 ед. блока врага.`;
    if (type === 'dodge')       item.unique.desc = `[УНИК] 15% шанс избежать атаки.`;
  }
  if (lt) item.legendary = { type: 'blockStreakBonus', val: lv, desc: `[ЛЕГ] +${lv} к макс. блокам подряд.` };
  item.name = generateItemName(rarity, slot, !!item.perk, !!item.unique, false);
  return item;
}

// --- Упаковка экипировки, ключей, подсумка, данжей, титулов, спинов ---
function packEquip(equip) {
  let r = {};
  Object.keys(equip).forEach(cls => {
    let eq = equip[cls];
    r[cls] = [eq.head, eq.body, eq.arms, eq.legs].map(i => i ? packItem(i) : '.').join(',');
  });
  return r;
}
function unpackEquip(packed) {
  let r = {};
  Object.keys(packed).forEach(cls => {
    let parts = packed[cls].split(',');
    r[cls] = { head: parts[0]!=='.'?unpackItem(parts[0]):null, body: parts[1]!=='.'?unpackItem(parts[1]):null, arms: parts[2]!=='.'?unpackItem(parts[2]):null, legs: parts[3]!=='.'?unpackItem(parts[3]):null };
  });
  Object.keys(CLASSES).forEach(c => { if (!r[c]) r[c] = { head:null, body:null, arms:null, legs:null }; });
  return r;
}

function packKeys(k) { return Object.entries(k).filter(([,v])=>v>0).map(([k,v])=>(_KE[k]||k)+':'+v).join(','); }
function unpackKeys(s) { if (!s) return {}; let r={}; s.split(',').forEach(p=>{let[k,v]=p.split(':');if(k)r[_KD[k]||k]=parseInt(v)||0;}); return r; }

function packPouch(p) { return p.slots+'|'+(p.items||[]).map(x=>_POT[x.type]||x.type).join(''); }
function unpackPouch(s) { if (!s) return {slots:0,items:[]}; let[sl,it]=s.split('|'); return {slots:parseInt(sl)||0,items:(it||'').split('').filter(Boolean).map(c=>{let t=_POTD[c]||c;return{type:t,name:_POTN[t]||t,heal:_POTH[t]||0};})}; }

function packDp(dp) { return Object.entries(dp).filter(([,v])=>v>0).map(([k,v])=>(_DE[k]||k)+':'+v).join(','); }
function unpackDp(s) { if (!s) return {}; let r={}; s.split(',').forEach(p=>{let[k,v]=p.split(':');if(k)r[_DD[k]||k]=parseInt(v)||0;}); return r; }

function packTitles(ttl) { return Object.entries(ttl).filter(([,v])=>v&&v.unlocked&&v.unlocked.length).map(([c,v])=>(_CLS[c]||c)+':'+v.unlocked.map(r=>_TC[r]||r).join('')+':'+(_TC[v.active]||v.active||'')).join(';'); }
function unpackTitles(s) { if (!s) return {}; let r={}; s.split(';').forEach(p=>{let[c,ul,act]=p.split(':'); r[_CLSD[c]||c]={unlocked:(ul||'').split('').map(x=>_TD[x]||x),active:_TD[act]||act||null};}); return r; }

function packSpins(obj) { let s=Object.entries(obj).filter(([,v])=>v>0).map(([k,v])=>(_CLS[k]||k)+':'+v).join(','); return s||undefined; }
function unpackSpins(s) { if (!s) return {}; let r={}; s.split(',').forEach(p=>{let[k,v]=p.split(':');if(k)r[_CLSD[k]||k]=parseInt(v)||0;}); return r; }

// --- Контрольная подпись ---
function profileChecksum(payload) {
  let str = payload + PROFILE_SECRET;
  let h1 = 0, h2 = 0x9e3779b9;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0xcc9e2d51); h1 = (h1 << 15) | (h1 >>> 17); h1 = Math.imul(h1, 0x1b873593);
    h2 = Math.imul(h2 ^ c, 0x85ebca6b); h2 ^= h1;
  }
  h1 ^= str.length; h2 ^= str.length;
  h1 = Math.imul(h1 ^ (h1 >>> 16), 0x85ebca6b); h1 = Math.imul(h1 ^ (h1 >>> 13), 0xc2b2ae35);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 0x85ebca6b); h2 = Math.imul(h2 ^ (h2 >>> 13), 0xc2b2ae35);
  return (Math.abs(h1) + Math.abs(h2)).toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
}

// --- Кодирование / декодирование профиля ---
function encodeProfile() {
  try {
    let snap = {
      lp: gameData.lp,
      i:  gameData.imperials,
      ls: gameData.lunarStones,
      c:  _CLS[gameData.currentClass] || gameData.currentClass,
      inv: gameData.inventory.map(packItem).join(','),
      mi:  gameData.maxInventory > 6 ? gameData.maxInventory : undefined,
      eq:  packEquip(gameData.equip),
      k:   packKeys(gameData.keys),
      dp:  packDp(gameData.dungeonProgress),
      po:  packPouch(gameData.pouch),
      pt:  gameData.hugeChestPity || undefined,
      t:   packTitles(gameData.titles),
      gs:  packSpins(gameData.gachaSpinCount),
      mt:  packTitles(gameData.mythicTitles),
      mg:  packSpins(gameData.mythicGachaSpinCount),
      ef:  gameData.entryEffect  || undefined,
      cf:  gameData.cardFrame    || undefined,
      uf:  gameData.unlockedFrames.length         ? gameData.unlockedFrames.join(',')         : undefined,
      ue:  gameData.unlockedEffects.length        ? gameData.unlockedEffects.join(',')        : undefined,
      uve: gameData.unlockedVictoryEffects.length ? gameData.unlockedVictoryEffects.join(',') : undefined,
      ave: gameData.activeVictoryEffect || undefined,
      dw:  gameData.dailyWins        || undefined,
      dgc: gameData.dailyGiftClaimed || undefined,
      ldd: gameData.lastDailyDate    || undefined,
      uc:  gameData.usedCodes.length ? gameData.usedCodes.join(',') : undefined,
      nid: gameData.nextItemId       || undefined,
      nn:  gameData.nickname         || undefined,
      nnc: gameData.nicknameChanged  || undefined
    };
    Object.keys(snap).forEach(k => snap[k] === undefined && delete snap[k]);
    let safe = btoa(unescape(encodeURIComponent(JSON.stringify(snap)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    let full = safe + profileChecksum(safe);
    let blocks = [];
    for (let i = 0; i < full.length; i += 6) blocks.push(full.slice(i, i + 6));
    return 'ME-' + blocks.join('-');
  } catch(e) { return null; }
}

function decodeProfile(code) {
  try {
    let clean = code.replace(/^ME-/i, '').replace(/-/g, '');
    let payload = clean.slice(0, -8);
    let checksum = clean.slice(-8).toUpperCase();
    if (profileChecksum(payload) !== checksum) return { ok: false, reason: 'Подпись не совпадает. Код повреждён или подделан.' };
    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    let data = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (!data || typeof data !== 'object') return { ok: false, reason: 'Не удалось прочитать код. Проверьте что скопировали полностью.' };
    return { ok: true, data };
  } catch(e) { return { ok: false, reason: 'Не удалось прочитать код. Проверьте что скопировали полностью.' }; }
}

function applyProfileSnapshot(data) {
  gameData.lp           = data.lp  || 0;
  gameData.imperials    = data.i   || 0;
  gameData.lunarStones  = data.ls  || 0;
  gameData.maxInventory = data.mi  || 6;
  gameData.currentClass = _CLSD[data.c] || data.c || 'warrior';
  gameData.inventory    = (data.inv || '').split(',').filter(s => s && s !== '.').map(unpackItem).filter(Boolean);
  gameData.equip        = unpackEquip(data.eq || {});
  gameData.keys         = unpackKeys(data.k   || '');
  gameData.dungeonProgress = unpackDp(data.dp || '');
  gameData.pouch        = unpackPouch(data.po || '0|');
  gameData.hugeChestPity = data.pt || 0;
  gameData.titles               = unpackTitles(data.t  || '');
  gameData.gachaSpinCount       = unpackSpins(data.gs  || '');
  gameData.mythicTitles         = unpackTitles(data.mt || '');
  gameData.mythicGachaSpinCount = unpackSpins(data.mg  || '');
  gameData.entryEffect  = data.ef  || null;
  gameData.cardFrame    = data.cf  || null;
  gameData.unlockedFrames         = data.uf  ? data.uf.split(',').filter(Boolean)  : [];
  gameData.unlockedEffects        = data.ue  ? data.ue.split(',').filter(Boolean)  : [];
  gameData.unlockedVictoryEffects = data.uve ? data.uve.split(',').filter(Boolean) : [];
  gameData.activeVictoryEffect    = data.ave || null;
  gameData.dailyWins        = data.dw  || 0;
  gameData.dailyGiftClaimed = data.dgc || false;
  gameData.lastDailyDate    = data.ldd || '';
  gameData.usedCodes        = data.uc  ? data.uc.split(',').filter(Boolean) : [];
  gameData.nextItemId       = data.nid || 0;
  gameData.nickname         = data.nn  || null;
  gameData.nicknameChanged  = data.nnc || false;
  Object.keys(CLASSES).forEach(c => { if (!gameData.equip[c]) gameData.equip[c] = { head:null, body:null, arms:null, legs:null }; });
  saveData();
}
