/* ============================================================
   MyOmpreng - STORAGE LAYER (storage.js)
   File ini mengelola seluruh data aplikasi menggunakan localStorage.
   Dipisahkan agar logika data terpusat di satu tempat & mudah dipelajari.

   Struktur data:
   - users:        daftar admin {username, password}
   - session:     sesi login aktif saat ini
   - kelas:        daftar kelas {id, namaKelas, jumlahSiswa}
   - pembagian:    catatan pembagian MBG harian
   - pengembalian: catatan pengembalian ompreng (boleh bertahap)
   ============================================================ */

/* Kunci penyimpanan localStorage — semua diprefix "myompreng_" */
const STORAGE_KEYS = {
  USERS:        'myompreng_users',
  SESSION:      'myompreng_session',
  KELAS:        'myompreng_kelas',
  PEMBAGIAN:    'myompreng_pembagian',
  PENGEMBALIAN: 'myompreng_pengembalian',
};

/* === FUNGSI UMUM BACA/TULIS localStorage ===
   Semua data disimpan sebagai JSON string. */
function getData(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Gagal membaca data:', key, e);
    return [];
  }
}
function setData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Gagal menyimpan data:', key, e);
    return false;
  }
}

/* === GENERATE ID UNIK ===
   Pakai timestamp + random agar tidak mudah bentrokan. */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* === SEED DATA AWAL ===
   Saat aplikasi pertama kali dibuka, kita isi:
   - 1 akun admin default (admin / admin123)
   - Beberapa kelas contoh agar tidak kosong */
