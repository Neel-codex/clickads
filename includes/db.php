<?php
/**
 * Database connection (PDO) and global bootstrap.
 * Included by every page through includes/init.php.
 */

if (!defined('DOGEHASH')) {
    define('DOGEHASH', true);
}

/**
 * Allow injecting a pre-built PDO connection (used for testing / custom setups).
 * Returns the current connection when called with no argument.
 *
 * @param PDO|null $pdo
 * @return PDO|null
 */
function db_set_connection($pdo = null)
{
    static $injected = null;
    if ($pdo !== null) {
        $injected = $pdo;
    }
    return $injected;
}

/**
 * Returns a shared PDO connection (singleton).
 *
 * @return PDO
 */
function db()
{
    static $pdo = null;

    // Use an injected connection if one was provided.
    $injected = db_set_connection();
    if ($injected instanceof PDO) {
        return $injected;
    }

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            if (defined('APP_DEBUG') && APP_DEBUG) {
                die('Database connection failed: ' . htmlspecialchars($e->getMessage()));
            }
            die('Database connection failed. Please check your configuration.');
        }
    }

    return $pdo;
}

/**
 * Run a prepared query and return the statement.
 *
 * @param string $sql
 * @param array  $params
 * @return PDOStatement
 */
function db_query($sql, array $params = [])
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

/**
 * Fetch a single row.
 */
function db_row($sql, array $params = [])
{
    return db_query($sql, $params)->fetch();
}

/**
 * Fetch all rows.
 */
function db_all($sql, array $params = [])
{
    return db_query($sql, $params)->fetchAll();
}

/**
 * Fetch a single scalar value.
 */
function db_value($sql, array $params = [])
{
    $stmt = db_query($sql, $params);
    return $stmt->fetchColumn();
}

/**
 * Return last inserted ID.
 */
function db_insert_id()
{
    return db()->lastInsertId();
}
