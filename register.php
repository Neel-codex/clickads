<?php
require_once __DIR__ . '/includes/init.php';

if (is_logged_in()) {
    redirect('user/dashboard.php');
}

// Pre-fill referral code from ?ref=
$prefillRef = isset($_GET['ref']) ? clean($_GET['ref']) : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();

    $wallet  = clean($_POST['wallet_address'] ?? '');
    $refCode = strtoupper(clean($_POST['referral_code'] ?? ''));
    $agree   = !empty($_POST['agree']);

    $errors = [];

    if (!is_valid_doge_address($wallet)) {
        $errors[] = 'Please enter a valid Dogecoin wallet address (starts with "D").';
    }
    if (!$agree) {
        $errors[] = 'You must agree to the Terms of Service.';
    }

    // Duplicate check.
    if (!$errors) {
        $exists = db_value('SELECT id FROM users WHERE wallet_address = ?', [$wallet]);
        if ($exists) {
            $errors[] = 'This wallet address is already registered. Please log in instead.';
        }
    }

    // Resolve referrer.
    $referredBy = null;
    if (!$errors && $refCode) {
        $referrer = db_row('SELECT id FROM users WHERE referral_code = ?', [$refCode]);
        if ($referrer) {
            $referredBy = $referrer['id'];
        }
    }

    if (!$errors) {
        // Generate a unique referral code.
        do {
            $newCode = generate_referral_code(8);
        } while (db_value('SELECT id FROM users WHERE referral_code = ?', [$newCode]));

        $bonusGhs  = (float) setting('bonus_ghs', 100);
        $bonusDays = (int) setting('bonus_days', 10);
        $expiresAt = date('Y-m-d H:i:s', time() + ($bonusDays * 86400));

        db_query(
            'INSERT INTO users
                (wallet_address, referral_code, referred_by, bonus_ghs, bonus_expires_at, last_mining_at, status, created_at)
             VALUES (?, ?, ?, ?, ?, NOW(), 1, NOW())',
            [$wallet, $newCode, $referredBy, $bonusGhs, $expiresAt]
        );
        $userId = db_insert_id();

        // Record referral relationship (commission credited later on deposits).
        if ($referredBy) {
            db_query(
                'INSERT INTO referrals (referrer_id, referred_id, commission, source_amount, created_at)
                 VALUES (?, ?, 0, 0, NOW())',
                [$referredBy, $userId]
            );
        }

        activity_log($userId, 'register', 'New registration');
        login_user($userId);
        flash('success', 'Welcome! You received ' . ghs($bonusGhs) . ' GH/s bonus and ' . $bonusDays . ' days of free mining.');
        redirect('user/dashboard.php');
    }

    foreach ($errors as $err) {
        flash('error', $err);
    }
    $prefillRef = $refCode;
}

$bonusGhs  = setting('bonus_ghs', 100);
$bonusDays = setting('bonus_days', 10);
$pageTitle = 'Register';
include __DIR__ . '/includes/header.php';
?>
<section class="section">
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-lg-5 col-md-8">
        <div class="card crypto-card p-4">
          <div class="text-center mb-3">
            <div class="step-number mb-2"><i class="fa-solid fa-user-plus"></i></div>
            <h3>Create Your Account</h3>
            <p class="text-muted small">
              Get <strong><?= e($bonusGhs) ?> GH/s</strong> free + <?= e($bonusDays) ?> days of mining
            </p>
          </div>
          <form method="post" action="<?= e(url('register.php')) ?>">
            <?= csrf_field() ?>
            <div class="mb-3">
              <label class="form-label">Dogecoin Wallet Address <span class="text-danger">*</span></label>
              <input type="text" name="wallet_address" class="form-control form-control-lg"
                     placeholder="D..." required value="<?= e($_POST['wallet_address'] ?? '') ?>">
              <div class="form-text">Your DOGE address is your login and where you receive withdrawals.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Referral Code <span class="text-muted">(optional)</span></label>
              <input type="text" name="referral_code" class="form-control"
                     placeholder="Enter referral code" value="<?= e($prefillRef) ?>">
            </div>
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" name="agree" id="agree" value="1">
              <label class="form-check-label small" for="agree">
                I agree to the <a href="<?= e(url('terms.php')) ?>" target="_blank">Terms</a> and
                <a href="<?= e(url('privacy.php')) ?>" target="_blank">Privacy Policy</a>.
              </label>
            </div>
            <button type="submit" class="btn btn-doge w-100 btn-lg">
              <i class="fa-solid fa-bolt"></i> Register & Start Mining
            </button>
          </form>
          <p class="text-center small mt-3 mb-0">
            Already have an account? <a href="<?= e(url('login.php')) ?>" class="text-doge">Login</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>
