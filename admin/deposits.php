<?php
require_once __DIR__ . '/includes/admin_auth.php';

// Manual deposit completion / adjustment.
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action    = $_POST['action'] ?? '';
    $depositId = (int) ($_POST['deposit_id'] ?? 0);
    $deposit   = db_row('SELECT * FROM deposits WHERE id = ?', [$depositId]);

    if ($deposit && $action === 'mark_completed' && $deposit['status'] !== 'completed') {
        db_query("UPDATE deposits SET status='completed', completed_at=NOW() WHERE id=?", [$depositId]);
        if ($deposit['purpose'] === 'hashrate') {
            db_query('UPDATE users SET purchased_ghs = purchased_ghs + ? WHERE id = ?', [$deposit['ghs_amount'], $deposit['user_id']]);
            db_query("UPDATE hashrate_purchases SET status='completed' WHERE deposit_id=?", [$depositId]);
            record_transaction($deposit['user_id'], 'hashrate_purchase', $deposit['amount_doge'], 'Hashrate purchase (admin verified)');
        } else {
            db_query('UPDATE users SET balance = balance + ? WHERE id = ?', [$deposit['amount_doge'], $deposit['user_id']]);
            record_transaction($deposit['user_id'], 'deposit', $deposit['amount_doge'], 'Deposit (admin verified)');
        }
        flash('success', 'Deposit marked completed and credited.');
    } elseif ($deposit && $action === 'cancel' && $deposit['status'] === 'pending') {
        db_query("UPDATE deposits SET status='cancelled' WHERE id=?", [$depositId]);
        flash('success', 'Deposit cancelled.');
    }
    redirect('admin/deposits.php');
}

$status = $_GET['status'] ?? 'all';
$where  = '';
$params = [];
if (in_array($status, ['pending', 'completed', 'cancelled'], true)) {
    $where = 'WHERE d.status = ?';
    $params[] = $status;
}
$deposits = db_all(
    "SELECT d.*, u.wallet_address FROM deposits d JOIN users u ON u.id = d.user_id $where ORDER BY d.id DESC LIMIT 200",
    $params
);

$pageTitle = 'Deposit Management';
$activeNav = 'deposits';
include __DIR__ . '/includes/header.php';
?>
<div class="card metric-card p-4">
  <div class="btn-group btn-group-sm mb-3">
    <?php foreach (['all'=>'All','pending'=>'Pending','completed'=>'Completed','cancelled'=>'Cancelled'] as $k=>$v): ?>
      <a href="?status=<?= e($k) ?>" class="btn btn-<?= $status===$k?'doge':'outline-secondary' ?>"><?= e($v) ?></a>
    <?php endforeach; ?>
  </div>
  <div class="table-responsive">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-doge"><tr><th>ID</th><th>User</th><th>Purpose</th><th>Amount</th><th>Pay</th><th>TXN</th><th>Status</th><th>Date</th><th></th></tr></thead>
      <tbody>
        <?php if (!$deposits): ?><tr><td colspan="9" class="text-center text-muted py-4">No deposits found.</td></tr><?php endif; ?>
        <?php foreach ($deposits as $d): ?>
          <tr>
            <td><?= e($d['id']) ?></td>
            <td class="small"><a href="<?= e(url('admin/users.php?id=' . $d['user_id'])) ?>"><?= e(mask_address($d['wallet_address'])) ?></a></td>
            <td><span class="badge bg-secondary"><?= e($d['purpose']) ?><?= $d['purpose']==='hashrate' ? ' ('.ghs($d['ghs_amount']).' GH/s)' : '' ?></span></td>
            <td><?= doge($d['amount_doge']) ?></td>
            <td class="small"><?= e($d['pay_currency']) ?></td>
            <td class="small text-truncate" style="max-width:120px;"><?= e($d['txn_id']) ?></td>
            <td><span class="badge bg-<?= ['pending'=>'warning','completed'=>'success','cancelled'=>'danger'][$d['status']] ?? 'secondary' ?>"><?= e($d['status']) ?></span></td>
            <td class="small"><?= e(fmt_date($d['created_at'])) ?></td>
            <td>
              <?php if ($d['status'] === 'pending'): ?>
                <form method="post" class="d-inline"><?= csrf_field() ?>
                  <input type="hidden" name="action" value="mark_completed"><input type="hidden" name="deposit_id" value="<?= e($d['id']) ?>">
                  <button class="btn btn-sm btn-success" title="Mark completed"><i class="fa-solid fa-check"></i></button>
                </form>
                <form method="post" class="d-inline"><?= csrf_field() ?>
                  <input type="hidden" name="action" value="cancel"><input type="hidden" name="deposit_id" value="<?= e($d['id']) ?>">
                  <button class="btn btn-sm btn-outline-danger" title="Cancel"><i class="fa-solid fa-xmark"></i></button>
                </form>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
