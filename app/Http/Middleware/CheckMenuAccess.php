<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMenuAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $menuKey): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Superadmin has unrestricted access
        if ($user->role === 'superadmin') {
            return $next($request);
        }

        if (!$user->hasMenuAccess($menuKey)) {
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                // If it's an Inertia request and not a GET page visit (e.g. action POST/PUT/DELETE)
                if (!$request->isMethod('GET')) {
                    return back()->with('error', 'Akses Ditolak: Anda tidak memiliki izin untuk melakukan aksi di menu ini.');
                }
            }

            // Route mapping for redirect fallback
            $routeMap = [
                'dashboard' => 'dashboard',
                'kasir' => 'kasir.index',
                'transaksi' => 'transaksi.index',
                'barang' => 'barang.index',
                'stok-masuk' => 'stok-masuk.index',
                'pelanggan' => 'pelanggan.index',
                'pengguna' => 'pengguna.index',
            ];

            $fallbackRoute = null;
            foreach ($user->effective_menu_access as $accessibleKey) {
                if ($accessibleKey !== $menuKey && isset($routeMap[$accessibleKey])) {
                    $fallbackRoute = $routeMap[$accessibleKey];
                    break;
                }
            }

            if ($fallbackRoute) {
                return redirect()->route($fallbackRoute)
                    ->with('error', 'Akses Ditolak: Anda tidak memiliki hak akses ke menu tersebut.');
            }

            abort(403, 'Akses Ditolak: Anda tidak memiliki hak akses ke menu ini.');
        }

        return $next($request);
    }
}
