<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    use HasFactory;

    protected $table = 'barang';
    protected $primaryKey = 'id_barang';
    public $timestamps = false; // Karena migration tidak pakai timestamps()

    protected $fillable = [
        'nama_barang',
        'harga_beli',
        'harga_jual',
        'stok'
    ];
}
