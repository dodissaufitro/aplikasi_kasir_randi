<?php

namespace App\Http\Controllers;

use App\Models\Pelanggan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PelangganController extends Controller
{
    public function index()
    {
        $pelanggan = Pelanggan::orderBy('id_pelanggan', 'desc')->get();
        return Inertia::render('Pelanggan/Index', [
            'pelanggan' => $pelanggan
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
}
