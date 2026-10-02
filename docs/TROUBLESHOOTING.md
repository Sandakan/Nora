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

---

### `npm error code ENOVERSIONS` / `No versions available for napi` when building audio engine

#### Symptom

When executing `npm run build:engine` or `npm run build:engine:debug`, the build fails immediately with:

```text
npm error code ENOVERSIONS
npm error No versions available for napi
```

#### Cause

1. **Uninstalled Workspace Dependencies**: The `audio-engine` directory is configured as an npm workspace. If `npm install` has not been run for the workspace, the `@napi-rs/cli` package and its `napi` binary symlink are missing from `node_modules/.bin`.
2. **Package Name vs Binary Name Mismatch**: The CLI executable is named `napi`, but the actual npm package is scoped as `@napi-rs/cli`. When `npx napi` is called without local binary availability, `npx` attempts to resolve and download a package named `napi` from the npm registry. The registry contains an empty/unversioned `napi` package, throwing `ENOVERSIONS`.

#### Solution

1. Install the workspace dependencies from the root repository:
   ```bash
   npm install -w audio-engine
   ```
2. In npm scripts or CLI execution, always qualify the package explicitly using `--package=@napi-rs/cli`:
   ```bash
   cd audio-engine && npx --package=@napi-rs/cli napi build --platform -o dist --release
   ```
3. Re-run the engine build to verify:
   ```bash
   npm run build:engine
   ```

