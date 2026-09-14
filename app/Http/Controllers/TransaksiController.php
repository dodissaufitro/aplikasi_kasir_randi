<?php

namespace App\Http\Controllers;

use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use App\Models\Pelanggan;
use App\Models\Barang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransaksiController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaksi::with(['pelanggan', 'detailTransaksi.barang'])
            ->orderBy('id_transaksi', 'desc');

        if ($request->filled('tanggal_mulai')) {
            $query->whereDate('tanggal', '>=', $request->tanggal_mulai);
        }

        if ($request->filled('tanggal_selesai')) {
            $query->whereDate('tanggal', '<=', $request->tanggal_selesai);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where(function($q) use ($request) {
                $q->where('status_pembayaran', $request->status)
                  ->orWhere('jenis_pembayaran', $request->status);
            });
        }

        $transaksi = $query->get();

        return Inertia::render('Transaksi/Index', [
            'transaksi' => $transaksi,
            'filters' => [
                'tanggal_mulai' => $request->tanggal_mulai ?? '',
                'tanggal_selesai' => $request->tanggal_selesai ?? '',
                'status' => $request->status ?? 'all',
            ]
        ]);
    }

    public function exportExcel(Request $request)
    {
        $query = Transaksi::with(['pelanggan', 'detailTransaksi.barang'])
            ->orderBy('id_transaksi', 'desc');

        if ($request->filled('tanggal_mulai')) {
            $query->whereDate('tanggal', '>=', $request->tanggal_mulai);
        }

        if ($request->filled('tanggal_selesai')) {
            $query->whereDate('tanggal', '<=', $request->tanggal_selesai);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where(function($q) use ($request) {
                $q->where('status_pembayaran', $request->status)
                  ->orWhere('jenis_pembayaran', $request->status);
            });
        }

        $transaksi = $query->get();

        // Fallback jika PhpSpreadsheet belum terpasang di server
        if (!class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class)) {
            $fileName = 'Laporan_Transaksi_' . date('Ymd_His') . '.csv';
            return response()->streamDownload(function () use ($transaksi) {
                $handle = fopen('php://output', 'w');
                // UTF-8 BOM agar rapi saat dibuka di Microsoft Excel
                fputs($handle, "\xEF\xBB\xBF");
                fputcsv($handle, [
                    'No',
                    'ID Transaksi',
                    'Tanggal & Waktu',
                    'Nama Pelanggan',
                    'No. Telepon',
                    'Rincian Barang Terjual',
                    'Total Belanja (Rp)',
                    'Metode Bayar',
                    'Status'
                ]);

                $no = 1;
                $totalOmzet = 0;
                $totalPiutang = 0;

                foreach ($transaksi as $t) {
                    $totalOmzet += $t->total_belanja;
                    if ($t->status_pembayaran !== 'lunas') {
                        $totalPiutang += $t->total_belanja;
                    }

                    $itemDetails = [];
                    foreach ($t->detailTransaksi as $d) {
                        $namaBrg = $d->barang ? $d->barang->nama_barang : 'Barang Terhapus';
                        $itemDetails[] = "{$namaBrg} ({$d->jumlah} x " . number_format($d->harga_satuan, 0, ',', '.') . ")";
                    }
                    $itemString = implode(" | ", $itemDetails);
                    $waktuFormatted = Carbon::parse($t->tanggal)->locale('id')->isoFormat('dddd, D MMM Y HH:mm') . ' WIB';

                    fputcsv($handle, [
                        $no++,
                        "#TRX-" . str_pad($t->id_transaksi, 4, '0', STR_PAD_LEFT),
                        $waktuFormatted,
                        $t->pelanggan ? $t->pelanggan->nama_pelanggan : 'Pelanggan Umum',
                        $t->pelanggan && $t->pelanggan->no_telp ? $t->pelanggan->no_telp : '-',
                        $itemString,
                        $t->total_belanja,
                        strtoupper($t->jenis_pembayaran),
                        strtoupper($t->status_pembayaran === 'lunas' ? 'Lunas' : 'Hutang')
                    ]);
                }

                // Baris kosong dan ringkasan
                fputcsv($handle, []);
                fputcsv($handle, ['', '', '', '', '', 'TOTAL OMZET KESELURUHAN', $totalOmzet]);
                fputcsv($handle, ['', '', '', '', '', 'TOTAL PIUTANG (BELUM LUNAS)', $totalPiutang]);

                fclose($handle);
            }, $fileName, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            ]);
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan Transaksi');

        // Header Title
        $sheet->setCellValue('A1', 'LAPORAN TRANSAKSI PENJUALAN - KASIR PRO');
        $sheet->mergeCells('A1:I1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FF1E1B4B'));
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Subtitle Periode & Tanggal Cetak
        $periodeText = 'Periode: ';
        if ($request->filled('tanggal_mulai') && $request->filled('tanggal_selesai')) {
            $periodeText .= Carbon::parse($request->tanggal_mulai)->format('d/m/Y') . ' s/d ' . Carbon::parse($request->tanggal_selesai)->format('d/m/Y');
        } elseif ($request->filled('tanggal_mulai')) {
            $periodeText .= 'Mulai ' . Carbon::parse($request->tanggal_mulai)->format('d/m/Y');
        } elseif ($request->filled('tanggal_selesai')) {
            $periodeText .= 'Hingga ' . Carbon::parse($request->tanggal_selesai)->format('d/m/Y');
        } else {
            $periodeText .= 'Semua Riwayat Transaksi';
        }
        $sheet->setCellValue('A2', $periodeText);
        $sheet->mergeCells('A2:I2');
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $cetakText = 'Dicetak pada: ' . Carbon::now()->locale('id')->isoFormat('dddd, D MMMM Y HH:mm') . ' WIB';
        $sheet->setCellValue('A3', $cetakText);
        $sheet->mergeCells('A3:I3');
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Header Table
        $headers = [
            'A5' => 'No',
            'B5' => 'ID Transaksi',
            'C5' => 'Tanggal & Waktu',
            'D5' => 'Nama Pelanggan',
            'E5' => 'No. Telepon',
            'F5' => 'Rincian Barang Terjual',
            'G5' => 'Total Belanja (Rp)',
            'H5' => 'Metode Bayar',
            'I5' => 'Status'
        ];

        foreach ($headers as $cell => $text) {
            $sheet->setCellValue($cell, $text);
        }

        $sheet->getStyle('A5:I5')->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFFFF'));
        $sheet->getStyle('A5:I5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4338CA');
        $sheet->getStyle('A5:I5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(5)->setRowHeight(25);

        // Data Rows
        $row = 6;
        $totalOmzet = 0;
        $totalPiutang = 0;
        $no = 1;

        foreach ($transaksi as $t) {
            $totalOmzet += $t->total_belanja;
            if ($t->status_pembayaran !== 'lunas') {
                $totalPiutang += $t->total_belanja;
            }

            // Rincian items
            $itemDetails = [];
            foreach ($t->detailTransaksi as $d) {
                $namaBrg = $d->barang ? $d->barang->nama_barang : 'Barang Terhapus';
                $itemDetails[] = "• {$namaBrg} ({$d->jumlah} x " . number_format($d->harga_satuan, 0, ',', '.') . ")";
            }
            $itemString = implode("\n", $itemDetails);

            $waktuFormatted = Carbon::parse($t->tanggal)->locale('id')->isoFormat('dddd, D MMM Y HH:mm') . ' WIB';

            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", "#TRX-" . str_pad($t->id_transaksi, 4, '0', STR_PAD_LEFT));
            $sheet->setCellValue("C{$row}", $waktuFormatted);
            $sheet->setCellValue("D{$row}", $t->pelanggan ? $t->pelanggan->nama_pelanggan : 'Pelanggan Umum');
            $sheet->setCellValue("E{$row}", $t->pelanggan && $t->pelanggan->no_telp ? $t->pelanggan->no_telp : '-');
            $sheet->setCellValue("F{$row}", $itemString);
            $sheet->setCellValue("G{$row}", $t->total_belanja);
            $sheet->setCellValue("H{$row}", strtoupper($t->jenis_pembayaran));
            $sheet->setCellValue("I{$row}", strtoupper($t->status_pembayaran === 'lunas' ? 'Lunas' : 'Hutang'));

            // Styling baris
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("G{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F{$row}")->getAlignment()->setWrapText(true);

            // Warna status
            if ($t->status_pembayaran === 'lunas') {
                $sheet->getStyle("I{$row}")->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FF059669'))->setBold(true);
            } else {
                $sheet->getStyle("I{$row}")->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFE11D48'))->setBold(true);
            }

            $row++;
        }

        // Summary Rows
        $sheet->setCellValue("A{$row}", "TOTAL OMZET KESELURUHAN");
        $sheet->mergeCells("A{$row}:F{$row}");
        $sheet->setCellValue("G{$row}", $totalOmzet);
        $sheet->getStyle("G{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("A{$row}:I{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("A{$row}:I{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF1F5F9');
        $row++;

        $sheet->setCellValue("A{$row}", "TOTAL PIUTANG (BELUM LUNAS)");
        $sheet->mergeCells("A{$row}:F{$row}");
        $sheet->setCellValue("G{$row}", $totalPiutang);
        $sheet->getStyle("G{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("A{$row}:I{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle("G{$row}")->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFE11D48'));
        $sheet->getStyle("A{$row}:I{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFEE2E2');

        // Borders
        $sheet->getStyle("A5:I{$row}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFCBD5E1'));

        // Auto-width columns
        foreach (range('A', 'I') as $col) {
            if ($col === 'F') {
                $sheet->getColumnDimension($col)->setWidth(35);
            } else {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
        }

        $fileName = 'Laporan_Transaksi_' . date('Ymd_His') . '.xlsx';

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    public function lunaskan($id)
    {
        try {
            DB::beginTransaction();

            $transaksi = Transaksi::findOrFail($id);

            if ($transaksi->status_pembayaran === 'lunas') {
                return redirect()->back()->withErrors(['error' => 'Transaksi ini sudah berstatus lunas.']);
            }

            $transaksi->status_pembayaran = 'lunas';
            $transaksi->save();

            // Kurangi hutang pada data pelanggan
            if ($transaksi->id_pelanggan) {
                $pelanggan = Pelanggan::find($transaksi->id_pelanggan);
                if ($pelanggan) {
                    $pelanggan->total_hutang = max(0, $pelanggan->total_hutang - $transaksi->total_belanja);
                    $pelanggan->save();
                }
            }

            DB::commit();

            return redirect()->back()->with('success', "Hutang untuk transaksi #TRX-" . str_pad($transaksi->id_transaksi, 4, '0', STR_PAD_LEFT) . " berhasil dilunasi.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal melunasi transaksi: ' . $e->getMessage()]);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $transaksi = Transaksi::with('detailTransaksi')->findOrFail($id);

            // Jika sudah berstatus void atau retur, cegah pengembalian dobel
            if (in_array($transaksi->status_transaksi, ['void', 'retur'])) {
                return redirect()->back()->withErrors(['error' => 'Transaksi ini sudah berstatus ' . strtoupper($transaksi->status_transaksi) . '.']);
            }

            // Kembalikan stok barang
            foreach ($transaksi->detailTransaksi as $detail) {
                $barang = Barang::find($detail->id_barang);
                if ($barang) {
                    $barang->stok += $detail->jumlah;
                    $barang->save();
                }
            }

            // Jika statusnya belum lunas (hutang), kurangi hutang pelanggan
            if ($transaksi->status_pembayaran === 'belum_lunas' && $transaksi->id_pelanggan) {
                $pelanggan = Pelanggan::find($transaksi->id_pelanggan);
                if ($pelanggan) {
                    $pelanggan->total_hutang = max(0, $pelanggan->total_hutang - $transaksi->total_belanja);
                    $pelanggan->save();
                }
            }

            $actionType = $request->input('action_type') === 'retur' ? 'retur' : 'void';
            $alasan = $request->input('alasan_batal') ?? ($actionType === 'retur' ? 'Retur barang oleh pelanggan' : 'Dibatalkan (Void) oleh kasir');

            $transaksi->status_transaksi = $actionType;
            $transaksi->catatan_batal = $alasan;
            $transaksi->save();

            DB::commit();

            return redirect()->back()->with('success', 'Transaksi berhasil di-' . strtoupper($actionType) . ' dan stok telah dikembalikan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal membatalkan transaksi: ' . $e->getMessage()]);
        }
    }
}
