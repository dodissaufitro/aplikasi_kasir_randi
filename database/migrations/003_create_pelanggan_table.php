<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('pelanggan', function (Blueprint $table) {
            $table->id('id_pelanggan');
            $table->string('nama_pelanggan');
            $table->string('no_telp', 20)->nullable();
            $table->decimal('total_hutang', 15, 2)->default(0);
        });
    }

    public function down()
    {
        Schema::dropIfExists('pelanggan');
    }
};
