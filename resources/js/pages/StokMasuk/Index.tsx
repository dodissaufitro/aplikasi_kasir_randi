import { Head, useForm, router } from '@inertiajs/react';
import { 
    Boxes, 
    Plus, 
    Search, 
    Trash2, 
    CheckCircle, 
    X, 
    AlertCircle, 
    ArrowDownRight 
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';

interface SatuanKonversi {
    nama_satuan: string;
    rasio_konversi: number;
}

interface Barang {
    id_barang: number;
    nama_barang: string;
    satuan?: string;
    stok: number;
    satuan_konversi?: SatuanKonversi[];
}

interface StokMasukItem {
    id_stok_masuk: number;
    id_barang: number;
    tanggal_masuk: string;
    jumlah: number;
    satuan?: string;
    rasio_konversi?: number;
    barang?: Barang;
}

interface Props {
    auth: {
        user: {
            username: string;
            nama_lengkap: string;
            role: string;
        }
    };
    stok_masuk: StokMasukItem[];
    barang: Barang[];
    flash: {
        success?: string;
        error?: string;
    };
}

export default function StokMasukIndex({ auth, stok_masuk, barang, flash }: Props) {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        id_barang: '',
        jumlah: 1,
        satuan: '',
        rasio_konversi: 1,
        tanggal_masuk: new Date().toISOString().slice(0, 16)
    });

    const filteredStokMasuk = useMemo(() => {
        return stok_masuk.filter(s => {
            const nama = s.barang ? s.barang.nama_barang.toLowerCase() : '';
            return nama.includes(search.toLowerCase()) || s.id_stok_masuk.toString().includes(search);
        });
    }, [stok_masuk, search]);

    const totalItemMasuk = useMemo(() => {
        return stok_masuk.reduce((acc, s) => acc + Number(s.jumlah), 0);
    }, [stok_masuk]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('stok-masuk.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin membatalkan riwayat stok masuk ini? Stok barang akan dikurangi kembali.')) {
            router.delete(route('stok-masuk.destroy', id));
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
            <Head title="Stok Masuk - Kasir Pro" />

            {/* Sidebar Terpadu */}
            <Sidebar auth={auth} />

            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <Boxes className="w-6 h-6 text-indigo-600" /> Riwayat Stok Masuk (Restock)
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pencatatan penambahan stok barang dari supplier ke gudang / toko.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Catat Stok Masuk
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Alerts */}
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

                    {/* Stats Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Item Masuk</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalItemMasuk} Pcs / Unit</h3>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                                <ArrowDownRight className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Transaksi Masuk</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stok_masuk.length} Kali Restock</h3>
                            </div>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                                <Boxes className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Search Toolbar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Cari nama barang atau ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6">ID Masuk</th>
                                        <th className="py-4 px-6">Nama Barang</th>
                                        <th className="py-4 px-6">Jumlah Tambah</th>
                                        <th className="py-4 px-6">Stok Barang Saat Ini</th>
                                        <th className="py-4 px-6">Waktu Masuk</th>
                                        <th className="py-4 px-6 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStokMasuk.length > 0 ? (
                                        filteredStokMasuk.map(s => (
                                            <tr key={s.id_stok_masuk} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                    #IN-{s.id_stok_masuk.toString().padStart(4, '0')}
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                                                    {s.barang ? s.barang.nama_barang : `Barang #${s.id_barang}`}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                                                        +{s.jumlah} {s.satuan || s.barang?.satuan || 'PCS'}
                                                    </span>
                                                    {s.rasio_konversi && s.rasio_konversi > 1 ? (
                                                        <span className="text-[10px] text-slate-400 block mt-0.5">
                                                            (setara {s.jumlah * s.rasio_konversi} {s.barang?.satuan || 'PCS'})
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">
                                                    {s.barang ? `${s.barang.stok} ${s.barang.satuan || 'PCS'}` : '-'}
                                                </td>
                                                <td className="py-4 px-6 text-slate-500">
                                                    {new Date(s.tanggal_masuk).toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <button 
                                                        onClick={() => handleDelete(s.id_stok_masuk)}
                                                        title="Hapus / Batalkan Stok Masuk"
                                                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400">
                                                Belum ada riwayat stok masuk.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal Tambah Stok Masuk */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                <Boxes className="w-5 h-5 text-indigo-600" /> Catat Stok Masuk Baru
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Pilih Barang</label>
                                <select 
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs px-3 h-10 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={data.id_barang}
                                    onChange={(e) => {
                                        const bId = e.target.value;
                                        setData('id_barang', bId);
                                        const bObj = barang.find(b => b.id_barang.toString() === bId);
                                        if (bObj) {
                                            setData(prev => ({
                                                ...prev,
                                                id_barang: bId,
                                                satuan: bObj.satuan || 'PCS',
                                                rasio_konversi: 1,
                                            }));
                                        }
                                    }}
                                    required
                                >
                                    <option value="">-- Pilih Barang yang Ditambah --</option>
                                    {barang.map(b => (
                                        <option key={b.id_barang} value={b.id_barang}>
                                            {b.nama_barang} (Stok: {b.stok} {b.satuan || 'PCS'})
                                        </option>
                                    ))}
                                </select>
                                {errors.id_barang && <p className="text-[11px] text-rose-500 mt-1">{errors.id_barang}</p>}
                            </div>

                            {/* Pilihan Satuan Pasokan Masuk */}
                            {(() => {
                                const selectedBarangObj = barang.find(b => b.id_barang.toString() === data.id_barang);
                                const baseSatuan = selectedBarangObj?.satuan || 'PCS';
                                const konversiList = selectedBarangObj?.satuan_konversi || [];

                                return (
                                    <>
                                        {konversiList.length > 0 && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                                    Satuan Pembelian / Pasokan
                                                </label>
                                                <select
                                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs px-3 h-10 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600"
                                                    value={data.satuan}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === baseSatuan) {
                                                            setData(prev => ({ ...prev, satuan: baseSatuan, rasio_konversi: 1 }));
                                                        } else {
                                                            const match = konversiList.find(k => k.nama_satuan === val);
                                                            setData(prev => ({ 
                                                                ...prev, 
                                                                satuan: val, 
                                                                rasio_konversi: match ? match.rasio_konversi : 1 
                                                            }));
                                                        }
                                                    }}
                                                >
                                                    <option value={baseSatuan}>{baseSatuan} (Satuan Dasar)</option>
                                                    {konversiList.map(k => (
                                                        <option key={k.nama_satuan} value={k.nama_satuan}>
                                                            {k.nama_satuan} (Isi {k.rasio_konversi} {baseSatuan})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                                Jumlah Tambahan ({data.satuan || baseSatuan})
                                            </label>
                                            <input 
                                                type="number"
                                                min="1"
                                                value={data.jumlah}
                                                onChange={(e) => setData('jumlah', Number(e.target.value))}
                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs px-3 h-10 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                                required
                                            />
                                            {errors.jumlah && <p className="text-[11px] text-rose-500 mt-1">{errors.jumlah}</p>}

                                            {/* Preview Penambahan Stok Riil */}
                                            {selectedBarangObj && data.rasio_konversi > 1 && (
                                                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg">
                                                    💡 Total stok bertambah di gudang: <strong>{data.jumlah * data.rasio_konversi} {baseSatuan}</strong> ({data.jumlah} {data.satuan} × {data.rasio_konversi} {baseSatuan}).
                                                </p>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Waktu Masuk</label>
                                <input 
                                    type="datetime-local"
                                    value={data.tanggal_masuk}
                                    onChange={(e) => setData('tanggal_masuk', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs px-3 h-10 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="pt-3 flex gap-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Stok Masuk'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
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
