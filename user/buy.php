<?php
require_once __DIR__ . '/../includes/init.php';
require_login();

$u       = current_user();
$perDoge = ghs_per_doge();

// Pending hashrate deposits.
$pending = db_all(
    "SELECT * FROM deposits WHERE user_id = ? AND purpose = 'hashrate' AND status = 'pending' ORDER BY id DESC LIMIT 5",
    [$u['id']]
);

$pageTitle = 'Buy Hashrate';
$activeNav = 'buy';
include __DIR__ . '/header.php';
?>
<div class="row g-4">
  <div class="col-lg-6">
    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-cart-shopping text-doge"></i> Purchase Hashrate</h6>
      <p class="text-muted small">Buy any amount of GH/s. Formula: <strong><?= e($perDoge) ?> GH/s = 1 DOGE</strong>.</p>

      <label class="form-label">Desired Hashrate (GH/s)</label>
      <input type="number" id="buyGhs" class="form-control form-control-lg mb-3"
             value="1000" min="<?= e($perDoge) ?>" step="1" data-per-doge="<?= e($perDoge) ?>">

      <div class="d-flex justify-content-between bg-light rounded p-3 mb-3">
        <span class="text-muted">Total Cost</span>
        <span class="fw-bold text-doge fs-5"><span id="buyCost">10.0000</span> DOGE</span>
      </div>

      <form method="post" action="<?= e(url('ajax/buy-hashrate.php')) ?>" id="buyForm">
        <?= csrf_field() ?>
        <input type="hidden" name="ghs" id="buyGhsHidden">
        <label class="form-label small">Pay With</label>
        <select name="currency" class="form-select mb-3">
          <option value="DOGE">Dogecoin (DOGE)</option>
          <option value="LTC">Litecoin (LTC)</option>
          <option value="BTC">Bitcoin (BTC)</option>
          <option value="USDT.TRC20">Tether (USDT TRC20)</option>
        </select>
        <button type="submit" class="btn btn-doge w-100 btn-lg">
          <i class="fa-solid fa-bolt"></i> Buy Hashrate
        </button>
      </form>
      <p class="small text-muted mt-3 mb-0">
        <i class="fa-solid fa-shield-halved"></i> You will be redirected to CoinPayments to complete payment.
        Hashrate is added automatically once payment is confirmed.
      </p>
    </div>
  </div>

  <div class="col-lg-6">
    <div class="card metric-card p-4 mb-4">
      <h6 class="mb-3"><i class="fa-solid fa-calculator text-doge"></i> Quick Reference</h6>
      <table class="table table-sm mb-0">
        <thead class="table-doge"><tr><th>Hashrate</th><th class="text-end">Cost</th></tr></thead>
        <tbody>
          <?php foreach ([1, 5, 10, 50, 100] as $d): ?>
            <tr><td><?= ghs($perDoge * $d) ?> GH/s</td><td class="text-end"><?= $d ?> DOGE</td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <div class="card metric-card p-4">
      <h6 class="mb-3"><i class="fa-solid fa-hourglass-half text-doge"></i> Pending Purchases</h6>
      <?php if (!$pending): ?>
        <p class="text-muted small mb-0">No pending hashrate purchases.</p>
      <?php else: foreach ($pending as $p): ?>
        <div class="d-flex justify-content-between border-bottom py-2 small">
          <span><?= ghs($p['ghs_amount']) ?> GH/s</span>
          <span><?= doge($p['amount_doge']) ?> DOGE</span>
          <a href="<?= e($p['checkout_url']) ?>" target="_blank" class="text-doge">Pay <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        </div>
      <?php endforeach; endif; ?>
    </div>
  </div>
</div>

<script>
// Sync hidden GH/s field on submit.
document.getElementById('buyForm').addEventListener('submit', function () {
  document.getElementById('buyGhsHidden').value = document.getElementById('buyGhs').value;
});
</script>
<?php include __DIR__ . '/footer.php'; ?>
