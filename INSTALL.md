# Installation & cPanel Deployment Guide

This guide walks you through installing **DogeHash** on shared / cPanel hosting (PHP 8+, MySQL). No command line is required for the standard cPanel path.

---

## 1. Requirements

- PHP **8.0 or higher** with the `pdo_mysql` and `curl` extensions (enabled by default on most hosts)
- MySQL **5.7+** or MariaDB **10.2+**
- Apache with `.htaccess` support (standard on cPanel) or Nginx
- An HTTPS-enabled domain (recommended; free with cPanel AutoSSL / Let's Encrypt)
- A free [CoinPayments.net](https://www.coinpayments.net) merchant account (for deposits/purchases)

---

## 2. Create the Database (cPanel)

1. Log in to **cPanel**.
2. Open **MySQL® Database Wizard**.
3. Create a new database, e.g. `dogehash`.
4. Create a new database user with a strong password.
5. Add the user to the database and grant **ALL PRIVILEGES**.
6. Note the final names - cPanel prefixes them, e.g. `cpaneluser_dogehash` and `cpaneluser_doge`.

### Import the schema

1. Open **phpMyAdmin** from cPanel.
2. Select your new database on the left.
3. Click the **Import** tab.
4. Choose the file `database/database.sql` from this package and click **Go**.
5. You should see all tables created (`users`, `admins`, `settings`, etc.) plus the default settings and demo admin account.

---

## 3. Configure the Application

1. In the `config/` folder, copy `config.sample.php` to `config.php` (a ready working `config.php` is already included - just edit it).
2. Edit `config/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'cpaneluser_dogehash');   // your full DB name
define('DB_USER', 'cpaneluser_doge');        // your full DB user
define('DB_PASS', 'your-db-password');
define('SITE_URL', 'https://yourdomain.com'); // no trailing slash
define('APP_KEY', 'paste-a-long-random-string-here');
define('APP_TIMEZONE', 'UTC');
define('APP_DEBUG', false);                   // keep false in production
```

> **Tip:** Generate a random `APP_KEY` - any long, random string (40+ characters).

---

## 4. Upload the Files (cPanel File Manager)

1. Open **File Manager** in cPanel and go to `public_html` (or a subfolder like `public_html/mine` for a sub-path install).
2. Upload the entire project as a ZIP and **Extract** it, or upload the folder contents directly.
3. Make sure these files/folders are at your web root:
   - `index.php`, `register.php`, `login.php`, `ipn.php`, `cron.php`, `.htaccess`
   - `admin/`, `ajax/`, `assets/`, `config/`, `database/`, `includes/`, `uploads/`, `user/`
4. Set the `uploads/` folder permissions to **755** (it must be writable for logo/favicon uploads).

> If you install into a **subfolder**, set `SITE_URL` accordingly, e.g. `https://yourdomain.com/mine`.

---

## 5. First Login

### User side
- Visit `https://yourdomain.com/` and click **Start Mining** to register with a Dogecoin address.

### Admin side
- Visit `https://yourdomain.com/admin/`
- Log in with the demo account:
  - **Username:** `admin`
  - **Password:** `admin123`

### ⚠️ Change the admin password immediately

The demo password must be changed. Generate a new bcrypt hash and update the database:

1. Create a temporary file `makehash.php` at your web root:

   ```php
   <?php echo password_hash('YOUR_NEW_STRONG_PASSWORD', PASSWORD_DEFAULT);
   ```
2. Visit `https://yourdomain.com/makehash.php`, copy the hash.
3. In **phpMyAdmin**, run:

   ```sql
   UPDATE admins SET password_hash = 'PASTE_HASH_HERE' WHERE username = 'admin';
   ```
4. **Delete `makehash.php`** from your server.

---

## 6. Configure Platform Settings (Admin Panel)

After logging into `/admin/`:

- **Mining Settings** - set the formula (`GH/s per DOGE`), daily earning rate, multiplier, bonus GH/s, bonus days, daily bonus reward, and enable/disable mining.
- **Referral Settings** - set the commission percentage (default 20%).
- **CoinPayments** - enter Merchant ID, Public Key, Private Key, IPN Secret, minimum withdrawal, and a cron token.
- **Website Settings** - site name, contact email, logo, favicon, footer, terms, privacy policy.

---

## 7. CoinPayments Setup

1. Sign up at [CoinPayments.net](https://www.coinpayments.net) and complete verification.
2. Go to **Account → API Keys** and create a key with permissions for `create_transaction`.
3. Copy the **Public Key** and **Private Key** into **Admin → CoinPayments**.
4. Find your **Merchant ID** under **Account Settings** and enter it.
5. Under **Account → Coin Acceptance Settings (IPN)**:
   - Set the **IPN Secret** (any strong string) and enter the same value in the admin panel.
   - Set the **IPN URL** to: `https://yourdomain.com/ipn.php`
6. Enable the coins you want to accept (DOGE, LTC, BTC, USDT).

Once configured, hashrate purchases will redirect users to a CoinPayments checkout, and confirmed payments are credited automatically by `ipn.php`.

---

## 8. Set Up the Mining Cron Job

Mining rewards accrue automatically when a user opens their dashboard, but a cron job ensures everyone is credited continuously.

In cPanel open **Cron Jobs** and add one of the following:

**Option A - PHP CLI (preferred):**
```
*/5 * * * * php /home/CPANELUSER/public_html/cron.php >/dev/null 2>&1
```

**Option B - HTTP trigger (set a Cron Token in Admin → CoinPayments first):**
```
*/5 * * * * curl -s "https://yourdomain.com/cron.php?token=YOUR_CRON_TOKEN" >/dev/null 2>&1
```

Replace `CPANELUSER` and the path/token with your real values. Every 5 minutes is recommended.

---

## 9. Go Live Checklist

- [ ] `APP_DEBUG` is `false` in `config/config.php`
- [ ] Admin password changed from `admin123`
- [ ] `APP_KEY` set to a unique random string
- [ ] HTTPS enabled (cPanel → SSL/TLS Status → AutoSSL)
- [ ] CoinPayments keys + IPN URL configured and tested with a small deposit
- [ ] Cron job added and confirmed running (check Admin → Dashboard activity log)
- [ ] `uploads/` is writable (755) and `config/`, `includes/`, `database/` are NOT web-accessible
- [ ] Minimum withdrawal and mining rates reviewed in the admin panel

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| "Database connection failed" | Re-check DB credentials in `config/config.php`. On cPanel the names are prefixed with your account name. |
| Blank white page | Temporarily set `APP_DEBUG` to `true` to see the error, then revert. |
| Logo/favicon won't upload | Ensure `uploads/` is `755` (writable). |
| Payments not crediting | Verify IPN URL is exactly `https://yourdomain.com/ipn.php` and the IPN Secret matches. Check Admin → CoinPayments → IPN Logs. |
| Mining not accruing | Confirm the cron job runs and that "Mining Enabled" is on in Mining Settings. |
| 500 error after upload | Some hosts dislike certain `.htaccess` directives; remove the `<IfModule mod_php.c>` block if needed. |

---

## Support

Review the inline code comments in the `includes/` files - each module is documented. For CoinPayments specifics, see their [API documentation](https://www.coinpayments.net/apidoc).
