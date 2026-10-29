/* ============================================================
   MyOmpreng - PENGEMBALIAN OMPRENG (ompreng.js)
   Halaman untuk mencatat pengembalian ompreng dari setiap kelas.

   Aturan penting:
   - 1 catatan pembagian MBG punya 1 jumlah porsi = ompreng dibagikan
   - Pengembalian boleh dicatat bertahap (banyak catatan)
   - Total dikembalikan = jumlah seluruh catatan pengembalian untuk pembagian tsb
   - Belum kembali = Dibagikan - Dikembalikan
   - Tidak boleh mengembalikan lebih dari yang dibagikan
   ============================================================ */

/* === STATE UNTUK FORM TAMBAH PENGEMBALIAN === */
let selectedPembagianId = null;

/* === RENDER TABEL RINGKASAN OMPRENG PER PEMBAGIAN ===
   Setiap baris = 1 catatan pembagian dengan status pengembaliannya. */
function renderTable() {
  const pembagian = getPembagian().sort((a, b) =>
    new Date(b.tanggal) - new Date(a.tanggal) || new Date(b.createdAt) - new Date(a.createdAt)
  );
  const tbody = document.getElementById('omprengTableBody');

  if (pembagian.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-icon">🍱</div>
          <h4>Belum ada pembagian MBG</h4>
          <p>Catat pembagian MBG lebih dulu di halaman <a href="pembagian.html">Pembagian MBG</a>.</p>
        </div>
      </td></tr>`;
    document.getElementById('ringkasanInfo').textContent = '0 catatan';
    return;
  }

  let totalBelum = 0;
  let totalDikembalikan = 0;
  let totalDibagikan = 0;

  tbody.innerHTML = pembagian.map(p => {
    const omp = getOmprengSummaryForPembagian(p.id);
    totalBelum += omp.belumKembali;
    totalDikembalikan += omp.dikembalikan;
    totalDibagikan += omp.dibagikan;

    // Tentukan badge status
    let badge;
    if (omp.belumKembali === 0) badge = '<span class="badge badge-success">✓ Lengkap</span>';
    else if (omp.dikembalikan === 0) badge = '<span class="badge badge-danger">✕ Belum</span>';
    else badge = '<span class="badge badge-warning">◐ Parsial</span>';

    return `
      <tr ${omp.belumKembali > 0 ? 'style="background: #fffbeb;"' : ''}>
        <td>${formatTanggal(p.tanggal)}</td>
        <td><strong>${escapeHtml(p.namaKelas)}</strong></td>
        <td class="num text-bold">${formatAngka(omp.dibagikan)}</td>
        <td class="num text-success">${formatAngka(omp.dikembalikan)}</td>
        <td class="num ${omp.belumKembali > 0 ? 'text-danger text-bold' : 'text-muted'}">${formatAngka(omp.belumKembali)}</td>
        <td>${badge}</td>
        <td class="text-right">
          <button class="btn btn-sm btn-primary" onclick="openForm('${p.id}')">＋ Tambah Pengembalian</button>
          <button class="btn btn-sm btn-outline" onclick="viewDetail('${p.id}')">📋 Detail</button>
        </td>
      </tr>
    `;
  }).join('');

  // Update info ringkasan
  document.getElementById('ringkasanInfo').innerHTML =
    `${pembagian.length} pembagian · ` +
    `<span class="text-success">${formatAngka(totalDikembalikan)} dikembalikan</span> · ` +
    `<span class="${totalBelum > 0 ? 'text-danger text-bold' : ''}">${formatAngka(totalBelum)} belum kembali</span>`;

  // Tampilkan peringatan global jika ada yang belum kembali
  const alertBox = document.getElementById('globalAlert');
  if (totalBelum > 0) {
    alertBox.classList.remove('hidden');
    document.getElementById('alertTotalBelum').textContent = formatAngka(totalBelum);
  } else {
    alertBox.classList.add('hidden');
  }
}

/* === BUKA FORM TAMBAH PENGEMBALIAN === */
function openForm(pembagianId) {
  selectedPembagianId = pembagianId;
  const p = getPembagianById(pembagianId);
  if (!p) return showToast('Data pembagian tidak ditemukan.', 'error');

  const omp = getOmprengSummaryForPembagian(pembagianId);

  // Tampilkan info di form
  document.getElementById('formInfoKelas').textContent = p.namaKelas;
  document.getElementById('formInfoTanggal').textContent = formatTanggalLengkap(p.tanggal);
  document.getElementById('formInfoDibagikan').textContent = formatAngka(omp.dibagikan);
  document.getElementById('formInfoDikembalikan').textContent = formatAngka(omp.dikembalikan);
  document.getElementById('formInfoSisa').textContent = formatAngka(omp.belumKembali);

  // Set max untuk input jumlah
  const inputJumlah = document.getElementById('jumlahDikembalikan');
  inputJumlah.max = omp.belumKembali;
  inputJumlah.value = '';
  // Atur placeholder dinamis
  inputJumlah.placeholder = `Maksimal ${omp.belumKembali}`;

  // Set tanggal default ke hari ini
  document.getElementById('tanggalKembali').value = todayISO();

  // Disable submit jika sisa sudah 0
  const btn = document.getElementById('btnSubmitKembali');
  if (omp.belumKembali === 0) {
    btn.disabled = true;
    btn.textContent = '✓ Ompreng Sudah Lengkap';
    document.getElementById('formLengkapNote').classList.remove('hidden');
  } else {
    btn.disabled = false;
    btn.textContent = '💾 Catat Pengembalian';
    document.getElementById('formLengkapNote').classList.add('hidden');
  }

  // Tampilkan modal
  document.getElementById('formModal').classList.add('open');
  setTimeout(() => inputJumlah.focus(), 100);
}

/* === TUTUP FORM === */
function closeForm() {
  document.getElementById('formModal').classList.remove('open');
  selectedPembagianId = null;
}

/* === SIMPAN PENGEMBALIAN (handler form submit) ===
   Validasi: jumlah baru + existing ≤ total dibagikan
   Catatan: Dinamai "submitPengembalian" (bukan "savePengembalian") agar
   tidak bentrokan dengan fungsi savePengembalian() di storage.js! */
function submitPengembalian(event) {
  event.preventDefault();
  if (!selectedPembagianId) return;

  const p = getPembagianById(selectedPembagianId);
  if (!p) return showToast('Data pembagian tidak ditemukan.', 'error');

  const omp = getOmprengSummaryForPembagian(selectedPembagianId);
  const tanggal = document.getElementById('tanggalKembali').value;
  const jumlah = parseInt(document.getElementById('jumlahDikembalikan').value, 10);
  const petugas = document.getElementById('petugasKembali').value.trim();

  if (!tanggal)  return showToast('Tanggal wajib diisi.', 'error');
  if (!jumlah || jumlah <= 0) return showToast('Jumlah dikembalikan harus lebih dari 0.', 'error');
  if (!petugas)  return showToast('Nama petugas wajib diisi.', 'error');

  // Cegah penghitungan ganda: pastikan tidak melebihi sisa
  if (jumlah > omp.belumKembali) {
    return showToast(
      `Jumlah melebihi sisa ompreng (maks ${omp.belumKembali}). Sudah ${omp.dikembalikan} dikembalikan dari ${omp.dibagikan}.`,
      'error'
    );
  }

  // Simpan catatan pengembalian baru
  addPengembalian({
    id: uid(),
    pembagianId: selectedPembagianId,
    tanggal,
    kelasId: p.kelasId,
    namaKelas: p.namaKelas,
    jumlahDibagikan: p.jumlahPorsi, // snapshot untuk laporan
    jumlahDikembalikan: jumlah,
    petugas,
    createdAt: new Date().toISOString(),
  });

  // Hitung ulang sisa setelah penambahan
  const newOmp = getOmprengSummaryForPembagian(selectedPembagianId);
  showToast(
    `Berhasil mencatat ${formatAngka(jumlah)} ompreng. Sisa: ${formatAngka(newOmp.belumKembali)}.`,
    'success'
  );

  closeForm();
  renderTable();
}

/* === LIHAT DETAIL PENGEMBALIAN ===
   Tampilkan semua catatan pengembalian untuk 1 pembagian. */
function viewDetail(pembagianId) {
  const p = getPembagianById(pembagianId);
  if (!p) return;

  const pengembalian = getPengembalian()
    .filter(r => r.pembagianId === pembagianId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const omp = getOmprengSummaryForPembagian(pembagianId);

  // Isi header modal
  document.getElementById('detailKelas').textContent = p.namaKelas;
  document.getElementById('detailTanggal').textContent = formatTanggalLengkap(p.tanggal);
  document.getElementById('detailDibagikan').textContent = formatAngka(omp.dibagikan);
  document.getElementById('detailDikembalikan').textContent = formatAngka(omp.dikembalikan);
  document.getElementById('detailSisa').textContent = formatAngka(omp.belumKembali);
  document.getElementById('detailSisa').className =
    'num ' + (omp.belumKembali > 0 ? 'text-danger text-bold' : 'text-success text-bold');

  // Isi tabel detail
  const tbody = document.getElementById('detailTableBody');
  if (pengembalian.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="text-center text-muted" style="padding:24px;">
        Belum ada catatan pengembalian untuk pembagian ini.
      </td></tr>`;
  } else {
    tbody.innerHTML = pengembalian.map(r => `
      <tr>
        <td>${formatTanggal(r.tanggal)}</td>
        <td class="num text-success">${formatAngka(r.jumlahDikembalikan)}</td>
        <td>${escapeHtml(r.petugas)}</td>
        <td class="text-muted">${new Date(r.createdAt).toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })}</td>
        <td class="text-right">
          <button class="btn btn-sm btn-danger" onclick="confirmDeleteReturn('${r.id}')">🗑</button>
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('detailModal').classList.add('open');
}

/* === TUTUP DETAIL === */
function closeDetail() {
  document.getElementById('detailModal').classList.remove('open');
}

/* === KONFIRMASI HAPUS SATU CATATAN PENGEMBALIAN === */
function confirmDeleteReturn(id) {
  const r = getPengembalian().find(x => x.id === id);
  if (!r) return;
  showConfirm({
    title: 'Hapus Catatan Pengembalian',
    message: `Hapus catatan pengembalian ${r.jumlahDikembalikan} ompreng oleh ${r.petugas}? Sisa ompreng akan dihitung ulang.`,
    confirmText: 'Ya, Hapus',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      deletePengembalian(id);
      // Refresh detail & tabel utama
      viewDetail(r.pembagianId);
      renderTable();
      showToast('Catatan pengembalian dihapus.', 'success');
    }
  });
}

/* === INISIALISASI HALAMAN === */
document.addEventListener('DOMContentLoaded', () => {
  initLayout('ompreng');

  document.getElementById('formPengembalian').addEventListener('submit', submitPengembalian);
  document.getElementById('btnCancelKembali').addEventListener('click', closeForm);
  document.getElementById('btnCloseDetail').addEventListener('click', closeDetail);

  // Tutup modal saat klik di luar
  document.getElementById('formModal').addEventListener('click', (e) => {
    if (e.target.id === 'formModal') closeForm();
  });
  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') closeDetail();
  });

  renderTable();
});
