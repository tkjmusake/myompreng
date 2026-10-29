/* ============================================================
   MyOmpreng - RIWAYAT & LAPORAN (riwayat.js)
   Halaman untuk melihat riwayat pembagian + pengembalian,
   filter berdasarkan kelas & tanggal, laporan harian,
   ekspor CSV, dan hapus data history.
   ============================================================ */

/* === STATE FILTER === */
let filterTipe = 'all';   // 'all' | 'pembagian' | 'pengembalian'
let filterKelas = '';     // kelasId atau '' (semua)
let filterTanggal = '';   // YYYY-MM-DD atau '' (semua)

/* === POPULASI DROPDOWN KELAS === */
function populateKelasFilter() {
  const select = document.getElementById('filterKelas');
  select.innerHTML = '<option value="">Semua Kelas</option>';
  getKelas().sort((a, b) => a.namaKelas.localeCompare(b.namaKelas)).forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = k.namaKelas;
    select.appendChild(opt);
  });
}

/* === AMBIL DATA GABUNGAN (TERFILTER) ===
   Hasil: array berisi record dengan field seragam untuk ditampilkan. */
function getFilteredData() {
  // Ambil semua pembagian & pengembalian
  let pembagian = getPembagian();
  let pengembalian = getPengembalian();

  // Filter kelas
  if (filterKelas) {
    pembagian = pembagian.filter(p => p.kelasId === filterKelas);
    pengembalian = pengembalian.filter(r => r.kelasId === filterKelas);
  }

  // Filter tanggal
  if (filterTanggal) {
    pembagian = pembagian.filter(p => p.tanggal === filterTanggal);
    pengembalian = pengembalian.filter(r => r.tanggal === filterTanggal);
  }

  // Gabungkan jadi satu daftar dengan tipe yang jelas
  const rows = [];
  if (filterTipe === 'all' || filterTipe === 'pembagian') {
    pembagian.forEach(p => {
      rows.push({
        tipe: 'pembagian',
        id: p.id,
        tanggal: p.tanggal,
        namaKelas: p.namaKelas,
        // Buat ringkasan kolom numerik
        jumlah: p.jumlahPorsi,
        detail: `${p.jumlahSiswaMenerima} siswa + ${p.jumlahGuruMenerima} guru`,
        petugas: p.petugas,
        createdAt: p.createdAt,
      });
    });
  }
  if (filterTipe === 'all' || filterTipe === 'pengembalian') {
    pengembalian.forEach(r => {
      rows.push({
        tipe: 'pengembalian',
        id: r.id,
        tanggal: r.tanggal,
        namaKelas: r.namaKelas,
        jumlah: r.jumlahDikembalikan,
        detail: `dari ${r.jumlahDibagikan || '-'} ompreng dibagikan`,
        petugas: r.petugas,
        createdAt: r.createdAt,
      });
    });
  }

  // Urutkan tanggal terbaru di atas
  rows.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal) ||
                       new Date(b.createdAt) - new Date(a.createdAt));
  return rows;
}

