<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\DetailTransaksi;
use App\Models\Pelanggan;
use App\Models\StokMasuk;
use App\Models\Transaksi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanController extends Controller
{
    /**
     * Helper to resolve start & end date from request
     */
    private function resolveDateRange(Request $request): array
    {
        $periode = $request->input('periode', 'bulanan');
        $now = Carbon::now();

        switch ($periode) {
            case 'harian':
                if ($request->filled('tanggal_mulai')) {
                    $startDate = Carbon::parse($request->tanggal_mulai)->startOfDay();
                } else {
                    $startDate = Carbon::today()->startOfDay();
                }
                $endDate = $startDate->copy()->endOfDay();
                break;

            case 'mingguan':
                $startDate = $now->copy()->subDays(6)->startOfDay();
                $endDate = $now->copy()->endOfDay();
                break;

            case 'bulanan':
                if ($request->filled('bulan') && $request->filled('tahun')) {
                    $startDate = Carbon::createFromDate($request->tahun, $request->bulan, 1)->startOfMonth();
                    $endDate = $startDate->copy()->endOfMonth();
                } else {
                    $startDate = $now->copy()->startOfMonth();
                    $endDate = $now->copy()->endOfMonth();
                }
                break;

            case 'tahunan':
                if ($request->filled('tahun')) {
                    $startDate = Carbon::createFromDate($request->tahun, 1, 1)->startOfYear();
                    $endDate = $startDate->copy()->endOfYear();
                } else {
                    $startDate = $now->copy()->startOfYear();
                    $endDate = $now->copy()->endOfYear();
                }
                break;

            case 'custom':
            default:
                if ($request->filled('tanggal_mulai') && $request->filled('tanggal_selesai')) {
                    $startDate = Carbon::parse($request->tanggal_mulai)->startOfDay();
                    $endDate = Carbon::parse($request->tanggal_selesai)->endOfDay();
                } elseif ($request->filled('tanggal_mulai')) {
                    $startDate = Carbon::parse($request->tanggal_mulai)->startOfDay();
                    $endDate = $now->copy()->endOfDay();
                } else {
                    $startDate = $now->copy()->startOfMonth();
                    $endDate = $now->copy()->endOfMonth();
                    $periode = 'bulanan';
                }
                break;
        }

        return [
            'periode' => $periode,
            'start' => $startDate,
            'end' => $endDate,
            'start_str' => $startDate->format('Y-m-d'),
            'end_str' => $endDate->format('Y-m-d'),
        ];
    }

    /**
     * Main Active Report Dashboard
     */
    public function index(Request $request)
    {
        $tab = $request->input('tab', 'penjualan');
        $dates = $this->resolveDateRange($request);
        $startDate = $dates['start'];
        $endDate = $dates['end'];

        $data = [
            'tab' => $tab,
            'periode' => $dates['periode'],
            'tanggal_mulai' => $dates['start_str'],
            'tanggal_selesai' => $dates['end_str'],
            'sub_filter' => $request->input('sub_filter', 'all'),
        ];

        // Laporan Penjualan
        if ($tab === 'penjualan') {
            $data['laporan_penjualan'] = $this->getLaporanPenjualan($startDate, $endDate);
        }
        // Laporan Transaksi
        elseif ($tab === 'transaksi') {
            $subFilter = $request->input('sub_filter', 'all');
            $data['laporan_transaksi'] = $this->getLaporanTransaksi($startDate, $endDate, $subFilter);
        }
        // Laporan Produk
        elseif ($tab === 'produk') {
            $subFilter = $request->input('sub_filter', 'all');
            $data['laporan_produk'] = $this->getLaporanProduk($startDate, $endDate, $subFilter);
        }
        // Laporan Keuangan
        elseif ($tab === 'keuangan') {
            $data['laporan_keuangan'] = $this->getLaporanKeuangan($startDate, $endDate);
        }

        return Inertia::render('Laporan/Index', $data);
    }

    /**
     * 1. Data Laporan Penjualan
     */
    private function getLaporanPenjualan(Carbon $startDate, Carbon $endDate): array
    {
        $transaksiQuery = Transaksi::whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_transaksi', 'selesai');

        $totalOmzet = (float) $transaksiQuery->sum('total_belanja');
        $totalTransaksi = $transaksiQuery->count();
        $rataRata = $totalTransaksi > 0 ? $totalOmzet / $totalTransaksi : 0;

        // Total item terjual
        $totalItemTerjual = (int) DetailTransaksi::whereHas('transaksi', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('tanggal', [$startDate, $endDate])
              ->where('status_transaksi', 'selesai');
        })->sum('jumlah');

        // Total HPP dan Laba Kotor
        $totalHpp = (float) DetailTransaksi::whereHas('transaksi', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('tanggal', [$startDate, $endDate])
              ->where('status_transaksi', 'selesai');
        })
        ->join('barang', 'detail_transaksi.id_barang', '=', 'barang.id_barang')
        ->sum(DB::raw('detail_transaksi.jumlah * barang.harga_beli'));

        $totalLabaKotor = $totalOmzet - $totalHpp;

        // Breakdown penjualan harian dalam rentang tanggal
        $breakdownHarian = Transaksi::whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_transaksi', 'selesai')
            ->select(
                DB::raw('DATE(tanggal) as tgl'),
                DB::raw('COUNT(id_transaksi) as total_trx'),
                DB::raw('SUM(total_belanja) as total_nominal')
            )
            ->groupBy(DB::raw('DATE(tanggal)'))
            ->orderBy('tgl', 'asc')
            ->get()
            ->map(function ($item) {
                $c = Carbon::parse($item->tgl);
                return [
                    'tanggal' => $item->tgl,
                    'label' => $c->locale('id')->isoFormat('D MMM Y'),
                    'hari' => $c->locale('id')->isoFormat('dddd'),
                    'total_transaksi' => (int) $item->total_trx,
                    'total_omzet' => (float) $item->total_nominal,
                ];
            });

        // Top 5 produk terlaris di periode ini
        $topProduk = DetailTransaksi::whereHas('transaksi', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('tanggal', [$startDate, $endDate])
              ->where('status_transaksi', 'selesai');
        })
        ->join('barang', 'detail_transaksi.id_barang', '=', 'barang.id_barang')
        ->select(
            'barang.id_barang',
            'barang.kode_barang',
            'barang.nama_barang',
            DB::raw('SUM(detail_transaksi.jumlah) as total_qty'),
            DB::raw('SUM(detail_transaksi.subtotal) as total_omzet')
        )
        ->groupBy('barang.id_barang', 'barang.kode_barang', 'barang.nama_barang')
        ->orderByDesc('total_qty')
        ->limit(5)
        ->get();

        // Riwayat transaksi periode ini
        $riwayatTransaksi = Transaksi::with(['pelanggan', 'detailTransaksi.barang'])
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_transaksi', 'selesai')
            ->orderByDesc('id_transaksi')
            ->limit(50)
            ->get();

        return [
            'metrics' => [
                'total_omzet' => $totalOmzet,
                'total_transaksi' => $totalTransaksi,
                'rata_rata_transaksi' => $rataRata,
                'total_item_terjual' => $totalItemTerjual,
                'total_hpp' => $totalHpp,
                'total_laba_kotor' => $totalLabaKotor,
            ],
            'breakdown_harian' => $breakdownHarian,
            'top_produk' => $topProduk,
            'transaksi_terbaru' => $riwayatTransaksi,
        ];
    }

    /**
     * 2. Data Laporan Transaksi (Semua, Lunas, Belum Lunas, Void, Retur)
     */
    private function getLaporanTransaksi(Carbon $startDate, Carbon $endDate, string $subFilter): array
    {
        // Ambil metrik untuk semua status
        $baseQuery = Transaksi::whereBetween('tanggal', [$startDate, $endDate]);

        $semuaCount = (clone $baseQuery)->count();
        $semuaNominal = (float) (clone $baseQuery)->sum('total_belanja');

        $lunasCount = (clone $baseQuery)->where('status_transaksi', 'selesai')->where('status_pembayaran', 'lunas')->count();
        $lunasNominal = (float) (clone $baseQuery)->where('status_transaksi', 'selesai')->where('status_pembayaran', 'lunas')->sum('total_belanja');

        $belumLunasCount = (clone $baseQuery)->where('status_transaksi', 'selesai')->where('status_pembayaran', 'belum_lunas')->count();
        $belumLunasNominal = (float) (clone $baseQuery)->where('status_transaksi', 'selesai')->where('status_pembayaran', 'belum_lunas')->sum('total_belanja');

        $voidCount = (clone $baseQuery)->where('status_transaksi', 'void')->count();
        $voidNominal = (float) (clone $baseQuery)->where('status_transaksi', 'void')->sum('total_belanja');

        $returCount = (clone $baseQuery)->where('status_transaksi', 'retur')->count();
        $returNominal = (float) (clone $baseQuery)->where('status_transaksi', 'retur')->sum('total_belanja');

        // Query tabel sesuai subFilter
        $tableQuery = Transaksi::with(['pelanggan', 'detailTransaksi.barang'])
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->orderByDesc('id_transaksi');

        if ($subFilter === 'lunas') {
            $tableQuery->where('status_transaksi', 'selesai')->where('status_pembayaran', 'lunas');
        } elseif ($subFilter === 'belum_lunas') {
            $tableQuery->where('status_transaksi', 'selesai')->where('status_pembayaran', 'belum_lunas');
        } elseif ($subFilter === 'void') {
            $tableQuery->where('status_transaksi', 'void');
        } elseif ($subFilter === 'retur') {
            $tableQuery->where('status_transaksi', 'retur');
        }

        $transaksiList = $tableQuery->get();

        return [
            'metrics' => [
                'semua' => ['count' => $semuaCount, 'nominal' => $semuaNominal],
                'lunas' => ['count' => $lunasCount, 'nominal' => $lunasNominal],
                'belum_lunas' => ['count' => $belumLunasCount, 'nominal' => $belumLunasNominal],
                'void' => ['count' => $voidCount, 'nominal' => $voidNominal],
                'retur' => ['count' => $returCount, 'nominal' => $returNominal],
            ],
            'daftar_transaksi' => $transaksiList,
        ];
    }

    /**
     * 3. Data Laporan Produk (Terlaris, Paling Sedikit Terjual, Stok Menipis, Stok Habis)
     */
    private function getLaporanProduk(Carbon $startDate, Carbon $endDate, string $subFilter): array
    {
        // Ambil total penjualan per barang di periode ini
        $penjualanPerBarang = DetailTransaksi::whereHas('transaksi', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('tanggal', [$startDate, $endDate])
              ->where('status_transaksi', 'selesai');
        })
        ->select(
            'id_barang',
            DB::raw('SUM(jumlah) as qty_terjual'),
            DB::raw('SUM(subtotal) as omzet_produk')
        )
        ->groupBy('id_barang')
        ->get()
        ->keyBy('id_barang');

        $semuaBarang = Barang::all()->map(function ($barang) use ($penjualanPerBarang) {
            $sold = $penjualanPerBarang->get($barang->id_barang);
            $qtyTerjual = $sold ? (int) $sold->qty_terjual : 0;
            $omzetProduk = $sold ? (float) $sold->omzet_produk : 0;
            $hppTerjual = $qtyTerjual * (float) $barang->harga_beli;
            $estimasiLaba = $omzetProduk - $hppTerjual;

            $statusStok = 'tersedia';
            if ($barang->stok <= 0) {
                $statusStok = 'habis';
            } elseif ($barang->stok <= 5) {
                $statusStok = 'menipis';
            }

            return [
                'id_barang' => $barang->id_barang,
                'kode_barang' => $barang->kode_barang ?? ('BRG-' . str_pad($barang->id_barang, 4, '0', STR_PAD_LEFT)),
                'nama_barang' => $barang->nama_barang,
                'harga_beli' => (float) $barang->harga_beli,
                'harga_jual' => (float) $barang->harga_jual,
                'stok' => (int) $barang->stok,
                'qty_terjual' => $qtyTerjual,
                'omzet_produk' => $omzetProduk,
                'estimasi_laba' => $estimasiLaba,
                'status_stok' => $statusStok,
            ];
        });

        // Metrik
        $totalProduk = $semuaBarang->count();
        $totalTerjual = $semuaBarang->sum('qty_terjual');
        $stokMenipisCount = $semuaBarang->where('status_stok', 'menipis')->count();
        $stokHabisCount = $semuaBarang->where('status_stok', 'habis')->count();

        // Filter sesuai subFilter
        if ($subFilter === 'terlaris') {
            $daftarProduk = $semuaBarang->sortByDesc('qty_terjual')->values();
        } elseif ($subFilter === 'terendah') {
            $daftarProduk = $semuaBarang->sortBy('qty_terjual')->values();
        } elseif ($subFilter === 'menipis') {
            $daftarProduk = $semuaBarang->filter(fn($b) => $b['status_stok'] === 'menipis')->values();
        } elseif ($subFilter === 'habis') {
            $daftarProduk = $semuaBarang->filter(fn($b) => $b['status_stok'] === 'habis')->values();
        } else {
            // Default semua diurutkan qty_terjual desc
            $daftarProduk = $semuaBarang->sortByDesc('qty_terjual')->values();
        }

        return [
            'metrics' => [
                'total_produk' => $totalProduk,
                'total_terjual' => $totalTerjual,
                'stok_menipis' => $stokMenipisCount,
                'stok_habis' => $stokHabisCount,
            ],
            'daftar_produk' => $daftarProduk,
        ];
    }

    /**
     * 4. Data Laporan Keuangan (Kas Masuk, Kas Keluar, Hutang, Piutang, Modal, Laba Kotor, Laba Bersih)
     */
    private function getLaporanKeuangan(Carbon $startDate, Carbon $endDate): array
    {
        // 1. Kas Masuk (Penjualan tunai lunas di periode ini)
        $kasMasuk = (float) Transaksi::whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_transaksi', 'selesai')
            ->where('jenis_pembayaran', 'tunai')
            ->where('status_pembayaran', 'lunas')
            ->sum('total_belanja');

        // Total omzet semua transaksi selesai di periode ini
        $totalOmzet = (float) Transaksi::whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_transaksi', 'selesai')
            ->sum('total_belanja');

        // 2. Kas Keluar (Pembelian stok baru di periode ini)
        $kasKeluar = (float) StokMasuk::whereBetween('tanggal_masuk', [$startDate, $endDate])
            ->join('barang', 'stok_masuk.id_barang', '=', 'barang.id_barang')
            ->sum(DB::raw('stok_masuk.jumlah * barang.harga_beli'));

        // 3. Piutang (Kredit pelanggan belum lunas dalam periode)
        $piutangPeriode = (float) Transaksi::whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_transaksi', 'selesai')
            ->where('status_pembayaran', 'belum_lunas')
            ->sum('total_belanja');

        // Total akumulasi piutang pelanggan saat ini
        $totalPiutangAktif = (float) Pelanggan::sum('total_hutang');

        // 4. Hutang usaha berjalan
        $hutangBerjalan = 0; // Dapat dikembangkan jika ada modul supplier/utang operasional

        // 5. Modal: HPP Terjual & Nilai Aset Stok
        $hppTerjual = (float) DetailTransaksi::whereHas('transaksi', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('tanggal', [$startDate, $endDate])
              ->where('status_transaksi', 'selesai');
        })
        ->join('barang', 'detail_transaksi.id_barang', '=', 'barang.id_barang')
        ->sum(DB::raw('detail_transaksi.jumlah * barang.harga_beli'));

        $nilaiAsetStok = (float) Barang::sum(DB::raw('stok * harga_beli'));

        // 6. Laba Kotor
        $labaKotor = $totalOmzet - $hppTerjual;

        // 7. Laba Bersih (Laba Kotor - Kas Keluar Pengadaan Stok Periode Ini)
        $labaBersih = $labaKotor - $kasKeluar;

        // Arus Kas Harian Gabungan (Kas Masuk & Kas Keluar)
        $arusKasHarian = collect();

        $transaksiHarian = Transaksi::whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_transaksi', 'selesai')
            ->where('jenis_pembayaran', 'tunai')
            ->where('status_pembayaran', 'lunas')
            ->select(
                DB::raw('DATE(tanggal) as tgl'),
                DB::raw('"Penjualan Tunai" as kategori'),
                DB::raw('"masuk" as tipe'),
                DB::raw('SUM(total_belanja) as nominal'),
                DB::raw('COUNT(id_transaksi) as total_catatan')
            )
            ->groupBy(DB::raw('DATE(tanggal)'))
            ->get();

        $stokMasukHarian = StokMasuk::whereBetween('tanggal_masuk', [$startDate, $endDate])
            ->join('barang', 'stok_masuk.id_barang', '=', 'barang.id_barang')
            ->select(
                DB::raw('DATE(tanggal_masuk) as tgl'),
                DB::raw('"Pengadaan Stok Barang" as kategori'),
                DB::raw('"keluar" as tipe'),
                DB::raw('SUM(stok_masuk.jumlah * barang.harga_beli) as nominal'),
                DB::raw('COUNT(id_stok_masuk) as total_catatan')
            )
            ->groupBy(DB::raw('DATE(tanggal_masuk)'))
            ->get();

        $arusKasHarian = $transaksiHarian->concat($stokMasukHarian)->sortByDesc('tgl')->values();

        return [
            'metrics' => [
                'kas_masuk' => $kasMasuk,
                'kas_keluar' => $kasKeluar,
                'total_omzet' => $totalOmzet,
                'piutang_periode' => $piutangPeriode,
                'total_piutang_aktif' => $totalPiutangAktif,
                'hutang' => $hutangBerjalan,
                'hpp_terjual' => $hppTerjual,
                'nilai_aset_stok' => $nilaiAsetStok,
                'laba_kotor' => $labaKotor,
                'laba_bersih' => $labaBersih,
            ],
            'arus_kas_harian' => $arusKasHarian,
        ];
    }

    /**
     * Export Excel (.xlsx) using PhpSpreadsheet
     */
    public function exportExcel(Request $request)
    {
        $tab = $request->input('tab', 'penjualan');
        $dates = $this->resolveDateRange($request);
        $startDate = $dates['start'];
        $endDate = $dates['end'];
        $subFilter = $request->input('sub_filter', 'all');

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $titleTab = ucfirst($tab);
        $sheet->setTitle("Laporan {$titleTab}");

        // Styling KasirPro
        $headerColor = 'FF4F46E5'; // Indigo-600
        $subHeaderBg = 'FFF1F5F9'; // Slate-100

        // Title Block
        $sheet->setCellValue('A1', "LAPORAN " . strtoupper($tab) . " - KASIRPRO");
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FF1E1B4B'));

        $periodeText = "Periode: " . $startDate->format('d/m/Y') . " s/d " . $endDate->format('d/m/Y') . " (" . ucfirst($dates['periode']) . ")";
        $sheet->setCellValue('A2', $periodeText);
        $sheet->getStyle('A2')->getFont()->setSize(11)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FF64748B'));

        $cetakText = "Dicetak pada: " . Carbon::now()->locale('id')->isoFormat('dddd, D MMMM Y HH:mm') . " WIB";
        $sheet->setCellValue('A3', $cetakText);
        $sheet->getStyle('A3')->getFont()->setItalic(true)->setSize(10)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FF94A3B8'));

        $row = 5;

        // Content generation based on tab
        if ($tab === 'penjualan') {
            $data = $this->getLaporanPenjualan($startDate, $endDate);

            // Summary Card Row
            $sheet->setCellValue("A{$row}", "RINGKASAN PENJUALAN");
            $sheet->mergeCells("A{$row}:G{$row}");
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;

            $sheet->setCellValue("A{$row}", "Total Omzet:");
            $sheet->setCellValue("B{$row}", $data['metrics']['total_omzet']);
            $sheet->getStyle("B{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
            $sheet->setCellValue("D{$row}", "Total Transaksi:");
            $sheet->setCellValue("E{$row}", $data['metrics']['total_transaksi'] . " Transaksi");
            $row++;

            $sheet->setCellValue("A{$row}", "HPP Pokok:");
            $sheet->setCellValue("B{$row}", $data['metrics']['total_hpp']);
            $sheet->getStyle("B{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
            $sheet->setCellValue("D{$row}", "Total Laba Kotor:");
            $sheet->setCellValue("E{$row}", $data['metrics']['total_laba_kotor']);
            $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
            $row += 2;

            // Table Header Breakdown
            $headers = ['A' => 'No', 'B' => 'Tanggal', 'C' => 'Hari', 'D' => 'Jumlah Transaksi', 'E' => 'Total Omzet (Rp)'];
            foreach ($headers as $col => $headerText) {
                $sheet->setCellValue("{$col}{$row}", $headerText);
                $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFFFF'));
                $sheet->getStyle("{$col}{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($headerColor);
                $sheet->getStyle("{$col}{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
            $row++;

            $no = 1;
            foreach ($data['breakdown_harian'] as $item) {
                $sheet->setCellValue("A{$row}", $no++);
                $sheet->setCellValue("B{$row}", $item['label']);
                $sheet->setCellValue("C{$row}", $item['hari']);
                $sheet->setCellValue("D{$row}", $item['total_transaksi']);
                $sheet->setCellValue("E{$row}", $item['total_omzet']);
                $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $row++;
            }
        } elseif ($tab === 'transaksi') {
            $data = $this->getLaporanTransaksi($startDate, $endDate, $subFilter);

            $headers = [
                'A' => 'No',
                'B' => 'ID Transaksi',
                'C' => 'Tanggal & Waktu',
                'D' => 'Pelanggan',
                'E' => 'Items Terjual',
                'F' => 'Total Belanja',
                'G' => 'Jenis Bayar',
                'H' => 'Status Bayar',
                'I' => 'Status Transaksi',
                'J' => 'Catatan'
            ];
            foreach ($headers as $col => $headerText) {
                $sheet->setCellValue("{$col}{$row}", $headerText);
                $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFFFF'));
                $sheet->getStyle("{$col}{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($headerColor);
                $sheet->getStyle("{$col}{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
            $row++;

            $no = 1;
            foreach ($data['daftar_transaksi'] as $trx) {
                $itemsText = $trx->detailTransaksi->map(function ($d) {
                    return ($d->barang->nama_barang ?? 'Barang') . " (" . $d->jumlah . "x)";
                })->implode(', ');

                $sheet->setCellValue("A{$row}", $no++);
                $sheet->setCellValue("B{$row}", "#TRX-" . str_pad($trx->id_transaksi, 5, '0', STR_PAD_LEFT));
                $sheet->setCellValue("C{$row}", Carbon::parse($trx->tanggal)->format('d/m/Y H:i'));
                $sheet->setCellValue("D{$row}", $trx->pelanggan->nama_pelanggan ?? 'Pelanggan Umum');
                $sheet->setCellValue("E{$row}", $itemsText);
                $sheet->setCellValue("F{$row}", (float) $trx->total_belanja);
                $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->setCellValue("G{$row}", strtoupper($trx->jenis_pembayaran));
                $sheet->setCellValue("H{$row}", strtoupper(str_replace('_', ' ', $trx->status_pembayaran)));
                $sheet->setCellValue("I{$row}", strtoupper($trx->status_transaksi ?? 'selesai'));
                $sheet->setCellValue("J{$row}", $trx->catatan_batal ?? '-');
                $row++;
            }
        } elseif ($tab === 'produk') {
            $data = $this->getLaporanProduk($startDate, $endDate, $subFilter);

            $headers = [
                'A' => 'No',
                'B' => 'Kode Barang',
                'C' => 'Nama Produk',
                'D' => 'Harga Beli (Rp)',
                'E' => 'Harga Jual (Rp)',
                'F' => 'Sisa Stok',
                'G' => 'Terjual (Qty)',
                'H' => 'Total Omzet (Rp)',
                'I' => 'Estimasi Laba (Rp)',
                'J' => 'Status Stok'
            ];
            foreach ($headers as $col => $headerText) {
                $sheet->setCellValue("{$col}{$row}", $headerText);
                $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFFFF'));
                $sheet->getStyle("{$col}{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($headerColor);
                $sheet->getStyle("{$col}{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
            $row++;

            $no = 1;
            foreach ($data['daftar_produk'] as $prod) {
                $sheet->setCellValue("A{$row}", $no++);
                $sheet->setCellValue("B{$row}", $prod['kode_barang']);
                $sheet->setCellValue("C{$row}", $prod['nama_barang']);
                $sheet->setCellValue("D{$row}", $prod['harga_beli']);
                $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->setCellValue("E{$row}", $prod['harga_jual']);
                $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->setCellValue("F{$row}", $prod['stok']);
                $sheet->setCellValue("G{$row}", $prod['qty_terjual']);
                $sheet->setCellValue("H{$row}", $prod['omzet_produk']);
                $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->setCellValue("I{$row}", $prod['estimasi_laba']);
                $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->setCellValue("J{$row}", strtoupper($prod['status_stok']));
                $row++;
            }
        } elseif ($tab === 'keuangan') {
            $data = $this->getLaporanKeuangan($startDate, $endDate);

            // Ringkasan Finansial Card
            $sheet->setCellValue("A{$row}", "RINGKASAN LAPORAN KEUANGAN");
            $sheet->mergeCells("A{$row}:E{$row}");
            $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(12);
            $row += 2;

            $finMetrics = [
                ['Kas Masuk (Penjualan Tunai Lunas)', $data['metrics']['kas_masuk']],
                ['Kas Keluar (Pengadaan Stok Masuk)', $data['metrics']['kas_keluar']],
                ['Total Omzet Penjualan', $data['metrics']['total_omzet']],
                ['Modal HPP Barang Terjual', $data['metrics']['hpp_terjual']],
                ['Laba Kotor (Omzet - HPP)', $data['metrics']['laba_kotor']],
                ['Laba Bersih (Laba Kotor - Kas Keluar)', $data['metrics']['laba_bersih']],
                ['Total Piutang Belum Lunas (Periode Ini)', $data['metrics']['piutang_periode']],
                ['Total Akumulasi Piutang Pelanggan', $data['metrics']['total_piutang_aktif']],
                ['Nilai Aset Persediaan Stok Toko', $data['metrics']['nilai_aset_stok']],
            ];

            foreach ($finMetrics as $metric) {
                $sheet->setCellValue("A{$row}", $metric[0]);
                $sheet->setCellValue("C{$row}", $metric[1]);
                $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->getStyle("A{$row}")->getFont()->setBold(true);
                $row++;
            }
            $row += 2;

            // Arus Kas Harian
            $headers = ['A' => 'No', 'B' => 'Tanggal', 'C' => 'Kategori Arus Kas', 'D' => 'Tipe', 'E' => 'Nominal (Rp)', 'F' => 'Catatan'];
            foreach ($headers as $col => $headerText) {
                $sheet->setCellValue("{$col}{$row}", $headerText);
                $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFFFF'));
                $sheet->getStyle("{$col}{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($headerColor);
                $sheet->getStyle("{$col}{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
            $row++;

            $no = 1;
            foreach ($data['arus_kas_harian'] as $kas) {
                $sheet->setCellValue("A{$row}", $no++);
                $sheet->setCellValue("B{$row}", Carbon::parse($kas['tgl'])->format('d/m/Y'));
                $sheet->setCellValue("C{$row}", $kas['kategori']);
                $sheet->setCellValue("D{$row}", strtoupper($kas['tipe']));
                $sheet->setCellValue("E{$row}", (float) $kas['nominal']);
                $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
                $sheet->setCellValue("F{$row}", $kas['total_catatan'] . " Transaksi/Transaksi Stok");
                $row++;
            }
        }

        // Auto size all columns
        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = "Laporan_{$titleTab}_" . $startDate->format('Ymd') . "_" . $endDate->format('Ymd') . ".xlsx";

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Export CSV
     */
    public function exportCsv(Request $request)
    {
        $tab = $request->input('tab', 'penjualan');
        $dates = $this->resolveDateRange($request);
        $startDate = $dates['start'];
        $endDate = $dates['end'];
        $subFilter = $request->input('sub_filter', 'all');

        $filename = "Laporan_{$tab}_" . $startDate->format('Ymd') . "_" . $endDate->format('Ymd') . ".csv";

        return new StreamedResponse(function () use ($tab, $startDate, $endDate, $subFilter) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            if ($tab === 'penjualan') {
                $data = $this->getLaporanPenjualan($startDate, $endDate);
                fputcsv($handle, ['No', 'Tanggal', 'Hari', 'Jumlah Transaksi', 'Total Omzet (Rp)']);
                $no = 1;
                foreach ($data['breakdown_harian'] as $item) {
                    fputcsv($handle, [
                        $no++,
                        $item['tanggal'],
                        $item['hari'],
                        $item['total_transaksi'],
                        $item['total_omzet'],
                    ]);
                }
            } elseif ($tab === 'transaksi') {
                $data = $this->getLaporanTransaksi($startDate, $endDate, $subFilter);
                fputcsv($handle, ['No', 'ID Transaksi', 'Tanggal', 'Pelanggan', 'Items', 'Total Belanja', 'Jenis Pembayaran', 'Status Pembayaran', 'Status Transaksi', 'Catatan']);
                $no = 1;
                foreach ($data['daftar_transaksi'] as $trx) {
                    $itemsText = $trx->detailTransaksi->map(function ($d) {
                        return ($d->barang->nama_barang ?? 'Barang') . " (" . $d->jumlah . "x)";
                    })->implode(', ');

                    fputcsv($handle, [
                        $no++,
                        '#TRX-' . str_pad($trx->id_transaksi, 5, '0', STR_PAD_LEFT),
                        $trx->tanggal,
                        $trx->pelanggan->nama_pelanggan ?? 'Pelanggan Umum',
                        $itemsText,
                        $trx->total_belanja,
                        $trx->jenis_pembayaran,
                        $trx->status_pembayaran,
                        $trx->status_transaksi ?? 'selesai',
                        $trx->catatan_batal ?? '',
                    ]);
                }
            } elseif ($tab === 'produk') {
                $data = $this->getLaporanProduk($startDate, $endDate, $subFilter);
                fputcsv($handle, ['No', 'Kode Barang', 'Nama Produk', 'Harga Beli', 'Harga Jual', 'Sisa Stok', 'Terjual (Qty)', 'Total Omzet', 'Estimasi Laba', 'Status Stok']);
                $no = 1;
                foreach ($data['daftar_produk'] as $prod) {
                    fputcsv($handle, [
                        $no++,
                        $prod['kode_barang'],
                        $prod['nama_barang'],
                        $prod['harga_beli'],
                        $prod['harga_jual'],
                        $prod['stok'],
                        $prod['qty_terjual'],
                        $prod['omzet_produk'],
                        $prod['estimasi_laba'],
                        $prod['status_stok'],
                    ]);
                }
            } elseif ($tab === 'keuangan') {
                $data = $this->getLaporanKeuangan($startDate, $endDate);
                fputcsv($handle, ['Kategori Metrik Keuangan', 'Nominal (Rp)']);
                fputcsv($handle, ['Kas Masuk (Penjualan Tunai Lunas)', $data['metrics']['kas_masuk']]);
                fputcsv($handle, ['Kas Keluar (Pengadaan Stok)', $data['metrics']['kas_keluar']]);
                fputcsv($handle, ['Total Omzet Penjualan', $data['metrics']['total_omzet']]);
                fputcsv($handle, ['HPP Modal Barang Terjual', $data['metrics']['hpp_terjual']]);
                fputcsv($handle, ['Laba Kotor', $data['metrics']['laba_kotor']]);
                fputcsv($handle, ['Laba Bersih', $data['metrics']['laba_bersih']]);
                fputcsv($handle, ['Piutang Periode Ini', $data['metrics']['piutang_periode']]);
                fputcsv($handle, ['Total Piutang Berjalan', $data['metrics']['total_piutang_aktif']]);
                fputcsv($handle, ['Nilai Aset Persediaan Stok', $data['metrics']['nilai_aset_stok']]);

                fputcsv($handle, []);
                fputcsv($handle, ['No', 'Tanggal', 'Kategori', 'Tipe', 'Nominal', 'Catatan']);
                $no = 1;
                foreach ($data['arus_kas_harian'] as $kas) {
                    fputcsv($handle, [
                        $no++,
                        $kas['tgl'],
                        $kas['kategori'],
                        $kas['tipe'],
                        $kas['nominal'],
                        $kas['total_catatan'] . ' transaksi',
                    ]);
                }
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }
}
