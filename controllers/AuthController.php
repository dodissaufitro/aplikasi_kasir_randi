<?php

class AuthController extends Controller {
    public function index() {
        // Jika sudah login, arahkan ke kasir
        if (isset($_SESSION['user'])) {
            header('Location: ' . '/aplikasi_kasir_randi/public/kasir');
            exit;
        }

        $data['judul'] = 'Login - POS Kasir';
        $this->view('auth/login', $data);
    }

    public function login() {
        if (isset($_POST['submit'])) {
            $username = $_POST['username'];
            $password = $_POST['password'];

            $user = $this->model('UserModel')->cekLogin($username, $password);

            if ($user) {
                // Set session
                $_SESSION['user'] = [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'nama_lengkap' => $user['nama_lengkap'],
                    'role' => $user['role']
                ];
                header('Location: ' . '/aplikasi_kasir_randi/public/kasir');
                exit;
            } else {
                $_SESSION['login_error'] = "Username atau Password salah!";
                header('Location: ' . '/aplikasi_kasir_randi/public/auth');
                exit;
            }
        }
    }

    public function logout() {
        session_unset();
        session_destroy();
        header('Location: ' . '/aplikasi_kasir_randi/public/auth');
        exit;
    }
}
