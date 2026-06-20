<?php
/**
 * Core helper functions: security, formatting, validation, logging.
 */

// ---------------------------------------------------------------------------
// OUTPUT / ESCAPING
// ---------------------------------------------------------------------------

/**
 * Escape a string for safe HTML output (XSS protection).
 */
function e($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * Redirect helper.
 */
function redirect($path)
{
    // Allow absolute URLs, otherwise prefix with SITE_URL.
    if (preg_match('#^https?://#i', $path)) {
        header('Location: ' . $path);
    } else {
        header('Location: ' . rtrim(SITE_URL, '/') . '/' . ltrim($path, '/'));
    }
    exit;
}

/**
 * Build a site URL.
 */
function url($path = '')
{
    return rtrim(SITE_URL, '/') . '/' . ltrim($path, '/');
}

// ---------------------------------------------------------------------------
// CSRF PROTECTION
// ---------------------------------------------------------------------------

/**
 * Get (or generate) the CSRF token for this session.
 */
function csrf_token()
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Output a hidden CSRF input field.
 */
function csrf_field()
{
    return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '">';
}

/**
 * Validate a submitted CSRF token.
 */
function csrf_verify($token)
{
    return !empty($token)
        && !empty($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Abort the request if the POST CSRF token is invalid.
 */
function csrf_check()
{
    $token = $_POST['csrf_token'] ?? '';
    if (!csrf_verify($token)) {
        http_response_code(419);
        die('Invalid or expired security token. Please refresh the page and try again.');
    }
}

// ---------------------------------------------------------------------------
// INPUT
// ---------------------------------------------------------------------------

/**
 * Trim and clean an input string.
 */
function clean($value)
{
    return trim((string) $value);
}

/**
 * Validate a Dogecoin wallet address (basic structural validation).
 * DOGE legacy addresses start with "D" and are 25-34 base58 chars.
 */
function is_valid_doge_address($address)
{
    $address = trim($address);
    return (bool) preg_match('/^D[1-9A-HJ-NP-Za-km-z]{25,40}$/', $address);
}

// ---------------------------------------------------------------------------
// FORMATTING
// ---------------------------------------------------------------------------

/**
 * Format a DOGE amount.
 */
function doge($amount, $decimals = 4)
{
    return number_format((float) $amount, $decimals, '.', ',');
}

/**
 * Format a hashrate (GH/s) value.
 */
function ghs($amount)
{
    return number_format((float) $amount, 2, '.', ',');
}

/**
 * Human-friendly date.
 */
function fmt_date($datetime, $format = 'M d, Y H:i')
{
    if (empty($datetime)) {
        return '-';
    }
    return date($format, strtotime($datetime));
}

/**
 * Generate a unique referral code.
 */
function generate_referral_code($length = 8)
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code  = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $code;
}

/**
 * Mask a wallet address for display (e.g. D7Y...x9Q).
 */
function mask_address($address, $head = 6, $tail = 4)
{
    $len = strlen($address);
    if ($len <= ($head + $tail)) {
        return $address;
    }
    return substr($address, 0, $head) . '...' . substr($address, -$tail);
}

// ---------------------------------------------------------------------------
// LOGGING
// ---------------------------------------------------------------------------

/**
 * Write an entry into the activity_logs table.
 */
function activity_log($userId, $action, $details = '')
{
    try {
        db_query(
            'INSERT INTO activity_logs (user_id, action, details, ip_address, created_at)
             VALUES (?, ?, ?, ?, NOW())',
            [
                $userId ?: null,
                $action,
                $details,
                $_SERVER['REMOTE_ADDR'] ?? '',
            ]
        );
    } catch (Exception $e) {
        // Silently ignore logging failures.
    }
}

/**
 * Record a transaction record (unified ledger).
 *
 * @param int    $userId
 * @param string $type    deposit|withdrawal|mining_reward|referral_reward|hashrate_purchase|admin_credit|admin_debit
 * @param float  $amount  Positive = credit, negative = debit (in DOGE)
 * @param string $description
 * @param string $status  completed|pending|rejected
 */
function record_transaction($userId, $type, $amount, $description = '', $status = 'completed')
{
    db_query(
        'INSERT INTO transactions (user_id, type, amount, description, status, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())',
        [$userId, $type, $amount, $description, $status]
    );
    return db_insert_id();
}

// ---------------------------------------------------------------------------
// FLASH MESSAGES
// ---------------------------------------------------------------------------

function flash($type, $message)
{
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function get_flashes()
{
    $flashes = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $flashes;
}

function render_flashes()
{
    $html = '';
    foreach (get_flashes() as $f) {
        $class = $f['type'] === 'error' ? 'danger' : $f['type'];
        $html .= '<div class="alert alert-' . e($class) . ' alert-dismissible fade show" role="alert">'
              . e($f['message'])
              . '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
              . '</div>';
    }
    return $html;
}

// ---------------------------------------------------------------------------
// JSON RESPONSE (for AJAX)
// ---------------------------------------------------------------------------

function json_response($data, $code = 200)
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
