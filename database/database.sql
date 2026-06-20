-- =============================================================================
-- DogeHash Cloud Mining Platform - Database Schema
-- MySQL 5.7+ / 8.0+  |  Charset: utf8mb4
--
-- Import this file via phpMyAdmin (cPanel) or the command line:
--   mysql -u USER -p DATABASE < database.sql
--
-- Demo admin account is created at the bottom:
--   Username: admin
--   Password: admin123   (CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wallet_address`   VARCHAR(64)  NOT NULL,
  `referral_code`    VARCHAR(16)  NOT NULL,
  `referred_by`      INT UNSIGNED DEFAULT NULL,
  `bonus_ghs`        DECIMAL(20,4) NOT NULL DEFAULT 0,
  `purchased_ghs`    DECIMAL(20,4) NOT NULL DEFAULT 0,
  `balance`          DECIMAL(20,8) NOT NULL DEFAULT 0,
  `total_earnings`   DECIMAL(20,8) NOT NULL DEFAULT 0,
  `total_withdrawn`  DECIMAL(20,8) NOT NULL DEFAULT 0,
  `referral_earnings` DECIMAL(20,8) NOT NULL DEFAULT 0,
  `bonus_expires_at` DATETIME DEFAULT NULL,
  `last_mining_at`   DATETIME DEFAULT NULL,
  `remember_token`   VARCHAR(128) DEFAULT NULL,
  `status`           TINYINT(1) NOT NULL DEFAULT 1,  -- 1=active, 0=suspended
  `created_at`       DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_wallet` (`wallet_address`),
  UNIQUE KEY `uniq_refcode` (`referral_code`),
  KEY `idx_referred_by` (`referred_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- ADMINS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email`         VARCHAR(128) DEFAULT NULL,
  `last_login`    DATETIME DEFAULT NULL,
  `created_at`    DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- SETTINGS (key/value)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key`   VARCHAR(64) NOT NULL,
  `setting_value` TEXT,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- DEPOSITS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deposits` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      INT UNSIGNED NOT NULL,
  `txn_id`       VARCHAR(128) DEFAULT NULL,   -- CoinPayments txn id
  `amount_doge`  DECIMAL(20,8) NOT NULL DEFAULT 0,
  `pay_currency` VARCHAR(16) DEFAULT 'DOGE',
  `purpose`      VARCHAR(32) NOT NULL DEFAULT 'deposit', -- deposit | hashrate
  `ghs_amount`   DECIMAL(20,4) NOT NULL DEFAULT 0,       -- GH/s if purpose=hashrate
  `status`       VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending|completed|cancelled
  `checkout_url` VARCHAR(255) DEFAULT NULL,
  `created_at`   DATETIME NOT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_txn` (`txn_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- WITHDRAWALS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED NOT NULL,
  `amount`        DECIMAL(20,8) NOT NULL,
  `wallet_address` VARCHAR(64) NOT NULL,
  `status`        VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  `admin_note`    VARCHAR(255) DEFAULT NULL,
  `created_at`    DATETIME NOT NULL,
  `processed_at`  DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- TRANSACTIONS (unified ledger)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `type`        VARCHAR(32) NOT NULL, -- deposit|withdrawal|mining_reward|referral_reward|hashrate_purchase|admin_credit|admin_debit
  `amount`      DECIMAL(20,8) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `status`      VARCHAR(16) NOT NULL DEFAULT 'completed',
  `created_at`  DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- MINING REWARDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mining_rewards` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `hashrate`   DECIMAL(20,4) NOT NULL DEFAULT 0,
  `amount`     DECIMAL(20,8) NOT NULL DEFAULT 0,
  `type`       VARCHAR(16) NOT NULL DEFAULT 'hashrate', -- bonus | hashrate
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- REFERRALS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `referrals` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `referrer_id`  INT UNSIGNED NOT NULL,
  `referred_id`  INT UNSIGNED NOT NULL,
  `commission`   DECIMAL(20,8) NOT NULL DEFAULT 0,
  `source_amount` DECIMAL(20,8) NOT NULL DEFAULT 0,
  `created_at`   DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_referrer` (`referrer_id`),
  KEY `idx_referred` (`referred_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- COINPAYMENTS LOGS (raw IPN log)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coinpayments_logs` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `txn_id`      VARCHAR(128) DEFAULT NULL,
  `status`      VARCHAR(32) DEFAULT NULL,
  `status_text` VARCHAR(128) DEFAULT NULL,
  `payload`     TEXT,
  `created_at`  DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_txn` (`txn_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- HASHRATE PURCHASES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hashrate_purchases` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `ghs_amount`  DECIMAL(20,4) NOT NULL,
  `doge_cost`   DECIMAL(20,8) NOT NULL,
  `deposit_id`  INT UNSIGNED DEFAULT NULL,
  `status`      VARCHAR(16) NOT NULL DEFAULT 'completed', -- pending|completed
  `created_at`  DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- ACTIVITY LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED DEFAULT NULL,
  `action`     VARCHAR(64) NOT NULL,
  `details`    VARCHAR(255) DEFAULT NULL,
  `ip_address` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- DEFAULT SETTINGS
-- =============================================================================
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
  ('site_name',            'DogeHash'),
  ('site_logo',            ''),
  ('site_favicon',         ''),
  ('contact_email',        'support@dogehash.com'),
  ('footer_text',          'DogeHash Cloud Mining - Mine Dogecoin in the Cloud'),
  ('terms_text',           'By using DogeHash you agree to mine responsibly. Cloud mining involves risk.'),
  ('privacy_text',         'We only store your Dogecoin wallet address and activity needed to operate the service.'),
  ('ghs_per_doge',         '100'),
  ('daily_earning_per_ghs','0.0008'),
  ('mining_multiplier',    '1'),
  ('mining_enabled',       '1'),
  ('bonus_ghs',            '100'),
  ('bonus_days',           '10'),
  ('daily_bonus_reward',   '1'),
  ('referral_percent',     '20'),
  ('min_withdrawal',       '50'),
  ('cp_merchant_id',       ''),
  ('cp_public_key',        ''),
  ('cp_private_key',       ''),
  ('cp_ipn_secret',        '')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- =============================================================================
-- DEMO ADMIN ACCOUNT
-- Username: admin   Password: admin123
-- The hash below is a bcrypt hash of "admin123".
-- =============================================================================
INSERT INTO `admins` (`username`, `password_hash`, `email`, `created_at`) VALUES
  ('admin', '$2y$12$c9e8lLi0GRauAD7.j3.W7OuZ6KV5Lk2e.OY6YtWtl2YUFDaj44ZsC', 'admin@dogehash.com', NOW())
ON DUPLICATE KEY UPDATE username = username;

SET FOREIGN_KEY_CHECKS = 1;
