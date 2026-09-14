<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'password',
        'nama_lengkap',
        'role',
        'menu_access',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'effective_menu_access',
    ];

    public const ALL_MENUS = [
        'dashboard',
        'kasir',
        'transaksi',
        'barang',
        'stok-masuk',
        'pelanggan',
        'laporan',
        'pengguna',
    ];

    /**
     * Get default menu access according to role.
     */
    public static function getDefaultMenuAccessForRole(?string $role = null): array
    {
        return match ($role) {
            'superadmin' => self::ALL_MENUS,
            'admin' => ['dashboard', 'kasir', 'transaksi', 'barang', 'stok-masuk', 'pelanggan', 'laporan'],
            'kasir' => ['dashboard', 'kasir', 'transaksi'],
            default => ['dashboard'],
        };
    }

    /**
     * Get effective menu access.
     */
    public function getEffectiveMenuAccessAttribute(): array
    {
        $role = $this->role ?? null;

        if ($role === 'superadmin') {
            return self::ALL_MENUS;
        }

        if (!empty($this->menu_access) && is_array($this->menu_access)) {
            return array_values(array_intersect(self::ALL_MENUS, $this->menu_access));
        }

        return self::getDefaultMenuAccessForRole($role);
    }

    /**
     * Check if user has access to a specific menu key.
     */
    public function hasMenuAccess(string $menuKey): bool
    {
        if (($this->role ?? null) === 'superadmin') {
            return true;
        }

        return in_array($menuKey, $this->effective_menu_access, true);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'menu_access' => 'array',
        ];
    }
}
