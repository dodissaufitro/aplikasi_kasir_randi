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
    CreditCard
} from 'lucide-react';
import { useState } from 'react';

import Sidebar from '@/components/Sidebar';

// Interface untuk data props (akan datang dari controller nantinya)
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
        barang_terjual: number;
        piutang_belum_lunas: number;
    };
    recent_transactions: {
        id_transaksi: number;
        tanggal_transaksi: string;
        nama_pelanggan: string;
        total_harga: number;
        status_pembayaran: string;
    }[];
}

export default function Dashboard({ auth, stats, recent_transactions }: DashboardProps) {
    const [currentTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

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
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ringkasan Hari Ini</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Pantau aktivitas penjualan dan stok toko Anda.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full font-medium">
                            <Clock className="w-4 h-4" />
                            {currentTime}
                        </div>
                        {hasKasirAccess && (
                            <Link href="/kasir" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                + Transaksi Baru
                            </Link>
                        )}
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    
                    {/* Kartu Statistik */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Card 1 */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium">Total Penjualan</h3>
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-3xl font-bold text-slate-900 dark:text-white">{formatRupiah(stats.total_penjualan || 0)}</h4>
                                <p className="text-sm text-slate-500 mt-2 font-medium">
                                    Hari ini
                                </p>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium">Transaksi Selesai</h3>
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.transaksi_selesai || 0}</h4>
                                <p className="text-sm text-slate-500 mt-2">Struk dicetak hari ini</p>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium">Barang Terjual</h3>
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg">
                                    <Package className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.barang_terjual || 0} Item</h4>
                                <p className="text-sm text-slate-500 mt-2">Hari ini</p>
                            </div>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium">Piutang Belum Lunas</h3>
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-3xl font-bold text-slate-900 dark:text-white">{formatRupiah(stats.piutang_belum_lunas || 0)}</h4>
                                <p className="text-sm text-rose-600 mt-2 font-medium">Total seluruhnya</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabel Aktivitas Terbaru */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transaksi Terbaru</h3>
                            {hasTransaksiAccess && (
                                <Link href="/transaksi" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat Semua &rarr;</Link>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6 font-medium">ID Transaksi</th>
                                        <th className="py-4 px-6 font-medium">Waktu</th>
                                        <th className="py-4 px-6 font-medium">Pelanggan</th>
                                        <th className="py-4 px-6 font-medium">Total Belanja</th>
                                        <th className="py-4 px-6 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_transactions.length > 0 ? recent_transactions.map((item) => (
                                        <tr key={item.id_transaksi} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">#TRX-{item.id_transaksi.toString().padStart(4, '0')}</td>
                                            <td className="py-4 px-6 text-slate-500">{item.tanggal_transaksi} WIB</td>
                                            <td className="py-4 px-6 text-slate-700 dark:text-slate-300">{item.nama_pelanggan}</td>
                                            <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{formatRupiah(item.total_harga)}</td>
                                            <td className="py-4 px-6">
                                                {item.status_pembayaran === 'lunas' ? (
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-bold">Lunas</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-full text-xs font-bold">Hutang</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-500">Belum ada transaksi hari ini.</td>
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
