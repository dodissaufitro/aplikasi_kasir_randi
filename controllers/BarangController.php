<?php

class BarangController extends Controller {
    public function __construct() {
        $this->requireRole('admin');
    }

    public function index() {
        $data['judul'] = 'Data Barang';
        $data['barang'] = $this->model('BarangModel')->getAllBarang();
        
        $this->view('templates/header', $data);
        $this->view('barang/index', $data);
        $this->view('templates/footer');
    }

    public function tambah() {
        if(isset($_POST['submit'])) {
            $data_barang = [
                'nama_barang' => $_POST['nama_barang'],
                'harga_beli' => $_POST['harga_beli'],
                'harga_jual' => $_POST['harga_jual'],
                'stok' => $_POST['stok']
            ];
            
            if($this->model('BarangModel')->tambahBarang($data_barang) > 0) {
                // Flash message success could be added here
                header('Location: ' . '/aplikasi_kasir_randi/public/barang');
                exit;
            }
        }
    }
}
