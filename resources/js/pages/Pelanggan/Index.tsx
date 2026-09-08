import { Head, Link, useForm } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    Package, 
    ShoppingCart, 
    Users, 
    Plus,
    Edit,
    Trash2,
    X,
    CreditCard
} from 'lucide-react';
import { useState } from 'react';

import Sidebar from '@/components/Sidebar';

interface Pelanggan {
    id_pelanggan: number;
    nama_pelanggan: string;
    no_telp: string;
    total_hutang: number;
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
    flash: { success?: string; error?: string };
}

export default function PelangganIndex({ auth, pelanggan, flash }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, reset, processing } = useForm({
        nama_pelanggan: '',
        no_telp: '',
        total_hutang: '0'
    });

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const openCreateModal = () => {
        setEditingId(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (p: Pelanggan) => {
        setEditingId(p.id_pelanggan);
        setData({
            nama_pelanggan: p.nama_pelanggan,
            no_telp: p.no_telp || '',
            total_hutang: p.total_hutang.toString()
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
            put(route('pelanggan.update', editingId), {
                onSuccess: () => closeModal()
            });
        } else {
            post(route('pelanggan.store'), {
                onSuccess: () => closeModal()
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus pelanggan ini?')) {
            destroy(route('pelanggan.destroy', id));
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
            <Head title="Data Pelanggan - Kasir Pro" />

            {/* Sidebar Terpadu */}
            <Sidebar auth={auth} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Data Pelanggan & Hutang</h2>
                        <p className="text-sm text-slate-500">Kelola buku kontak dan tagihan piutang toko Anda.</p>
                    </div>
                    <button onClick={openCreateModal} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
                        <Plus className="w-5 h-5" /> Tambah Pelanggan
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
                                    <th className="py-4 px-6 font-medium">Nama Pelanggan</th>
                                    <th className="py-4 px-6 font-medium">No. Telepon</th>
                                    <th className="py-4 px-6 font-medium">Total Hutang</th>
                                    <th className="py-4 px-6 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pelanggan.length > 0 ? pelanggan.map(p => (
                                    <tr key={p.id_pelanggan} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">{p.nama_pelanggan.charAt(0)}</div>
                                                {p.nama_pelanggan}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-500">{p.no_telp || '-'}</td>
                                        <td className="py-4 px-6">
                                            {p.total_hutang > 0 ? (
                                                <span className="flex items-center gap-1 font-semibold text-rose-600">
                                                    <CreditCard className="w-4 h-4" /> {formatRupiah(p.total_hutang)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">Bersih</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(p.id_pelanggan)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="py-8 text-center text-slate-500">Belum ada data pelanggan.</td></tr>
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
                                {editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                                <input type="text" value={data.nama_pelanggan} onChange={e => setData('nama_pelanggan', e.target.value)} required className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No. Telepon (Opsional)</label>
                                <input type="text" value={data.no_telp} onChange={e => setData('no_telp', e.target.value)} className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Hutang Berjalan</label>
                                <input type="number" value={data.total_hutang} onChange={e => setData('total_hutang', e.target.value)} className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>

                            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                                <button type="submit" disabled={processing} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Simpan Pelanggan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
