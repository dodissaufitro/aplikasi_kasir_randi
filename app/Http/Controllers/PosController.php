<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\Pelanggan;
use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index()
    {
        $barang = Barang::where('stok', '>', 0)->get();
        $pelanggan = Pelanggan::all();

        return Inertia::render('Kasir/Index', [
            'barang' => $barang,
            'pelanggan' => $pelanggan
        ]);
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id_barang' => 'required|exists:barang,id_barang',
            'items.*.jumlah' => 'required|integer|min:1',
            'jenis_pembayaran' => 'required|in:tunai,hutang',
            'id_pelanggan' => 'required_if:jenis_pembayaran,hutang|nullable|exists:pelanggan,id_pelanggan',
        ]);

        try {
            DB::beginTransaction();

            $totalHarga = 0;
            foreach ($request->items as $item) {
                $totalHarga += ($item['harga_jual'] * $item['jumlah']);
            }

            // Buat Transaksi
            $transaksi = Transaksi::create([
                'id_pelanggan' => $request->id_pelanggan ? $request->id_pelanggan : null,
                'tanggal' => now(),
                'total_belanja' => $totalHarga,
                'jenis_pembayaran' => $request->jenis_pembayaran,
                'status_pembayaran' => $request->jenis_pembayaran === 'tunai' ? 'lunas' : 'belum_lunas',
            ]);

            // Jika hutang, tambahkan ke total_hutang pelanggan
            if ($request->jenis_pembayaran === 'hutang' && $request->id_pelanggan) {
                $pelanggan = Pelanggan::find($request->id_pelanggan);
                if ($pelanggan) {
                    $pelanggan->total_hutang += $totalHarga;
                    $pelanggan->save();
                }
            }

            // Simpan Detail & Kurangi Stok
            foreach ($request->items as $item) {
                DetailTransaksi::create([
                    'id_transaksi' => $transaksi->id_transaksi,
                    'id_barang' => $item['id_barang'],
                    'jumlah' => $item['jumlah'],
                    'harga_satuan' => $item['harga_jual'],
                    'subtotal' => $item['harga_jual'] * $item['jumlah']
                ]);

                // Kurangi stok
                $barang = Barang::find($item['id_barang']);
                if ($barang->stok < $item['jumlah']) {
                    throw new \Exception("Stok {$barang->nama_barang} tidak mencukupi.");
                }
                
                $barang->stok -= $item['jumlah'];
                $barang->save();
            }

            DB::commit();

            return redirect()->back()->with('success', 'Transaksi #TRX-' . str_pad($transaksi->id_transaksi, 4, '0', STR_PAD_LEFT) . ' berhasil disimpan!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
