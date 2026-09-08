<h3>Data Barang</h3>
<button class="btn btn-primary mb-3" data-bs-toggle="modal" data-bs-target="#tambahBarangModal">Tambah Barang</button>

<table class="table table-bordered">
    <thead>
        <tr>
            <th>No</th>
            <th>Nama Barang</th>
            <th>Harga Beli</th>
            <th>Harga Jual</th>
            <th>Sisa Stok</th>
        </tr>
    </thead>
    <tbody>
        <?php $no = 1; foreach($data['barang'] as $b) : ?>
        <tr>
            <td><?= $no++; ?></td>
            <td><?= $b['nama_barang']; ?></td>
            <td>Rp <?= number_format($b['harga_beli'],0,',','.'); ?></td>
            <td>Rp <?= number_format($b['harga_jual'],0,',','.'); ?></td>
            <td><?= $b['stok']; ?></td>
        </tr>
        <?php endforeach; ?>
    </tbody>
</table>

<!-- Modal Tambah Barang -->
<div class="modal fade" id="tambahBarangModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Tambah Barang Baru</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <form action="/aplikasi_kasir_randi/public/barang/tambah" method="POST">
          <div class="modal-body">
              <div class="mb-3">
                  <label>Nama Barang</label>
                  <input type="text" name="nama_barang" class="form-control" required>
              </div>
              <div class="mb-3">
                  <label>Harga Beli</label>
                  <input type="number" name="harga_beli" class="form-control" required>
              </div>
              <div class="mb-3">
                  <label>Harga Jual</label>
                  <input type="number" name="harga_jual" class="form-control" required>
              </div>
              <div class="mb-3">
                  <label>Stok Awal</label>
                  <input type="number" name="stok" class="form-control" required>
              </div>
          </div>
          <div class="modal-footer">
            <button type="submit" name="submit" class="btn btn-primary">Simpan</button>
          </div>
      </form>
    </div>
  </div>
</div>
