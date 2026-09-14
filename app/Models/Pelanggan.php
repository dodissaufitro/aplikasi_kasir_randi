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

    protected $casts = [
        'total_hutang' => 'float',
    ];

    public function pembayaranHutang()
    {
        return $this->hasMany(PembayaranHutang::class, 'id_pelanggan', 'id_pelanggan')->orderBy('tanggal_bayar', 'desc');
    }

    public function transaksi()
    {
        return $this->hasMany(Transaksi::class, 'id_pelanggan', 'id_pelanggan');
    }

    public function transaksiBelumLunas()
    {
        return $this->hasMany(Transaksi::class, 'id_pelanggan', 'id_pelanggan')
            ->where('status_pembayaran', 'belum_lunas')
            ->where('status_transaksi', 'selesai')
            ->orderBy('tanggal', 'asc');
    }
}
