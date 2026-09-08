CREATE DATABASE IF NOT EXISTS kasir_db;
USE kasir_db;

CREATE TABLE IF NOT EXISTS barang (
    id_barang INT AUTO_INCREMENT PRIMARY KEY,
    nama_barang VARCHAR(255) NOT NULL,
    harga_beli DECIMAL(10,2) NOT NULL,
    harga_jual DECIMAL(10,2) NOT NULL,
    stok INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stok_masuk (
    id_stok_masuk INT AUTO_INCREMENT PRIMARY KEY,
    id_barang INT NOT NULL,
    tanggal_masuk DATETIME DEFAULT CURRENT_TIMESTAMP,
    jumlah INT NOT NULL,
    FOREIGN KEY (id_barang) REFERENCES barang(id_barang) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pelanggan (
    id_pelanggan INT AUTO_INCREMENT PRIMARY KEY,
    nama_pelanggan VARCHAR(255) NOT NULL,
    no_telp VARCHAR(20),
    total_hutang DECIMAL(15,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transaksi (
    id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
    jenis_pembayaran ENUM('tunai', 'hutang') NOT NULL,
    id_pelanggan INT NULL,
    total_belanja DECIMAL(15,2) NOT NULL,
    status_pembayaran ENUM('lunas', 'belum_lunas') NOT NULL,
    FOREIGN KEY (id_pelanggan) REFERENCES pelanggan(id_pelanggan) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS detail_transaksi (
    id_detail INT AUTO_INCREMENT PRIMARY KEY,
    id_transaksi INT NOT NULL,
    id_barang INT NOT NULL,
    jumlah INT NOT NULL,
    harga_satuan DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi) ON DELETE CASCADE,
    FOREIGN KEY (id_barang) REFERENCES barang(id_barang) ON DELETE CASCADE
);