function seedData() {
  // Cek apakah user sudah ada — jika ya, jangan timpa
  const users = getData(STORAGE_KEYS.USERS);
  if (users.length === 0) {
    setData(STORAGE_KEYS.USERS, [
      { username: 'admin', password: 'admin123', nama: 'Administrator' }
    ]);
  }

  // Cek apakah kelas sudah ada — jika belum, isi contoh
  const kelas = getData(STORAGE_KEYS.KELAS);
  if (kelas.length === 0) {
    setData(STORAGE_KEYS.KELAS, [
            //KELAS 10
      { id: uid(), namaKelas: '10 TSM 1', jumlahSiswa: 32, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TSM 2', jumlahSiswa: 32, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TAB 1', jumlahSiswa: 38, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TAB 2', jumlahSiswa: 37, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TAB 3', jumlahSiswa: 37, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TAB 4', jumlahSiswa: 35, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TAB 5', jumlahSiswa: 38, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TOI 1', jumlahSiswa: 27, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TOI 2', jumlahSiswa: 27, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 KI', jumlahSiswa: 28, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TKJ 1', jumlahSiswa: 35, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TKJ 2', jumlahSiswa: 34, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 DKV 1', jumlahSiswa: 22, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 DKV 2', jumlahSiswa: 21, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TPM 1', jumlahSiswa: 29, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TPM 2', jumlahSiswa: 28, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TKR 1', jumlahSiswa: 36, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TKR 2', jumlahSiswa: 36, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TKR 3', jumlahSiswa: 34, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TKR 4', jumlahSiswa: 36, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '10 TKR 5', jumlahSiswa: 35, createdAt: new Date().toISOString() },
      // KELAS 11
      { id: uid(), namaKelas: '11 TAB 1', jumlahSiswa: 29, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 2', jumlahSiswa: 29, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 3', jumlahSiswa: 29, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 4', jumlahSiswa: 35, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 5', jumlahSiswa: 36, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 6', jumlahSiswa: 35, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TKR 1', jumlahSiswa: 35, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TKR 2', jumlahSiswa: 35, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TKR 3', jumlahSiswa: 32, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TKR 4', jumlahSiswa: 33, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TKR 5', jumlahSiswa: 31, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TSM 1', jumlahSiswa: 31, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TSM 2', jumlahSiswa: 31, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TPM', jumlahSiswa: 35, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TOI', jumlahSiswa: 38, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 KI', jumlahSiswa: 26, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TKJ 1', jumlahSiswa: 21, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TKJ 2', jumlahSiswa: 22, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 DKV 1', jumlahSiswa: 26, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 DKV 2', jumlahSiswa: 24, createdAt: new Date().toISOString() },
      //KELAS 12
      { id: uid(), namaKelas: '12 KI', jumlahSiswa: 15, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '12 TPM', jumlahSiswa: 21, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '12 DKV', jumlahSiswa: 35, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '12 TSM', jumlahSiswa: 20, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '12 TKJ', jumlahSiswa: 30, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '12 TKR 1', jumlahSiswa: 32, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '12 TKR 2', jumlahSiswa: 33, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '12 TKR 3', jumlahSiswa: 32, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 1', jumlahSiswa: 33, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 2', jumlahSiswa: 32, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 3', jumlahSiswa: 32, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 4', jumlahSiswa: 31, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 5', jumlahSiswa: 28, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '11 TAB 6', jumlahSiswa: 30, createdAt: new Date().toISOString() },
      { id: uid(), namaKelas: '12 TOI', jumlahSiswa: 31, createdAt: new Date().toISOString() },
    ]);
  }
}

/* === FORMAT TANGGAL ===
   Ubah string ISO (YYYY-MM-DD) menjadi format Indonesia (DD/MM/YYYY)
   agar mudah dibaca di tabel. */
function formatTanggal(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/* Format tanggal lengkap dengan nama hari */
function formatTanggalLengkap(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const pad = (n) => String(n).padStart(2, '0');
  return `${hari[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/* === TANGGAL HARI INI (format YYYY-MM-DD untuk input[type=date]) === */
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* === ANGKA RIBUAN ===
   Format angka besar dengan pemisah ribuan (contoh: 1.250). */
function formatAngka(n) {
  n = Number(n) || 0;
  return n.toLocaleString('id-ID');
}

/* === ESCAPE HTML ===
   Cegah XSS saat menampilkan input user di innerHTML. */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   FUNGSI-FUNGSI KHUSUS ENTITY
   ============================================================ */

/* === KELAS === */
function getKelas()            { return getData(STORAGE_KEYS.KELAS); }
function getKelasById(id)      { return getKelas().find(k => k.id === id); }
function saveKelas(kelas)      { setData(STORAGE_KEYS.KELAS, kelas); }
function addKelas(item) {
  const all = getKelas();
  all.push(item);
  saveKelas(all);
}
function updateKelas(id, patch) {
  const all = getKelas().map(k => k.id === id ? { ...k, ...patch, updatedAt: new Date().toISOString() } : k);
  saveKelas(all);
}
function deleteKelas(id) {
  saveKelas(getKelas().filter(k => k.id !== id));
}

/* === PEMBAGIAN MBG === */
function getPembagian()       { return getData(STORAGE_KEYS.PEMBAGIAN); }
function getPembagianById(id)  { return getPembagian().find(p => p.id === id); }
function savePembagian(arr)    { setData(STORAGE_KEYS.PEMBAGIAN, arr); }
function addPembagian(item) {
  const all = getPembagian();
  all.push(item);
  savePembagian(all);
}
function updatePembagian(id, patch) {
  savePembagian(getPembagian().map(p => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
}
function deletePembagian(id) {
  savePembagian(getPembagian().filter(p => p.id !== id));
  // Hapus juga semua pengembalian yang terkait
  savePengembalian(getPengembalian().filter(r => r.pembagianId !== id));
}

/* === PENGEMBALIAN OMPRENG ===
   Satu pembagian bisa punya banyak catatan pengembalian bertahap. */
function getPengembalian()           { return getData(STORAGE_KEYS.PENGEMBALIAN); }
function savePengembalian(arr)       { setData(STORAGE_KEYS.PENGEMBALIAN, arr); }
function addPengembalian(item) {
  const all = getPengembalian();
  all.push(item);
  savePengembalian(all);
}
function deletePengembalian(id) {
  savePengembalian(getPengembalian().filter(r => r.id !== id));
}

/* === HITUNG TOTAL OMPRENG PER PEMBAGIAN ===
   - jumlahDibagikan  = porsi yang dibagikan (dari data pembagian)
   - jumlahDikembalikan = jumlah seluruh pengembalian terkait
   - belumKembali = jumlahDibagikan - jumlahDikembalikan */
function getOmprengSummaryForPembagian(pembagianId) {
  const p = getPembagianById(pembagianId);
  const dibagikan = p ? Number(p.jumlahPorsi) || 0 : 0;
  const dikembalikan = getPengembalian()
    .filter(r => r.pembagianId === pembagianId)
    .reduce((s, r) => s + (Number(r.jumlahDikembalikan) || 0), 0);
  return {
    dibagikan,
    dikembalikan,
    belumKembali: Math.max(0, dibagikan - dikembalikan),
  };
}

/* === STATISTIK GLOBAL UNTUK DASHBOARD ===
   Mengembalikan objek berisi total siswa/guru penerima, total porsi,
   total ompreng sudah dikembalikan, dan total belum kembali. */
function getStatistikGlobal() {
  const pembagian = getPembagian();
  const pengembalian = getPengembalian();

  const totalSiswaMenerima = pembagian.reduce((s, p) => s + (Number(p.jumlahSiswaMenerima) || 0), 0);
  const totalGuruMenerima  = pembagian.reduce((s, p) => s + (Number(p.jumlahGuruMenerima) || 0), 0);
  const totalPorsi         = pembagian.reduce((s, p) => s + (Number(p.jumlahPorsi) || 0), 0);
  const totalDikembalikan  = pengembalian.reduce((s, r) => s + (Number(r.jumlahDikembalikan) || 0), 0);
  const totalBelumKembali  = Math.max(0, totalPorsi - totalDikembalikan);

  return {
    totalSiswaMenerima,
    totalGuruMenerima,
    totalPorsi,
    totalDikembalikan,
    totalBelumKembali,
    jumlahPembagian: pembagian.length,
    jumlahPengembalian: pengembalian.length,
  };
}

/* === STATUS PEMBAGIAN PER KELAS ===
   Untuk setiap kelas, cari catatan pembagian TERAKHIR (tanggal terbaru).
   Tampilkan: tanggal, porsi dibagikan, sudah dikembalikan, sisa, status. */
function getStatusPerKelas() {
  const kelasList = getKelas();
  const pembagian = getPembagian();

  return kelasList.map(k => {
    // Filter pembagian untuk kelas ini, urutkan tanggal terbaru di atas
    const related = pembagian
      .filter(p => p.kelasId === k.id)
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal) || new Date(b.createdAt) - new Date(a.createdAt));

    if (related.length === 0) {
      // Tidak ada catatan pembagian sama sekali
      return {
        kelasId: k.id,
        namaKelas: k.namaKelas,
        jumlahSiswa: k.jumlahSiswa,
        tanggalTerakhir: null,
        dibagikan: 0,
        dikembalikan: 0,
        belumKembali: 0,
        status: 'belum',
      };
    }

    // Ambil pembagian terakhir
    const latest = related[0];
    const omp = getOmprengSummaryForPembagian(latest.id);

    // Tentukan status badge
    let status;
    if (omp.belumKembali === 0) status = 'lengkap';
    else if (omp.dikembalikan === 0) status = 'belum';
    else status = 'parsial';

    return {
      kelasId: k.id,
      namaKelas: k.namaKelas,
      jumlahSiswa: k.jumlahSiswa,
      tanggalTerakhir: latest.tanggal,
      dibagikan: omp.dibagikan,
      dikembalikan: omp.dikembalikan,
      belumKembali: omp.belumKembali,
      status,
    };
  });
}

/* Jalankan seed data otomatis saat file ini dimuat */
seedData();
