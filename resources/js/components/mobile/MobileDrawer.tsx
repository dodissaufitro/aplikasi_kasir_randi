import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Receipt, 
    Package, 
    Boxes, 
    Users, 
    BarChart3, 
    ShieldCheck, 
    LogOut, 
    X,
    ChevronRight
} from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    auth: {
        user: {
            username: string;
            nama_lengkap: string;
            role: string;
            effective_menu_access?: string[];
        };
    };
}

export default function MobileDrawer({ isOpen, onClose, auth }: Props) {
    const { url } = usePage();

    if (!isOpen) return null;

    const isSuperAdmin = auth.user.role === 'superadmin';
    const effectiveMenus = auth.user.effective_menu_access || (
        auth.user.role === 'superadmin' 
            ? ['dashboard', 'kasir', 'transaksi', 'barang', 'stok-masuk', 'pelanggan', 'laporan', 'pengguna']
            : auth.user.role === 'admin'
            ? ['dashboard', 'kasir', 'transaksi', 'barang', 'stok-masuk', 'pelanggan', 'laporan']
            : ['dashboard', 'kasir', 'transaksi']
    );

    const menuItems = [
        { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { key: 'kasir', label: 'Mesin Kasir', href: '/kasir', icon: ShoppingCart },
        { key: 'transaksi', label: 'Riwayat Transaksi', href: '/transaksi', icon: Receipt },
        { key: 'barang', label: 'Data Barang', href: '/barang', icon: Package },
        { key: 'stok-masuk', label: 'Stok Masuk', href: '/stok-masuk', icon: Boxes },
        { key: 'pelanggan', label: 'Pelanggan & Hutang', href: '/pelanggan', icon: Users },
        { key: 'laporan', label: 'Laporan', href: '/laporan', icon: BarChart3 },
        { key: 'pengguna', label: 'Kelola Pengguna', href: '/pengguna', icon: ShieldCheck },
    ];

    const visibleMenuItems = menuItems.filter(item => 
        isSuperAdmin || effectiveMenus.includes(item.key)
    );

    const isActive = (path: string) => {
        if (path === '/dashboard') return url === '/dashboard' || url === '/';
        return url.startsWith(path);
    };

    return (
        <div className="fixed inset-0 z-50 flex select-none">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="relative w-4/5 max-w-xs bg-[#0F172A] border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <ShoppingCart className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="text-base font-black text-white tracking-tight">Kasir<span className="text-indigo-500">Pro</span></span>
                            <span className="block text-[9px] uppercase font-bold text-slate-400">Mobile Edition</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg active:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User Info */}
                <div className="p-4 bg-slate-900/60 border-b border-slate-800/80 mx-3 mt-3 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                        {auth.user.nama_lengkap.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{auth.user.nama_lengkap}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            {auth.user.role}
                        </span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                    <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Menu Aplikasi
                    </div>
                    {visibleMenuItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                                    active
                                        ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
                                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                                    <span>{item.label}</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Logout */}
                <div className="p-4 border-t border-slate-800/80">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-rose-400 bg-rose-950/30 border border-rose-900/40 hover:bg-rose-900/40 font-bold text-xs transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Keluar Akun
                    </Link>
                </div>
            </div>
        </div>
    );
}
