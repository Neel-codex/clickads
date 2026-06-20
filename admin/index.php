<?php
require_once __DIR__ . '/../includes/init.php';

if (is_admin()) {
    redirect('admin/dashboard.php');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $username = clean($_POST['username'] ?? '');
    $password = (string) ($_POST['password'] ?? '');

    $admin = db_row('SELECT * FROM admins WHERE username = ?', [$username]);
    if ($admin && password_verify($password, $admin['password_hash'])) {
        login_admin($admin['id']);
        db_query('UPDATE admins SET last_login = NOW() WHERE id = ?', [$admin['id']]);
        activity_log(null, 'admin_login', 'Admin ' . $username . ' logged in');
        redirect('admin/dashboard.php');
    }
    flash('error', 'Invalid username or password.');
}

$siteName = setting('site_name', 'DogeHash');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login - <?= e($siteName) ?></title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet">
  <link href="<?= e(url('assets/css/style.css')) ?>" rel="stylesheet">
</head>
<body class="bg-doge-dark">
<div class="container">
  <div class="row justify-content-center align-items-center" style="min-height:100vh;">
    <div class="col-md-5 col-lg-4">
      <div class="card crypto-card p-4">
        <div class="text-center mb-4">
          <div class="step-number mb-2"><i class="fa-solid fa-user-shield"></i></div>
          <h4><?= e($siteName) ?> Admin</h4>
          <p class="text-muted small">Secure administrator login</p>
        </div>
        <?= render_flashes() ?>
        <form method="post" action="<?= e(url('admin/index.php')) ?>">
          <?= csrf_field() ?>
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input type="text" name="username" class="form-control" required autofocus>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-doge w-100 btn-lg">
            <i class="fa-solid fa-right-to-bracket"></i> Login
          </button>
        </form>
      </div>
      <p class="text-center text-secondary small mt-3">
        <a href="<?= e(url('index.php')) ?>" class="text-doge">&larr; Back to site</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>
