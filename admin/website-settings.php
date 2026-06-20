<?php
require_once __DIR__ . '/includes/admin_auth.php';

$uploadDir = dirname(__DIR__) . '/uploads/';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();

    foreach (['site_name', 'contact_email', 'footer_text', 'terms_text', 'privacy_text'] as $k) {
        if (isset($_POST[$k])) {
            set_setting($k, clean($_POST[$k]));
        }
    }

    // Handle logo / favicon uploads.
    foreach (['site_logo' => 'logo', 'site_favicon' => 'favicon'] as $settingKey => $prefix) {
        if (!empty($_FILES[$settingKey]['name']) && $_FILES[$settingKey]['error'] === UPLOAD_ERR_OK) {
            $tmp  = $_FILES[$settingKey]['tmp_name'];
            $ext  = strtolower(pathinfo($_FILES[$settingKey]['name'], PATHINFO_EXTENSION));
            $allowed = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'];
            if (in_array($ext, $allowed, true)) {
                if (!is_dir($uploadDir)) { @mkdir($uploadDir, 0755, true); }
                $filename = $prefix . '_' . time() . '.' . $ext;
                if (move_uploaded_file($tmp, $uploadDir . $filename)) {
                    set_setting($settingKey, $filename);
                }
            } else {
                flash('error', 'Invalid file type for ' . $prefix . '.');
            }
        }
    }

    flash('success', 'Website settings updated.');
    redirect('admin/website-settings.php');
}

$pageTitle = 'Website Settings';
$activeNav = 'website';
include __DIR__ . '/includes/header.php';
?>
<div class="card metric-card p-4">
  <form method="post" enctype="multipart/form-data"><?= csrf_field() ?>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Website Name</label>
        <input type="text" name="site_name" class="form-control" value="<?= e(setting('site_name', 'DogeHash')) ?>">
      </div>
      <div class="col-md-6">
        <label class="form-label">Contact Email</label>
        <input type="email" name="contact_email" class="form-control" value="<?= e(setting('contact_email')) ?>">
      </div>
      <div class="col-md-6">
        <label class="form-label">Logo <?php if (setting('site_logo')): ?><img src="<?= e(url('uploads/' . setting('site_logo'))) ?>" height="22" class="ms-2"><?php endif; ?></label>
        <input type="file" name="site_logo" class="form-control" accept="image/*">
      </div>
      <div class="col-md-6">
        <label class="form-label">Favicon <?php if (setting('site_favicon')): ?><img src="<?= e(url('uploads/' . setting('site_favicon'))) ?>" height="22" class="ms-2"><?php endif; ?></label>
        <input type="file" name="site_favicon" class="form-control" accept="image/*">
      </div>
      <div class="col-12">
        <label class="form-label">Footer Text</label>
        <input type="text" name="footer_text" class="form-control" value="<?= e(setting('footer_text')) ?>">
      </div>
      <div class="col-md-6">
        <label class="form-label">Terms of Service</label>
        <textarea name="terms_text" class="form-control" rows="6"><?= e(setting('terms_text')) ?></textarea>
      </div>
      <div class="col-md-6">
        <label class="form-label">Privacy Policy</label>
        <textarea name="privacy_text" class="form-control" rows="6"><?= e(setting('privacy_text')) ?></textarea>
      </div>
    </div>
    <button class="btn btn-doge mt-4"><i class="fa-solid fa-floppy-disk"></i> Save Website Settings</button>
  </form>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
