# BEATS

A browser-based drum sequencer built with React, Web Audio and PHP. Create acoustic drum loops with independent row subdivisions, mixed time signatures and three recorded velocity layers per instrument.

## Features

- 18 drum and percussion sounds from AVL Black Pearl, bundled locally with attribution.
- Three hit strengths, including quiet ghost notes. Each strength uses a separate recording; additional gain shaping widens the dynamic range.
- Independent time signatures for every bar: 3–8 beats over quarter, eighth or sixteenth notes.
- 1–64 equally spaced steps per row, up to 32 rows per bar and 64 bars per loop.
- Tempo from 30 to 300 BPM, measured in quarter notes per minute.
- Loop playback with a moving playhead and automatic navigation to the active bar.
- Searchable loop library, collapsible sidebar, fullscreen mode and responsive layout.
- PHP storage without a database, HTTP Basic Authentication and configuration-based English/Czech localization.

## Requirements

- Node.js 20.19+ or 22.12+ for building the frontend.
- PHP 8.1+ for serving the application and running API tests.
- A PHP-capable web host; HTTPS is required for public deployments using Basic Auth.

Node.js is not needed on the production host.

## Quick start

```sh
npm ci
cp beats-auth.example.php beats-auth.php
cp beats-config.example.php beats-config.php
```

Configure at least one user in `beats-auth.php`. Generate a password hash locally using PHP's `password_hash()` function, then paste **only the hash** into the users map:

```php
return [
  "users" => [
    "your-username" => "PASTE_PASSWORD_HASH_HERE",
  ],
];
```

Keep the direct-access guard supplied by the example file. Do not put plaintext passwords in the configuration. Both real configuration files are ignored by Git; only their examples belong in the repository.

```sh
npm run build
php -S 127.0.0.1:8080 -t dist
```

Open [localhost:8080](http://localhost:8080). The browser displays its native Basic Auth prompt before opening the studio. All configured users share the same loop library.

On Windows, `./start.ps1` builds and serves the application. It uses `.runtime/php/php.exe` when available, otherwise PHP from `PATH`. The portable runtime is a local convenience and is not included in this repository.

## Language configuration

**English is the default.** There is no language switch in the interface. Set the language in `beats-config.php`:

```php
<?php
if (!defined("BEATS_INTERNAL")) {
  http_response_code(404);
  exit();
}
return ["language" => "en"]; // 'en' = English, 'cs' = Czech
```

To switch to Czech, change `'en'` to `'cs'`. To switch back, use `'en'` again. Missing or unsupported values fall back to English.

- **Before building:** edit the project-root `beats-config.php`, then run `npm run build`. The build copies your configuration into `dist/`.
- **On the host:** edit `beats/beats-config.php` directly and reload the page. No rebuild is required. Mirror this change in your local configuration before the next deployment.
- UI labels, instrument names, accessibility labels, default names and API errors follow the selected language. Existing user-authored loop names and musical data are never translated or rewritten.
- Your local configuration is not committed. A deployment can therefore remain Czech while the public repository defaults to English.

The frontend receives only the selected language through an authenticated configuration endpoint. Password hashes are never sent to it.

## Using the sequencer

Click a step to cycle through off, soft, medium and strong. A row's divisions always cover the **whole bar**: in 4/4, 16 divisions produces sixteenth notes and 3 produces a half-note triplet. Use 12 for an eighth-note triplet grid or 24 for sixteenth-note sextuplets.

Select a bar before changing its time signature. New bars inherit the selected bar's signature; duplicates preserve its instruments, hits and signature. Editing the rhythm stops playback. Tempo can be typed freely and is committed on Enter or blur; Escape restores its previous value.

The application always starts on the home screen with no loop open. Create a blank loop or open a saved loop from the home-screen cards or sidebar. Clicking the BEATS logo returns home and stops playback; leaving unsaved edits requires confirmation. Refreshing does not automatically reopen a loop or a browser-local draft.

Save updates the selected saved loop; Save a copy creates another one. The library is stored on the PHP server. Search ignores case and accents and is available on both the home screen and sidebar. The sidebar remembers its collapsed state. Fullscreen depends on browser support and can be exited with Escape.

## Deployment and updates

See [DEPLOYMENT.md](DEPLOYMENT.md) for the single-directory hosting layout, permissions, safe updates and backups.

```sh
npm run build
npm run package:update
```

The update archive contains frontend assets, PHP API files, samples and the language configuration. It deliberately excludes authentication credentials and saved loops. It does replace the host's language setting with your local build's setting.

## Development

```sh
# Terminal 1
php -S 127.0.0.1:8080 -t public
# Terminal 2
npm run dev
```

Vite proxies `/api` to PHP. Configure `beats-auth.php` and `beats-config.php` in the project root first. The development entry page is served by Vite; its configuration and library API still require Basic Auth.

```sh
npm test
npm run build
npm run test:api
```

Set `PHP_BIN` to the PHP executable if it is not on `PATH`. API tests start a temporary server on port 18081 with test-only credentials. They do not change real accounts or stored loops. Tests cover mixed-meter timing, legacy data, localization, authentication, direct-file protection and CRUD operations for all instruments.

## Project layout

| Path              | Purpose                                                  |
| ----------------- | -------------------------------------------------------- |
| `src/`            | React UI, translation dictionary and Web Audio scheduler |
| `public/api/`     | Authenticated PHP API and validation                     |
| `public/samples/` | Acoustic WAV samples and attribution                     |
| `public/private/` | Storage protection files; user loops are ignored         |
| `scripts/`        | Production build and safe update packaging               |
| `tests/`          | Timing, translation and API regression tests             |
| `*.example.php`   | Public configuration templates without credentials       |

Generated builds, dependencies, portable runtimes, private configurations, loop exports and user data are excluded from version control.

## Sample attribution

The WAV files are from AVL Black Pearl by Glen MacArthur / AVL Drumkits, distributed under **CC BY-SA 3.0 with the author's AVL Drumkits exception**. Public redistribution is permitted when the attribution and license conditions are preserved. The author explicitly permits produced music and other non-sample-library works to be licensed freely; modified sample libraries remain subject to share-alike and must use a different name.

See [sample attribution](public/samples/ATTRIBUTION.md) and [third-party notices](THIRD_PARTY_NOTICES.md). The original author notice, full license text and a checksummed source manifest are bundled with the recordings. The sample license is separate from the repository source code; the upstream sample-repository MIT notice does not relicense the WAV files.