/* === RENDER TABEL RIWAYAT === */
function renderTable() {
  const rows = getFilteredData();
  const tbody = document.getElementById('riwayatTableBody');

  // Update label jumlah data
  document.getElementById('totalData').textContent = `${rows.length} catatan ditemukan`;

  // Hitung ringkasan ompreng belum kembali (untuk semua data, bukan hanya hasil filter)
  const stats = getStatistikGlobal();
  document.getElementById('totalBelumRiwayat').textContent = formatAngka(stats.totalBelumKembali);
  document.getElementById('totalBelumRiwayat').className =
    stats.totalBelumKembali > 0 ? 'text-danger text-bold' : 'text-success';

  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h4>Tidak ada data ditemukan</h4>
          <p>Coba ubah filter atau catat data baru di halaman Pembagian/Pengembalian.</p>
        </div>
      </td></tr>`;
    return;
  }

  // Render baris dengan badge tipe
  tbody.innerHTML = rows.map(r => {
    const badge = r.tipe === 'pembagian'
      ? '<span class="badge badge-info">🍱 Pembagian</span>'
      : '<span class="badge badge-success">♻️ Pengembalian</span>';
    return `
      <tr>
        <td>${badge}</td>
        <td>${formatTanggal(r.tanggal)}</td>
        <td><strong>${escapeHtml(r.namaKelas)}</strong></td>
        <td class="num text-bold">${formatAngka(r.jumlah)}</td>
        <td class="text-muted">${escapeHtml(r.detail)}</td>
        <td>${escapeHtml(r.petugas)}</td>
        <td class="text-right">
          <button class="btn btn-sm btn-danger" onclick="confirmDelete('${r.id}', '${r.tipe}')">🗑 Hapus</button>
        </td>
      </tr>
    `;
  }).join('');
}

/* === LAPORAN HARIAN ===
   Tampilkan ringkasan lengkap untuk tanggal terpilih. */
function renderDailyReport() {
  const tanggal = filterTanggal;
  const reportBox = document.getElementById('dailyReport');

  if (!tanggal) {
    reportBox.classList.add('hidden');
    return;
  }

  // Ambil semua data untuk tanggal tersebut
  const pembagianHari = getPembagian().filter(p => p.tanggal === tanggal);
  const pengembalianHari = getPengembalian().filter(r => r.tanggal === tanggal);

  const totalPorsi = pembagianHari.reduce((s,p) => s + (Number(p.jumlahPorsi)||0), 0);
  const totalSiswa = pembagianHari.reduce((s,p) => s + (Number(p.jumlahSiswaMenerima)||0), 0);
  const totalGuru  = pembagianHari.reduce((s,p) => s + (Number(p.jumlahGuruMenerima)||0), 0);
  const totalKembali = pengembalianHari.reduce((s,r) => s + (Number(r.jumlahDikembalikan)||0), 0);

  // Sisa = porsi yang dibagikan hari itu - yang dikembalikan hari itu
  // (catatan: lebih akurat pakai sum per pembagian, tapi untuk laporan harian
  //  total porsi - total kembali hari itu sudah cukup informatif)
  const sisa = Math.max(0, totalPorsi - totalKembali);

  document.getElementById('reportTanggal').textContent = formatTanggalLengkap(tanggal);
  document.getElementById('reportKelas').textContent = `${pembagianHari.length} kelas menerima MBG`;
  document.getElementById('reportSiswa').textContent = formatAngka(totalSiswa);
  document.getElementById('reportGuru').textContent = formatAngka(totalGuru);
  document.getElementById('reportPorsi').textContent = formatAngka(totalPorsi);
  document.getElementById('reportKembali').textContent = formatAngka(totalKembali);
  document.getElementById('reportSisa').textContent = formatAngka(sisa);
  document.getElementById('reportSisa').className =
    sisa > 0 ? 'stat-value text-danger' : 'stat-value text-success';

  reportBox.classList.remove('hidden');
}

/* === APPLY FILTER === */
function applyFilter() {
  filterTipe = document.getElementById('filterTipe').value;
  filterKelas = document.getElementById('filterKelas').value;
  filterTanggal = document.getElementById('filterTanggal').value;
  renderTable();
  renderDailyReport();
}

/* === RESET FILTER === */
function resetFilter() {
  document.getElementById('filterTipe').value = 'all';
  document.getElementById('filterKelas').value = '';
  document.getElementById('filterTanggal').value = '';
  filterTipe = 'all'; filterKelas = ''; filterTanggal = '';
  renderTable();
  renderDailyReport();
  showToast('Filter direset.', 'info', 1500);
}

/* === KONFIRMASI HAPUS ===
   Hapus berdasarkan tipe (pembagian / pengembalian) */
function confirmDelete(id, tipe) {
  let message = '';
  if (tipe === 'pembagian') {
    const p = getPembagianById(id);
    if (!p) return;
    message = `Hapus catatan pembagian kelas ${p.namaKelas} tanggal ${formatTanggal(p.tanggal)}? Pengembalian terkait juga akan dihapus.`;
  } else {
    const r = getPengembalian().find(x => x.id === id);
    if (!r) return;
    message = `Hapus catatan pengembalian ${r.jumlahDikembalikan} ompreng oleh ${r.petugas}?`;
  }

  showConfirm({
    title: 'Hapus Riwayat',
    message,
    confirmText: 'Ya, Hapus',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      if (tipe === 'pembagian') {
        deletePembagian(id);
      } else {
        deletePengembalian(id);
      }
      renderTable();
      showToast('Data riwayat berhasil dihapus.', 'success');
    }
  });
}

/* === HAPUS SEMUA RIWAYAT ===
   Bersihkan seluruh data pembagian & pengembalian. */
function clearAllHistory() {
  showConfirm({
    title: 'Hapus Seluruh Riwayat',
    message: 'Semua catatan pembagian & pengembalian akan dihapus permanen. Data kelas tetap dipertahankan. Lanjutkan?',
    confirmText: 'Ya, Hapus Semua',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      savePembagian([]);
      savePengembalian([]);
      renderTable();
      renderDailyReport();
      showToast('Seluruh riwayat berhasil dihapus.', 'success');
    }
  });
}

/* === EKSPOR CSV ===
   Hasilkan file CSV dari data hasil filter saat ini.
   Pakai \uFEFF (BOM) agar Excel mengenali encoding UTF-8. */
function exportCSV() {
  const rows = getFilteredData();
  if (rows.length === 0) {
    return showToast('Tidak ada data untuk diekspor.', 'warning');
  }

  // Header kolom
  const header = ['No', 'Tipe', 'Tanggal', 'Kelas', 'Jumlah', 'Detail', 'Petugas'];

  // Bangun baris CSV dengan escaping sederhana
  const csvEscape = (val) => {
    const s = String(val == null ? '' : val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const lines = [header.map(csvEscape).join(',')];
  rows.forEach((r, idx) => {
    lines.push([
      idx + 1,
      r.tipe === 'pembagian' ? 'Pembagian' : 'Pengembalian',
      formatTanggal(r.tanggal),
      r.namaKelas,
      r.jumlah,
      r.detail,
      r.petugas,
    ].map(csvEscape).join(','));
  });

  // Tambah baris ringkasan di bawah
  lines.push('');
  lines.push(['Ringkasan', '', '', '', '', '', ''].map(csvEscape).join(','));
  const stats = getStatistikGlobal();
  lines.push(['Total Pembagian', stats.jumlahPembagian, '', '', '', '', ''].map(csvEscape).join(','));
  lines.push(['Total Pengembalian', stats.jumlahPengembalian, '', '', '', '', ''].map(csvEscape).join(','));
  lines.push(['Total Porsi Dibagikan', stats.totalPorsi, '', '', '', '', ''].map(csvEscape).join(','));
  lines.push(['Total Dikembalikan', stats.totalDikembalikan, '', '', '', '', ''].map(csvEscape).join(','));
  lines.push(['Total Belum Kembali', stats.totalBelumKembali, '', '', '', '', ''].map(csvEscape).join(','));

  // Gabung & download
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const tgl = filterTanggal ? filterTanggal : 'semua';
  const kls = filterKelas ? getKelasById(filterKelas)?.namaKelas || 'kelas' : 'semua-kelas';
  a.href = url;
  a.download = `myompreng-riwayat-${tgl}-${kls}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Berhasil mengekspor ${rows.length} catatan ke CSV.`, 'success');
}

/* === INISIALISASI HALAMAN === */
document.addEventListener('DOMContentLoaded', () => {
  initLayout('riwayat');

  populateKelasFilter();

  // Pasang event handler
  document.getElementById('filterTipe').addEventListener('change', applyFilter);
  document.getElementById('filterKelas').addEventListener('change', applyFilter);
  document.getElementById('filterTanggal').addEventListener('change', applyFilter);
  document.getElementById('btnResetFilter').addEventListener('click', resetFilter);
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
  document.getElementById('btnClearAll').addEventListener('click', clearAllHistory);

  // Render awal
  renderTable();
});
