<?php
/**
 * AJAX: Returns the current mining status for the logged-in user.
 * Called periodically by the dashboard to sync the live balance.
 */
require_once __DIR__ . '/../includes/init.php';

if (!is_logged_in()) {
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);
}

$u = current_user();

// Accrue any pending mining rewards.
accrue_user_mining($u);
$u = refresh_user();

json_response([
    'success'             => true,
    'balance'             => (float) $u['balance'],
    'balance_formatted'   => doge($u['balance'], 8),
    'daily'               => estimated_daily_earnings($u),
    'hashrate'            => effective_hashrate($u),
    'hashrate_formatted'  => ghs(effective_hashrate($u)),
    'total_earnings'      => (float) $u['total_earnings'],
    'in_bonus'            => in_bonus_period($u),
    'mining_enabled'      => mining_enabled(),
]);
