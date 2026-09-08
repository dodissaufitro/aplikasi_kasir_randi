<?php

class KasirController extends Controller {
    public function __construct() {
        $this->requireLogin();
    }

    public function index() {
        $data['judul'] = 'Mesin Kasir';
        $data['barang'] = $this->model('BarangModel')->getAllBarang();
        $data['pelanggan'] = $this->model('PelangganModel')->getAllPelanggan();
        
        $this->view('templates/header', $data);
        $this->view('kasir/index', $data);
        $this->view('templates/footer');
    }

    public function prosesTransaksi() {
        if(isset($_POST['submit'])) {
            $keranjang = isset($_POST['id_barang']) ? $_POST['id_barang'] : [];
            $qty = isset($_POST['qty']) ? $_POST['qty'] : [];
            $harga = isset($_POST['harga_jual']) ? $_POST['harga_jual'] : [];
            
            $jenis_pembayaran = $_POST['jenis_pembayaran']; // 'tunai' atau 'hutang'
            $id_pelanggan = !empty($_POST['id_pelanggan']) ? $_POST['id_pelanggan'] : null;
            
            // Buat pelanggan baru jika hutang dan menginput nama baru
            if ($jenis_pembayaran == 'hutang' && empty($id_pelanggan) && !empty($_POST['nama_pelanggan_baru'])) {
                $id_pelanggan = $this->model('PelangganModel')->tambahPelanggan([
                    'nama_pelanggan' => $_POST['nama_pelanggan_baru'],
                    'no_telp' => $_POST['no_telp_baru'] ?? ''
                ]);
            }

            $total_belanja = 0;
            for ($i = 0; $i < count($keranjang); $i++) {
                $total_belanja += ($qty[$i] * $harga[$i]);
            }

            $status_pembayaran = ($jenis_pembayaran == 'tunai') ? 'lunas' : 'belum_lunas';

            // 1. Simpan tabel transaksi
            $data_transaksi = [
                'jenis_pembayaran' => $jenis_pembayaran,
                'id_pelanggan' => $id_pelanggan,
                'total_belanja' => $total_belanja,
                'status_pembayaran' => $status_pembayaran
            ];
            $id_transaksi = $this->model('TransaksiModel')->simpanTransaksi($data_transaksi);

            // 2. Simpan detail transaksi dan Update Stok
            for ($i = 0; $i < count($keranjang); $i++) {
                $subtotal = $qty[$i] * $harga[$i];
                $this->model('TransaksiModel')->simpanDetailTransaksi(
                    $id_transaksi, 
                    $keranjang[$i], 
                    $qty[$i], 
                    $harga[$i], 
                    $subtotal
                );

                // Kurangi stok
                $this->model('BarangModel')->updateStokBarang($keranjang[$i], $qty[$i], 'kurang');
            }

            // 3. Jika hutang, update total hutang pelanggan
            if ($jenis_pembayaran == 'hutang' && $id_pelanggan != null) {
                $this->model('PelangganModel')->updateHutang($id_pelanggan, $total_belanja);
            }

            header('Location: ' . '/aplikasi_kasir_randi/public/kasir?success=true');
            exit;
        }
    }
}
