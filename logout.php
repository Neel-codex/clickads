<?php
require_once __DIR__ . '/includes/init.php';
logout_user();
flash('success', 'You have been logged out.');
redirect('login.php');
