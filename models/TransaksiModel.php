<?php

class TransaksiModel {
    private $db;

    public function __construct() {
        $this->db = new Database;
    }

    public function simpanTransaksi($data) {
        $query = "INSERT INTO transaksi (jenis_pembayaran, id_pelanggan, total_belanja, status_pembayaran) 
                  VALUES (:jenis, :id_pelanggan, :total, :status)";
        $this->db->query($query);
        $this->db->bind('jenis', $data['jenis_pembayaran']);
        $this->db->bind('id_pelanggan', $data['id_pelanggan']);
        $this->db->bind('total', $data['total_belanja']);
        $this->db->bind('status', $data['status_pembayaran']);
        $this->db->execute();
        
        return $this->db->lastInsertId();
    }

    public function simpanDetailTransaksi($id_transaksi, $id_barang, $jumlah, $harga_satuan, $subtotal) {
        $query = "INSERT INTO detail_transaksi (id_transaksi, id_barang, jumlah, harga_satuan, subtotal) 
                  VALUES (:id_trans, :id_brg, :qty, :harga, :subtotal)";
        $this->db->query($query);
        $this->db->bind('id_trans', $id_transaksi);
        $this->db->bind('id_brg', $id_barang);
        $this->db->bind('qty', $jumlah);
        $this->db->bind('harga', $harga_satuan);
        $this->db->bind('subtotal', $subtotal);
        return $this->db->execute();
    }
}
