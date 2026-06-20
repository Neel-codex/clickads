<?php
/**
 * User dashboard layout header.
 * Expects: $pageTitle, $activeNav (e.g. 'dashboard','mining','buy','referrals','profile','earnings','withdraw')
 */
if (!defined('DOGEHASH')) { exit; }

$siteName = setting('site_name', 'DogeHash');
$u        = current_user();
$active   = $activeNav ?? '';

$nav = [
    'dashboard' => ['dashboard.php', 'fa-gauge-high', 'Dashboard'],
    'mining'    => ['mining.php',    'fa-microchip',  'Live Mining'],
    'buy'       => ['buy.php',       'fa-cart-shopping', 'Buy Hashrate'],
    'earnings'  => ['earnings.php',  'fa-clock-rotate-left', 'History'],
    'referrals' => ['referrals.php', 'fa-user-group', 'Referrals'],
    'withdraw'  => ['withdraw.php',  'fa-money-bill-transfer', 'Withdraw'],
    'profile'   => ['profile.php',   'fa-user', 'Profile'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e(($pageTitle ?? 'Dashboard') . ' - ' . $siteName) ?></title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet">
  <link href="<?= e(url('assets/css/style.css')) ?>" rel="stylesheet">
</head>
<body class="bg-light has-mobile-nav" data-base="<?= e(rtrim(SITE_URL, '/')) ?>">
<div class="container-fluid">
  <div class="row">
    <!-- Sidebar (desktop) -->
    <aside class="col-lg-2 d-none d-lg-block p-0 dash-sidebar">
      <div class="p-3 text-center border-bottom border-secondary">
        <a href="<?= e(url('index.php')) ?>" class="navbar-brand text-white">
          <i class="fa-solid fa-coins text-doge"></i> <?= e($siteName) ?>
        </a>
      </div>
      <ul class="nav flex-column py-3">
        <?php foreach ($nav as $key => $item): ?>
          <li class="nav-item">
            <a class="nav-link <?= $active === $key ? 'active' : '' ?>" href="<?= e(url('user/' . $item[0])) ?>">
              <i class="fa-solid <?= e($item[1]) ?>"></i> <?= e($item[2]) ?>
            </a>
          </li>
        <?php endforeach; ?>
        <li class="nav-item mt-3">
          <a class="nav-link text-danger" href="<?= e(url('logout.php')) ?>">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </a>
        </li>
      </ul>
    </aside>

    <!-- Main content -->
    <main class="col-lg-10 ms-auto p-3 p-lg-4">
      <!-- Top bar -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="mb-0"><?= e($pageTitle ?? 'Dashboard') ?></h4>
          <small class="text-muted"><?= e(mask_address($u['wallet_address'])) ?></small>
        </div>
        <div class="text-end">
          <div class="small text-muted">Balance</div>
          <div class="fw-bold text-doge"><?= doge($u['balance']) ?> DOGE</div>
        </div>
      </div>
      <?= render_flashes() ?>
