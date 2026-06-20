<?php
require_once __DIR__ . '/includes/admin_auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    foreach (['cp_merchant_id', 'cp_public_key', 'cp_private_key', 'cp_ipn_secret', 'min_withdrawal', 'cron_token'] as $k) {
        if (isset($_POST[$k])) {
            set_setting($k, clean($_POST[$k]));
        }
    }
    flash('success', 'CoinPayments & payout settings updated.');
    redirect('admin/coinpayments.php');
}

$logs = db_all('SELECT * FROM coinpayments_logs ORDER BY id DESC LIMIT 20');

$pageTitle = 'CoinPayments Settings';
$activeNav = 'coinpayments';
include __DIR__ . '/includes/header.php';
?>
<div class="row g-4">
  <div class="col-lg-7">
    <div class="card metric-card p-4">
      <form method="post"><?= csrf_field() ?>
        <h6 class="mb-3"><i class="fa-solid fa-wallet text-doge"></i> CoinPayments API</h6>
        <div class="mb-3">
          <label class="form-label">Merchant ID</label>
          <input type="text" name="cp_merchant_id" class="form-control" value="<?= e(setting('cp_merchant_id')) ?>">
        </div>
        <div class="mb-3">
          <label class="form-label">Public Key</label>
          <input type="text" name="cp_public_key" class="form-control" value="<?= e(setting('cp_public_key')) ?>">
        </div>
        <div class="mb-3">
          <label class="form-label">Private Key</label>
          <input type="text" name="cp_private_key" class="form-control" value="<?= e(setting('cp_private_key')) ?>">
        </div>
        <div class="mb-3">
          <label class="form-label">IPN Secret</label>
          <input type="text" name="cp_ipn_secret" class="form-control" value="<?= e(setting('cp_ipn_secret')) ?>">
          <div class="form-text">IPN URL: <code><?= e(url('ipn.php')) ?></code></div>
        </div>
        <hr>
        <h6 class="mb-3"><i class="fa-solid fa-gear text-doge"></i> Payout & Cron</h6>
        <div class="mb-3">
          <label class="form-label">Minimum Withdrawal (DOGE)</label>
          <input type="number" step="0.0001" name="min_withdrawal" class="form-control" value="<?= e(setting('min_withdrawal', 50)) ?>">
        </div>
        <div class="mb-3">
          <label class="form-label">Cron Token (for HTTP cron trigger)</label>
          <input type="text" name="cron_token" class="form-control" value="<?= e(setting('cron_token')) ?>">
          <div class="form-text">Cron URL: <code><?= e(url('cron.php?token=YOUR_TOKEN')) ?></code></div>
        </div>
        <button class="btn btn-doge"><i class="fa-solid fa-floppy-disk"></i> Save Settings</button>
      </form>
    </div>
  </div>
  <div class="col-lg-5">
    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-receipt text-doge"></i> Recent IPN Logs</h6>
      <div class="table-responsive" style="max-height:480px;overflow:auto;">
        <table class="table table-sm mb-0">
          <thead class="table-doge"><tr><th>TXN</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            <?php if (!$logs): ?><tr><td colspan="3" class="text-center text-muted">No IPN logs yet.</td></tr><?php endif; ?>
            <?php foreach ($logs as $l): ?>
              <tr>
                <td class="small text-truncate" style="max-width:100px;"><?= e($l['txn_id']) ?></td>
                <td class="small"><?= e($l['status']) ?> <?= e($l['status_text']) ?></td>
                <td class="small"><?= e(fmt_date($l['created_at'])) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
