<?php

class HutangController extends Controller {
    public function __construct() {
        $this->requireRole('admin');
    }

    public function index() {
        $data['judul'] = 'Daftar Piutang / Hutang Pelanggan';
        $data['pelanggan'] = $this->model('PelangganModel')->getAllPelanggan();
        
        $this->view('templates/header', $data);
        $this->view('hutang/index', $data);
        $this->view('templates/footer');
    }
}
