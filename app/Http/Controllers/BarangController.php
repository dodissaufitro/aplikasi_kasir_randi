<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSatuanKonversi;
use App\Models\DetailTransaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BarangController extends Controller
{
    public function index()
    {
        $terjualMap = DetailTransaksi::whereHas('transaksi', function ($q) {
                $q->where('status_transaksi', 'selesai');
            })
            ->select('id_barang', DB::raw('SUM(jumlah * COALESCE(rasio_konversi, 1)) as total_terjual'))
            ->groupBy('id_barang')
            ->pluck('total_terjual', 'id_barang');

        $barang = Barang::with('satuanKonversi')
            ->orderBy('id_barang', 'desc')
            ->get()
            ->map(function ($b) use ($terjualMap) {
                $qty = (int) ($terjualMap[$b->id_barang] ?? 0);
                $b->total_terjual = $qty;
                $b->total_terjual_text = $b->formatKonversiText($qty);
                return $b;
            });

        $kategoriList = Barang::whereNotNull('kategori')
            ->where('kategori', '!=', '')
            ->distinct()
            ->pluck('kategori')
            ->values();

        $merkList = Barang::whereNotNull('merk')
            ->where('merk', '!=', '')
            ->distinct()
            ->pluck('merk')
            ->values();

        return Inertia::render('Barang/Index', [
            'barang' => $barang,
            'kategori_list' => $kategoriList,
            'merk_list' => $merkList,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_barang' => 'nullable|string|max:100|unique:barang,kode_barang',
            'barcode' => 'nullable|string|max:100',
            'nama_barang' => 'required|string|max:255',
            'kategori' => 'nullable|string|max:100',
            'merk' => 'nullable|string|max:100',
            'supplier' => 'nullable|string|max:150',
            'satuan' => 'required|string|max:50',
            'harga_beli' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'harga_grosir' => 'nullable|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'stok_minimum' => 'nullable|integer|min:0',
            'lokasi_rak' => 'nullable|string|max:100',
            'is_aktif' => 'nullable|boolean',
            'foto_produk' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if (empty($validated['kode_barang'])) {
            $latest = Barang::max('id_barang') ?? 0;
            $validated['kode_barang'] = 'BRG' . str_pad($latest + 1, 6, '0', STR_PAD_LEFT);
        }

        if (!isset($validated['stok_minimum'])) {
            $validated['stok_minimum'] = 5;
        }

        if (!isset($validated['is_aktif'])) {
            $validated['is_aktif'] = true;
        }

        try {
            DB::beginTransaction();

            // Handle Upload Foto Produk
            if ($request->hasFile('foto_produk')) {
                $path = $request->file('foto_produk')->store('produk', 'public');
                $validated['foto_produk'] = $path;
            }

            $barang = Barang::create($validated);

            // Handle Konversi Satuan (bisa dikirim sebagai array atau json string dari FormData)
            $konversiData = $request->input('konversi');
            if (is_string($konversiData)) {
                $konversiData = json_decode($konversiData, true);
            }

            if (!empty($konversiData) && is_array($konversiData)) {
                foreach ($konversiData as $k) {
                    if (!empty($k['nama_satuan']) && !empty($k['rasio_konversi']) && (int)$k['rasio_konversi'] > 1) {
                        BarangSatuanKonversi::create([
                            'id_barang' => $barang->id_barang,
                            'nama_satuan' => trim($k['nama_satuan']),
                            'rasio_konversi' => (int) $k['rasio_konversi'],
                            'harga_jual_satuan' => !empty($k['harga_jual_satuan']) ? (float) $k['harga_jual_satuan'] : null,
                            'barcode_satuan' => !empty($k['barcode_satuan']) ? trim($k['barcode_satuan']) : null,
                        ]);
                    }
                }
            }

            DB::commit();

            return redirect()->back()->with('success', 'Barang ' . $barang->nama_barang . ' berhasil ditambahkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal menyimpan data barang: ' . $e->getMessage()]);
        }
    }

    public function update(Request $request, $id)
    {
        $barang = Barang::findOrFail($id);

        $validated = $request->validate([
            'kode_barang' => 'nullable|string|max:100|unique:barang,kode_barang,' . $id . ',id_barang',
            'barcode' => 'nullable|string|max:100',
            'nama_barang' => 'required|string|max:255',
            'kategori' => 'nullable|string|max:100',
            'merk' => 'nullable|string|max:100',
            'supplier' => 'nullable|string|max:150',
            'satuan' => 'required|string|max:50',
            'harga_beli' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'harga_grosir' => 'nullable|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'stok_minimum' => 'nullable|integer|min:0',
            'lokasi_rak' => 'nullable|string|max:100',
            'is_aktif' => 'nullable|boolean',
            'foto_produk' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'hapus_foto' => 'nullable|boolean',
        ]);

        if (empty($validated['kode_barang'])) {
            $validated['kode_barang'] = 'BRG' . str_pad($barang->id_barang, 6, '0', STR_PAD_LEFT);
        }

        try {
            DB::beginTransaction();

            // Handle Hapus Foto jika diminta
            if ($request->boolean('hapus_foto') && $barang->foto_produk) {
                Storage::disk('public')->delete($barang->foto_produk);
                $validated['foto_produk'] = null;
            }

            // Handle Upload Foto Baru
            if ($request->hasFile('foto_produk')) {
                if ($barang->foto_produk) {
                    Storage::disk('public')->delete($barang->foto_produk);
                }
                $path = $request->file('foto_produk')->store('produk', 'public');
                $validated['foto_produk'] = $path;
            }

            $barang->update($validated);

            // Sync Konversi Satuan
            $konversiData = $request->input('konversi');
            if (is_string($konversiData)) {
                $konversiData = json_decode($konversiData, true);
            }

            // Hapus yang lama
            BarangSatuanKonversi::where('id_barang', $barang->id_barang)->delete();

            // Simpan yang baru
            if (!empty($konversiData) && is_array($konversiData)) {
                foreach ($konversiData as $k) {
                    if (!empty($k['nama_satuan']) && !empty($k['rasio_konversi']) && (int)$k['rasio_konversi'] > 1) {
                        BarangSatuanKonversi::create([
                            'id_barang' => $barang->id_barang,
                            'nama_satuan' => trim($k['nama_satuan']),
                            'rasio_konversi' => (int) $k['rasio_konversi'],
                            'harga_jual_satuan' => !empty($k['harga_jual_satuan']) ? (float) $k['harga_jual_satuan'] : null,
                            'barcode_satuan' => !empty($k['barcode_satuan']) ? trim($k['barcode_satuan']) : null,
                        ]);
                    }
                }
            }

            DB::commit();

            return redirect()->back()->with('success', 'Data barang ' . $barang->nama_barang . ' berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal memperbarui barang: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        $barang = Barang::findOrFail($id);

        if ($barang->foto_produk) {
            Storage::disk('public')->delete($barang->foto_produk);
        }

        $barang->delete();

        return redirect()->back()->with('success', 'Barang berhasil dihapus.');
    }

    public function export()
    {
        $terjualMap = DetailTransaksi::whereHas('transaksi', function ($q) {
                $q->where('status_transaksi', 'selesai');
            })
            ->select('id_barang', DB::raw('SUM(jumlah * COALESCE(rasio_konversi, 1)) as total_terjual'))
            ->groupBy('id_barang')
            ->pluck('total_terjual', 'id_barang');

        $barang = Barang::with('satuanKonversi')->orderBy('id_barang', 'asc')->get();

        // Fallback jika PhpSpreadsheet belum terinstal di server VPS
        if (!class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class)) {
            $fileName = 'Data_Barang_' . date('Ymd_His') . '.csv';
            return response()->streamDownload(function () use ($barang, $terjualMap) {
                $handle = fopen('php://output', 'w');
                // UTF-8 BOM agar dibuka rapi di Microsoft Excel
                fputs($handle, "\xEF\xBB\xBF");
                fputcsv($handle, [
                    'Kode Barang', 'Barcode', 'Nama Produk', 'Kategori', 'Merk', 'Supplier',
                    'Satuan Dasar', 'Harga Beli (Rp)', 'Harga Jual (Rp)', 'Harga Grosir (Rp)',
                    'Stok', 'Stok Minimum', 'Stok Terjual', 'Status', 'Konversi Satuan'
                ]);
                foreach ($barang as $b) {
                    $konversiStr = $b->satuanKonversi->map(function ($k) use ($b) {
                        $txt = "1 {$k->nama_satuan} = {$k->rasio_konversi} {$b->satuan}";
                        if ($k->harga_jual_satuan) {
                            $txt .= " (Rp " . number_format($k->harga_jual_satuan, 0, ',', '.') . ")";
                        }
                        return $txt;
                    })->implode('; ');
                    $terjualQty = (int)($terjualMap[$b->id_barang] ?? 0);
                    fputcsv($handle, [
                        $b->kode_barang,
                        $b->barcode ?? '-',
                        $b->nama_barang,
                        $b->kategori ?? 'Umum',
                        $b->merk ?? '-',
                        $b->supplier ?? '-',
                        $b->satuan,
                        $b->harga_beli,
                        $b->harga_jual,
                        $b->harga_grosir,
                        $b->stok,
                        $b->stok_minimum,
                        $b->formatKonversiText($terjualQty),
                        $b->is_aktif ? 'Aktif' : 'Nonaktif',
                        $konversiStr,
                    ]);
                }
                fclose($handle);
            }, $fileName, [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Master Data Barang');

        // Headers
        $headers = [
            'A1' => 'Kode Barang',
            'B1' => 'Barcode',
            'C1' => 'Nama Produk',
            'D1' => 'Kategori',
            'E1' => 'Merk',
            'F1' => 'Supplier',
            'G1' => 'Satuan Dasar',
            'H1' => 'Harga Beli (Rp)',
            'I1' => 'Harga Jual (Rp)',
            'J1' => 'Harga Grosir (Rp)',
            'K1' => 'Stok',
            'L1' => 'Stok Minimum',
            'M1' => 'Stok Terjual',
            'N1' => 'Status',
            'O1' => 'Konversi Satuan'
        ];

        foreach ($headers as $cell => $val) {
            $sheet->setCellValue($cell, $val);
        }

        $sheet->getStyle('A1:O1')->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFFFF'));
        $sheet->getStyle('A1:O1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4338CA');
        $sheet->getStyle('A1:O1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(1)->setRowHeight(24);

        $row = 2;
        foreach ($barang as $b) {
            $konversiStr = $b->satuanKonversi->map(function ($k) use ($b) {
                $txt = "1 {$k->nama_satuan} = {$k->rasio_konversi} {$b->satuan}";
                if ($k->harga_jual_satuan) {
                    $txt .= " (Rp " . number_format($k->harga_jual_satuan, 0, ',', '.') . ")";
                }
                return $txt;
            })->implode('; ');

            $sheet->setCellValue("A{$row}", $b->kode_barang);
            $sheet->setCellValue("B{$row}", $b->barcode ?? '-');
            $sheet->setCellValue("C{$row}", $b->nama_barang);
            $sheet->setCellValue("D{$row}", $b->kategori ?? 'Umum');
            $sheet->setCellValue("E{$row}", $b->merk ?? '-');
            $sheet->setCellValue("F{$row}", $b->supplier ?? '-');
            $sheet->setCellValue("G{$row}", $b->satuan);
            $sheet->setCellValue("H{$row}", (float)$b->harga_beli);
            $sheet->setCellValue("I{$row}", (float)$b->harga_jual);
            $sheet->setCellValue("J{$row}", (float)$b->harga_grosir);
            $sheet->setCellValue("K{$row}", (int)$b->stok);
            $sheet->setCellValue("L{$row}", (int)$b->stok_minimum);
            $terjualQty = (int)($terjualMap[$b->id_barang] ?? 0);
            $sheet->setCellValue("M{$row}", $b->formatKonversiText($terjualQty));
            $sheet->setCellValue("N{$row}", $b->is_aktif ? 'Aktif' : 'Nonaktif');
            $sheet->setCellValue("O{$row}", $konversiStr);

            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("G{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("J{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("K{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("L{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("N{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $row++;
        }

        $sheet->getStyle('A1:O' . ($row - 1))->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFCBD5E1'));

        foreach (range('A', 'O') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $fileName = 'Data_Barang_' . date('Ymd_His') . '.xlsx';

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    public function template()
    {
        // Fallback jika PhpSpreadsheet belum terinstal di server VPS
        if (!class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class)) {
            $fileName = 'Template_Import_Barang.csv';
            return response()->streamDownload(function () {
                $handle = fopen('php://output', 'w');
                fputs($handle, "\xEF\xBB\xBF");
                fputcsv($handle, [
                    'kode_barang', 'barcode', 'nama_barang', 'kategori', 'merk', 'supplier',
                    'satuan', 'harga_beli', 'harga_jual', 'harga_grosir', 'stok', 'stok_minimum',
                    'satuan_besar', 'rasio_konversi', 'harga_satuan_besar'
                ]);
                $samples = [
                    ['BRG000125', '8998866200225', 'Indomie Goreng Spesial', 'Makanan', 'Indomie', 'PT Indofood', 'PCS', 2700, 3500, 3200, 120, 10, 'Dus', 24, 80000],
                    ['BRG000126', '8991234567890', 'Air Mineral 600ml', 'Minuman', 'Aqua', 'Danone Aqua', 'Botol', 2500, 4000, 3800, 48, 12, 'Dus', 24, 90000],
                    ['BRG000127', '8999999111222', 'Beras Ramos 5kg', 'Sembako', 'Ramos', 'Sumber Berkah', 'Sak', 65000, 72000, 70000, 20, 5, '', '', ''],
                ];
                foreach ($samples as $s) {
                    fputcsv($handle, $s);
                }
                fclose($handle);
            }, $fileName, [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Template Import Barang');

        // Headers
        $headers = [
            'A1' => 'kode_barang',
            'B1' => 'barcode',
            'C1' => 'nama_barang',
            'D1' => 'kategori',
            'E1' => 'merk',
            'F1' => 'supplier',
            'G1' => 'satuan',
            'H1' => 'harga_beli',
            'I1' => 'harga_jual',
            'J1' => 'harga_grosir',
            'K1' => 'stok',
            'L1' => 'stok_minimum',
            'M1' => 'satuan_besar',
            'N1' => 'rasio_konversi',
            'O1' => 'harga_satuan_besar'
        ];

        foreach ($headers as $cell => $val) {
            $sheet->setCellValue($cell, $val);
        }

        $sheet->getStyle('A1:O1')->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFFFF'));
        $sheet->getStyle('A1:O1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF059669');
        $sheet->getStyle('A1:O1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Contoh Data
        $samples = [
            ['BRG000125', '8998866200225', 'Indomie Goreng Spesial', 'Makanan', 'Indomie', 'PT Indofood', 'PCS', 2700, 3500, 3200, 120, 10, 'Dus', 24, 80000],
            ['BRG000126', '8991234567890', 'Air Mineral 600ml', 'Minuman', 'Aqua', 'Danone Aqua', 'Botol', 2500, 4000, 3800, 48, 12, 'Dus', 24, 90000],
            ['BRG000127', '8999999111222', 'Beras Ramos 5kg', 'Sembako', 'Ramos', 'Sumber Berkah', 'Sak', 65000, 72000, 70000, 20, 5, '', '', ''],
        ];

        $row = 2;
        foreach ($samples as $sample) {
            for ($colIdx = 0; $colIdx < count($sample); $colIdx++) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
                $sheet->setCellValue("{$colLetter}{$row}", $sample[$colIdx]);
            }
            $row++;
        }

        foreach (range('A', 'O') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $fileName = 'Template_Import_Barang.xlsx';

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:10240'
        ]);

        try {
            DB::beginTransaction();

            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            if (!class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) {
                if ($extension === 'csv' || $extension === 'txt') {
                    $rows = [];
                    if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
                        while (($data = fgetcsv($handle, 10000, ',')) !== false) {
                            if (count($data) === 1 && strpos($data[0], ';') !== false) {
                                $data = str_getcsv($data[0], ';');
                            }
                            $rows[] = $data;
                        }
                        fclose($handle);
                    }
                } else {
                    return redirect()->back()->withErrors(['error' => "Library PhpSpreadsheet belum terinstal di server VPS. Silakan jalankan 'composer install' di server VPS, atau unggah file berformat .csv terlebih dahulu."]);
                }
            } else {
                $spreadsheet = IOFactory::load($file->getRealPath());
                $sheet = $spreadsheet->getActiveSheet();
                $rows = $sheet->toArray();
            }

            if (count($rows) <= 1) {
                return redirect()->back()->withErrors(['error' => 'File kosong atau tidak memiliki baris data.']);
            }

            // Pemetaan Header Cerdas (Bisa membaca file Template maupun file hasil Export Excel)
            $headers = $rows[0];
            $colMap = [];
            foreach ($headers as $idx => $headerText) {
                if ($headerText === null) continue;
                $norm = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', (string)$headerText)));
                $colMap[$norm] = $idx;
            }

            $findCol = function(array $aliases) use ($colMap) {
                foreach ($aliases as $alias) {
                    $norm = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $alias)));
                    if (isset($colMap[$norm])) {
                        return $colMap[$norm];
                    }
                }
                return null;
            };

            $colKode = $findCol(['kode_barang', 'kode barang', 'kode']);
            $colBarcode = $findCol(['barcode', 'kode barcode']);
            $colNama = $findCol(['nama_barang', 'nama barang', 'nama produk', 'nama_produk', 'produk', 'nama']);
            $colKategori = $findCol(['kategori', 'kategori_produk']);
            $colMerk = $findCol(['merk', 'brand']);
            $colSupplier = $findCol(['supplier', 'pemasok']);
            $colSatuan = $findCol(['satuan', 'satuan_dasar', 'satuan dasar']);
            $colHargaBeli = $findCol(['harga_beli', 'harga beli', 'harga beli (rp)', 'hpp']);
            $colHargaJual = $findCol(['harga_jual', 'harga jual', 'harga jual (rp)']);
            $colHargaGrosir = $findCol(['harga_grosir', 'harga grosir', 'harga grosir (rp)']);
            $colStok = $findCol(['stok', 'stock', 'stok_akhir', 'jumlah_stok', 'stok barang']);
            $colStokMin = $findCol(['stok_minimum', 'stok minimum', 'min_stok']);
            $colStatus = $findCol(['status', 'status_aktif', 'is_aktif']);
            $colSatuanBesar = $findCol(['satuan_besar', 'satuan besar']);
            $colRasio = $findCol(['rasio_konversi', 'rasio konversi', 'rasio']);
            $colHargaBesar = $findCol(['harga_satuan_besar', 'harga satuan besar']);
            $colKonversiStr = $findCol(['konversi_satuan', 'konversi satuan']);

            // Helper pembersih string
            $cleanString = function($val) {
                if ($val === null) return null;
                $trimmed = trim((string)$val);
                if ($trimmed === '' || $trimmed === '-') return null;
                return $trimmed;
            };

            // Helper pembersih angka & desimal
            $parseNumber = function($val, $default = 0) {
                if ($val === null || $val === '' || $val === '-') return $default;
                if (is_numeric($val)) return (float)$val;
                $clean = preg_replace('/[^\d.,]/', '', (string)$val);
                if (preg_match('/^\d{1,3}(\.\d{3})+$/', $clean)) {
                    $clean = str_replace('.', '', $clean);
                } elseif (preg_match('/^\d{1,3}(,\d{3})+$/', $clean)) {
                    $clean = str_replace(',', '', $clean);
                } else {
                    $clean = str_replace(',', '.', $clean);
                }
                return is_numeric($clean) ? (float)$clean : $default;
            };

            $parseInteger = function($val, $default = 0) use ($parseNumber) {
                return (int) round($parseNumber($val, $default));
            };

            $inserted = 0;
            $updated = 0;

            for ($i = 1; $i < count($rows); $i++) {
                $row = $rows[$i];

                // Ambil nilai berdasarkan kolom cerdas atau fallback index
                $kodeBarang = $cleanString($colKode !== null ? ($row[$colKode] ?? null) : ($row[0] ?? null));
                $barcode = $cleanString($colBarcode !== null ? ($row[$colBarcode] ?? null) : ($row[1] ?? null));
                $namaBarang = $cleanString($colNama !== null ? ($row[$colNama] ?? null) : ($row[2] ?? null));
                $kategori = $cleanString($colKategori !== null ? ($row[$colKategori] ?? null) : ($row[3] ?? null)) ?? 'Umum';
                $merk = $cleanString($colMerk !== null ? ($row[$colMerk] ?? null) : ($row[4] ?? null));
                $supplier = $cleanString($colSupplier !== null ? ($row[$colSupplier] ?? null) : ($row[5] ?? null));
                $satuan = $cleanString($colSatuan !== null ? ($row[$colSatuan] ?? null) : ($row[6] ?? null)) ?? 'PCS';
                
                $hargaBeli = $parseNumber($colHargaBeli !== null ? ($row[$colHargaBeli] ?? 0) : ($row[7] ?? 0));
                $hargaJual = $parseNumber($colHargaJual !== null ? ($row[$colHargaJual] ?? 0) : ($row[8] ?? 0));
                $hargaGrosirVal = $colHargaGrosir !== null ? ($row[$colHargaGrosir] ?? null) : ($row[9] ?? null);
                $hargaGrosir = ($hargaGrosirVal !== null && $hargaGrosirVal !== '' && $hargaGrosirVal !== '-') 
                    ? $parseNumber($hargaGrosirVal) 
                    : null;
                
                $stok = $parseInteger($colStok !== null ? ($row[$colStok] ?? 0) : ($row[10] ?? 0));
                $stokMinimum = $parseInteger($colStokMin !== null ? ($row[$colStokMin] ?? 5) : ($row[11] ?? 5), 5);

                $statusText = $colStatus !== null ? strtolower(trim((string)($row[$colStatus] ?? ''))) : 'aktif';
                $isAktif = !in_array($statusText, ['nonaktif', 'non-aktif', '0', 'false', 'inactive']);

                // Konversi satuan
                $satuanBesar = $cleanString($colSatuanBesar !== null ? ($row[$colSatuanBesar] ?? null) : null);
                $rasioKonversi = $colRasio !== null ? $parseInteger($row[$colRasio] ?? 0) : 0;
                $hargaBesar = $colHargaBesar !== null ? $parseNumber($row[$colHargaBesar] ?? 0) : null;
                $konversiStr = $cleanString($colKonversiStr !== null ? ($row[$colKonversiStr] ?? null) : null);

                // Jika nama barang dan kode barang kosong, lewati baris ini
                if (empty($namaBarang) && empty($kodeBarang)) {
                    continue;
                }

                // Cari barang yang sudah ada untuk update stok & data
                $existing = null;
                if (!empty($kodeBarang)) {
                    $existing = Barang::where('kode_barang', $kodeBarang)->first();
                }
                if (!$existing && !empty($barcode)) {
                    $existing = Barang::where('barcode', $barcode)->first();
                }
                if (!$existing && !empty($namaBarang)) {
                    $existing = Barang::where('nama_barang', $namaBarang)->first();
                }

                if ($existing) {
                    // Update data barang yang sudah ada (termasuk stok dari file Excel)
                    $existing->stok = $stok;
                    if (!empty($namaBarang)) $existing->nama_barang = $namaBarang;
                    if ($barcode !== null) $existing->barcode = $barcode;
                    if ($kategori !== null) $existing->kategori = $kategori;
                    if ($merk !== null) $existing->merk = $merk;
                    if ($supplier !== null) $existing->supplier = $supplier;
                    if ($satuan !== null) $existing->satuan = $satuan;
                    if ($hargaBeli > 0) $existing->harga_beli = $hargaBeli;
                    if ($hargaJual > 0) $existing->harga_jual = $hargaJual;
                    if ($hargaGrosir !== null) $existing->harga_grosir = $hargaGrosir;
                    if ($colStokMin !== null) $existing->stok_minimum = $stokMinimum;
                    if ($colStatus !== null) $existing->is_aktif = $isAktif;

                    $existing->save();
                    $barangObj = $existing;
                    $updated++;
                } else {
                    // Tambahkan barang baru
                    if (empty($kodeBarang)) {
                        $latest = Barang::max('id_barang') ?? 0;
                        $kodeBarang = 'BRG' . str_pad($latest + $inserted + 1, 6, '0', STR_PAD_LEFT);
                    }

                    $payload = [
                        'kode_barang' => $kodeBarang,
                        'barcode' => $barcode ?: null,
                        'nama_barang' => $namaBarang ?: 'Produk ' . $kodeBarang,
                        'kategori' => $kategori,
                        'merk' => $merk,
                        'supplier' => $supplier,
                        'satuan' => $satuan,
                        'harga_beli' => $hargaBeli,
                        'harga_jual' => $hargaJual,
                        'harga_grosir' => $hargaGrosir,
                        'stok' => $stok,
                        'stok_minimum' => $stokMinimum,
                        'is_aktif' => $isAktif,
                    ];

                    $barangObj = Barang::create($payload);
                    $inserted++;
                }

                // 1. Simpan konversi satuan dari kolom terpisah (Template)
                if (!empty($satuanBesar) && $rasioKonversi > 1) {
                    BarangSatuanKonversi::updateOrCreate(
                        [
                            'id_barang' => $barangObj->id_barang,
                            'nama_satuan' => $satuanBesar,
                        ],
                        [
                            'rasio_konversi' => $rasioKonversi,
                            'harga_jual_satuan' => $hargaBesar > 0 ? $hargaBesar : null,
                        ]
                    );
                }

                // 2. Simpan konversi satuan dari teks gabungan (Export: misal "1 Dus = 24 PCS (Rp 80.000)")
                if (!empty($konversiStr)) {
                    $parts = explode(';', $konversiStr);
                    foreach ($parts as $part) {
                        if (preg_match('/1\s+([^=]+)\s*=\s*(\d+)\s*([^(]+)(?:\(Rp\s*([0-9\.,]+)\))?/i', $part, $m)) {
                            $namaKonv = trim($m[1]);
                            $rasioKonv = (int)$m[2];
                            $hargaKonv = !empty($m[4]) ? (float)str_replace(['.', ','], '', $m[4]) : null;

                            if (!empty($namaKonv) && $rasioKonv > 1) {
                                BarangSatuanKonversi::updateOrCreate(
                                    [
                                        'id_barang' => $barangObj->id_barang,
                                        'nama_satuan' => $namaKonv,
                                    ],
                                    [
                                        'rasio_konversi' => $rasioKonv,
                                        'harga_jual_satuan' => $hargaKonv,
                                    ]
                                );
                            }
                        }
                    }
                }
            }

            DB::commit();

            return redirect()->back()->with('success', "Proses import berhasil! {$inserted} barang baru ditambahkan, {$updated} data barang / stok berhasil diperbarui.");

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal mengimpor file: ' . $e->getMessage()]);
        }
    }
}
