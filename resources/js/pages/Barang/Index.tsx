import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    Package, 
    ShoppingCart, 
    Users, 
    Settings, 
    LogOut,
    Plus,
    Edit,
    Trash2,
    X
} from 'lucide-react';
import { useState } from 'react';

import Sidebar from '@/components/Sidebar';

interface Barang {
    id_barang: number;
    nama_barang: string;
    harga_beli: number;
    harga_jual: number;
    stok: number;
}

interface Props {
    auth: {
        user: {
            username: string;
            nama_lengkap: string;
            role: string;
        }
    };
    barang: Barang[];
    flash: { success?: string; error?: string };
}

export default function BarangIndex({ auth, barang, flash }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, reset, processing, errors } = useForm({
        nama_barang: '',
        harga_beli: '',
        harga_jual: '',
        stok: ''
    });

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const openCreateModal = () => {
        setEditingId(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (b: Barang) => {
        setEditingId(b.id_barang);
        setData({
            nama_barang: b.nama_barang,
            harga_beli: b.harga_beli.toString(),
            harga_jual: b.harga_jual.toString(),
            stok: b.stok.toString()
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(route('barang.update', editingId), {
                onSuccess: () => closeModal()
            });
        } else {
            post(route('barang.store'), {
                onSuccess: () => closeModal()
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus barang ini?')) {
            destroy(route('barang.destroy', id));
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
            <Head title="Data Barang - Kasir Pro" />

            {/* Sidebar Terpadu */}
            <Sidebar auth={auth} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Data Barang</h2>
                        <p className="text-sm text-slate-500">Kelola stok dan harga barang toko Anda.</p>
                    </div>
                    <button onClick={openCreateModal} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
                        <Plus className="w-5 h-5" /> Tambah Barang
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {flash.success && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">{flash.success}</div>
                    )}
                    
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 font-medium">Nama Barang</th>
                                    <th className="py-4 px-6 font-medium">Harga Beli</th>
                                    <th className="py-4 px-6 font-medium">Harga Jual</th>
                                    <th className="py-4 px-6 font-medium">Stok</th>
                                    <th className="py-4 px-6 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {barang.length > 0 ? barang.map(b => (
                                    <tr key={b.id_barang} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">{b.nama_barang}</td>
                                        <td className="py-4 px-6 text-slate-500">{formatRupiah(b.harga_beli)}</td>
                                        <td className="py-4 px-6 font-semibold text-indigo-600 dark:text-indigo-400">{formatRupiah(b.harga_jual)}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${b.stok > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {b.stok} Tersedia
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEditModal(b)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(b.id_barang)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada data barang.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingId ? 'Edit Barang' : 'Tambah Barang'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Barang</label>
                                <input type="text" value={data.nama_barang} onChange={e => setData('nama_barang', e.target.value)} required className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga Beli</label>
                                    <input type="number" value={data.harga_beli} onChange={e => setData('harga_beli', e.target.value)} required className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga Jual</label>
                                    <input type="number" value={data.harga_jual} onChange={e => setData('harga_jual', e.target.value)} required className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stok Awal</label>
                                <input type="number" value={data.stok} onChange={e => setData('stok', e.target.value)} required className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>

                            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                                <button type="submit" disabled={processing} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Simpan Barang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
