<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware('auth')->group(function () {
    // Dashboard
    Route::middleware('menu.access:dashboard')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    });

    // POS Kasir
    Route::middleware('menu.access:kasir')->group(function () {
        Route::get('/kasir', [App\Http\Controllers\PosController::class, 'index'])->name('kasir.index');
        Route::post('/kasir/checkout', [App\Http\Controllers\PosController::class, 'checkout'])->name('kasir.checkout');
        Route::post('/kasir/quick-pelanggan', [App\Http\Controllers\PosController::class, 'quickPelanggan'])->name('kasir.quick-pelanggan');
    });

    // Riwayat Transaksi & Pelunasan
    Route::middleware('menu.access:transaksi')->group(function () {
        Route::get('/transaksi', [App\Http\Controllers\TransaksiController::class, 'index'])->name('transaksi.index');
        Route::get('/transaksi/export', [App\Http\Controllers\TransaksiController::class, 'exportExcel'])->name('transaksi.export');
        Route::post('/transaksi/{id}/lunaskan', [App\Http\Controllers\TransaksiController::class, 'lunaskan'])->name('transaksi.lunaskan');
        Route::delete('/transaksi/{id}', [App\Http\Controllers\TransaksiController::class, 'destroy'])->name('transaksi.destroy');
    });

    // Data Master: Barang
    Route::middleware('menu.access:barang')->group(function () {
        Route::get('/barang/export', [App\Http\Controllers\BarangController::class, 'export'])->name('barang.export');
        Route::get('/barang/template', [App\Http\Controllers\BarangController::class, 'template'])->name('barang.template');
        Route::post('/barang/import', [App\Http\Controllers\BarangController::class, 'import'])->name('barang.import');
        Route::resource('barang', App\Http\Controllers\BarangController::class)->except(['create', 'show', 'edit']);
    });

    // Data Master: Pelanggan & Hutang
    Route::middleware('menu.access:pelanggan')->group(function () {
        Route::resource('pelanggan', App\Http\Controllers\PelangganController::class)->except(['create', 'show', 'edit']);
    });

    // Stok Masuk
    Route::middleware('menu.access:stok-masuk')->group(function () {
        Route::get('/stok-masuk', [App\Http\Controllers\StokMasukController::class, 'index'])->name('stok-masuk.index');
        Route::post('/stok-masuk', [App\Http\Controllers\StokMasukController::class, 'store'])->name('stok-masuk.store');
        Route::delete('/stok-masuk/{id}', [App\Http\Controllers\StokMasukController::class, 'destroy'])->name('stok-masuk.destroy');
    });

    // Manajemen Pengguna & Hak Akses
    Route::middleware('menu.access:pengguna')->group(function () {
        Route::get('/pengguna', [App\Http\Controllers\PenggunaController::class, 'index'])->name('pengguna.index');
        Route::post('/pengguna', [App\Http\Controllers\PenggunaController::class, 'store'])->name('pengguna.store');
        Route::put('/pengguna/{id}', [App\Http\Controllers\PenggunaController::class, 'update'])->name('pengguna.update');
        Route::put('/pengguna/{id}/menu-access', [App\Http\Controllers\PenggunaController::class, 'updateMenuAccess'])->name('pengguna.menu-access');
        Route::delete('/pengguna/{id}', [App\Http\Controllers\PenggunaController::class, 'destroy'])->name('pengguna.destroy');
    });

    // Modul Laporan (Active Report)
    Route::middleware('menu.access:laporan')->group(function () {
        Route::get('/laporan', [App\Http\Controllers\LaporanController::class, 'index'])->name('laporan.index');
        Route::get('/laporan/export-excel', [App\Http\Controllers\LaporanController::class, 'exportExcel'])->name('laporan.export-excel');
        Route::get('/laporan/export-csv', [App\Http\Controllers\LaporanController::class, 'exportCsv'])->name('laporan.export-csv');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
