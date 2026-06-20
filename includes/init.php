<?php
/**
 * Application bootstrap.
 * Include this at the very top of every public-facing PHP entry point:
 *   require_once __DIR__ . '/includes/init.php';
 */

// Resolve base directory regardless of the including file's location.
$baseDir = dirname(__DIR__);

require_once $baseDir . '/config/config.php';

// Error reporting based on debug flag.
if (defined('APP_DEBUG') && APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

// Timezone.
date_default_timezone_set(defined('APP_TIMEZONE') ? APP_TIMEZONE : 'UTC');

// Secure session settings.
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_strict_mode', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('DOGEHASHSESS');
    session_start();
}

// Core includes.
require_once $baseDir . '/includes/db.php';
require_once $baseDir . '/includes/functions.php';
require_once $baseDir . '/includes/settings.php';
require_once $baseDir . '/includes/mining.php';
require_once $baseDir . '/includes/auth.php';
require_once $baseDir . '/includes/coinpayments.php';

// Try remember-me auto login for users.
attempt_remember_login();
