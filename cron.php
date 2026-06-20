<?php
/**
 * Mining cron job.
 *
 * Run this periodically (e.g. every 5-10 minutes) via a cPanel Cron Job:
 *   php /home/USER/public_html/cron.php
 * or via wget/curl with a secret token:
 *   curl "https://yourdomain.com/cron.php?token=YOUR_SECRET"
 *
 * It accrues mining rewards for all active users and expires bonus periods.
 *
 * SECURITY: When run over HTTP, a token is required. Set the "cron_token"
 * setting in the admin panel (or below) to enable HTTP triggering.
 */
require_once __DIR__ . '/includes/init.php';

$isCli = (php_sapi_name() === 'cli');

if (!$isCli) {
    $token   = $_GET['token'] ?? '';
    $expected = setting('cron_token', '');
    if (!$expected || !hash_equals($expected, $token)) {
        http_response_code(403);
        die('Forbidden: invalid cron token.');
    }
}

$start = microtime(true);

// Accrue mining rewards for all active users.
$summary = accrue_all_users();

$elapsed = round(microtime(true) - $start, 3);

$message = sprintf(
    "[%s] Mining cron complete. Users credited: %d, Total DOGE: %s, Time: %ss\n",
    date('Y-m-d H:i:s'),
    $summary['users_credited'],
    number_format($summary['total_doge'], 8),
    $elapsed
);

activity_log(null, 'cron_run', trim($message));

if ($isCli) {
    echo $message;
} else {
    header('Content-Type: text/plain');
    echo $message;
}
