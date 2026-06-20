<?php
require_once __DIR__ . '/includes/admin_auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $keys = [
        'ghs_per_doge', 'daily_earning_per_ghs', 'mining_multiplier',
        'bonus_ghs', 'bonus_days', 'daily_bonus_reward',
    ];
    foreach ($keys as $k) {
        if (isset($_POST[$k])) {
            set_setting($k, (float) $_POST[$k]);
        }
    }
    set_setting('mining_enabled', isset($_POST['mining_enabled']) ? '1' : '0');
    flash('success', 'Mining settings updated.');
    redirect('admin/mining-settings.php');
}

$pageTitle = 'Mining Settings';
$activeNav = 'mining';
include __DIR__ . '/includes/header.php';
?>
<div class="row">
  <div class="col-lg-8">
    <div class="card metric-card p-4">
      <form method="post"><?= csrf_field() ?>
        <h6 class="mb-3"><i class="fa-solid fa-microchip text-doge"></i> Hashrate Formula</h6>
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label">GH/s per 1 DOGE</label>
            <input type="number" step="0.0001" name="ghs_per_doge" class="form-control" value="<?= e(setting('ghs_per_doge', 100)) ?>">
            <div class="form-text">100 = "100 GH/s = 1 DOGE". Change to 150, 200, etc.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Daily Earning per GH/s (DOGE)</label>
            <input type="number" step="0.00000001" name="daily_earning_per_ghs" class="form-control" value="<?= e(setting('daily_earning_per_ghs', 0.0008)) ?>">
            <div class="form-text">Daily DOGE earned per purchased GH/s.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Mining Multiplier</label>
            <input type="number" step="0.01" name="mining_multiplier" class="form-control" value="<?= e(setting('mining_multiplier', 1)) ?>">
            <div class="form-text">Global earnings multiplier (1 = normal).</div>
          </div>
        </div>

        <h6 class="mb-3"><i class="fa-solid fa-gift text-doge"></i> Welcome Bonus</h6>
        <div class="row g-3 mb-4">
          <div class="col-md-4">
            <label class="form-label">Bonus GH/s</label>
            <input type="number" step="0.01" name="bonus_ghs" class="form-control" value="<?= e(setting('bonus_ghs', 100)) ?>">
          </div>
          <div class="col-md-4">
            <label class="form-label">Bonus Duration (days)</label>
            <input type="number" name="bonus_days" class="form-control" value="<?= e(setting('bonus_days', 10)) ?>">
          </div>
          <div class="col-md-4">
            <label class="form-label">Daily Bonus Reward (DOGE)</label>
            <input type="number" step="0.0001" name="daily_bonus_reward" class="form-control" value="<?= e(setting('daily_bonus_reward', 1)) ?>">
          </div>
        </div>

        <div class="form-check form-switch mb-4">
          <input class="form-check-input" type="checkbox" name="mining_enabled" id="mining_enabled" <?= mining_enabled() ? 'checked' : '' ?>>
          <label class="form-check-label" for="mining_enabled">Mining Enabled (global)</label>
        </div>

        <button class="btn btn-doge"><i class="fa-solid fa-floppy-disk"></i> Save Settings</button>
      </form>
    </div>
  </div>
  <div class="col-lg-4">
    <div class="card metric-card p-4">
      <h6><i class="fa-solid fa-circle-info text-doge"></i> Current Formula</h6>
      <p class="mb-1"><strong><?= e(setting('ghs_per_doge', 100)) ?> GH/s = 1 DOGE</strong></p>
      <p class="small text-muted">New users get <?= e(setting('bonus_ghs',100)) ?> GH/s for <?= e(setting('bonus_days',10)) ?> days,
      earning <?= e(setting('daily_bonus_reward',1)) ?> DOGE/day during bonus.</p>
    </div>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
