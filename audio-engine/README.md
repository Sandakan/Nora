# Nora Native Audio Engine (`audio-engine`)

A high-performance, cross-platform native Rust audio engine built for **Nora Music Player**. Powered by [`cpal`](https://crates.io/crates/cpal), [`symphonia`](https://crates.io/crates/symphonia), [`rubato`](https://crates.io/crates/rubato), and [`napi-rs`](https://napi.rs/).

---

## 🎯 Overview & Motivation

Chromium's built-in HTML5 `<audio>` player presents several challenges for high-fidelity desktop music playback:

- **Codec & Format Restrictions**: Chromium lacks native support for uncompressed or proprietary containers depending on platform builds and OS codecs.
- **Sample Rate & Output Device Switching**: HTML5 Audio relies on OS-level WebAudio/WASAPI shared mode abstractions, causing potential resampler degradation or output switching dropouts.
- **Latency & Pitch Shifts**: Changing playback speed in browser engines often introduces pitch warping or buffer underruns.

To eliminate these issues, a Rust-based native audio engine was introduced. It interfaces directly with host OS audio APIs via Node-API bindings, providing robust playback, custom DSP processing, and fine-grained hardware control.

---

## ✨ Features

- 🎧 **Universal Format Decoding**: Gapless decoding of MP3, FLAC, WAV, OGG, AAC, M4A, Opus, and more using Symphonia.
- 🎚️ **10-Band Parametric Equalizer**: Real-time audio equalization across 10 ISO standard frequencies using Robert Bristow-Johnson (RBJ) Cookbook Peaking Biquad filters.
- ⚡ **Pitch-Preserving Speed Adjustment**: Overlap-Add (OLA) time-stretching combined with Rubato SincInterpolation resampling for smooth speed control (0.25x – 4.0x) without pitch distortion.
- 🔊 **Smooth Volume Ramping**: Linear volume control and configurable duration ramping (ms-level) to avoid audio clicks/pops on play, pause, seek, and track transitions.
- 🎙️ **Hardware Device Selection**: Enumeration and seamless switching between active audio output endpoints (WASAPI, CoreAudio, ALSA/PulseAudio).
- ⏱️ **Thread-Safe Position Tracking**: Asynchronous position ticker running on a dedicated thread, emitting tick callbacks to Node.js without blocking the main event loop.
- 🌉 **High-Performance Node-API (N-API) Bindings**: Zero-overhead C-ABI interface between Node.js / Electron main process and Rust engine.

---

## 🏗️ Architecture & Module Structure

```
audio-engine/
├── Cargo.toml                  # Rust crate configuration & dependencies
├── package.json                # npm workspace & N-API target settings
├── build.rs                    # napi-build build script
├── test_server.js              # Interactive Web UI test server
├── examples/
│   └── cli_player.rs           # Interactive CLI audio player example
├── tests/
│   └── audio_engine_tests.rs   # Integration tests for DSP, resampler & engine
└── src/
    ├── lib.rs                  # N-API bindings & exported JavaScript functions
    ├── engine.rs               # Main audio player engine & thread management
    ├── dsp.rs                  # 10-band EQ chain & biquad filter logic
    ├── resampler.rs            # Rubato resampler & Overlap-Add (OLA) time-stretcher
    ├── devices.rs              # System output audio device manager
    └── ticker.rs               # Asynchronous position ticker thread
```

### Module Responsibilities

| File                                                                                                                                     | Description                                                                                                                                                                        |
| :--------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`lib.rs`](file:///c:/Users/adsan/Documents/My%20Projects/Projects/Desktop%20App%20Development/Nora/audio-engine/src/lib.rs)             | Defines global engine state `GLOBAL_ENGINE` wrapped in `Arc<Mutex<PlayerEngine>>` and exposes JavaScript functions via `#[napi]`.                                                  |
| [`engine.rs`](file:///c:/Users/adsan/Documents/My%20Projects/Projects/Desktop%20App%20Development/Nora/audio-engine/src/engine.rs)       | Handles stream initialization, file format probing, decoding loops, frame feeding to `cpal` audio output buffers, seeking, volume ramps, and lifecycle state.                      |
| [`dsp.rs`](file:///c:/Users/adsan/Documents/My%20Projects/Projects/Desktop%20App%20Development/Nora/audio-engine/src/dsp.rs)             | Implements `BiquadFilter` and `EqChain` for 10-band equalization across center frequencies: **60Hz, 170Hz, 310Hz, 600Hz, 1kHz, 3kHz, 6kHz, 12kHz, 14kHz, 16kHz** (-24dB to +24dB). |
| [`resampler.rs`](file:///c:/Users/adsan/Documents/My%20Projects/Projects/Desktop%20App%20Development/Nora/audio-engine/src/resampler.rs) | Implements `OlaStretcher` for OLA time-stretching and `SpeedResampler` wrapping Rubato's `SincFixedIn` for sample rate matching and rate adjustment.                               |
| [`devices.rs`](file:///c:/Users/adsan/Documents/My%20Projects/Projects/Desktop%20App%20Development/Nora/audio-engine/src/devices.rs)     | Queries host platform audio devices via `cpal::Host` and selects target output interfaces.                                                                                         |
| [`ticker.rs`](file:///c:/Users/adsan/Documents/My%20Projects/Projects/Desktop%20App%20Development/Nora/audio-engine/src/ticker.rs)       | Manages background thread interval polling (250ms default) for position and playback status updates.                                                                               |

---

## 📡 JavaScript API Reference (Node-API)

The native module exports the following functions when imported via `require('./dist/index.js')` or `import`:

| Function                                           | Parameters                                | Return Type | Description                                                       |
| :------------------------------------------------- | :---------------------------------------- | :---------- | :---------------------------------------------------------------- |
| `ping()`                                           | None                                      | `string`    | Returns `"pong from audio-engine"` to verify binary binding load. |
| `engine_play(path)`                                | `path: string`                            | `void`      | Opens and begins playback of an audio file path.                  |
| `engine_pause()`                                   | None                                      | `void`      | Pauses playback.                                                  |
| `engine_resume()`                                  | None                                      | `void`      | Resumes playback from current position.                           |
| `engine_stop()`                                    | None                                      | `void`      | Stops playback and releases active stream resources.              |
| `engine_seek(position_secs)`                       | `position_secs: number`                   | `void`      | Seeks playback to specified timestamp in seconds.                 |
| `engine_set_volume(volume)`                        | `volume: number`                          | `void`      | Sets linear volume level (`0.0` = mute, `1.0` = 100%).            |
| `engine_set_volume_with_ramp(target, duration_ms)` | `target: number`, `duration_ms: number`   | `void`      | Ramps volume to `target` over specified milliseconds.             |
| `engine_get_position()`                            | None                                      | `number`    | Returns current playback position in seconds.                     |
| `engine_get_duration()`                            | None                                      | `number`    | Returns total track duration in seconds.                          |
| `engine_list_devices()`                            | None                                      | `string[]`  | Returns array of available system output device names.            |
| `engine_set_device(device_name)`                   | `device_name: string`                     | `void`      | Switches output device to specified device name.                  |
| `engine_set_playback_rate(rate)`                   | `rate: number`                            | `void`      | Sets playback speed (clamped between `0.25` and `4.0`).           |
| `engine_set_eq_band(frequency_hz, gain_db)`        | `frequency_hz: number`, `gain_db: number` | `void`      | Modifies gain for closest EQ band (`gain_db` clamped [-24, +24]). |
| `engine_reset_eq()`                                | None                                      | `void`      | Resets all 10 EQ bands to 0dB (flat response).                    |
| `engine_destroy()`                                 | None                                      | `void`      | Destroys engine instance and halts playback.                      |

---

## 🛠️ Development & Building

### Prerequisites

- **Rust**: Edition 2021 toolchain (`rustc`, `cargo`).
- **Node.js**: v18+ with `npm`.
- **Build Tools**: Standard platform C++ build tools (MSVC on Windows, Xcode CLI Tools on macOS, `build-essential` on Linux).

### Build Commands

#### From Root Project (`Nora/`)

```bash
# Build native release binary for the current platform
npm run build:engine

# Build native debug binary
npm run build:engine:debug
```

#### From `audio-engine/` Directory

```bash
# Build release binaries into ./dist
npx napi build --platform -o dist --release

# Run Rust unit & integration tests
cargo test

# Run interactive Rust CLI player
cargo run --example cli_player -- "path/to/song.mp3"

# Start web-based interactive test server (HTTP localhost:3333)
npm run test:ui
```

---

## 🌐 Target Support Matrix

Configured targets in [`package.json`](file:///c:/Users/adsan/Documents/My%20Projects/Projects/Desktop%20App%20Development/Nora/audio-engine/package.json):

- `x86_64-pc-windows-msvc` (Windows 64-bit)
- `aarch64-pc-windows-msvc` (Windows ARM64)
- `x86_64-apple-darwin` (macOS Intel)
- `aarch64-apple-darwin` (macOS Apple Silicon)
- `x86_64-unknown-linux-gnu` (Linux x64)
