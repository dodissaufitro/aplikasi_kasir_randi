import { Head, router } from '@inertiajs/react';
import { 
    Package, 
    ShoppingCart, 
    Plus, 
    Minus, 
    Trash2, 
    Search, 
    CreditCard, 
    Wallet,
    Printer,
    CheckCircle2,
    X,
    User
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';

interface Barang {
    id_barang: number;
    nama_barang: string;
    harga_beli: number;
    harga_jual: number;
    stok: number;
}

interface Pelanggan {
    id_pelanggan: number;
    nama_pelanggan: string;
    no_telp: string;
    total_hutang?: number;
}

interface CartItem extends Barang {
    jumlah: number;
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
    pelanggan: Pelanggan[];
    flash: {
        success?: string;
        error?: string;
    };
}

export default function Kasir({ auth, barang, pelanggan, flash }: Props) {
    const [currentTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [jenisPembayaran, setJenisPembayaran] = useState<'tunai' | 'hutang'>('tunai');
    const [selectedPelanggan, setSelectedPelanggan] = useState<string>('');
    const [nominalBayar, setNominalBayar] = useState<number | ''>('');
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Struk Modal State
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastReceiptData, setLastReceiptData] = useState<{
        nomorTrx: string;
        items: CartItem[];
        total: number;
        bayar: number;
        kembalian: number;
        jenis: string;
        pelangganNama: string;
        kasirNama: string;
        waktu: string;
    } | null>(null);

    // Filter barang
    const filteredBarang = useMemo(() => {
        return barang.filter(b => b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [barang, searchQuery]);

    // Total Tagihan
    const totalHarga = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.harga_jual * item.jumlah), 0);
    }, [cart]);

    // Kembalian
    const kembalian = useMemo(() => {
        if (jenisPembayaran !== 'tunai') return 0;
        const bayar = typeof nominalBayar === 'number' ? nominalBayar : 0;
        return Math.max(0, bayar - totalHarga);
    }, [nominalBayar, totalHarga, jenisPembayaran]);

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    // Cart Handlers
    const addToCart = (item: Barang) => {
        setCart(prev => {
            const existing = prev.find(p => p.id_barang === item.id_barang);
            if (existing) {
                if (existing.jumlah >= item.stok) {
                    alert(`Stok maksimal untuk ${item.nama_barang} adalah ${item.stok}`);
                    return prev;
                }
                return prev.map(p => p.id_barang === item.id_barang ? { ...p, jumlah: p.jumlah + 1 } : p);
            }
            return [...prev, { ...item, jumlah: 1 }];
        });
    };

    const minFromCart = (id: number) => {
        setCart(prev => {
            return prev.map(p => p.id_barang === id ? { ...p, jumlah: Math.max(1, p.jumlah - 1) } : p);
        });
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(p => p.id_barang !== id));
    };

    // Quick cash buttons
    const setQuickCash = (amount: number) => {
        setNominalBayar(amount);
    };

    // Checkout
    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (cart.length === 0) {
            setErrorMessage('Keranjang belanja masih kosong!');
            return;
        }

        if (jenisPembayaran === 'hutang' && !selectedPelanggan) {
            setErrorMessage('Wajib memilih data pelanggan untuk transaksi hutang!');
            return;
        }

        if (jenisPembayaran === 'tunai') {
            const bayar = typeof nominalBayar === 'number' ? nominalBayar : 0;
            if (bayar < totalHarga) {
                setErrorMessage(`Uang pembayaran kurang ${formatRupiah(totalHarga - bayar)}`);
                return;
            }
        }

        const itemsPayload = cart.map(item => ({
            id_barang: item.id_barang,
            jumlah: item.jumlah,
            harga_jual: item.harga_jual
        }));

        setProcessing(true);

        const currentCartCopy = [...cart];
        const currentTotal = totalHarga;
        const currentBayar = typeof nominalBayar === 'number' ? nominalBayar : totalHarga;
        const currentKembalian = kembalian;
        const currentJenis = jenisPembayaran;
        const selectedPelangganObj = pelanggan.find(p => p.id_pelanggan.toString() === selectedPelanggan);
        const pelangganNama = selectedPelangganObj ? selectedPelangganObj.nama_pelanggan : 'Pelanggan Umum';

        router.post(route('kasir.checkout'), {
            items: itemsPayload,
            jenis_pembayaran: jenisPembayaran,
            id_pelanggan: selectedPelanggan ? selectedPelanggan : null
        }, {
            onSuccess: () => {
                setProcessing(false);
                setLastReceiptData({
                    nomorTrx: 'TRX-' + Date.now().toString().slice(-6),
                    items: currentCartCopy,
                    total: currentTotal,
                    bayar: currentBayar,
                    kembalian: currentKembalian,
                    jenis: currentJenis,
                    pelangganNama: pelangganNama,
                    kasirNama: auth.user.nama_lengkap,
                    waktu: new Date().toLocaleString('id-ID')
                });
                setShowReceipt(true);
                setCart([]);
                setNominalBayar('');
                setSelectedPelanggan('');
            },
            onError: (errors) => {
                setProcessing(false);
                const firstErr = Object.values(errors)[0] as string;
                setErrorMessage(firstErr || 'Gagal memproses transaksi. Cek stok barang.');
            }
        });
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
            <Head title="Mesin Kasir - Kasir Pro" />

            {/* Sidebar Terpadu */}
            <Sidebar auth={auth} />

            {/* Katalog Barang (Tengah) */}
            <main className="flex-1 flex flex-col overflow-hidden relative border-r border-slate-200 dark:border-slate-800">
                <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10 shrink-0">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari barang atau scan barcode..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-sm border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-200 rounded-xl outline-none transition-all"
                        />
                    </div>
                    <div className="text-xs font-semibold text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        {currentTime} WIB
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
                    {/* Pesan Flash atau Error */}
                    {flash?.success && (
                        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            {flash.success}
                        </div>
                    )}
                    {errorMessage && (
                        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-100 dark:border-rose-800 flex items-center justify-between">
                            <span>{errorMessage}</span>
                            <button onClick={() => setErrorMessage(null)}><X className="w-4 h-4" /></button>
                        </div>
                    )}

                    {/* Grid Barang */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredBarang.length > 0 ? filteredBarang.map(item => (
                            <div 
                                key={item.id_barang} 
                                onClick={() => addToCart(item)}
                                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600 transition-colors">
                                        <Package className="w-10 h-10" />
                                    </div>
                                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.nama_barang}</h3>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-slate-500">Stok: <b className="text-slate-700 dark:text-slate-300">{item.stok}</b></span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                    <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{formatRupiah(item.harga_jual)}</p>
                                    <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                                Tidak ada produk yang ditemukan.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Panel Keranjang & Checkout (Kanan) */}
            <aside className="w-[420px] bg-white dark:bg-slate-900 flex flex-col shrink-0">
                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-indigo-600" /> Pesanan Saat Ini
                    </h2>
                    <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full text-xs font-bold">
                        {cart.length} Jenis
                    </span>
                </div>

                {/* List Item Keranjang */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                <ShoppingCart className="w-8 h-8" />
                            </div>
                            <p className="text-sm">Keranjang masih kosong</p>
                            <p className="text-xs text-slate-400">Klik item di katalog untuk menambahkan</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id_barang} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">{item.nama_barang}</h4>
                                    <p className="text-indigo-600 dark:text-indigo-400 font-bold text-xs mt-0.5">{formatRupiah(item.harga_jual * item.jumlah)}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => minFromCart(item.id_barang)} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 text-slate-600 dark:text-slate-200">
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center font-bold text-xs">{item.jumlah}</span>
                                    <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 text-slate-600 dark:text-slate-200">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => removeFromCart(item.id_barang)} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center hover:bg-rose-100 ml-1">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Form Pembayaran */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-4">
                    <form onSubmit={handleCheckout} className="space-y-3">
                        {/* Metode Pembayaran */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setJenisPembayaran('tunai')}
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 font-bold text-xs transition-all ${
                                    jenisPembayaran === 'tunai'
                                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                <Wallet className="w-4 h-4" />
                                <span>Tunai (Cash)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setJenisPembayaran('hutang')}
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 font-bold text-xs transition-all ${
                                    jenisPembayaran === 'hutang'
                                        ? 'border-rose-500 bg-rose-50/60 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>Hutang (Kredit)</span>
                            </button>
                        </div>

                        {/* Pilihan Pelanggan */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                    <User className="w-3 h-3" /> Pelanggan {jenisPembayaran === 'hutang' && <span className="text-rose-500">*</span>}
                                </label>
                            </div>
                            <select 
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs h-9 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={selectedPelanggan}
                                onChange={(e) => setSelectedPelanggan(e.target.value)}
                                required={jenisPembayaran === 'hutang'}
                            >
                                <option value="">-- Pelanggan Umum (Anonim) --</option>
                                {pelanggan.map(p => (
                                    <option key={p.id_pelanggan} value={p.id_pelanggan}>
                                        {p.nama_pelanggan} {p.no_telp ? `(${p.no_telp})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Input Uang Bayar jika Tunai */}
                        {jenisPembayaran === 'tunai' && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <span>Uang Diterima</span>
                                    {typeof nominalBayar === 'number' && nominalBayar > 0 && (
                                        <span className={nominalBayar >= totalHarga ? 'text-emerald-600 font-bold' : 'text-rose-500'}>
                                            Kembalian: {formatRupiah(kembalian)}
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="number"
                                    placeholder="Contoh: 50000"
                                    value={nominalBayar}
                                    onChange={(e) => setNominalBayar(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm h-9 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                {/* Tombol Cepat Nominal */}
                                <div className="flex gap-1.5 pt-1">
                                    <button 
                                        type="button" 
                                        onClick={() => setQuickCash(totalHarga)} 
                                        className="flex-1 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                                    >
                                        Uang Pas
                                    </button>
                                    {[20000, 50000, 100000].map(val => (
                                        <button 
                                            key={val} 
                                            type="button" 
                                            onClick={() => setQuickCash(val)} 
                                            className="flex-1 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                                        >
                                            {val / 1000}k
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Total Tagihan Banner */}
                        <div className="pt-2 flex justify-between items-baseline border-t border-slate-200 dark:border-slate-800">
                            <span className="text-xs font-semibold text-slate-500">Total Tagihan</span>
                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatRupiah(totalHarga)}</span>
                        </div>

                        {/* Tombol Simpan Transaksi */}
                        <button 
                            type="submit" 
                            disabled={processing || cart.length === 0}
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
                        >
                            {processing ? 'Menyimpan Transaksi...' : 'Selesaikan Transaksi (Bayar)'}
                        </button>
                    </form>
                </div>
            </aside>

            {/* Modal Cetak Struk Belanja */}
            {showReceipt && lastReceiptData && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center pb-4 border-b border-dashed border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Transaksi Berhasil!</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{lastReceiptData.nomorTrx}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{lastReceiptData.waktu}</p>
                        </div>

                        {/* Info Kasir & Pelanggan */}
                        <div className="py-3 text-xs space-y-1 text-slate-600 dark:text-slate-400 border-b border-dashed border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between">
                                <span>Kasir:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{lastReceiptData.kasirNama}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pelanggan:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{lastReceiptData.pelangganNama}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Jenis:</span>
                                <span className="font-bold uppercase text-indigo-600">{lastReceiptData.jenis}</span>
                            </div>
                        </div>

                        {/* List Items */}
                        <div className="py-3 space-y-2 max-h-48 overflow-y-auto border-b border-dashed border-slate-200 dark:border-slate-700">
                            {lastReceiptData.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                    <div className="flex-1 pr-2">
                                        <p className="font-medium text-slate-800 dark:text-slate-200">{it.nama_barang}</p>
                                        <p className="text-[10px] text-slate-400">{it.jumlah} x {formatRupiah(it.harga_jual)}</p>
                                    </div>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatRupiah(it.jumlah * it.harga_jual)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Rincian Total */}
                        <div className="py-3 space-y-1 text-xs">
                            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                                <span>Total:</span>
                                <span>{formatRupiah(lastReceiptData.total)}</span>
                            </div>
                            {lastReceiptData.jenis === 'tunai' && (
                                <>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Bayar Tunai:</span>
                                        <span>{formatRupiah(lastReceiptData.bayar)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-emerald-600">
                                        <span>Kembalian:</span>
                                        <span>{formatRupiah(lastReceiptData.kembalian)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 flex gap-2">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Printer className="w-4 h-4" /> Cetak Struk
                            </button>
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
