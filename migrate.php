<?php

require_once 'core/Database.php';
$host = 'localhost';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 1. Buat Database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS kasir_db");
    
    // 2. Pilih Database
    $pdo->exec("USE kasir_db");

    // 3. Buat Tabel Migrations untuk tracking
    $pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration VARCHAR(255) NOT NULL,
        run_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");

    // Ambil semua file di folder database/migrations
    $files = glob('database/migrations/00?_*.php');
    
    $runCount = 0;

    foreach ($files as $file) {
        $filename = basename($file, '.php');

        // Cek apakah sudah pernah dijalankan
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM migrations WHERE migration = :migration");
        $stmt->execute(['migration' => $filename]);
        
        if ($stmt->fetchColumn() == 0) {
            // Jika belum pernah di-run, include file-nya
            require_once $file;

            // Dapatkan nama class (menghapus angka '001_')
            $classNamePart = preg_replace('/^[0-9]+_/', '', $filename);
            $className = str_replace(' ', '', ucwords(str_replace('_', ' ', $classNamePart)));

            if (class_exists($className)) {
                $migrationObj = new $className();
                $query = $migrationObj->up();
                
                // Eksekusi query
                $pdo->exec($query);

                // Catat ke tabel migrations
                $insertStmt = $pdo->prepare("INSERT INTO migrations (migration) VALUES (:migration)");
                $insertStmt->execute(['migration' => $filename]);

                echo "Migrated: " . $filename . "<br>";
                $runCount++;
            }
        }
    }

    if ($runCount == 0) {
        echo "Nothing to migrate. Database is up to date.<br>";
    } else {
        echo "<br><strong>Semua Migration Baru Sukses Dijalankan!</strong>";
    }

} catch (PDOException $e) {
    echo "Gagal melakukan migration: " . $e->getMessage();
}
