<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->enum('status_transaksi', ['selesai', 'void', 'retur'])->default('selesai')->after('status_pembayaran');
            $table->string('catatan_batal', 255)->nullable()->after('status_transaksi');
        });
    }

    public function down()
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropColumn(['status_transaksi', 'catatan_batal']);
        });
    }
};
