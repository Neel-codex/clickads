<?php
require_once __DIR__ . '/../includes/init.php';
require_login();

$u = current_user();

$deposits  = (float) db_value("SELECT COALESCE(SUM(amount_doge),0) FROM deposits WHERE user_id = ? AND status = 'completed'", [$u['id']]);
$refLink   = url('register.php?ref=' . $u['referral_code']);

$pageTitle = 'Profile';
$activeNav = 'profile';
include __DIR__ . '/header.php';
?>
<div class="row g-4">
  <div class="col-lg-6">
    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-user text-doge"></i> Account Details</h6>
      <table class="table mb-0">
        <tr><td class="text-muted">Wallet Address</td><td class="text-end small"><?= e($u['wallet_address']) ?></td></tr>
        <tr><td class="text-muted">Referral Code</td><td class="text-end fw-semibold"><?= e($u['referral_code']) ?></td></tr>
        <tr><td class="text-muted">Registered</td><td class="text-end"><?= e(fmt_date($u['created_at'])) ?></td></tr>
        <tr><td class="text-muted">Account Status</td>
          <td class="text-end"><span class="badge bg-success">Active</span></td></tr>
      </table>
    </div>
  </div>
  <div class="col-lg-6">
    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-chart-pie text-doge"></i> Lifetime Statistics</h6>
      <table class="table mb-0">
        <tr><td class="text-muted">Total Earnings</td><td class="text-end fw-semibold"><?= doge($u['total_earnings']) ?> DOGE</td></tr>
        <tr><td class="text-muted">Total Withdrawn</td><td class="text-end fw-semibold"><?= doge($u['total_withdrawn']) ?> DOGE</td></tr>
        <tr><td class="text-muted">Referral Earnings</td><td class="text-end fw-semibold"><?= doge($u['referral_earnings']) ?> DOGE</td></tr>
        <tr><td class="text-muted">Total Deposits</td><td class="text-end fw-semibold"><?= doge($deposits) ?> DOGE</td></tr>
        <tr><td class="text-muted">Total Hashrate</td><td class="text-end fw-semibold"><?= ghs(total_hashrate($u)) ?> GH/s</td></tr>
      </table>
    </div>
  </div>
</div>

<div class="card metric-card p-4 mt-4">
  <h6 class="mb-3"><i class="fa-solid fa-share-nodes text-doge"></i> Referral Link</h6>
  <div class="input-group">
    <input type="text" class="form-control copy-input" value="<?= e($refLink) ?>" data-copy="<?= e($refLink) ?>" readonly>
    <button class="btn btn-doge" data-copy="<?= e($refLink) ?>"><i class="fa-solid fa-copy"></i> Copy</button>
  </div>
</div>

<div class="text-center mt-4">
  <a href="<?= e(url('logout.php')) ?>" class="btn btn-outline-danger">
    <i class="fa-solid fa-right-from-bracket"></i> Logout
  </a>
</div>
<?php include __DIR__ . '/footer.php'; ?>
