<?php
require_once __DIR__ . '/includes/admin_auth.php';

// ---- Handle actions ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = $_POST['action'] ?? '';
    $userId = (int) ($_POST['user_id'] ?? 0);
    $user   = db_row('SELECT * FROM users WHERE id = ?', [$userId]);

    if (!$user) {
        flash('error', 'User not found.');
        redirect('admin/users.php');
    }

    switch ($action) {
        case 'suspend':
            db_query('UPDATE users SET status = 0 WHERE id = ?', [$userId]);
            flash('success', 'User suspended.');
            break;
        case 'activate':
            db_query('UPDATE users SET status = 1 WHERE id = ?', [$userId]);
            flash('success', 'User activated.');
            break;
        case 'delete':
            db_query('DELETE FROM users WHERE id = ?', [$userId]);
            flash('success', 'User deleted.');
            redirect('admin/users.php');
            break;
        case 'add_balance':
            $amt = (float) ($_POST['amount'] ?? 0);
            db_query('UPDATE users SET balance = balance + ? WHERE id = ?', [$amt, $userId]);
            record_transaction($userId, 'admin_credit', $amt, 'Balance added by admin');
            flash('success', 'Added ' . doge($amt) . ' DOGE to balance.');
            break;
        case 'remove_balance':
            $amt = (float) ($_POST['amount'] ?? 0);
            db_query('UPDATE users SET balance = GREATEST(0, balance - ?) WHERE id = ?', [$amt, $userId]);
            record_transaction($userId, 'admin_debit', -$amt, 'Balance removed by admin');
            flash('success', 'Removed ' . doge($amt) . ' DOGE from balance.');
            break;
        case 'add_ghs':
            $g = (float) ($_POST['amount'] ?? 0);
            db_query('UPDATE users SET purchased_ghs = purchased_ghs + ? WHERE id = ?', [$g, $userId]);
            flash('success', 'Added ' . ghs($g) . ' GH/s.');
            break;
        case 'remove_ghs':
            $g = (float) ($_POST['amount'] ?? 0);
            db_query('UPDATE users SET purchased_ghs = GREATEST(0, purchased_ghs - ?) WHERE id = ?', [$g, $userId]);
            flash('success', 'Removed ' . ghs($g) . ' GH/s.');
            break;
    }
    activity_log(null, 'admin_user_action', $action . ' on user #' . $userId);
    redirect('admin/users.php?id=' . $userId);
}

$viewId = (int) ($_GET['id'] ?? 0);

$pageTitle = 'User Management';
$activeNav = 'users';
include __DIR__ . '/includes/header.php';

if ($viewId):
    // ---- Single user detail view ----
    $user = db_row('SELECT * FROM users WHERE id = ?', [$viewId]);
    if (!$user) {
        echo '<div class="alert alert-danger">User not found.</div>';
        include __DIR__ . '/includes/footer.php';
        exit;
    }
    $txns  = db_all('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 20', [$viewId]);
