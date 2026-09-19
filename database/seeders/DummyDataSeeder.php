<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Bersihkan data lama jika ada
        DB::table('detail_transaksi')->delete();
        DB::table('transaksi')->delete();
        DB::table('stok_masuk')->delete();
        DB::table('pelanggan')->delete();
        DB::table('barang_satuan_konversi')->delete();
        DB::table('barang')->delete();

        // 2. Data Barang sesuai poster Mockup KasirPro
        $barangData = [
            [
                'id_barang' => 1,
                'kode_barang' => 'BRG-001',
                'barcode' => '8992750200012',
                'nama_barang' => 'Aqua 600ml',
                'kategori' => 'Minuman',
                'merk' => 'Danone Aqua',
                'supplier' => 'PT Sumber Air',
                'satuan' => 'Botol',
                'harga_beli' => 3200,
                'harga_jual' => 5000,
                'harga_grosir' => 4500,
                'stok' => 50,
                'stok_minimum' => 10,
                'lokasi_rak' => 'Rak A-1',
                'is_aktif' => true,
            ],
            [
                'id_barang' => 2,
                'kode_barang' => 'BRG-002',
                'barcode' => '8996862000127',
                'nama_barang' => 'Indomie Goreng',
                'kategori' => 'Makanan',
                'merk' => 'Indofood',
                'supplier' => 'PT Indomarco',
                'satuan' => 'PCS',
                'harga_beli' => 2800,
                'harga_jual' => 3500,
                'harga_grosir' => 3200,
                'stok' => 120,
                'stok_minimum' => 20,
                'lokasi_rak' => 'Rak B-2',
                'is_aktif' => true,
            ],
            [
                'id_barang' => 3,
                'kode_barang' => 'BRG-003',
                'barcode' => '8998866200091',
                'nama_barang' => 'Mie Sedaap',
                'kategori' => 'Makanan',
                'merk' => 'Wings Food',
                'supplier' => 'PT Sayap Mas',
                'satuan' => 'PCS',
                'harga_beli' => 2400,
                'harga_jual' => 3000,
                'harga_grosir' => 2800,
                'stok' => 80,
                'stok_minimum' => 15,
                'lokasi_rak' => 'Rak B-3',
                'is_aktif' => true,
            ],
            [
                'id_barang' => 4,
                'kode_barang' => 'BRG-004',
                'barcode' => '8992763402017',
                'nama_barang' => 'Coca Cola 330ml',
                'kategori' => 'Minuman',
                'merk' => 'Coca-Cola',
                'supplier' => 'CCEP Indonesia',
                'satuan' => 'Kaleng',
                'harga_beli' => 5500,
                'harga_jual' => 7000,
                'harga_grosir' => 6500,
                'stok' => 40,
                'stok_minimum' => 10,
                'lokasi_rak' => 'Kulkas 1',
                'is_aktif' => true,
            ],
            [
                'id_barang' => 5,
                'kode_barang' => 'BRG-005',
                'barcode' => '8992781000150',
                'nama_barang' => 'Teh Pucuk 350ml',
                'kategori' => 'Minuman',
                'merk' => 'Mayora',
                'supplier' => 'PT Mayora Indah',
                'satuan' => 'Botol',
                'harga_beli' => 3800,
                'harga_jual' => 5000,
                'harga_grosir' => 4500,
                'stok' => 60,
                'stok_minimum' => 12,
                'lokasi_rak' => 'Kulkas 2',
                'is_aktif' => true,
            ],
            [
                'id_barang' => 6,
                'kode_barang' => 'BRG-006',
                'barcode' => '8991234567890',
                'nama_barang' => 'Taro Net 65gr',
                'kategori' => 'Makanan',
                'merk' => 'Taro',
                'supplier' => 'PT Tiga Pilar',
                'satuan' => 'Pack',
                'harga_beli' => 3500,
                'harga_jual' => 4500,
                'harga_grosir' => 4000,
                'stok' => 35,
                'stok_minimum' => 10,
                'lokasi_rak' => 'Rak C-1',
                'is_aktif' => true,
            ]
        ];
        DB::table('barang')->insert($barangData);

        // Satuan konversi
        DB::table('barang_satuan_konversi')->insert([
            [
                'id_barang' => 1,
                'nama_satuan' => 'Dus',
                'rasio_konversi' => 24,
                'harga_jual_satuan' => 108000,
                'barcode_satuan' => '8992750200012-DUS'
            ],
            [
                'id_barang' => 2,
                'nama_satuan' => 'Dus',
                'rasio_konversi' => 40,
                'harga_jual_satuan' => 128000,
                'barcode_satuan' => '8996862000127-DUS'
            ]
        ]);

        // 3. Pelanggan & Hutang sesuai poster Mockup KasirPro
        $pelangganData = [
            [
                'id_pelanggan' => 1,
                'nama_pelanggan' => 'Budi Santoso',
                'no_telp' => '0812 3456 7890',
                'total_hutang' => 150000,
            ],
            [
                'id_pelanggan' => 2,
                'nama_pelanggan' => 'Sari Dewi',
                'no_telp' => '0813 6789 0123',
                'total_hutang' => 0,
            ],
            [
                'id_pelanggan' => 3,
                'nama_pelanggan' => 'Rudi Hartono',
                'no_telp' => '0821 1234 5678',
                'total_hutang' => 75000,
            ],
            [
                'id_pelanggan' => 4,
                'nama_pelanggan' => 'Andi Wijaya',
                'no_telp' => '0812 9876 5432',
                'total_hutang' => 0,
            ],
            [
                'id_pelanggan' => 5,
                'nama_pelanggan' => 'Maya Sari',
                'no_telp' => '0813 1111 2222',
                'total_hutang' => 220000,
            ],
        ];
        DB::table('pelanggan')->insert($pelangganData);

        // 4. Riwayat Stok Masuk
        $today = Carbon::now();
        DB::table('stok_masuk')->insert([
            [
                'id_barang' => 1,
                'tanggal_masuk' => $today->copy()->subDays(2)->format('Y-m-d H:i:s'),
                'jumlah' => 48,
                'satuan' => 'Botol',
                'rasio_konversi' => 1,
            ],
            [
                'id_barang' => 2,
                'tanggal_masuk' => $today->copy()->subDay()->format('Y-m-d H:i:s'),
                'jumlah' => 80,
                'satuan' => 'PCS',
                'rasio_konversi' => 1,
            ],
            [
                'id_barang' => 4,
                'tanggal_masuk' => $today->format('Y-m-d H:i:s'),
                'jumlah' => 24,
                'satuan' => 'Kaleng',
                'rasio_konversi' => 1,
            ]
        ]);

        // 5. Transaksi Dummy sesuai yang ada di poster (TRX-20260918-001, dll)
        $tglFormat = $today->format('Y-m-d');
        $transaksiData = [
            [
                'id_transaksi' => 1,
                'tanggal' => $tglFormat . ' 10:24:00',
                'jenis_pembayaran' => 'tunai',
                'id_pelanggan' => 1,
                'total_belanja' => 125000,
                'status_pembayaran' => 'lunas',
                'status_transaksi' => 'selesai',
            ],
            [
                'id_transaksi' => 2,
                'tanggal' => $tglFormat . ' 09:18:00',
                'jenis_pembayaran' => 'tunai', // QRIS dicatat sebagai tunai/lunas
                'id_pelanggan' => 2,
                'total_belanja' => 86500,
                'status_pembayaran' => 'lunas',
                'status_transaksi' => 'selesai',
            ],
            [
                'id_transaksi' => 3,
                'tanggal' => $tglFormat . ' 08:51:00',
                'jenis_pembayaran' => 'tunai',
                'id_pelanggan' => 4,
                'total_belanja' => 42000,
                'status_pembayaran' => 'lunas',
                'status_transaksi' => 'selesai',
            ],
            [
                'id_transaksi' => 4,
                'tanggal' => $today->copy()->subDay()->format('Y-m-d') . ' 16:20:00',
                'jenis_pembayaran' => 'tunai',
                'id_pelanggan' => 3,
                'total_belanja' => 210000,
                'status_pembayaran' => 'lunas',
                'status_transaksi' => 'selesai',
            ],
            [
                'id_transaksi' => 5,
                'tanggal' => $today->copy()->subDay()->format('Y-m-d') . ' 14:10:00',
                'jenis_pembayaran' => 'tunai',
                'id_pelanggan' => null,
                'total_belanja' => 56000,
                'status_pembayaran' => 'lunas',
                'status_transaksi' => 'selesai',
            ],
            [
                'id_transaksi' => 6,
                'tanggal' => $today->copy()->subDay()->format('Y-m-d') . ' 11:32:00',
                'jenis_pembayaran' => 'tunai',
                'id_pelanggan' => 5,
                'total_belanja' => 78500,
                'status_pembayaran' => 'lunas',
                'status_transaksi' => 'selesai',
            ],
        ];
        DB::table('transaksi')->insert($transaksiData);

        // Detail transaksi dummy
        DB::table('detail_transaksi')->insert([
            ['id_transaksi' => 1, 'id_barang' => 1, 'jumlah' => 5, 'satuan' => 'Botol', 'rasio_konversi' => 1, 'harga_satuan' => 5000, 'subtotal' => 25000],
            ['id_transaksi' => 1, 'id_barang' => 2, 'jumlah' => 20, 'satuan' => 'PCS', 'rasio_konversi' => 1, 'harga_satuan' => 3500, 'subtotal' => 70000],
            ['id_transaksi' => 1, 'id_barang' => 4, 'jumlah' => 4, 'satuan' => 'Kaleng', 'rasio_konversi' => 1, 'harga_satuan' => 7000, 'subtotal' => 28000],

            ['id_transaksi' => 2, 'id_barang' => 5, 'jumlah' => 10, 'satuan' => 'Botol', 'rasio_konversi' => 1, 'harga_satuan' => 5000, 'subtotal' => 50000],
            ['id_transaksi' => 2, 'id_barang' => 6, 'jumlah' => 8, 'satuan' => 'Pack', 'rasio_konversi' => 1, 'harga_satuan' => 4500, 'subtotal' => 36000],

            ['id_transaksi' => 3, 'id_barang' => 1, 'jumlah' => 4, 'satuan' => 'Botol', 'rasio_konversi' => 1, 'harga_satuan' => 5000, 'subtotal' => 20000],
            ['id_transaksi' => 3, 'id_barang' => 3, 'jumlah' => 7, 'satuan' => 'PCS', 'rasio_konversi' => 1, 'harga_satuan' => 3000, 'subtotal' => 21000],
        ]);
    }
}
