import { Head, router } from '@inertiajs/react';
import { 
    BarChart3, 
    TrendingUp, 
    Receipt, 
    Package, 
    DollarSign, 
    Calendar, 
    Download, 
    Printer, 
    FileSpreadsheet, 
    FileText, 
    ArrowUpRight, 
    ArrowDownRight, 
    Clock, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    RefreshCcw, 
    Layers, 
    Wallet, 
    CreditCard, 
    Boxes, 
    Search,
    ChevronRight,
    HelpCircle
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';

interface Props {
    auth: {
        user: {
            username: string;
            nama_lengkap: string;
            role: string;
            menu_access?: string[] | null;
            effective_menu_access?: string[];
        };
    };
    tab: 'penjualan' | 'transaksi' | 'produk' | 'keuangan';
    periode: 'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'custom';
    tanggal_mulai: string;
    tanggal_selesai: string;
    sub_filter: string;
    laporan_penjualan?: {
        metrics: {
            total_omzet: number;
            total_transaksi: number;
            rata_rata_transaksi: number;
            total_item_terjual: number;
            total_hpp: number;
            total_laba_kotor: number;
        };
        breakdown_harian: Array<{
            tanggal: string;
            label: string;
            hari: string;
            total_transaksi: number;
            total_omzet: number;
        }>;
        top_produk: Array<{
            id_barang: number;
            kode_barang: string;
            nama_barang: string;
            total_qty: number;
            total_omzet: number;
        }>;
        transaksi_terbaru: Array<any>;
    };
    laporan_transaksi?: {
        metrics: {
            semua: { count: number; nominal: number };
            lunas: { count: number; nominal: number };
            belum_lunas: { count: number; nominal: number };
            void: { count: number; nominal: number };
            retur: { count: number; nominal: number };
        };
        daftar_transaksi: Array<any>;
    };
    laporan_produk?: {
        metrics: {
            total_produk: number;
            total_terjual: number;
            stok_menipis: number;
            stok_habis: number;
        };
        daftar_produk: Array<{
            id_barang: number;
            kode_barang: string;
            nama_barang: string;
            harga_beli: number;
            harga_jual: number;
            stok: number;
            qty_terjual: number;
            omzet_produk: number;
            estimasi_laba: number;
            status_stok: 'habis' | 'menipis' | 'tersedia';
        }>;
    };
    laporan_keuangan?: {
        metrics: {
            kas_masuk: number;
            kas_keluar: number;
            total_omzet: number;
            piutang_periode: number;
            total_piutang_aktif: number;
            hutang: number;
            hpp_terjual: number;
            nilai_aset_stok: number;
            laba_kotor: number;
            laba_bersih: number;
        };
        arus_kas_harian: Array<{
            tgl: string;
            kategori: string;
            tipe: 'masuk' | 'keluar';
            nominal: number;
            total_catatan: number;
        }>;
    };
}

export default function LaporanIndex({
    auth,
    tab = 'penjualan',
    periode = 'bulanan',
    tanggal_mulai,
    tanggal_selesai,
    sub_filter = 'all',
    laporan_penjualan,
    laporan_transaksi,
    laporan_produk,
    laporan_keuangan
}: Props) {
    const [selectedTab, setSelectedTab] = useState(tab);
    const [selectedPeriode, setSelectedPeriode] = useState(periode);
    const [startDate, setStartDate] = useState(tanggal_mulai || '');
    const [endDate, setEndDate] = useState(tanggal_selesai || '');
    const [subFilterState, setSubFilterState] = useState(sub_filter || 'all');
    const [searchKeyword, setSearchKeyword] = useState('');

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleApplyFilter = (overrideParams: Record<string, any> = {}) => {
        const params: Record<string, any> = {
            tab: selectedTab,
            periode: selectedPeriode,
            tanggal_mulai: startDate,
            tanggal_selesai: endDate,
            sub_filter: subFilterState,
            ...overrideParams,
        };

        router.get('/laporan', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const switchTab = (newTab: 'penjualan' | 'transaksi' | 'produk' | 'keuangan') => {
        setSelectedTab(newTab);
        const defaultSub = newTab === 'transaksi' ? 'all' : newTab === 'produk' ? 'all' : 'all';
        setSubFilterState(defaultSub);
        handleApplyFilter({ tab: newTab, sub_filter: defaultSub });
    };

    const handlePeriodChange = (newPeriod: 'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'custom') => {
        setSelectedPeriode(newPeriod);
        handleApplyFilter({ periode: newPeriod });
    };

    const handleSubFilterChange = (newSub: string) => {
        setSubFilterState(newSub);
        handleApplyFilter({ sub_filter: newSub });
    };

    const handlePrint = () => {
        window.print();
    };

    // Query parameters string for Excel and CSV export URLs
    const exportQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('tab', selectedTab);
        params.set('periode', selectedPeriode);
        if (startDate) params.set('tanggal_mulai', startDate);
        if (endDate) params.set('tanggal_selesai', endDate);
        if (subFilterState) params.set('sub_filter', subFilterState);
        return params.toString();
    }, [selectedTab, selectedPeriode, startDate, endDate, subFilterState]);

    const excelUrl = `/laporan/export-excel?${exportQueryString}`;
    const csvUrl = `/laporan/export-csv?${exportQueryString}`;

    // Filtered items based on search keyword
    const filteredTransaksi = useMemo(() => {
        if (!laporan_transaksi?.daftar_transaksi) return [];
        if (!searchKeyword.trim()) return laporan_transaksi.daftar_transaksi;
        const kw = searchKeyword.toLowerCase();
        return laporan_transaksi.daftar_transaksi.filter(trx => 
            String(trx.id_transaksi).includes(kw) ||
            (trx.pelanggan?.nama_pelanggan || '').toLowerCase().includes(kw) ||
            (trx.catatan_batal || '').toLowerCase().includes(kw)
        );
    }, [laporan_transaksi, searchKeyword]);

    const filteredProduk = useMemo(() => {
        if (!laporan_produk?.daftar_produk) return [];
        if (!searchKeyword.trim()) return laporan_produk.daftar_produk;
        const kw = searchKeyword.toLowerCase();
        return laporan_produk.daftar_produk.filter(p => 
            p.nama_barang.toLowerCase().includes(kw) ||
            p.kode_barang.toLowerCase().includes(kw)
        );
    }, [laporan_produk, searchKeyword]);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
            <Head title="Modul Laporan (Active Report) - KasirPro" />

            {/* Sidebar (Hidden when printing) */}
            <div className="print:hidden h-full">
                <Sidebar auth={auth} />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Control Bar & Header (Hidden when printing) */}
                <header className="print:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                        Modul Laporan
                                        <span className="text-[11px] font-semibold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                            Active Report
                                        </span>
                                    </h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Laporan interaktif dengan filter waktu dinamis dan ekspor siap cetak
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Export & Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={excelUrl}
                                download
                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all"
                                title="Download Laporan Excel (.xlsx)"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                <span>Download Excel</span>
                            </a>

                            <a
                                href={csvUrl}
                                download
                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-xs hover:shadow-md transition-all"
                                title="Download Laporan Format CSV"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download CSV</span>
                            </a>

                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all"
                                title="Cetak Laporan Siap Pakai"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 mt-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto pb-0.5 scrollbar-none">
                        {[
                            { id: 'penjualan', label: 'Laporan Penjualan', icon: TrendingUp },
                            { id: 'transaksi', label: 'Laporan Transaksi', icon: Receipt },
                            { id: 'produk', label: 'Laporan Produk', icon: Package },
                            { id: 'keuangan', label: 'Laporan Keuangan', icon: DollarSign },
                        ].map((t) => {
                            const Icon = t.icon;
                            const isActive = selectedTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => switchTab(t.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                                        isActive
                                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </header>

                {/* Print Header (Visible ONLY on print output) */}
                <div className="hidden print:block p-8 border-b-2 border-slate-900 text-slate-900">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-wider">KASIRPRO - POINT OF SALE</h1>
                            <p className="text-sm font-semibold text-slate-600">Sistem Aplikasi Kasir & Manajemen Toko</p>
                            <h2 className="text-lg font-bold mt-2 uppercase text-indigo-900">
                                Laporan {selectedTab}
                            </h2>
                        </div>
                        <div className="text-right text-xs space-y-1">
                            <p className="font-bold">Periode: {startDate} s/d {endDate} ({selectedPeriode.toUpperCase()})</p>
                            <p>Waktu Cetak: {new Date().toLocaleString('id-ID')}</p>
                            <p>Dicetak Oleh: {auth.user.nama_lengkap} ({auth.user.role})</p>
                        </div>
                    </div>
                </div>

                {/* Filter & Control Bar (Interactive UI, hidden in print) */}
                <div className="print:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Periode Preset Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl">
                            {[
                                { id: 'harian', label: 'Harian' },
                                { id: 'mingguan', label: 'Mingguan' },
                                { id: 'bulanan', label: 'Bulanan' },
                                { id: 'tahunan', label: 'Tahunan' },
                                { id: 'custom', label: 'Custom Tanggal' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePeriodChange(p.id as any)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                        selectedPeriode === p.id
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Date Range Inputs & Apply */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setSelectedPeriode('custom');
                                    }}
                                    className="bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden p-0"
                                />
                                <span className="text-slate-400">s/d</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setSelectedPeriode('custom');
                                    }}
                                    className="bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden p-0"
                                />
                            </div>

                            <button
                                onClick={() => handleApplyFilter()}
                                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>

                    {/* Sub-Filters specific to the tab */}
                    {selectedTab === 'transaksi' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter Status:</span>
                            {[
                                { id: 'all', label: 'Semua Transaksi' },
                                { id: 'lunas', label: 'Lunas' },
                                { id: 'belum_lunas', label: 'Belum Lunas' },
                                { id: 'void', label: 'Void (Batal)' },
                                { id: 'retur', label: 'Retur' },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => handleSubFilterChange(f.id)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                                        subFilterState === f.id
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedTab === 'produk' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Kategori Analisis:</span>
                            {[
                                { id: 'all', label: 'Semua Produk' },
                                { id: 'terlaris', label: 'Produk Terlaris' },
                                { id: 'terendah', label: 'Paling Sedikit Terjual' },
                                { id: 'menipis', label: 'Stok Menipis (<= 5)' },
                                { id: 'habis', label: 'Stok Habis (0)' },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => handleSubFilterChange(f.id)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                                        subFilterState === f.id
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Scrollable Report Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* ========================================================================= */}
                    {/* 1. TAB LAPORAN PENJUALAN */}
                    {/* ========================================================================= */}
                    {selectedTab === 'penjualan' && laporan_penjualan && (
                        <div className="space-y-6">
                            {/* KPI Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Omzet Penjualan</p>
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                                        {formatRupiah(laporan_penjualan.metrics.total_omzet)}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Dari {laporan_penjualan.metrics.total_transaksi} transaksi selesai
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transaksi Selesai</p>
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                                            <Receipt className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                                        {laporan_penjualan.metrics.total_transaksi}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Rata-rata: {formatRupiah(laporan_penjualan.metrics.rata_rata_transaksi)} / nota
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item Barang Terjual</p>
                                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
                                            <Package className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                                        {laporan_penjualan.metrics.total_item_terjual} <span className="text-xs font-semibold text-slate-400">pcs</span>
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Total kuantitas barang keluar
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimasi Laba Kotor</p>
                                        <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
                                        {formatRupiah(laporan_penjualan.metrics.total_laba_kotor)}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        HPP Pokok: {formatRupiah(laporan_penjualan.metrics.total_hpp)}
                                    </p>
                                </div>
                            </div>

                            {/* Penjualan Harian Breakdown & Top Products */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Table Breakdown Harian */}
                                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                                        <span>Rincian Penjualan Harian</span>
                                        <span className="text-xs font-normal text-slate-400">
                                            {laporan_penjualan.breakdown_harian.length} Hari Aktif Transaksi
                                        </span>
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                                                    <th className="pb-3 font-bold">Tanggal</th>
                                                    <th className="pb-3 font-bold">Hari</th>
                                                    <th className="pb-3 font-bold text-center">Jumlah Trx</th>
                                                    <th className="pb-3 font-bold text-right">Total Omzet</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {laporan_penjualan.breakdown_harian.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="py-8 text-center text-slate-400">
                                                            Tidak ada catatan penjualan pada periode ini.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    laporan_penjualan.breakdown_harian.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                            <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{row.label}</td>
                                                            <td className="py-3 text-slate-500">{row.hari}</td>
                                                            <td className="py-3 text-center font-semibold text-indigo-600 dark:text-indigo-400">{row.total_transaksi} nota</td>
                                                            <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{formatRupiah(row.total_omzet)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Top 5 Produk Terlaris Periode Ini */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                                        Top 5 Produk Terlaris
                                    </h3>
                                    <div className="space-y-3">
                                        {laporan_penjualan.top_produk.length === 0 ? (
                                            <p className="text-xs text-slate-400 py-6 text-center">Belum ada data barang terjual</p>
                                        ) : (
                                            laporan_penjualan.top_produk.map((p, idx) => (
                                                <div key={p.id_barang} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                                                            {idx + 1}
                                                        </span>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.nama_barang}</p>
                                                            <span className="text-[10px] text-slate-400">{p.kode_barang}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-emerald-600">{p.total_qty} terjual</p>
                                                        <p className="text-[10px] text-slate-400">{formatRupiah(p.total_omzet)}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 2. TAB LAPORAN TRANSAKSI */}
                    {/* ========================================================================= */}
                    {selectedTab === 'transaksi' && laporan_transaksi && (
                        <div className="space-y-6">
                            {/* Summary Metrics by Status */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                <div 
                                    onClick={() => handleSubFilterChange('all')}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        subFilterState === 'all' 
                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' 
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                    }`}
                                >
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Semua Transaksi</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                        {laporan_transaksi.metrics.semua.count}
                                    </p>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                        {formatRupiah(laporan_transaksi.metrics.semua.nominal)}
                                    </p>
                                </div>

                                <div 
                                    onClick={() => handleSubFilterChange('lunas')}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        subFilterState === 'lunas' 
                                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30' 
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                    }`}
                                >
                                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Lunas</p>
                                    <p className="text-xl font-black text-emerald-600 mt-1">
                                        {laporan_transaksi.metrics.lunas.count}
                                    </p>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                        {formatRupiah(laporan_transaksi.metrics.lunas.nominal)}
                                    </p>
                                </div>

                                <div 
                                    onClick={() => handleSubFilterChange('belum_lunas')}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        subFilterState === 'belum_lunas' 
                                            ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30' 
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                    }`}
                                >
                                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Belum Lunas (Kredit)</p>
                                    <p className="text-xl font-black text-amber-600 mt-1">
                                        {laporan_transaksi.metrics.belum_lunas.count}
                                    </p>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                        {formatRupiah(laporan_transaksi.metrics.belum_lunas.nominal)}
                                    </p>
                                </div>

                                <div 
                                    onClick={() => handleSubFilterChange('void')}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        subFilterState === 'void' 
                                            ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/30' 
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                    }`}
                                >
                                    <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Void (Batal)</p>
                                    <p className="text-xl font-black text-rose-600 mt-1">
                                        {laporan_transaksi.metrics.void.count}
                                    </p>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                        {formatRupiah(laporan_transaksi.metrics.void.nominal)}
                                    </p>
                                </div>

                                <div 
                                    onClick={() => handleSubFilterChange('retur')}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        subFilterState === 'retur' 
                                            ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30' 
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                    }`}
                                >
                                    <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Retur Barang</p>
                                    <p className="text-xl font-black text-purple-600 mt-1">
                                        {laporan_transaksi.metrics.retur.count}
                                    </p>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                        {formatRupiah(laporan_transaksi.metrics.retur.nominal)}
                                    </p>
                                </div>
                            </div>

                            {/* Table of Transactions */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Daftar Transaksi Kasir ({filteredTransaksi.length} Data)
                                    </h3>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={searchKeyword}
                                            onChange={(e) => setSearchKeyword(e.target.value)}
                                            placeholder="Cari ID / Pelanggan..."
                                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                                                <th className="pb-3 font-bold">ID Transaksi</th>
                                                <th className="pb-3 font-bold">Waktu</th>
                                                <th className="pb-3 font-bold">Pelanggan</th>
                                                <th className="pb-3 font-bold">Barang Belanja</th>
                                                <th className="pb-3 font-bold text-right">Total</th>
                                                <th className="pb-3 font-bold text-center">Metode</th>
                                                <th className="pb-3 font-bold text-center">Status Bayar</th>
                                                <th className="pb-3 font-bold text-center">Status Trx</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredTransaksi.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="py-8 text-center text-slate-400">
                                                        Tidak ada data transaksi yang cocok dengan kriteria filter.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredTransaksi.map((trx) => (
                                                    <tr key={trx.id_transaksi} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                        <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                            #TRX-{String(trx.id_transaksi).padStart(5, '0')}
                                                        </td>
                                                        <td className="py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                            {new Date(trx.tanggal).toLocaleString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                                                            {trx.pelanggan?.nama_pelanggan || 'Pelanggan Umum'}
                                                        </td>
                                                        <td className="py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                                            {trx.detail_transaksi?.map((d: any) => `${d.barang?.nama_barang || 'Item'} (${d.jumlah}x)`).join(', ')}
                                                        </td>
                                                        <td className="py-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                            {formatRupiah(trx.total_belanja)}
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                                {trx.jenis_pembayaran}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                trx.status_pembayaran === 'lunas'
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                                            }`}>
                                                                {trx.status_pembayaran === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                trx.status_transaksi === 'void'
                                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                                                    : trx.status_transaksi === 'retur'
                                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            }`}>
                                                                {trx.status_transaksi || 'selesai'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 3. TAB LAPORAN PRODUK */}
                    {/* ========================================================================= */}
                    {selectedTab === 'produk' && laporan_produk && (
                        <div className="space-y-6">
                            {/* Product Inventory & Sales Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div 
                                    onClick={() => handleSubFilterChange('all')}
                                    className={`bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-xs cursor-pointer transition-all ${
                                        subFilterState === 'all' ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Katalog Barang</p>
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                                            <Package className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                                        {laporan_produk.metrics.total_produk} <span className="text-xs font-normal text-slate-400">item</span>
                                    </p>
                                </div>

                                <div 
                                    onClick={() => handleSubFilterChange('terlaris')}
                                    className={`bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-xs cursor-pointer transition-all ${
                                        subFilterState === 'terlaris' ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Item Terjual</p>
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-600 mt-2">
                                        {laporan_produk.metrics.total_terjual} <span className="text-xs font-normal text-slate-400">pcs</span>
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">Klik untuk urutkan Terlaris</p>
                                </div>

                                <div 
                                    onClick={() => handleSubFilterChange('menipis')}
                                    className={`bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-xs cursor-pointer transition-all ${
                                        subFilterState === 'menipis' ? 'border-amber-600 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Stok Menipis (≤ 5)</p>
                                        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-amber-600 mt-2">
                                        {laporan_produk.metrics.stok_menipis} <span className="text-xs font-normal text-slate-400">produk</span>
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">Perlu restok segera</p>
                                </div>

                                <div 
                                    onClick={() => handleSubFilterChange('habis')}
                                    className={`bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-xs cursor-pointer transition-all ${
                                        subFilterState === 'habis' ? 'border-rose-600 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Stok Habis (0)</p>
                                        <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
                                            <XCircle className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-rose-600 mt-2">
                                        {laporan_produk.metrics.stok_habis} <span className="text-xs font-normal text-slate-400">produk</span>
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">Stok kosong tidak bisa dijual</p>
                                </div>
                            </div>

                            {/* Products Table */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Analisis Produk & Status Stok ({filteredProduk.length} Produk)
                                    </h3>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={searchKeyword}
                                            onChange={(e) => setSearchKeyword(e.target.value)}
                                            placeholder="Cari Kode / Nama Produk..."
                                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                                                <th className="pb-3 font-bold">Kode Barang</th>
                                                <th className="pb-3 font-bold">Nama Produk</th>
                                                <th className="pb-3 font-bold text-right">Harga Beli</th>
                                                <th className="pb-3 font-bold text-right">Harga Jual</th>
                                                <th className="pb-3 font-bold text-center">Sisa Stok</th>
                                                <th className="pb-3 font-bold text-center">Terjual (Qty)</th>
                                                <th className="pb-3 font-bold text-right">Total Omzet</th>
                                                <th className="pb-3 font-bold text-right">Estimasi Laba</th>
                                                <th className="pb-3 font-bold text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredProduk.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="py-8 text-center text-slate-400">
                                                        Tidak ada produk yang memenuhi kriteria filter.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredProduk.map((p) => (
                                                    <tr key={p.id_barang} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                        <td className="py-3 font-mono text-slate-500 font-semibold">{p.kode_barang}</td>
                                                        <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{p.nama_barang}</td>
                                                        <td className="py-3 text-right text-slate-500">{formatRupiah(p.harga_beli)}</td>
                                                        <td className="py-3 text-right font-semibold text-slate-800 dark:text-slate-200">{formatRupiah(p.harga_jual)}</td>
                                                        <td className="py-3 text-center">
                                                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-xs ${
                                                                p.stok === 0
                                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                                                    : p.stok <= 5
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            }`}>
                                                                {p.stok}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                                                            {p.qty_terjual}
                                                        </td>
                                                        <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                                                            {formatRupiah(p.omzet_produk)}
                                                        </td>
                                                        <td className="py-3 text-right font-bold text-emerald-600">
                                                            {formatRupiah(p.estimasi_laba)}
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                p.status_stok === 'habis'
                                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                                                                    : p.status_stok === 'menipis'
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                                            }`}>
                                                                {p.status_stok}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 4. TAB LAPORAN KEUANGAN */}
                    {/* ========================================================================= */}
                    {selectedTab === 'keuangan' && laporan_keuangan && (
                        <div className="space-y-6">
                            {/* Key Financial Indicators */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Kas Masuk (Tunai)</p>
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                                            <ArrowDownRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-600 mt-2">
                                        {formatRupiah(laporan_keuangan.metrics.kas_masuk)}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">Uang riil masuk ke laci kasir</p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Kas Keluar (Restok)</p>
                                        <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
                                            <ArrowUpRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-rose-600 mt-2">
                                        {formatRupiah(laporan_keuangan.metrics.kas_keluar)}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">Belanja barang masuk periode ini</p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Laba Kotor (Gross)</p>
                                        <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-purple-600 mt-2">
                                        {formatRupiah(laporan_keuangan.metrics.laba_kotor)}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">Omzet - HPP Modal Terjual</p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Laba Bersih Riil</p>
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className={`text-2xl font-black mt-2 ${laporan_keuangan.metrics.laba_bersih >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                        {formatRupiah(laporan_keuangan.metrics.laba_bersih)}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">Laba kotor setelah dikurangi kas keluar</p>
                                </div>
                            </div>

                            {/* Detailed Balance & Position Sheet */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Neraca Posisi Modal, Piutang & Hutang */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                                        Posisi Modal, Piutang & Kewajiban
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Piutang Periode Ini</p>
                                                <p className="text-[10px] text-slate-400">Transaksi hutang pelanggan pada periode ini</p>
                                            </div>
                                            <span className="text-xs font-black text-amber-600">
                                                {formatRupiah(laporan_keuangan.metrics.piutang_periode)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Total Akumulasi Piutang Pelanggan</p>
                                                <p className="text-[10px] text-slate-400">Total buku hutang pelanggan aktif saat ini</p>
                                            </div>
                                            <span className="text-xs font-black text-amber-600">
                                                {formatRupiah(laporan_keuangan.metrics.total_piutang_aktif)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Hutang Usaha Toko</p>
                                                <p className="text-[10px] text-slate-400">Kewajiban berjalan toko kepada pihak luar</p>
                                            </div>
                                            <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                                                {formatRupiah(laporan_keuangan.metrics.hutang)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Modal HPP Terjual</p>
                                                <p className="text-[10px] text-slate-400">Harga pokok pembelian atas barang terjual</p>
                                            </div>
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                                {formatRupiah(laporan_keuangan.metrics.hpp_terjual)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                                            <div>
                                                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Nilai Aset Persediaan Stok Toko</p>
                                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400">Total modal inventaris barang di gudang & etalase</p>
                                            </div>
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                {formatRupiah(laporan_keuangan.metrics.nilai_aset_stok)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Buku Arus Kas Harian */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                                        Jurnal Arus Kas Masuk & Keluar
                                    </h3>
                                    <div className="overflow-y-auto max-h-80">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                                                    <th className="pb-3 font-bold">Tanggal</th>
                                                    <th className="pb-3 font-bold">Keterangan Arus Kas</th>
                                                    <th className="pb-3 font-bold text-center">Tipe</th>
                                                    <th className="pb-3 font-bold text-right">Nominal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {laporan_keuangan.arus_kas_harian.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="py-8 text-center text-slate-400">
                                                            Belum ada mutasi arus kas pada periode ini.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    laporan_keuangan.arus_kas_harian.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                            <td className="py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                                {new Date(row.tgl).toLocaleDateString('id-ID', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </td>
                                                            <td className="py-3 text-slate-800 dark:text-slate-200">
                                                                <p className="font-semibold">{row.kategori}</p>
                                                                <span className="text-[10px] text-slate-400">{row.total_catatan} transaksi</span>
                                                            </td>
                                                            <td className="py-3 text-center">
                                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                    row.tipe === 'masuk'
                                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                                                }`}>
                                                                    {row.tipe}
                                                                </span>
                                                            </td>
                                                            <td className={`py-3 text-right font-black whitespace-nowrap ${
                                                                row.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}>
                                                                {row.tipe === 'masuk' ? '+' : '-'}{formatRupiah(row.nominal)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Print Footer with Signatures (Visible ONLY on print output) */}
                <div className="hidden print:block p-8 pt-16 mt-8 border-t border-slate-300 text-xs">
                    <div className="flex justify-between text-center">
                        <div className="w-48">
                            <p className="text-slate-500 mb-16">Dibuat Oleh (Kasir/Admin),</p>
                            <p className="font-bold border-b border-slate-900 pb-1">{auth.user.nama_lengkap}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Role: {auth.user.role.toUpperCase()}</p>
                        </div>
                        <div className="w-48">
                            <p className="text-slate-500 mb-16">Mengetahui (Pemilik Toko),</p>
                            <p className="font-bold border-b border-slate-900 pb-1">( ............................................ )</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Owner / Manajer</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
