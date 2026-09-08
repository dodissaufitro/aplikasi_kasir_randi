import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Receipt,
    Package, 
    Boxes,
    Users, 
    ShieldCheck,
    LogOut
} from 'lucide-react';

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
}

export default function Sidebar({ auth }: Props) {
    const { url } = usePage();

    const isActive = (path: string) => {
        if (path === '/dashboard') return url === '/dashboard' || url === '/';
        return url.startsWith(path);
    };

    const isSuperAdmin = auth.user.role === 'superadmin';
    const effectiveMenus = auth.user.effective_menu_access || (
        auth.user.role === 'superadmin' 
            ? ['dashboard', 'kasir', 'transaksi', 'barang', 'stok-masuk', 'pelanggan', 'pengguna']
            : auth.user.role === 'admin'
            ? ['dashboard', 'kasir', 'transaksi', 'barang', 'stok-masuk', 'pelanggan']
            : ['dashboard', 'kasir', 'transaksi']
    );

    const menuItems = [
        { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { key: 'kasir', label: 'Mesin Kasir', href: '/kasir', icon: ShoppingCart },
        { key: 'transaksi', label: 'Riwayat Transaksi', href: '/transaksi', icon: Receipt },
        { key: 'barang', label: 'Data Barang', href: '/barang', icon: Package },
        { key: 'stok-masuk', label: 'Stok Masuk', href: '/stok-masuk', icon: Boxes },
        { key: 'pelanggan', label: 'Pelanggan & Hutang', href: '/pelanggan', icon: Users },
        { key: 'pengguna', label: 'Kelola Pengguna', href: '/pengguna', icon: ShieldCheck },
    ];

    const visibleMenuItems = menuItems.filter(item => 
        isSuperAdmin || effectiveMenus.includes(item.key)
    );

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all shrink-0 select-none">
            {/* Branding Header */}
            <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-transform">
                        <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Kasir<span className="text-indigo-600">Pro</span></span>
                        <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Point of Sale</span>
                    </div>
                </Link>
            </div>

            {/* Navigasi Utama */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Utama
                </div>
                {visibleMenuItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                active
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Profil Pengguna & Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-2 border border-slate-100 dark:border-slate-800">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                        {auth.user.nama_lengkap.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{auth.user.nama_lengkap}</p>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            {auth.user.role}
                        </span>
                    </div>
                </div>
                <Link 
                    href={route('logout')} 
                    method="post" 
                    as="button" 
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium text-xs transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Keluar Sistem
                </Link>
            </div>
        </aside>
    );
}
