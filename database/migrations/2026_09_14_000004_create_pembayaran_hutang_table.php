<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('pembayaran_hutang', function (Blueprint $table) {
            $table->id('id_pembayaran');
            $table->unsignedBigInteger('id_pelanggan');
            $table->dateTime('tanggal_bayar');
            $table->decimal('nominal_bayar', 15, 2);
            $table->decimal('sisa_hutang_setelahnya', 15, 2)->default(0);
            $table->string('metode_pembayaran', 50)->default('tunai');
            $table->text('catatan')->nullable();
            $table->unsignedBigInteger('id_user')->nullable();
            $table->timestamps();

            $table->foreign('id_pelanggan')->references('id_pelanggan')->on('pelanggan')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('pembayaran_hutang');
    }
};
