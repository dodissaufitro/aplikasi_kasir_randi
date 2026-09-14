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
        $terjualMap = DetailTransaksi::whereHas('transaksi', function ($q) {
                $q->where('status_transaksi', 'selesai');
            })
            ->select('id_barang', DB::raw('SUM(jumlah * COALESCE(rasio_konversi, 1)) as total_terjual'))
            ->groupBy('id_barang')
            ->pluck('total_terjual', 'id_barang');

        $barang = Barang::with('satuanKonversi')
            ->where('stok', '>', 0)
            ->where('is_aktif', true)
            ->get()
            ->map(function ($b) use ($terjualMap) {
                $qty = (int) ($terjualMap[$b->id_barang] ?? 0);
                $b->total_terjual = $qty;
                $b->total_terjual_text = $b->formatKonversiText($qty);
                return $b;
            });

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
            'items.*.satuan' => 'nullable|string|max:50',
            'items.*.rasio_konversi' => 'nullable|integer|min:1',
            'items.*.harga_jual' => 'required|numeric|min:0',
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
                'status_transaksi' => 'selesai',
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
                $barang = Barang::findOrFail($item['id_barang']);
                $rasio = isset($item['rasio_konversi']) && (int)$item['rasio_konversi'] > 0 
                    ? (int)$item['rasio_konversi'] 
                    : 1;

                $satuan = !empty($item['satuan']) ? $item['satuan'] : ($barang->satuan ?: 'PCS');
                $jumlahPotongStok = (int)$item['jumlah'] * $rasio;

                if ($barang->stok < $jumlahPotongStok) {
                    $satuanName = $barang->satuan ?: 'PCS';
                    throw new \Exception("Stok {$barang->nama_barang} tidak mencukupi (dibutuhkan {$jumlahPotongStok} {$satuanName}, tersedia {$barang->stok} {$satuanName}).");
                }

                DetailTransaksi::create([
                    'id_transaksi' => $transaksi->id_transaksi,
                    'id_barang' => $barang->id_barang,
                    'jumlah' => $item['jumlah'],
                    'satuan' => $satuan,
                    'rasio_konversi' => $rasio,
                    'harga_satuan' => $item['harga_jual'],
                    'subtotal' => $item['harga_jual'] * $item['jumlah']
                ]);

                // Kurangi stok dasar
                $barang->stok -= $jumlahPotongStok;
                $barang->save();
            }

            DB::commit();

            return redirect()->back()->with('success', 'Transaksi #TRX-' . str_pad($transaksi->id_transaksi, 4, '0', STR_PAD_LEFT) . ' berhasil disimpan!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function quickPelanggan(Request $request)
    {
        $validated = $request->validate([
            'nama_pelanggan' => 'required|string|max:255',
            'no_telp' => 'nullable|string|max:20',
        ]);

        $pelanggan = Pelanggan::create([
            'nama_pelanggan' => $validated['nama_pelanggan'],
            'no_telp' => $validated['no_telp'] ?? null,
            'total_hutang' => 0,
        ]);

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => 'Pelanggan berhasil ditambahkan.',
            'pelanggan' => $pelanggan,
        ]);
    }
}
