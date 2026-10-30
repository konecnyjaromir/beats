# Third-party notices

## ZIP and authentication libraries

ZIP import/export uses `fflate` (MIT), installed through npm. Its license is included in `public/licenses/fflate-LICENSE.txt` and the deployment archives. Google ID-token signatures are verified with `firebase/php-jwt` (BSD-3-Clause), pinned in `composer.lock`; the Composer vendor directory includes its license. Neither library changes the licensing of the drum recordings.

## AVL Black Pearl recordings

`public/samples/*.wav` contains the **BEATS AVL Black Pearl selection**, a subset of AVL Drumkits by Glen MacArthur (2015).

The recordings use **CC BY-SA 3.0 Unported with the author's AVL Drumkits exception**. This permits redistribution in this public repository subject to attribution and the applicable share-alike requirements. The author's exception allows produced music and other non-sample-library works to be licensed freely. Modified sample libraries must use a different name.

See [the detailed attribution](public/samples/ATTRIBUTION.md), [original author notice](public/samples/AVL-Drumkits-License.pdf), [full legal code](public/samples/CC-BY-SA-3.0.txt), and [checksummed manifest](public/samples/manifest.json).

No WAV files were changed from the pinned distribution source. Gain shaping happens only during playback. The original author's notice is retained with the files in production builds and update archives.

## Upstream sample repository

The source repository metadata carries an MIT notice, retained in `public/samples/UPSTREAM-REPOSITORY-LICENSE.txt`. That notice does **not** relicense the AVL recordings. `SOURCE.md` is the upstream repository README, retained as provenance; kits mentioned there other than AVL Black Pearl are not bundled here.

## Software dependencies

React, React DOM, Vite, Prettier and the PHP Prettier plugin retain their own licenses. Exact versions and dependency trees are recorded in `package-lock.json`; dependency license files are available in their installed packages. The sample license is not a blanket license for the application source code.

## Font

The UI optionally requests DM Sans from Google Fonts. No font binaries are redistributed in this repository; the browser falls back to system fonts when the external font is unavailable.
