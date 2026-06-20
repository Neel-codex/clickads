<?php
/**
 * CoinPayments.net API integration.
 *
 * Credentials are stored in the settings table and managed from the admin
 * panel:
 *   - cp_merchant_id
 *   - cp_public_key
 *   - cp_private_key
 *   - cp_ipn_secret
 *
 * Reference: https://www.coinpayments.net/apidoc
 */

/**
 * Are CoinPayments credentials configured?
 */
function cp_configured()
{
    return setting('cp_public_key') && setting('cp_private_key');
}

/**
 * Perform a private API call to CoinPayments.
 *
 * @param string $cmd    API command (e.g. create_transaction)
 * @param array  $params Additional parameters
 * @return array ['error' => 'ok'|message, 'result' => array]
 */
function cp_api_call($cmd, array $params = [])
{
    $publicKey  = setting('cp_public_key');
    $privateKey = setting('cp_private_key');

    if (!$publicKey || !$privateKey) {
        return ['error' => 'CoinPayments API keys are not configured.'];
    }

    $params['version'] = 1;
    $params['cmd']     = $cmd;
    $params['key']     = $publicKey;
    $params['format']  = 'json';

    $postData = http_build_query($params, '', '&');
    $hmac     = hash_hmac('sha512', $postData, $privateKey);

    $ch = curl_init('https://www.coinpayments.net/api.php');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postData,
        CURLOPT_HTTPHEADER     => ['HMAC: ' . $hmac],
        CURLOPT_TIMEOUT        => 30,
    ]);

    $response = curl_exec($ch);
    if ($response === false) {
        $err = curl_error($ch);
        curl_close($ch);
        return ['error' => 'CoinPayments connection error: ' . $err];
    }
    curl_close($ch);

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        return ['error' => 'Invalid response from CoinPayments.'];
    }

    return $decoded;
}

/**
 * Create a deposit transaction / invoice.
 *
 * @param float  $amount   Amount in DOGE (the platform's accounting currency).
 * @param string $currency Coin the user wants to pay with (DOGE, LTC, BTC, USDT).
 * @param string $buyerEmail
 * @param array  $extra    ['item_name', 'custom', 'ipn_url', 'success_url', 'cancel_url']
 * @return array
 */
function cp_create_transaction($amount, $currency, $buyerEmail, array $extra = [])
{
    $params = [
        'amount'       => number_format((float) $amount, 8, '.', ''),
        'currency1'    => 'DOGE',          // Price currency (what we charge in)
        'currency2'    => $currency,        // Pay currency (what the user pays in)
        'buyer_email'  => $buyerEmail ?: 'noreply@example.com',
        'item_name'    => $extra['item_name'] ?? 'DogeHash Deposit',
        'custom'       => $extra['custom'] ?? '',
        'ipn_url'      => $extra['ipn_url'] ?? url('ipn.php'),
    ];

    return cp_api_call('create_transaction', $params);
}

/**
 * Verify an incoming IPN request from CoinPayments.
 *
 * Validates the HMAC header against the configured IPN secret and merchant ID.
 *
 * @return bool
 */
function cp_verify_ipn()
{
    $ipnSecret  = setting('cp_ipn_secret');
    $merchantId = setting('cp_merchant_id');

    if (!$ipnSecret || !$merchantId) {
        return false;
    }

    if (empty($_SERVER['HTTP_HMAC']) || empty($_POST)) {
        return false;
    }

    if (!isset($_POST['merchant']) || $_POST['merchant'] !== $merchantId) {
        return false;
    }

    // Recompute HMAC from the raw POST body.
    $request = file_get_contents('php://input');
    if (empty($request)) {
        return false;
    }

    $hmac = hash_hmac('sha512', $request, $ipnSecret);

    return hash_equals($hmac, $_SERVER['HTTP_HMAC']);
}
