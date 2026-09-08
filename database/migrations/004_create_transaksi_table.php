<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('transaksi', function (Blueprint $table) {
            $table->id('id_transaksi');
            $table->dateTime('tanggal')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->enum('jenis_pembayaran', ['tunai', 'hutang']);
            $table->unsignedBigInteger('id_pelanggan')->nullable();
            $table->decimal('total_belanja', 15, 2);
            $table->enum('status_pembayaran', ['lunas', 'belum_lunas']);
            
            $table->foreign('id_pelanggan')->references('id_pelanggan')->on('pelanggan')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('transaksi');
    }
};
