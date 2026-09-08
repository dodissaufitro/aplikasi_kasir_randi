<?php

class UserModel {
    private $db;

    public function __construct() {
        $this->db = new Database;
    }

    public function cekLogin($username, $password) {
        $this->db->query("SELECT * FROM users WHERE username = :username");
        $this->db->bind('username', $username);
        $user = $this->db->single();

        // Cek jika user ada dan password cocok (menggunakan MD5 sesuai migration)
        if ($user && md5($password) === $user['password']) {
            return $user;
        }
        return false;
    }
}
