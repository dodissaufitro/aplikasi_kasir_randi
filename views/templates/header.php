<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $data['judul']; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <div class="container">
    <a class="navbar-brand" href="/aplikasi_kasir_randi/public/kasir">POS Kasir</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link" href="/aplikasi_kasir_randi/public/kasir">Kasir</a>
        </li>
        <?php if(isset($_SESSION['user']) && $_SESSION['user']['role'] === 'admin'): ?>
        <li class="nav-item">
          <a class="nav-link" href="/aplikasi_kasir_randi/public/barang">Data Barang</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/aplikasi_kasir_randi/public/hutang">Data Hutang</a>
        </li>
        <?php endif; ?>
      </ul>
      <?php if(isset($_SESSION['user'])): ?>
      <span class="navbar-text me-3 text-white">
        Halo, <?= $_SESSION['user']['nama_lengkap']; ?> (<?= ucfirst($_SESSION['user']['role']); ?>)
      </span>
      <a href="/aplikasi_kasir_randi/public/auth/logout" class="btn btn-outline-danger btn-sm">Logout</a>
      <?php endif; ?>
    </div>
  </div>
</nav>
<div class="container mt-4">
