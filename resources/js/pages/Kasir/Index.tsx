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
    User,
    Barcode,
    UserPlus,
    AlertCircle,
    Check
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/mobile/MobileHeader';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import ProductThumbnail from '@/components/mobile/ProductThumbnail';

interface SatuanKonversi {
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
    satuan: string;
    harga_beli: number;
    harga_jual: number;
    harga_grosir?: number | null;
    stok: number;
    stok_konversi_text?: string;
    total_terjual?: number;
    total_terjual_text?: string;
    satuan_konversi?: SatuanKonversi[];
}

interface Pelanggan {
    id_pelanggan: number;
    nama_pelanggan: string;
    no_telp: string;
    total_hutang?: number;
}

interface CartItem {
    id_barang: number;
    nama_barang: string;
    kode_barang?: string;
    barcode?: string | null;
    satuan: string;
    satuan_dasar: string;
    rasio_konversi: number;
    harga_jual: number;
    harga_jual_dasar: number;
    jumlah: number;
    stok_dasar: number;
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

    // List Pelanggan Lokal (bisa ditambah langsung di kasir)
    const [localPelangganList, setLocalPelangganList] = useState<Pelanggan[]>(pelanggan);
    const [showAddPelangganModal, setShowAddPelangganModal] = useState(false);
    const [newPelangganNama, setNewPelangganNama] = useState('');
    const [newPelangganTelp, setNewPelangganTelp] = useState('');
    const [isSubmittingPelanggan, setIsSubmittingPelanggan] = useState(false);

    // Mobile View States
    const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');
    const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
    const [metodeBayarMobile, setMetodeBayarMobile] = useState<'tunai' | 'qris' | 'transfer'>('tunai');

    // Scan Barcode State & Ref
    const [scanBarcode, setScanBarcode] = useState('');
    const [scanFeedback, setScanFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const scanInputRef = useRef<HTMLInputElement>(null);

    // Sound Beep synthesizer untuk feedback scan
    const playBeep = (isSuccess: boolean) => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (isSuccess) {
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.12);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {
            // Audio ignore
        }
    };

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

    // Auto focus scan input saat pertama kali load dan listener global keydown untuk barcode scanner
    useEffect(() => {
        if (scanInputRef.current) {
            scanInputRef.current.focus();
        }

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            const isTypingInOtherInput = activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.tagName === 'SELECT'
            ) && activeEl !== scanInputRef.current;

            // Jika sedang mengetik di input lain atau modal sedang terbuka, jangan intersep
            if (isTypingInOtherInput || showReceipt || showAddPelangganModal) {
                return;
            }

            // Jika bukan tombol shortcut sistem, fokuskan ke scanner
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (scanInputRef.current && document.activeElement !== scanInputRef.current) {
                    scanInputRef.current.focus();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [showReceipt, showAddPelangganModal]);

    // Filter barang
    const filteredBarang = useMemo(() => {
        return barang.filter(b => 
            b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.kode_barang && b.kode_barang.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [barang, searchQuery]);

    // Filter barang khusus Mobile
    const filteredBarangMobile = useMemo(() => {
        return barang.filter(b => {
            const matchesSearch = b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (b.kode_barang && b.kode_barang.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (b.barcode && b.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
            if (!matchesSearch) return false;

            if (selectedCategory === 'Semua') return true;
            if (selectedCategory === 'Makanan') return (b.kategori || '').toLowerCase().includes('makan') || (b.kategori || '').toLowerCase().includes('snack') || (b.kategori || '').toLowerCase().includes('biskuit');
            if (selectedCategory === 'Minuman') return (b.kategori || '').toLowerCase().includes('minum');
            if (selectedCategory === 'Lainnya') return !(b.kategori || '').toLowerCase().includes('makan') && !(b.kategori || '').toLowerCase().includes('minum');
            return true;
        });
    }, [barang, searchQuery, selectedCategory]);

    // Total Tagihan
    const totalHarga = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.harga_jual * item.jumlah), 0);
    }, [cart]);

    const totalCartItemsCount = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.jumlah, 0);
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

