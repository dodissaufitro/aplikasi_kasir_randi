<?php

namespace App\Http\Controllers;

use App\Models\Pelanggan;
use App\Models\PembayaranHutang;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class PelangganController extends Controller
{
    public function index()
    {
        $hasPembayaranTable = Schema::hasTable('pembayaran_hutang');

        $query = Pelanggan::query()->with([
            'transaksiBelumLunas:id_transaksi,id_pelanggan,tanggal,total_belanja,jenis_pembayaran'
        ]);

        if ($hasPembayaranTable) {
            $query->with(['pembayaranHutang' => function ($q) {
                $q->with('user:id,nama_lengkap,role')->orderBy('tanggal_bayar', 'desc');
            }]);
        }

        $pelanggan = $query->orderBy('id_pelanggan', 'desc')->get();

        $stats = [
            'total_pelanggan' => $pelanggan->count(),
            'pelanggan_hutang' => $pelanggan->where('total_hutang', '>', 0)->count(),
            'total_piutang' => (float) $pelanggan->sum('total_hutang'),
        ];

        return Inertia::render('Pelanggan/Index', [
            'pelanggan' => $pelanggan,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_pelanggan' => 'required|string|max:255',
            'no_telp' => 'nullable|string|max:20',
            'total_hutang' => 'nullable|numeric|min:0',
        ]);

        Pelanggan::create($validated);

        return redirect()->back()->with('success', 'Pelanggan berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $pelanggan = Pelanggan::findOrFail($id);

        $validated = $request->validate([
            'nama_pelanggan' => 'required|string|max:255',
            'no_telp' => 'nullable|string|max:20',
            'total_hutang' => 'nullable|numeric|min:0',
        ]);

        $pelanggan->update($validated);

        return redirect()->back()->with('success', 'Data pelanggan berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $pelanggan = Pelanggan::findOrFail($id);
        $pelanggan->delete();

        return redirect()->back()->with('success', 'Pelanggan berhasil dihapus.');
    }

    public function bayarHutang(Request $request, $id)
    {
        $pelanggan = Pelanggan::findOrFail($id);

        $request->validate([
            'nominal_bayar' => 'required|numeric|min:1',
            'metode_pembayaran' => 'required|string|in:tunai,transfer,qris',
            'catatan' => 'nullable|string|max:500',
        ], [
            'nominal_bayar.required' => 'Nominal pembayaran wajib diisi.',
            'nominal_bayar.min' => 'Nominal pembayaran minimal Rp 1.',
            'metode_pembayaran.required' => 'Metode pembayaran wajib dipilih.',
        ]);

        $nominalBayar = (float) $request->nominal_bayar;

        if ($pelanggan->total_hutang <= 0) {
            return redirect()->back()->withErrors(['error' => 'Pelanggan ini tidak memiliki hutang.']);
        }

        if ($nominalBayar > $pelanggan->total_hutang) {
            return redirect()->back()->withErrors(['error' => 'Nominal pembayaran melebihi total hutang (Maksimal Rp ' . number_format($pelanggan->total_hutang, 0, ',', '.') . ').']);
        }

        try {
            DB::beginTransaction();

            $sisaHutangBaru = max(0, $pelanggan->total_hutang - $nominalBayar);
            $pelanggan->total_hutang = $sisaHutangBaru;
            $pelanggan->save();

            // Simpan riwayat pembayaran hutang jika tabel tersedia
            if (Schema::hasTable('pembayaran_hutang')) {
                PembayaranHutang::create([
                    'id_pelanggan' => $pelanggan->id_pelanggan,
                    'tanggal_bayar' => now(),
                    'nominal_bayar' => $nominalBayar,
                    'sisa_hutang_setelahnya' => $sisaHutangBaru,
                    'metode_pembayaran' => $request->metode_pembayaran,
                    'catatan' => $request->catatan,
                    'id_user' => auth()->id(),
                ]);
            }

            // Alokasikan status lunas pada transaksi
            if ($sisaHutangBaru == 0) {
                Transaksi::where('id_pelanggan', $pelanggan->id_pelanggan)
                    ->where('status_pembayaran', 'belum_lunas')
                    ->where('status_transaksi', 'selesai')
                    ->update(['status_pembayaran' => 'lunas']);
            } else {
                // Alokasikan pembayaran secara bertahap pada transaksi lama (FIFO)
                $sisaAlokasi = $nominalBayar;
                $transaksiHutang = Transaksi::where('id_pelanggan', $pelanggan->id_pelanggan)
                    ->where('status_pembayaran', 'belum_lunas')
                    ->where('status_transaksi', 'selesai')
                    ->orderBy('tanggal', 'asc')
                    ->orderBy('id_transaksi', 'asc')
                    ->get();

                foreach ($transaksiHutang as $trx) {
                    if ($sisaAlokasi >= (float) $trx->total_belanja) {
                        $trx->status_pembayaran = 'lunas';
                        $trx->save();
                        $sisaAlokasi -= (float) $trx->total_belanja;
                    } else {
                        break;
                    }
                }
            }

            DB::commit();

            $statusKet = $sisaHutangBaru == 0 
                ? 'Hutang sekarang telah LUNAS!' 
                : 'Sisa hutang berjalan: Rp ' . number_format($sisaHutangBaru, 0, ',', '.');

            return redirect()->back()->with('success', "Pembayaran hutang sebesar Rp " . number_format($nominalBayar, 0, ',', '.') . " berhasil dicatat. {$statusKet}");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal memproses pembayaran hutang: ' . $e->getMessage()]);
        }
    }
}
