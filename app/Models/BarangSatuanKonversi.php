<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarangSatuanKonversi extends Model
{
    use HasFactory;

    protected $table = 'barang_satuan_konversi';
    public $timestamps = false;

    protected $fillable = [
        'id_barang',
        'nama_satuan',
        'rasio_konversi',
        'harga_jual_satuan',
        'barcode_satuan',
    ];

    public function barang()
    {
        return $this->belongsTo(Barang::class, 'id_barang', 'id_barang');
    }
}