    // Objek pelanggan terpilih untuk perhitungan hutang
    const currentSelectedPelanggan = useMemo(() => {
        return localPelangganList.find(p => p.id_pelanggan.toString() === selectedPelanggan);
    }, [localPelangganList, selectedPelanggan]);

    // Cart Handlers dengan dukungan Multi-Satuan
    const addToCart = (
        item: Barang, 
        customUnit?: string, 
        customRasio?: number, 
        customPrice?: number
    ) => {
        setCart(prev => {
            const baseSatuan = item.satuan || 'PCS';
            const selectedSatuan = customUnit || baseSatuan;
            const rasio = customRasio && customRasio > 0 ? customRasio : 1;
            const price = customPrice !== undefined && customPrice !== null ? customPrice : item.harga_jual;

            const existingIndex = prev.findIndex(p => p.id_barang === item.id_barang);

            if (existingIndex !== -1) {
                const existing = prev[existingIndex];
                const totalStokDibutuhkan = (existing.jumlah + 1) * existing.rasio_konversi;

                if (totalStokDibutuhkan > item.stok) {
                    alert(`Stok tidak mencukupi untuk ${item.nama_barang} (Sisa stok: ${item.stok} ${baseSatuan})`);
                    return prev;
                }

                const updated = [...prev];
                updated[existingIndex] = {
                    ...existing,
                    jumlah: existing.jumlah + 1
                };
                return updated;
            }

            // Cek stok untuk item baru
            if (1 * rasio > item.stok) {
                alert(`Stok tidak mencukupi untuk 1 ${selectedSatuan} ${item.nama_barang} (Dibutuhkan ${rasio} ${baseSatuan}, tersedia ${item.stok} ${baseSatuan})`);
                return prev;
            }

            const newItem: CartItem = {
                id_barang: item.id_barang,
                nama_barang: item.nama_barang,
                kode_barang: item.kode_barang,
                barcode: item.barcode,
                satuan: selectedSatuan,
                satuan_dasar: baseSatuan,
                rasio_konversi: rasio,
                harga_jual: price,
                harga_jual_dasar: item.harga_jual,
                jumlah: 1,
                stok_dasar: item.stok,
                satuan_konversi: item.satuan_konversi,
            };

            return [...prev, newItem];
        });
    };

