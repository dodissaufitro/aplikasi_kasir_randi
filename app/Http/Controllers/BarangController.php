<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use App\Models\BarangSatuanKonversi;
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

class BarangController extends Controller
{
    public function index()
    {
        $barang = Barang::with('satuanKonversi')
            ->orderBy('id_barang', 'desc')
            ->get();

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
        $barang = Barang::with('satuanKonversi')->orderBy('id_barang', 'asc')->get();

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
            'M1' => 'Lokasi / Rak',
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
            $sheet->setCellValue("M{$row}", $b->lokasi_rak ?? '-');
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
        $writer = new Xlsx($spreadsheet);

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        header('Cache-Control: max-age=0');

        $writer->save('php://output');
        exit;
    }

    public function template()
    {
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
            'M1' => 'lokasi_rak',
            'N1' => 'satuan_besar',
            'O1' => 'rasio_konversi',
            'P1' => 'harga_satuan_besar'
        ];

        foreach ($headers as $cell => $val) {
            $sheet->setCellValue($cell, $val);
        }

        $sheet->getStyle('A1:P1')->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFFFF'));
        $sheet->getStyle('A1:P1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF059669');
        $sheet->getStyle('A1:P1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Contoh Data
        $samples = [
            ['BRG000125', '8998866200225', 'Indomie Goreng Spesial', 'Makanan', 'Indomie', 'PT Indofood', 'PCS', 2700, 3500, 3200, 120, 10, 'Rak A-01', 'Dus', 24, 80000],
            ['BRG000126', '8991234567890', 'Air Mineral 600ml', 'Minuman', 'Aqua', 'Danone Aqua', 'Botol', 2500, 4000, 3800, 48, 12, 'Etalase Depan', 'Dus', 24, 90000],
            ['BRG000127', '8999999111222', 'Beras Ramos 5kg', 'Sembako', 'Ramos', 'Sumber Berkah', 'Sak', 65000, 72000, 70000, 20, 5, 'Gudang Belakang', '', '', ''],
        ];

        $row = 2;
        foreach ($samples as $sample) {
            for ($colIdx = 0; $colIdx < count($sample); $colIdx++) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
                $sheet->setCellValue("{$colLetter}{$row}", $sample[$colIdx]);
            }
            $row++;
        }

        foreach (range('A', 'P') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $fileName = 'Template_Import_Barang.xlsx';
        $writer = new Xlsx($spreadsheet);

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        header('Cache-Control: max-age=0');

        $writer->save('php://output');
        exit;
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:10240'
        ]);

        try {
            DB::beginTransaction();

            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            if (count($rows) <= 1) {
                return redirect()->back()->withErrors(['error' => 'File kosong atau tidak memiliki baris data.']);
            }

            $inserted = 0;
            $updated = 0;

            for ($i = 1; $i < count($rows); $i++) {
                $row = $rows[$i];

                $kodeBarang = isset($row[0]) ? trim((string)$row[0]) : '';
                $barcode = isset($row[1]) ? trim((string)$row[1]) : null;
                $namaBarang = isset($row[2]) ? trim((string)$row[2]) : '';
                $kategori = isset($row[3]) && !empty($row[3]) ? trim((string)$row[3]) : 'Umum';
                $merk = isset($row[4]) ? trim((string)$row[4]) : null;
                $supplier = isset($row[5]) ? trim((string)$row[5]) : null;
                $satuan = isset($row[6]) && !empty($row[6]) ? trim((string)$row[6]) : 'PCS';
                $hargaBeli = isset($row[7]) ? (float)str_replace([',', '.'], '', (string)$row[7]) : 0;
                $hargaJual = isset($row[8]) ? (float)str_replace([',', '.'], '', (string)$row[8]) : 0;
                $hargaGrosir = isset($row[9]) && !empty($row[9]) ? (float)str_replace([',', '.'], '', (string)$row[9]) : null;
                $stok = isset($row[10]) ? (int)str_replace([',', '.'], '', (string)$row[10]) : 0;
                $stokMinimum = isset($row[11]) && !empty($row[11]) ? (int)str_replace([',', '.'], '', (string)$row[11]) : 5;
                $lokasiRak = isset($row[12]) ? trim((string)$row[12]) : null;

                // Konversi satuan opsional dari template (kolom N, O, P)
                $satuanBesar = isset($row[13]) ? trim((string)$row[13]) : '';
                $rasioKonversi = isset($row[14]) ? (int)str_replace([',', '.'], '', (string)$row[14]) : 0;
                $hargaBesar = isset($row[15]) && !empty($row[15]) ? (float)str_replace([',', '.'], '', (string)$row[15]) : null;

                if (empty($namaBarang)) {
                    continue;
                }

                $existing = null;
                if (!empty($kodeBarang)) {
                    $existing = Barang::where('kode_barang', $kodeBarang)->first();
                }

                $payload = [
                    'barcode' => $barcode ?: null,
                    'nama_barang' => $namaBarang,
                    'kategori' => $kategori,
                    'merk' => $merk ?: null,
                    'supplier' => $supplier ?: null,
                    'satuan' => $satuan,
                    'harga_beli' => $hargaBeli,
                    'harga_jual' => $hargaJual,
                    'harga_grosir' => $hargaGrosir,
                    'stok' => $stok,
                    'stok_minimum' => $stokMinimum,
                    'lokasi_rak' => $lokasiRak ?: null,
                    'is_aktif' => true,
                ];

                if ($existing) {
                    $existing->update($payload);
                    $barangObj = $existing;
                    $updated++;
                } else {
                    if (empty($kodeBarang)) {
                        $latest = Barang::max('id_barang') ?? 0;
                        $kodeBarang = 'BRG' . str_pad($latest + $inserted + 1, 6, '0', STR_PAD_LEFT);
                    }
                    $payload['kode_barang'] = $kodeBarang;
                    $barangObj = Barang::create($payload);
                    $inserted++;
                }

                // Jika ada konversi satuan besar
                if (!empty($satuanBesar) && $rasioKonversi > 1) {
                    BarangSatuanKonversi::updateOrCreate(
                        [
                            'id_barang' => $barangObj->id_barang,
                            'nama_satuan' => $satuanBesar,
                        ],
                        [
                            'rasio_konversi' => $rasioKonversi,
                            'harga_jual_satuan' => $hargaBesar,
                        ]
                    );
                }
            }

            DB::commit();

            return redirect()->back()->with('success', "Proses import berhasil! {$inserted} barang baru ditambahkan, {$updated} barang diperbarui.");

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal mengimpor file: ' . $e->getMessage()]);
        }
    }
}
