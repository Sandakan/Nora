# Repository Operating Guidelines

## NPM Workspaces & Native Dependencies
- **Workspace Dependencies**: When building sub-packages or workspaces (such as `audio-engine`), ensure workspace dependencies are installed (`npm install -w <workspace>` or `npm install`). Never assume sub-package devDependencies are hoisted unless verified.
- **Scoped CLI Binaries with `npx`**: When invoking tools where the executable name differs from the package name (e.g., `@napi-rs/cli` providing the `napi` binary), always specify `--package=<pkg>` (e.g. `npx --package=@napi-rs/cli napi ...`). Never use bare `npx <cmd>` if `<cmd>` does not match the package name, as npm will attempt to fetch an invalid/unrelated package from the registry upon local cache misses.
- **Native Audio Engine Builds**:
  - Release build: `npm run build:engine` (produces `audio-engine/dist/audio-engine.<platform>.node`)
  - Debug build: `npm run build:engine:debug`
  - Unit/integration tests: `cd audio-engine && cargo test`