    // Ubah Satuan pada Item Keranjang
    const changeCartItemUnit = (id_barang: number, targetUnitName: string) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id_barang !== id_barang) return item;

                if (targetUnitName === item.satuan_dasar) {
                    return {
                        ...item,
                        satuan: item.satuan_dasar,
                        rasio_konversi: 1,
                        harga_jual: item.harga_jual_dasar,
                    };
                }

                const konv = item.satuan_konversi?.find(k => k.nama_satuan === targetUnitName);
                if (konv) {
                    const newPrice = konv.harga_jual_satuan && konv.harga_jual_satuan > 0 
                        ? konv.harga_jual_satuan 
                        : (konv.rasio_konversi * item.harga_jual_dasar);
                    
                    const neededStock = item.jumlah * konv.rasio_konversi;
                    if (neededStock > item.stok_dasar) {
                        alert(`Stok tidak mencukupi untuk ${item.jumlah} ${konv.nama_satuan} (Dibutuhkan ${neededStock} ${item.satuan_dasar}, tersedia ${item.stok_dasar} ${item.satuan_dasar})`);
                        return item;
                    }

                    return {
                        ...item,
                        satuan: konv.nama_satuan,
                        rasio_konversi: konv.rasio_konversi,
                        harga_jual: newPrice,
                    };
                }

                return item;
            });
        });
    };

    // Eksekusi Pencarian & Penambahan Barang Otomatis ke Keranjang
    const processScanCode = (rawCode: string) => {
        const code = rawCode.trim();
        if (!code) return;

        let matchedUnit: string | null = null;
        let matchedRasio: number = 1;
        let matchedPrice: number | null = null;

        const found = barang.find(b => {
            // Cek barcode satuan konversi (kemasan karton/dus)
            if (b.satuan_konversi && b.satuan_konversi.length > 0) {
                const cartonMatch = b.satuan_konversi.find(k => 
                    k.barcode_satuan && k.barcode_satuan.toLowerCase() === code.toLowerCase()
                );
                if (cartonMatch) {
                    matchedUnit = cartonMatch.nama_satuan;
                    matchedRasio = cartonMatch.rasio_konversi;
                    matchedPrice = cartonMatch.harga_jual_satuan || (cartonMatch.rasio_konversi * b.harga_jual);
                    return true;
                }
            }

            // Cek barcode produk biasa atau kode barang
            return (b.barcode && b.barcode.toLowerCase() === code.toLowerCase()) ||
                   (b.kode_barang && b.kode_barang.toLowerCase() === code.toLowerCase()) ||
                   b.id_barang.toString() === code;
        });

        if (found) {
            const inCart = cart.find(c => c.id_barang === found.id_barang);
            const currentRasio = matchedUnit ? matchedRasio : (inCart ? inCart.rasio_konversi : 1);
            const nextTotalStockNeeded = inCart 
                ? (inCart.jumlah + 1) * inCart.rasio_konversi 
                : 1 * currentRasio;

            if (nextTotalStockNeeded > found.stok) {
                playBeep(false);
                setScanFeedback({
                    message: `Stok ${found.nama_barang} tidak mencukupi (Tersedia ${found.stok} ${found.satuan || 'PCS'})!`,
                    type: 'error'
                });
            } else {
                if (matchedUnit) {
                    addToCart(found, matchedUnit, matchedRasio, matchedPrice || undefined);
                    playBeep(true);
                    setScanFeedback({
                        message: `✓ [Karton/Dus] 1 ${matchedUnit} ${found.nama_barang} (${formatRupiah(matchedPrice || 0)}) berhasil ditambahkan!`,
                        type: 'success'
                    });
                } else {
                    addToCart(found);
                    playBeep(true);
                    setScanFeedback({
                        message: `✓ [${found.kode_barang || 'ID-' + found.id_barang}] ${found.nama_barang} (${formatRupiah(found.harga_jual)}) berhasil ditambahkan!`,
                        type: 'success'
                    });
                }
            }
        } else {
            playBeep(false);
            setScanFeedback({
                message: `Barang dengan kode/barcode "${code}" tidak ditemukan!`,
                type: 'error'
            });
        }

        setScanBarcode('');
        setTimeout(() => {
            if (scanInputRef.current) scanInputRef.current.focus();
        }, 30);
    };

    // Handler input scan barcode - otomatis menambahkan ke list pesanan ketika barcode/kode cocok
    const handleScanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setScanBarcode(val);

        const trimmed = val.trim().toLowerCase();
        if (trimmed.length < 3) return;

        // Cek apakah masih ada kode/barcode barang lain yang lebih panjang yang diawali dengan string ini
        const hasLongerPrefixMatch = barang.some(b => {
            if (b.barcode && b.barcode.toLowerCase().startsWith(trimmed) && b.barcode.length > trimmed.length) return true;
            if (b.kode_barang && b.kode_barang.toLowerCase().startsWith(trimmed) && b.kode_barang.length > trimmed.length) return true;
            if (b.satuan_konversi?.some(k => k.barcode_satuan && k.barcode_satuan.toLowerCase().startsWith(trimmed) && k.barcode_satuan.length > trimmed.length)) return true;
            return false;
        });

        if (!hasLongerPrefixMatch) {
            // Cek apakah persis cocok dengan salah satu barang yang terdaftar
            const exactMatch = barang.some(b => {
                if (b.barcode && b.barcode.toLowerCase() === trimmed) return true;
                if (b.kode_barang && b.kode_barang.toLowerCase() === trimmed) return true;
                if (b.satuan_konversi?.some(k => k.barcode_satuan && k.barcode_satuan.toLowerCase() === trimmed)) return true;
                return false;
            });

            if (exactMatch) {
                // Otomatis langsung tambahkan ke list belanja!
                processScanCode(val);
            }
        }
    };

    // Handler submit (ketika scanner hardware mengirimkan Enter atau ditekan Enter)
    const handleScanBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processScanCode(scanBarcode);
    };

    // Tambah Pelanggan Baru Langsung dari Kasir
    const handleQuickPelanggan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPelangganNama.trim()) return;

        setIsSubmittingPelanggan(true);
        try {
            const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const cookieMatch = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
            const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
            const csrfToken = metaToken || xsrfToken || '';

            const response = await fetch('/kasir/quick-pelanggan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': xsrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    nama_pelanggan: newPelangganNama.trim(),
                    no_telp: newPelangganTelp.trim() || null,
                })
            });

            const result = await response.json();
            if ((result.success || result.status === 'success') && result.pelanggan) {
                setLocalPelangganList(prev => [result.pelanggan, ...prev]);
                setSelectedPelanggan(result.pelanggan.id_pelanggan.toString());
                setShowAddPelangganModal(false);
                setNewPelangganNama('');
                setNewPelangganTelp('');
            } else {
                alert(result.message || 'Gagal menambahkan pelanggan');
            }
        } catch (err) {
            alert('Terjadi kesalahan saat menyimpan pelanggan baru.');
        } finally {
            setIsSubmittingPelanggan(false);
        }
    };

    const minFromCart = (id: number) => {
        setCart(prev => {
            return prev.map(p => p.id_barang === id ? { ...p, jumlah: Math.max(1, p.jumlah - 1) } : p);
        });
    };

    const plusToCart = (id: number) => {
        setCart(prev => {
            return prev.map(p => p.id_barang === id ? { ...p, jumlah: p.jumlah + 1 } : p);
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
            satuan: item.satuan,
            rasio_konversi: item.rasio_konversi,
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

    const handleMobileCheckout = () => {
        if (cart.length === 0) {
            alert('Keranjang belanja masih kosong!');
            return;
        }

        let effectiveBayar = nominalBayar;
        if (metodeBayarMobile === 'qris' || metodeBayarMobile === 'transfer') {
            effectiveBayar = totalHarga;
        } else {
            const bayarNum = typeof nominalBayar === 'number' ? nominalBayar : 0;
            if (bayarNum < totalHarga) {
                alert(`Nominal bayar (${formatRupiah(bayarNum)}) kurang dari total belanja (${formatRupiah(totalHarga)})!`);
                return;
            }
        }

        setProcessing(true);
        setErrorMessage(null);

        const itemsPayload = cart.map(item => ({
            id_barang: item.id_barang,
            jumlah: item.jumlah,
            satuan: item.satuan,
            rasio_konversi: item.rasio_konversi,
            harga_jual: item.harga_jual
        }));

        const currentCartCopy = [...cart];
        const currentTotal = totalHarga;
        const currentBayar = typeof effectiveBayar === 'number' ? effectiveBayar : currentTotal;
        const currentKembalian = Math.max(0, currentBayar - currentTotal);

        router.post(route('kasir.checkout'), {
            items: itemsPayload,
            jenis_pembayaran: 'tunai',
            id_pelanggan: null
        }, {
            onSuccess: () => {
                setProcessing(false);
                setLastReceiptData({
                    nomorTrx: 'TRX-' + Date.now().toString().slice(-6),
                    items: currentCartCopy,
                    total: currentTotal,
                    bayar: currentBayar,
                    kembalian: currentKembalian,
                    jenis: metodeBayarMobile.toUpperCase(),
                    pelangganNama: 'Umum',
                    kasirNama: auth.user.nama_lengkap,
                    waktu: new Date().toLocaleString('id-ID')
                });
                setShowReceipt(true);
                setCart([]);
                setNominalBayar('');
                setMobileView('catalog');
            },
            onError: (errors) => {
                setProcessing(false);
                const firstErr = Object.values(errors)[0] as string;
                setErrorMessage(firstErr || 'Gagal memproses transaksi.');
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans">
            <Head title="Mesin Kasir - Kasir Pro" />

            {/* ========================================================================= */}
            {/* TAMPILAN MOBILE (Layar 2: Mesin Kasir & Layar 3: Keranjang / Checkout)    */}
            {/* ========================================================================= */}
            <div className="md:hidden flex flex-col min-h-screen pb-20">
                {mobileView === 'catalog' ? (
                    <>
                        {/* Layar 2: Header Mesin Kasir */}
                        <MobileHeader
                            variant="subpage"
                            title="Mesin Kasir"
                            backUrl="/dashboard"
                            action={
                                <button
                                    type="button"
                                    onClick={() => setMobileView('cart')}
                                    className="p-2 relative text-slate-300 hover:text-white rounded-xl active:bg-slate-800 transition-colors"
                                    aria-label="Keranjang"
                                >
                                    <ShoppingCart className="w-5 h-5 text-indigo-400" />
                                    {totalCartItemsCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                                            {totalCartItemsCount}
                                        </span>
                                    )}
                                </button>
                            }
                        />

                        <div className="px-4 pt-3 pb-2 space-y-3">
                            {/* Search & Barcode Scan */}
                            <div className="relative flex items-center">
                                <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Cari barang atau kode..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-[#131B2E] text-white text-xs font-medium placeholder:text-slate-500 border border-slate-800 rounded-2xl outline-none focus:border-indigo-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const code = prompt('Scan barcode / ketik kode barang:');
                                        if (code) processScanCode(code);
                                    }}
                                    className="absolute right-3 p-1 text-indigo-400 hover:text-indigo-300"
                                    title="Scan Barcode"
                                >
                                    <Barcode className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Category Chips horizontal scroll */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {['Semua', 'Makanan', 'Minuman', 'Lainnya'].map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                            selectedCategory === cat
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-slate-800'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Product List */}
                            <div className="space-y-2.5 pt-1">
                                {filteredBarangMobile.map((item) => (
                                    <div
                                        key={item.id_barang}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-[#131B2E] border border-slate-800/80 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <ProductThumbnail nama={item.nama_barang} foto_url={item.foto_url} className="w-11 h-11" />
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-white tracking-tight truncate">
                                                    {item.nama_barang}
                                                </h4>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    {item.barcode || item.kode_barang || '8992750200012'}
                                                </p>
                                                <p className="text-xs font-bold text-slate-200 mt-0.5">
                                                    {formatRupiah(item.harga_jual)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => addToCart(item)}
                                            className="w-8 h-8 rounded-xl bg-indigo-600 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-transform"
                                            aria-label="Tambah"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating Cart Indicator */}
                        {totalCartItemsCount > 0 && (
                            <div className="fixed bottom-16 left-4 right-4 z-30">
                                <button
                                    type="button"
                                    onClick={() => setMobileView('cart')}
                                    className="w-full max-w-md mx-auto flex items-center justify-between px-4 py-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/40 font-bold text-xs active:scale-[0.99] transition-transform"
                                >
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4" />
                                        <span>{totalCartItemsCount} barang di keranjang</span>
                                    </div>
                                    <span>{formatRupiah(totalHarga)} &rarr;</span>
                                </button>
                            </div>
                        )}

                        <MobileBottomNav activeTab="kasir" />
                    </>
                ) : (
                    <>
                        {/* Layar 3: Keranjang / Checkout */}
                        <MobileHeader
                            variant="subpage"
                            title="Keranjang"
                            onBack={() => setMobileView('catalog')}
                            action={
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm('Kosongkan semua pesanan di keranjang?')) setCart([]);
                                    }}
                                    className="p-1 text-rose-400 hover:text-rose-300 rounded-lg"
                                    title="Kosongkan"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            }
                        />

                        <div className="px-4 py-3 space-y-4">
                            {/* List Item Keranjang */}
                            {cart.length > 0 ? (
                                <div className="space-y-2.5">
                                    {cart.map((item) => (
                                        <div key={item.id_barang} className="flex items-center justify-between p-3 rounded-2xl bg-[#131B2E] border border-slate-800/80">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <ProductThumbnail nama={item.nama_barang} className="w-11 h-11" />
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-white truncate">{item.nama_barang}</h4>
                                                    <p className="text-xs font-bold text-slate-200 mt-0.5">{formatRupiah(item.harga_jual)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex items-center bg-[#0B0F19] border border-slate-800 rounded-xl p-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => minFromCart(item.id_barang)}
                                                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-6 text-center text-xs font-bold text-white">{item.jumlah}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => plusToCart(item.id_barang)}
                                                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.id_barang)}
                                                    className="text-rose-500 hover:text-rose-400 p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400 text-xs">Keranjang masih kosong.</div>
                            )}

                            {/* Subtotal & Total Breakdown */}
                            <div className="p-3.5 rounded-2xl bg-[#131B2E] border border-slate-800/80 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-400 font-medium">
                                    <span>Subtotal ({totalCartItemsCount} barang)</span>
                                    <span className="text-white font-semibold">{formatRupiah(totalHarga)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400 font-medium">
                                    <span>Diskon</span>
                                    <span className="text-white font-semibold">Rp 0</span>
                                </div>
                                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black text-white">
                                    <span>Total</span>
                                    <span className="text-base">{formatRupiah(totalHarga)}</span>
                                </div>
                            </div>

                            {/* Metode Pembayaran */}
                            <div>
                                <label className="block text-xs font-bold text-white mb-2">Metode Pembayaran</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMetodeBayarMobile('tunai')}
                                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            metodeBayarMobile === 'tunai'
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                : 'bg-[#131B2E] text-slate-400 border border-slate-800'
                                        }`}
                                    >
                                        <Wallet className="w-3.5 h-3.5" />
                                        Tunai
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMetodeBayarMobile('qris');
                                            setNominalBayar(totalHarga);
                                        }}
                                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            metodeBayarMobile === 'qris'
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                : 'bg-[#131B2E] text-slate-400 border border-slate-800'
                                        }`}
                                    >
                                        <Barcode className="w-3.5 h-3.5" />
                                        QRIS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMetodeBayarMobile('transfer');
                                            setNominalBayar(totalHarga);
                                        }}
                                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            metodeBayarMobile === 'transfer'
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                : 'bg-[#131B2E] text-slate-400 border border-slate-800'
                                        }`}
                                    >
                                        <CreditCard className="w-3.5 h-3.5" />
                                        Transfer
                                    </button>
                                </div>
                            </div>

                            {/* Uang Diterima & Kembalian */}
                            {metodeBayarMobile === 'tunai' && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#131B2E] border border-slate-800/80">
                                        <span className="text-xs font-bold text-slate-300">Uang Diterima</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-slate-400 font-bold">Rp</span>
                                            <input
                                                type="number"
                                                placeholder="50000"
                                                value={nominalBayar === '' ? '' : nominalBayar}
                                                onChange={(e) => setNominalBayar(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="w-28 text-right bg-transparent text-sm font-bold text-white outline-none border-b border-indigo-500 pb-0.5"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNominalBayar(totalHarga)}
                                            className="flex-1 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] font-bold text-slate-300 active:bg-slate-700"
                                        >
                                            Uang Pas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNominalBayar(50000)}
                                            className="flex-1 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] font-bold text-slate-300 active:bg-slate-700"
                                        >
                                            50.000
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNominalBayar(100000)}
                                            className="flex-1 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] font-bold text-slate-300 active:bg-slate-700"
                                        >
                                            100.000
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#131B2E] border border-slate-800/80">
                                        <span className="text-xs font-bold text-slate-300">Kembalian</span>
                                        <span className="text-sm font-black text-emerald-400">{formatRupiah(kembalian)}</span>
                                    </div>
                                </div>
                            )}

                            {/* CTA Selesaikan Transaksi */}
                            <button
                                type="button"
                                onClick={handleMobileCheckout}
                                disabled={processing || cart.length === 0}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {processing ? 'Memproses...' : 'Selesaikan Transaksi'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ========================================================================= */}
            {/* TAMPILAN DESKTOP (Tetap dipertahankan untuk layar lebar)                  */}
            {/* ========================================================================= */}
            <div className="hidden md:flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
            <Head title="Mesin Kasir - Kasir Pro" />

            {/* Sidebar Terpadu */}
            <Sidebar auth={auth} />

            {/* Katalog Barang (Tengah) */}
            <main className="flex-1 flex flex-col overflow-hidden relative border-r border-slate-200 dark:border-slate-800">
                <header className="h-24 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex flex-col justify-center px-6 z-10 shrink-0 gap-2">
                    <div className="flex items-center justify-between gap-4">
                        {/* 1. Form Scan Barcode Langsung Masuk Pesanan */}
                        <form onSubmit={handleScanBarcodeSubmit} className="flex-1 max-w-lg relative">
                            <div className="relative flex items-center">
                                <Barcode className="absolute left-3.5 w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                                <input 
                                    ref={scanInputRef}
                                    type="text" 
                                    placeholder="⚡ SCAN BARCODE / KETIK KODE BARANG (OTOMATIS MASUK)..." 
                                    value={scanBarcode}
                                    onChange={handleScanInputChange}
                                    className="w-full pl-11 pr-10 py-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-900 dark:text-white text-xs font-mono font-bold tracking-wider placeholder:text-indigo-400/80 border-2 border-indigo-200 dark:border-indigo-800 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950 rounded-xl outline-none transition-all shadow-inner"
                                    autoFocus
                                />
                                {scanBarcode && (
                                    <button 
                                        type="button"
                                        onClick={() => setScanBarcode('')}
                                        className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                                        title="Hapus"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* 2. Search Box Katalog */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Cari nama barang..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none transition-all"
                            />
                        </div>

                        {/* Waktu */}
                        <div className="text-xs font-semibold text-slate-500 bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                            {currentTime} WIB
                        </div>
                    </div>

                    {/* Scan Notification Bar */}
                    {scanFeedback && (
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                            scanFeedback.type === 'success' 
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}>
                            <div className="flex items-center gap-1.5">
                                {scanFeedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                                <span>{scanFeedback.message}</span>
                            </div>
                            <button onClick={() => setScanFeedback(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
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
                                    <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600 transition-colors overflow-hidden">
                                        {item.foto_url ? (
                                            <img src={item.foto_url} alt={item.nama_barang} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-10 h-10" />
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.nama_barang}</h3>
                                    <div className="mt-1.5 space-y-0.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 text-[11px]">Stok:</span>
                                            <b className="text-slate-700 dark:text-slate-300 truncate ml-1">{item.stok_konversi_text || `${item.stok} ${item.satuan || 'PCS'}`}</b>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 text-[11px]">Terjual:</span>
                                            <b className={`truncate ml-1 font-bold ${(item.total_terjual || 0) > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {item.total_terjual_text || `${item.total_terjual || 0} ${item.satuan || 'PCS'}`}
                                            </b>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{formatRupiah(item.harga_jual)}</p>
                                        <span className="text-[10px] text-slate-400">/{item.satuan || 'PCS'}</span>
                                    </div>
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
                                    
                                    {/* Pemilih Satuan Jika Memiliki Konversi */}
                                    {item.satuan_konversi && item.satuan_konversi.length > 0 ? (
                                        <div className="flex items-center gap-1 mt-1">
                                            <select
                                                value={item.satuan}
                                                onChange={(e) => changeCartItemUnit(item.id_barang, e.target.value)}
                                                className="text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-1.5 py-0.5 text-indigo-600 dark:text-indigo-400 focus:outline-hidden"
                                            >
                                                <option value={item.satuan_dasar}>
                                                    {item.satuan_dasar} ({formatRupiah(item.harga_jual_dasar)})
                                                </option>
                                                {item.satuan_konversi.map((k) => (
                                                    <option key={k.nama_satuan} value={k.nama_satuan}>
                                                        {k.nama_satuan} ({formatRupiah(k.harga_jual_satuan || (k.rasio_konversi * item.harga_jual_dasar))}) - isi {k.rasio_konversi}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{item.satuan}</span>
                                    )}

                                    <p className="text-indigo-600 dark:text-indigo-400 font-bold text-xs mt-1">
                                        {formatRupiah(item.harga_jual * item.jumlah)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => minFromCart(item.id_barang)} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 text-slate-600 dark:text-slate-200">
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center font-bold text-xs">{item.jumlah}</span>
                                    <button onClick={() => {
                                        const original = barang.find(b => b.id_barang === item.id_barang);
                                        if (original) addToCart(original, item.satuan, item.rasio_konversi, item.harga_jual);
                                    }} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 text-slate-600 dark:text-slate-200">
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
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                    <User className="w-3 h-3" /> Pelanggan {jenisPembayaran === 'hutang' && <span className="text-rose-500">*</span>}
                                </label>
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddPelangganModal(true)}
                                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 hover:underline transition-all"
                                >
                                    <UserPlus className="w-3.5 h-3.5" /> + Tambah Pelanggan
                                </button>
                            </div>
                            <select 
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs h-9 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={selectedPelanggan}
                                onChange={(e) => setSelectedPelanggan(e.target.value)}
                                required={jenisPembayaran === 'hutang'}
                            >
                                <option value="">-- Pelanggan Umum (Anonim) --</option>
                                {localPelangganList.map(p => (
                                    <option key={p.id_pelanggan} value={p.id_pelanggan}>
                                        {p.nama_pelanggan} {p.no_telp ? `(${p.no_telp})` : ''}
                                    </option>
                                ))}
                            </select>

                            {/* Info Kalkulasi Hutang Pelanggan Jika Kredit */}
                            {jenisPembayaran === 'hutang' && currentSelectedPelanggan && (
                                <div className="p-2.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1 text-[11px] animate-in fade-in duration-200">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Hutang Tercatat:</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {formatRupiah(Number(currentSelectedPelanggan.total_hutang || 0))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Tambahan Belanja Ini:</span>
                                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                                            + {formatRupiah(totalHarga)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-rose-200 dark:border-rose-900/60 font-bold text-slate-900 dark:text-white">
                                        <span>Total Hutang Menjadi:</span>
                                        <span className="text-rose-600 dark:text-rose-400 font-black">
                                            {formatRupiah((Number(currentSelectedPelanggan.total_hutang) || 0) + totalHarga)}
                                        </span>
                                    </div>
                                </div>
                            )}
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
            </div>

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
                                        <p className="text-[10px] text-slate-400">{it.jumlah} {it.satuan || 'PCS'} x {formatRupiah(it.harga_jual)}</p>
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

            {/* Modal Tambah Pelanggan Baru Langsung dari Kasir */}
            {showAddPelangganModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Tambah Pelanggan Baru</h3>
                                    <p className="text-xs text-slate-500">Pelanggan akan langsung tersimpan dan dipilih di kasir</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowAddPelangganModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleQuickPelanggan} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                                    Nama Pelanggan <span className="text-rose-500">*</span>
                                </label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Contoh: Bpk. Heru / Bu Wati"
                                    value={newPelangganNama}
                                    onChange={(e) => setNewPelangganNama(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                                    Nomor Telepon / WhatsApp (Opsional)
                                </label>
                                <input 
                                    type="text"
                                    placeholder="Contoh: 081234567890"
                                    value={newPelangganTelp}
                                    onChange={(e) => setNewPelangganTelp(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="pt-3 flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowAddPelangganModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingPelanggan || !newPelangganNama.trim()}
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                                >
                                    {isSubmittingPelanggan ? 'Menyimpan...' : 'Simpan & Pilih'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
