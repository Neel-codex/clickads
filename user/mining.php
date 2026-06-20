<?php
require_once __DIR__ . '/../includes/init.php';
require_login();

$u = current_user();
accrue_user_mining($u);
$u = refresh_user();

$inBonus      = in_bonus_period($u);
$effectiveHs  = effective_hashrate($u);
$dailyEarning = estimated_daily_earnings($u);

// Recent mining rewards.
$rewards = db_all('SELECT * FROM mining_rewards WHERE user_id = ? ORDER BY id DESC LIMIT 15', [$u['id']]);

$pageTitle = 'Live Mining';
$activeNav = 'mining';
include __DIR__ . '/header.php';
?>
<div class="row g-4">
  <div class="col-lg-7">
    <div class="mining-panel" id="miningPanel"
         data-daily="<?= e($dailyEarning) ?>" data-balance="<?= e($u['balance']) ?>">
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div>
          <span class="status-dot <?= mining_enabled() ? 'online' : 'offline' ?>"></span>
          <span><?= mining_enabled() ? 'Mining Active' : 'Mining Paused' ?></span>
        </div>
        <i class="fa-solid fa-server mining-rig"></i>
      </div>
      <div class="small text-secondary text-uppercase">Live Mined Balance</div>
      <div class="live-balance" id="liveBalance"><?= doge($u['balance'], 8) ?> DOGE</div>
      <div class="mining-bar my-3"><span></span></div>
      <div class="row text-center">
        <div class="col-6 col-md-3">
          <div class="small text-secondary">Hashrate</div>
          <div class="fw-bold" id="liveHashrate"><?= ghs($effectiveHs) ?> GH/s</div>
        </div>
        <div class="col-6 col-md-3">
          <div class="small text-secondary">Daily</div>
          <div class="fw-bold"><?= doge($dailyEarning) ?></div>
        </div>
        <div class="col-6 col-md-3">
          <div class="small text-secondary">Hourly</div>
          <div class="fw-bold"><?= doge($dailyEarning / 24, 6) ?></div>
        </div>
        <div class="col-6 col-md-3">
          <div class="small text-secondary">Per Min</div>
          <div class="fw-bold"><?= doge($dailyEarning / 1440, 8) ?></div>
        </div>
      </div>
    </div>
  </div>

  <div class="col-lg-5">
    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-circle-info text-doge"></i> Mining Status</h6>
      <table class="table table-sm mb-0">
        <tr><td class="text-muted">Mode</td><td class="text-end fw-semibold"><?= $inBonus ? 'Welcome Bonus' : 'Standard' ?></td></tr>
        <tr><td class="text-muted">Bonus GH/s</td><td class="text-end fw-semibold"><?= ghs($u['bonus_ghs']) ?></td></tr>
        <tr><td class="text-muted">Purchased GH/s</td><td class="text-end fw-semibold"><?= ghs($u['purchased_ghs']) ?></td></tr>
        <?php if ($inBonus): ?>
        <tr><td class="text-muted">Bonus Ends</td><td class="text-end fw-semibold"><?= e(fmt_date($u['bonus_expires_at'])) ?></td></tr>
        <?php endif; ?>
        <tr><td class="text-muted">Last Update</td><td class="text-end fw-semibold"><?= e(fmt_date($u['last_mining_at'])) ?></td></tr>
      </table>
    </div>
  </div>
</div>

<div class="card metric-card p-4 mt-4">
  <h6 class="mb-3"><i class="fa-solid fa-clock-rotate-left text-doge"></i> Recent Mining Rewards</h6>
  <div class="table-responsive">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-doge"><tr><th>Date</th><th>Hashrate</th><th>Type</th><th class="text-end">Amount</th></tr></thead>
      <tbody>
        <?php if (!$rewards): ?>
          <tr><td colspan="4" class="text-center text-muted py-3">No rewards yet. Mining accrues over time.</td></tr>
        <?php else: foreach ($rewards as $r): ?>
          <tr>
            <td class="small"><?= e(fmt_date($r['created_at'])) ?></td>
            <td><?= ghs($r['hashrate']) ?> GH/s</td>
            <td><span class="badge bg-secondary text-uppercase"><?= e($r['type']) ?></span></td>
            <td class="text-end text-success fw-semibold">+<?= doge($r['amount'], 8) ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php include __DIR__ . '/footer.php'; ?>
