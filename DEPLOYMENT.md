# Deployment

## Fresh installation

1. Configure `beats-auth.php` and `beats-config.php` using the example files. See the [README](README.md#language-configuration) for English/Czech settings.
2. Run `npm ci` and `npm run build`.
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
