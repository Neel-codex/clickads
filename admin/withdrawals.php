<?php
require_once __DIR__ . '/includes/admin_auth.php';

// CSV export.
if (($_GET['export'] ?? '') === 'csv') {
    $rows = db_all('SELECT w.*, u.wallet_address AS user_wallet FROM withdrawals w JOIN users u ON u.id = w.user_id ORDER BY w.id DESC');
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="withdrawals.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['ID', 'User Wallet', 'Amount', 'Payout Address', 'Status', 'Requested', 'Processed']);
    foreach ($rows as $r) {
        fputcsv($out, [$r['id'], $r['user_wallet'], $r['amount'], $r['wallet_address'], $r['status'], $r['created_at'], $r['processed_at']]);
    }
    fclose($out);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = $_POST['action'] ?? '';
    $wid    = (int) ($_POST['withdrawal_id'] ?? 0);
    $note   = clean($_POST['note'] ?? '');
    $wd     = db_row('SELECT * FROM withdrawals WHERE id = ?', [$wid]);

    if ($wd && $wd['status'] === 'pending') {
        if ($action === 'approve') {
            db_query("UPDATE withdrawals SET status='approved', admin_note=?, processed_at=NOW() WHERE id=?", [$note, $wid]);
            db_query('UPDATE users SET total_withdrawn = total_withdrawn + ? WHERE id = ?', [$wd['amount'], $wd['user_id']]);
            // Mark the matching pending transaction completed.
            db_query("UPDATE transactions SET status='completed' WHERE user_id=? AND type='withdrawal' AND status='pending' ORDER BY id DESC LIMIT 1", [$wd['user_id']]);
            flash('success', 'Withdrawal approved.');
        } elseif ($action === 'reject') {
            // Refund balance to user.
            db_query('UPDATE users SET balance = balance + ? WHERE id = ?', [$wd['amount'], $wd['user_id']]);
            db_query("UPDATE withdrawals SET status='rejected', admin_note=?, processed_at=NOW() WHERE id=?", [$note, $wid]);
            db_query("UPDATE transactions SET status='rejected' WHERE user_id=? AND type='withdrawal' AND status='pending' ORDER BY id DESC LIMIT 1", [$wd['user_id']]);
            record_transaction($wd['user_id'], 'admin_credit', $wd['amount'], 'Withdrawal rejected - refund');
            flash('success', 'Withdrawal rejected and balance refunded.');
        }
        activity_log(null, 'admin_withdrawal', $action . ' withdrawal #' . $wid);
    }
    redirect('admin/withdrawals.php');
}

$status = $_GET['status'] ?? 'all';
$where  = '';
$params = [];
if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
    $where = 'WHERE w.status = ?';
    $params[] = $status;
}
$withdrawals = db_all(
    "SELECT w.*, u.wallet_address AS user_wallet FROM withdrawals w JOIN users u ON u.id = w.user_id $where ORDER BY w.id DESC LIMIT 200",
    $params
);

$pageTitle = 'Withdrawal Management';
$activeNav = 'withdrawals';
include __DIR__ . '/includes/header.php';
?>
<div class="card metric-card p-4">
  <div class="d-flex justify-content-between flex-wrap gap-2 mb-3">
    <div class="btn-group btn-group-sm">
      <?php foreach (['all'=>'All','pending'=>'Pending','approved'=>'Approved','rejected'=>'Rejected'] as $k=>$v): ?>
        <a href="?status=<?= e($k) ?>" class="btn btn-<?= $status===$k?'doge':'outline-secondary' ?>"><?= e($v) ?></a>
      <?php endforeach; ?>
    </div>
    <a href="?export=csv" class="btn btn-sm btn-outline-dark"><i class="fa-solid fa-file-csv"></i> Export CSV</a>
  </div>
  <div class="table-responsive">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-doge"><tr><th>ID</th><th>User</th><th>Amount</th><th>Payout Address</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
      <tbody>
        <?php if (!$withdrawals): ?><tr><td colspan="7" class="text-center text-muted py-4">No withdrawals found.</td></tr><?php endif; ?>
        <?php foreach ($withdrawals as $w): ?>
          <tr>
            <td><?= e($w['id']) ?></td>
            <td class="small"><a href="<?= e(url('admin/users.php?id=' . $w['user_id'])) ?>"><?= e(mask_address($w['user_wallet'])) ?></a></td>
            <td class="fw-semibold"><?= doge($w['amount']) ?> DOGE</td>
            <td class="small"><?= e($w['wallet_address']) ?></td>
            <td><span class="badge bg-<?= ['pending'=>'warning','approved'=>'success','rejected'=>'danger'][$w['status']] ?? 'secondary' ?>"><?= e($w['status']) ?></span></td>
            <td class="small"><?= e(fmt_date($w['created_at'])) ?></td>
            <td>
              <?php if ($w['status'] === 'pending'): ?>
                <div class="d-flex gap-1">
                  <form method="post"><?= csrf_field() ?>
                    <input type="hidden" name="action" value="approve"><input type="hidden" name="withdrawal_id" value="<?= e($w['id']) ?>">
                    <button class="btn btn-sm btn-success" onclick="return confirm('Approve this withdrawal? Make sure you have sent the DOGE.');"><i class="fa-solid fa-check"></i></button>
                  </form>
                  <form method="post"><?= csrf_field() ?>
                    <input type="hidden" name="action" value="reject"><input type="hidden" name="withdrawal_id" value="<?= e($w['id']) ?>">
                    <button class="btn btn-sm btn-outline-danger" onclick="return confirm('Reject and refund this withdrawal?');"><i class="fa-solid fa-xmark"></i></button>
                  </form>
                </div>
              <?php else: ?>
                <span class="small text-muted"><?= e($w['admin_note'] ?: '-') ?></span>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
