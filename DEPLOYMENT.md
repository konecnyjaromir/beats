# Deployment

## Administrator

Set the single `admin_email` value in your private `beats-services.php` to the administrator's verified Google email. For example: `'admin_email' => 'owner@example.com',`. Empty or missing disables administration; this is not a list and grants no access to other accounts. Administration is available only in MySQL/Google mode. The sidebar link shows a read-only, paginated user list with names, emails and saved-loop counts, including zero. Authorization is checked against the current database session and configuration on every admin request. No schema migration is needed.

Code-only `beats-update.zip` deliberately excludes private configuration. When enabling this feature, also update `beats-services.php` (the private `beats-server.zip` includes the configured copy). Do not publish that file or archive.

## MySQL and Google sign-in

Use PHP 8.2+ with `pdo_mysql`, `openssl`, `curl`, and `mbstring`, and MySQL 5.7+/8 or MariaDB 10.2+ with InnoDB. PHP must be able to reach Google's HTTPS certificate endpoint. The database password stays in the guarded `beats-services.php` file; never publish this file in Git.

1. Copy `beats-services.example.php` to `beats-services.php` and select `'mode' => 'mysql'`.
2. Set the database host, port, database name, username, password and table `prefix` (default `beats_`). The database itself must already exist. Prefixes may contain only ASCII letters, numbers and underscores, up to 40 characters; an empty prefix is allowed.
3. Set `google.client_id` to a **Web application** client from Google Auth Platform. Add the website origin, e.g. `https://your-domain.example`, without `/beats`, to Authorized JavaScript origins. This integration uses a JavaScript callback; no redirect URI or client secret is required. For local browser testing, also authorize your localhost origin and port.
4. Configure Google branding/audience and publish the app for the intended audience. Only `openid`, email and profile identity are used. The site includes `privacy.html`; review it and add your operator identity, contact information, retention periods and backup practices before public launch. Set its URL in Google's branding settings.
5. Leave `allowed_emails` empty for open registration, or supply an allowlist of verified Google email addresses. Accounts are identified by Google's stable `sub`, not by their email address.
6. Run `composer install --no-dev --prefer-dist`, `npm ci`, `npm run build`, then `npm run package:server`.
7. Extract **`beats-server.zip` locally** and upload its contents into `beats/`. Do not upload the ZIP itself to a public directory: it contains your database password. The ZIP includes dependencies and the private service configuration, but no saved user loops. Keep the existing `private/` directory and do not delete files absent from the archive.
8. Ensure PHP can write `beats/private/` for Google's public certificate cache. Open the app over HTTPS and sign in. The first database connection creates `<prefix>users` and `<prefix>loops` if they are missing. The database user needs `CREATE` and normal CRUD privileges for this initial setup. Existing tables are never dropped or truncated.

After installation, you can set `database.auto_create_tables` to `false` and use an account with only CRUD privileges. If automatic creation is unavailable, run `php database/manage.php schema` locally to generate SQL with your configured prefix, then import it using your host's database administration tool. `php database/manage.php install` is an optional CLI alternative. These tools refuse HTTP requests.

The account quota is configured independently of the language:

```php
'limits' => ['max_loops' => 1000, 'max_bars' => 1000],
```

The quota applies to each Google account. Changing the limit does not delete existing data. New loops (including copies/imports) are rejected at the loop quota; existing loops can still be updated. Bar limits are checked on every save. In JSON mode the loop quota applies to the shared library. Each JSON API request is limited to 16 MiB; configure the host's `post_max_size` and request-body limit to at least 20 MiB to allow maximum-size loops. Every database list/read/update/delete is scoped to the signed-in owner. Session cookies are HttpOnly, Secure on HTTPS, and SameSite=Lax; writes require a same-origin CSRF token.

For the first migration, sign in as the intended owner and use **Import JSON / ZIP**. A prepared import ZIP should contain ordinary JSON files, one loop per file. Existing `.json.php` storage files must have their PHP guard removed before importing; never execute an uploaded PHP file. Keep the original files as a backup. Import never preserves server IDs or assigns another user's ownership. There is no automatic assignment of legacy shared loops to the first person who signs in.

Use `beats-update.zip` for later code updates: it excludes `beats-services.php` and does not replace database credentials. Both archives include your current language setting. Back up the MySQL database and all private configuration files separately. The old JSON + Basic Auth variant remains available with `mode = json`.

### Verification

`npm run test:api` tests the file backend. `npm run test:mysql` uses a local MySQL/MariaDB server and creates/removes a randomly named `beats_test_*` database; never point it at a production account. Configure `BEATS_TEST_DB_HOST`, `BEATS_TEST_DB_PORT`, `BEATS_TEST_DB_USER`, and `BEATS_TEST_DB_PASSWORD` if needed (defaults are localhost:13306 and test-only credentials). Tests use locally signed test tokens with an isolated certificate cache; production code has no test-login bypass. A real Google browser sign-in must still be verified on the authorized deployment domain.

