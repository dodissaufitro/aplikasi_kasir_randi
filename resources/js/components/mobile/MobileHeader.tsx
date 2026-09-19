import React from 'react';
import { Link } from '@inertiajs/react';
import { 
    Bell, 
    ChevronLeft, 
    ShoppingCart
} from 'lucide-react';

interface Props {
    variant?: 'dashboard' | 'subpage';
    title?: string;
    onBack?: () => void;
    backUrl?: string;
    userInitials?: string;
    action?: React.ReactNode;
}

export default function MobileHeader({
    variant = 'dashboard',
    title = '',
    onBack,
    backUrl = '/dashboard',
    userInitials = 'AD',
    action
}: Props) {
    if (variant === 'dashboard') {
        return (
            <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800/80 select-none">
                {/* KasirPro Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-black tracking-tight text-white">
                        Kasir<span className="text-indigo-500">Pro</span>
                    </span>
                </div>

                {/* Right actions: Bell + Avatar */}
                <div className="flex items-center gap-2.5">
                    <button 
                        type="button" 
                        className="p-2 text-slate-400 hover:text-slate-200 rounded-xl active:bg-slate-800 transition-colors relative"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0B0F19]"></span>
                    </button>

                    <div className="w-8 h-8 rounded-full bg-indigo-600/90 border border-indigo-400/40 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                        {userInitials}
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800/80 select-none">
            {/* Back Button */}
            {onBack ? (
                <button
                    type="button"
                    onClick={onBack}
                    className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-xl active:bg-slate-800 transition-colors"
                    aria-label="Kembali"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            ) : (
                <Link
                    href={backUrl}
                    className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-xl active:bg-slate-800 transition-colors inline-flex items-center"
                    aria-label="Kembali"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Link>
            )}

            {/* Subpage Title */}
            <h1 className="text-base font-bold text-white tracking-tight truncate px-2 text-center flex-1">
                {title}
            </h1>

            {/* Right Action */}
            <div className="min-w-8 flex items-center justify-end">
                {action || <div className="w-6" />}
            </div>
        </header>
    );
}
