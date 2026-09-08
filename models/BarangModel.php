<?php

class BarangModel {
    private $db;

    public function __construct() {
        $this->db = new Database;
    }

    public function getAllBarang() {
        $this->db->query('SELECT * FROM barang');
        return $this->db->resultSet();
    }

    public function getBarangById($id) {
        $this->db->query('SELECT * FROM barang WHERE id_barang = :id');
        $this->db->bind('id', $id);
        return $this->db->single();
    }

    public function tambahBarang($data) {
        $query = "INSERT INTO barang (nama_barang, harga_beli, harga_jual, stok) VALUES (:nama_barang, :harga_beli, :harga_jual, :stok)";
        $this->db->query($query);
        $this->db->bind('nama_barang', $data['nama_barang']);
        $this->db->bind('harga_beli', $data['harga_beli']);
        $this->db->bind('harga_jual', $data['harga_jual']);
        $this->db->bind('stok', $data['stok']);
        $this->db->execute();
        return $this->db->rowCount();
    }

    public function updateStokBarang($id_barang, $jumlah, $jenis = 'tambah') {
        if ($jenis == 'tambah') {
            $query = "UPDATE barang SET stok = stok + :jumlah WHERE id_barang = :id_barang";
        } else {
            $query = "UPDATE barang SET stok = stok - :jumlah WHERE id_barang = :id_barang";
        }
        $this->db->query($query);
        $this->db->bind('jumlah', $jumlah);
        $this->db->bind('id_barang', $id_barang);
        return $this->db->execute();
    }
}
