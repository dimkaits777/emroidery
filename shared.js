/* shared.js — runs on every page */

const FORMATS = ['PES','DST','EXP','HUS','JEF','VIP','VP3','XXX'];
const CF_MAIN = 'https://www.creativefabrica.com/search/ref/20531415/?query=mother&type=Embroidery';

/* ── WISHLIST ──────────────────────────────────────────────── */
let WL = JSON.parse(localStorage.getItem('wl') || '[]');

function wlSave(){ localStorage.setItem('wl', JSON.stringify(WL)); }

function wlToggle(id, title, image, affiliate){
  const idx = WL.findIndex(x => x.id === id);
  if(idx >= 0){ WL.splice(idx,1); }
  else{
    if(WL.length >= 20){ showToast('Wishlist full (20 max)'); return false; }
    WL.push({id, title, image, affiliate});
  }
  wlSave();
  wlRefreshUI();
  return idx < 0; // true = added
}

function wlHas(id){ return WL.some(x => x.id === id); }

function wlRefreshUI(){
  // badge
  const badge = document.getElementById('wl-badge');
  if(badge){ badge.textContent = WL.length; badge.classList.toggle('on', WL.length > 0); }
  // drawer items
  const cont = document.getElementById('drawer-items');
  const empty = document.getElementById('drawer-empty');
  const foot = document.getElementById('drawer-foot');
  if(!cont) return;
  cont.querySelectorAll('.d-item').forEach(el=>el.remove());
  WL.forEach(item=>{
    const d = document.createElement('div');
    d.className='d-item';
    d.innerHTML=`<img src="${item.image}" alt="${item.title}" loading="lazy">
    <div style="flex:1;min-width:0">
      <div class="d-item-title">${item.title}</div>
      <a href="${item.affiliate}" target="_blank" rel="noopener" class="d-item-buy">Download Now →</a><br>
      <button class="d-item-rm" onclick="wlRemove('${item.id}')">✕ Remove</button>
    </div>`;
    cont.appendChild(d);
  });
  if(empty) empty.style.display = WL.length ? 'none' : 'block';
  if(foot) foot.style.display = WL.length ? 'block' : 'none';
  // sync heart buttons
  document.querySelectorAll('[data-wish-id]').forEach(btn=>{
    const on = wlHas(btn.dataset.wishId);
    btn.textContent = on ? '❤️' : '🤍';
    btn.classList.toggle('on', on);
  });
}

function wlRemove(id){
  WL = WL.filter(x=>x.id!==id);
  wlSave();
  wlRefreshUI();
}

function toggleDrawer(){
  document.getElementById('drawer').classList.toggle('on');
  document.getElementById('drawer-ov').classList.toggle('on');
}

/* ── NAVBAR SCROLL ─────────────────────────────────────────── */
function initNavbar(){
  const nav = document.getElementById('navbar');
  const stitch = document.getElementById('stitch');
  let last = 0;
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY;
    if(y > last && y > 100) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    nav.classList.toggle('scrolled', y > 50);
    if(stitch){
      const total = document.documentElement.scrollHeight - window.innerHeight;
      stitch.style.height = Math.round(y/total*100)+'%';
    }
    last = y;
    revealCheck();
  }, {passive:true});
}

/* ── MOBILE MENU ─────────────────────────────────────────────*/
function toggleMobile(){
  document.getElementById('mobile-nav').classList.toggle('open');
}

/* ── REVEAL ON SCROLL ────────────────────────────────────────*/
function revealCheck(){
  document.querySelectorAll('.rev:not(.in)').forEach(el=>{
    if(el.getBoundingClientRect().top < window.innerHeight * .9)
      el.classList.add('in');
  });
}

