import { Head, Link } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    Package, 
    ShoppingCart, 
    Users, 
    Settings, 
    LogOut,
    TrendingUp,
    Clock,
    DollarSign,
    CreditCard,
    CheckCircle2,
    Calendar
} from 'lucide-react';
import { useState, useEffect } from 'react';

import Sidebar from '@/components/Sidebar';

// Interface untuk data props
interface DashboardProps {
    auth: {
        user: {
            username: string;
            nama_lengkap: string;
            role: string;
            effective_menu_access?: string[];
        }
    };
    stats: {
        total_penjualan: number;
        transaksi_selesai: number;
        total_penjualan_lunas?: number;
        transaksi_lunas_count?: number;
        barang_terjual: number;
        piutang_belum_lunas: number;
    };
    recent_transactions: {
        id_transaksi: number;
        hari?: string;
        tanggal_transaksi: string;
        jam?: string;
        nama_pelanggan: string;
        total_harga: number;
        status_pembayaran: string;
    }[];
}

export default function Dashboard({ auth, stats, recent_transactions }: DashboardProps) {
    const [currentDateTime, setCurrentDateTime] = useState('');

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const dateStr = new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(now);
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setCurrentDateTime(`${dateStr} • ${timeStr} WIB`);
        };
        updateDateTime();
        const timer = setInterval(updateDateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    const hasKasirAccess = auth.user.role === 'superadmin' || auth.user.effective_menu_access?.includes('kasir');
    const hasTransaksiAccess = auth.user.role === 'superadmin' || auth.user.effective_menu_access?.includes('transaksi');

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
            <Head title="Dashboard - Kasir Pro" />

            {/* Sidebar Terpadu */}
            <Sidebar auth={auth} />

            {/* Area Konten Utama */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header Atas */}
                <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ringkasan Penjualan</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Pantau aktivitas transaksi kasir, keuangan, dan stok secara real-time.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-semibold text-xs sm:text-sm border border-indigo-100 dark:border-indigo-800 shadow-sm">
                            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>{currentDateTime || 'Memuat waktu...'}</span>
                        </div>
                        {hasKasirAccess && (
                            <Link href="/kasir" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 text-sm">
                                <ShoppingCart className="w-4 h-4" />
                                + Transaksi Baru
                            </Link>
                        )}
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    
                    {/* Kartu Statistik */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
                        {/* Card 1: Total Penjualan */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">Total Penjualan</h3>
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white truncate">{formatRupiah(stats.total_penjualan || 0)}</h4>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5 font-semibold">Hari ini</p>
                            </div>
                        </div>

                        {/* Card 2: Transaksi Lunas (Fitur Baru) */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">Transaksi Lunas</h3>
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                                    {formatRupiah(stats.total_penjualan_lunas ?? 0)}
                                </h4>
                                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1.5 font-medium">
                                    {stats.transaksi_lunas_count ?? 0} Transaksi lunas hari ini
                                </p>
                            </div>
                        </div>

                        {/* Card 3: Piutang Belum Lunas */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">Piutang Belum Lunas</h3>
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xl lg:text-2xl font-black text-rose-600 dark:text-rose-400 truncate">{formatRupiah(stats.piutang_belum_lunas || 0)}</h4>
                                <p className="text-xs text-rose-500 mt-1.5 font-medium">Akumulasi seluruhnya</p>
                            </div>
                        </div>

                        {/* Card 4: Transaksi Selesai */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">Total Transaksi</h3>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">{stats.transaksi_selesai || 0}</h4>
                                <p className="text-xs text-slate-500 mt-1.5">Struk dicetak hari ini</p>
                            </div>
                        </div>

                        {/* Card 5: Barang Terjual */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">Barang Terjual</h3>
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl">
                                    <Package className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">{stats.barang_terjual || 0} <span className="text-sm font-semibold text-slate-400">Pcs</span></h4>
                                <p className="text-xs text-slate-500 mt-1.5">Item terjual hari ini</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabel Aktivitas Terbaru */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transaksi Terbaru</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">5 aktivitas transaksi penjualan paling akhir</p>
                            </div>
                            {hasTransaksiAccess && (
                                <Link href="/transaksi" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg transition-colors">
                                    Lihat Riwayat Lengkap &rarr;
                                </Link>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6 font-semibold">ID Transaksi</th>
                                        <th className="py-4 px-6 font-semibold">Waktu & Hari</th>
                                        <th className="py-4 px-6 font-semibold">Pelanggan</th>
                                        <th className="py-4 px-6 font-semibold">Total Belanja</th>
                                        <th className="py-4 px-6 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_transactions.length > 0 ? recent_transactions.map((item) => (
                                        <tr key={item.id_transaksi} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                                                #TRX-{item.id_transaksi.toString().padStart(4, '0')}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    {item.tanggal_transaksi}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                                                {item.nama_pelanggan}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-sm text-slate-900 dark:text-white">
                                                {formatRupiah(item.total_harga)}
                                            </td>
                                            <td className="py-4 px-6">
                                                {item.status_pembayaran === 'lunas' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-800">
                                                        <CreditCard className="w-3.5 h-3.5" /> Hutang
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">Belum ada transaksi hari ini.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
