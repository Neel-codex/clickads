<?php
if (!defined('DOGEHASH')) { exit; }
$siteName = setting('site_name', 'DogeHash');
?>
<footer class="site-footer mt-5">
  <div class="container">
    <div class="row gy-4">
      <div class="col-md-4">
        <h5 class="text-white"><i class="fa-solid fa-coins text-doge"></i> <?= e($siteName) ?></h5>
        <p class="small"><?= e(setting('footer_text', 'DogeHash Cloud Mining')) ?></p>
      </div>
      <div class="col-md-4">
        <h6 class="text-white">Quick Links</h6>
        <ul class="list-unstyled small">
          <li><a href="<?= e(url('index.php')) ?>#how">How It Works</a></li>
          <li><a href="<?= e(url('index.php')) ?>#calculator">Hashrate Calculator</a></li>
          <li><a href="<?= e(url('register.php')) ?>">Register</a></li>
          <li><a href="<?= e(url('login.php')) ?>">Login</a></li>
        </ul>
      </div>
      <div class="col-md-4">
        <h6 class="text-white">Legal & Contact</h6>
        <ul class="list-unstyled small">
          <li><a href="<?= e(url('terms.php')) ?>">Terms of Service</a></li>
          <li><a href="<?= e(url('privacy.php')) ?>">Privacy Policy</a></li>
          <li><i class="fa-solid fa-envelope text-doge"></i> <?= e(setting('contact_email', '')) ?></li>
        </ul>
      </div>
    </div>
    <hr class="border-secondary">
    <div class="text-center small">
      &copy; <?= date('Y') ?> <?= e($siteName) ?>. All rights reserved.
    </div>
  </div>
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?= e(url('assets/js/main.js')) ?>"></script>
</body>
</html>
