# BEATS

A browser-based drum sequencer built with React, Web Audio and PHP. Create acoustic drum loops with independent row subdivisions, mixed time signatures and three recorded velocity layers per instrument.

## Features

- 18 drum and percussion sounds from AVL Black Pearl, bundled locally with attribution.
- Three hit strengths, including quiet ghost notes. Each strength uses a separate recording; additional gain shaping widens the dynamic range.
- Independent time signatures for every bar: 1–24 beats over quarter, eighth or sixteenth notes.
- 1–64 equally spaced steps per row, up to 32 rows per bar and 1,000 bars per loop by default.
- Tempo from 30 to 300 BPM, measured in quarter notes per minute.
- Loop playback with a moving playhead and automatic navigation to the active bar.
- Searchable loop library, collapsible sidebar, fullscreen mode and responsive layout.
- Two configurable backends: JSON files with shared Basic Auth access, or MySQL with Google sign-in and private per-user libraries.
- JSON, MIDI and percussion-score PDF export of the open loop, ZIP export of the entire library, and batch JSON/ZIP import.
- No-registration demo in Google mode: six editable examples, opening with simultaneous straight eighth notes and triplets. Demo edits stay in page memory and can be exported.
- Six starter rhythms for new Google accounts, including a twelve-bar blues shuffle with a final fill; confirmed account deletion removes the private library.
- Configurable limits (default: 1,000 loops per account and 1,000 bars per loop) and English/Czech localization.

## Requirements

- Node.js 20.19+ or 22.12+ for building the frontend.
- PHP 8.2+ with OpenSSL, cURL and mbstring; PDO MySQL for the database mode.
- Composer for installing PHP dependencies locally. The server ZIP includes them; Composer is not needed on the host.
- A PHP-capable web host; HTTPS is required for public deployments using Basic Auth.

Node.js is not needed on the production host.

## Quick start

```sh
npm ci
composer install --no-dev --prefer-dist
cp beats-auth.example.php beats-auth.php
cp beats-config.example.php beats-config.php
cp beats-services.example.php beats-services.php
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

The frontend receives the language, public Google client ID, authentication mode and limits. Database credentials and password hashes are never sent to it.

## Using the sequencer

Click a step to cycle through off, soft, medium and strong. A row's divisions always cover the **whole bar**: in 4/4, 16 divisions produces sixteenth notes and 3 produces a half-note triplet. Use 12 for an eighth-note triplet grid or 24 for sixteenth-note sextuplets.

Select a bar before changing its time signature. New bars inherit the selected bar's signature; duplicates preserve its instruments, hits and signature. Editing the rhythm stops playback. Tempo has repeatable minus/plus buttons and a dialog with numeric entry and a slider. An optional USB-adapter warm-up plays a soft rim hit 500 ms before starting the loop.

The application always starts on the home screen with no loop open. Create a blank loop or open a saved loop from the home-screen cards or sidebar. Clicking the BEATS logo returns home and stops playback; leaving unsaved edits requires confirmation. Refreshing does not automatically reopen a loop or a browser-local draft.

Save updates the selected saved loop; Save a copy creates another one. The library is stored on the PHP server. Search ignores case and accents and is available on both the home screen and sidebar. The sidebar remembers its collapsed state. Fullscreen depends on browser support and can be exited with Escape.

## Deployment and updates

For MySQL + Google sign-in, follow [the database setup guide](DEPLOYMENT.md#mysql-and-google-sign-in). Set `mode` to `mysql` in `beats-services.php`; omit that file or use `json` to keep the original shared file library. The table prefix, allowed Google emails, and limits are configurable. These modes do not automatically merge or transfer user data.

The import button accepts multiple JSON files or a ZIP containing JSON files. The format remains the original loop object (`name`, `bpm`, global meter and `bars`); no proprietary wrapper is added. Import creates new loop IDs and never overwrites existing loops. The UI reports partial progress if a server error interrupts a batch. Import limits are 16 MB per JSON file and 64 MB per batch after decompression. Export uses compact JSON; a ZIP contains one JSON file per loop, including loops hidden by the current search. Export of the open loop includes unsaved edits.

The editor's **Export** button opens a format dialog, also available in demo mode:

- **JSON** preserves the original editable format, including muted rows.
- **MIDI** creates a type-1 Standard MIDI File with General MIDI percussion on channel 10, tempo, meter changes and three velocity levels (40, 85, 120). Muted rows are omitted. Timing uses 960 ticks per quarter note; uncommon subdivisions are rounded to the nearest tick. MIDI contains notes, not the bundled audio samples, so sound depends on the receiving instrument.
- **PDF** creates a landscape percussion score with all instruments on a shared five-line drum staff. Independent subdivisions use tuplets, soft hits use parentheses and strong hits use accents. Note/rest lengths represent grid slots. Large scores continue over multiple pages; dense bars are scaled to fit. Muted rows are omitted. Instrument positions and noteheads are explained in an included legend. Rows sharing the same subdivision and stem direction are combined into chords; other subdivisions remain independent voices on the same staff. Silent rows are omitted. PDF libraries are loaded only when selected; generation stays in the browser.

Import remains JSON/ZIP only. Keep JSON when you need an editable backup.

**Repeat loop** is on by default. Turning it off during playback finishes the current loop pass without starting another; it can also be turned back on before playback ends. **Play bar** plays the currently selected bar once, independent of the repeat setting. Natural completion lets the final sample decay; the Stop button cancels playback immediately.

The four transport controls share a two-by-two button layout. Repeat and USB warm-up are toggle buttons; enabling warm-up still opens its confirmation dialog. **Add bar** inherits the final bar's meter, instrument order, subdivisions and mute settings with empty hits. **Duplicate** also copies the hits. Drag a bar card before or after another card to reorder the arrangement, or focus it and press Alt + Left/Right. Reordering stops playback and preserves the selected bar and all its content.

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
 # Optional: requires an isolated local MySQL/MariaDB test server.
npm run test:mysql
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

## Build identification

The footer displays the application version and an incremental build number, for
example `v1.0.0+1`. Each successful `npm run build` increments `build-version.json`.
Commit that file with the release. The number is embedded in the JavaScript bundle
so it identifies the code actually loaded by the browser. Creating the update ZIP
does not increment it again. The PHP entry page disables caching so a reload after
deployment requests the current bundle.
