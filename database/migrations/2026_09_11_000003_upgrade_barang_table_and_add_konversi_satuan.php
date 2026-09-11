<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Tambah kolom atribut master barang lengkap
        Schema::table('barang', function (Blueprint $table) {
            $table->string('barcode', 100)->nullable()->after('kode_barang');
            $table->string('foto_produk', 255)->nullable()->after('barcode');
            $table->string('kategori', 100)->nullable()->default('Umum')->after('nama_barang');
            $table->string('merk', 100)->nullable()->after('kategori');
            $table->string('supplier', 150)->nullable()->after('merk');
            $table->string('satuan', 50)->default('PCS')->after('supplier');
            $table->decimal('harga_grosir', 15, 2)->nullable()->after('harga_jual');
            $table->integer('stok_minimum')->default(5)->after('stok');
            $table->string('lokasi_rak', 100)->nullable()->after('stok_minimum');
            $table->boolean('is_aktif')->default(true)->after('lokasi_rak');
        });

        // 2. Buat tabel konversi multi-satuan produk
        Schema::create('barang_satuan_konversi', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_barang');
            $table->string('nama_satuan', 50); // Dus, Box, Lusin, Pack, Sak, dll.
            $table->unsignedInteger('rasio_konversi'); // Misal: 24 (1 Dus = 24 PCS)
            $table->decimal('harga_jual_satuan', 15, 2)->nullable(); // Harga khusus satuan ini
            $table->string('barcode_satuan', 100)->nullable(); // Barcode khusus kemasan satuan ini
            
            $table->foreign('id_barang')->references('id_barang')->on('barang')->onDelete('cascade');
        });

        // 3. Tambah info satuan di detail_transaksi
        Schema::table('detail_transaksi', function (Blueprint $table) {
            $table->string('satuan', 50)->default('PCS')->after('jumlah');
            $table->integer('rasio_konversi')->default(1)->after('satuan');
        });

        // 4. Tambah info satuan di stok_masuk
        Schema::table('stok_masuk', function (Blueprint $table) {
            $table->string('satuan', 50)->default('PCS')->after('jumlah');
            $table->integer('rasio_konversi')->default(1)->after('satuan');
        });
    }

    public function down()
    {
        Schema::table('stok_masuk', function (Blueprint $table) {
            $table->dropColumn(['satuan', 'rasio_konversi']);
        });

        Schema::table('detail_transaksi', function (Blueprint $table) {
            $table->dropColumn(['satuan', 'rasio_konversi']);
        });

        Schema::dropIfExists('barang_satuan_konversi');

        Schema::table('barang', function (Blueprint $table) {
            $table->dropColumn([
                'barcode',
                'foto_produk',
                'kategori',
                'merk',
                'supplier',
                'satuan',
                'harga_grosir',
                'stok_minimum',
                'lokasi_rak',
                'is_aktif',
            ]);
        });
    }
};