?>
  <a href="<?= e(url('admin/users.php')) ?>" class="btn btn-sm btn-outline-secondary mb-3"><i class="fa-solid fa-arrow-left"></i> Back to Users</a>
  <div class="row g-4">
    <div class="col-lg-5">
      <div class="card metric-card p-4">
        <h6 class="mb-3"><i class="fa-solid fa-user text-doge"></i> User #<?= e($user['id']) ?></h6>
        <table class="table table-sm">
          <tr><td class="text-muted">Wallet</td><td class="text-end small"><?= e($user['wallet_address']) ?></td></tr>
          <tr><td class="text-muted">Referral Code</td><td class="text-end"><?= e($user['referral_code']) ?></td></tr>
          <tr><td class="text-muted">Status</td><td class="text-end">
            <span class="badge bg-<?= $user['status'] ? 'success' : 'danger' ?>"><?= $user['status'] ? 'Active' : 'Suspended' ?></span></td></tr>
          <tr><td class="text-muted">Bonus GH/s</td><td class="text-end"><?= ghs($user['bonus_ghs']) ?></td></tr>
          <tr><td class="text-muted">Purchased GH/s</td><td class="text-end"><?= ghs($user['purchased_ghs']) ?></td></tr>
          <tr><td class="text-muted">Balance</td><td class="text-end fw-bold text-doge"><?= doge($user['balance']) ?></td></tr>
          <tr><td class="text-muted">Total Earned</td><td class="text-end"><?= doge($user['total_earnings']) ?></td></tr>
          <tr><td class="text-muted">Total Withdrawn</td><td class="text-end"><?= doge($user['total_withdrawn']) ?></td></tr>
          <tr><td class="text-muted">Bonus Expires</td><td class="text-end small"><?= e(fmt_date($user['bonus_expires_at'])) ?></td></tr>
          <tr><td class="text-muted">Joined</td><td class="text-end small"><?= e(fmt_date($user['created_at'])) ?></td></tr>
        </table>
        <div class="d-flex gap-2">
          <?php if ($user['status']): ?>
            <form method="post" class="flex-fill"><?= csrf_field() ?>
              <input type="hidden" name="action" value="suspend"><input type="hidden" name="user_id" value="<?= e($user['id']) ?>">
              <button class="btn btn-warning w-100 btn-sm"><i class="fa-solid fa-ban"></i> Suspend</button>
            </form>
          <?php else: ?>
            <form method="post" class="flex-fill"><?= csrf_field() ?>
              <input type="hidden" name="action" value="activate"><input type="hidden" name="user_id" value="<?= e($user['id']) ?>">
              <button class="btn btn-success w-100 btn-sm"><i class="fa-solid fa-check"></i> Activate</button>
            </form>
          <?php endif; ?>
          <form method="post" class="flex-fill" onsubmit="return confirm('Delete this user permanently?');"><?= csrf_field() ?>
            <input type="hidden" name="action" value="delete"><input type="hidden" name="user_id" value="<?= e($user['id']) ?>">
            <button class="btn btn-danger w-100 btn-sm"><i class="fa-solid fa-trash"></i> Delete</button>
          </form>
        </div>
      </div>
    </div>

    <div class="col-lg-7">
      <div class="card metric-card p-4 mb-4">
        <h6 class="mb-3"><i class="fa-solid fa-sliders text-doge"></i> Adjust Balance & Hashrate</h6>
        <div class="row g-3">
          <?php
          $adjusters = [
            ['add_balance', 'Add Balance (DOGE)', 'success', 'fa-plus'],
            ['remove_balance', 'Remove Balance (DOGE)', 'danger', 'fa-minus'],
            ['add_ghs', 'Add Hashrate (GH/s)', 'success', 'fa-plus'],
            ['remove_ghs', 'Remove Hashrate (GH/s)', 'danger', 'fa-minus'],
          ];
          foreach ($adjusters as $a): ?>
            <div class="col-md-6">
              <form method="post" class="input-group input-group-sm"><?= csrf_field() ?>
                <input type="hidden" name="action" value="<?= e($a[0]) ?>">
                <input type="hidden" name="user_id" value="<?= e($user['id']) ?>">
                <input type="number" step="0.00000001" min="0" name="amount" class="form-control" placeholder="<?= e($a[1]) ?>" required>
                <button class="btn btn-<?= e($a[2]) ?>"><i class="fa-solid <?= e($a[3]) ?>"></i></button>
              </form>
              <div class="form-text"><?= e($a[1]) ?></div>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

      <div class="card metric-card p-4">
        <h6 class="mb-3"><i class="fa-solid fa-list text-doge"></i> Recent Transactions</h6>
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <thead class="table-doge"><tr><th>Date</th><th>Type</th><th class="text-end">Amount</th></tr></thead>
            <tbody>
              <?php if (!$txns): ?><tr><td colspan="3" class="text-muted text-center">No transactions.</td></tr><?php endif; ?>
              <?php foreach ($txns as $t): ?>
                <tr><td class="small"><?= e(fmt_date($t['created_at'])) ?></td>
                  <td class="small"><?= e($t['type']) ?></td>
                  <td class="text-end <?= $t['amount']>=0?'text-success':'text-danger' ?>"><?= doge($t['amount'],8) ?></td></tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
<?php
else:
    // ---- User list with search ----
    $search = clean($_GET['q'] ?? '');
    $params = [];
    $sql = 'SELECT * FROM users';
    if ($search !== '') {
        $sql .= ' WHERE wallet_address LIKE ? OR referral_code LIKE ?';
        $params = ['%' . $search . '%', '%' . $search . '%'];
    }
    $sql .= ' ORDER BY id DESC LIMIT 200';
    $users = db_all($sql, $params);
?>
  <div class="card metric-card p-4">
    <form method="get" class="row g-2 mb-3">
      <div class="col-md-9"><input type="text" name="q" class="form-control" placeholder="Search by wallet or referral code..." value="<?= e($search) ?>"></div>
      <div class="col-md-3"><button class="btn btn-doge w-100"><i class="fa-solid fa-magnifying-glass"></i> Search</button></div>
    </form>
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-doge"><tr><th>ID</th><th>Wallet</th><th>GH/s</th><th>Balance</th><th>Status</th><th>Joined</th><th></th></tr></thead>
        <tbody>
          <?php if (!$users): ?><tr><td colspan="7" class="text-center text-muted py-4">No users found.</td></tr><?php endif; ?>
          <?php foreach ($users as $usr): ?>
            <tr>
              <td><?= e($usr['id']) ?></td>
              <td class="small"><?= e(mask_address($usr['wallet_address'])) ?></td>
              <td><?= ghs($usr['bonus_ghs'] + $usr['purchased_ghs']) ?></td>
              <td><?= doge($usr['balance']) ?></td>
              <td><span class="badge bg-<?= $usr['status']?'success':'danger' ?>"><?= $usr['status']?'Active':'Suspended' ?></span></td>
              <td class="small"><?= e(fmt_date($usr['created_at'], 'M d, Y')) ?></td>
              <td><a href="<?= e(url('admin/users.php?id=' . $usr['id'])) ?>" class="btn btn-sm btn-outline-doge"><i class="fa-solid fa-eye"></i></a></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
<?php endif; ?>
<?php include __DIR__ . '/includes/footer.php'; ?>
