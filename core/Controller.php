<?php

class Controller {
    public function view($view, $data = []) {
        require_once '../views/' . $view . '.php';
    }

    public function model($model) {
        require_once '../models/' . $model . '.php';
        return new $model;
    }

    // Fungsi proteksi login umum
    public function requireLogin() {
        if (!isset($_SESSION['user'])) {
            header('Location: ' . '/aplikasi_kasir_randi/public/auth');
            exit;
        }
    }

    // Fungsi proteksi khusus Admin
    public function requireRole($role) {
        $this->requireLogin();
        if ($_SESSION['user']['role'] !== $role) {
            echo "Akses Ditolak! Halaman ini hanya untuk " . ucfirst($role);
            exit;
        }
    }
}
