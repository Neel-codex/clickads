<?php
require_once __DIR__ . '/includes/init.php';

// ---- Live platform statistics ----
$totalUsers      = (int) db_value('SELECT COUNT(*) FROM users');
$activeMiners    = (int) db_value('SELECT COUNT(*) FROM users WHERE status = 1 AND (bonus_expires_at > NOW() OR purchased_ghs > 0)');
$totalDogePaid   = (float) db_value("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type IN ('mining_reward','referral_reward')");
$totalHashrate   = (float) db_value('SELECT COALESCE(SUM(bonus_ghs + purchased_ghs),0) FROM users');
$totalDeposits   = (float) db_value("SELECT COALESCE(SUM(amount_doge),0) FROM deposits WHERE status = 'completed'");
$totalWithdrawals= (float) db_value("SELECT COALESCE(SUM(amount),0) FROM withdrawals WHERE status = 'approved'");
$totalHsSold     = (float) db_value("SELECT COALESCE(SUM(ghs_amount),0) FROM hashrate_purchases WHERE status = 'completed'");

$perDoge   = ghs_per_doge();
$bonusGhs  = setting('bonus_ghs', 100);
$bonusDays = setting('bonus_days', 10);
$dailyReward = setting('daily_bonus_reward', 1);
$referralPct = setting('referral_percent', 20);

$pageTitle = 'Mine Dogecoin in the Cloud';
include __DIR__ . '/includes/header.php';
?>

<!-- ===================== HERO ===================== -->
<header class="hero">
  <div class="mining-particles"></div>
  <div class="container position-relative">
    <div class="row align-items-center gy-4">
      <div class="col-lg-6">
        <span class="badge badge-bonus mb-3 px-3 py-2">
          <i class="fa-solid fa-gift"></i> <?= e($bonusGhs) ?> GH/s Welcome Bonus
        </span>
        <h1>Mine <span class="text-doge">Dogecoin</span> in the Cloud</h1>
        <p class="lead mt-3">
          Join with just your Dogecoin wallet address and instantly receive
          <strong><?= e($bonusGhs) ?> GH/s</strong> free mining power for
          <strong><?= e($bonusDays) ?> days</strong> plus
          <strong><?= e($dailyReward) ?> DOGE</strong> daily rewards.
        </p>
        <div class="d-flex flex-wrap gap-3 mt-4">
          <a href="<?= e(url('register.php')) ?>" class="btn btn-doge btn-lg">
            <i class="fa-solid fa-bolt"></i> Start Mining
          </a>
          <a href="<?= e(url('login.php')) ?>" class="btn btn-outline-doge btn-lg">
            <i class="fa-solid fa-right-to-bracket"></i> Login
          </a>
        </div>
      </div>
      <div class="col-lg-6 text-center">
        <i class="fa-brands fa-bitcoin doge-coin"></i>
      </div>
    </div>

    <!-- Hero stats -->
    <div class="row g-3 mt-4">
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-value" data-counter="<?= e($totalUsers) ?>">0</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-value" data-counter="<?= e($activeMiners) ?>">0</div>
          <div class="stat-label">Active Miners</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-value" data-counter="<?= e(round($totalDogePaid, 2)) ?>" data-decimals="2">0</div>
          <div class="stat-label">DOGE Paid</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-value" data-counter="<?= e(round($totalHashrate, 0)) ?>">0</div>
          <div class="stat-label">Total GH/s</div>
        </div>
      </div>
    </div>
  </div>
</header>

<!-- ===================== HOW IT WORKS ===================== -->
<section class="section" id="how">
  <div class="container text-center">
    <h2 class="section-title">How It Works</h2>
    <p class="section-sub">Start mining Dogecoin in four simple steps</p>
    <div class="row g-4">
      <div class="col-md-3">
        <div class="step-number">1</div>
        <h5>Register</h5>
        <p class="text-muted small">Sign up using only your Dogecoin wallet address. No email required.</p>
      </div>
      <div class="col-md-3">
        <div class="step-number">2</div>
        <h5>Get <?= e($bonusGhs) ?> GH/s Bonus</h5>
        <p class="text-muted small">Instantly receive free hashpower and start earning right away.</p>
      </div>
      <div class="col-md-3">
        <div class="step-number">3</div>
        <h5>Start Mining</h5>
        <p class="text-muted small">Your cloud miner runs automatically and credits DOGE to your balance.</p>
      </div>
      <div class="col-md-3">
        <div class="step-number">4</div>
        <h5>Buy More GH/s</h5>
        <p class="text-muted small">Increase your hashrate anytime to boost your daily earnings.</p>
      </div>
    </div>
  </div>
