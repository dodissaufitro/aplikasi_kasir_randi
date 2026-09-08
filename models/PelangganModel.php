<?php

class PelangganModel {
    private $db;

    public function __construct() {
        $this->db = new Database;
    }

    public function getAllPelanggan() {
        $this->db->query('SELECT * FROM pelanggan');
        return $this->db->resultSet();
    }

    public function getPelangganById($id) {
        $this->db->query('SELECT * FROM pelanggan WHERE id_pelanggan = :id');
        $this->db->bind('id', $id);
        return $this->db->single();
    }

    public function tambahPelanggan($data) {
        $query = "INSERT INTO pelanggan (nama_pelanggan, no_telp) VALUES (:nama, :telp)";
        $this->db->query($query);
        $this->db->bind('nama', $data['nama_pelanggan']);
        $this->db->bind('telp', $data['no_telp']);
        $this->db->execute();
        return $this->db->lastInsertId();
    }

    public function updateHutang($id_pelanggan, $jumlah_hutang) {
        $query = "UPDATE pelanggan SET total_hutang = total_hutang + :jumlah WHERE id_pelanggan = :id";
        $this->db->query($query);
        $this->db->bind('jumlah', $jumlah_hutang);
        $this->db->bind('id', $id_pelanggan);
        return $this->db->execute();
    }
}
