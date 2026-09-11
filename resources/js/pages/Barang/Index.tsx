import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
    Package, 
    Plus, 
    Edit, 
    Trash2, 
    X, 
    FileSpreadsheet, 
    Upload, 
    Download, 
    Barcode, 
    CheckCircle, 
    AlertCircle, 
    FileUp,
    Search,
    Filter,
    Layers,
    DollarSign,
    Boxes,
    ImageIcon,
    Tag,
    Eye,
    Check,
    AlertTriangle,
    Building2,
    MapPin,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import Sidebar from '@/components/Sidebar';

interface SatuanKonversi {
    id?: number;
    nama_satuan: string;
    rasio_konversi: number;
    harga_jual_satuan?: number | null;
    barcode_satuan?: string | null;
}

interface Barang {
    id_barang: number;
    kode_barang?: string;
    barcode?: string | null;
    foto_produk?: string | null;
    foto_url?: string | null;
    nama_barang: string;
    kategori?: string | null;
    merk?: string | null;
    supplier?: string | null;
    satuan: string;
    harga_beli: number;
    harga_jual: number;
    harga_grosir?: number | null;
    stok: number;
    stok_minimum: number;
    lokasi_rak?: string | null;
    is_aktif: boolean;
    stok_konversi_text?: string;
    satuan_konversi?: SatuanKonversi[];
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
    kategori_list?: string[];
    merk_list?: string[];
    flash: { success?: string; error?: string };
}

const SATUAN_OPTIONS = [
    'PCS',
    'Lusin',
    'Dus/Box',
    'Pack',
    'Kg',
    'Gram',
    'Liter',
    'Botol',
    'Sak'
];

const KATEGORI_PRESETS = [
    'Makanan',
    'Minuman',
    'Sembako',
    'Snack & Biskuit',
    'Rokok & Tembakau',
    'Kebersihan & Mandi',
    'Bumbu Dapur',
    'Obat & Kesehatan',
    'Alat Tulis',
    'Lainnya'
];

