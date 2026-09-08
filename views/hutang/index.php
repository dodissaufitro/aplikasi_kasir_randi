<h3>Data Piutang / Hutang Pelanggan</h3>

<table class="table table-bordered mt-3">
    <thead>
        <tr>
            <th>No</th>
            <th>Nama Pelanggan</th>
            <th>No Telp</th>
            <th>Total Hutang</th>
            <th>Aksi</th>
        </tr>
    </thead>
    <tbody>
        <?php $no = 1; foreach($data['pelanggan'] as $p) : ?>
        <tr>
            <td><?= $no++; ?></td>
            <td><?= $p['nama_pelanggan']; ?></td>
            <td><?= $p['no_telp']; ?></td>
            <td class="text-danger fw-bold">Rp <?= number_format($p['total_hutang'],0,',','.'); ?></td>
            <td>
                <!-- Dalam pengembangan nyata, tombol ini akan diarahkan ke detail atau form bayar -->
                <button class="btn btn-sm btn-info text-white">Detail</button>
                <button class="btn btn-sm btn-success">Bayar</button>
            </td>
        </tr>
        <?php endforeach; ?>
    </tbody>
</table>
