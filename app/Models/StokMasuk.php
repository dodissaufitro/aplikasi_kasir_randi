<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StokMasuk extends Model
{
    use HasFactory;

    protected $table = 'stok_masuk';
    protected $primaryKey = 'id_stok_masuk';
    public $timestamps = false;

    protected $fillable = [
        'id_barang',
        'tanggal_masuk',
        'jumlah',
        'satuan',
        'rasio_konversi',
    ];

    public function barang()
    {
        return $this->belongsTo(Barang::class, 'id_barang', 'id_barang');
    }
}
