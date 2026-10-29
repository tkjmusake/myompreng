/* ============================================================
   MyOmpreng - PEMBAGIAN MBG (pembagian.js)
   Form pencatatan pembagian Makan Bergizi Gratis harian.
   Catatan:
   - Tanggal pembagian
   - Nama kelas (pilih dari daftar)
   - Jumlah siswa (otomatis dari data kelas)
   - Jumlah guru yang mengajar
   - Jumlah siswa penerima MBG (boleh berbeda dari jumlah siswa)
   - Jumlah guru penerima MBG (dibedakan dari guru mengajar!)
   - Jumlah porsi yang benar-benar dibagikan
   - Nama petugas pengambil MBG
   ============================================================ */

/* === STATE EDIT (untuk form) === */
let editId = null;

/* === ISI DROPDOWN PILIH KELAS === */
function populateKelasSelect() {
  const select = document.getElementById('kelasId');
  const kelasList = getKelas().sort((a, b) => a.namaKelas.localeCompare(b.namaKelas));

  // Kosongkan dulu
  select.innerHTML = '<option value="">— Pilih Kelas —</option>';
  kelasList.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = `${k.namaKelas} (${k.jumlahSiswa} siswa)`;
    select.appendChild(opt);
  });

  // Jika tidak ada kelas sama sekali → tampilkan peringatan
  if (kelasList.length === 0) {
    select.innerHTML = '<option value="">— Belum ada kelas —</option>';
    document.getElementById('noKelasAlert').classList.remove('hidden');
  } else {
    document.getElementById('noKelasAlert').classList.add('hidden');
  }
}

/* === KETIKA KELAS DIPILIH → OTOMATIS ISI JUMLAH SISWA === */
function onKelasChange() {
  const id = document.getElementById('kelasId').value;
  if (!id) {
    document.getElementById('jumlahSiswa').value = '';
    return;
  }
  const k = getKelasById(id);
  if (k) {
    document.getElementById('jumlahSiswa').value = k.jumlahSiswa;
    // Default: siswa penerima = seluruh siswa kelas
    if (!document.getElementById('jumlahSiswaMenerima').value) {
      document.getElementById('jumlahSiswaMenerima').value = k.jumlahSiswa;
    }
  }
}

/* === OTOMATIS HITUNG TOTAL PORSI ===
   Total porsi = siswa menerima + guru menerima.
   Ini hanya sebagai USULAN, user tetap bisa mengetik manual. */
function autoHitungPorsi() {
  const siswaMenerima = parseInt(document.getElementById('jumlahSiswaMenerima').value, 10) || 0;
  const guruMenerima  = parseInt(document.getElementById('jumlahGuruMenerima').value, 10) || 0;
  // Hanya isi otomatis jika input porsi kosong ATAU belum diubah manual
  const porsiInput = document.getElementById('jumlahPorsi');
  if (!porsiInput.dataset.manual) {
    porsiInput.value = siswaMenerima + guruMenerima;
  }
}

/* === TANDAI INPUT PORSI SEBAGAI MANUAL ===
   Setelah user mengetik manual, jangan override lagi. */
function markPorsiManual() {
  document.getElementById('jumlahPorsi').dataset.manual = '1';
}

/* === SIMPAN DATA PEMBAGIAN === */
function saveData(event) {
  event.preventDefault();

  // Ambil & validasi semua input
  const tanggal        = document.getElementById('tanggal').value;
  const kelasId        = document.getElementById('kelasId').value;
  const jumlahSiswa    = parseInt(document.getElementById('jumlahSiswa').value, 10);
  const guruMengajar   = parseInt(document.getElementById('jumlahGuruMengajar').value, 10) || 0;
  const siswaMenerima  = parseInt(document.getElementById('jumlahSiswaMenerima').value, 10) || 0;
  const guruMenerima   = parseInt(document.getElementById('jumlahGuruMenerima').value, 10) || 0;
  const jumlahPorsi    = parseInt(document.getElementById('jumlahPorsi').value, 10) || 0;
  const petugas        = document.getElementById('petugas').value.trim();

  // Validasi wajib
  if (!tanggal)              return showToast('Tanggal pembagian wajib diisi.', 'error');
  if (!kelasId)              return showToast('Pilih kelas terlebih dahulu.', 'error');
  if (!petugas)              return showToast('Nama petugas pengambil MBG wajib diisi.', 'error');

  // Validasi logika
  if (siswaMenerima > jumlahSiswa) {
    return showToast(`Jumlah siswa penerima (${siswaMenerima}) tidak boleh melebihi jumlah siswa kelas (${jumlahSiswa}).`, 'error');
  }
  if (guruMenerima > guruMengajar) {
    return showToast(`Guru penerima MBG (${guruMenerima}) tidak boleh melebihi guru yang mengajar (${guruMengajar}).`, 'error');
  }
  if (jumlahPorsi < (siswaMenerima + guruMenerima)) {
    return showToast(`Jumlah porsi (${jumlahPorsi}) kurang dari total penerima (${siswaMenerima + guruMenerima}).`, 'error');
  }

  // Ambil nama kelas dari data kelas (untuk snapshot historis)
  const k = getKelasById(kelasId);
  const namaKelas = k ? k.namaKelas : '(kelas dihapus)';

  const data = {
    tanggal,
    kelasId,
    namaKelas,
    jumlahSiswa,
    jumlahGuruMengajar: guruMengajar,
    jumlahSiswaMenerima: siswaMenerima,
    jumlahGuruMenerima: guruMenerima,
    jumlahPorsi,
    petugas,
  };

  if (editId) {
    updatePembagian(editId, data);
    showToast(`Pembagian MBG untuk kelas ${namaKelas} diperbarui.`, 'success');
  } else {
    addPembagian({
      id: uid(),
      ...data,
      createdAt: new Date().toISOString(),
    });
    showToast(`Pembagian MBG untuk kelas ${namaKelas} berhasil dicatat.`, 'success');
  }

  // Reset form & refresh tabel
  resetForm();
  renderTable();
}

