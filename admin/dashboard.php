<?php
require_once __DIR__ . '/includes/admin_auth.php';

$totalUsers   = (int) db_value('SELECT COUNT(*) FROM users');
$activeUsers  = (int) db_value('SELECT COUNT(*) FROM users WHERE status = 1');
$suspended    = (int) db_value('SELECT COUNT(*) FROM users WHERE status = 0');
$totalDeposits= (float) db_value("SELECT COALESCE(SUM(amount_doge),0) FROM deposits WHERE status = 'completed'");
$pendingWd    = (int) db_value("SELECT COUNT(*) FROM withdrawals WHERE status = 'pending'");
$totalWdPaid  = (float) db_value("SELECT COALESCE(SUM(amount),0) FROM withdrawals WHERE status = 'approved'");
$dogePaid     = (float) db_value("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type IN ('mining_reward','referral_reward')");
$hsSold       = (float) db_value("SELECT COALESCE(SUM(ghs_amount),0) FROM hashrate_purchases WHERE status = 'completed'");

$recentUsers  = db_all('SELECT * FROM users ORDER BY id DESC LIMIT 8');
$recentLogs   = db_all('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 10');

$pageTitle = 'Dashboard';
$activeNav = 'dashboard';
include __DIR__ . '/includes/header.php';

$cards = [
    ['Total Users', $totalUsers, 'fa-users', 'primary'],
    ['Active Users', $activeUsers, 'fa-user-check', 'success'],
    ['Total Deposits', doge($totalDeposits) . ' DOGE', 'fa-arrow-down', 'info'],
    ['Withdrawals Paid', doge($totalWdPaid) . ' DOGE', 'fa-arrow-up', 'warning'],
    ['Total DOGE Paid', doge($dogePaid) . ' DOGE', 'fa-coins', 'success'],
    ['Hashrate Sold', ghs($hsSold) . ' GH/s', 'fa-microchip', 'doge text-dark'],
    ['Suspended Users', $suspended, 'fa-user-slash', 'danger'],
    ['Pending Withdrawals', $pendingWd, 'fa-hourglass-half', 'secondary'],
];
?>
<div class="row g-3 mb-4">
  <?php foreach ($cards as $c): ?>
    <div class="col-6 col-lg-3">
      <div class="card metric-card p-3">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="text-muted small"><?= e($c[0]) ?></div>
            <div class="metric-value"><?= e($c[1]) ?></div>
          </div>
          <div class="metric-icon bg-<?= e($c[3]) ?> <?= strpos($c[3],'doge')===false ? 'text-white' : '' ?>">
            <i class="fa-solid <?= e($c[2]) ?>"></i>
          </div>
        </div>
      </div>
    </div>
  <?php endforeach; ?>
</div>

<div class="row g-4">
  <div class="col-lg-7">
    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-user-plus text-doge"></i> Recent Users</h6>
      <div class="table-responsive">
        <table class="table table-sm table-hover align-middle mb-0">
          <thead class="table-doge"><tr><th>ID</th><th>Wallet</th><th>GH/s</th><th>Balance</th><th>Joined</th></tr></thead>
          <tbody>
            <?php foreach ($recentUsers as $usr): ?>
              <tr>
                <td><?= e($usr['id']) ?></td>
                <td class="small"><a href="<?= e(url('admin/users.php?id=' . $usr['id'])) ?>"><?= e(mask_address($usr['wallet_address'])) ?></a></td>
                <td><?= ghs($usr['bonus_ghs'] + $usr['purchased_ghs']) ?></td>
                <td><?= doge($usr['balance']) ?></td>
                <td class="small"><?= e(fmt_date($usr['created_at'], 'M d')) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="col-lg-5">
    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-clock-rotate-left text-doge"></i> Recent Activity</h6>
      <ul class="list-group list-group-flush">
        <?php foreach ($recentLogs as $log): ?>
          <li class="list-group-item px-0 py-2 small">
            <span class="badge bg-secondary"><?= e($log['action']) ?></span>
            <?= e($log['details']) ?>
            <div class="text-muted"><?= e(fmt_date($log['created_at'])) ?></div>
          </li>
        <?php endforeach; ?>
        <?php if (!$recentLogs): ?><li class="list-group-item px-0 text-muted">No activity yet.</li><?php endif; ?>
      </ul>
    </div>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
