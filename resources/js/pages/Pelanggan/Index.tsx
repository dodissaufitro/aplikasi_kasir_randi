import { Head, useForm } from '@inertiajs/react';
import { 
    Users, 
    Plus,
    Edit,
    Trash2,
    X,
    CreditCard,
    Banknote,
    History,
    CheckCircle2,
    AlertTriangle,
    Search,
    Receipt,
    Wallet,
    Calendar,
    ArrowDownRight,
    UserCheck
} from 'lucide-react';
import { useState, useMemo } from 'react';

import Sidebar from '@/components/Sidebar';

interface PembayaranHutangItem {
    id_pembayaran: number;
    id_pelanggan: number;
    tanggal_bayar: string;
    nominal_bayar: number;
    sisa_hutang_setelahnya: number;
    metode_pembayaran: string;
    catatan?: string | null;
    user?: {
        id: number;
        nama_lengkap: string;
    };
}

interface TransaksiItem {
    id_transaksi: number;
    id_pelanggan: number;
    tanggal: string;
    total_belanja: number;
    jenis_pembayaran: string;
}

interface Pelanggan {
    id_pelanggan: number;
    nama_pelanggan: string;
    no_telp: string;
    total_hutang: number;
    pembayaran_hutang?: PembayaranHutangItem[];
    transaksi_belum_lunas?: TransaksiItem[];
}

interface Props {
    auth: {
        user: {
            username: string;
            nama_lengkap: string;
            role: string;
        }
    };
    pelanggan: Pelanggan[];
    stats?: {
        total_pelanggan: number;
        pelanggan_hutang: number;
        total_piutang: number;
    };
    flash: { success?: string; error?: string };
}

