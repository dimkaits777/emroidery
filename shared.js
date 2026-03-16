/* ============================================================
   shared.js — Mother's Day Embroidery
   Wishlist · Search · Filter · Pagination · Cards
   ============================================================ */

'use strict';

// ── Download counts (stable per session) ──────────────────
const DL_COUNTS = {};
function getDL(title) {
  if (!DL_COUNTS[title]) DL_COUNTS[title] = 8 + Math.floor(Math.random() * 47);
  return DL_COUNTS[title];
}

// ── Wishlist ───────────────────────────────────────────────
const WISH_KEY = 'mde_wishlist';
function getWish() {
  try { return JSON.parse(localStorage.getItem(WISH_KEY) || '[]'); } catch { return []; }
}
function saveWish(list) { localStorage.setItem(WISH_KEY, JSON.stringify(list)); }
function toggleWish(product) {
  let list = getWish();
  const idx = list.findIndex(p => p.a === product.a);
  if (idx > -1) { list.splice(idx, 1); } else { list.push(product); }
  saveWish(list);
  updateWishUI();
  showToast(idx > -1 ? '💔 Removed from wishlist' : '❤️ Added to wishlist!');
}
function isWished(affiliate) { return getWish().some(p => p.a === affiliate); }

function updateWishUI() {
  const list = getWish();
  const count = list.length;
  document.querySelectorAll('.wishlist-count').forEach(el => {
    el.textContent = count;
    el.classList.toggle('visible', count > 0);
  });
  // Update heart buttons
  document.querySelectorAll('.card-wish').forEach(btn => {
    const a = btn.dataset.affiliate;
    btn.classList.toggle('active', isWished(a));
    btn.textContent = isWished(a) ? '❤️' : '🤍';
  });
  renderDrawer();
}

function renderDrawer() {
  const body = document.querySelector('.drawer-body');
  if (!body) return;
  const list = getWish();
  if (list.length === 0) {
    body.innerHTML = `<div class="drawer-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <p>Your wishlist is empty.<br>Heart a design to save it!</p>
    </div>`;
    return;
  }
  body.innerHTML = list.map(p => `
    <div class="drawer-item">
      <img src="${p.i}" alt="${escHtml(p.t)}" loading="lazy" onerror="this.src='https://placehold.co/64x64/f2d9d9/c9848a?text=✿'">
      <div class="drawer-item-info">
        <div class="drawer-item-title">${escHtml(p.t)}</div>
        <a class="drawer-item-dl btn" href="${p.a}" target="_blank" rel="noopener">
          ⬇ Download
        </a>
      </div>
      <button class="drawer-item-remove" onclick="removeFromWish('${escAttr(p.a)}')" title="Remove">✕</button>
    </div>
  `).join('');
}

function removeFromWish(affiliate) {
  let list = getWish().filter(p => p.a !== affiliate);
  saveWish(list);
  updateWishUI();
}

// ── Drawer open/close ──────────────────────────────────────
function openDrawer() {
  document.querySelector('.wishlist-drawer')?.classList.add('open');
  document.querySelector('.drawer-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  document.querySelector('.wishlist-drawer')?.classList.remove('open');
  document.querySelector('.drawer-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 2600);
}

// ── HTML helpers ──────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) { return String(s).replace(/'/g, '&#39;'); }

// ── Card HTML ─────────────────────────────────────────────
function cardHTML(p) {
  const wished = isWished(p.a);
  const dl = getDL(p.t);
  const hot = dl > 30;
  return `
    <div class="product-card">
      <div class="card-img-wrap">
        ${hot ? `<span class="card-badge-hot">🔥 Hot</span>` : ''}
        <img src="${escHtml(p.i)}" alt="${escHtml(p.t)}" loading="lazy"
             onerror="this.src='https://placehold.co/400x400/f2d9d9/c9848a?text=✿'">
        <button class="card-wish ${wished ? 'active' : ''}" data-affiliate="${escAttr(p.a)}"
                onclick="handleWish(this, event)" title="Add to wishlist">
          ${wished ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escHtml(p.t)}</h3>
        <div class="card-meta">
          <span class="card-dl-count">🔥 ${dl} downloaded today</span>
        </div>
        <a class="card-cta" href="${escHtml(p.a)}" target="_blank" rel="noopener sponsored">
          ⬇ CLICK HERE AND DOWNLOAD
        </a>
      </div>
    </div>`;
}

function handleWish(btn, e) {
  e.preventDefault(); e.stopPropagation();
  const a = btn.dataset.affiliate;
  const p = (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []).find(x => x.a === a) || { a, t: btn.closest('.product-card')?.querySelector('.card-title')?.textContent || '', i: btn.closest('.product-card')?.querySelector('img')?.src || '' };
  toggleWish(p);
}

// ── Catalog logic (used on shop.html) ─────────────────────
let currentPage = 1;
let currentCat  = 'all';
let currentSearch = '';
let currentSort = 'default';
const PER_PAGE = 24;

function filteredProducts() {
  if (typeof PRODUCTS === 'undefined') return [];
  let list = PRODUCTS;
  if (currentCat !== 'all') list = list.filter(p => p.c === currentCat);
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    list = list.filter(p => p.t.toLowerCase().includes(q));
  }
  if (currentSort === 'az') list = [...list].sort((a,b) => a.t.localeCompare(b.t));
  if (currentSort === 'za') list = [...list].sort((a,b) => b.t.localeCompare(a.t));
  return list;
}

function renderGrid(container) {
  const all = filteredProducts();
  const total = all.length;
  const pages = Math.ceil(total / PER_PAGE);
  const slice = all.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);

  // Count el
  const countEl = document.querySelector('.shop-count');
  if (countEl) countEl.textContent = `Showing ${slice.length} of ${total} designs`;

  container.innerHTML = slice.map(cardHTML).join('');
  renderPagination(pages);
}

