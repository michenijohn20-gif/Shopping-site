// ── CART ──
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem('zuri_cart') || '[]');
  if (!Array.isArray(cart)) cart = [];
} catch (e) {
  console.warn('Cart data corrupted, resetting:', e);
  cart = [];
  localStorage.removeItem('zuri_cart');
}

function updateCartCount() {
  const total = cart.reduce((s, i) => s + i.qty, 0);CART
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = total);
}

function addToCart(id, name, price, brand, emoji) {
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty++; }
  else { cart.push({ id, name, price, brand, emoji, qty: 1 }); }
  localStorage.setItem('zuri_cart', JSON.stringify(cart));
  updateCartCount();
  showToast(`Added to cart: ${name}`, 'success');
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  localStorage.setItem('zuri_cart', JSON.stringify(cart));
  updateCartCount();
  if (typeof renderCart === 'function') renderCart();
  if (typeof renderCartSidebar === 'function') renderCartSidebar();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  localStorage.setItem('zuri_cart', JSON.stringify(cart));
  updateCartCount();
  if (typeof renderCartSidebar === 'function') renderCartSidebar();
  if (typeof renderCart === 'function') renderCart();
}

function cartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

// ── TOAST ──
function showToast(msg, type = '') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.className = 'toast' + (type ? ' toast-' + type : '');
  el.innerHTML = (type === 'success' ? '✓ ' : type === 'error' ? '✕ ' : 'ℹ ') + msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── HAMBURGER ──
function initHamburger() {
  const ham = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!ham || !menu) return;
  ham.addEventListener('click', () => menu.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!ham.contains(e.target) && !menu.contains(e.target)) menu.classList.remove('open');
  });
}

// ── ACTIVE NAV ──
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page || (page === '' && a.getAttribute('href') === 'index.html'));
  });
}

// ── REVEAL ANIMATIONS ──
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    obs.observe(el);
  });
}

// ── IMPROVED NAV SEARCH with suggestions ──
function initNavSearch() {
  const inp = document.getElementById('navSearchInput');
  const btn = document.getElementById('navSearchBtn');
  if (!inp) return;

  const root = window.location.pathname.includes('/pages/') ? '../' : './';

  // Create suggestions dropdown
  const suggestBox = document.createElement('div');
  suggestBox.id = 'navSuggestBox';
  suggestBox.style.cssText = `
    position:absolute; top:100%; left:0; right:0; background:white;
    border:1.5px solid var(--border); border-top:none;
    border-radius:0 0 var(--radius-lg) var(--radius-lg);
    box-shadow:var(--shadow-lg); z-index:9999;
    max-height:320px; overflow-y:auto; display:none;
  `;
  const searchWrap = inp.closest('.nav-search');
  if (searchWrap) {
    searchWrap.style.position = 'relative';
    searchWrap.appendChild(suggestBox);
  }

  function searchProducts(q) {
    if (!q || q.length < 2) return [];
    const lower = q.toLowerCase();
    return PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.brand.toLowerCase().includes(lower) ||
      p.cat.toLowerCase().includes(lower) ||
      p.desc.toLowerCase().includes(lower)
    ).slice(0, 6);
  }

  function showSuggestions(q) {
    const results = searchProducts(q);
    if (!results.length || !q) { suggestBox.style.display = 'none'; return; }
    suggestBox.innerHTML = results.map(p => `
      <div class="nav-suggest-item" data-id="${p.id}" style="
        display:flex; align-items:center; gap:0.75rem; padding:0.65rem 1rem;
        cursor:pointer; border-bottom:1px solid var(--border); transition:background 0.15s;
      " onmouseenter="this.style.background='var(--primary-light)'"
         onmouseleave="this.style.background=''"
         onclick="goToProduct(${p.id})">
        <span style="font-size:1.6rem;flex-shrink:0;">${p.emoji}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.85rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${highlightMatch(p.name, q)}</div>
          <div style="font-size:0.72rem;color:var(--text-3);">${p.brand} · ${formatKES(p.price)}</div>
        </div>
        ${p.badge ? `<span class="badge badge-${getBadgeType(p.badge)}" style="flex-shrink:0;">${p.badge}</span>` : ''}
      </div>
    `).join('') + `
      <div style="padding:0.65rem 1rem;font-size:0.82rem;font-weight:700;color:var(--primary);cursor:pointer;text-align:center;"
           onclick="doNavSearch()">
        See all results for "${q}" →
      </div>`;
    suggestBox.style.display = 'block';
  }

  function highlightMatch(text, q) {
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return text.slice(0, idx) +
      `<mark style="background:var(--primary-light);color:var(--primary);border-radius:2px;">${text.slice(idx, idx + q.length)}</mark>` +
      text.slice(idx + q.length);
  }

  function doNavSearch() {
    const q = inp.value.trim();
    if (!q) return;
    suggestBox.style.display = 'none';
    window.location.href = root + 'pages/shop.html?q=' + encodeURIComponent(q);
  }

  // Debounce input
  let debounceTimer;
  inp.addEventListener('input', e => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => showSuggestions(e.target.value.trim()), 150);
  });

  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') doNavSearch();
    if (e.key === 'Escape') suggestBox.style.display = 'none';
  });

  btn?.addEventListener('click', doNavSearch);

  // Close on outside click
  document.addEventListener('click', e => {
    if (!searchWrap?.contains(e.target)) suggestBox.style.display = 'none';
  });
}

