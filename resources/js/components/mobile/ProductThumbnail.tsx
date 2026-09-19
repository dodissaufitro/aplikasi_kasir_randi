import React from 'react';

interface Props {
    nama: string;
    foto_url?: string | null;
    className?: string;
}

export default function ProductThumbnail({ nama, foto_url, className = "w-12 h-12" }: Props) {
    if (foto_url) {
        return (
            <img 
                src={foto_url} 
                alt={nama} 
                className={`${className} object-cover rounded-xl border border-slate-700/50 bg-slate-800 shrink-0`} 
            />
        );
    }

    const n = nama.toLowerCase();

    // Visual thumbnail matching the mockup items
    if (n.includes('aqua')) {
        return (
            <div className={`${className} rounded-xl bg-gradient-to-b from-sky-950 via-slate-900 to-sky-900 border border-sky-500/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm`}>
                <div className="w-4 h-8 bg-sky-400/80 rounded-t-sm rounded-b-md flex flex-col items-center justify-between py-0.5 shadow-inner border border-sky-300/40">
                    <div className="w-2.5 h-1 bg-sky-200 rounded-xs"></div>
                    <div className="w-3.5 h-2.5 bg-blue-600 rounded-xs flex items-center justify-center">
                        <span className="text-[5px] text-white font-black">AQ</span>
                    </div>
                    <div className="w-2.5 h-1 bg-sky-200 rounded-xs"></div>
                </div>
            </div>
        );
    }

    if (n.includes('indomie')) {
        return (
            <div className={`${className} rounded-xl bg-gradient-to-br from-amber-600 via-red-600 to-yellow-600 border border-amber-400/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm`}>
                <div className="w-8 h-7 bg-amber-100 rounded-md border border-amber-300 flex flex-col items-center justify-center px-0.5 shadow-sm">
                    <span className="text-[7px] font-black text-red-600 leading-none">Indomie</span>
                    <span className="text-[5px] font-bold text-amber-800 leading-none mt-0.5">Goreng</span>
                </div>
            </div>
        );
    }

    if (n.includes('sedaap') || n.includes('sedap')) {
        return (
            <div className={`${className} rounded-xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-700 border border-orange-400/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm`}>
                <div className="w-8 h-7 bg-orange-100 rounded-md border border-orange-300 flex flex-col items-center justify-center px-0.5 shadow-sm">
                    <span className="text-[7px] font-black text-red-700 leading-none">SEDAAP</span>
                    <span className="text-[5px] font-bold text-orange-900 leading-none mt-0.5">Goreng</span>
                </div>
            </div>
        );
    }

    if (n.includes('coca') || n.includes('cola')) {
        return (
            <div className={`${className} rounded-xl bg-gradient-to-b from-red-700 via-red-600 to-rose-900 border border-red-400/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm`}>
                <div className="w-5 h-8 bg-red-600 rounded-md border border-red-300/40 flex flex-col items-center justify-center shadow-md">
                    <div className="w-3.5 h-1 bg-slate-300 rounded-t-sm"></div>
                    <span className="text-[6px] font-serif italic font-black text-white transform -rotate-12 mt-0.5">Coke</span>
                </div>
            </div>
        );
    }

    if (n.includes('pucuk') || n.includes('teh')) {
        return (
            <div className={`${className} rounded-xl bg-gradient-to-b from-amber-900 via-amber-800 to-emerald-950 border border-amber-600/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm`}>
                <div className="w-4 h-8 bg-amber-700 rounded-t-sm rounded-b-md flex flex-col items-center justify-between py-0.5 border border-amber-500/40 shadow-sm">
                    <div className="w-2.5 h-1 bg-emerald-500 rounded-xs"></div>
                    <div className="w-3.5 h-2.5 bg-red-600 rounded-xs flex items-center justify-center">
                        <span className="text-[5px] text-white font-bold">Teh</span>
                    </div>
                    <div className="w-2.5 h-1 bg-amber-900 rounded-xs"></div>
                </div>
            </div>
        );
    }

    if (n.includes('taro')) {
        return (
            <div className={`${className} rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-green-900 border border-emerald-400/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm`}>
                <div className="w-8 h-7 bg-emerald-100 rounded-md border border-emerald-300 flex flex-col items-center justify-center px-0.5 shadow-sm">
                    <span className="text-[7px] font-black text-emerald-800 leading-none">TARO</span>
                    <span className="text-[5px] font-bold text-teal-700 leading-none mt-0.5">Net 65g</span>
                </div>
            </div>
        );
    }

    // Default icon badge with initials
    const initials = nama.slice(0, 2).toUpperCase();
    return (
        <div className={`${className} rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 shadow-sm`}>
            {initials}
        </div>
    );
}
