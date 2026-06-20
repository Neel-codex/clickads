<?php
/**
 * DogeHash Cloud Mining Platform
 * Sample Configuration File
 *
 * 1. Copy this file to "config.php" in the same /config directory.
 * 2. Fill in your database credentials and site URL.
 * 3. Save and upload to your hosting.
 *
 * Most platform settings (prices, bonuses, CoinPayments keys, referral %)
 * are managed dynamically from the Admin Panel -> stored in the `settings` table.
 */

// ---------------------------------------------------------------------------
// DATABASE SETTINGS
// ---------------------------------------------------------------------------
define('DB_HOST', 'localhost');      // Usually "localhost" on cPanel
define('DB_NAME', 'your_database');  // e.g. cpaneluser_dogehash
define('DB_USER', 'your_db_user');   // e.g. cpaneluser_doge
define('DB_PASS', 'your_db_pass');   // Database user password
define('DB_CHARSET', 'utf8mb4');

// ---------------------------------------------------------------------------
// SITE SETTINGS
// ---------------------------------------------------------------------------
// Full base URL WITHOUT trailing slash, e.g. https://example.com or
// https://example.com/dogehash if installed in a sub-folder.
define('SITE_URL', 'https://yourdomain.com');

// Security salt used for hashing remember-me tokens and CSRF. Change this to a
// long random string before going live.
define('APP_KEY', 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_STRING');

// Timezone for all date/time values.
define('APP_TIMEZONE', 'UTC');

// Set to true while developing to display PHP errors. Set false in production.
define('APP_DEBUG', false);