/* ── TOAST ────────────────────────────────────────────────── */
function showToast(msg){
  let t = document.getElementById('toast');
  if(!t){
    t = document.createElement('div');
    t.id='toast';
    t.style.cssText='position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--plum);color:#fff;padding:.75rem 1.5rem;border-radius:50px;font-size:.85rem;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;font-family:Outfit,sans-serif;white-space:nowrap';
    document.body.appendChild(t);
  }
  t.textContent=msg;
  t.style.opacity='1';
  clearTimeout(t._to);
  t._to=setTimeout(()=>t.style.opacity='0', 2500);
}

/* ── SEARCH MODAL ─────────────────────────────────────────── */
function openSearch(){
  document.getElementById('search-modal').classList.add('on');
  document.getElementById('search-input').focus();
}
function closeSearch(){
  document.getElementById('search-modal').classList.remove('on');
  document.getElementById('search-input').value='';
  document.getElementById('search-results').innerHTML='';
}

function doSearch(q){
  const res = document.getElementById('search-results');
  if(!q.trim()){ res.innerHTML=''; return; }
  if(typeof PRODUCTS==='undefined'){ res.innerHTML='<p style="padding:1rem;color:var(--text-mid)">Loading…</p>'; return; }
  const matches = PRODUCTS.filter(p=>p.t.toLowerCase().includes(q.toLowerCase())).slice(0,12);
  if(!matches.length){ res.innerHTML='<p style="padding:1rem;color:var(--text-mid)">No results found</p>'; return; }
  res.innerHTML = matches.map(p=>`
    <a class="m-result" href="${p.a}" target="_blank" rel="noopener">
      <img src="${p.i}" alt="${p.t}" loading="lazy">
      <div class="m-result-title">${p.t}</div>
    </a>`).join('');
}

/* ── PRODUCT CARD HTML ────────────────────────────────────── */
function cardHTML(p, badge=''){
  const id = 'p'+p.a.replace(/[^a-z0-9]/gi,'').slice(-12);
  const isOn = wlHas(id);
  const tags = FORMATS.slice(0,5).map(f=>`<span class="tag">${f}</span>`).join('')+'<span class="tag">+3</span>';
  return `<div class="card" data-id="${id}">
    <div class="card-img">
      ${badge?`<span style="position:absolute;top:.6rem;left:.6rem;z-index:2;background:${badge==='Trending'?'var(--persimmon)':'var(--wasabi)'};color:#fff;font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.2rem .6rem;border-radius:20px">${badge}</span>`:''}
      <img src="${p.i}" alt="${p.t}" loading="lazy">
      <button class="card-wish ${isOn?'on':''}" data-wish-id="${id}"
        onclick="handleWish(this,'${id}',\`${p.t.replace(/`/g,"'")}\`,'${p.i}','${p.a}')">
        ${isOn?'❤️':'🤍'}
      </button>
    </div>
    <div class="card-body">
      <h3 class="card-title">${p.t}</h3>
      <div class="card-tags">${tags}</div>
      <a class="card-buy" href="${p.a}" target="_blank" rel="noopener">CLICK HERE AND DOWNLOAD</a>
    </div>
  </div>`;
}

function handleWish(btn, id, title, image, affiliate){
  const added = wlToggle(id, title, image, affiliate);
  btn.textContent = added ? '❤️' : '🤍';
  btn.classList.toggle('on', added);
  btn.style.transform='scale(1.3)';
  setTimeout(()=>btn.style.transform='',300);
  showToast(added ? '❤️ Added to wishlist' : 'Removed from wishlist');
}

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  initNavbar();
  wlRefreshUI();
  revealCheck();
  // search input listener
  const si = document.getElementById('search-input');
  if(si) si.addEventListener('input', e=>doSearch(e.target.value));
  // close search on overlay click
  const sm = document.getElementById('search-modal');
  if(sm) sm.addEventListener('click', e=>{ if(e.target===sm) closeSearch(); });
  // drawer overlay
  const dov = document.getElementById('drawer-ov');
  if(dov) dov.addEventListener('click', toggleDrawer);
});