// Navigate to product detail page
function goToProduct(id) {
  const root = window.location.pathname.includes('/pages/') ? '' : 'pages/';
  window.location.href = root + 'product.html?id=' + id;
}

// ── WISHLIST ──
let wishlist = [];
try {
  wishlist = JSON.parse(localStorage.getItem('zuri_wish') || '[]');
  if (!Array.isArray(wishlist)) wishlist = [];
} catch (e) {
  console.warn('Wishlist data corrupted, resetting:', e);
  wishlist = [];
  localStorage.removeItem('zuri_wish');
}
function toggleWishlist(id, btn) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(i => i !== id);
    btn?.classList.remove('active');
    showToast('Removed from wishlist');
  } else {
    wishlist.push(id);
    btn?.classList.add('active');
    showToast('Added to wishlist ♥', 'success');
  }
  localStorage.setItem('zuri_wish', JSON.stringify(wishlist));
}

// ── AUTH MODAL ──
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('open');
  switchAuthTab(tab);
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('open');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab));
}

// ── USER DROPDOWN ──
function initUserDropdown() {
  const trigger = document.getElementById('userMenuTrigger');
  const dropdown = document.getElementById('userDropdown');
  if (!trigger || !dropdown) return;
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => dropdown.classList.remove('open'));
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  initHamburger();
  setActiveNav();
  initReveal();
  initNavSearch();
  initUserDropdown();

  document.getElementById('authModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeAuthModal();
  });
});

