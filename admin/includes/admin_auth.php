<?php
/**
 * Admin bootstrap. Include at the top of every admin page (except index.php
 * login). It loads the app and enforces an authenticated admin session.
 */
require_once __DIR__ . '/../../includes/init.php';
require_admin();
