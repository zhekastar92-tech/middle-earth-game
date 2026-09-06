// ============================================================
// VICTORY EFFECTS
// Canvas-анимации эффектов победы на арене.
// ============================================================

function playVictoryEffect(effectId) {
  let arena = document.getElementById('battle-arena');
  if (!arena) return;

  // Убираем старый оверлей если есть
  let old = arena.querySelector('.victory-overlay');
  if (old) old.remove();

  let overlay = document.createElement('div');
  overlay.className = 'victory-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:50;overflow:hidden;border-radius:inherit;';
  arena.style.position = 'relative';
  arena.appendChild(overlay);

  const W = arena.offsetWidth, H = arena.offsetHeight;

  // Авто-очистка через 3.5 сек
  let cleanupTimer = setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 3500);

  switch(effectId) {
    case 'gold':    _victory_gold(overlay, W, H, cleanupTimer);    break;
    case 'arcane':  _victory_arcane(overlay, W, H, cleanupTimer);  break;
    case 'inferno': _victory_inferno(overlay, W, H, cleanupTimer); break;
    case 'blood':   _victory_blood(overlay, W, H, cleanupTimer);   break;
    case 'storm':   _victory_storm(overlay, W, H, cleanupTimer);   break;
    case 'ascend':  _victory_ascend(overlay, W, H, cleanupTimer);  break;
  }
}

function _vCanvas(overlay, W, H) {
  let c = document.createElement('canvas');
  c.width = W; c.height = H;
  c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  overlay.appendChild(c);
  return c.getContext('2d');
}
function _vLabel(overlay, text, color, shadow) {
  let el = document.createElement('div');
  el.style.cssText = `position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) scale(0);
    font-size:19px;font-weight:900;color:${color};text-shadow:${shadow};
    white-space:nowrap;letter-spacing:2px;z-index:5;
    transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);`;
  el.textContent = text;
  overlay.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.style.transform = 'translate(-50%,-50%) scale(1)'));
  setTimeout(() => { el.style.transition='opacity 0.6s'; el.style.opacity='0'; }, 1900);
  return el;
}
function _rAFLoop(duration, fn, done) {
  let s=null;
  function step(ts){ if(!s)s=ts; let p=Math.min((ts-s)/duration,1); fn(p,ts-s); if(p<1)requestAnimationFrame(step); else if(done)done(); }
  requestAnimationFrame(step);
}

// ✨ Золотой взрыв
function _victory_gold(ov, W, H) {
  // Вспышка
  let flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:rgba(251,191,36,0);transition:background 0.15s;';
  ov.appendChild(flash);
  requestAnimationFrame(()=>{ flash.style.background='rgba(251,191,36,0.45)'; setTimeout(()=>{ flash.style.transition='background 0.7s'; flash.style.background='rgba(251,191,36,0)'; },150); });

  _vLabel(ov, '✦ ПОБЕДА ✦', '#fbbf24', '0 0 20px rgba(251,191,36,0.9),0 0 40px rgba(245,158,11,0.6)');
  let ctx = _vCanvas(ov, W, H);
  let parts = [];
  for(let i=0;i<50;i++){
    let a=Math.random()*Math.PI*2, sp=1.8+Math.random()*3.5;
    parts.push({ x:W/2,y:H/2, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1.2,
      size:5+Math.random()*10, ch:['★','✦','✧','·'][Math.floor(Math.random()*4)],
      color:['#fbbf24','#fde68a','#f59e0b','#fff8c0'][Math.floor(Math.random()*4)],
      life:1, decay:0.01+Math.random()*0.016, gravity:0.055 });
  }
  _rAFLoop(3000, ()=>{
    ctx.clearRect(0,0,W,H);
    parts.forEach(p=>{ if(p.life<=0)return; p.x+=p.vx; p.y+=p.vy; p.vy+=p.gravity; p.vx*=0.98; p.life-=p.decay;
      ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color; ctx.font=`${p.size}px serif`; ctx.fillText(p.ch,p.x,p.y); });
    ctx.globalAlpha=1;
  });
}

