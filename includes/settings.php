<?php
/**
 * Settings loader. Settings are stored in the `settings` table as key/value
 * pairs and cached for the duration of the request.
 */

/**
 * Load all settings into a cached associative array.
 *
 * @return array
 */
function all_settings()
{
    static $cache = null;

    if ($cache === null) {
        $cache = [];
        try {
            $rows = db_all('SELECT setting_key, setting_value FROM settings');
            foreach ($rows as $row) {
                $cache[$row['setting_key']] = $row['setting_value'];
            }
        } catch (Exception $e) {
            $cache = [];
        }
    }

    return $cache;
}

/**
 * Get a single setting value with an optional default.
 *
 * @param string $key
 * @param mixed  $default
 * @return mixed
 */
function setting($key, $default = null)
{
    $settings = all_settings();
    return array_key_exists($key, $settings) ? $settings[$key] : $default;
}

/**
 * Update or insert a setting value.
 *
 * @param string $key
 * @param mixed  $value
 */
function set_setting($key, $value)
{
    db_query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [$key, (string) $value]
    );
}
