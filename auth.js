/* ============================================================
   MyOmpreng - AUTH (auth.js)
   File ini khusus menangani login & logout.
   Login sederhana berbasis localStorage — cocok untuk demo/sekolah.
   ============================================================ */

/* === PROSES LOGIN ===
   1. Cari user dengan username & password yang cocok
   2. Jika cocok → simpan sesi & redirect ke dashboard
   3. Jika tidak → tampilkan pesan error */
function handleLogin(event) {
  event.preventDefault();

  // Ambil nilai input
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorBox = document.getElementById('loginError');

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // Validasi sederhana — pastikan tidak kosong
  if (!username || !password) {
    showLoginError('Username dan password wajib diisi.');
    return;
  }

  // Cari user di data
  const users = getData(STORAGE_KEYS.USERS);
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    showLoginError('Username atau password salah. Silakan coba lagi.');
    return;
  }

  // Simpan sesi login
  const session = {
    username: user.username,
    nama: user.nama || user.username,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

  // Arahkan ke dashboard
  window.location.href = 'dashboard.html';
}

/* === TAMPILKAN PESAN ERROR DI LOGIN === */
function showLoginError(msg) {
  const errorBox = document.getElementById('loginError');
  if (errorBox) {
    errorBox.innerHTML = `<span>⚠️</span><span>${escapeHtml(msg)}</span>`;
    errorBox.classList.add('show');
  }
}

/* === JIKA SUDAH LOGIN & USER BUKA HALAMAN LOGIN → LANGSUNG KE DASHBOARD === */
(function redirectIfLoggedIn() {
  const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || 'null');
  if (session) {
    window.location.href = 'dashboard.html';
  }
})();

/* === PASANG EVENT HANDLER SAAT HALAMAN LOGIN SIAP === */
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);

    // Tombol "Isi otomatis" untuk kredensial demo
    const fillDemo = document.getElementById('fillDemo');
    if (fillDemo) {
      fillDemo.addEventListener('click', () => {
        document.getElementById('username').value = 'admin';
        document.getElementById('password').value = 'admin123';
      });
    }
  }
});