// ── PRODUCTS DATA ──
const PRODUCTS = [
  { id:1, name:'iPhone 16 Pro', brand:'Apple', cat:'phones', price:149000, emoji:'📱', badge:'New', rating:4.9, reviews:128, desc:'A18 Pro chip, 48MP camera, titanium build' },
  { id:2, name:'iPhone 16', brand:'Apple', cat:'phones', price:119000, emoji:'📱', badge:'New', rating:4.8, reviews:95, desc:'A18 chip, camera button, action button' },
  { id:3, name:'iPhone 15', brand:'Apple', cat:'phones', price:105000, emoji:'📱', badge:null, rating:4.7, reviews:210, desc:'Dynamic Island, USB-C, 48MP camera' },
  { id:4, name:'Samsung Galaxy S25 Ultra', brand:'Samsung', cat:'phones', price:175000, emoji:'📱', badge:'Hot', rating:4.9, reviews:87, desc:'Snapdragon 8 Elite, 200MP, built-in S Pen' },
  { id:5, name:'Samsung Galaxy S25', brand:'Samsung', cat:'phones', price:110000, emoji:'📱', badge:'New', rating:4.7, reviews:64, desc:'Snapdragon 8 Elite, compact flagship' },
  { id:6, name:'Tecno Camon 30 Pro', brand:'Tecno', cat:'phones', price:32000, emoji:'📱', badge:'Deal', rating:4.3, reviews:89, desc:'50MP RGBW camera, 5G, 5000mAh' },
  { id:7, name:'Infinix Note 40 Pro', brand:'Infinix', cat:'phones', price:28000, emoji:'📱', badge:null, rating:4.2, reviews:76, desc:'Helio G99 Ultra, 108MP, 45W charge' },
  { id:8, name:'Xiaomi 14', brand:'Xiaomi', cat:'phones', price:98000, emoji:'📱', badge:null, rating:4.6, reviews:54, desc:'Snapdragon 8 Gen 3, Leica cameras' },
  { id:9, name:'OnePlus 13', brand:'OnePlus', cat:'phones', price:89000, emoji:'📱', badge:null, rating:4.7, reviews:41, desc:'Snapdragon 8 Elite, Hasselblad cameras' },
  { id:10, name:'Realme GT 7 Pro', brand:'Realme', cat:'phones', price:65000, emoji:'📱', badge:'New', rating:4.5, reviews:38, desc:'Snapdragon 8 Elite, 120W charging' },
  { id:11, name:'iPad Pro 13" M4', brand:'Apple', cat:'tablets', price:195000, emoji:'📲', badge:'Pro', rating:4.9, reviews:72, desc:'M4 chip, Ultra Retina XDR, Apple Pencil Pro' },
  { id:12, name:'iPad Air 11" M2', brand:'Apple', cat:'tablets', price:115000, emoji:'📲', badge:null, rating:4.8, reviews:95, desc:'M2 chip, Liquid Retina, 12MP camera' },
  { id:13, name:'Samsung Galaxy Tab S10+', brand:'Samsung', cat:'tablets', price:145000, emoji:'📲', badge:null, rating:4.7, reviews:48, desc:'12.4" AMOLED, Snapdragon 8 Gen 3, S Pen' },
  { id:14, name:'Samsung Galaxy Tab A9+', brand:'Samsung', cat:'tablets', price:45000, emoji:'📲', badge:'Deal', rating:4.3, reviews:87, desc:'11" LCD, Snapdragon 695, 7040mAh' },
  { id:15, name:'MacBook Pro 14" M4', brand:'Apple', cat:'laptops', price:295000, emoji:'💻', badge:'Pro', rating:4.9, reviews:56, desc:'Apple M4 Pro, 24GB RAM, Liquid Retina XDR' },
  { id:16, name:'MacBook Air 15" M3', brand:'Apple', cat:'laptops', price:195000, emoji:'💻', badge:null, rating:4.8, reviews:83, desc:'Apple M3, 18h battery, fanless' },
  { id:17, name:'HP EliteBook 845 G11', brand:'HP', cat:'laptops', price:155000, emoji:'💻', badge:null, rating:4.6, reviews:44, desc:'AMD Ryzen 7, 16GB RAM, 512GB SSD' },
  { id:18, name:'Lenovo ThinkPad X1 Carbon', brand:'Lenovo', cat:'laptops', price:175000, emoji:'💻', badge:null, rating:4.7, reviews:38, desc:'Core Ultra 7, 16GB RAM, ultra-light' },
  { id:19, name:'ASUS ROG Zephyrus G16', brand:'ASUS', cat:'laptops', price:225000, emoji:'💻', badge:'Gaming', rating:4.8, reviews:29, desc:'RTX 4080, Ryzen 9, 240Hz OLED' },
  { id:20, name:'HP Pavilion 15', brand:'HP', cat:'laptops', price:75000, emoji:'💻', badge:'Deal', rating:4.3, reviews:118, desc:'Core i5, 8GB RAM, 256GB SSD' },
  { id:21, name:'Samsung 65" Neo QLED', brand:'Samsung', cat:'tvs', price:189000, emoji:'📺', badge:'Premium', rating:4.9, reviews:34, desc:'Neo QLED 4K, HDR2000, 144Hz' },
  { id:22, name:'LG 55" OLED C4', brand:'LG', cat:'tvs', price:155000, emoji:'📺', badge:null, rating:4.8, reviews:47, desc:'OLED evo, Dolby Vision, α9 Gen7 AI' },
  { id:23, name:'Hisense 58" 4K Smart', brand:'Hisense', cat:'tvs', price:55000, emoji:'📺', badge:'Deal', rating:4.5, reviews:124, desc:'UHD 4K, VIDAA Smart, Dolby Audio' },
  { id:24, name:'TCL 43" Android TV', brand:'TCL', cat:'tvs', price:38000, emoji:'📺', badge:null, rating:4.4, reviews:98, desc:'4K HDR, Google TV, Chromecast built-in' },
  { id:25, name:'Skyworth 32" FHD', brand:'Skyworth', cat:'tvs', price:22000, emoji:'📺', badge:'Budget', rating:4.2, reviews:156, desc:'Full HD, Android TV, WiFi built-in' },
  { id:26, name:'Sony WH-1000XM5', brand:'Sony', cat:'audio', price:42000, emoji:'🎧', badge:null, rating:4.9, reviews:203, desc:'Best-in-class ANC, 30h battery, LDAC' },
  { id:27, name:'Apple AirPods Pro 2', brand:'Apple', cat:'audio', price:35000, emoji:'🎧', badge:null, rating:4.8, reviews:178, desc:'H2 chip, Adaptive Audio, spatial audio' },
  { id:28, name:'JBL Charge 5', brand:'JBL', cat:'audio', price:18500, emoji:'🎧', badge:null, rating:4.7, reviews:245, desc:'IP67, 20h playtime, powerbank feature' },
  { id:29, name:'Marshall Woburn III', brand:'Marshall', cat:'audio', price:52000, emoji:'🎧', badge:'Premium', rating:4.8, reviews:67, desc:'110W RMS, Bluetooth 5.2, stereo' },
  { id:30, name:'Oraimo Spacebuds Lunar', brand:'Oraimo', cat:'audio', price:3500, emoji:'🎧', badge:'Deal', rating:4.3, reviews:312, desc:'ENC mic, 30h total, deep bass, IPX5' },
  { id:31, name:'PlayStation 5 Slim', brand:'Sony', cat:'gaming', price:75000, emoji:'🎮', badge:'Hot', rating:4.9, reviews:142, desc:'4K 120fps, 1TB SSD, DualSense included' },
  { id:32, name:'Xbox Series X', brand:'Microsoft', cat:'gaming', price:72000, emoji:'🎮', badge:null, rating:4.8, reviews:98, desc:'4K 120fps, 1TB SSD, Game Pass ready' },
  { id:33, name:'Nintendo Switch OLED', brand:'Nintendo', cat:'gaming', price:55000, emoji:'🎮', badge:null, rating:4.7, reviews:187, desc:'7" OLED, handheld & docked, 64GB' },
  { id:34, name:'DualSense Controller', brand:'Sony', cat:'gaming', price:9500, emoji:'🎮', badge:null, rating:4.8, reviews:214, desc:'Haptic feedback, adaptive triggers' },
  { id:35, name:'Sony Alpha A7 IV', brand:'Sony', cat:'cameras', price:295000, emoji:'📷', badge:'Pro', rating:4.9, reviews:43, desc:'33MP full-frame, 4K 60fps, 5-axis IBIS' },
  { id:36, name:'Canon EOS R50', brand:'Canon', cat:'cameras', price:95000, emoji:'📷', badge:null, rating:4.7, reviews:68, desc:'24.2MP APS-C, 4K, Dual Pixel AF' },
  { id:37, name:'DJI Mini 4 Pro', brand:'DJI', cat:'cameras', price:115000, emoji:'📷', badge:null, rating:4.8, reviews:57, desc:'4K HDR drone, 34min flight, omnidirectional sensing' },
  { id:38, name:'Apple Watch Series 10', brand:'Apple', cat:'wearables', price:65000, emoji:'⌚', badge:'New', rating:4.8, reviews:88, desc:'Thinnest design, sleep apnea detection' },
  { id:39, name:'Samsung Galaxy Watch 7', brand:'Samsung', cat:'wearables', price:42000, emoji:'⌚', badge:null, rating:4.7, reviews:72, desc:'BioActive sensor, 40h battery' },
  { id:40, name:'Xiaomi Smart Band 9', brand:'Xiaomi', cat:'wearables', price:5500, emoji:'⌚', badge:'Deal', rating:4.4, reviews:198, desc:'21-day battery, AMOLED, 5ATM' },
  { id:41, name:'Samsung Side-by-Side Fridge', brand:'Samsung', cat:'home', price:125000, emoji:'🏠', badge:null, rating:4.6, reviews:38, desc:'647L, Twin Cooling Plus, SpaceMax' },
  { id:42, name:'LG Front Loader 9kg', brand:'LG', cat:'home', price:75000, emoji:'🏠', badge:null, rating:4.7, reviews:52, desc:'AI DD, TurboWash 360, Steam+' },
  { id:43, name:'Hisense 1.5HP Split AC', brand:'Hisense', cat:'home', price:65000, emoji:'🏠', badge:'Deal', rating:4.5, reviews:74, desc:'Inverter, WiFi control, auto-clean' },
];

const CATEGORIES = [
  { id:'all', label:'All', emoji:'🛍️' },
  { id:'phones', label:'Phones', emoji:'📱' },
  { id:'tablets', label:'Tablets', emoji:'📲' },
  { id:'laptops', label:'Laptops', emoji:'💻' },
  { id:'tvs', label:'TVs', emoji:'📺' },
  { id:'audio', label:'Audio', emoji:'🎧' },
  { id:'gaming', label:'Gaming', emoji:'🎮' },
  { id:'cameras', label:'Cameras', emoji:'📷' },
  { id:'wearables', label:'Wearables', emoji:'⌚' },
  { id:'home', label:'Home', emoji:'🏠' },
];

function formatKES(n) { return 'KES ' + n.toLocaleString(); }

function renderStars(r) {
  const full = Math.floor(r);
  return '★'.repeat(full) + (r % 1 >= 0.5 ? '½' : '');
}

function getBadgeType(b) {
  const m = { New:'primary', Hot:'danger', Deal:'success', Pro:'secondary', Premium:'warning', Budget:'success', Gaming:'secondary' };
  return m[b] || 'primary';
}
