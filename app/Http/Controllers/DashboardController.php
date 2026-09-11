<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\Pelanggan;
use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();

        // 1. Total Penjualan Hari Ini
        $totalPenjualan = Transaksi::whereDate('tanggal', $today)->sum('total_belanja');

        // 2. Transaksi Selesai Hari Ini
        $transaksiSelesai = Transaksi::whereDate('tanggal', $today)->count();

        // 3. Transaksi Lunas Hari Ini
        $totalPenjualanLunas = Transaksi::whereDate('tanggal', $today)->where('status_pembayaran', 'lunas')->sum('total_belanja');
        $transaksiLunasCount = Transaksi::whereDate('tanggal', $today)->where('status_pembayaran', 'lunas')->count();

        // 4. Barang Terjual Hari Ini
        $barangTerjual = DetailTransaksi::whereHas('transaksi', function($query) use ($today) {
            $query->whereDate('tanggal', $today);
        })->sum('jumlah');

        // 5. Piutang Belum Lunas (Semua waktu)
        $piutangBelumLunas = Transaksi::where('status_pembayaran', '!=', 'lunas')->sum('total_belanja');

        // 6. Transaksi Terbaru (5 data)
        $transaksiTerbaru = Transaksi::with('pelanggan')
            ->orderBy('tanggal', 'desc')
            ->take(5)
            ->get()
            ->map(function ($trx) {
                $dt = Carbon::parse($trx->tanggal)->locale('id');
                return [
                    'id_transaksi' => $trx->id_transaksi,
                    'hari' => $dt->isoFormat('dddd'),
                    'tanggal_transaksi' => $dt->isoFormat('dddd, D MMM Y • HH:mm'),
                    'jam' => $dt->format('H:i'),
                    'nama_pelanggan' => $trx->pelanggan ? $trx->pelanggan->nama_pelanggan : 'Pelanggan Umum',
                    'total_harga' => $trx->total_belanja,
                    'status_pembayaran' => $trx->status_pembayaran,
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'total_penjualan' => $totalPenjualan,
                'transaksi_selesai' => $transaksiSelesai,
                'total_penjualan_lunas' => $totalPenjualanLunas,
                'transaksi_lunas_count' => $transaksiLunasCount,
                'barang_terjual' => $barangTerjual,
                'piutang_belum_lunas' => $piutangBelumLunas,
            ],
            'recent_transactions' => $transaksiTerbaru
        ]);
    }
}
