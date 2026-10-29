/* ============================================================
   MyOmpreng - DATA KELAS (kelas.js)
   Mengelola Create / Read / Update / Delete (CRUD) data kelas.
   Data setiap kelas: namaKelas & jumlahSiswa.
   ============================================================ */

/* === STATE EDIT ===
   - null  → sedang tidak mengedit, form dalam mode "tambah"
   - string → sedang mengedit kelas dengan id ini */
let editMode = null;

/* === RENDER TABEL DAFTAR KELAS === */
function renderTable() {
  const kelas = getKelas();
  const tbody = document.getElementById('kelasTableBody');

  if (kelas.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <div class="empty-icon">🏫</div>
          <h4>Belum ada kelas terdaftar</h4>
          <p>Klik tombol "Tambah Kelas" untuk membuat data kelas pertama.</p>
        </div>
      </td></tr>`;
    return;
  }

  // Urutkan berdasarkan nama kelas (A-Z)
  kelas.sort((a, b) => a.namaKelas.localeCompare(b.namaKelas));

  tbody.innerHTML = kelas.map((k, idx) => `
    <tr>
      <td class="text-center text-muted">${idx + 1}.</td>
      <td><strong>${escapeHtml(k.namaKelas)}</strong></td>
      <td class="num">${formatAngka(k.jumlahSiswa)} siswa</td>
      <td class="text-muted">${formatTanggal(k.createdAt)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm btn-outline" onclick="openForm('${k.id}')">✎ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDelete('${k.id}')">🗑 Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Footer info jumlah kelas
  const totalSiswa = kelas.reduce((s, k) => s + (Number(k.jumlahSiswa) || 0), 0);
  document.getElementById('kelasInfo').textContent =
    `${kelas.length} kelas · ${formatAngka(totalSiswa)} siswa total`;
}

/* === BUKA FORM (TAMBAH / EDIT) ===
   - Tanpa argumen → mode tambah
   - Dengan id    → mode edit (isi form dengan data kelas tsb) */
function openForm(id) {
  editMode = id || null;
  const form = document.getElementById('kelasForm');
  const title = document.getElementById('formTitle');
  const subtitle = document.getElementById('formSubtitle');

  if (id) {
    // Mode edit
    const k = getKelasById(id);
    if (!k) {
      showToast('Data kelas tidak ditemukan.', 'error');
      return;
    }
    document.getElementById('namaKelas').value = k.namaKelas;
    document.getElementById('jumlahSiswa').value = k.jumlahSiswa;
    title.textContent = 'Edit Kelas';
    subtitle.textContent = `Memperbarui data ${k.namaKelas}`;
  } else {
    // Mode tambah
    form.reset();
    title.textContent = 'Tambah Kelas';
    subtitle.textContent = 'Isi data kelas baru di bawah ini';
  }

  // Tampilkan modal
  document.getElementById('formModal').classList.add('open');
  // Fokus ke input pertama
  setTimeout(() => document.getElementById('namaKelas').focus(), 100);
}

/* === TUTUP FORM === */
function closeForm() {
  document.getElementById('formModal').classList.remove('open');
  editMode = null;
}

/* === SIMPAN DATA (DARI FORM) ===
   Validasi: nama kelas wajib diisi & tidak boleh duplikat. */
function saveData(event) {
  event.preventDefault();

  const namaKelas = document.getElementById('namaKelas').value.trim();
  const jumlahSiswa = parseInt(document.getElementById('jumlahSiswa').value, 10);

  if (!namaKelas) {
    showToast('Nama kelas wajib diisi.', 'error');
    return;
  }
  if (isNaN(jumlahSiswa) || jumlahSiswa < 0) {
    showToast('Jumlah siswa harus berupa angka positif.', 'error');
    return;
  }

  // Cek duplikat (kecuali diri sendiri saat edit)
  const dup = getKelas().find(k => k.namaKelas.toLowerCase() === namaKelas.toLowerCase() && k.id !== editMode);
  if (dup) {
    showToast(`Kelas "${namaKelas}" sudah ada. Gunakan nama lain.`, 'error');
    return;
  }

  if (editMode) {
    // Update
    updateKelas(editMode, { namaKelas, jumlahSiswa });
    showToast(`Kelas "${namaKelas}" berhasil diperbarui.`, 'success');
  } else {
    // Tambah
    addKelas({
      id: uid(),
      namaKelas,
      jumlahSiswa,
      createdAt: new Date().toISOString(),
    });
    showToast(`Kelas "${namaKelas}" berhasil ditambahkan.`, 'success');
  }

  // Tutup form & refresh tabel
  closeForm();
  renderTable();
}

/* === KONFIRMASI HAPUS === */
function confirmDelete(id) {
  const k = getKelasById(id);
  if (!k) return;
  showConfirm({
    title: 'Hapus Kelas',
    message: `Yakin ingin menghapus kelas "${k.namaKelas}"? Catatan pembagian & pengembalian terkait juga akan dihapus.`,
    confirmText: 'Ya, Hapus',
    confirmClass: 'btn-danger',
    onConfirm: () => {
      deleteKelas(id);
      // Hapus juga data pembagian & pengembalian untuk kelas ini
      savePembagian(getPembagian().filter(p => p.kelasId !== id));
      savePengembalian(getPengembalian().filter(r => r.kelasId !== id));
      renderTable();
      showToast(`Kelas "${k.namaKelas}" berhasil dihapus.`, 'success');
    }
  });
}

/* === INISIALISASI HALAMAN === */
document.addEventListener('DOMContentLoaded', () => {
  initLayout('kelas');

  // Tombol tambah kelas
  document.getElementById('btnTambah').addEventListener('click', () => openForm());

  // Form submit
  document.getElementById('kelasForm').addEventListener('submit', saveData);

  // Tombol batal & tutup di modal
  document.getElementById('btnCancel').addEventListener('click', closeForm);
  document.querySelectorAll('[data-close-form]').forEach(btn =>
    btn.addEventListener('click', closeForm)
  );

  // Klik di luar modal → tutup
  document.getElementById('formModal').addEventListener('click', (e) => {
    if (e.target.id === 'formModal') closeForm();
  });

  // Render tabel awal
  renderTable();
});
