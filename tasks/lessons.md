# Lessons Captured During Migration

## Oxfmt Migration

- **Installation requirement**: When updating `package.json` scripts to use `oxfmt`, it's better to install the package as a dev dependency (`npm install -D oxfmt`) to avoid relying on global or `npx` behavior in scripts unless specified.
- **Path quoting**: When deleting multiple files using `rm`, always wrap absolute paths in quotes especially on Windows where spaces are common in project paths.
- **Restoring scripts**: Be careful when replacing scripts in `package.json` to NOT accidentally remove important ones like `"prepare": "husky install"`.