export default function PelangganIndex({ auth, pelanggan, stats, flash }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterHutang, setFilterHutang] = useState<'all' | 'hutang' | 'lunas'>('all');

    // State Modal Tambah/Edit Pelanggan
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // State Modal Bayar Hutang
    const [isBayarModalOpen, setIsBayarModalOpen] = useState(false);
    const [selectedPelanggan, setSelectedPelanggan] = useState<Pelanggan | null>(null);

    // State Modal Riwayat Pembayaran
    const [isRiwayatModalOpen, setIsRiwayatModalOpen] = useState(false);
    const [riwayatPelanggan, setRiwayatPelanggan] = useState<Pelanggan | null>(null);

    // Form Pelanggan
    const { 
        data: formData, 
        setData: setFormData, 
        post: postPelanggan, 
        put: putPelanggan, 
        delete: destroyPelanggan, 
        reset: resetPelanggan, 
        processing: processingPelanggan,
        errors: errorsPelanggan 
    } = useForm({
        nama_pelanggan: '',
        no_telp: '',
        total_hutang: '0'
    });

    // Form Bayar Hutang
    const { 
        data: bayarData, 
        setData: setBayarData, 
        post: postBayar, 
        reset: resetBayar, 
        processing: processingBayar,
        errors: errorsBayar 
    } = useForm({
        nominal_bayar: '',
        metode_pembayaran: 'tunai',
        catatan: ''
    });

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    // Filter list
    const filteredPelanggan = useMemo(() => {
        return pelanggan.filter(p => {
            const matchesSearch = p.nama_pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.no_telp && p.no_telp.includes(searchTerm));
            
            if (!matchesSearch) return false;

            if (filterHutang === 'hutang') return p.total_hutang > 0;
            if (filterHutang === 'lunas') return p.total_hutang <= 0;
            return true;
        });
    }, [pelanggan, searchTerm, filterHutang]);

    // Modal Create / Edit Pelanggan
    const openCreateModal = () => {
        setEditingId(null);
        resetPelanggan();
        setIsModalOpen(true);
    };

    const openEditModal = (p: Pelanggan) => {
        setEditingId(p.id_pelanggan);
        setFormData({
            nama_pelanggan: p.nama_pelanggan,
            no_telp: p.no_telp || '',
            total_hutang: p.total_hutang.toString()
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetPelanggan();
    };

    const handleSubmitPelanggan = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            putPelanggan(route('pelanggan.update', editingId), {
                onSuccess: () => closeModal()
            });
        } else {
            postPelanggan(route('pelanggan.store'), {
                onSuccess: () => closeModal()
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus pelanggan ini?')) {
            destroyPelanggan(route('pelanggan.destroy', id));
        }
    };

    // Modal Bayar Hutang
    const openBayarModal = (p: Pelanggan) => {
        setSelectedPelanggan(p);
        setBayarData({
            nominal_bayar: p.total_hutang.toString(),
            metode_pembayaran: 'tunai',
            catatan: ''
        });
        setIsBayarModalOpen(true);
    };

    const closeBayarModal = () => {
        setIsBayarModalOpen(false);
        setSelectedPelanggan(null);
        resetBayar();
    };

    const handleBayarLunasQuick = () => {
        if (selectedPelanggan) {
            setBayarData('nominal_bayar', selectedPelanggan.total_hutang.toString());
        }
    };

    const handleSubmitBayar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPelanggan) return;

        postBayar(route('pelanggan.bayar-hutang', selectedPelanggan.id_pelanggan), {
            onSuccess: () => closeBayarModal()
        });
    };

    // Modal Riwayat
    const openRiwayatModal = (p: Pelanggan) => {
        setRiwayatPelanggan(p);
        setIsRiwayatModalOpen(true);
    };

    // Hitung sisa hutang di modal bayar
    const nominalBayarNum = parseFloat(bayarData.nominal_bayar) || 0;
    const sisaHutangPreview = selectedPelanggan ? Math.max(0, selectedPelanggan.total_hutang - nominalBayarNum) : 0;
    const isLunasPreview = selectedPelanggan && nominalBayarNum >= selectedPelanggan.total_hutang;

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
            <Head title="Pelanggan & Hutang - Kasir Pro" />

            {/* Sidebar Terpadu */}
            <Sidebar auth={auth} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="w-6 h-6 text-indigo-600" />
                            Pelanggan & Hutang
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">Kelola buku kontak, piutang pelanggan, dan pembayaran hutang toko.</p>
                    </div>
                    <button 
                        onClick={openCreateModal} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all cursor-pointer"
                    >
                        <Plus className="w-5 h-5" /> 
                        <span>Tambah Pelanggan</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                    {/* Flash Message */}
                    {flash.success && (
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash.error && (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium border border-rose-200 dark:border-rose-800 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    {/* Ringkasan KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pelanggan</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                                    {stats?.total_pelanggan ?? pelanggan.length} <span className="text-sm font-normal text-slate-500">Kontak</span>
                                </h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pelanggan Berhutang</p>
                                <h3 className="text-2xl font-bold text-amber-600 mt-0.5">
                                    {stats?.pelanggan_hutang ?? pelanggan.filter(p => p.total_hutang > 0).length} <span className="text-sm font-normal text-slate-500">Orang</span>
                                </h3>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Piutang Toko</p>
                                <h3 className="text-2xl font-bold text-rose-600 mt-0.5">
                                    {formatRupiah(stats?.total_piutang ?? pelanggan.reduce((acc, p) => acc + (Number(p.total_hutang) || 0), 0))}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Pencarian Bar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Cari nama atau telepon..."
                                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setFilterHutang('all')}
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    filterHutang === 'all' 
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                Semua ({pelanggan.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterHutang('hutang')}
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                                    filterHutang === 'hutang' 
                                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs' 
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                Berhutang ({pelanggan.filter(p => p.total_hutang > 0).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterHutang('lunas')}
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    filterHutang === 'lunas' 
                                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                Bebas Hutang ({pelanggan.filter(p => p.total_hutang <= 0).length})
                            </button>
                        </div>
                    </div>
                    
                    {/* Table Data Pelanggan */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6">Pelanggan</th>
                                        <th className="py-4 px-6">No. Telepon</th>
                                        <th className="py-4 px-6">Total Hutang</th>
                                        <th className="py-4 px-6">Status Piutang</th>
                                        <th className="py-4 px-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {filteredPelanggan.length > 0 ? filteredPelanggan.map(p => (
                                        <tr key={p.id_pelanggan} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                                        {p.nama_pelanggan.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-white">{p.nama_pelanggan}</p>
                                                        <p className="text-xs text-slate-400">ID: #{p.id_pelanggan}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                                                {p.no_telp ? (
                                                    <span className="font-mono">{p.no_telp}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic">-</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                {p.total_hutang > 0 ? (
                                                    <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400 text-base">
                                                        <CreditCard className="w-4 h-4 text-rose-500" />
                                                        <span>{formatRupiah(p.total_hutang)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                                                        <CheckCircle2 className="w-4 h-4" /> Rp 0
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                {p.total_hutang > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                        Belum Lunas
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        Lunas / Bersih
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* TOMBOL BAYAR HUTANG */}
                                                    {p.total_hutang > 0 ? (
                                                        <button 
                                                            onClick={() => openBayarModal(p)} 
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-emerald-100 dark:hover:shadow-none transition-all cursor-pointer"
                                                            title="Proses Pembayaran Hutang"
                                                        >
                                                            <Banknote className="w-4 h-4" />
                                                            <span>Bayar Hutang</span>
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            disabled
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium rounded-lg cursor-not-allowed opacity-60"
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5" />
                                                            <span>Lunas</span>
                                                        </button>
                                                    )}

                                                    {/* TOMBOL RIWAYAT PEMBAYARAN */}
                                                    <button 
                                                        onClick={() => openRiwayatModal(p)} 
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                                                        title="Lihat Riwayat Pembayaran"
                                                    >
                                                        <History className="w-4 h-4" />
                                                    </button>

                                                    {/* TOMBOL EDIT */}
                                                    <button 
                                                        onClick={() => openEditModal(p)} 
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Data Pelanggan"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    {/* TOMBOL HAPUS */}
                                                    <button 
                                                        onClick={() => handleDelete(p.id_pelanggan)} 
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                                        title="Hapus Pelanggan"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-500">
                                                <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                                <p className="font-medium text-slate-600 dark:text-slate-400">Tidak ada data pelanggan yang cocok.</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter status.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* ========================================================= */}
            {/* MODAL BAYAR HUTANG */}
            {/* ========================================================= */}
            {isBayarModalOpen && selectedPelanggan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-none">
                                    <Banknote className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bayar Hutang Pelanggan</h3>
                                    <p className="text-xs text-slate-500">Catat penerimaan pembayaran hutang / piutang</p>
                                </div>
                            </div>
                            <button onClick={closeBayarModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Customer Info Box */}
                        <div className="p-6 space-y-5">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm">
                                        {selectedPelanggan.nama_pelanggan.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{selectedPelanggan.nama_pelanggan}</p>
                                        <p className="text-xs text-slate-500">{selectedPelanggan.no_telp || 'Tanpa no. telepon'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Hutang Saat Ini</p>
                                    <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                                        {formatRupiah(selectedPelanggan.total_hutang)}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitBayar} className="space-y-4">
                                {/* Nominal Pembayaran */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleBayarLunasQuick}
                                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline cursor-pointer"
                                        >
                                            Bayar Penuh / Lunas ({formatRupiah(selectedPelanggan.total_hutang)})
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                                        <input 
                                            type="number" 
                                            min="1"
                                            max={selectedPelanggan.total_hutang}
                                            step="any"
                                            value={bayarData.nominal_bayar} 
                                            onChange={e => setBayarData('nominal_bayar', e.target.value)} 
                                            required 
                                            placeholder="0"
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    {errorsBayar.nominal_bayar && (
                                        <p className="text-xs text-rose-500 mt-1">{errorsBayar.nominal_bayar}</p>
                                    )}
                                </div>

                                {/* Metode Pembayaran */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Metode Pembayaran
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['tunai', 'transfer', 'qris'] as const).map(metode => (
                                            <button
                                                type="button"
                                                key={metode}
                                                onClick={() => setBayarData('metode_pembayaran', metode)}
                                                className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                                                    bayarData.metode_pembayaran === metode 
                                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs' 
                                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                                }`}
                                            >
                                                {metode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Catatan */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Catatan / Keterangan (Opsional)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={bayarData.catatan} 
                                        onChange={e => setBayarData('catatan', e.target.value)} 
                                        placeholder="Contoh: Cicilan ke-1, transfer via BCA, dll."
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>

                                {/* Preview Kalkulasi Sisa Hutang */}
                                <div className={`p-4 rounded-xl border transition-all ${
                                    isLunasPreview 
                                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
                                        : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {isLunasPreview ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                            ) : (
                                                <ArrowDownRight className="w-5 h-5 text-amber-600" />
                                            )}
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {isLunasPreview ? 'Status: LUNAS PENUH 🎉' : 'Status: PEMBAYARAN SEBAGIAN'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {isLunasPreview ? 'Seluruh hutang pelanggan ini akan terhapus.' : 'Sisa hutang akan terus tercatat di sistem.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Sisa Hutang Nanti</p>
                                            <p className={`font-extrabold text-sm ${isLunasPreview ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                                {formatRupiah(sisaHutangPreview)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={closeBayarModal} 
                                        className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={processingBayar || nominalBayarNum <= 0 || nominalBayarNum > selectedPelanggan.total_hutang} 
                                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold shadow-md shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-2"
                                    >
                                        <Banknote className="w-4 h-4" />
                                        <span>{processingBayar ? 'Memproses...' : `Konfirmasi Bayar (${formatRupiah(nominalBayarNum)})`}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL RIWAYAT PEMBAYARAN */}
            {/* ========================================================= */}
            {isRiwayatModalOpen && riwayatPelanggan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Pembayaran Hutang</h3>
                                    <p className="text-xs text-slate-500">Pelanggan: <span className="font-semibold text-slate-700 dark:text-slate-300">{riwayatPelanggan.nama_pelanggan}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setIsRiwayatModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* List Riwayat */}
                        <div className="p-6 max-h-96 overflow-y-auto">
                            {riwayatPelanggan.pembayaran_hutang && riwayatPelanggan.pembayaran_hutang.length > 0 ? (
                                <div className="space-y-3">
                                    {riwayatPelanggan.pembayaran_hutang.map(item => (
                                        <div 
                                            key={item.id_pembayaran} 
                                            className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {formatRupiah(item.nominal_bayar)}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                                        {item.metode_pembayaran}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(item.tanggal_bayar)}
                                                    </span>
                                                    {item.user && (
                                                        <span>Kasir: <b>{item.user.nama_lengkap}</b></span>
                                                    )}
                                                </div>
                                                {item.catatan && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                                                        "{item.catatan}"
                                                    </p>
                                                )}
                                            </div>
                                            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700">
                                                <p className="text-[11px] text-slate-400">Sisa Hutang Sesudahnya</p>
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    {formatRupiah(item.sisa_hutang_setelahnya)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-slate-500">
                                    <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                    <p className="font-medium">Belum ada riwayat pembayaran untuk pelanggan ini.</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Pembayaran yang dilakukan lewat tombol "Bayar Hutang" akan tercatat di sini.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                            <div className="text-xs text-slate-500">
                                Sisa hutang berjalan saat ini: <b className="text-rose-600 font-bold">{formatRupiah(riwayatPelanggan.total_hutang)}</b>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setIsRiwayatModalOpen(false)} 
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL TAMBAH / EDIT PELANGGAN */}
            {/* ========================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingId ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitPelanggan} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Nama Lengkap <span className="text-rose-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.nama_pelanggan} 
                                    onChange={e => setFormData('nama_pelanggan', e.target.value)} 
                                    required 
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" 
                                />
                                {errorsPelanggan.nama_pelanggan && (
                                    <p className="text-xs text-rose-500 mt-1">{errorsPelanggan.nama_pelanggan}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    No. Telepon (Opsional)
                                </label>
                                <input 
                                    type="text" 
                                    value={formData.no_telp} 
                                    onChange={e => setFormData('no_telp', e.target.value)} 
                                    placeholder="Contoh: 081234567890"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Total Hutang Awal (Rp)
                                </label>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="any"
                                    value={formData.total_hutang} 
                                    onChange={e => setFormData('total_hutang', e.target.value)} 
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" 
                                />
                                <p className="text-xs text-slate-400 mt-1">Isi 0 jika tidak memiliki hutang awal.</p>
                            </div>

                            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                    Batal
                                </button>
                                <button type="submit" disabled={processingPelanggan} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 cursor-pointer transition-all">
                                    {processingPelanggan ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Pelanggan')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
