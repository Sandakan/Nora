---
name: native-engine-workflow
description: >-
  Workflows, build procedures, and troubleshooting guidelines for Nora's native Rust audio engine (audio-engine).
  Use when building, testing, modifying, or debugging the Rust audio engine or its N-API bindings.
---

# Native Audio Engine Workflow

This skill outlines development, testing, and building procedures for Nora's native Rust audio engine (`audio-engine`) powered by `cpal`, `symphonia`, `rubato`, and `napi-rs`.

## Prerequisites & Environment

1. **Rust Toolchain**: Edition 2021 toolchain (`rustc`, `cargo`).
2. **Platform Build Tools**:
   - Windows: MSVC C++ Build Tools (`windows-msvc` target).
   - macOS: Xcode Command Line Tools.
   - Linux: `build-essential`, `pkg-config`, `libasound2-dev`.
3. **Workspace Dependencies**:
   Always verify `audio-engine` dependencies are installed before building:
   ```bash
   npm install -w audio-engine
   ```

## Build Commands

From the repository root:

- **Release Build** (recommended for production / testing performance):
  ```bash
  npm run build:engine
  ```
  Generates binary in `audio-engine/dist/audio-engine.<platform>.node`.
- **Debug Build** (faster compilation, unoptimized, debug symbols):
  ```bash
  npm run build:engine:debug
  ```

From `audio-engine/` directory:

- **Explicit N-API Build**:
  Always use `--package=@napi-rs/cli` to prevent npm from attempting registry lookups on the unversioned `napi` package:
  ```bash
  npx --package=@napi-rs/cli napi build --platform -o dist --release
  ```

## Testing & Diagnostics

### 1. Rust Unit and Integration Tests

Run engine, DSP filter, and resampler tests:

```bash
cd audio-engine
cargo test
```

### 2. Interactive CLI Player

Test playback of a specific audio file directly through the terminal:

```bash
cd audio-engine
cargo run --example cli_player -- "path/to/song.mp3"
```

### 3. Interactive Web UI Test Server

Launch the test HTTP server to test playback, EQ sliders, volume ramping, and position tracking in a browser interface:

```bash
cd audio-engine
npm run test:ui
```

Open `http://localhost:3333` in a web browser.

## Troubleshooting

### `npm error code ENOVERSIONS` / `No versions available for napi`

- **Cause**: `@napi-rs/cli` was not installed in `node_modules` or `node_modules/.bin/napi` is missing, causing `npx` to query the npm registry for package `napi`.
- **Fix**:
  1. Run `npm install -w audio-engine`.
  2. Always qualify the package with `npx --package=@napi-rs/cli napi`.
