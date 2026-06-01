const express = require('express');
const cors = require('cors');
const path = require('path');
const mySQL = require('mysql2/promise'); // Import mysql2 dengan promise untuk koneksi database
const app = express();
const PORT = process.env.PORT || 3000;// => Menentukan port untuk server, menggunakan variabel lingkungan PORT jika tersedia, atau default ke 3000
app.use(cors({
    origin: 'https://pengingat-obat.pages.dev' // izin untuk akses dari domain ini saja
}));

// Middleware agar serverm bisa membaca JSON dan melayani file statis
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. KONEKSI KE MYSQL (Membaca otomatis dari variabel Railway)
const pool = mysql.createPool({
    connectionLimit: 10,
    uri: process.env.MYSQL_URL 
}).promise();

// Buat tabel otomatis jika belum tersedia di database Railway kamu
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS medicines (
                id BIGINT PRIMARY KEY,
                nama_obat VARCHAR(255) NOT NULL,
                kategori VARCHAR(100),
                stok_saat_ini INT DEFAULT 0,
                lokasi_penyimpanan VARCHAR(255),
                tanggal_kedaluwarsa DATE,
                catatan_dosis TEXT
            )
        `);
        console.log("Database & Tabel Obat siap digunakan!");
    } catch (err) {
        console.error("Gagal menginisialisasi database:", err.message);
    }
}
initDatabase();

// 1. READ: Ambil semua data obat
app.get('/api/medicines',async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM medicines');
        res.json(rows);
    } catch (err) {
        console.error("Gagal mengambil data obat:", err.message);
        res.status(500).json({ message: "Gagal mengambil data obat." });
    }
});

// 2. CREATE: Tambah obat baru
app.post('/api/medicines',async (req, res) => {
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

    try {
        await pool.query('INSERT INTO medicines (id, nama_obat, kategori, stok_saat_ini, lokasi_penyimpanan, tanggal_kedaluwarsa, catatan_dosis) VALUES (?, ?, ?, ?, ?, ?, ?)', [
            newMedicine.id,
            newMedicine.nama_obat,
            newMedicine.kategori,
            newMedicine.stok_saat_ini,
            newMedicine.lokasi_penyimpanan,
            newMedicine.tanggal_kedaluwarsa,
            newMedicine.catatan_dosis
        ]);
        res.status(201).json(newMedicine);
    } catch (err) {
        console.error("Gagal menambahkan obat:", err.message);
        res.status(500).json({ message: "Gagal menambahkan obat." });
    }
});

// 3. UPDATE: Mengurangi stok obat secara instan (-1)
app.patch('/api/medicines/:id/consume', async  (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const [rows] = await pool.query('SELECT * FROM medicines WHERE id = ?', [id]);
        const medicine = rows[0];

    if (!medicine) {
        return res.status(404).json({ message: "Obat tidak ditemukan" });
    }

        if (medicine.stok_saat_ini > 0) {
            await pool.query('UPDATE medicines SET stok_saat_ini = stok_saat_ini - 1 WHERE id = ?', [id]);
            res.json({ ...medicine, stok_saat_ini: medicine.stok_saat_ini - 1 });
        } else {
            res.status(400).json({ message: "Stok sudah habis!" });
        }
    } catch (err) {
        console.error("Gagal mengurangi stok obat:", err.message);
        res.status(500).json({ message: "Gagal mengurangi stok obat." });
    }
});

// 4. DELETE: Hapus obat dari daftar
app.delete('/api/medicines/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await pool.query('DELETE FROM medicines WHERE id = ?', [id]);
        res.json({ message: "Obat berhasil dihapus." });
    } catch (err) {
        console.error("Gagal menghapus obat:", err.message);
        res.status(500).json({ message: "Gagal menghapus obat." });
    }
});

// Jalankan server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 KONSTRUKSI BERHASIL: Server aktif di port ${PORT}`);
});