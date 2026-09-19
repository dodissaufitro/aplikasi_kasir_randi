import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Package, 
    Boxes, 
    Users, 
    BarChart3, 
    MoreHorizontal,
    Receipt,
    ShieldCheck,
    LogOut,
    X
} from 'lucide-react';

interface Props {
    activeTab?: 'beranda' | 'kasir' | 'barang' | 'stok' | 'pelanggan' | 'laporan' | 'lainnya';
}

export default function MobileBottomNav({ activeTab }: Props) {
    const { url } = usePage();
    const [showMoreModal, setShowMoreModal] = useState(false);

    // Auto-detect active tab if not explicitly passed
    let current = activeTab;
    if (!current) {
        if (url === '/dashboard' || url === '/') current = 'beranda';
        else if (url.startsWith('/kasir')) current = 'kasir';
        else if (url.startsWith('/stok-masuk')) current = 'stok';
        else if (url.startsWith('/pelanggan')) current = 'pelanggan';
        else if (url.startsWith('/barang')) current = 'barang';
        else if (url.startsWith('/laporan')) current = 'laporan';
        else current = 'beranda';
    }

    // Third tab is contextual (Barang / Stok / Pelanggan)
    const renderThirdTab = () => {
        if (current === 'stok') {
            return {
                label: 'Stok',
                href: '/stok-masuk',
                icon: Boxes,
                active: true
            };
        }
        if (current === 'pelanggan') {
            return {
                label: 'Pelanggan',
                href: '/pelanggan',
                icon: Users,
                active: true
            };
        }
        return {
            label: 'Barang',
            href: '/barang',
            icon: Package,
            active: current === 'barang'
        };
    };

    const third = renderThirdTab();
    const ThirdIcon = third.icon;

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 select-none md:hidden">
                <div className="flex items-center justify-around max-w-md mx-auto">
                    {/* 1. Beranda */}
                    <Link
                        href="/dashboard"
                        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                            current === 'beranda'
                                ? 'text-indigo-400 font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <LayoutDashboard className={`w-5 h-5 mb-0.5 ${current === 'beranda' ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <span className="text-[10px] tracking-tight">Beranda</span>
                    </Link>

                    {/* 2. Kasir */}
                    <Link
                        href="/kasir"
                        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                            current === 'kasir'
                                ? 'text-indigo-400 font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <ShoppingCart className={`w-5 h-5 mb-0.5 ${current === 'kasir' ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <span className="text-[10px] tracking-tight">Kasir</span>
                    </Link>

                    {/* 3. Barang / Stok / Pelanggan */}
                    <Link
                        href={third.href}
                        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                            third.active
                                ? 'text-indigo-400 font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <ThirdIcon className={`w-5 h-5 mb-0.5 ${third.active ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <span className="text-[10px] tracking-tight">{third.label}</span>
                    </Link>

                    {/* 4. Laporan */}
                    <Link
                        href="/laporan"
                        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                            current === 'laporan'
                                ? 'text-indigo-400 font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <BarChart3 className={`w-5 h-5 mb-0.5 ${current === 'laporan' ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <span className="text-[10px] tracking-tight">Laporan</span>
                    </Link>

                    {/* 5. Lainnya */}
                    <button
                        type="button"
                        onClick={() => setShowMoreModal(true)}
                        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                            current === 'lainnya'
                                ? 'text-indigo-400 font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <MoreHorizontal className="w-5 h-5 mb-0.5 text-slate-400" />
                        <span className="text-[10px] tracking-tight">Lainnya</span>
                    </button>
                </div>
            </nav>

            {/* Bottom Sheet Menu Lainnya */}
            {showMoreModal && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end select-none md:hidden">
                    <div 
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowMoreModal(false)}
                    />
                    <div className="relative bg-[#0F172A] border-t border-slate-800 rounded-t-3xl p-5 z-10 shadow-2xl animate-in slide-in-from-bottom duration-200">
                        {/* Drag Handle & Header */}
                        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <span className="text-sm font-bold text-white">Menu Lainnya</span>
                            <button
                                type="button"
                                onClick={() => setShowMoreModal(false)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Grid Menu Links */}
                        <div className="grid grid-cols-3 gap-3 py-4">
                            <Link
                                href="/transaksi"
                                onClick={() => setShowMoreModal(false)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-200"
                            >
                                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-center">Riwayat Transaksi</span>
                            </Link>

                            <Link
                                href="/stok-masuk"
                                onClick={() => setShowMoreModal(false)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-200"
                            >
                                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                                    <Boxes className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-center">Stok Masuk</span>
                            </Link>

                            <Link
                                href="/pelanggan"
                                onClick={() => setShowMoreModal(false)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-200"
                            >
                                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-center">Pelanggan & Hutang</span>
                            </Link>

                            <Link
                                href="/barang"
                                onClick={() => setShowMoreModal(false)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-200"
                            >
                                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                                    <Package className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-center">Data Barang</span>
                            </Link>

                            <Link
                                href="/pengguna"
                                onClick={() => setShowMoreModal(false)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-200"
                            >
                                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-center">Pengguna</span>
                            </Link>

                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/50 text-rose-300"
                            >
                                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-center">Keluar</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
