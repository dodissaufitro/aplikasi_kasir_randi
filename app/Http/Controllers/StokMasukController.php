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

        $barang = Barang::orderBy('nama_barang', 'asc')->get();

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
            'tanggal_masuk' => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();

            $masuk = StokMasuk::create([
                'id_barang' => $validated['id_barang'],
                'jumlah' => $validated['jumlah'],
                'tanggal_masuk' => $validated['tanggal_masuk'] ?? now(),
            ]);

            // Tambahkan ke stok barang
            $barang = Barang::findOrFail($validated['id_barang']);
            $barang->stok += $validated['jumlah'];
            $barang->save();

            DB::commit();

            return redirect()->back()->with('success', "Stok barang '{$barang->nama_barang}' berhasil ditambah sebanyak {$validated['jumlah']}.");
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
                $barang->stok = max(0, $barang->stok - $stokMasuk->jumlah);
                $barang->save();
            }

            $stokMasuk->delete();

            DB::commit();

            return redirect()->back()->with('success', 'Riwayat stok masuk berhasil dibatalkan/dihapus.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal menghapus stok masuk: ' . $e->getMessage()]);
        }
    }
}
