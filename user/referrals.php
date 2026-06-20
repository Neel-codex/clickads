<?php
require_once __DIR__ . '/../includes/init.php';
require_login();

$u          = current_user();
$refLink    = url('register.php?ref=' . $u['referral_code']);
$refPct     = (float) setting('referral_percent', 20);

$totalRefs  = (int) db_value('SELECT COUNT(*) FROM referrals WHERE referrer_id = ?', [$u['id']]);
$totalEarned= (float) db_value('SELECT COALESCE(SUM(commission),0) FROM referrals WHERE referrer_id = ?', [$u['id']]);

// Referred users list.
$referred = db_all(
    'SELECT u.wallet_address, u.created_at,
            (SELECT COALESCE(SUM(commission),0) FROM referrals r2 WHERE r2.referred_id = u.id AND r2.referrer_id = ?) AS earned
       FROM referrals r
       JOIN users u ON u.id = r.referred_id
      WHERE r.referrer_id = ?
   GROUP BY u.id
   ORDER BY u.created_at DESC
      LIMIT 100',
    [$u['id'], $u['id']]
);

$pageTitle = 'Referrals';
$activeNav = 'referrals';
include __DIR__ . '/header.php';
?>
<div class="row g-3 mb-4">
  <div class="col-md-4">
    <div class="card metric-card p-3 text-center">
      <div class="metric-icon bg-doge text-dark mx-auto mb-2"><i class="fa-solid fa-percent"></i></div>
      <div class="metric-value text-doge"><?= e($refPct) ?>%</div>
      <div class="small text-muted">Commission Rate</div>
    </div>
  </div>
  <div class="col-md-4">
    <div class="card metric-card p-3 text-center">
      <div class="metric-icon bg-primary text-white mx-auto mb-2"><i class="fa-solid fa-user-group"></i></div>
      <div class="metric-value"><?= e($totalRefs) ?></div>
      <div class="small text-muted">Total Referrals</div>
    </div>
  </div>
  <div class="col-md-4">
    <div class="card metric-card p-3 text-center">
      <div class="metric-icon bg-success text-white mx-auto mb-2"><i class="fa-solid fa-coins"></i></div>
      <div class="metric-value"><?= doge($totalEarned) ?></div>
      <div class="small text-muted">Referral Earnings (DOGE)</div>
    </div>
  </div>
</div>

<div class="card metric-card p-4 mb-4">
  <h6 class="mb-3"><i class="fa-solid fa-share-nodes text-doge"></i> Your Referral Link</h6>
  <p class="text-muted small">Share this link. You earn <strong><?= e($refPct) ?>%</strong> of every deposit your referrals make.</p>
  <div class="input-group">
    <input type="text" class="form-control copy-input" value="<?= e($refLink) ?>" data-copy="<?= e($refLink) ?>" readonly>
    <button class="btn btn-doge" data-copy="<?= e($refLink) ?>"><i class="fa-solid fa-copy"></i> Copy</button>
  </div>
  <div class="mt-2 small text-muted">Referral Code: <strong><?= e($u['referral_code']) ?></strong></div>
</div>

<div class="card metric-card p-4">
  <h6 class="mb-3"><i class="fa-solid fa-users text-doge"></i> Your Referrals</h6>
  <div class="table-responsive">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-doge"><tr><th>Wallet</th><th>Joined</th><th class="text-end">Earned</th></tr></thead>
      <tbody>
        <?php if (!$referred): ?>
          <tr><td colspan="3" class="text-center text-muted py-4">No referrals yet. Share your link to start earning!</td></tr>
        <?php else: foreach ($referred as $r): ?>
          <tr>
            <td><?= e(mask_address($r['wallet_address'])) ?></td>
            <td class="small"><?= e(fmt_date($r['created_at'], 'M d, Y')) ?></td>
            <td class="text-end text-success fw-semibold"><?= doge($r['earned']) ?> DOGE</td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>
<?php include __DIR__ . '/footer.php'; ?>
