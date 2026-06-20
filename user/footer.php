<?php
if (!defined('DOGEHASH')) { exit; }
$active = $activeNav ?? '';
$mnav = [
    'dashboard' => ['dashboard.php', 'fa-house', 'Home'],
    'mining'    => ['mining.php',    'fa-microchip', 'Mining'],
    'buy'       => ['buy.php',       'fa-cart-shopping', 'Buy GH/s'],
    'referrals' => ['referrals.php', 'fa-user-group', 'Referrals'],
    'profile'   => ['profile.php',   'fa-user', 'Profile'],
];
?>
    </main>
  </div>
</div>

<!-- Mobile bottom navigation -->
<nav class="mobile-nav">
  <?php foreach ($mnav as $key => $item): ?>
    <a href="<?= e(url('user/' . $item[0])) ?>" class="<?= $active === $key ? 'active' : '' ?>">
      <i class="fa-solid <?= e($item[1]) ?>"></i><?= e($item[2]) ?>
    </a>
  <?php endforeach; ?>
</nav>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?= e(url('assets/js/main.js')) ?>"></script>
</body>
</html>
