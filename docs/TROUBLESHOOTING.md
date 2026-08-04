# Troubleshooting & Common Issues

This document covers known development setup issues and their solutions when working with Nora.

---

## Development Setup Issues

### `Error: Electron uninstall` when starting dev server

#### Symptom

When running `npm run dev` or `npm start`, the dev server fails to start with the following error output:

```text
error during start dev server and electron app:
Error: Electron uninstall
    at getElectronPath (.../node_modules/electron-vite/dist/chunks/lib-6EHSwoSb.js:155:19)
    at startElectron (.../node_modules/electron-vite/dist/chunks/lib-6EHSwoSb.js:226:26)
```

#### Cause

`electron-vite` looks for `node_modules/electron/path.txt` to locate the `electron.exe` binary. This error occurs when `path.txt` is missing because Electron's `postinstall` download script (`install.js`) was skipped, interrupted, or blocked (e.g. by a locked `electron.exe` process or network issue during package installation or upgrade).

#### Solution

1. Ensure no background instances of `electron.exe` or Nora are currently running.
2. Manually execute Electron's binary download script:
   ```bash
   node node_modules/electron/install.js
   ```
3. Alternatively, rebuild or force-reinstall Electron:
   ```bash
   npm rebuild electron
   ```
   or
   ```bash
   npm install electron@latest --force
   ```
