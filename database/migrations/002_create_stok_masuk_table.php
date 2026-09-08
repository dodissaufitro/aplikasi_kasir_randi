<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('stok_masuk', function (Blueprint $table) {
            $table->id('id_stok_masuk');
            $table->unsignedBigInteger('id_barang');
            $table->dateTime('tanggal_masuk')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->integer('jumlah');
            
            $table->foreign('id_barang')->references('id_barang')->on('barang')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('stok_masuk');
    }
};
