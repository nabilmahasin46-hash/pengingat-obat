const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;// => Menentukan port untuk server, menggunakan variabel lingkungan PORT jika tersedia, atau default ke 3000
app.use(cors({
    origin: 'https://pengingat-obat.pages.dev' // izin untuk akses dari domain ini saja
}));

// Middleware agar server bisa membaca JSON dan melayani file statis
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database sementara di memori (Array) dengan beberapa data awal (seed data)
let medicines = [
    {
        id: 1,
        nama_obat: "Paracetamol",
        kategori: "Tablet",
        stok_saat_ini: 12,
        lokasi_penyimpanan: "Kotak P3K Dapur",
        tanggal_kedaluwarsa: "2027-12-31",
        catatan_dosis: "Diminum setelah makan jika demam."
    },
    {
        id: 2,
        nama_obat: "Sirup Obat Batuk",
        kategori: "Sirup",
        stok_saat_ini: 2,
        lokasi_penyimpanan: "Kulkas",
        tanggal_kedaluwarsa: "2026-02-15", // Contoh hampir/sudah kedaluwarsa bergantung tahun berjalan
        catatan_dosis: "3x sehari 1 sendok teh."
    }
];

// 1. READ: Ambil semua data obat
app.get('/api/medicines', (req, res) => {
    res.json(medicines);
});

// 2. CREATE: Tambah obat baru
app.post('/api/medicines', (req, res) => {
    const { nama_obat, kategori, stok_saat_ini, lokasi_penyimpanan, tanggal_kedaluwarsa, catatan_dosis } = req.body;
    
    // Validasi sederhana jika tanggal sudah lewat
    const today = new Date().toISOString().split('T')[0];
    if (tanggal_kedaluwarsa < today) {
        return res.status(400).json({ message: "Gagal! Obat sudah kedaluwarsa tidak bisa dimasukkan." });
    }

    const newMedicine = {
        id: Date.now(), // Generate ID unik berbasis timestamp
        nama_obat,
        kategori,
        stok_saat_ini: parseInt(stok_saat_ini) || 0,
        lokasi_penyimpanan,
        tanggal_kedaluwarsa,
        catatan_dosis
    };

    medicines.push(newMedicine);
    res.status(201).json(newMedicine);
});

// 3. UPDATE: Mengurangi stok obat secara instan (-1)
app.patch('/api/medicines/:id/consume', (req, res) => {
    const id = parseInt(req.params.id);
    const medicine = medicines.find(m => m.id === id);

    if (!medicine) {
        return res.status(404).json({ message: "Obat tidak ditemukan" });
    }

    if (medicine.stok_saat_ini > 0) {
        medicine.stok_saat_ini -= 1;
        res.json(medicine);
    } else {
        res.status(400).json({ message: "Stok sudah habis!" });
    }
});

// 4. DELETE: Hapus obat dari daftar
app.delete('/api/medicines/:id', (req, res) => {
    const id = parseInt(req.params.id);
    medicines = medicines.filter(m => m.id !== id);
    res.json({ message: "Obat berhasil dihapus." });
});

// Jalankan server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 KONSTRUKSI BERHASIL: Server aktif di port ${PORT}`);
});