// 🔮 Мистический
function _victory_arcane(ov, W, H) {
  _vLabel(ov, '✦ ПОБЕДА ✦', '#c4b5fd', '0 0 20px rgba(168,85,247,0.9),0 0 40px rgba(99,102,241,0.6)');
  let ctx = _vCanvas(ov, W, H);
  let rings=[{r:0,s:2.2,col:'#a855f7',a:0.9},{r:0,s:1.6,col:'#818cf8',a:0.7},{r:0,s:1.0,col:'#06b6d4',a:0.5}];
  let runes=[]; let rc=['✦','⬡','◈','✧','⬢']; let rc2=['#a855f7','#818cf8','#c4b5fd','#06b6d4'];
  for(let i=0;i<28;i++){ let a=Math.random()*Math.PI*2;
    runes.push({ angle:a, orbitR:40+Math.random()*55, orbitSpeed:(Math.random()-0.5)*0.04,
      ch:rc[Math.floor(Math.random()*rc.length)], color:rc2[Math.floor(Math.random()*rc2.length)],
      size:8+Math.random()*8, life:1, decay:0.007+Math.random()*0.012 }); }
  _rAFLoop(3000, (p,el)=>{
    ctx.clearRect(0,0,W,H);
    rings.forEach((r,i)=>{ if(el<i*200)return; r.r+=r.s; let a=r.a*Math.max(0,1-r.r/(Math.max(W,H)*0.85));
      if(a<=0)return; ctx.globalAlpha=a; ctx.strokeStyle=r.col; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(W/2,H/2,r.r,0,Math.PI*2); ctx.stroke(); });
    runes.forEach(r=>{ if(r.life<=0)return; r.angle+=r.orbitSpeed; r.life-=r.decay;
      ctx.globalAlpha=Math.max(0,r.life); ctx.fillStyle=r.color; ctx.font=`${r.size}px serif`;
      ctx.fillText(r.ch, W/2+Math.cos(r.angle)*r.orbitR, H/2+Math.sin(r.angle)*r.orbitR); });
    ctx.globalAlpha=1;
  });
}

// 🔥 Адское пламя
function _victory_inferno(ov, W, H) {
  let fb = document.createElement('div');
  fb.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(0deg,rgba(180,0,0,0.6) 0%,rgba(239,68,68,0.25) 60%,transparent 100%);opacity:0;transition:opacity 0.2s;';
  ov.appendChild(fb);
  requestAnimationFrame(()=>{ fb.style.opacity='1'; setTimeout(()=>{ fb.style.transition='opacity 0.9s'; fb.style.opacity='0'; },500); });
  _vLabel(ov, '🔥 ПОБЕДА 🔥', '#fbbf24', '0 0 16px rgba(239,68,68,1),0 0 32px rgba(251,191,36,0.8)');
  let ctx = _vCanvas(ov, W, H);
  let embers=[];
  for(let i=0;i<65;i++) embers.push({ x:Math.random()*W, y:H+5, vx:(Math.random()-0.5)*1.5, vy:-(2+Math.random()*4),
    size:2+Math.random()*5.5, color:['#ef4444','#f97316','#fbbf24','#dc2626','#ff6b35'][Math.floor(Math.random()*5)],
    life:0.7+Math.random()*0.3, decay:0.008+Math.random()*0.016, wobble:Math.random()*6, wobbleSpeed:0.05+Math.random()*0.1 });
  _rAFLoop(3000, (p,el)=>{
    if(el<1600&&Math.random()<0.35) embers.push({ x:Math.random()*W, y:H+3, vx:(Math.random()-0.5)*1.5, vy:-(2+Math.random()*4),
      size:2+Math.random()*5, color:['#ef4444','#f97316','#fbbf24'][Math.floor(Math.random()*3)],
      life:0.6+Math.random()*0.4, decay:0.01+Math.random()*0.018, wobble:0, wobbleSpeed:0.06+Math.random()*0.1 });
    ctx.clearRect(0,0,W,H);
    embers.forEach(e=>{ if(e.life<=0)return; e.wobble+=e.wobbleSpeed; e.x+=e.vx+Math.sin(e.wobble)*0.5; e.y+=e.vy; e.life-=e.decay;
      ctx.globalAlpha=Math.max(0,e.life); ctx.fillStyle=e.color;
      ctx.beginPath(); ctx.arc(e.x,e.y,e.size/2,0,Math.PI*2); ctx.fill(); });
    ctx.globalAlpha=1;
  });
}

