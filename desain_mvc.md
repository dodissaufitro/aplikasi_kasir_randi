# Desain Arsitektur MVC Aplikasi Kasir

Berdasarkan kebutuhan yang Anda jabarkan, berikut adalah rancangan sistematis menggunakan pola arsitektur MVC (Model-View-Controller) beserta struktur databasenya.

## 1. STRUKTUR DATABASE (Relasi Entitas)

Untuk mendukung fitur stok dan hutang, kita butuh beberapa tabel utama:

- **Tabel `barang`**
  - `id_barang` (PK)
  - `nama_barang`
  - `harga_beli`
  - `harga_jual`
  - `stok` (Otomatis terupdate ketika ada barang masuk/keluar)
  
- **Tabel `stok_masuk`** (Mencatat history barang masuk)
  - `id_stok_masuk` (PK)
  - `id_barang` (FK)
  - `tanggal_masuk`
  - `jumlah`

- **Tabel `pelanggan`** (Untuk mencatat data orang yang berhutang)
  - `id_pelanggan` (PK)
  - `nama_pelanggan`
  - `no_telp`
  - `total_hutang`

- **Tabel `transaksi`** (Mencatat struk/nota utama)
  - `id_transaksi` (PK)
  - `tanggal`
  - `jenis_pembayaran` (ENUM: 'tunai', 'hutang')
  - `id_pelanggan` (FK, NULL jika tunai dan bukan pelanggan tetap)
  - `total_belanja`
  - `status_pembayaran` (ENUM: 'lunas', 'belum_lunas')

- **Tabel `detail_transaksi`** (Mencatat item yang dibeli & riwayat pengambilan barang untuk hutang)
  - `id_detail` (PK)
  - `id_transaksi` (FK)
  - `id_barang` (FK)
  - `jumlah`
  - `harga_satuan` (Harga jual saat transaksi)
  - `subtotal`

---

## 2. MODEL (Data Layer)
*Model bertugas berinteraksi langsung dengan database (Query).*

- **`BarangModel`**: Menangani query ambil data barang, tambah barang baru, serta fungsi `updateStok()` (menambah atau mengurangi stok).
- **`StokMasukModel`**: Menangani pencatatan riwayat penambahan stok dari supplier.
- **`TransaksiModel`**: Menyimpan data nota/struk.
- **`DetailTransaksiModel`**: Menyimpan rincian barang apa saja yang dibeli pada satu transaksi.
- **`PelangganModel`**: Mengelola data pelanggan, serta fungsi `updateHutang()` untuk menambah/mengurangi total hutang pelanggan.

---

## 3. CONTROLLER (Logic Layer)
*Controller bertugas menerima request dari user, memproses logika, dan mengirim data ke View.*

- **`BarangController`**
  - `index()`: Mengambil data dari `BarangModel` (stok, harga jual, harga beli) dan menampilkannya ke halaman list barang.
  - `stokMasuk()`: Menerima input barang masuk, menyimpan ke `StokMasukModel`, dan memanggil fungsi tambah stok di `BarangModel`.

- **`KasirController`**
  - `index()`: Menampilkan antarmuka mesin kasir (Point of Sale).
  - `prosesTransaksi()`: **Ini adalah core logic-nya.**
    1. Menerima data keranjang belanja dan metode pembayaran.
    2. Jika jenis = 'tunai', simpan transaksi, simpan detail transaksi, dan **kurangi sisa stok** di `BarangModel`.
    3. Jika jenis = 'hutang', pastikan user memilih pelanggan. Simpan transaksi (status 'belum_lunas'), simpan detail, **kurangi stok**, dan **tambah total hutang** di `PelangganModel`.

- **`HutangController`**
  - `index()`: Mengambil daftar pelanggan yang memiliki hutang (dari `PelangganModel`).
  - `detailRiwayat()`: Menampilkan rincian transaksi (pengambilan barang) dari pelanggan tertentu yang belum lunas.
  - `bayarHutang()`: Proses saat pelanggan mencicil/melunasi hutang (mengurangi `total_hutang` di data pelanggan dan mengubah status transaksi).

---

## 4. VIEW (Presentation Layer)
*View adalah antarmuka (UI) yang dilihat pengguna.*

- **`barang/index.php`**: Halaman tabel master barang. Ada kolom: Nama Barang, Harga Beli, Harga Jual, Sisa Stok. Ada tombol "Tambah Stok" dan "Edit".
- **`kasir/index.php`**: Halaman transaksi utama (POS). Terdapat form pencarian barang, list keranjang, total harga, dan pilihan Dropdown Pembayaran ("Tunai" / "Hutang"). Jika "Hutang" dipilih, akan muncul form input/pilih Nama Orang.
- **`hutang/index.php`**: Halaman Daftar Piutang. Menampilkan list nama orang dan jumlah hutangnya. Ada tombol "Detail" untuk melihat history barang apa saja yang mereka ambil, dan tombol "Bayar" untuk pelunasan.
