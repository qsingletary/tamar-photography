/* Site script: data helpers, hash router, image viewer. */
(function(){
const S = window.SERIES, CATS = window.CATS, INFO = window.INFO;
INFO.booking = 'Bookings, commissions and editorial';
const pad = n => String(n).padStart(2,'0');
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const T = window.T = {S, CATS, INFO, pad, esc};

T.src   = (s,j) => `img/${s.dir}/${String(j+1).padStart(2,'0')}.jpg`;
T.by    = c => S.filter(s => s.cat===c);
T.get   = id => S.find(s => s.id===id);
T.cat   = id => CATS.find(c => c.id===id);
T.line  = s => s.talent ? 'With '+s.talent : (s.desc && s.desc.length<60 ? s.desc.replace(/\.$/,'') : `${T.cat(s.cat).name}, ${s.year}`);
T.desc  = s => s.desc || (s.talent ? 'With '+s.talent+'.' : `${T.cat(s.cat).name}, ${s.year}.`);
T.ar    = (s,j) => (s.f[j][0]/s.f[j][1]).toFixed(3);
T.vert  = (s,j) => s.f[j][1] > s.f[j][0];
T.img   = (s,j,extra) => `<img loading="lazy" decoding="async" src="${T.src(s,j)}" width="${s.f[j][0]}" height="${s.f[j][1]}" alt="${esc(s.title)}, photograph ${j+1} of ${s.f.length}" ${extra||''}>`;
T.cover = (s,extra) => T.img(s,s.cover,extra);
T.next  = s => { const a = T.by(s.cat); return a[(a.indexOf(s)+1)%a.length]; };
T.years = list => { const y = list.map(s=>s.year); const a=Math.min(...y), b=Math.max(...y); return a===b ? String(a) : `${a}–${b}`; };
/* booking: the address is shown as text (mail links are unreliable inside a preview) with a copy button */
T.mail  = label => `<a class="mail" href="mailto:${INFO.email}?subject=Booking%20enquiry">${label||INFO.email}</a>`;
T.copy  = label => `<button type="button" class="copy" data-copy="${INFO.email}">${label||'Copy'}</button>`;

/* story rows, as in the current build: horizontals alone, consecutive verticals paired, lone verticals drift */
T.rows = s => { const out=[]; let d=0;
  for(let i=0;i<s.f.length;i++){
    const v=T.vert(s,i), nv=i+1<s.f.length && T.vert(s,i+1);
    if(v && nv && i>0){ out.push({k:'pair',idx:[i,i+1]}); i++; }
    else if(v) out.push({k:'solo '+['c','l','r'][d++%3],idx:[i]});
    else out.push({k:'wide',idx:[i]});
  } return out; };
/* justified rows: every picture in a row gets the same height, nothing is cropped */
T.pack = (s,pattern) => { const out=[]; let i=0,p=0;
  while(i<s.f.length){ let n=pattern[p++%pattern.length]; if(n===1 && T.vert(s,i)) n=2; out.push(Array.from({length:Math.min(n,s.f.length-i)},(_,q)=>i+q)); i+=n; }
  return out; };
T.fig = (s,j,cls) => `<figure class="${cls||''}" data-lb="${j}" style="--ar:${T.ar(s,j)}">${T.img(s,j)}</figure>`;

/* ---------- base styles (placed first in <head>, so each concept's own CSS overrides them) ---------- */
const css = document.createElement('style');
css.textContent = `
*,*::before,*::after{box-sizing:border-box}
h1,h2,h3,p,figure,dl,dd,ul,ol,blockquote{margin:0;padding:0}
ul,ol{list-style:none}
a{color:inherit;text-decoration:none}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit;letter-spacing:inherit;text-transform:inherit}
img{display:block;max-width:100%;height:auto}
:focus-visible{outline:1px solid currentColor;outline-offset:3px}
[data-lb]{cursor:zoom-in}
.view{animation:kfade .5s ease both}
@keyframes kfade{from{opacity:0}to{opacity:1}}
.copy{font-size:.85em;opacity:.6;margin-left:.6em;text-decoration:underline;text-underline-offset:3px}
.copy:hover{opacity:1}
.mail{user-select:all}
/* viewer */
.lb{position:fixed;inset:0;z-index:100;background:var(--lb-bg,#fff);color:var(--lb-fg,#111);display:grid;grid-template-rows:auto minmax(0,1fr) auto;font-size:12px}
.lb-top,.lb-bot{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px max(16px,env(safe-area-inset-right,0px)) 14px max(16px,env(safe-area-inset-left,0px))}
.lb-top{padding-top:calc(14px + env(safe-area-inset-top,0px))}
.lb-bot{padding-bottom:calc(14px + env(safe-area-inset-bottom,0px));opacity:.6}
.lb-x{padding:6px 0 6px 12px}
.lb-stage{position:relative;display:grid;place-items:center;min-height:0;padding:0 max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px))}
.lb-img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;min-height:0}
.lb-stage>button{position:absolute;top:50%;transform:translateY(-50%);padding:18px 14px;font-size:18px;z-index:2}
.lb-pv{left:4px}.lb-nx{right:4px}
.lb.halves .lb-stage>button{top:0;bottom:0;transform:none;width:50%;padding:0;font-size:0}
.lb.halves .lb-pv{left:0;cursor:w-resize}.lb.halves .lb-nx{right:0;cursor:e-resize}
.lb.backdrop .lb-stage{cursor:zoom-out}.lb.backdrop .lb-img{cursor:default}.lb.clicknext .lb-img{cursor:e-resize}
.lb-strip{display:flex;gap:6px;justify-content:center;padding:0 16px 4px;overflow-x:auto}
.lb-strip button{flex:none;height:52px;opacity:.4;transition:opacity .2s}
.lb-strip button[aria-current="true"],.lb-strip button:hover{opacity:1}
.lb-strip img{height:100%;width:auto}
.lb-scroll{overflow-y:auto;scroll-snap-type:y mandatory;min-height:0;overscroll-behavior:contain}
.lb-scroll figure{height:100%;display:grid;place-items:center;scroll-snap-align:center;padding:10px 16px}
.lb-scroll img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}
/* review label */
.kn{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:90;font:12px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;letter-spacing:0;text-transform:none;color:#f2f2ef;width:max-content;max-width:calc(100vw - 24px)}
.kn-b{display:block;margin:0 auto;background:#141414;color:#f2f2ef;padding:7px 13px;border-radius:99px;box-shadow:0 0 0 1px rgba(255,255,255,.22);white-space:nowrap}
.kn-p{background:#141414;box-shadow:0 0 0 1px rgba(255,255,255,.22);padding:16px 18px;margin-bottom:8px;width:min(400px,calc(100vw - 24px));max-height:min(70vh,560px);overflow:auto;border-radius:6px}
.kn-p h2{font:600 14px/1.3 inherit;font-family:inherit;margin-bottom:6px}
.kn-p p{color:#bdbdb8;margin-bottom:12px}
.kn-p dt{color:#8d8d88;font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-top:10px}
.kn-p dd{margin-top:1px}
.kn-h{margin-top:14px;color:#8d8d88;text-decoration:underline;text-underline-offset:3px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
`;
document.head.insertBefore(css, document.head.firstChild);

/* ---------- viewer ---------- */
function viewer(o){
  o = Object.assign({mode:'stage',backdrop:true,halves:false,strip:false,wheel:false,clickNext:false}, o);
  const el = document.createElement('div');
  el.className = 'lb' + (o.halves?' halves':'') + (o.backdrop?' backdrop':'') + (o.clickNext?' clicknext':'');
  el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-label','Image viewer'); el.hidden = true;
  const hint = o.mode==='scroll' ? 'Scroll to move' : o.halves ? 'Click left or right to move' : o.backdrop ? 'Click outside the photograph to close' : '';
  el.innerHTML = `<div class="lb-top"><span class="lb-t"></span><button type="button" class="lb-x">Close ×</button></div>` +
    (o.mode==='scroll' ? `<div class="lb-scroll"></div>` : `<div class="lb-stage"><button type="button" class="lb-pv" aria-label="Previous photograph">←</button><img class="lb-img" alt=""><button type="button" class="lb-nx" aria-label="Next photograph">→</button></div>`) +
    (o.strip ? `<div class="lb-strip"></div>` : '') +
    `<div class="lb-bot"><span>${hint}</span><span class="lb-n"></span></div>`;
  document.body.appendChild(el);
  const $ = q => el.querySelector(q);
  let s=null, j=0, last=null, lockUntil=0;
  const count = () => { $('.lb-n').textContent = `${pad(j+1)} / ${pad(s.f.length)}`; };
  function show(){
    count();
    if(o.mode!=='scroll'){ const im=$('.lb-img'); im.src=T.src(s,j); im.alt=`${s.title}, photograph ${j+1} of ${s.f.length}`; new Image().src=T.src(s,(j+1)%s.f.length); }
    if(o.strip) el.querySelectorAll('.lb-strip button').forEach((b,i) => b.setAttribute('aria-current', i===j));
  }
  function step(d){ if(!s) return; const n=s.f.length;
    if(o.mode==='scroll'){ const t=Math.max(0,Math.min(n-1,j+d)), f=$('.lb-scroll').children[t]; if(f){ j=t; count(); f.scrollIntoView({behavior:'smooth',block:'center'}); } return; }
    j=(j+d+n)%n; show(); }
  function open(series, at){
    s=series; j=at||0; last=document.activeElement; el.hidden=false; document.documentElement.style.overflow='hidden';
    $('.lb-t').textContent = s.title;
    if(o.strip) $('.lb-strip').innerHTML = s.f.map((_,i) => `<button type="button" data-i="${i}" aria-label="Photograph ${i+1}"><img src="${T.src(s,i)}" alt=""></button>`).join('');
    if(o.mode==='scroll'){ const sc=$('.lb-scroll'); sc.innerHTML = s.f.map((_,i) => `<figure data-i="${i}"><img src="${T.src(s,i)}" alt="${esc(s.title)}, photograph ${i+1} of ${s.f.length}"></figure>`).join('');
      sc.children[j].scrollIntoView({block:'center'}); }
    show(); $('.lb-x').focus();
  }
  function close(silent){ if(el.hidden) return; el.hidden=true; document.documentElement.style.overflow=''; s=null; if(!silent && last && last.focus) last.focus(); }
  $('.lb-x').onclick = () => close();
  if(o.mode==='scroll'){
    const sc=$('.lb-scroll');
    sc.addEventListener('scroll', () => { if(!s) return; const mid=sc.scrollTop+sc.clientHeight/2; let best=0,bd=1e9;
      [...sc.children].forEach((f,i) => { const d=Math.abs(f.offsetTop+f.offsetHeight/2-mid); if(d<bd){bd=d;best=i} }); if(best!==j){ j=best; count(); } }, {passive:true});
  } else {
    $('.lb-pv').onclick = e => { e.stopPropagation(); step(-1); };
    $('.lb-nx').onclick = e => { e.stopPropagation(); step(1); };
    $('.lb-img').onclick = e => { e.stopPropagation(); if(o.clickNext) step(1); };
    $('.lb-stage').onclick = () => { if(o.backdrop) close(); };
    if(o.strip) $('.lb-strip').onclick = e => { const b=e.target.closest('button'); if(b){ j=+b.dataset.i; show(); } };
    if(o.wheel) el.addEventListener('wheel', e => { e.preventDefault(); const now=Date.now(); if(now<lockUntil || Math.abs(e.deltaY)+Math.abs(e.deltaX)<12) return; lockUntil=now+380; step((Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX)>0?1:-1); }, {passive:false});
    let tx=0; el.addEventListener('touchstart', e => tx=e.touches[0].clientX, {passive:true});
    el.addEventListener('touchend', e => { const dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>50) step(dx<0?1:-1); });
  }
  addEventListener('keydown', e => { if(!s) return;
    if(e.key==='Escape') close();
    else if(e.key==='ArrowRight'||e.key==='ArrowDown'){ e.preventDefault(); step(1); }
    else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){ e.preventDefault(); step(-1); } });
  return {open, close, el};
}

