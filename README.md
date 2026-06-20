# DogeHash - Dogecoin Cloud Mining Platform

A complete, production-ready **Dogecoin Cloud Mining Platform** (hashpower reward system) built with **PHP 8+, MySQL, Bootstrap 5, JavaScript & AJAX**. No frameworks, no Node.js, no build step - just upload to any shared / cPanel host and run.

Users join with **only their Dogecoin wallet address**, instantly receive a **welcome hashrate bonus + free mining days + daily DOGE rewards**, and can buy additional GH/s at any time. Payments run through **CoinPayments** (DOGE, LTC, BTC, USDT).

---

## Features

- **Wallet-only registration & login** (no passwords for users)
- **Welcome bonus**: configurable GH/s + free mining days + daily DOGE reward
- **Hashpower model**: buy *any* amount of GH/s (no fixed packages). Formula `100 GH/s = 1 DOGE` (admin editable)
- **Live mining dashboard** with animated, real-time balance counter (AJAX)
- **Interactive hashrate calculator** on the homepage
- **CoinPayments integration**: invoices, IPN verification (HMAC), auto-credit
- **Referral program**: 20% commission (admin editable)
- **Withdrawals**: user requests, admin approval workflow (pending/approved/rejected)
- **Full admin panel**: users, deposits, withdrawals, mining/referral/website/CoinPayments settings
- **Security**: PDO prepared statements, CSRF tokens, XSS escaping, secure sessions, hardened `.htaccess`
- **Mobile-first responsive UI** with a bottom navigation bar

---

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | PHP 8+ (PDO, no framework) |
| Database  | MySQL 5.7+ / 8.0+       |
| Frontend  | Bootstrap 5, vanilla JS, AJAX (fetch) |
| Icons     | Font Awesome 6          |
| Payments  | CoinPayments.net API    |

---

## Project Structure

```
clickads/
├── admin/                   Admin panel
│   ├── includes/            Admin layout + auth bootstrap
│   ├── index.php            Admin login
│   ├── dashboard.php
│   ├── users.php
│   ├── deposits.php
│   ├── withdrawals.php
│   ├── mining-settings.php
│   ├── referral-settings.php
│   ├── coinpayments.php
│   └── website-settings.php
├── ajax/                    AJAX endpoints (mining status, calculator, buy)
├── assets/
│   ├── css/style.css        Theme (white/black/Dogecoin gold)
│   ├── js/main.js           Counters, calculator, live mining
│   └── images/
├── config/
│   ├── config.php           Active config (edit me)
│   └── config.sample.php    Template
├── database/
│   └── database.sql         Full schema + default settings + demo admin
├── includes/                Core: db, functions, auth, mining, settings, coinpayments, layout
├── uploads/                 Logo/favicon uploads (no script execution)
├── user/                    User dashboard pages
├── index.php                Homepage
├── register.php / login.php / logout.php
├── ipn.php                  CoinPayments IPN handler
├── cron.php                 Mining accrual cron
├── terms.php / privacy.php
└── .htaccess
```

---

## Quick Start

See **[INSTALL.md](INSTALL.md)** for full installation and cPanel deployment instructions.

1. Create a MySQL database and import `database/database.sql`.
2. Copy `config/config.sample.php` to `config/config.php` and enter your DB credentials + site URL.
3. Upload all files to your hosting `public_html` (or a subfolder).
4. Visit your site to register, and `/admin/` to manage it.
5. Set up the mining cron job (see INSTALL.md).

### Demo Admin Account

| Username | Password   |
|----------|------------|
| `admin`  | `admin123` |

> **Change this password immediately after your first login** (Admin → it is recommended to update the `admins` row, see INSTALL.md).

---

## How Mining Works

- Each user has **bonus GH/s** (active during the bonus window) and **purchased GH/s** (permanent).
- During the bonus period the user earns a fixed **daily bonus reward** + earnings from any purchased hashrate.
- After the bonus expires, only **purchased GH/s** earns, at `daily_earning_per_ghs` DOGE per GH/s per day × `mining_multiplier`.
- Rewards accrue based on elapsed time, both on dashboard load and via `cron.php`.

All rates are configurable in **Admin → Mining Settings**.

---

## Security Notes

- All queries use **PDO prepared statements**.
- All output is escaped with `e()` (htmlspecialchars).
- All state-changing forms are protected with **CSRF tokens**.
- Sessions are **HttpOnly**, **SameSite=Lax**, and `secure` over HTTPS.
- `config/`, `includes/`, and `database/` are blocked from web access via `.htaccess`.
- `uploads/` cannot execute scripts.
- CoinPayments IPNs are verified using **HMAC-SHA512** against your IPN secret.

---

## License

Provided as-is for your own deployment. You are responsible for legal compliance in your jurisdiction. Cloud mining reward platforms may be regulated - operate responsibly.
