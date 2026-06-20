<?php
/**
 * Mining engine.
 *
 * Handles hashrate -> DOGE conversions, bonus period logic, and the accrual
 * of mining rewards based on elapsed time. Designed to be safe to call both
 * from a cron job and on-demand when a user opens the dashboard.
 */

/**
 * Hashrate price formula: how many GH/s you get per 1 DOGE.
 * Admin-configurable via setting "ghs_per_doge". Default 100.
 */
function ghs_per_doge()
{
    return max(1, (float) setting('ghs_per_doge', 100));
}

/**
 * Convert a GH/s amount into its DOGE cost.
 */
function ghs_to_doge($ghs)
{
    return (float) $ghs / ghs_per_doge();
}

/**
 * Convert DOGE into GH/s.
 */
function doge_to_ghs($doge)
{
    return (float) $doge * ghs_per_doge();
}

/**
 * Daily DOGE earned per GH/s for PURCHASED hashrate.
 * Admin-configurable via "daily_earning_per_ghs". Default 0.0008 DOGE / GH/s / day.
 */
function daily_earning_per_ghs()
{
    return (float) setting('daily_earning_per_ghs', 0.0008);
}

/**
 * Global mining multiplier (admin can boost/reduce all earnings).
 */
function mining_multiplier()
{
    return (float) setting('mining_multiplier', 1);
}

/**
 * Is mining globally enabled?
 */
function mining_enabled()
{
    return (string) setting('mining_enabled', '1') === '1';
}

/**
 * Determine if a user is still inside their welcome-bonus mining window.
 */
function in_bonus_period($user)
{
    if (empty($user['bonus_expires_at'])) {
        return false;
    }
    return strtotime($user['bonus_expires_at']) > time();
}

/**
 * Compute the user's current effective hashrate.
 * During the bonus period bonus GH/s counts; after expiry only purchased GH/s.
 */
function effective_hashrate($user)
{
    $purchased = (float) $user['purchased_ghs'];
    if (in_bonus_period($user)) {
        return $purchased + (float) $user['bonus_ghs'];
    }
    return $purchased;
}

/**
 * Total hashrate displayed to user (bonus + purchased) regardless of expiry.
 */
function total_hashrate($user)
{
    return (float) $user['bonus_ghs'] + (float) $user['purchased_ghs'];
}

/**
 * Estimated daily earnings for the user right now (in DOGE).
 *
 * - During bonus period: fixed daily bonus reward + purchased hashrate earnings.
 * - After bonus period: purchased hashrate earnings only.
 */
function estimated_daily_earnings($user)
{
    if (!mining_enabled()) {
        return 0.0;
    }

    $purchasedDaily = (float) $user['purchased_ghs'] * daily_earning_per_ghs() * mining_multiplier();

    if (in_bonus_period($user)) {
        $bonusDaily = (float) setting('daily_bonus_reward', 1);
        return $bonusDaily + $purchasedDaily;
    }

    return $purchasedDaily;
}

/**
 * Accrue mining rewards for a single user based on time elapsed since the
 * last accrual. Credits balance, updates totals and writes a mining_rewards
 * row. Returns the amount credited.
 *
 * @param array $user Full user row (must be fresh).
 * @return float Amount credited (DOGE).
 */
function accrue_user_mining(&$user)
{
    if (!mining_enabled() || (int) $user['status'] !== 1) {
        return 0.0;
    }

    $now      = time();
    $lastTime = !empty($user['last_mining_at']) ? strtotime($user['last_mining_at']) : strtotime($user['created_at']);
    $elapsed  = $now - $lastTime;

    // Minimum 60 seconds between accruals to keep numbers meaningful.
    if ($elapsed < 60) {
        return 0.0;
    }

    // Cap a single accrual to 2 days to avoid runaway values after downtime.
    $elapsed = min($elapsed, 2 * 86400);

    $dailyRate = estimated_daily_earnings($user);
    if ($dailyRate <= 0) {
        // Still advance the timestamp so we don't keep recomputing.
        db_query('UPDATE users SET last_mining_at = NOW() WHERE id = ?', [$user['id']]);
        $user['last_mining_at'] = date('Y-m-d H:i:s', $now);
        return 0.0;
    }

    $earned = $dailyRate * ($elapsed / 86400);
    $earned = round($earned, 8);

    if ($earned <= 0) {
        return 0.0;
    }

    // Update user balances and totals.
    db_query(
        'UPDATE users
            SET balance        = balance + ?,
                total_earnings = total_earnings + ?,
                last_mining_at = NOW()
          WHERE id = ?',
        [$earned, $earned, $user['id']]
    );

    // Write mining reward record.
    db_query(
        'INSERT INTO mining_rewards (user_id, hashrate, amount, type, created_at)
         VALUES (?, ?, ?, ?, NOW())',
        [
            $user['id'],
            effective_hashrate($user),
            $earned,
            in_bonus_period($user) ? 'bonus' : 'hashrate',
        ]
    );

    record_transaction($user['id'], 'mining_reward', $earned, 'Mining reward accrual');

    // Reflect changes in the in-memory user array.
    $user['balance']        += $earned;
    $user['total_earnings'] += $earned;
    $user['last_mining_at']  = date('Y-m-d H:i:s', $now);

    return $earned;
}

/**
 * Accrue mining for ALL active users (used by cron.php).
 *
 * @return array Summary stats.
 */
function accrue_all_users()
{
    $total   = 0.0;
    $count   = 0;
    $users   = db_all('SELECT * FROM users WHERE status = 1');

    foreach ($users as $user) {
        $credited = accrue_user_mining($user);
        if ($credited > 0) {
            $total += $credited;
            $count++;
        }
    }

    return ['users_credited' => $count, 'total_doge' => $total];
}
