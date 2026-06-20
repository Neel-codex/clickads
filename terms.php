<?php
require_once __DIR__ . '/includes/init.php';
$pageTitle = 'Terms of Service';
include __DIR__ . '/includes/header.php';
?>
<section class="section">
  <div class="container">
    <h1 class="section-title">Terms of Service</h1>
    <div class="card crypto-card p-4">
      <p style="white-space: pre-line;"><?= e(setting('terms_text', '')) ?></p>
    </div>
  </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>
