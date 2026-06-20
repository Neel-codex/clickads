<?php
/**
 * CoinPayments IPN (Instant Payment Notification) handler.
 *
 * Configure this URL in your CoinPayments account and per-transaction:
 *   https://yourdomain.com/ipn.php
 *
 * Flow:
 *   1. Verify the HMAC signature against the IPN secret.
 *   2. Log the raw payload.
 *   3. When a payment is complete, credit the user's account:
 *        - purpose = hashrate  -> add purchased GH/s
 *        - purpose = deposit   -> add DOGE to balance
 *   4. Pay referral commission to the referrer.
 */
require_once __DIR__ . '/includes/init.php';

// Always log the attempt (even if verification later fails).
$rawPayload = file_get_contents('php://input');
$txnId      = $_POST['txn_id'] ?? null;
$statusNum  = isset($_POST['status']) ? (int) $_POST['status'] : null;
$statusText = $_POST['status_text'] ?? '';

db_query(
    'INSERT INTO coinpayments_logs (txn_id, status, status_text, payload, created_at)
     VALUES (?, ?, ?, ?, NOW())',
    [$txnId, $statusNum, $statusText, $rawPayload ?: json_encode($_POST)]
);

// Verify authenticity.
if (!cp_verify_ipn()) {
    http_response_code(403);
    die('IPN verification failed');
}

// Identify the deposit via the custom field.
$custom    = $_POST['custom'] ?? '';
$meta      = json_decode($custom, true);
$depositId = $meta['deposit_id'] ?? null;

if (!$depositId) {
    // Try to match by txn_id as a fallback.
    if ($txnId) {
        $dep = db_row('SELECT id FROM deposits WHERE txn_id = ?', [$txnId]);
        $depositId = $dep['id'] ?? null;
    }
}

if (!$depositId) {
    http_response_code(200);
    die('IPN OK (no matching deposit)');
}

$deposit = db_row('SELECT * FROM deposits WHERE id = ?', [$depositId]);
if (!$deposit) {
    http_response_code(200);
    die('IPN OK (deposit not found)');
}

// Already processed? Idempotency guard.
if ($deposit['status'] === 'completed') {
    http_response_code(200);
    die('IPN OK (already completed)');
}

// CoinPayments status: >= 100 or == 2 means complete/paid. < 0 means error/cancelled.
if ($statusNum !== null && $statusNum < 0) {
    db_query("UPDATE deposits SET status = 'cancelled' WHERE id = ?", [$depositId]);
    if ($deposit['purpose'] === 'hashrate') {
        db_query("UPDATE hashrate_purchases SET status = 'cancelled' WHERE deposit_id = ?", [$depositId]);
    }
    http_response_code(200);
    die('IPN OK (cancelled)');
}

if ($statusNum === null || ($statusNum < 100 && $statusNum != 2)) {
    // Still pending; acknowledge but do nothing.
    http_response_code(200);
    die('IPN OK (pending)');
}

// ---- Payment complete: credit the user ----
$userId    = (int) $deposit['user_id'];
$amountDoge = (float) $deposit['amount_doge'];

db_query("UPDATE deposits SET status = 'completed', completed_at = NOW() WHERE id = ?", [$depositId]);

if ($deposit['purpose'] === 'hashrate') {
    $ghs = (float) $deposit['ghs_amount'];
    db_query('UPDATE users SET purchased_ghs = purchased_ghs + ? WHERE id = ?', [$ghs, $userId]);
    db_query("UPDATE hashrate_purchases SET status = 'completed' WHERE deposit_id = ?", [$depositId]);
    record_transaction($userId, 'hashrate_purchase', $amountDoge, ghs($ghs) . ' GH/s hashrate purchased');
    activity_log($userId, 'hashrate_credited', $ghs . ' GH/s');
} else {
    // Plain deposit -> credit balance.
    db_query('UPDATE users SET balance = balance + ? WHERE id = ?', [$amountDoge, $userId]);
    record_transaction($userId, 'deposit', $amountDoge, 'Deposit confirmed (' . $deposit['pay_currency'] . ')');
    activity_log($userId, 'deposit_credited', $amountDoge . ' DOGE');
}

// ---- Referral commission ----
$user = db_row('SELECT referred_by FROM users WHERE id = ?', [$userId]);
if ($user && !empty($user['referred_by'])) {
    $refPct     = (float) setting('referral_percent', 20);
    $commission = round($amountDoge * ($refPct / 100), 8);

    if ($commission > 0) {
        $referrerId = (int) $user['referred_by'];
        db_query(
            'UPDATE users SET balance = balance + ?, referral_earnings = referral_earnings + ? WHERE id = ?',
            [$commission, $commission, $referrerId]
        );
        db_query(
            'UPDATE referrals SET commission = commission + ?, source_amount = source_amount + ?
              WHERE referrer_id = ? AND referred_id = ?',
            [$commission, $amountDoge, $referrerId, $userId]
        );
        record_transaction(
            $referrerId,
            'referral_reward',
            $commission,
            'Referral commission (' . $refPct . '% of ' . doge($amountDoge) . ' DOGE)'
        );
        activity_log($referrerId, 'referral_commission', $commission . ' DOGE');
    }
}

http_response_code(200);
echo 'IPN OK';
