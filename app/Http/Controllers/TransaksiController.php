<?php

namespace App\Http\Controllers;

use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use App\Models\Pelanggan;
use App\Models\Barang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransaksiController extends Controller
{
    public function index()
    {
        $transaksi = Transaksi::with(['pelanggan', 'detailTransaksi.barang'])
            ->orderBy('id_transaksi', 'desc')
            ->get();

        return Inertia::render('Transaksi/Index', [
            'transaksi' => $transaksi
        ]);
    }

    public function lunaskan($id)
    {
        try {
            DB::beginTransaction();

            $transaksi = Transaksi::findOrFail($id);

            if ($transaksi->status_pembayaran === 'lunas') {
                return redirect()->back()->withErrors(['error' => 'Transaksi ini sudah berstatus lunas.']);
            }

            $transaksi->status_pembayaran = 'lunas';
            $transaksi->save();

            // Kurangi hutang pada data pelanggan
            if ($transaksi->id_pelanggan) {
                $pelanggan = Pelanggan::find($transaksi->id_pelanggan);
                if ($pelanggan) {
                    $pelanggan->total_hutang = max(0, $pelanggan->total_hutang - $transaksi->total_belanja);
                    $pelanggan->save();
                }
            }

            DB::commit();

            return redirect()->back()->with('success', "Hutang untuk transaksi #TRX-" . str_pad($transaksi->id_transaksi, 4, '0', STR_PAD_LEFT) . " berhasil dilunasi.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal melunasi transaksi: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $transaksi = Transaksi::with('detailTransaksi')->findOrFail($id);

            // Kembalikan stok barang
            foreach ($transaksi->detailTransaksi as $detail) {
                $barang = Barang::find($detail->id_barang);
                if ($barang) {
                    $barang->stok += $detail->jumlah;
                    $barang->save();
                }
            }

            // Jika statusnya belum lunas (hutang), kurangi hutang pelanggan
            if ($transaksi->status_pembayaran === 'belum_lunas' && $transaksi->id_pelanggan) {
                $pelanggan = Pelanggan::find($transaksi->id_pelanggan);
                if ($pelanggan) {
                    $pelanggan->total_hutang = max(0, $pelanggan->total_hutang - $transaksi->total_belanja);
                    $pelanggan->save();
                }
            }

            $transaksi->delete();

            DB::commit();

            return redirect()->back()->with('success', 'Transaksi berhasil dibatalkan dan stok dikembalikan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal membatalkan transaksi: ' . $e->getMessage()]);
        }
    }
}
