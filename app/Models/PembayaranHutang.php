<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PembayaranHutang extends Model
{
    use HasFactory;

    protected $table = 'pembayaran_hutang';
    protected $primaryKey = 'id_pembayaran';

    protected $fillable = [
        'id_pelanggan',
        'tanggal_bayar',
        'nominal_bayar',
        'sisa_hutang_setelahnya',
        'metode_pembayaran',
        'catatan',
        'id_user'
    ];

    protected $casts = [
        'tanggal_bayar' => 'datetime',
        'nominal_bayar' => 'float',
        'sisa_hutang_setelahnya' => 'float',
    ];

    public function pelanggan()
    {
        return $this->belongsTo(Pelanggan::class, 'id_pelanggan', 'id_pelanggan');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id');
    }
}
