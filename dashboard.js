/* ============================================================
   MyOmpreng - DASHBOARD (dashboard.js)
   File ini menangani:
   - Render kartu statistik utama (auto-update)
   - Tombol hapus data per kategori
   - Render tabel status pembagian per kelas
   ============================================================ */

/* === RENDER KARTU STATISTIK ===
   Setiap angka dihitung otomatis dari data storage. */
function renderStatCards() {
  const stats = getStatistikGlobal();

  // Sisipkan angka ke elemen dengan id masing-masing
  document.getElementById('statSiswaMenerima').textContent = formatAngka(stats.totalSiswaMenerima);
  document.getElementById('statGuruMenerima').textContent  = formatAngka(stats.totalGuruMenerima);
  document.getElementById('statTotalPorsi').textContent    = formatAngka(stats.totalPorsi);
  document.getElementById('statDikembalikan').textContent  = formatAngka(stats.totalDikembalikan);
  document.getElementById('statBelumKembali').textContent  = formatAngka(stats.totalBelumKembali);

  // Sub-info di bawah kartu
  document.getElementById('footPorsi').textContent =
    `Dari ${stats.jumlahPembagian} catatan pembagian MBG`;
  document.getElementById('footDikembalikan').textContent =
    `${stats.jumlahPengembalian} catatan pengembalian`;

  // Highlight kartu "belum kembali" jika ada yang outstanding
  const cardBelum = document.getElementById('cardBelumKembali');
  if (cardBelum) {
    if (stats.totalBelumKembali > 0) {
      cardBelum.classList.add('accent-red');
      cardBelum.classList.remove('accent-amber');
    } else {
      cardBelum.classList.remove('accent-red');
      cardBelum.classList.add('accent-amber');
    }
  }
}

/* === RENDER TABEL STATUS PEMBAGIAN PER KELAS === */
function renderStatusTable() {
  const data = getStatusPerKelas();
  const tbody = document.getElementById('statusTableBody');

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">🏫</div>
            <h4>Belum ada kelas</h4>
            <p>Tambahkan kelas terlebih dahulu di halaman <a href="kelas.html">Data Kelas</a>.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  // Map status ke badge warna
  const badgeMap = {
    'lengkap':  `<span class="badge badge-success">✓ Lengkap</span>`,
    'parsial':  `<span class="badge badge-warning">◐ Parsial</span>`,
    'belum':    `<span class="badge badge-danger">✕ Belum</span>`,
  };

  tbody.innerHTML = data.map(row => `
    <tr>
      <td><strong>${escapeHtml(row.namaKelas)}</strong></td>
      <td>${row.tanggalTerakhir ? formatTanggal(row.tanggalTerakhir) : '<span class="text-muted">—</span>'}</td>
      <td class="num">${formatAngka(row.dibagikan)}</td>
      <td class="num text-success">${formatAngka(row.dikembalikan)}</td>
      <td class="num ${row.belumKembali > 0 ? 'text-danger text-bold' : ''}">${formatAngka(row.belumKembali)}</td>
      <td>${badgeMap[row.status]}</td>
    </tr>
  `).join('');

  // Ringkasan jumlah kelas per status di footer
  const lengkap  = data.filter(d => d.status === 'lengkap').length;
  const parsial = data.filter(d => d.status === 'parsial').length;
  const belum    = data.filter(d => d.status === 'belum').length;
  document.getElementById('statusSummary').innerHTML = `
    <span class="badge badge-success">${lengkap} Lengkap</span>
    <span class="badge badge-warning">${parsial} Parsial</span>
    <span class="badge badge-danger">${belum} Belum</span>
  `;
}

/* === TOMBOL HAPUS DATA (sesuai permintaan user) ===
   Tiga tombol terpisah:
   1. Hapus total ompreng sudah dikembalikan → kosongkan array pengembalian
   2. Hapus total ompreng belum kembali       → kosongkan array pembagian (otomatis reset pengembalian terkait)
   3. Hapus status pembagian per kelas        → sama dengan reset pembagian + pengembalian */

function clearPengembalian() {
  showConfirm({
    title: 'Hapus Data Pengembalian',
    message: 'Seluruh catatan pengembalian ompreng akan dihapus. Total "sudah dikembalikan" akan kembali ke 0. Lanjutkan?',
    confirmText: 'Ya, Hapus',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      savePengembalian([]);
      refresh();
      showToast('Data pengembalian ompreng berhasil dihapus.', 'success');
    }
  });
}

function clearBelumKembali() {
  showConfirm({
    title: 'Reset Ompreng Belum Kembali',
    message: 'Untuk meng-nol-kan "belum kembali", seluruh catatan pembagian MBG akan dihapus (otomatis menghapus pengembalian terkait). Lanjutkan?',
    confirmText: 'Ya, Reset',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      savePembagian([]);
      savePengembalian([]);
      refresh();
      showToast('Data pembagian MBG berhasil di-reset.', 'success');
    }
  });
}

function clearStatusKelas() {
  showConfirm({
    title: 'Reset Status Pembagian per Kelas',
    message: 'Seluruh catatan pembagian & pengembalian akan dihapus. Data kelas tetap dipertahankan. Lanjutkan?',
    confirmText: 'Ya, Reset Status',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      savePembagian([]);
      savePengembalian([]);
      refresh();
      showToast('Status pembagian per kelas berhasil direset.', 'success');
    }
  });
}

/* === REFRESH SELURUH DASHBOARD ===
   Dipanggil setelah ada perubahan data. */
function refresh() {
  renderStatCards();
  renderStatusTable();
}

/* === INISIALISASI HALAMAN === */
document.addEventListener('DOMContentLoaded', () => {
  // Bangun layout (navbar + sidebar) - "dashboard" = id menu aktif
  initLayout('dashboard');

  // Pasang event tombol hapus
  document.getElementById('btnClearDikembalikan').addEventListener('click', clearPengembalian);
  document.getElementById('btnClearBelumKembali').addEventListener('click', clearBelumKembali);
  document.getElementById('btnClearStatusKelas').addEventListener('click', clearStatusKelas);

  // Render data awal
  refresh();
});
