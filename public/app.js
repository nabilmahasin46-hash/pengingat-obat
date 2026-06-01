const medForm = document.getElementById('medForm');
const medList = document.getElementById('medList');

// 1. READ DATA
async function fetchMedicines() {
    const res = await fetch('/api/medicines');
    const data = await res.json();
    
    // Urutkan berdasarkan tanggal kedaluwarsa terdekat
    data.sort((a, b) => new Date(a.tanggal_kedaluwarsa) - new Date(b.tanggal_kedaluwarsa));

    medList.innerHTML = '';
    const today = new Date();

    data.forEach(med => {
        const expDate = new Date(med.tanggal_kedaluwarsa);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let cardClass = "med-card";
        let badgesHtml = `<span class="badge badge-safe">Aman</span>`;

        if (diffDays <= 0) {
            cardClass = "med-card card-expired";
            badgesHtml = `<span class="badge badge-expired">KEDALUWARSA</span>`;
        } else if (diffDays <= 90) {
            cardClass = "med-card card-warning";
            badgesHtml = `<span class="badge badge-warning">⚠️ Exp < 3 Bulan</span>`;
        }

        if (med.stok_saat_ini <= 3 && diffDays > 0) {
            badgesHtml += ` <span class="badge badge-low">Stok Menipis</span>`;
        }

        const card = `
            <div class="${cardClass}">
                <div>
                    <div class="card-header">
                        <h3>${med.nama_obat}</h3>
                        <div class="badges">${badgesHtml}</div>
                    </div>
                    <p class="med-meta">Jenis: <b>${med.kategori}</b> | Simpan: <b>${med.lokasi_penyimpanan}</b></p>
                    <p class="med-details">📅 Exp: ${med.tanggal_kedaluwarsa}</p>
                    <p class="med-details" style="font-weight: 600;">📦 Stok: ${med.stok_saat_ini}</p>
                    <p class="med-note">${med.catatan_dosis || '-'}</p>
                </div>
                <div class="card-actions">
                    <button onclick="consumeMedicine(${med.id})" class="btn btn-consume">
                        💊 Minum (-1)
                    </button>
                    <button onclick="deleteMedicine(${med.id})" class="btn btn-delete">
                        Hapus
                    </button>
                </div>
            </div>
        `;
        medList.innerHTML += card;
    });
}

// 2. CREATE DATA
medForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        nama_obat: document.getElementById('nama_obat').value,
        kategori: document.getElementById('kategori').value,
        stok_saat_ini: document.getElementById('stok_saat_ini').value,
        tanggal_kedaluwarsa: document.getElementById('tanggal_kedaluwarsa').value,
        lokasi_penyimpanan: document.getElementById('lokasi_penyimpanan').value,
        catatan_dosis: document.getElementById('catatan_dosis').value,
    };

    const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        medForm.reset();
        fetchMedicines();
    } else {
        const err = await res.json();
        alert(err.message);
    }
});

// 3. UPDATE DATA (Kurangi Stok)
async function consumeMedicine(id) {
    const res = await fetch(`/api/medicines/${id}/consume`, { method: 'PATCH' });
    if (res.ok) {
        fetchMedicines();
    } else {
        const err = await res.json();
        alert(err.message);
    }
}

// 4. DELETE DATA
async function deleteMedicine(id) {
    if (confirm('Apakah kamu yakin ingin menghapus obat ini dari kotak?')) {
        await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
        fetchMedicines();
    }
}

// Jalankan saat pertama kali web dibuka
fetchMedicines();