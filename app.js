// =============================================
//  Real Estate App — Core Logic
//  يعمل مع Google Sheets عبر Apps Script
// =============================================

/* ---- Utility ---- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showToast(msg, type = 'default', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✅', error: '❌', default: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ---- API Wrapper ---- */
const API = {
  async get(action, params = {}) {
    const url = new URL(CONFIG.API_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    return res.json();
  },
  async post(action, data = {}) {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...data }),
    });
    return res.json();
  }
};

/* ---- Data Helpers ---- */
function statusLabel(status) {
  const map = { 'متاح': 'available', 'مؤجر': 'rented', 'محجوز': 'reserved' };
  return map[status] || 'available';
}

function getFirstImage(imagesStr) {
  if (!imagesStr) return null;
  const parts = imagesStr.split(',').map(s => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  return driveUrl(parts[0]);
}

function getAllImages(imagesStr) {
  if (!imagesStr) return [];
  return imagesStr.split(',').map(s => s.trim()).filter(Boolean).map(driveUrl);
}

function driveUrl(raw) {
  // تحويل رابط Google Drive لرابط مباشر للصورة
  const m = raw.match(/\/d\/([^/]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w800`;
  const m2 = raw.match(/id=([^&]+)/);
  if (m2) return `https://drive.google.com/thumbnail?id=${m2[1]}&sz=w800`;
  return raw;
}

function formatPrice(n) {
  return Number(n).toLocaleString('ar-QA');
}

function propertyTypeIcon(type) {
  const map = {
    'STUDIO': '🏠', 'استديو': '🏠',
    '1BHK': '🛏', '2BHK': '🛏', '3BHK': '🛏', '4BHK': '🛏',
    'ROOM': '🚪', 'غرفة': '🚪',
    'VILLA': '🏡', 'فيلا': '🏡',
  };
  return map[type?.toUpperCase()] || '🏢';
}

/* ---- Property Card Builder ---- */
function buildPropertyCard(p) {
  const img = getFirstImage(p.images);
  const statusClass = statusLabel(p.status);
  const statusText = p.status || 'متاح';

  return `
    <div class="card property-card" data-id="${p.id}">
      <div class="property-img-wrap">
        ${img
          ? `<img src="${img}" alt="${p.title || p.type}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=property-img-placeholder><div class=icon>🏢</div><span>لا توجد صور</span></div>'">`
          : `<div class="property-img-placeholder"><div class="icon">🏢</div><span>لا توجد صور</span></div>`
        }
        <div class="property-badge badge-${statusClass}">${statusText}</div>
        <div class="property-id-badge">${p.id}</div>
      </div>
      <div class="card-body">
        <div class="property-type-tag">${propertyTypeIcon(p.type)} ${p.type}</div>
        <div class="property-title">${p.title || (p.type + ' — ' + p.location)}</div>
        <div class="property-location">📍 ${p.location || '—'}</div>
        <div class="property-price">${formatPrice(p.rent)} <span>ريال / شهر</span></div>
        <div class="property-meta">
          ${p.floor   ? `<div class="meta-item">🏢 الدور ${p.floor}</div>` : ''}
          ${p.furnished === 'نعم' ? `<div class="meta-item">🛋 مفروشة</div>` : ''}
          ${p.parking  ? `<div class="meta-item">🚗 ${p.parking}</div>` : ''}
        </div>
      </div>
      <div class="card-footer">
        <button class="btn btn-primary btn-sm" onclick="openProperty('${p.id}')">📋 عرض</button>
        <button class="btn btn-outline btn-sm" onclick="shareProperty('${p.id}')">📤 مشاركة</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="editProperty('${p.id}')" style="margin-right:auto;" title="تعديل">✏️</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteProperty('${p.id}')" title="حذف">🗑</button>
      </div>
    </div>`;
}

/* ---- Share ---- */
function shareProperty(id) {
  const url = `${CONFIG.SITE_URL}/property.html?id=${id}`;
  const text = `🏠 عقار للإيجار\nالمعرّف: ${id}\n${url}`;

  if (navigator.share) {
    navigator.share({ title: 'عقار للإيجار', text, url }).catch(() => {});
    return;
  }

  // fallback: copy + whatsapp option
  navigator.clipboard.writeText(url).then(() => {
    showToast('تم نسخ الرابط ✔', 'success');
  });

  // open whatsapp
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(wa, '_blank');
}

/* ---- Filter Logic ---- */
function filterProperties(properties, { search, type, status, maxPrice }) {
  return properties.filter(p => {
    if (type   && type   !== 'all' && p.type?.toUpperCase() !== type.toUpperCase()) return false;
    if (status && status !== 'all' && p.status !== status) return false;
    if (maxPrice && Number(p.rent) > Number(maxPrice)) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${p.id} ${p.title} ${p.type} ${p.location} ${p.notes}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/* ---- Gallery ---- */
class Gallery {
  constructor(images, containerId) {
    this.images = images;
    this.current = 0;
    this.container = document.getElementById(containerId);
    this.render();
  }
  render() {
    if (!this.container || !this.images.length) return;
    this.container.innerHTML = `
      <div class="gallery-main" id="galleryMain">
        <img id="galleryImg" src="${this.images[0]}" alt="صورة العقار">
        ${this.images.length > 1 ? `
          <div class="gallery-nav prev" onclick="window._gallery.prev()">›</div>
          <div class="gallery-nav next" onclick="window._gallery.next()">‹</div>
          <div class="gallery-counter" id="galleryCounter">1 / ${this.images.length}</div>
        ` : ''}
      </div>
      ${this.images.length > 1 ? `
        <div class="gallery-thumbs" id="galleryThumbs">
          ${this.images.map((img, i) => `
            <div class="thumb ${i === 0 ? 'active' : ''}" onclick="window._gallery.goto(${i})">
              <img src="${img}" alt="thumb ${i+1}">
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
    window._gallery = this;
  }
  goto(i) {
    this.current = (i + this.images.length) % this.images.length;
    const img = document.getElementById('galleryImg');
    if (img) img.src = this.images[this.current];
    const counter = document.getElementById('galleryCounter');
    if (counter) counter.textContent = `${this.current + 1} / ${this.images.length}`;
    $$('.thumb').forEach((t, idx) => t.classList.toggle('active', idx === this.current));
  }
  prev() { this.goto(this.current - 1); }
  next() { this.goto(this.current + 1); }
}

/* ---- URL Params ---- */
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/* ---- Export ---- */
window.APP = { API, buildPropertyCard, shareProperty, filterProperties, Gallery, getParam, showToast, getAllImages, getFirstImage, driveUrl, formatPrice, propertyTypeIcon, statusLabel };