## Fresh installation

1. Configure `beats-auth.php` and `beats-config.php` using the example files. See the [README](README.md#language-configuration) for English/Czech settings.
2. Run `npm ci`, `composer install --no-dev --prefer-dist` and `npm run build`.
3. Upload the **contents** of `dist/` to your host's `beats/` directory, including hidden `.htaccess` files.
4. Give the PHP process write access to `beats/private/`. Do not make the whole application writable.
5. Visit `https://your-domain.example/beats/` and sign in with a configured account.

Everything required at runtime lives inside the application directory:

```text
beats/
  index.php
  beats-auth.php
  beats-config.php
  .htaccess
  api/
  assets/
  samples/
  private/
    .htaccess
    index.php
    <loop-id>.json.php
```

The host must execute PHP files. Do not publish this directory on static-only hosting. Apache uses `.htaccess` to deny direct access to authentication configuration and private storage. PHP guards also return no data for direct requests, including on the PHP development server, which does not process `.htaccess`. On Nginx, configure PHP handling and deny direct access to `/beats/private/` at the server level as defense in depth.

For Apache/FastCGI, the supplied rewrite rule forwards the Authorization header. If valid credentials repeatedly prompt, check the host's Authorization forwarding configuration.

## Updating an existing installation

Back up the installation's `private/`, `beats-auth.php` and `beats-config.php` first.

```sh
npm run build
npm run package:update
```

Extract `beats-update.zip` and upload its contents into the existing `beats/` directory, replacing matching files. **Do not enable deletion of files missing from the archive.**

The archive includes `index.php`, `api/`, `assets/`, `samples/` and `beats-config.php`. It excludes `private/` and `beats-auth.php`, so it does not replace saved loops or authentication credentials. It intentionally updates the configured UI language. If migrating from the old static entry, remove the obsolete `beats/index.html`.

Existing loops remain compatible. Legacy global time signatures are applied to their bars when read; a read does not rewrite the stored file. Local rebuilds preserve existing `dist/private/*.json.php` files, but avoid rebuilding while the local server is actively saving loops.

## Sign-in troubleshooting

New Google accounts receive six editable starter rhythms, including a mixed-subdivision triplet example and a twelve-bar blues shuffle. They are inserted in the registration transaction, limited by the configured account/bar quotas. Existing accounts are never reseeded on login. The public demo uses the same examples in an isolated in-memory library and opens the triplet example automatically. Demo edits never reach the database; export JSON/ZIP before leaving or reloading.

Signed-in users can permanently delete their account with confirmation. The operation uses the session owner's ID and CSRF protection, removes their loops through the database foreign-key cascade, and clears the session. Other sessions lose access because their user no longer exists. Backup retention remains the operator's responsibility. Signing in again creates a new account with fresh starter rhythms.

Server failures display a safe diagnostic reference, also recorded in the PHP error log. No database credentials, token contents or exception messages are returned to the browser.

- `AUTH_GOOGLE_CERTIFICATES`: check outbound HTTPS to `www.googleapis.com`, PHP's CA certificate configuration and access to `private/`.
- `AUTH_PHP_CURL`, `AUTH_PHP_OPENSSL`, `AUTH_PHP_MBSTRING`, `AUTH_PHP_PDO_MYSQL`: enable the named PHP extension for the website's PHP version.
- `AUTH_GOOGLE_LIBRARY`: upload the packaged `vendor/` directory and use PHP 8.2 or newer.
- `AUTH_DATABASE_1045`: check database credentials and host access permissions. `AUTH_DATABASE_1049`: check the database name. `AUTH_DATABASE_2002`: check the database host, port and connectivity. `AUTH_DATABASE_1142`: check table privileges, including initial `CREATE`. Other `AUTH_DATABASE` codes identify a database/configuration failure; consult the hosting provider using that numeric code.
- `AUTH_SESSION`: check PHP session storage and cookie configuration.
- `AUTH_CONFIG`: check the guarded service configuration file.

The application stores the Google account ID, email and display name. It does not store or display the profile picture, although Google's standard profile consent can include it.

## Language

Edit `beats/beats-config.php` and reload the page:

```php
return ["language" => "en"]; // English (default)
// return ['language' => 'cs']; // Czech
```

Retain the file's PHP direct-access guard. Keep the project-root configuration in sync so the next build does not revert your preference. Existing loop names are unaffected.

## Storage and backups

Loops contain JSON behind a short PHP guard and use `.json.php` filenames. The guard terminates direct web requests before the JSON payload. Writes use a temporary guarded file and an atomic rename under a write lock.

Back up `private/` together with both configuration files. To restore a loop, copy its original `<32-character-id>.json.php` file into `private/` and reload the library. Do not upload raw JSON files to publicly readable locations.

## Access model

All Basic Auth users have equal access to the shared library, including deletion. The browser manages credential caching; the application does not provide a simulated logout button. Use HTTPS for public deployments and a separate browser profile or private window to switch accounts. Add rate limiting at the web server if needed.
