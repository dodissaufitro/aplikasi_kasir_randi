<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    use HasFactory;

    protected $table = 'barang';
    protected $primaryKey = 'id_barang';
    public $timestamps = false;

    protected $fillable = [
        'kode_barang',
        'barcode',
        'foto_produk',
        'nama_barang',
        'kategori',
        'merk',
        'supplier',
        'satuan',
        'harga_beli',
        'harga_jual',
        'harga_grosir',
        'stok',
        'stok_minimum',
        'lokasi_rak',
        'is_aktif',
    ];

    protected $casts = [
        'is_aktif' => 'boolean',
        'harga_beli' => 'float',
        'harga_jual' => 'float',
        'harga_grosir' => 'float',
        'stok' => 'integer',
        'stok_minimum' => 'integer',
    ];

    protected $appends = [
        'foto_url',
        'stok_konversi_text',
    ];

    public function satuanKonversi()
    {
        return $this->hasMany(BarangSatuanKonversi::class, 'id_barang', 'id_barang');
    }

    public function detailTransaksi()
    {
        return $this->hasMany(DetailTransaksi::class, 'id_barang', 'id_barang');
    }

    public function stokMasuk()
    {
        return $this->hasMany(StokMasuk::class, 'id_barang', 'id_barang');
    }

    public function getFotoUrlAttribute(): ?string
    {
        if ($this->foto_produk) {
            return asset('storage/' . $this->foto_produk);
        }
        return null;
    }

    /**
     * Helper kalkulasi stok pintar dengan konversi multi-satuan
     * Contoh: Stok 120 PCS dengan konversi 1 Dus = 24 PCS -> "120 PCS (5 Dus)"
     * Contoh: Stok 117 PCS dengan konversi 1 Dus = 24 PCS -> "117 PCS (4 Dus 21 PCS)"
     */
    public function getStokKonversiTextAttribute(): string
    {
        $baseSatuan = $this->satuan ?: 'PCS';
        $stok = (int) $this->stok;

        $konversiList = $this->relationLoaded('satuanKonversi') 
            ? $this->satuanKonversi 
            : $this->satuanKonversi()->get();

        if ($konversiList->isEmpty()) {
            return "{$stok} {$baseSatuan}";
        }

        // Ambil satuan konversi terbesar (rasio tertinggi)
        $topKonversi = $konversiList->sortByDesc('rasio_konversi')->first();
        $rasio = (int) $topKonversi->rasio_konversi;

        if ($rasio <= 1) {
            return "{$stok} {$baseSatuan}";
        }

        $jumlahBesar = intdiv($stok, $rasio);
        $sisaKecil = $stok % $rasio;

        if ($jumlahBesar > 0 && $sisaKecil === 0) {
            return "{$stok} {$baseSatuan} ({$jumlahBesar} {$topKonversi->nama_satuan})";
        } elseif ($jumlahBesar > 0 && $sisaKecil > 0) {
            return "{$stok} {$baseSatuan} ({$jumlahBesar} {$topKonversi->nama_satuan} {$sisaKecil} {$baseSatuan})";
        } else {
            return "{$stok} {$baseSatuan}";
        }
    }
}
