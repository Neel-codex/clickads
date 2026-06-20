<?php
require_once __DIR__ . '/includes/init.php';

if (is_logged_in()) {
    redirect('user/dashboard.php');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();

    $wallet   = clean($_POST['wallet_address'] ?? '');
    $remember = !empty($_POST['remember']);

    if (!is_valid_doge_address($wallet)) {
        flash('error', 'Please enter a valid Dogecoin wallet address.');
    } else {
        $user = db_row('SELECT * FROM users WHERE wallet_address = ?', [$wallet]);
        if (!$user) {
            flash('error', 'No account found for this wallet address. Please register first.');
        } elseif ((int) $user['status'] !== 1) {
            flash('error', 'Your account is suspended. Please contact support.');
        } else {
            login_user($user['id'], $remember);
            activity_log($user['id'], 'login', 'User login');
            redirect('user/dashboard.php');
        }
    }
}

$pageTitle = 'Login';
include __DIR__ . '/includes/header.php';
?>
<section class="section">
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-lg-5 col-md-8">
        <div class="card crypto-card p-4">
          <div class="text-center mb-3">
            <div class="step-number mb-2"><i class="fa-solid fa-right-to-bracket"></i></div>
            <h3>Login</h3>
            <p class="text-muted small">Sign in with your Dogecoin wallet address</p>
          </div>
          <form method="post" action="<?= e(url('login.php')) ?>">
            <?= csrf_field() ?>
            <div class="mb-3">
              <label class="form-label">Dogecoin Wallet Address</label>
              <input type="text" name="wallet_address" class="form-control form-control-lg"
                     placeholder="D..." required value="<?= e($_POST['wallet_address'] ?? '') ?>">
            </div>
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" name="remember" id="remember" value="1">
              <label class="form-check-label small" for="remember">Remember me for 30 days</label>
            </div>
            <button type="submit" class="btn btn-doge w-100 btn-lg">
              <i class="fa-solid fa-right-to-bracket"></i> Login
            </button>
          </form>
          <p class="text-center small mt-3 mb-0">
            Don't have an account? <a href="<?= e(url('register.php')) ?>" class="text-doge">Register</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>
