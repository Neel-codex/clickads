<?php
require_once __DIR__ . '/includes/admin_auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    set_setting('referral_percent', (float) ($_POST['referral_percent'] ?? 20));
    flash('success', 'Referral settings updated.');
    redirect('admin/referral-settings.php');
}

$totalPaid = (float) db_value("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='referral_reward'");
$topRefs   = db_all(
    'SELECT u.wallet_address, COUNT(r.id) AS refs, COALESCE(SUM(r.commission),0) AS earned
       FROM referrals r JOIN users u ON u.id = r.referrer_id
   GROUP BY r.referrer_id ORDER BY earned DESC LIMIT 10'
);

$pageTitle = 'Referral Settings';
$activeNav = 'referral';
include __DIR__ . '/includes/header.php';
?>
<div class="row g-4">
  <div class="col-lg-5">
    <div class="card metric-card p-4">
      <form method="post"><?= csrf_field() ?>
        <h6 class="mb-3"><i class="fa-solid fa-user-group text-doge"></i> Referral Program</h6>
        <label class="form-label">Referral Commission (%)</label>
        <input type="number" step="0.01" min="0" max="100" name="referral_percent" class="form-control mb-2" value="<?= e(setting('referral_percent', 20)) ?>">
        <div class="form-text mb-3">Percentage of each referral deposit paid to the referrer. Default 20%.</div>
        <button class="btn btn-doge"><i class="fa-solid fa-floppy-disk"></i> Save</button>
      </form>
      <hr>
      <p class="mb-0">Total Referral Commission Paid: <strong class="text-doge"><?= doge($totalPaid) ?> DOGE</strong></p>
    </div>
  </div>
  <div class="col-lg-7">
    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-trophy text-doge"></i> Top Referrers</h6>
      <div class="table-responsive">
        <table class="table table-sm mb-0">
          <thead class="table-doge"><tr><th>Wallet</th><th>Referrals</th><th class="text-end">Earned</th></tr></thead>
          <tbody>
            <?php if (!$topRefs): ?><tr><td colspan="3" class="text-center text-muted">No referrals yet.</td></tr><?php endif; ?>
            <?php foreach ($topRefs as $r): ?>
              <tr><td class="small"><?= e(mask_address($r['wallet_address'])) ?></td><td><?= e($r['refs']) ?></td><td class="text-end"><?= doge($r['earned']) ?></td></tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
