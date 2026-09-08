<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class PenggunaController extends Controller
{
    private function getAvailableMenus(): array
    {
        return [
            [
                'key' => 'dashboard',
                'label' => 'Dashboard',
                'description' => 'Ringkasan statistik penjualan harian, omset, dan grafik performa toko.',
                'icon' => 'LayoutDashboard',
                'group' => 'Utama',
            ],
            [
                'key' => 'kasir',
                'label' => 'Mesin Kasir (POS)',
                'description' => 'Input transaksi kasir langsung, scan barcode, dan cetak struk belanja.',
                'icon' => 'ShoppingCart',
                'group' => 'Transaksi',
            ],
            [
                'key' => 'transaksi',
                'label' => 'Riwayat Transaksi',
                'description' => 'Daftar semua nota penjualan dan aksi pelunasan hutang kasir.',
                'icon' => 'Receipt',
                'group' => 'Transaksi',
            ],
            [
                'key' => 'barang',
                'label' => 'Data Barang',
                'description' => 'Katalog produk toko, harga beli, harga jual, dan sisa stok barang.',
                'icon' => 'Package',
                'group' => 'Master Data',
            ],
            [
                'key' => 'stok-masuk',
                'label' => 'Stok Masuk',
                'description' => 'Pencatatan pasokan barang masuk dari supplier dan mutasi stok.',
                'icon' => 'Boxes',
                'group' => 'Master Data',
            ],
            [
                'key' => 'pelanggan',
                'label' => 'Pelanggan & Hutang',
                'description' => 'Buku daftar pelanggan serta monitoring sisa piutang/hutang.',
                'icon' => 'Users',
                'group' => 'Master Data',
            ],
            [
                'key' => 'pengguna',
                'label' => 'Kelola Pengguna',
                'description' => 'Manajemen staf login serta pengaturan role dan izin hak akses menu.',
                'icon' => 'ShieldCheck',
                'group' => 'Sistem',
            ],
        ];
    }

    public function index()
    {
        $users = User::orderBy('id', 'asc')->get();

        return Inertia::render('Pengguna/Index', [
            'users' => $users,
            'availableMenus' => $this->getAvailableMenus(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:users,username',
            'nama_lengkap' => 'required|string|max:100',
            'role' => 'required|in:superadmin,admin,kasir',
            'password' => 'required|string|min:4',
            'menu_access' => 'nullable|array',
            'menu_access.*' => 'string|in:dashboard,kasir,transaksi,barang,stok-masuk,pelanggan,pengguna',
        ]);

        $menuAccess = $validated['menu_access'] ?? null;
        if ($validated['role'] === 'superadmin') {
            $menuAccess = User::ALL_MENUS;
        } elseif ($menuAccess === null) {
            $menuAccess = User::getDefaultMenuAccessForRole($validated['role']);
        }

        User::create([
            'username' => $validated['username'],
            'nama_lengkap' => $validated['nama_lengkap'],
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'menu_access' => $menuAccess,
        ]);

        return redirect()->back()->with('success', 'Pengguna baru beserta hak aksesnya berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:users,username,' . $id,
            'nama_lengkap' => 'required|string|max:100',
            'role' => 'required|in:superadmin,admin,kasir',
            'password' => 'nullable|string|min:4',
            'menu_access' => 'nullable|array',
            'menu_access.*' => 'string|in:dashboard,kasir,transaksi,barang,stok-masuk,pelanggan,pengguna',
        ]);

        $data = [
            'username' => $validated['username'],
            'nama_lengkap' => $validated['nama_lengkap'],
            'role' => $validated['role'],
        ];

        if (array_key_exists('menu_access', $validated)) {
            if ($validated['role'] === 'superadmin') {
                $data['menu_access'] = User::ALL_MENUS;
            } else {
                $data['menu_access'] = $validated['menu_access'];
            }
        }

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return redirect()->back()->with('success', 'Data pengguna berhasil diperbarui.');
    }

    public function updateMenuAccess(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'menu_access' => 'required|array',
            'menu_access.*' => 'string|in:dashboard,kasir,transaksi,barang,stok-masuk,pelanggan,pengguna',
        ]);

        // If user being modified is currently authenticated user and is superadmin, don't allow revoking pengguna or dashboard
        if ($request->user()->id == $user->id && $user->role === 'superadmin') {
            if (!in_array('pengguna', $validated['menu_access']) || !in_array('dashboard', $validated['menu_access'])) {
                return redirect()->back()->withErrors([
                    'menu_access' => 'Anda tidak boleh menghapus akses Kelola Pengguna atau Dashboard dari akun Anda sendiri.'
                ]);
            }
        }

        $user->menu_access = $validated['menu_access'];
        $user->save();

        return redirect()->back()->with('success', "Hak akses menu untuk pengguna '{$user->nama_lengkap}' berhasil diperbarui.");
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->id == $id) {
            return redirect()->back()->withErrors(['error' => 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.']);
        }

        $user = User::findOrFail($id);
        $user->delete();

        return redirect()->back()->with('success', 'Pengguna berhasil dihapus.');
    }
}
