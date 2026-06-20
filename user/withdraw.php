<?php
require_once __DIR__ . '/../includes/init.php';
require_login();

$u           = current_user();
$minWithdraw = (float) setting('min_withdrawal', 50);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();

    $amount = (float) ($_POST['amount'] ?? 0);
    $wallet = clean($_POST['wallet_address'] ?? '');

    // Re-fetch fresh balance.
    $u = refresh_user();

    $errors = [];
    if ($amount < $minWithdraw) {
        $errors[] = 'Minimum withdrawal is ' . doge($minWithdraw) . ' DOGE.';
    }
    if ($amount > (float) $u['balance']) {
        $errors[] = 'Insufficient balance.';
    }
    if (!is_valid_doge_address($wallet)) {
        $errors[] = 'Please enter a valid Dogecoin wallet address.';
    }
    // Prevent multiple pending requests.
    $hasPending = db_value("SELECT id FROM withdrawals WHERE user_id = ? AND status = 'pending'", [$u['id']]);
    if ($hasPending) {
        $errors[] = 'You already have a pending withdrawal request. Please wait for it to be processed.';
    }

    if (!$errors) {
        // Deduct from balance immediately, hold as pending.
        db_query('UPDATE users SET balance = balance - ? WHERE id = ?', [$amount, $u['id']]);
        db_query(
            'INSERT INTO withdrawals (user_id, amount, wallet_address, status, created_at)
             VALUES (?, ?, ?, ?, NOW())',
            [$u['id'], $amount, $wallet, 'pending']
        );
        record_transaction($u['id'], 'withdrawal', -$amount, 'Withdrawal request to ' . mask_address($wallet), 'pending');
        activity_log($u['id'], 'withdraw_request', $amount . ' DOGE');
        flash('success', 'Withdrawal request submitted for ' . doge($amount) . ' DOGE. Awaiting admin approval.');
        redirect('user/withdraw.php');
    }
    foreach ($errors as $err) {
        flash('error', $err);
    }
}

$u        = refresh_user();
$history  = db_all('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY id DESC LIMIT 50', [$u['id']]);

$pageTitle = 'Withdraw';
$activeNav = 'withdraw';
include __DIR__ . '/header.php';
?>
<div class="row g-4">
  <div class="col-lg-5">
    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-money-bill-transfer text-doge"></i> Request Withdrawal</h6>
      <div class="bg-light rounded p-3 mb-3 text-center">
        <div class="small text-muted">Available Balance</div>
        <div class="fs-4 fw-bold text-doge"><?= doge($u['balance']) ?> DOGE</div>
      </div>
      <form method="post" action="<?= e(url('user/withdraw.php')) ?>">
        <?= csrf_field() ?>
        <div class="mb-3">
          <label class="form-label">Amount (DOGE)</label>
          <input type="number" name="amount" class="form-control" step="0.00000001"
                 min="<?= e($minWithdraw) ?>" max="<?= e($u['balance']) ?>" required
                 placeholder="Min <?= e(doge($minWithdraw)) ?>">
          <div class="form-text">Minimum withdrawal: <?= doge($minWithdraw) ?> DOGE</div>
        </div>
        <div class="mb-3">
          <label class="form-label">Dogecoin Address</label>
          <input type="text" name="wallet_address" class="form-control" value="<?= e($u['wallet_address']) ?>" required>
        </div>
        <button type="submit" class="btn btn-doge w-100 btn-lg">
          <i class="fa-solid fa-paper-plane"></i> Request Withdrawal
        </button>
      </form>
    </div>
  </div>

  <div class="col-lg-7">
    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-clock-rotate-left text-doge"></i> Withdrawal History</h6>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-doge"><tr><th>Date</th><th>Amount</th><th>Address</th><th>Status</th></tr></thead>
          <tbody>
            <?php if (!$history): ?>
              <tr><td colspan="4" class="text-center text-muted py-4">No withdrawals yet.</td></tr>
            <?php else: foreach ($history as $w):
              $statusColor = ['pending' => 'warning', 'approved' => 'success', 'rejected' => 'danger'][$w['status']] ?? 'secondary';
            ?>
              <tr>
                <td class="small"><?= e(fmt_date($w['created_at'])) ?></td>
                <td class="fw-semibold"><?= doge($w['amount']) ?></td>
                <td class="small"><?= e(mask_address($w['wallet_address'])) ?></td>
                <td><span class="badge bg-<?= e($statusColor) ?> text-capitalize"><?= e($w['status']) ?></span></td>
              </tr>
            <?php endforeach; endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
<?php include __DIR__ . '/footer.php'; ?>
