<?php
require_once __DIR__ . '/../includes/init.php';
require_login();

$u = current_user();

// Accrue mining on dashboard load (keeps balance fresh even without cron).
accrue_user_mining($u);
$u = refresh_user();

$inBonus      = in_bonus_period($u);
$totalHs      = total_hashrate($u);
$effectiveHs  = effective_hashrate($u);
$dailyEarning = estimated_daily_earnings($u);
$refLink      = url('register.php?ref=' . $u['referral_code']);

$pageTitle = 'Dashboard';
$activeNav = 'dashboard';
include __DIR__ . '/header.php';
?>

<!-- Bonus banner -->
<?php if ($inBonus): ?>
  <div class="alert alert-warning d-flex align-items-center">
    <i class="fa-solid fa-gift fa-lg me-2"></i>
    <div>
      <strong>Welcome Bonus Active!</strong> You are earning bonus rewards until
      <strong><?= e(fmt_date($u['bonus_expires_at'])) ?></strong>.
    </div>
  </div>
<?php else: ?>
  <?php if ((float) $u['purchased_ghs'] <= 0): ?>
  <div class="alert alert-info d-flex align-items-center">
    <i class="fa-solid fa-circle-info fa-lg me-2"></i>
    <div>Your bonus period has ended. <a href="<?= e(url('user/buy.php')) ?>" class="alert-link">Buy hashrate</a> to keep mining.</div>
  </div>
  <?php endif; ?>
<?php endif; ?>

<!-- Mining statistics metric cards -->
<div class="row g-3 mb-4">
  <div class="col-6 col-lg-3">
    <div class="card metric-card p-3">
      <div class="d-flex justify-content-between">
        <div>
          <div class="text-muted small">Total Hashrate</div>
          <div class="metric-value text-doge"><?= ghs($totalHs) ?></div>
          <div class="small text-muted">GH/s</div>
        </div>
        <div class="metric-icon bg-doge text-dark"><i class="fa-solid fa-microchip"></i></div>
      </div>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card metric-card p-3">
      <div class="d-flex justify-content-between">
        <div>
          <div class="text-muted small">Daily Earnings</div>
          <div class="metric-value"><?= doge($dailyEarning) ?></div>
          <div class="small text-muted">DOGE / day</div>
        </div>
        <div class="metric-icon bg-success text-white"><i class="fa-solid fa-chart-line"></i></div>
      </div>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card metric-card p-3">
      <div class="d-flex justify-content-between">
        <div>
          <div class="text-muted small">Available Balance</div>
          <div class="metric-value"><?= doge($u['balance']) ?></div>
          <div class="small text-muted">DOGE</div>
        </div>
        <div class="metric-icon bg-warning text-dark"><i class="fa-solid fa-wallet"></i></div>
      </div>
    </div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card metric-card p-3">
      <div class="d-flex justify-content-between">
        <div>
          <div class="text-muted small">Total Earned</div>
          <div class="metric-value"><?= doge($u['total_earnings']) ?></div>
          <div class="small text-muted">DOGE</div>
        </div>
        <div class="metric-icon bg-primary text-white"><i class="fa-solid fa-sack-dollar"></i></div>
      </div>
    </div>
  </div>
</div>

<div class="row g-4">
  <!-- Live mining panel -->
  <div class="col-lg-7">
    <div class="mining-panel" id="miningPanel"
         data-daily="<?= e($dailyEarning) ?>" data-balance="<?= e($u['balance']) ?>">
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div>
          <span class="status-dot <?= mining_enabled() ? 'online' : 'offline' ?>"></span>
          <span class="small"><?= mining_enabled() ? 'Mining Active' : 'Mining Paused' ?></span>
        </div>
        <i class="fa-solid fa-server mining-rig"></i>
      </div>
      <div class="small text-secondary text-uppercase">Live Balance</div>
      <div class="live-balance" id="liveBalance"><?= doge($u['balance'], 8) ?> DOGE</div>
      <div class="mining-bar my-3"><span></span></div>
      <div class="row text-center mt-3">
        <div class="col-4">
          <div class="small text-secondary">Hashrate</div>
          <div class="fw-bold" id="liveHashrate"><?= ghs($effectiveHs) ?> GH/s</div>
        </div>
        <div class="col-4">
          <div class="small text-secondary">Speed</div>
          <div class="fw-bold"><?= doge($dailyEarning / 24, 6) ?> DOGE/h</div>
        </div>
        <div class="col-4">
          <div class="small text-secondary">Status</div>
          <div class="fw-bold text-doge"><?= $inBonus ? 'Bonus' : 'Active' ?></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Account overview & mining breakdown -->
  <div class="col-lg-5">
    <div class="card metric-card p-4 mb-4">
      <h6 class="mb-3"><i class="fa-solid fa-id-card text-doge"></i> Account Overview</h6>
      <div class="mb-2 small text-muted">Wallet Address</div>
      <div class="input-group input-group-sm mb-3">
        <input type="text" class="form-control copy-input" value="<?= e($u['wallet_address']) ?>"
               data-copy="<?= e($u['wallet_address']) ?>" readonly>
        <button class="btn btn-outline-secondary" data-copy="<?= e($u['wallet_address']) ?>"><i class="fa-solid fa-copy"></i></button>
      </div>
      <div class="mb-2 small text-muted">Registered</div>
      <div class="mb-3 fw-semibold"><?= e(fmt_date($u['created_at'], 'M d, Y')) ?></div>
      <div class="mb-2 small text-muted">Your Referral Link</div>
      <div class="input-group input-group-sm">
        <input type="text" class="form-control copy-input" value="<?= e($refLink) ?>"
               data-copy="<?= e($refLink) ?>" readonly>
        <button class="btn btn-outline-secondary" data-copy="<?= e($refLink) ?>"><i class="fa-solid fa-copy"></i></button>
      </div>
    </div>

    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-microchip text-doge"></i> Hashrate Breakdown</h6>
      <div class="d-flex justify-content-between mb-2">
        <span class="text-muted">Welcome Bonus</span>
        <strong><?= ghs($u['bonus_ghs']) ?> GH/s <?= $inBonus ? '' : '(expired)' ?></strong>
      </div>
      <div class="d-flex justify-content-between mb-2">
        <span class="text-muted">Purchased</span>
        <strong><?= ghs($u['purchased_ghs']) ?> GH/s</strong>
      </div>
      <hr>
      <div class="d-flex justify-content-between">
        <span class="text-muted">Total Withdrawn</span>
        <strong><?= doge($u['total_withdrawn']) ?> DOGE</strong>
      </div>
      <div class="d-flex justify-content-between">
        <span class="text-muted">Referral Earnings</span>
        <strong><?= doge($u['referral_earnings']) ?> DOGE</strong>
      </div>
      <a href="<?= e(url('user/buy.php')) ?>" class="btn btn-doge w-100 mt-3">
        <i class="fa-solid fa-plus"></i> Buy More Hashrate
      </a>
    </div>
  </div>
</div>

<?php include __DIR__ . '/footer.php'; ?>
