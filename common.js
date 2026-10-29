/* ============================================================
   MyOmpreng - UI BERSAMA (common.js)
   File ini berisi helper yang dipakai di semua halaman aplikasi:
   - Render sidebar navigasi & navbar
   - Notifikasi toast
   - Modal konfirmasi
   - Proteksi halaman (redirect ke login bila belum login)
   - Toggle sidebar mobile
   ============================================================ */

/* === CEK AUTENTIKASI ===
   Dipanggil di setiap halaman (kecuali login) di awal script.
   Jika belum login → redirect ke index.html */
function requireAuth() {
  const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || 'null');
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

/* === LOGOUT ===
   Hapus sesi & arahkan kembali ke halaman login. */
function logout() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  window.location.href = 'index.html';
}

/* === AMBIL INISIAL UNTUK AVATAR ===
   Misal "Administrator" → "A" */
function getInitials(name) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

/* === RENDER SIDEBAR MENU ===
   Halaman aktif ditandai via parameter activeId. */
function renderSidebar(activeId) {
  const session = requireAuth();
  if (!session) return;

  // Daftar menu navigasi utama
  const menu = [
    { id: 'dashboard', label: 'Dashboard',       icon: '🏠', href: 'dashboard.html' },
    { id: 'kelas',     label: 'Data Kelas',       icon: '🏫', href: 'kelas.html' },
    { id: 'pembagian', label: 'Pembagian MBG',    icon: '🍱', href: 'pembagian.html' },
    { id: 'ompreng',   label: 'Pengembalian Ompreng', icon: '♻️', href: 'ompreng.html' },
    { id: 'riwayat',   label: 'Riwayat & Laporan', icon: '📋', href: 'riwayat.html' },
  ];

  const items = menu.map(m => `
    <li>
      <a href="${m.href}" class="${m.id === activeId ? 'active' : ''}">
        <span class="ico">${m.icon}</span>
        <span>${m.label}</span>
      </a>
    </li>
  `).join('');

  // Tampilkan label identitas user di bawah menu
  const html = `
    <ul class="sidebar-menu">
      ${items}
    </ul>
    <div class="sidebar-section-label">Pengguna Aktif</div>
    <ul class="sidebar-menu">
      <li style="padding: 0 14px; font-size:13px; color: var(--text-muted);">
        <strong style="color: var(--text);">${escapeHtml(session.nama || session.username)}</strong><br>
        <small>@${escapeHtml(session.username)}</small>
      </li>
    </ul>
  `;

  // Inject ke elemen #sidebar (jika ada)
  const el = document.getElementById('sidebar');
  if (el) el.innerHTML = html;
}

/* === RENDER NAVBAR ATAS ===
   Termasuk tombol hamburger (mobile), brand, chip user, tombol logout. */
function renderNavbar() {
  const session = requireAuth();
  if (!session) return;

  const html = `
    <button class="menu-toggle" id="menuToggle" aria-label="Buka menu">☰</button>
    <a href="dashboard.html" class="navbar-brand">
      <span class="navbar-logo">M</span>
      <span class="brand-text">MyOmpreng</span>
    </a>
    <div class="navbar-right">
      <div class="user-chip">
        <span class="avatar">${getInitials(session.nama || session.username)}</span>
        <span class="user-name">${escapeHtml(session.nama || session.username)}</span>
      </div>
      <button class="btn btn-sm" style="background: rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.3);" id="btnLogout">
        ⏻ Keluar
      </button>
    </div>
  `;
  const el = document.getElementById('navbar');
  if (el) el.innerHTML = html;

  // Pasang event handler
  document.getElementById('btnLogout').addEventListener('click', confirmLogout);
  document.getElementById('menuToggle').addEventListener('click', toggleSidebarMobile);
}

/* === KONFIRMASI LOGOUT ===
   Tampilkan modal konfirmasi agar tidak salah klik. */
function confirmLogout() {
  showConfirm({
    title: 'Keluar dari Sistem',
    message: 'Apakah Anda yakin ingin logout dari MyOmpreng?',
    confirmText: 'Ya, Keluar',
    confirmClass: 'btn-danger',
    onConfirm: logout,
  });
}

/* === TOGGLE SIDEBAR PADA MOBILE ===
   Buka/tutup sidebar + tampilkan backdrop. */
function toggleSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
  if (backdrop) backdrop.classList.toggle('open');
}

/* === TUTUP SIDEBAR MOBILE ===
   Dipanggil ketika backdrop diklik. */
function closeSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
}

/* === RENDER TOAST NOTIFICATION ===
   Tipe: success | error | warning | info (default) */
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  // Hilangkan otomatis setelah durasi tertentu
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

/* === MODAL KONFIRMASI GENERIK ===
   Pemakaian:
     showConfirm({
       title: 'Hapus data?',
       message: 'Data yang dihapus tidak bisa dikembalikan',
       confirmText: 'Hapus',
       confirmClass: 'btn-danger',
       onConfirm: () => { ... lakukan hapus ... }
     });
*/
function showConfirm({ title, message, confirmText = 'Ya', confirmClass = 'btn-primary', onConfirm }) {
  // Bangun struktur modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${escapeHtml(title)}</h3>
        <button class="modal-close" data-close>×</button>
      </div>
      <div class="modal-body">
        <p style="font-size:14px; color: var(--text-muted);">${escapeHtml(message)}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" data-close>Batal</button>
        <button class="btn ${confirmClass}" data-confirm>${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Event handler
  overlay.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => overlay.remove());
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector('[data-confirm]').addEventListener('click', () => {
    overlay.remove();
    if (typeof onConfirm === 'function') onConfirm();
  });
}

/* === INISIALISASI LAYOUT BERSAMA ===
   Dipanggil di akhir body setiap halaman.
   activeId = id menu yang aktif di sidebar. */
function initLayout(activeId) {
  // Cek login lebih dulu — redirect kalau belum
  if (!requireAuth()) return;

  // Bangun struktur layout dasar (jika belum ada di HTML)
  // Banyak halaman sudah punya struktur ini di HTML, jadi kita hanya isi konten
  renderNavbar();
  renderSidebar(activeId);

  // Tambahkan backdrop untuk sidebar mobile jika belum ada
  if (!document.getElementById('sidebarBackdrop')) {
    const backdrop = document.createElement('div');
    backdrop.id = 'sidebarBackdrop';
    backdrop.className = 'sidebar-backdrop';
    backdrop.addEventListener('click', closeSidebarMobile);
    document.body.appendChild(backdrop);
  }
}