// 🩸 Кровавая жатва
function _victory_blood(ov, W, H) {
  let fl = document.createElement('div');
  fl.style.cssText = 'position:absolute;inset:0;border-radius:inherit;background:rgba(160,0,0,0.5);opacity:0;transition:opacity 0.1s;';
  ov.appendChild(fl);
  requestAnimationFrame(()=>{ fl.style.opacity='1'; setTimeout(()=>{ fl.style.transition='opacity 1.1s'; fl.style.opacity='0'; },200); });
  _vLabel(ov, '🩸 ПОБЕДА 🩸', '#fca5a5', '0 0 16px rgba(220,38,38,1),0 0 35px rgba(185,28,28,0.8)');
  let ctx = _vCanvas(ov, W, H);
  let drops=[];
  for(let i=0;i<45;i++) drops.push({ x:Math.random()*W, y:-(5+Math.random()*25), vx:(Math.random()-0.5)*0.5, vy:2.5+Math.random()*4,
    r:2+Math.random()*4, color:['rgba(220,38,38,0.9)','rgba(185,28,28,0.85)','rgba(239,68,68,0.8)'][Math.floor(Math.random()*3)],
    life:1, splat:false, splatParts:null, delay:Math.random()*600 });
  _rAFLoop(3000, (p,el)=>{
    ctx.clearRect(0,0,W,H);
    drops.forEach(d=>{ if(el<d.delay)return;
      if(!d.splat){ if(d.y<H-6){ d.x+=d.vx; d.y+=d.vy; d.vy*=1.01;
        ctx.globalAlpha=0.85; ctx.fillStyle=d.color;
        ctx.beginPath(); ctx.ellipse(d.x,d.y,d.r*0.6,d.r,0,0,Math.PI*2); ctx.fill();
      } else { d.splat=true; d.splatParts=[]; for(let i=0;i<5;i++){ let a=Math.random()*Math.PI; d.splatParts.push({dx:Math.cos(a)*(5+Math.random()*12),life:0.7}); } }
      } else { d.splatParts.forEach(s=>{ s.life-=0.03; if(s.life<=0)return;
        ctx.globalAlpha=s.life*0.7; ctx.fillStyle=d.color;
        ctx.beginPath(); ctx.arc(d.x+s.dx,H-4,1.5,0,Math.PI*2); ctx.fill(); }); }
    });
    ctx.globalAlpha=1;
  });
}