/* === RESET FORM === */
function resetForm() {
  document.getElementById('pembagianForm').reset();
  // Set tanggal hari ini
  document.getElementById('tanggal').value = todayISO();
  // Reset state manual porsi
  delete document.getElementById('jumlahPorsi').dataset.manual;
  editId = null;
  // Update judul form
  document.getElementById('formTitle').textContent = 'Catat Pembagian MBG';
  document.getElementById('btnSubmit').textContent = '💾 Simpan Pembagian';
  document.getElementById('btnCancelEdit').classList.add('hidden');
}

/* === EDIT DATA === */
function editData(id) {
  const p = getPembagianById(id);
  if (!p) return showToast('Data tidak ditemukan.', 'error');

  editId = id;
  populateKelasSelect();
  document.getElementById('tanggal').value = p.tanggal;
  document.getElementById('kelasId').value = p.kelasId;
  document.getElementById('jumlahSiswa').value = p.jumlahSiswa;
  document.getElementById('jumlahGuruMengajar').value = p.jumlahGuruMengajar;
  document.getElementById('jumlahSiswaMenerima').value = p.jumlahSiswaMenerima;
  document.getElementById('jumlahGuruMenerima').value = p.jumlahGuruMenerima;
  document.getElementById('jumlahPorsi').value = p.jumlahPorsi;
  document.getElementById('jumlahPorsi').dataset.manual = '1';
  document.getElementById('petugas').value = p.petugas;

  document.getElementById('formTitle').textContent = 'Edit Pembagian MBG';
  document.getElementById('btnSubmit').textContent = '💾 Perbarui';
  document.getElementById('btnCancelEdit').classList.remove('hidden');

  // Scroll ke form di mobile
  document.getElementById('pembagianForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* === KONFIRMASI HAPUS PEMBAGIAN === */
function confirmDelete(id) {
  const p = getPembagianById(id);
  if (!p) return;
  showConfirm({
    title: 'Hapus Catatan Pembagian',
    message: `Hapus catatan pembagian MBG kelas ${p.namaKelas} tanggal ${formatTanggal(p.tanggal)}? Catatan pengembalian terkait juga akan dihapus.`,
    confirmText: 'Ya, Hapus',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      deletePembagian(id);
      renderTable();
      showToast('Catatan pembagian berhasil dihapus.', 'success');
    }
  });
}

/* === RENDER TABEL RIWAYAT PEMBAGIAN (PREVIEW DI HALAMAN INI) === */
function renderTable() {
  const data = getPembagian().sort((a, b) =>
    new Date(b.tanggal) - new Date(a.tanggal) || new Date(b.createdAt) - new Date(a.createdAt)
  );
  const tbody = document.getElementById('pembagianTableBody');

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state">
          <div class="empty-icon">🍱</div>
          <h4>Belum ada pembagian MBG tercatat</h4>
          <p>Isi form di atas untuk mulai mencatat pembagian MBG.</p>
        </div>
      </td></tr>`;
    document.getElementById('totalInfo').textContent = '0 catatan';
    return;
  }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${formatTanggal(p.tanggal)}</td>
      <td><strong>${escapeHtml(p.namaKelas)}</strong></td>
      <td class="num">${p.jumlahSiswa}</td>
      <td class="num">${p.jumlahGuruMengajar}</td>
      <td class="num">${p.jumlahSiswaMenerima}</td>
      <td class="num">${p.jumlahGuruMenerima}</td>
      <td class="num text-bold">${formatAngka(p.jumlahPorsi)}</td>
      <td>${escapeHtml(p.petugas)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm btn-outline" onclick="editData('${p.id}')">✎</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDelete('${p.id}')">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  const totalPorsi = data.reduce((s, p) => s + (Number(p.jumlahPorsi) || 0), 0);
  document.getElementById('totalInfo').textContent =
    `${data.length} catatan · ${formatAngka(totalPorsi)} porsi total`;
}

/* === INISIALISASI HALAMAN === */
document.addEventListener('DOMContentLoaded', () => {
  initLayout('pembagian');

  // Isi dropdown kelas
  populateKelasSelect();

  // Set tanggal default hari ini
  document.getElementById('tanggal').value = todayISO();

  // Pasang event handler
  document.getElementById('kelasId').addEventListener('change', onKelasChange);
  document.getElementById('jumlahSiswaMenerima').addEventListener('input', autoHitungPorsi);
  document.getElementById('jumlahGuruMenerima').addEventListener('input', autoHitungPorsi);
  document.getElementById('jumlahPorsi').addEventListener('input', markPorsiManual);

  // Submit form
  document.getElementById('pembagianForm').addEventListener('submit', saveData);
  document.getElementById('btnCancelEdit').addEventListener('click', resetForm);

  // Render tabel
  renderTable();
});
