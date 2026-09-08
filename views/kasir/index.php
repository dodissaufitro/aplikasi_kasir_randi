<h3>Mesin Kasir</h3>
<?php if(isset($_GET['success'])): ?>
    <div class="alert alert-success">Transaksi berhasil disimpan!</div>
<?php endif; ?>

<div class="row mt-4">
    <!-- Area Pencarian Barang -->
    <div class="col-md-5">
        <div class="card">
            <div class="card-header bg-primary text-white">Daftar Barang</div>
            <div class="card-body" style="height: 400px; overflow-y: scroll;">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Barang</th>
                            <th>Harga</th>
                            <th>Stok</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($data['barang'] as $b) : ?>
                        <tr>
                            <td><?= $b['nama_barang']; ?></td>
                            <td>Rp <?= number_format($b['harga_jual'],0,',','.'); ?></td>
                            <td><?= $b['stok']; ?></td>
                            <td>
                                <?php if($b['stok'] > 0): ?>
                                <button class="btn btn-sm btn-success btn-add-cart" 
                                    data-id="<?= $b['id_barang']; ?>" 
                                    data-nama="<?= $b['nama_barang']; ?>" 
                                    data-harga="<?= $b['harga_jual']; ?>">Tambah</button>
                                <?php else: ?>
                                <button class="btn btn-sm btn-secondary" disabled>Habis</button>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Area Keranjang & Pembayaran -->
    <div class="col-md-7">
        <div class="card">
            <div class="card-header bg-success text-white">Keranjang Belanja</div>
            <div class="card-body">
                <form action="/aplikasi_kasir_randi/public/kasir/prosesTransaksi" method="POST">
                    <table class="table" id="cart-table">
                        <thead>
                            <tr>
                                <th>Barang</th>
                                <th>Harga</th>
                                <th>Qty</th>
                                <th>Subtotal</th>
                                <th>#</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Item dinamis masuk sini -->
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="3" class="text-end">Total:</th>
                                <th colspan="2" id="total-price">Rp 0</th>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <hr>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label>Metode Pembayaran</label>
                            <select name="jenis_pembayaran" id="jenis_pembayaran" class="form-select" required>
                                <option value="tunai">Tunai</option>
                                <option value="hutang">Hutang / Kasbon</option>
                            </select>
                        </div>
                    </div>

                    <!-- Area Data Hutang (Hidden by default) -->
                    <div id="area-hutang" style="display: none;" class="p-3 bg-light border mb-3">
                        <h6>Data Pelanggan (Hutang)</h6>
                        <div class="mb-2">
                            <label>Pilih Pelanggan Lama</label>
                            <select name="id_pelanggan" class="form-select">
                                <option value="">-- Pilih Jika Ada --</option>
                                <?php foreach($data['pelanggan'] as $p): ?>
                                    <option value="<?= $p['id_pelanggan']; ?>"><?= $p['nama_pelanggan']; ?> (Hutang: Rp <?= number_format($p['total_hutang'],0,',','.'); ?>)</option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="mb-2 text-center">-- ATAU --</div>
                        <div class="mb-2">
                            <label>Nama Pelanggan Baru</label>
                            <input type="text" name="nama_pelanggan_baru" class="form-control" placeholder="Input nama baru...">
                        </div>
                        <div class="mb-2">
                            <label>No HP/Telp</label>
                            <input type="text" name="no_telp_baru" class="form-control" placeholder="08xxx...">
                        </div>
                    </div>

                    <button type="submit" name="submit" class="btn btn-primary w-100 btn-lg">Proses Pembayaran</button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const cartTable = document.querySelector('#cart-table tbody');
        let total = 0;

        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', function() {
                let id = this.getAttribute('data-id');
                let nama = this.getAttribute('data-nama');
                let harga = parseInt(this.getAttribute('data-harga'));

                let row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <input type="hidden" name="id_barang[]" value="${id}">
                        <input type="hidden" name="harga_jual[]" value="${harga}">
                        ${nama}
                    </td>
                    <td>Rp ${harga.toLocaleString('id-ID')}</td>
                    <td><input type="number" name="qty[]" value="1" min="1" class="form-control qty-input" style="width: 70px;"></td>
                    <td class="subtotal">Rp ${harga.toLocaleString('id-ID')}</td>
                    <td><button type="button" class="btn btn-sm btn-danger btn-remove">X</button></td>
                `;
                cartTable.appendChild(row);
                updateTotal();
                
                // Add event listeners for new elements
                row.querySelector('.qty-input').addEventListener('input', function() {
                    let qty = parseInt(this.value);
                    let sub = qty * harga;
                    row.querySelector('.subtotal').innerText = 'Rp ' + sub.toLocaleString('id-ID');
                    updateTotal();
                });

                row.querySelector('.btn-remove').addEventListener('click', function() {
                    row.remove();
                    updateTotal();
                });
            });
        });

        function updateTotal() {
            total = 0;
            document.querySelectorAll('#cart-table tbody tr').forEach(row => {
                let qty = parseInt(row.querySelector('.qty-input').value);
                let harga = parseInt(row.querySelector('input[name="harga_jual[]"]').value);
                total += (qty * harga);
            });
            document.getElementById('total-price').innerText = 'Rp ' + total.toLocaleString('id-ID');
        }

        // Tampilkan Area Hutang jika metode hutang
        document.getElementById('jenis_pembayaran').addEventListener('change', function() {
            if(this.value === 'hutang') {
                document.getElementById('area-hutang').style.display = 'block';
            } else {
                document.getElementById('area-hutang').style.display = 'none';
            }
        });
    });
</script>