</section>

<!-- ===================== CALCULATOR ===================== -->
<section class="section bg-light" id="calculator">
  <div class="container">
    <div class="row align-items-center gy-4">
      <div class="col-lg-5">
        <h2 class="section-title">Hashrate Calculator</h2>
        <p class="section-sub">
          Enter how much hashpower you want and instantly see the DOGE cost.
          <br><strong><?= e($perDoge) ?> GH/s = 1 DOGE</strong>
        </p>
        <ul class="list-unstyled small text-muted">
          <li><i class="fa-solid fa-check text-doge"></i> <?= e($perDoge) ?> GH/s = 1 DOGE</li>
          <li><i class="fa-solid fa-check text-doge"></i> <?= e($perDoge * 5) ?> GH/s = 5 DOGE</li>
          <li><i class="fa-solid fa-check text-doge"></i> <?= e($perDoge * 10) ?> GH/s = 10 DOGE</li>
          <li><i class="fa-solid fa-check text-doge"></i> <?= e($perDoge * 50) ?> GH/s = 50 DOGE</li>
        </ul>
      </div>
      <div class="col-lg-7">
        <div class="calc-box">
          <label class="form-label">Desired Hashrate (GH/s)</label>
          <input type="number" id="calcGhs" class="form-control form-control-lg mb-4"
                 value="1000" min="1" step="1" data-per-doge="<?= e($perDoge) ?>">
          <div class="text-uppercase small text-muted">Total Cost</div>
          <div class="calc-result" id="calcResult">10.0000 DOGE</div>
          <a href="<?= e(url('register.php')) ?>" class="btn btn-doge mt-4 w-100">
            <i class="fa-solid fa-bolt"></i> Start Mining Now
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===================== FEATURES ===================== -->
<section class="section" id="features">
  <div class="container text-center">
    <h2 class="section-title">Platform Features</h2>
    <p class="section-sub">Everything you need to mine Dogecoin with confidence</p>
    <div class="row g-4">
      <?php
      $features = [
        ['fa-bolt', 'Instant Mining', 'Begin earning the moment you register, no setup required.'],
        ['fa-coins', 'Dogecoin Rewards', 'Earn real DOGE credited directly to your account balance.'],
        ['fa-user-group', 'Referral Program', 'Earn ' . e($referralPct) . '% commission on every referral deposit.'],
        ['fa-wallet', 'CoinPayments Deposits', 'Deposit with DOGE, LTC, BTC or USDT securely.'],
        ['fa-shield-halved', 'Secure Withdrawals', 'Admin-verified withdrawals straight to your wallet.'],
        ['fa-mobile-screen', 'Mobile Friendly', 'Fully responsive dashboard works on any device.'],
      ];
      foreach ($features as $f): ?>
        <div class="col-md-4">
          <div class="card crypto-card p-4">
            <div class="icon-circle"><i class="fa-solid <?= e($f[0]) ?>"></i></div>
            <h5><?= $f[1] ?></h5>
            <p class="text-muted small mb-0"><?= $f[2] ?></p>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- ===================== LIVE STATISTICS ===================== -->
<section class="section bg-doge-dark text-white">
  <div class="container text-center">
    <h2 class="section-title text-white">Live Statistics</h2>
    <p class="section-sub text-secondary">Real-time platform performance</p>
    <div class="row g-4">
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-value" data-counter="<?= e($totalUsers) ?>">0</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-value" data-counter="<?= e(round($totalDeposits, 2)) ?>" data-decimals="2">0</div>
          <div class="stat-label">Total Deposits (DOGE)</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-value" data-counter="<?= e(round($totalWithdrawals, 2)) ?>" data-decimals="2">0</div>
          <div class="stat-label">Total Withdrawals (DOGE)</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <div class="stat-value" data-counter="<?= e(round($totalHsSold, 0)) ?>">0</div>
          <div class="stat-label">Hashrate Sold (GH/s)</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===================== CTA ===================== -->
<section class="section text-center">
  <div class="container">
    <h2 class="section-title">Ready to Start Mining?</h2>
    <p class="section-sub">Claim your <?= e($bonusGhs) ?> GH/s welcome bonus today.</p>
    <a href="<?= e(url('register.php')) ?>" class="btn btn-doge btn-lg">
      <i class="fa-solid fa-rocket"></i> Create Free Account
    </a>
  </div>
</section>

<?php include __DIR__ . '/includes/footer.php'; ?>
