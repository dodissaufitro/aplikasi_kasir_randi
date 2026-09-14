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
        'total_terjual',
        'total_terjual_text',
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
     * Helper format jumlah kuantitas dengan konversi satuan bertingkat
     */
    public function formatKonversiText(int $qty): string
    {
        $baseSatuan = $this->satuan ?: 'PCS';

        $konversiList = $this->relationLoaded('satuanKonversi') 
            ? $this->satuanKonversi 
            : $this->satuanKonversi()->get();

        if ($konversiList->isEmpty()) {
            return "{$qty} {$baseSatuan}";
        }

        // Ambil satuan konversi terbesar (rasio tertinggi)
        $topKonversi = $konversiList->sortByDesc('rasio_konversi')->first();
        $rasio = (int) $topKonversi->rasio_konversi;

        if ($rasio <= 1) {
            return "{$qty} {$baseSatuan}";
        }

        $jumlahBesar = intdiv($qty, $rasio);
        $sisaKecil = $qty % $rasio;

        if ($jumlahBesar > 0 && $sisaKecil === 0) {
            return "{$qty} {$baseSatuan} ({$jumlahBesar} {$topKonversi->nama_satuan})";
        } elseif ($jumlahBesar > 0 && $sisaKecil > 0) {
            return "{$qty} {$baseSatuan} ({$jumlahBesar} {$topKonversi->nama_satuan} {$sisaKecil} {$baseSatuan})";
        } else {
            return "{$qty} {$baseSatuan}";
        }
    }

    /**
     * Helper kalkulasi stok pintar dengan konversi multi-satuan
     * Contoh: Stok 120 PCS dengan konversi 1 Dus = 24 PCS -> "120 PCS (5 Dus)"
     * Contoh: Stok 117 PCS dengan konversi 1 Dus = 24 PCS -> "117 PCS (4 Dus 21 PCS)"
     */
    public function getStokKonversiTextAttribute(): string
    {
        return $this->formatKonversiText((int) $this->stok);
    }

    public function getTotalTerjualAttribute(): int
    {
        return (int) ($this->attributes['total_terjual'] ?? 0);
    }

    public function getTotalTerjualTextAttribute(): string
    {
        return $this->formatKonversiText($this->total_terjual);
    }
}
