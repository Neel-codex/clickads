<?php
/**
 * Public site header / navbar.
 * Expects $pageTitle to optionally be set before inclusion.
 */
if (!defined('DOGEHASH')) { exit; }

$siteName = setting('site_name', 'DogeHash');
$title    = isset($pageTitle) ? ($pageTitle . ' - ' . $siteName) : $siteName;
$logo     = setting('site_logo');
$favicon  = setting('site_favicon');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title) ?></title>
    <?php if ($favicon): ?>
        <link rel="icon" href="<?= e(url('uploads/' . $favicon)) ?>">
    <?php endif; ?>
    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet">
    <link href="<?= e(url('assets/css/style.css')) ?>" rel="stylesheet">
</head>
<body data-base="<?= e(rtrim(SITE_URL, '/')) ?>">
<nav class="navbar navbar-expand-lg navbar-dark bg-doge-dark sticky-top">
  <div class="container">
    <a class="navbar-brand" href="<?= e(url('index.php')) ?>">
      <?php if ($logo): ?>
        <img src="<?= e(url('uploads/' . $logo)) ?>" alt="<?= e($siteName) ?>" height="32">
      <?php else: ?>
        <i class="fa-solid fa-coins text-doge"></i> <?= e($siteName) ?>
      <?php endif; ?>
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="mainNav">
      <ul class="navbar-nav ms-auto align-items-lg-center">
        <li class="nav-item"><a class="nav-link" href="<?= e(url('index.php')) ?>#how">How It Works</a></li>
        <li class="nav-item"><a class="nav-link" href="<?= e(url('index.php')) ?>#calculator">Calculator</a></li>
        <li class="nav-item"><a class="nav-link" href="<?= e(url('index.php')) ?>#features">Features</a></li>
        <?php if (is_logged_in()): ?>
          <li class="nav-item"><a class="nav-link" href="<?= e(url('user/dashboard.php')) ?>">Dashboard</a></li>
          <li class="nav-item ms-lg-2"><a class="btn btn-outline-doge btn-sm" href="<?= e(url('logout.php')) ?>">Logout</a></li>
        <?php else: ?>
          <li class="nav-item"><a class="nav-link" href="<?= e(url('login.php')) ?>">Login</a></li>
          <li class="nav-item ms-lg-2"><a class="btn btn-doge btn-sm" href="<?= e(url('register.php')) ?>">Start Mining</a></li>
        <?php endif; ?>
      </ul>
    </div>
  </div>
</nav>
<?php if ($flashes = render_flashes()): ?>
  <div class="container mt-3"><?= $flashes ?></div>
<?php endif; ?>