export default function BarangIndex({ auth, barang, kategori_list = [], merk_list = [], flash }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeFormTab, setActiveFormTab] = useState<'identitas' | 'foto' | 'harga' | 'konversi'>('identitas');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKategori, setSelectedKategori] = useState('all');
    const [selectedMerk, setSelectedMerk] = useState('all');
    const [selectedStokStatus, setSelectedStokStatus] = useState('all');
    const [selectedAktifStatus, setSelectedAktifStatus] = useState('all');

    // Local form state
    const [formState, setFormState] = useState({
        kode_barang: '',
        barcode: '',
        nama_barang: '',
        kategori: 'Makanan',
        merk: '',
        supplier: '',
        satuan: 'PCS',
        harga_beli: '',
        harga_jual: '',
        harga_grosir: '',
        stok: '',
        stok_minimum: '5',
        lokasi_rak: '',
        is_aktif: true,
        foto_produk: null as File | null,
        hapus_foto: false,
    });

    // Multi-satuan konversi state
    const [konversiList, setKonversiList] = useState<SatuanKonversi[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Import State
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importProcessing, setImportProcessing] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
    };

    // Filtered data barang
    const filteredBarang = useMemo(() => {
        return barang.filter(b => {
            const matchesSearch = !searchQuery.trim() || 
                (b.nama_barang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (b.kode_barang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (b.barcode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (b.merk || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesKategori = selectedKategori === 'all' || b.kategori === selectedKategori;
            const matchesMerk = selectedMerk === 'all' || b.merk === selectedMerk;

            let matchesStok = true;
            if (selectedStokStatus === 'habis') {
                matchesStok = b.stok <= 0;
            } else if (selectedStokStatus === 'menipis') {
                matchesStok = b.stok > 0 && b.stok <= (b.stok_minimum || 5);
            } else if (selectedStokStatus === 'tersedia') {
                matchesStok = b.stok > (b.stok_minimum || 5);
            }

            let matchesAktif = true;
            if (selectedAktifStatus === 'aktif') {
                matchesAktif = b.is_aktif === true;
            } else if (selectedAktifStatus === 'nonaktif') {
                matchesAktif = b.is_aktif === false;
            }

            return matchesSearch && matchesKategori && matchesMerk && matchesStok && matchesAktif;
        });
    }, [barang, searchQuery, selectedKategori, selectedMerk, selectedStokStatus, selectedAktifStatus]);

    // Summary Metrics
    const totalAsetStok = useMemo(() => {
        return barang.reduce((acc, b) => acc + (b.stok * b.harga_beli), 0);
    }, [barang]);

    const stokMenipisCount = useMemo(() => {
        return barang.filter(b => b.stok > 0 && b.stok <= (b.stok_minimum || 5)).length;
    }, [barang]);

    const stokHabisCount = useMemo(() => {
        return barang.filter(b => b.stok <= 0).length;
    }, [barang]);

    // Modal Handlers
    const openCreateModal = () => {
        setEditingId(null);
        setFormState({
            kode_barang: '',
            barcode: '',
            nama_barang: '',
            kategori: 'Makanan',
            merk: '',
            supplier: '',
            satuan: 'PCS',
            harga_beli: '',
            harga_jual: '',
            harga_grosir: '',
            stok: '0',
            stok_minimum: '5',
            lokasi_rak: '',
            is_aktif: true,
            foto_produk: null,
            hapus_foto: false,
        });
        setKonversiList([]);
        setPreviewPhotoUrl(null);
        setFormErrors({});
        setActiveFormTab('identitas');
        setIsModalOpen(true);
    };

    const openEditModal = (b: Barang) => {
        setEditingId(b.id_barang);
        setFormState({
            kode_barang: b.kode_barang || '',
            barcode: b.barcode || '',
            nama_barang: b.nama_barang,
            kategori: b.kategori || 'Umum',
            merk: b.merk || '',
            supplier: b.supplier || '',
            satuan: b.satuan || 'PCS',
            harga_beli: b.harga_beli.toString(),
            harga_jual: b.harga_jual.toString(),
            harga_grosir: b.harga_grosir ? b.harga_grosir.toString() : '',
            stok: b.stok.toString(),
            stok_minimum: (b.stok_minimum || 5).toString(),
            lokasi_rak: b.lokasi_rak || '',
            is_aktif: b.is_aktif !== false,
            foto_produk: null,
            hapus_foto: false,
        });
        setKonversiList(b.satuan_konversi ? [...b.satuan_konversi] : []);
        setPreviewPhotoUrl(b.foto_url || null);
        setFormErrors({});
        setActiveFormTab('identitas');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormErrors({});
    };

    // Konversi Row Handlers
    const addKonversiRow = () => {
        setKonversiList(prev => [
            ...prev,
            {
                nama_satuan: 'Dus',
                rasio_konversi: 24,
                harga_jual_satuan: null,
                barcode_satuan: '',
            }
        ]);
    };

    const removeKonversiRow = (idx: number) => {
        setKonversiList(prev => prev.filter((_, i) => i !== idx));
    };

    const updateKonversiRow = (idx: number, field: keyof SatuanKonversi, value: any) => {
        setKonversiList(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    };

    // Form Submit with FormData
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        const formData = new FormData();
        formData.append('kode_barang', formState.kode_barang);
        formData.append('barcode', formState.barcode);
        formData.append('nama_barang', formState.nama_barang);
        formData.append('kategori', formState.kategori);
        formData.append('merk', formState.merk);
        formData.append('supplier', formState.supplier);
        formData.append('satuan', formState.satuan);
        formData.append('harga_beli', formState.harga_beli);
        formData.append('harga_jual', formState.harga_jual);
        if (formState.harga_grosir) formData.append('harga_grosir', formState.harga_grosir);
        formData.append('stok', formState.stok);
        formData.append('stok_minimum', formState.stok_minimum);
        formData.append('lokasi_rak', formState.lokasi_rak);
        formData.append('is_aktif', formState.is_aktif ? '1' : '0');

        if (formState.foto_produk) {
            formData.append('foto_produk', formState.foto_produk);
        }
        if (formState.hapus_foto) {
            formData.append('hapus_foto', '1');
        }

        // Konversi Array as JSON
        formData.append('konversi', JSON.stringify(konversiList));

        if (editingId) {
            formData.append('_method', 'PUT');
            router.post(route('barang.update', editingId), formData, {
                onSuccess: () => {
                    setIsSubmitting(false);
                    closeModal();
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    setFormErrors(errs);
                }
            });
        } else {
            router.post(route('barang.store'), formData, {
                onSuccess: () => {
                    setIsSubmitting(false);
                    closeModal();
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    setFormErrors(errs);
                }
            });
        }
    };

    const handleDelete = (id: number, nama: string) => {
        if (confirm(`Yakin ingin menghapus produk "${nama}"? Data transaksi yang terkait mungkin ikut terdampak.`)) {
            router.delete(route('barang.destroy', id));
        }
    };

    // Import Handlers
    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            setImportError('Silakan pilih file Excel (.xlsx, .xls) atau CSV terlebih dahulu.');
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile);

        setImportProcessing(true);
        setImportError(null);

        router.post(route('barang.import'), formData, {
            onSuccess: () => {
                setImportProcessing(false);
                setIsImportModalOpen(false);
                setImportFile(null);
            },
            onError: (errs) => {
                setImportProcessing(false);
                setImportError(errs.error || 'Gagal mengimpor file data barang.');
            }
        });
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
            <Head title="Master Data Barang & Satuan - KasirPro" />

            <div className="h-full shrink-0">
                <Sidebar auth={auth} />
            </div>

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header Toolbar */}
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                    Master Data Barang
                                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                        Multi-Satuan
                                    </span>
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Katalog produk, barcode, foto, harga grosir, dan sistem konversi satuan bertingkat
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={route('barang.export')}
                                download
                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export Excel</span>
                            </a>

                            <button
                                onClick={() => {
                                    setImportError(null);
                                    setImportFile(null);
                                    setIsImportModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all"
                            >
                                <FileUp className="w-4 h-4" />
                                <span>Import Excel</span>
                            </button>

                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tambah Produk</span>
                            </button>
                        </div>
                    </div>

                    {/* KPI Quick Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Produk</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{barang.length} Item</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nilai Aset Stok</p>
                            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{formatRupiah(totalAsetStok)}</p>
                        </div>
                        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Stok Menipis (≤ Min)</p>
                            <p className="text-lg font-black text-amber-600 mt-0.5">{stokMenipisCount} Produk</p>
                        </div>
                        <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/50 dark:border-rose-900/40">
                            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Stok Habis (0)</p>
                            <p className="text-lg font-black text-rose-600 mt-0.5">{stokHabisCount} Produk</p>
                        </div>
                    </div>
                </header>

                {/* Filter & Search Bar */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="relative flex-1 min-w-[240px] max-w-md">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari Kode, Barcode, Nama Produk, atau Merk..."
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Filter Kategori */}
                            <select
                                value={selectedKategori}
                                onChange={(e) => setSelectedKategori(e.target.value)}
                                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden"
                            >
                                <option value="all">Semua Kategori</option>
                                {kategori_list.map((k) => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>

                            {/* Filter Status Stok */}
                            <select
                                value={selectedStokStatus}
                                onChange={(e) => setSelectedStokStatus(e.target.value)}
                                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden"
                            >
                                <option value="all">Semua Stok</option>
                                <option value="tersedia">Stok Tersedia</option>
                                <option value="menipis">Stok Menipis</option>
                                <option value="habis">Stok Habis</option>
                            </select>

                            {/* Filter Status Aktif */}
                            <select
                                value={selectedAktifStatus}
                                onChange={(e) => setSelectedAktifStatus(e.target.value)}
                                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden"
                            >
                                <option value="all">Semua Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Data Barang */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 uppercase tracking-wider text-[10px]">
                                        <th className="py-3 px-4 font-bold">Produk</th>
                                        <th className="py-3 px-4 font-bold">Identitas / Barcode</th>
                                        <th className="py-3 px-4 font-bold">Kategori & Merk</th>
                                        <th className="py-3 px-4 font-bold">Satuan & Konversi</th>
                                        <th className="py-3 px-4 font-bold text-right">Harga Beli</th>
                                        <th className="py-3 px-4 font-bold text-right">Harga Jual / Grosir</th>
                                        <th className="py-3 px-4 font-bold text-center">Stok Cerdas</th>
                                        <th className="py-3 px-4 font-bold text-center">Lokasi Rak</th>
                                        <th className="py-3 px-4 font-bold text-center">Status</th>
                                        <th className="py-3 px-4 font-bold text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredBarang.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-slate-400">
                                                Tidak ada produk yang sesuai dengan filter pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBarang.map((b) => (
                                            <tr key={b.id_barang} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                {/* Foto & Nama */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            onClick={() => b.foto_url && setPreviewPhotoUrl(b.foto_url)}
                                                            className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                                        >
                                                            {b.foto_url ? (
                                                                <img src={b.foto_url} alt={b.nama_barang} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package className="w-5 h-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                                                {b.nama_barang}
                                                            </p>
                                                            {b.supplier && (
                                                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                                                    Supplier: {b.supplier}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Kode & Barcode */}
                                                <td className="py-3 px-4">
                                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">
                                                        {b.kode_barang || '-'}
                                                    </span>
                                                    {b.barcode ? (
                                                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-mono">
                                                            <Barcode className="w-3 h-3 text-slate-400" />
                                                            <span>{b.barcode}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">Tanpa Barcode</span>
                                                    )}
                                                </td>

                                                {/* Kategori & Merk */}
                                                <td className="py-3 px-4">
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        {b.kategori || 'Umum'}
                                                    </span>
                                                    {b.merk && (
                                                        <span className="text-[10px] text-slate-500 block mt-0.5">
                                                            Merk: {b.merk}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Satuan & Konversi */}
                                                <td className="py-3 px-4">
                                                    <div className="space-y-1">
                                                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                                            Dasar: {b.satuan || 'PCS'}
                                                        </span>
                                                        {b.satuan_konversi && b.satuan_konversi.length > 0 && (
                                                            <div className="text-[10px] text-slate-500 font-medium">
                                                                {b.satuan_konversi.map((k, i) => (
                                                                    <div key={i} className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                                        <span>• 1 {k.nama_satuan} = {k.rasio_konversi} {b.satuan}</span>
                                                                        {k.harga_jual_satuan && (
                                                                            <span className="text-slate-400 font-normal">({formatRupiah(k.harga_jual_satuan)})</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Harga Beli */}
                                                <td className="py-3 px-4 text-right text-slate-500">
                                                    {formatRupiah(b.harga_beli)}
                                                </td>

                                                {/* Harga Jual & Grosir */}
                                                <td className="py-3 px-4 text-right">
                                                    <p className="font-bold text-slate-900 dark:text-white">
                                                        {formatRupiah(b.harga_jual)}
                                                    </p>
                                                    {b.harga_grosir && (
                                                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block mt-0.5">
                                                            Grosir: {formatRupiah(b.harga_grosir)}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Stok Cerdas */}
                                                <td className="py-3 px-4 text-center">
                                                    <p className={`font-black text-sm ${
                                                        b.stok <= 0 ? 'text-rose-600' : b.stok <= (b.stok_minimum || 5) ? 'text-amber-600' : 'text-emerald-600'
                                                    }`}>
                                                        {b.stok_konversi_text || `${b.stok} ${b.satuan}`}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        Min: {b.stok_minimum || 5} {b.satuan}
                                                    </span>
                                                </td>

                                                {/* Lokasi Rak */}
                                                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                                                    {b.lokasi_rak ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                            <MapPin className="w-3 h-3 text-slate-400" />
                                                            {b.lokasi_rak}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>

                                                {/* Status Aktif */}
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        b.is_aktif
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        {b.is_aktif ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>

                                                {/* Aksi */}
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => openEditModal(b)}
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                                                            title="Edit Data Produk"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(b.id_barang, b.nama_barang)}
                                                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                                            title="Hapus Produk"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* MODAL TAMBAH & EDIT MASTER BARANG LENGKAP */}
                {/* ========================================================================= */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        {editingId ? 'Edit Data Master Produk' : 'Tambah Produk Baru'}
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Lengkapi 15 atribut produk dan sistem konversi multi-satuan
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Section Navigation Tabs */}
                            <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-800/30 gap-1 overflow-x-auto">
                                {[
                                    { id: 'identitas', label: '1. Identitas Produk', icon: Tag },
                                    { id: 'foto', label: '2. Foto Produk', icon: ImageIcon },
                                    { id: 'harga', label: '3. Satuan & Harga', icon: DollarSign },
                                    { id: 'konversi', label: '4. Multi-Satuan (Konversi)', icon: Layers },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeFormTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveFormTab(tab.id as any)}
                                            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                                                isActive
                                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Modal Form Body */}
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                                {Object.keys(formErrors).length > 0 && (
                                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 text-xs rounded-xl">
                                        <p className="font-bold mb-1">Terdapat kesalahan pengisian:</p>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            {Object.values(formErrors).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* TAB 1: IDENTITAS PRODUK */}
                                {activeFormTab === 'identitas' && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Kode Barang (Opsional / Otomatis)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formState.kode_barang}
                                                    onChange={(e) => setFormState({ ...formState, kode_barang: e.target.value })}
                                                    placeholder="Contoh: BRG000125"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Barcode Kemasan Fisik (EAN-13 / UPC)
                                                </label>
                                                <div className="relative">
                                                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                    <input
                                                        type="text"
                                                        value={formState.barcode}
                                                        onChange={(e) => setFormState({ ...formState, barcode: e.target.value })}
                                                        placeholder="Contoh: 8998866200225"
                                                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                Nama Produk <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formState.nama_barang}
                                                onChange={(e) => setFormState({ ...formState, nama_barang: e.target.value })}
                                                placeholder="Contoh: Indomie Goreng Spesial 85g"
                                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-medium"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Kategori Produk
                                                </label>
                                                <input
                                                    type="text"
                                                    list="kategori-presets"
                                                    value={formState.kategori}
                                                    onChange={(e) => setFormState({ ...formState, kategori: e.target.value })}
                                                    placeholder="Pilih atau ketik kategori..."
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                                                />
                                                <datalist id="kategori-presets">
                                                    {KATEGORI_PRESETS.map((k) => (
                                                        <option key={k} value={k} />
                                                    ))}
                                                </datalist>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Merk / Brand
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formState.merk}
                                                    onChange={(e) => setFormState({ ...formState, merk: e.target.value })}
                                                    placeholder="Contoh: Indomie, Aqua, Wings"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Supplier / Rekanan Pemasok
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formState.supplier}
                                                    onChange={(e) => setFormState({ ...formState, supplier: e.target.value })}
                                                    placeholder="Contoh: PT Indofood Sukses Makmur"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Lokasi / Penempatan Rak
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formState.lokasi_rak}
                                                    onChange={(e) => setFormState({ ...formState, lokasi_rak: e.target.value })}
                                                    placeholder="Contoh: Rak A-01, Etalase Depan"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                                                />
                                            </div>
                                        </div>

                                        {/* Status Aktif / Nonaktif */}
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">Status Produk Aktif</p>
                                                <p className="text-[11px] text-slate-400">Jika nonaktif, produk disembunyikan dari katalog kasir</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormState({ ...formState, is_aktif: !formState.is_aktif })}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    formState.is_aktif 
                                                        ? 'bg-emerald-600 text-white shadow-xs' 
                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                {formState.is_aktif ? 'Aktif Dijual' : 'Nonaktif'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: FOTO PRODUK */}
                                {activeFormTab === 'foto' && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 text-center">
                                            {previewPhotoUrl ? (
                                                <div className="space-y-3">
                                                    <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-md">
                                                        <img src={previewPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                                                        >
                                                            Ganti Foto
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormState({ ...formState, foto_produk: null, hapus_foto: true });
                                                                setPreviewPhotoUrl(null);
                                                            }}
                                                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
                                                        >
                                                            Hapus Foto
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                                                        <ImageIcon className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        Unggah Foto Kemasan / Produk
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        Format: JPG, PNG, WEBP (Maksimal 2 MB)
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                                                    >
                                                        Pilih Gambar
                                                    </button>
                                                </div>
                                            )}

                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setFormState({ ...formState, foto_produk: file, hapus_foto: false });
                                                        setPreviewPhotoUrl(URL.createObjectURL(file));
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: SATUAN DASAR, HARGA & STOK */}
                                {activeFormTab === 'harga' && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
                                            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                                                Satuan Dasar (Base Unit)
                                            </p>
                                            <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
                                                Satuan terkecil yang digunakan untuk menghitung stok inventaris dasar di toko (misal: PCS, Botol, Kg, atau Liter).
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Pilihan Satuan Dasar <span className="text-rose-500">*</span>
                                                </label>
                                                <select
                                                    value={formState.satuan}
                                                    onChange={(e) => setFormState({ ...formState, satuan: e.target.value })}
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-bold text-indigo-600"
                                                >
                                                    {SATUAN_OPTIONS.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Stok Saat Ini ({formState.satuan}) <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={formState.stok}
                                                    onChange={(e) => setFormState({ ...formState, stok: e.target.value })}
                                                    placeholder="Contoh: 120"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Harga Beli Pokok (Rp) <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={formState.harga_beli}
                                                    onChange={(e) => setFormState({ ...formState, harga_beli: e.target.value })}
                                                    placeholder="Contoh: 2700"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-semibold"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Harga Jual Satuan (Rp) <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={formState.harga_jual}
                                                    onChange={(e) => setFormState({ ...formState, harga_jual: e.target.value })}
                                                    placeholder="Contoh: 3500"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-bold text-emerald-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Harga Grosir (Opsional) (Rp)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formState.harga_grosir}
                                                    onChange={(e) => setFormState({ ...formState, harga_grosir: e.target.value })}
                                                    placeholder="Contoh: 3200"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-semibold text-purple-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    Ambang Stok Minimum (Peringatan Menipis)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formState.stok_minimum}
                                                    onChange={(e) => setFormState({ ...formState, stok_minimum: e.target.value })}
                                                    placeholder="Contoh: 5"
                                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                                                />
                                            </div>

                                            <div className="flex items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                                                <p className="text-[11px] text-slate-500">
                                                    Margin Laba: <span className="font-bold text-emerald-600">
                                                        {formatRupiah((Number(formState.harga_jual) || 0) - (Number(formState.harga_beli) || 0))}
                                                    </span> per {formState.satuan}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: SISTEM KONVERSI MULTI-SATUAN (POIN 5) */}
                                {activeFormTab === 'konversi' && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl">
                                            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                                                <Layers className="w-4 h-4" />
                                                Sistem Konversi Satuan Profesional
                                            </p>
                                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                                                Contoh: <strong>1 Dus = 24 {formState.satuan}</strong>. Jika stok 120 {formState.satuan}, sistem otomatis mengetahui setara dengan <strong>5 Dus</strong>. Kasir bisa menjual per Dus atau per {formState.satuan}, dan stok dasar akan dipotong secara akurat!
                                            </p>
                                        </div>

                                        {/* List Konversi Rows */}
                                        <div className="space-y-3">
                                            {konversiList.length === 0 ? (
                                                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                                    <p className="text-xs text-slate-400">Belum ada satuan konversi tambahan.</p>
                                                    <button
                                                        type="button"
                                                        onClick={addKonversiRow}
                                                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>Tambah Satuan (Contoh: Dus / Lusin / Box)</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                konversiList.map((row, idx) => (
                                                    <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                                Tingkat Satuan #{idx + 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeKonversiRow(idx)}
                                                                className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                                                            >
                                                                Hapus
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                                                    Nama Satuan Besar
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={row.nama_satuan}
                                                                    onChange={(e) => updateKonversiRow(idx, 'nama_satuan', e.target.value)}
                                                                    placeholder="Contoh: Dus"
                                                                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-bold"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                                                    Isi / Rasio (per {formState.satuan})
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="2"
                                                                    value={row.rasio_konversi}
                                                                    onChange={(e) => updateKonversiRow(idx, 'rasio_konversi', parseInt(e.target.value) || 2)}
                                                                    placeholder="Contoh: 24"
                                                                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-bold text-indigo-600"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                                                    Harga Jual per {row.nama_satuan || 'Satuan'}
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={row.harga_jual_satuan || ''}
                                                                    onChange={(e) => updateKonversiRow(idx, 'harga_jual_satuan', e.target.value ? parseFloat(e.target.value) : null)}
                                                                    placeholder={formatRupiah((row.rasio_konversi || 1) * (parseFloat(formState.harga_jual) || 0))}
                                                                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-semibold"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                                                    Barcode Kemasan (Karton)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={row.barcode_satuan || ''}
                                                                    onChange={(e) => updateKonversiRow(idx, 'barcode_satuan', e.target.value)}
                                                                    placeholder="Barcode Dus fisik"
                                                                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden font-mono"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Live Calculation Preview */}
                                                        <div className="text-[11px] text-slate-500 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            💡 1 {row.nama_satuan || 'Satuan'} = {row.rasio_konversi} {formState.satuan}. 
                                                            {Number(formState.stok) > 0 && (
                                                                <span> Stok {formState.stok} {formState.satuan} setara dengan <strong>{Math.floor(Number(formState.stok) / (row.rasio_konversi || 1))} {row.nama_satuan} {Number(formState.stok) % (row.rasio_konversi || 1) > 0 ? `+ ${Number(formState.stok) % (row.rasio_konversi || 1)} ${formState.satuan}` : ''}</strong>.</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}

                                            {konversiList.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={addKonversiRow}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>+ Tambah Tingkat Satuan Lain (misal: Lusin / Box)</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Modal Footer */}
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {activeFormTab !== 'identitas' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (activeFormTab === 'konversi') setActiveFormTab('harga');
                                                    else if (activeFormTab === 'harga') setActiveFormTab('foto');
                                                    else if (activeFormTab === 'foto') setActiveFormTab('identitas');
                                                }}
                                                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                            >
                                                Kembali
                                            </button>
                                        )}
                                        {activeFormTab !== 'konversi' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (activeFormTab === 'identitas') setActiveFormTab('foto');
                                                    else if (activeFormTab === 'foto') setActiveFormTab('harga');
                                                    else if (activeFormTab === 'harga') setActiveFormTab('konversi');
                                                }}
                                                className="px-3.5 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                            >
                                                Lanjut ke Tab Berikutnya →
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Produk')}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL IMPORT DATA BARANG */}
                {/* ========================================================================= */}
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileUp className="w-5 h-5 text-indigo-600" />
                                    Import Data Barang
                                </h3>
                                <button
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleImportSubmit} className="mt-4 space-y-4">
                                {importError && (
                                    <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-200">
                                        {importError}
                                    </div>
                                )}

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                                        Unduh Template Contoh
                                    </p>
                                    <p className="text-[11px] text-slate-400 mb-3">
                                        Pastikan kolom file Anda sesuai dengan format template kami agar data dan konversi satuan terisi otomatis.
                                    </p>
                                    <a
                                        href={route('barang.template')}
                                        download
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Unduh Template Excel (.xlsx)</span>
                                    </a>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Pilih File (.xlsx / .csv)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsImportModalOpen(false)}
                                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={importProcessing || !importFile}
                                        className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50"
                                    >
                                        {importProcessing ? 'Mengimpor...' : 'Mulai Import'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Photo Viewer Modal */}
                {previewPhotoUrl && (
                    <div 
                        onClick={() => setPreviewPhotoUrl(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs cursor-pointer animate-in fade-in"
                    >
                        <div className="max-w-lg max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                            <img src={previewPhotoUrl} alt="Preview Foto Produk" className="w-full h-full object-contain" />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
