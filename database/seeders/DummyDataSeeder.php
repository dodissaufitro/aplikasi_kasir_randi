<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('barang')->insert([
            [
                'nama_barang' => 'Minyak Goreng Bimoli 2L',
                'harga_beli' => 30000,
                'harga_jual' => 35000,
                'stok' => 50
            ],
            [
                'nama_barang' => 'Beras Pandan Wangi 5kg',
                'harga_beli' => 60000,
                'harga_jual' => 68000,
                'stok' => 20
            ],
            [
                'nama_barang' => 'Indomie Goreng (Kardus)',
                'harga_beli' => 105000,
                'harga_jual' => 115000,
                'stok' => 15
            ]
        ]);

        DB::table('pelanggan')->insert([
            [
                'nama_pelanggan' => 'Budi Santoso',
                'no_telp' => '081234567890',
            ],
            [
                'nama_pelanggan' => 'Siti Aminah',
                'no_telp' => '089876543210',
            ]
        ]);
    }
}
