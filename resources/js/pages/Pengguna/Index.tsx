import { Head, useForm, router } from '@inertiajs/react';
import { 
    ShieldCheck, 
    Plus, 
    Search, 
    Pencil, 
    Trash2, 
    CheckCircle, 
    X, 
    AlertCircle, 
    UserCheck,
    Lock,
    KeyRound,
    LayoutDashboard,
    ShoppingCart,
    Receipt,
    Package,
    Boxes,
    Users,
    Check,
    RotateCcw,
    Shield
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';

interface AvailableMenu {
    key: string;
    label: string;
    description: string;
    icon: string;
    group: string;
}

interface UserItem {
    id: number;
    username: string;
    nama_lengkap: string;
    role: 'superadmin' | 'admin' | 'kasir';
    menu_access?: string[] | null;
    effective_menu_access?: string[];
}

interface Props {
    auth: {
        user: {
            id: number;
            username: string;
            nama_lengkap: string;
            role: string;
            effective_menu_access?: string[];
        }
    };
    users: UserItem[];
    availableMenus: AvailableMenu[];
    flash: {
        success?: string;
        error?: string;
    };
}

const MENU_ICONS: Record<string, React.ElementType> = {
    LayoutDashboard,
    ShoppingCart,
    Receipt,
    Package,
    Boxes,
    Users,
    ShieldCheck,
};

const DEFAULT_MENUS: Record<string, string[]> = {
    superadmin: ['dashboard', 'kasir', 'transaksi', 'barang', 'stok-masuk', 'pelanggan', 'pengguna'],
    admin: ['dashboard', 'kasir', 'transaksi', 'barang', 'stok-masuk', 'pelanggan'],
    kasir: ['dashboard', 'kasir', 'transaksi'],
};

export default function PenggunaIndex({ auth, users, availableMenus = [], flash }: Props) {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

    // State untuk Modal Khusus Pengaturan Hak Akses
    const [permissionModalUser, setPermissionModalUser] = useState<UserItem | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [savingPermissions, setSavingPermissions] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        username: '',
        nama_lengkap: '',
        role: 'kasir' as 'superadmin' | 'admin' | 'kasir',
        password: '',
        menu_access: DEFAULT_MENUS['kasir'] as string[],
    });

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
            u.role.toLowerCase().includes(search.toLowerCase())
        );
    }, [users, search]);

    const openCreateModal = () => {
        setEditingUser(null);
        reset();
        setData({
            username: '',
            nama_lengkap: '',
            role: 'kasir',
            password: '',
            menu_access: [...DEFAULT_MENUS['kasir']],
        });
        setIsModalOpen(true);
    };

    const openEditModal = (u: UserItem) => {
        setEditingUser(u);
        const userMenus = u.effective_menu_access || DEFAULT_MENUS[u.role] || [];
        setData({
            username: u.username,
            nama_lengkap: u.nama_lengkap,
            role: u.role,
            password: '',
            menu_access: [...userMenus],
        });
        setIsModalOpen(true);
    };

    const openPermissionModal = (u: UserItem) => {
        setPermissionModalUser(u);
        const userMenus = u.effective_menu_access || DEFAULT_MENUS[u.role] || [];
        setSelectedPermissions([...userMenus]);
        setPermissionError(null);
    };

    const handleRoleChangeInForm = (newRole: 'superadmin' | 'admin' | 'kasir') => {
        setData(prev => ({
            ...prev,
            role: newRole,
            menu_access: [...DEFAULT_MENUS[newRole]],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            put(route('pengguna.update', editingUser.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route('pengguna.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleSavePermissions = (e: React.FormEvent) => {
        e.preventDefault();
        if (!permissionModalUser) return;

        if (selectedPermissions.length === 0) {
            setPermissionError('Paling tidak pilih 1 menu agar pengguna dapat mengakses aplikasi.');
            return;
        }

        setSavingPermissions(true);
        setPermissionError(null);

        router.put(
            route('pengguna.menu-access', permissionModalUser.id),
            { menu_access: selectedPermissions },
            {
                onSuccess: () => {
                    setPermissionModalUser(null);
                    setSavingPermissions(false);
                },
                onError: (errs) => {
                    setSavingPermissions(false);
                    if (errs.menu_access) {
                        setPermissionError(errs.menu_access);
                    }
                }
            }
        );
    };

    const togglePermissionItem = (key: string) => {
        setSelectedPermissions(prev => 
            prev.includes(key) 
                ? prev.filter(k => k !== key) 
                : [...prev, key]
        );
    };

    const applyPresetToPermissions = (rolePreset: 'kasir' | 'admin' | 'all') => {
        if (rolePreset === 'all') {
            setSelectedPermissions(availableMenus.map(m => m.key));
        } else {
            setSelectedPermissions([...DEFAULT_MENUS[rolePreset]]);
        }
    };

    const handleDelete = (u: UserItem) => {
        if (u.id === auth.user.id) {
            alert('Anda tidak dapat menghapus akun Anda sendiri.');
            return;
        }
        if (confirm(`Yakin ingin menghapus pengguna '${u.nama_lengkap}' (${u.username})?`)) {
            router.delete(route('pengguna.destroy', u.id));
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
            <Head title="Kelola Pengguna & Hak Akses - Kasir Pro" />

            {/* Sidebar Terpadu */}
            <Sidebar auth={auth} />

            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <ShieldCheck className="w-6 h-6 text-indigo-600" /> Manajemen Pengguna & Hak Akses
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Atur hak akses menu-menu sistem yang dapat dilihat oleh staf atau pengguna terpilih.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Tambah Pengguna
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {flash?.success && (
                        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-100 flex items-center gap-2 shadow-sm">
                            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> {flash.success}
                        </div>
                    )}
                    {(flash?.error || errors.error) && (
                        <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 font-medium text-xs border border-rose-100 flex items-center gap-2 shadow-sm">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> {flash?.error || errors.error}
                        </div>
                    )}

                    {/* Toolbar Pencarian */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Cari nama, username, atau role..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 font-medium">Total: <b>{users.length} Akun</b></span>
                        </div>
                    </div>

                    {/* Tabel Pengguna & Hak Akses */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6">Pengguna</th>
                                        <th className="py-4 px-6">Username</th>
                                        <th className="py-4 px-6">Role Utama</th>
                                        <th className="py-4 px-6">Akses Menu Terbuka</th>
                                        <th className="py-4 px-6 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(u => {
                                            const effectiveMenus = u.effective_menu_access || DEFAULT_MENUS[u.role] || [];
                                            const isFullAccess = u.role === 'superadmin' || effectiveMenus.length === availableMenus.length;

                                            return (
                                                <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                                                            {u.nama_lengkap.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span>{u.nama_lengkap}</span>
                                                                {u.id === auth.user.id && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">Anda</span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-normal">ID #{u.id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-300">
                                                        @{u.username}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1 ${
                                                            u.role === 'superadmin' 
                                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' 
                                                                : u.role === 'admin'
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        }`}>
                                                            <Shield className="w-3 h-3" />
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    isFullAccess 
                                                                        ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' 
                                                                        : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                                }`}>
                                                                    {isFullAccess ? 'Semua Menu (Penuh)' : `${effectiveMenus.length} dari ${availableMenus.length} Menu`}
                                                                </span>
                                                                {u.menu_access && u.role !== 'superadmin' && (
                                                                    <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200">
                                                                        Kustom
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 max-w-sm">
                                                                {effectiveMenus.slice(0, 4).map(key => {
                                                                    const item = availableMenus.find(m => m.key === key);
                                                                    return (
                                                                        <span key={key} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                                            {item?.label || key}
                                                                        </span>
                                                                    );
                                                                })}
                                                                {effectiveMenus.length > 4 && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                                                        +{effectiveMenus.length - 4} lainnya
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* Tombol Atur Hak Akses Menu */}
                                                            <button 
                                                                onClick={() => openPermissionModal(u)}
                                                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs"
                                                                title="Atur Hak Akses Menu"
                                                            >
                                                                <KeyRound className="w-3.5 h-3.5" />
                                                                <span>Hak Akses</span>
                                                            </button>

                                                            {/* Tombol Edit User */}
                                                            <button 
                                                                onClick={() => openEditModal(u)}
                                                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                                                                title="Edit Pengguna"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>

                                                            {/* Tombol Hapus */}
                                                            {u.id !== auth.user.id && (
                                                                <button 
                                                                    onClick={() => handleDelete(u)}
                                                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 transition-colors"
                                                                    title="Hapus Pengguna"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400">
                                                Pengguna tidak ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL KHUSUS: PENGATURAN HAK AKSES MENU */}
            {permissionModalUser && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8">
                        {/* Header Modal Hak Akses */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <KeyRound className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                        Atur Hak Akses Menu Pengguna
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Pilih menu yang boleh dibuka oleh: <b className="text-slate-800 dark:text-slate-200">{permissionModalUser.nama_lengkap}</b> (@{permissionModalUser.username})
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setPermissionModalUser(null)} 
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Preset Bar */}
                        <div className="py-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Template Akses Cepat:</span>
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                    {selectedPermissions.length} dari {availableMenus.length} Menu Terpilih
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => applyPresetToPermissions('kasir')}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                                >
                                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                                    Default Kasir (3 Menu)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyPresetToPermissions('admin')}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                                >
                                    <Package className="w-3.5 h-3.5 text-blue-500" />
                                    Default Admin (6 Menu)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyPresetToPermissions('all')}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                                    Akses Penuh (Semua)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPermissions([])}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-1.5 transition-all ml-auto"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Kosongkan
                                </button>
                            </div>
                        </div>

                        {permissionError && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {permissionError}
                            </div>
                        )}

                        {/* Checklist Menu Cards */}
                        <form onSubmit={handleSavePermissions}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 py-1">
                                {availableMenus.map((menu) => {
                                    const isChecked = selectedPermissions.includes(menu.key);
                                    const IconComponent = MENU_ICONS[menu.icon] || LayoutDashboard;

                                    return (
                                        <div
                                            key={menu.key}
                                            onClick={() => togglePermissionItem(menu.key)}
                                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                                                isChecked
                                                    ? 'bg-indigo-50/70 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-700 shadow-xs'
                                                    : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 opacity-75'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                                isChecked 
                                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' 
                                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400'
                                            }`}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                                    <span className={`text-xs font-bold ${isChecked ? 'text-indigo-950 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {menu.label}
                                                    </span>
                                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                                        isChecked 
                                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' 
                                                            : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                                                    }`}>
                                                        {menu.group}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                                    {menu.description}
                                                </p>
                                            </div>

                                            {/* Custom Checkbox visual */}
                                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                                isChecked 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                            }`}>
                                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPermissionModalUser(null)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPermissions}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {savingPermissions ? (
                                        <>Menyimpan...</>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" /> Simpan Hak Akses Menu
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL TAMBAH / EDIT DATA PENGGUNA */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-indigo-600" />
                                {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Nama Lengkap</label>
                                <input 
                                    type="text"
                                    placeholder="Contoh: Budi Prasetyo"
                                    value={data.nama_lengkap}
                                    onChange={(e) => setData('nama_lengkap', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs px-3 h-10 outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                {errors.nama_lengkap && <p className="text-[11px] text-rose-500 mt-1">{errors.nama_lengkap}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Username Login</label>
                                <input 
                                    type="text"
                                    placeholder="Contoh: budi_kasir"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs px-3 h-10 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                    required
                                />
                                {errors.username && <p className="text-[11px] text-rose-500 mt-1">{errors.username}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Role / Peran Utama</label>
                                <select 
                                    value={data.role}
                                    onChange={(e) => handleRoleChangeInForm(e.target.value as 'superadmin' | 'admin' | 'kasir')}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs px-3 h-10 outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="kasir">Kasir (Default: POS & Riwayat Transaksi)</option>
                                    <option value="admin">Administrator (Default: Master Data, Stok, POS)</option>
                                    <option value="superadmin">Super Administrator (Akses Penuh Seluruh Sistem)</option>
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    * Anda juga dapat mengkustomisasi menu secara spesifik melalui tombol <b>"Hak Akses"</b> pada tabel.
                                </p>
                                {errors.role && <p className="text-[11px] text-rose-500 mt-1">{errors.role}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                                    <span>Password</span>
                                    {editingUser && <span className="text-[10px] text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="password"
                                        placeholder={editingUser ? "••••••••" : "Minimal 4 karakter"}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs px-3 h-10 outline-none focus:ring-2 focus:ring-indigo-500"
                                        required={!editingUser}
                                    />
                                    <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                                {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password}</p>}
                            </div>

                            <div className="pt-3 flex gap-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : (editingUser ? 'Perbarui Pengguna' : 'Simpan Pengguna')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