function renderPagination(pages) {
  const pg = document.querySelector('.pagination');
  if (!pg) return;
  if (pages <= 1) { pg.innerHTML = ''; return; }
  const maxBtns = 7;
  let html = `<button class="page-btn prev" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}>← Prev</button>`;
  for (let i = 1; i <= pages; i++) {
    if (pages > maxBtns && i > 3 && i < pages - 2 && Math.abs(i - currentPage) > 1) {
      if (i === 4 || i === pages - 3) html += `<span style="padding:0 4px;color:var(--text-light)">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn next" onclick="goPage(${currentPage+1})" ${currentPage===pages?'disabled':''}>Next →</button>`;
  pg.innerHTML = html;
}

function goPage(n) {
  const pages = Math.ceil(filteredProducts().length / PER_PAGE);
  if (n < 1 || n > pages) return;
  currentPage = n;
  const g = document.querySelector('.products-grid');
  if (g) renderGrid(g);
  window.scrollTo({ top: document.querySelector('.shop-layout')?.offsetTop - 80 || 0, behavior: 'smooth' });
}

function setCategory(cat) {
  currentCat = cat;
  currentPage = 1;
  document.querySelectorAll('.filter-item, .cat-chip').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  const g = document.querySelector('.products-grid');
  if (g) renderGrid(g);
}

// ── Navigation active link ─────────────────────────────────
function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
  });
}

// ── Hamburger ─────────────────────────────────────────────
function initHamburger() {
  const btn = document.querySelector('.hamburger');
  const nav = document.querySelector('.mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
}

// ── Init on DOMContentLoaded ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initHamburger();
  updateWishUI();

  // Wishlist button
  document.querySelectorAll('.btn-wishlist').forEach(btn =>
    btn.addEventListener('click', openDrawer)
  );
  document.querySelector('.drawer-close')?.addEventListener('click', closeDrawer);
  document.querySelector('.drawer-overlay')?.addEventListener('click', closeDrawer);

  // Shop page init
  const grid = document.querySelector('.products-grid');
  if (grid && typeof PRODUCTS !== 'undefined') {
    // Read URL params
    const params = new URLSearchParams(location.search);
    if (params.get('cat')) currentCat = params.get('cat');
    if (params.get('q')) currentSearch = params.get('q');

    // Search
    const searchEl = document.querySelector('#shopSearch');
    if (searchEl) {
      searchEl.value = currentSearch;
      searchEl.addEventListener('input', () => {
        currentSearch = searchEl.value.trim();
        currentPage = 1;
        renderGrid(grid);
      });
    }

    // Sort
    const sortEl = document.querySelector('#shopSort');
    if (sortEl) sortEl.addEventListener('change', () => {
      currentSort = sortEl.value;
      currentPage = 1;
      renderGrid(grid);
    });

    // Category filter items
    document.querySelectorAll('.filter-item').forEach(el => {
      el.addEventListener('click', () => setCategory(el.dataset.cat));
    });

    // Cat chips
    document.querySelectorAll('.cat-chip').forEach(el => {
      el.addEventListener('click', () => setCategory(el.dataset.cat));
    });

    // Filter toggle (mobile)
    const filterToggle = document.querySelector('.filter-toggle');
    const sidebar = document.querySelector('.shop-sidebar');
    if (filterToggle && sidebar) {
      filterToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // Set initial active filter
    if (currentCat !== 'all') {
      document.querySelectorAll('.filter-item, .cat-chip').forEach(el => {
        el.classList.toggle('active', el.dataset.cat === currentCat);
      });
    }

    renderGrid(grid);
  }
});
