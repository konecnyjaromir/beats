# Contributing

Use English for issue descriptions, commit messages and documentation. UI changes must support both English and Czech through `src/translations.js`; do not translate user-authored names or change stable instrument IDs.

Before proposing a change:

1. Run `npm ci` and configure local credentials using the example files.
2. Run `npm test`, `npm run build` and `npm run test:api`.
3. Preserve compatibility with saved loops and test data migrations without touching live files.
4. Check `git diff --cached` for accidental credentials, generated artifacts or user data.

Never commit `beats-auth.php`, `beats-config.php`, private loops, exports or runtime binaries. Do not include private credentials in issues. Keep sample attribution and licensing intact when changing audio assets.
