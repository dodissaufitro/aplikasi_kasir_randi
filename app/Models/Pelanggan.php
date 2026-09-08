<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pelanggan extends Model
{
    use HasFactory;

    protected $table = 'pelanggan';
    protected $primaryKey = 'id_pelanggan';
    public $timestamps = false; // Karena migration tidak pakai timestamps()

    protected $fillable = [
        'nama_pelanggan',
        'no_telp',
        'total_hutang'
    ];
}
