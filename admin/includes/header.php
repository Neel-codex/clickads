<?php
/**
 * Admin layout header. Expects $pageTitle and $activeNav.
 */
if (!defined('DOGEHASH')) { exit; }
$siteName = setting('site_name', 'DogeHash');
$admin    = current_admin();
$active   = $activeNav ?? '';

$nav = [
    'dashboard'  => ['dashboard.php',        'fa-gauge-high', 'Dashboard'],
    'users'      => ['users.php',            'fa-users', 'Users'],
    'deposits'   => ['deposits.php',         'fa-arrow-down', 'Deposits'],
    'withdrawals'=> ['withdrawals.php',      'fa-arrow-up', 'Withdrawals'],
    'mining'     => ['mining-settings.php',  'fa-microchip', 'Mining Settings'],
    'referral'   => ['referral-settings.php','fa-user-group', 'Referral Settings'],
    'coinpayments'=>['coinpayments.php',     'fa-wallet', 'CoinPayments'],
    'website'    => ['website-settings.php', 'fa-globe', 'Website Settings'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e(($pageTitle ?? 'Admin') . ' - ' . $siteName . ' Admin') ?></title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet">
  <link href="<?= e(url('assets/css/style.css')) ?>" rel="stylesheet">
</head>
<body class="bg-light" data-base="<?= e(rtrim(SITE_URL, '/')) ?>">
<div class="container-fluid">
  <div class="row">
    <aside class="col-lg-2 d-none d-lg-block p-0 dash-sidebar">
      <div class="p-3 text-center border-bottom border-secondary">
        <span class="navbar-brand text-white">
          <i class="fa-solid fa-coins text-doge"></i> <?= e($siteName) ?>
        </span>
        <div class="small text-secondary">Admin Panel</div>
      </div>
      <ul class="nav flex-column py-3">
        <?php foreach ($nav as $key => $item): ?>
          <li class="nav-item">
            <a class="nav-link <?= $active === $key ? 'active' : '' ?>" href="<?= e(url('admin/' . $item[0])) ?>">
              <i class="fa-solid <?= e($item[1]) ?>"></i> <?= e($item[2]) ?>
            </a>
          </li>
        <?php endforeach; ?>
        <li class="nav-item mt-3">
          <a class="nav-link text-danger" href="<?= e(url('admin/logout.php')) ?>">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </a>
        </li>
      </ul>
    </aside>

    <main class="col-lg-10 ms-auto p-3 p-lg-4">
      <!-- Mobile top nav -->
      <nav class="navbar navbar-dark bg-doge-dark rounded mb-3 d-lg-none">
        <div class="container-fluid">
          <span class="navbar-brand"><i class="fa-solid fa-coins text-doge"></i> Admin</span>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
            <span class="navbar-toggler-icon"></span>
          </button>
        </div>
        <div class="collapse w-100" id="adminNav">
          <ul class="nav flex-column p-2">
            <?php foreach ($nav as $key => $item): ?>
              <li><a class="nav-link text-white" href="<?= e(url('admin/' . $item[0])) ?>"><i class="fa-solid <?= e($item[1]) ?>"></i> <?= e($item[2]) ?></a></li>
            <?php endforeach; ?>
            <li><a class="nav-link text-danger" href="<?= e(url('admin/logout.php')) ?>"><i class="fa-solid fa-right-from-bracket"></i> Logout</a></li>
          </ul>
        </div>
      </nav>

      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0"><?= e($pageTitle ?? 'Dashboard') ?></h4>
        <span class="text-muted small"><i class="fa-solid fa-user-shield text-doge"></i> <?= e($admin['username']) ?></span>
      </div>
      <?= render_flashes() ?>
