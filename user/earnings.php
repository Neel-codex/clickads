<?php
require_once __DIR__ . '/../includes/init.php';
require_login();

$u = current_user();

$filter = $_GET['type'] ?? 'all';
$search = clean($_GET['q'] ?? '');

$where  = ['user_id = ?'];
$params = [$u['id']];

$validTypes = ['deposit', 'withdrawal', 'mining_reward', 'referral_reward', 'hashrate_purchase', 'admin_credit', 'admin_debit'];
if (in_array($filter, $validTypes, true)) {
    $where[]  = 'type = ?';
    $params[] = $filter;
}
if ($search !== '') {
    $where[]  = 'description LIKE ?';
    $params[] = '%' . $search . '%';
}

$sql  = 'SELECT * FROM transactions WHERE ' . implode(' AND ', $where) . ' ORDER BY id DESC LIMIT 100';
$rows = db_all($sql, $params);

$typeLabels = [
    'deposit'           => ['Deposit', 'success'],
    'withdrawal'        => ['Withdrawal', 'danger'],
    'mining_reward'     => ['Mining', 'primary'],
    'referral_reward'   => ['Referral', 'warning'],
    'hashrate_purchase' => ['Hashrate', 'info'],
    'admin_credit'      => ['Admin Credit', 'success'],
    'admin_debit'       => ['Admin Debit', 'danger'],
];

$pageTitle = 'Earnings History';
$activeNav = 'earnings';
include __DIR__ . '/header.php';
?>
<div class="card metric-card p-4">
  <form method="get" class="row g-2 mb-3">
    <div class="col-md-4">
      <select name="type" class="form-select">
        <option value="all" <?= $filter === 'all' ? 'selected' : '' ?>>All Types</option>
        <?php foreach ($typeLabels as $key => $lbl): ?>
          <option value="<?= e($key) ?>" <?= $filter === $key ? 'selected' : '' ?>><?= e($lbl[0]) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="col-md-5">
      <input type="text" name="q" class="form-control" placeholder="Search description..." value="<?= e($search) ?>">
    </div>
    <div class="col-md-3">
      <button class="btn btn-doge w-100"><i class="fa-solid fa-magnifying-glass"></i> Filter</button>
    </div>
  </form>

  <div class="table-responsive">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-doge"><tr><th>Date</th><th>Type</th><th>Description</th><th>Status</th><th class="text-end">Amount</th></tr></thead>
      <tbody>
        <?php if (!$rows): ?>
          <tr><td colspan="5" class="text-center text-muted py-4">No transactions found.</td></tr>
        <?php else: foreach ($rows as $r):
          $lbl = $typeLabels[$r['type']] ?? [$r['type'], 'secondary'];
          $isCredit = $r['amount'] >= 0;
        ?>
          <tr>
            <td class="small"><?= e(fmt_date($r['created_at'])) ?></td>
            <td><span class="badge bg-<?= e($lbl[1]) ?>"><?= e($lbl[0]) ?></span></td>
            <td class="small"><?= e($r['description']) ?></td>
            <td><span class="badge bg-light text-dark text-capitalize"><?= e($r['status']) ?></span></td>
            <td class="text-end fw-semibold <?= $isCredit ? 'text-success' : 'text-danger' ?>">
              <?= $isCredit ? '+' : '' ?><?= doge($r['amount'], 8) ?>
            </td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>
<?php include __DIR__ . '/footer.php'; ?>