// ⚡ Буря
function _victory_storm(ov, W, H) {
  _vLabel(ov, '⚡ ПОБЕДА ⚡', '#67e8f9', '0 0 16px rgba(6,182,212,1),0 0 35px rgba(99,102,241,0.8)');
  let ctx = _vCanvas(ov, W, H);
  function mkBolt(x1,y1,x2,y2,r,d){ if(d===0)return[[x1,y1],[x2,y2]]; let mx=(x1+x2)/2+(Math.random()-0.5)*r,my=(y1+y2)/2+(Math.random()-0.5)*r*0.3; return[...mkBolt(x1,y1,mx,my,r/2,d-1),...mkBolt(mx,my,x2,y2,r/2,d-1).slice(1)]; }
  let bolts=[0,180,360,580,820].map(delay=>{ let x=W*0.15+Math.random()*W*0.7; return { delay, pts:mkBolt(x,-5,x+(Math.random()-0.5)*40,H+5,35,5), alpha:1, color:Math.random()<0.5?'#67e8f9':'#a78bfa', w:1.5+Math.random() }; });
  let sparks=[];
  for(let i=0;i<30;i++) sparks.push({ x:Math.random()*W, y:20+Math.random()*(H-40), len:15+Math.random()*40, angle:(Math.random()-0.5)*0.4, color:['#67e8f9','#a78bfa','#c4b5fd','#22d3ee'][Math.floor(Math.random()*4)], life:0.9+Math.random()*0.1, decay:0.02+Math.random()*0.03, delay:Math.random()*800 });
  _rAFLoop(3000, (p,el)=>{
    ctx.clearRect(0,0,W,H);
    bolts.forEach(b=>{ if(el<b.delay)return; let age=el-b.delay; b.alpha=age<100?1:Math.max(0,1-(age-100)/300); if(b.alpha<=0)return;
      ctx.globalAlpha=b.alpha; ctx.strokeStyle=b.color; ctx.lineWidth=b.w;
      ctx.shadowBlur=8; ctx.shadowColor=b.color;
      ctx.beginPath(); b.pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke(); ctx.shadowBlur=0; });
    sparks.forEach(s=>{ if(el<s.delay||s.life<=0)return; s.life-=s.decay;
      ctx.globalAlpha=Math.max(0,s.life); ctx.strokeStyle=s.color; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(s.x+Math.cos(s.angle)*s.len,s.y+Math.sin(s.angle)*s.len); ctx.stroke(); });
    ctx.globalAlpha=1;
  });
}

// 🌿 Вознесение
function _victory_ascend(ov, W, H) {
  let ray = document.createElement('div');
  ray.style.cssText = 'position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:55px;height:100%;background:linear-gradient(0deg,rgba(74,222,128,0.22) 0%,rgba(16,185,129,0.08) 55%,transparent 100%);opacity:0;transition:opacity 0.3s;';
  ov.appendChild(ray);
  requestAnimationFrame(()=>{ ray.style.opacity='1'; setTimeout(()=>{ ray.style.transition='opacity 1.2s'; ray.style.opacity='0'; },1400); });
  _vLabel(ov, '✦ ПОБЕДА ✦', '#4ade80', '0 0 16px rgba(74,222,128,0.9),0 0 35px rgba(16,185,129,0.6)');
  let ctx = _vCanvas(ov, W, H);
  let chars=['✦','·','★','⬡','✧'], colors=['#4ade80','#86efac','#bbf7d0','#10b981','#6ee7b7'];
  let leaves=[];
  for(let i=0;i<55;i++) leaves.push({ x:5+Math.random()*90, y:H*0.4+Math.random()*H*0.5, vx:(Math.random()-0.5)*0.8, vy:-(0.9+Math.random()*2),
    ch:chars[Math.floor(Math.random()*chars.length)], color:colors[Math.floor(Math.random()*colors.length)],
    size:7+Math.random()*9, life:0.85+Math.random()*0.15, decay:0.005+Math.random()*0.01,
    wobble:Math.random()*Math.PI*2, wobbleSpeed:0.02+Math.random()*0.04, delay:Math.random()*600 });
  _rAFLoop(3000, (p,el)=>{
    ctx.clearRect(0,0,W,H);
    leaves.forEach(l=>{ if(el<l.delay||l.life<=0)return; l.wobble+=l.wobbleSpeed; l.x+=l.vx+Math.sin(l.wobble)*0.4; l.y+=l.vy; l.life-=l.decay;
      ctx.globalAlpha=Math.max(0,l.life); ctx.fillStyle=l.color; ctx.font=`${l.size}px serif`;
      ctx.fillText(l.ch, W*l.x/100, l.y); });
    ctx.globalAlpha=1;
  });
}
