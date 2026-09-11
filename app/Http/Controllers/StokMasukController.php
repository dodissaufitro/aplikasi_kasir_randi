<?php

namespace App\Http\Controllers;

use App\Models\StokMasuk;
use App\Models\Barang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StokMasukController extends Controller
{
    public function index()
    {
        $stokMasuk = StokMasuk::with('barang')
            ->orderBy('id_stok_masuk', 'desc')
            ->get();

        $barang = Barang::with('satuanKonversi')->orderBy('nama_barang', 'asc')->get();

        return Inertia::render('StokMasuk/Index', [
            'stok_masuk' => $stokMasuk,
            'barang' => $barang
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_barang' => 'required|exists:barang,id_barang',
            'jumlah' => 'required|integer|min:1',
            'satuan' => 'nullable|string|max:50',
            'rasio_konversi' => 'nullable|integer|min:1',
            'tanggal_masuk' => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();

            $barang = Barang::findOrFail($validated['id_barang']);
            $rasio = isset($validated['rasio_konversi']) && (int)$validated['rasio_konversi'] > 0 
                ? (int)$validated['rasio_konversi'] 
                : 1;

            $satuan = !empty($validated['satuan']) ? $validated['satuan'] : ($barang->satuan ?: 'PCS');
            $jumlahTambahanStok = (int)$validated['jumlah'] * $rasio;

            $masuk = StokMasuk::create([
                'id_barang' => $barang->id_barang,
                'jumlah' => $validated['jumlah'],
                'satuan' => $satuan,
                'rasio_konversi' => $rasio,
                'tanggal_masuk' => $validated['tanggal_masuk'] ?? now(),
            ]);

            // Tambahkan ke stok dasar barang
            $barang->stok += $jumlahTambahanStok;
            $barang->save();

            DB::commit();

            $satuanDasar = $barang->satuan ?: 'PCS';
            $msgDetail = $rasio > 1 
                ? "{$validated['jumlah']} {$satuan} (setara {$jumlahTambahanStok} {$satuanDasar})" 
                : "{$validated['jumlah']} {$satuanDasar}";

            return redirect()->back()->with('success', "Stok barang '{$barang->nama_barang}' berhasil ditambah sebanyak {$msgDetail}.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal menambah stok: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $stokMasuk = StokMasuk::findOrFail($id);
            $barang = Barang::find($stokMasuk->id_barang);
            if ($barang) {
                $rasio = $stokMasuk->rasio_konversi ?: 1;
                $jumlahKurang = $stokMasuk->jumlah * $rasio;
                $barang->stok = max(0, $barang->stok - $jumlahKurang);
                $barang->save();
            }

            $stokMasuk->delete();

            DB::commit();

            return redirect()->back()->with('success', 'Data stok masuk berhasil dihapus dan inventaris disesuaikan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal menghapus stok masuk: ' . $e->getMessage()]);
        }
    }
}
