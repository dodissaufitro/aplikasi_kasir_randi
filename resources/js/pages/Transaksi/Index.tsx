import { Head, router } from '@inertiajs/react';
import { 
    Receipt, 
    Search, 
    Eye, 
    CheckCircle, 
    Trash2, 
    Printer, 
    X,
    Filter,
    DollarSign,
    Clock,
    AlertCircle,
    Calendar,
    FileSpreadsheet,
    Download,
    RotateCcw
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';

interface Barang {
    id_barang: number;
    nama_barang: string;
    harga_jual: number;
}

interface DetailTransaksi {
    id_detail: number;
    id_transaksi: number;
    id_barang: number;
    jumlah: number;
    harga_satuan: number;
    subtotal: number;
    barang?: Barang;
}

interface Pelanggan {
    id_pelanggan: number;
    nama_pelanggan: string;
    no_telp: string;
}

interface Transaksi {
    id_transaksi: number;
    tanggal: string;
    jenis_pembayaran: string;
    id_pelanggan: number | null;
    total_belanja: number;
    status_pembayaran: string;
    status_transaksi?: string;
    catatan_batal?: string;
    pelanggan?: Pelanggan;
    detail_transaksi?: DetailTransaksi[];
}

interface Props {
    auth: {
        user: {
            username: string;
            nama_lengkap: string;
            role: string;
        }
    };
    transaksi: Transaksi[];
    filters?: {
        tanggal_mulai?: string;
        tanggal_selesai?: string;
        status?: string;
    };
    flash: {
        success?: string;
        error?: string;
    };
}

export default function TransaksiIndex({ auth, transaksi, filters, flash }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [tanggalMulai, setTanggalMulai] = useState(filters?.tanggal_mulai || '');
    const [tanggalSelesai, setTanggalSelesai] = useState(filters?.tanggal_selesai || '');
    const [selectedTrx, setSelectedTrx] = useState<Transaksi | null>(null);

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    // Filter preset helper
    const setPresetToday = () => {
        const today = new Date().toISOString().slice(0, 10);
        setTanggalMulai(today);
        setTanggalSelesai(today);
    };

    const setPreset7Days = () => {
        const today = new Date();
        const prior = new Date();
        prior.setDate(today.getDate() - 7);
        setTanggalMulai(prior.toISOString().slice(0, 10));
        setTanggalSelesai(today.toISOString().slice(0, 10));
    };

    const setPresetThisMonth = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const today = now.toISOString().slice(0, 10);
        setTanggalMulai(firstDay);
        setTanggalSelesai(today);
    };

    const resetFilters = () => {
        setTanggalMulai('');
        setTanggalSelesai('');
        setStatusFilter('all');
        setSearch('');
    };

    // Filter data di browser
    const filteredTransaksi = useMemo(() => {
        return transaksi.filter(t => {
            const matchesSearch = 
                t.id_transaksi.toString().includes(search) ||
                (t.pelanggan && t.pelanggan.nama_pelanggan.toLowerCase().includes(search.toLowerCase())) ||
                (!t.pelanggan && 'pelanggan umum'.includes(search.toLowerCase()));

            const matchesStatus = 
                statusFilter === 'all' || 
                t.status_pembayaran === statusFilter ||
                t.jenis_pembayaran === statusFilter;

            const trxDate = t.tanggal ? t.tanggal.slice(0, 10) : '';
            const matchesStartDate = !tanggalMulai || trxDate >= tanggalMulai;
            const matchesEndDate = !tanggalSelesai || trxDate <= tanggalSelesai;

            return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
        });
    }, [transaksi, search, statusFilter, tanggalMulai, tanggalSelesai]);

    // Link unduh file report Excel
    const excelDownloadUrl = useMemo(() => {
        const params = new URLSearchParams();
        if (tanggalMulai) params.set('tanggal_mulai', tanggalMulai);
        if (tanggalSelesai) params.set('tanggal_selesai', tanggalSelesai);
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
        return `/transaksi/export?${params.toString()}`;
    }, [tanggalMulai, tanggalSelesai, statusFilter]);

    // Statistics berdasarkan data tersaring (hanya transaksi selesai yang dihitung ke omzet & piutang)
    const totalOmzet = useMemo(() => filteredTransaksi.filter(t => !t.status_transaksi || t.status_transaksi === 'selesai').reduce((acc, t) => acc + Number(t.total_belanja), 0), [filteredTransaksi]);
    const totalPiutang = useMemo(() => filteredTransaksi.filter(t => (!t.status_transaksi || t.status_transaksi === 'selesai') && t.status_pembayaran !== 'lunas').reduce((acc, t) => acc + Number(t.total_belanja), 0), [filteredTransaksi]);

    // Pelunasan Hutang
    const handleLunaskan = (id: number) => {
        if (confirm(`Lunaskan pembayaran untuk transaksi #TRX-${id.toString().padStart(4, '0')}?`)) {
            router.post(route('transaksi.lunaskan', id));
        }
    };

    // Hapus Transaksi
    const handleDelete = (id: number) => {
        if (confirm(`Yakin ingin menghapus data transaksi #TRX-${id.toString().padStart(4, '0')}? Data transaksi akan dihapus dan stok barang yang terjual akan dikembalikan.`)) {
            router.delete(route('transaksi.destroy', id));
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
            <Head title="Riwayat Transaksi - Kasir Pro" />

            {/* Sidebar Terpadu */}
            <Sidebar auth={auth} />

            {/* Area Utama */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <Receipt className="w-6 h-6 text-indigo-600" /> Riwayat Transaksi Penjualan
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pantau, filter tanggal, dan unduh laporan transaksi kasir lengkap.</p>
                    </div>
                    <div>
                        {/* Tombol Download Report Excel */}
                        <a
                            href={excelDownloadUrl}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200 dark:shadow-none transition-all flex items-center gap-2"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Download Laporan Excel (.xlsx)</span>
                        </a>
                    </div>
                </header>

                {/* Konten Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Flash Alert */}
                    {flash?.success && (
                        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-100 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 font-medium text-xs border border-rose-100 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {flash.error}
                        </div>
                    )}

                    {/* Toolbar Search, Filter Tanggal & Status */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                <Filter className="w-4 h-4 text-indigo-600" />
                                <span>Filter Laporan Transaksi</span>
                            </div>

                            {/* Preset Buttons Cepat */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] text-slate-400 font-medium mr-1">Preset:</span>
                                <button
                                    onClick={setPresetToday}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-lg transition-colors"
                                >
                                    Hari Ini
                                </button>
                                <button
                                    onClick={setPreset7Days}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-lg transition-colors"
                                >
                                    7 Hari Terakhir
                                </button>
                                <button
                                    onClick={setPresetThisMonth}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-lg transition-colors"
                                >
                                    Bulan Ini
                                </button>
                                {(tanggalMulai || tanggalSelesai || statusFilter !== 'all' || search) && (
                                    <button
                                        onClick={resetFilters}
                                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Controls Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                            {/* Input Tanggal Mulai */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-indigo-500" /> Dari Tanggal
                                </label>
                                <input 
                                    type="date" 
                                    value={tanggalMulai}
                                    onChange={(e) => setTanggalMulai(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                />
                            </div>

                            {/* Input Tanggal Selesai */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-indigo-500" /> Sampai Tanggal
                                </label>
                                <input 
                                    type="date" 
                                    value={tanggalSelesai}
                                    onChange={(e) => setTanggalSelesai(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                />
                            </div>

                            {/* Status & Metode */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Status / Metode
                                </label>
                                <select 
                                    value={statusFilter} 
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                >
                                    <option value="all">Semua Status & Metode</option>
                                    <option value="lunas">Hanya Lunas</option>
                                    <option value="belum_lunas">Hanya Hutang (Belum Lunas)</option>
                                    <option value="tunai">Metode Tunai</option>
                                    <option value="hutang">Metode Hutang</option>
                                </select>
                            </div>

                            {/* Search ID/Pelanggan */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Pencarian
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input 
                                        type="text"
                                        placeholder="Cari ID TRX atau pelanggan..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ringkasan Singkat Hasil Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Penjualan (Tersaring)</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatRupiah(totalOmzet)}</h3>
                            </div>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah Transaksi</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{filteredTransaksi.length} Transaksi</h3>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Piutang Belum Lunas</p>
                                <h3 className="text-2xl font-black text-rose-600 mt-1">{formatRupiah(totalPiutang)}</h3>
                            </div>
                            <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Tabel Transaksi */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6">ID Transaksi</th>
                                        <th className="py-4 px-6">Tanggal & Waktu</th>
                                        <th className="py-4 px-6">Pelanggan</th>
                                        <th className="py-4 px-6">Metode</th>
                                        <th className="py-4 px-6">Total Belanja</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransaksi.length > 0 ? (
                                        filteredTransaksi.map(t => (
                                            <tr key={t.id_transaksi} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                    #TRX-{t.id_transaksi.toString().padStart(4, '0')}
                                                </td>
                                                <td className="py-4 px-6 text-slate-500">
                                                    {new Date(t.tanggal).toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">
                                                    {t.pelanggan ? t.pelanggan.nama_pelanggan : <span className="text-slate-400">Pelanggan Umum</span>}
                                                </td>
                                                <td className="py-4 px-6 capitalize">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                                        t.jenis_pembayaran === 'tunai' 
                                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                                            : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                    }`}>
                                                        {t.jenis_pembayaran}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                    {formatRupiah(Number(t.total_belanja))}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        {t.status_transaksi && t.status_transaksi !== 'selesai' && (
                                                            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-md font-bold text-[10px] uppercase">
                                                                {t.status_transaksi}
                                                            </span>
                                                        )}
                                                        {t.status_pembayaran === 'lunas' ? (
                                                            <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-bold text-[10px]">
                                                                Lunas
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full font-bold text-[10px]">
                                                                Belum Lunas
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button 
                                                            onClick={() => setSelectedTrx(t)}
                                                            title="Lihat Detail Item"
                                                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>

                                                        {t.status_pembayaran === 'belum_lunas' && (!t.status_transaksi || t.status_transaksi === 'selesai') && (
                                                            <button 
                                                                onClick={() => handleLunaskan(t.id_transaksi)}
                                                                title="Tandai Sudah Lunas"
                                                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}

                                                        <button 
                                                            onClick={() => handleDelete(t.id_transaksi)}
                                                            title="Hapus Transaksi"
                                                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-400">
                                                Tidak ada riwayat transaksi yang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal Detail Transaksi & Struk */}
            {selectedTrx && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                    Detail Transaksi #TRX-{selectedTrx.id_transaksi.toString().padStart(4, '0')}
                                </h3>
                                <p className="text-xs text-slate-400">{new Date(selectedTrx.tanggal).toLocaleString('id-ID')}</p>
                            </div>
                            <button onClick={() => setSelectedTrx(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Customer Info */}
                        <div className="py-3 text-xs space-y-1 text-slate-600 dark:text-slate-300 border-b border-dashed border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between">
                                <span>Pelanggan:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {selectedTrx.pelanggan ? selectedTrx.pelanggan.nama_pelanggan : 'Pelanggan Umum'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Metode:</span>
                                <span className="font-bold uppercase text-indigo-600">{selectedTrx.jenis_pembayaran}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Status:</span>
                                <span className={`font-bold capitalize ${selectedTrx.status_pembayaran === 'lunas' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {selectedTrx.status_pembayaran}
                                </span>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="py-3 space-y-2 max-h-56 overflow-y-auto border-b border-dashed border-slate-200 dark:border-slate-700">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Daftar Barang Belanja:</h4>
                            {selectedTrx.detail_transaksi && selectedTrx.detail_transaksi.length > 0 ? (
                                selectedTrx.detail_transaksi.map((d) => (
                                    <div key={d.id_detail} className="flex justify-between text-xs">
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                {d.barang ? d.barang.nama_barang : `Barang #${d.id_barang}`}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {d.jumlah} x {formatRupiah(Number(d.harga_satuan))}
                                            </p>
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {formatRupiah(Number(d.subtotal))}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 text-center py-2">Tidak ada rincian barang.</p>
                            )}
                        </div>

                        {/* Total */}
                        <div className="py-3 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                            <span>Total Tagihan:</span>
                            <span className="text-lg text-indigo-600 dark:text-indigo-400">{formatRupiah(Number(selectedTrx.total_belanja))}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-4 flex gap-2">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Printer className="w-4 h-4" /> Cetak Nota
                            </button>
                            <button
                                onClick={() => setSelectedTrx(null)}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
