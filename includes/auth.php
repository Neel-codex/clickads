<?php
/**
 * Authentication helpers for users and admins.
 * Users authenticate with their Dogecoin wallet address (no password).
 * Admins authenticate with username + password.
 */

// ---------------------------------------------------------------------------
// USER AUTH
// ---------------------------------------------------------------------------

/**
 * Is a user logged in?
 */
function is_logged_in()
{
    return !empty($_SESSION['user_id']);
}

/**
 * Get the currently logged-in user's fresh DB row, or null.
 */
function current_user()
{
    static $user = null;

    if ($user === null && is_logged_in()) {
        $user = db_row('SELECT * FROM users WHERE id = ?', [$_SESSION['user_id']]);
        if (!$user) {
            // Stale session.
            logout_user();
        }
    }

    return $user ?: null;
}

/**
 * Force a fresh re-fetch of the current user (after balance changes).
 */
function refresh_user()
{
    if (is_logged_in()) {
        return db_row('SELECT * FROM users WHERE id = ?', [$_SESSION['user_id']]);
    }
    return null;
}

/**
 * Log a user in by setting the session.
 */
function login_user($userId, $remember = false)
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;

    if ($remember) {
        $token  = bin2hex(random_bytes(32));
        $hash   = hash('sha256', $token . APP_KEY);
        $expiry = time() + (30 * 86400); // 30 days

        db_query(
            'UPDATE users SET remember_token = ? WHERE id = ?',
            [$hash, $userId]
        );

        $cookieValue = $userId . ':' . $token;
        setcookie('dh_remember', $cookieValue, [
            'expires'  => $expiry,
            'path'     => '/',
            'secure'   => !empty($_SERVER['HTTPS']),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}

/**
 * Attempt to log in automatically from a remember-me cookie.
 */
function attempt_remember_login()
{
    if (is_logged_in() || empty($_COOKIE['dh_remember'])) {
        return;
    }

    $parts = explode(':', $_COOKIE['dh_remember'], 2);
    if (count($parts) !== 2) {
        return;
    }

    [$userId, $token] = $parts;
    $hash = hash('sha256', $token . APP_KEY);

    $user = db_row('SELECT * FROM users WHERE id = ? AND remember_token = ?', [$userId, $hash]);
    if ($user && (int) $user['status'] === 1) {
        $_SESSION['user_id'] = $user['id'];
    }
}

/**
 * Log the current user out.
 */
function logout_user()
{
    if (!empty($_SESSION['user_id'])) {
        db_query('UPDATE users SET remember_token = NULL WHERE id = ?', [$_SESSION['user_id']]);
    }
    unset($_SESSION['user_id']);
    setcookie('dh_remember', '', time() - 3600, '/');
}

/**
 * Require an authenticated user or redirect to login.
 */
function require_login()
{
    if (!is_logged_in()) {
        flash('error', 'Please log in to continue.');
        redirect('login.php');
    }
    $user = current_user();
    if (!$user || (int) $user['status'] !== 1) {
        logout_user();
        flash('error', 'Your account is suspended or unavailable.');
        redirect('login.php');
    }
}

// ---------------------------------------------------------------------------
// ADMIN AUTH
// ---------------------------------------------------------------------------

function is_admin()
{
    return !empty($_SESSION['admin_id']);
}

function current_admin()
{
    static $admin = null;
    if ($admin === null && is_admin()) {
        $admin = db_row('SELECT * FROM admins WHERE id = ?', [$_SESSION['admin_id']]);
    }
    return $admin ?: null;
}

function login_admin($adminId)
{
    session_regenerate_id(true);
    $_SESSION['admin_id'] = $adminId;
}

function logout_admin()
{
    unset($_SESSION['admin_id']);
}

function require_admin()
{
    if (!is_admin()) {
        redirect('admin/index.php');
    }
}
