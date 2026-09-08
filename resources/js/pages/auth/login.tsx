import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Store } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginForm {
    username: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        username: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-sans">
            <Head title="Log in - Kasir Pintar" />

            {/* Kiri: Sisi Grafis / Branding */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 items-center justify-center p-12">
                {/* Ornamen Latar */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-white rounded-full blur-3xl mix-blend-overlay"></div>
                    <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-300 rounded-full blur-3xl mix-blend-overlay"></div>
                </div>

                <div className="relative z-10 text-white max-w-lg">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                            <Store className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">Kasir<span className="text-pink-200">Pro</span></h1>
                    </div>
                    <h2 className="text-5xl font-extrabold mb-6 leading-tight">Kelola Bisnis Anda Lebih Cerdas.</h2>
                    <p className="text-lg text-indigo-100/80 mb-10 leading-relaxed">
                        Sistem kasir modern yang dirancang untuk mempercepat transaksi, mengelola stok, dan memberikan laporan real-time secara instan.
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm font-medium text-white/80">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-white/30 backdrop-blur-sm"></div>
                            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-white/40 backdrop-blur-sm"></div>
                            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-white/50 backdrop-blur-sm"></div>
                        </div>
                        <p>Digunakan oleh +1,000 toko</p>
                    </div>
                </div>
            </div>

            {/* Kanan: Form Login */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 sm:p-12 relative overflow-hidden">
                    
                    {/* Aksen atas form */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-pink-500"></div>

                    <div className="mb-10 text-center lg:text-left">
                        <div className="flex justify-center lg:hidden mb-6">
                             <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                <Store className="w-8 h-8" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Selamat Datang 👋</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Masukkan detail kredensial Anda untuk masuk ke sistem.</p>
                    </div>

                    {status && <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 text-sm font-medium border border-green-100">{status}</div>}

                    <form className="flex flex-col gap-5" onSubmit={submit}>
                        <div className="grid gap-2">
                            <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-semibold">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="username"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                placeholder="Masukkan username Anda..."
                                className="h-12 px-4 rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 bg-slate-50/50 dark:bg-slate-800/50 transition-all"
                            />
                            <InputError message={errors.username} className="mt-1" />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-semibold">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="h-12 px-4 rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 bg-slate-50/50 dark:bg-slate-800/50 transition-all"
                            />
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-3">
                                <Checkbox 
                                    id="remember" 
                                    name="remember" 
                                    tabIndex={3} 
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer font-medium">Ingat saya</Label>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="h-12 mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-semibold text-base" 
                            tabIndex={4} 
                            disabled={processing}
                        >
                            {processing ? (
                                <LoaderCircle className="h-5 w-5 animate-spin mr-2" />
                            ) : null}
                            {processing ? 'Memproses...' : 'Masuk Sekarang'}
                        </Button>
                    </form>
                    
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                         <p className="text-xs text-slate-400">© 2026 Aplikasi Kasir Pro. Hak Cipta Dilindungi.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
