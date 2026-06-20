<?php
/**
 * Handle a hashrate purchase request.
 * Creates a CoinPayments invoice for the DOGE cost and redirects the user to
 * the checkout page. The hashrate is credited automatically by ipn.php once
 * the payment is confirmed.
 */
require_once __DIR__ . '/../includes/init.php';

if (!is_logged_in()) {
    redirect('login.php');
}
csrf_check();

$u       = current_user();
$ghs     = (float) ($_POST['ghs'] ?? 0);
$currency = clean($_POST['currency'] ?? 'DOGE');

$allowedCurrencies = ['DOGE', 'LTC', 'BTC', 'USDT.TRC20', 'USDT'];
if (!in_array($currency, $allowedCurrencies, true)) {
    $currency = 'DOGE';
}

if ($ghs < 1) {
    flash('error', 'Please enter a valid hashrate amount.');
    redirect('user/buy.php');
}

$cost = round(ghs_to_doge($ghs), 8);
if ($cost <= 0) {
    flash('error', 'Calculated cost is invalid.');
    redirect('user/buy.php');
}

if (!cp_configured()) {
    flash('error', 'Payments are not configured yet. Please contact support.');
    redirect('user/buy.php');
}

// Create a pending deposit record (purpose = hashrate).
db_query(
    "INSERT INTO deposits (user_id, amount_doge, pay_currency, purpose, ghs_amount, status, created_at)
     VALUES (?, ?, ?, 'hashrate', ?, 'pending', NOW())",
    [$u['id'], $cost, $currency, $ghs]
);
$depositId = db_insert_id();

// Create the CoinPayments transaction.
$result = cp_create_transaction($cost, $currency, $u['wallet_address'] . '@dogehash.local', [
    'item_name' => ghs($ghs) . ' GH/s Hashrate Purchase',
    'custom'    => json_encode(['deposit_id' => $depositId, 'user_id' => $u['id'], 'purpose' => 'hashrate', 'ghs' => $ghs]),
    'ipn_url'   => url('ipn.php'),
]);

if (($result['error'] ?? '') !== 'ok' || empty($result['result'])) {
    db_query("UPDATE deposits SET status = 'cancelled' WHERE id = ?", [$depositId]);
    flash('error', 'Could not create payment: ' . e($result['error'] ?? 'Unknown error'));
    redirect('user/buy.php');
}

$tx = $result['result'];

// Save CoinPayments transaction details.
db_query(
    'UPDATE deposits SET txn_id = ?, checkout_url = ? WHERE id = ?',
    [$tx['txn_id'] ?? '', $tx['checkout_url'] ?? '', $depositId]
);

// Also create a hashrate_purchases pending record.
db_query(
    "INSERT INTO hashrate_purchases (user_id, ghs_amount, doge_cost, deposit_id, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', NOW())",
    [$u['id'], $ghs, $cost, $depositId]
);

activity_log($u['id'], 'buy_hashrate', $ghs . ' GH/s for ' . $cost . ' DOGE');

// Redirect to CoinPayments checkout.
if (!empty($tx['checkout_url'])) {
    redirect($tx['checkout_url']);
}

flash('success', 'Invoice created. Please complete your payment.');
redirect('user/buy.php');
