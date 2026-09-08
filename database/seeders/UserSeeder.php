<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            [
                'username' => 'superadmin',
                'password' => Hash::make('password'),
                'nama_lengkap' => 'Super Administrator',
                'role' => 'superadmin'
            ],
            [
                'username' => 'admin',
                'password' => Hash::make('password'),
                'nama_lengkap' => 'Administrator System',
                'role' => 'admin'
            ],
            [
                'username' => 'kasir',
                'password' => Hash::make('password'),
                'nama_lengkap' => 'Pegawai Kasir',
                'role' => 'kasir'
            ]
        ]);
    }
}
