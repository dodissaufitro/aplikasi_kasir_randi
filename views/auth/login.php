<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $data['judul']; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f8f9fa; }
        .login-container { max-width: 400px; margin: 100px auto; }
    </style>
</head>
<body>

<div class="container login-container">
    <div class="card shadow-sm">
        <div class="card-body p-4">
            <h3 class="text-center mb-4">Login POS Kasir</h3>
            
            <?php if(isset($_SESSION['login_error'])): ?>
                <div class="alert alert-danger">
                    <?= $_SESSION['login_error']; ?>
                    <?php unset($_SESSION['login_error']); ?>
                </div>
            <?php endif; ?>

            <form action="/aplikasi_kasir_randi/public/auth/login" method="POST">
                <div class="mb-3">
                    <label>Username</label>
                    <input type="text" name="username" class="form-control" required placeholder="admin / kasir">
                </div>
                <div class="mb-4">
                    <label>Password</label>
                    <input type="password" name="password" class="form-control" required placeholder="password">
                </div>
                <button type="submit" name="submit" class="btn btn-primary w-100 mb-2">Login</button>
            </form>
        </div>
    </div>
</div>

</body>
</html>