/* ---------- review notes ---------- */
function notes(n){
  if(!n) return;
  const el = document.createElement('aside'); el.className='kn'; el.setAttribute('aria-label','Concept notes');
  el.innerHTML = `<div class="kn-p" hidden><h2>Concept ${n.no}: ${esc(n.name)}</h2><p>${n.idea}</p><dl>${n.rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl><p style="margin:14px 0 0">Prototype content: 7 photographs per project, an assumed sort into the three categories, and a placeholder booking email.</p><button type="button" class="kn-h">Hide this label</button></div><button type="button" class="kn-b" aria-expanded="false">Concept ${n.no} · ${esc(n.name)} · notes</button>`;
  document.body.appendChild(el);
  const b=el.querySelector('.kn-b'), p=el.querySelector('.kn-p');
  b.onclick = () => { p.hidden=!p.hidden; b.setAttribute('aria-expanded', !p.hidden); };
  el.querySelector('.kn-h').onclick = () => el.remove();
}

/* ---------- router ---------- */
T.start = function(o){
  const app = T.app = document.querySelector(o.app||'#app');
  T.lb = viewer(o.viewer||{});
  const onScroll = () => document.body.classList.toggle('scrolled', scrollY>40);
  function route(){
    T.lb.close(true);
    const h = location.hash.slice(1); let view='home', arg=null;
    if(T.cat(h)){ view='cat'; arg=T.cat(h); }
    else if(h.startsWith('p-') && T.get(h.slice(2))){ view='project'; arg=T.get(h.slice(2)); }
    T.view=view; T.arg=arg;
    document.body.dataset.view=view; document.body.dataset.cat = view==='cat' ? arg.id : view==='project' ? arg.cat : '';
    o[view](arg, app);
    if(view==='project') app.querySelectorAll('[data-lb]').forEach(f => { f.tabIndex=0; f.setAttribute('role','button'); f.setAttribute('aria-label','Open photograph '+(+f.dataset.lb+1));
      const go = () => T.lb.open(arg, +f.dataset.lb); f.onclick=go; f.onkeydown = e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } }; });
    o.after && o.after(view,arg);
    scrollTo(0,0); onScroll();
  }
  document.addEventListener('click', e => { const c=e.target.closest('[data-copy]'); if(!c) return; e.preventDefault(); e.stopPropagation();
    const done = () => { const t=c.textContent; c.textContent='Copied'; setTimeout(() => c.textContent=t, 1400); };
    try{ navigator.clipboard.writeText(c.dataset.copy).then(done, () => {}); }catch(err){} });
  addEventListener('hashchange', route); addEventListener('scroll', onScroll, {passive:true});
  route(); notes(o.notes);
};
})();
