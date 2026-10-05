pub mod devices;
pub mod dsp;
pub mod engine;
pub mod logger;
pub mod resampler;
pub mod ring_buffer;
pub mod ticker;

use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi_derive::napi;
use std::sync::{Arc, Mutex, Weak};
use lazy_static::lazy_static;

use engine::PlayerEngine;

lazy_static! {
    static ref GLOBAL_ENGINE: Arc<Mutex<PlayerEngine>> = {
        let engine = Arc::new(Mutex::new(PlayerEngine::new()));
        let weak_engine = Arc::downgrade(&engine);
        {
            let mut eng = engine.lock().unwrap();
            eng.set_recovery_trigger(move |gen| {
                let weak_clone = weak_engine.clone();
                let _ = std::thread::Builder::new()
                    .name("nora-stream-recovery".into())
                    .spawn(move || {
                        run_recovery(weak_clone, gen);
                    });
            });
        }
        engine
    };
    static ref ON_ENDED_CALLBACK: Arc<Mutex<Option<ThreadsafeFunction<()>>>> = Arc::new(Mutex::new(None));
    static ref ON_ERROR_CALLBACK: Arc<Mutex<Option<ThreadsafeFunction<String>>>> = Arc::new(Mutex::new(None));
}

fn run_recovery(weak_engine: Weak<Mutex<PlayerEngine>>, target_generation: u64) {
    let delays = [
        std::time::Duration::from_millis(0),
        std::time::Duration::from_millis(100),
        std::time::Duration::from_millis(300),
    ];

    let mut last_error = String::new();

    for (attempt, delay) in delays.iter().enumerate() {
        if !delay.is_zero() {
            std::thread::sleep(*delay);
        }

        let engine_arc = match weak_engine.upgrade() {
            Some(arc) => arc,
            None => return,
        };

        let mut engine = match engine_arc.lock() {
            Ok(g) => g,
            Err(_) => return,
        };

        if engine.generation() != target_generation || engine.is_stopped() {
            log::debug!("Aborting stream recovery: playback generation changed or stopped.");
            engine.reset_recovering();
            return;
        }

        log::info!("Attempting audio stream recovery (attempt {}/3)...", attempt + 1);
        match engine.rebuild_stream() {
            Ok(()) => {
                log::info!("Audio stream successfully recovered and rebuilt.");
                engine.reset_recovering();
                return;
            }
            Err(err) => {
                log::warn!("Audio stream rebuild attempt {} failed: {}", attempt + 1, err);
                last_error = err;
            }
        }
    }

    log::error!("Audio stream recovery exhausted all retries. Last error: {}", last_error);
    if let Some(engine_arc) = weak_engine.upgrade() {
        if let Ok(engine) = engine_arc.lock() {
            engine.reset_recovering();
            engine.trigger_fatal_error(format!("Audio stream error: {}", last_error));
        }
    }
}

#[napi(js_name = "engineOnEnded")]
pub fn engine_on_ended(callback: ThreadsafeFunction<()>) -> napi::Result<()> {
    let mut cb = ON_ENDED_CALLBACK
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock callback mutex"))?;
    *cb = Some(callback);
    Ok(())
}

#[napi(js_name = "engineOnError")]
pub fn engine_on_error(callback: ThreadsafeFunction<String>) -> napi::Result<()> {
    let mut cb = ON_ERROR_CALLBACK
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock error callback mutex"))?;
    *cb = Some(callback);
    Ok(())
}

#[napi(object)]
pub struct JsEngineTickPayload {
    pub position: f64,
    pub timestamp_ms: f64,
    pub is_playing: bool,
}

#[napi(js_name = "ping")]
pub fn ping() -> String {
    "pong from audio-engine".to_string()
}

#[napi(object)]
pub struct LoadOptions {
    pub auto_play: Option<bool>,
    pub volume: Option<f64>,
    pub playback_rate: Option<f64>,
}

#[napi(object)]
pub struct JsAudioMetadata {
    pub duration_secs: f64,
    pub sample_rate: u32,
    pub channels: u32,
}

#[napi(js_name = "engineLoad")]
pub fn engine_load(path: String, options: Option<LoadOptions>) -> napi::Result<JsAudioMetadata> {
    let mut engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;

    let auto_play = options.as_ref().and_then(|o| o.auto_play).unwrap_or(true);
    let volume = options.as_ref().and_then(|o| o.volume).unwrap_or(1.0) as f32;
    let playback_rate = options.as_ref().and_then(|o| o.playback_rate).unwrap_or(1.0) as f32;

    let on_end = {
        let cb_clone = ON_ENDED_CALLBACK.clone();
        Some(move || {
            if let Ok(guard) = cb_clone.lock() {
                if let Some(ref tsfn) = *guard {
                    let _ = tsfn.call(Ok(()), ThreadsafeFunctionCallMode::NonBlocking);
                }
            }
        })
    };

    let on_err = {
        let cb_clone = ON_ERROR_CALLBACK.clone();
        Some(move |err_msg: String| {
            if let Ok(guard) = cb_clone.lock() {
                if let Some(ref tsfn) = *guard {
                    let _ = tsfn.call(Ok(err_msg), ThreadsafeFunctionCallMode::NonBlocking);
                }
            }
        })
    };

    let meta = engine
        .load_file(
            &path,
            auto_play,
            volume,
            playback_rate,
            on_end,
            on_err,
        )
        .map_err(|e| napi::Error::from_reason(e))?;

    Ok(JsAudioMetadata {
        duration_secs: meta.duration_secs,
        sample_rate: meta.sample_rate,
        channels: meta.channels,
    })
}

#[napi(js_name = "enginePlay")]
pub fn engine_play(path: String) -> napi::Result<()> {
    let mut engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;

    let on_end = {
        let cb_clone = ON_ENDED_CALLBACK.clone();
        Some(move || {
            if let Ok(guard) = cb_clone.lock() {
                if let Some(ref tsfn) = *guard {
                    let _ = tsfn.call(Ok(()), ThreadsafeFunctionCallMode::NonBlocking);
                }
            }
        })
    };

    let on_err = {
        let cb_clone = ON_ERROR_CALLBACK.clone();
        Some(move |err_msg: String| {
            if let Ok(guard) = cb_clone.lock() {
                if let Some(ref tsfn) = *guard {
                    let _ = tsfn.call(Ok(err_msg), ThreadsafeFunctionCallMode::NonBlocking);
                }
            }
        })
    };

    engine
        .play_file::<fn(ticker::EngineTickPayload), _, _>(
            &path,
            None,
            on_end,
            on_err,
        )
        .map_err(|e| napi::Error::from_reason(e))
}

#[napi(js_name = "enginePause")]
pub fn engine_pause() -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.pause();
    Ok(())
}

#[napi(js_name = "engineResume")]
pub fn engine_resume() -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.resume();
    Ok(())
}

#[napi(js_name = "engineStop")]
pub fn engine_stop() -> napi::Result<()> {
    let mut engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.stop();
    Ok(())
}

#[napi(js_name = "engineSeek")]
pub fn engine_seek(position_secs: f64) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.seek(position_secs);
    Ok(())
}

#[napi(js_name = "engineSetVolume")]
pub fn engine_set_volume(volume: f64) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.set_volume(volume as f32);
    Ok(())
}

#[napi(js_name = "engineSetVolumeWithRamp")]
pub fn engine_set_volume_with_ramp(target: f64, duration_ms: u32) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.set_volume_with_ramp(target as f32, duration_ms);
    Ok(())
}

#[napi(js_name = "engineGetPosition")]
pub fn engine_get_position() -> napi::Result<f64> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    Ok(engine.get_position())
}

#[napi(js_name = "engineGetDuration")]
pub fn engine_get_duration() -> napi::Result<f64> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    Ok(engine.get_duration())
}

#[napi(js_name = "engineIsPlaying")]
pub fn engine_is_playing() -> napi::Result<bool> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    Ok(engine.is_playing())
}

#[napi(js_name = "engineIsEnded")]
pub fn engine_is_ended() -> napi::Result<bool> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    Ok(engine.is_ended())
}

#[napi(js_name = "engineListDevices")]
pub fn engine_list_devices() -> napi::Result<Vec<String>> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    Ok(engine.list_devices())
}

#[napi(js_name = "engineSetDevice")]
pub fn engine_set_device(device_name: String) -> napi::Result<()> {
    let mut engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.set_device(device_name);
    Ok(())
}

#[napi(js_name = "engineSetPlaybackRate")]
pub fn engine_set_playback_rate(rate: f64) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.set_playback_rate(rate as f32);
    Ok(())
}

#[napi(js_name = "engineSetEqBand")]
pub fn engine_set_eq_band(frequency_hz: f64, gain_db: f64) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.set_eq_band(frequency_hz as f32, gain_db as f32);
    Ok(())
}

#[napi(js_name = "engineSetEqGains")]
pub fn engine_set_eq_gains(gains: Vec<f64>) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    let gains_f32: Vec<f32> = gains.into_iter().map(|g| g as f32).collect();
    engine.set_eq_gains(&gains_f32);
    Ok(())
}

#[napi(js_name = "engineResetEq")]
pub fn engine_reset_eq() -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.reset_eq();
    Ok(())
}

#[napi(js_name = "engineDestroy")]
pub fn engine_destroy() -> napi::Result<()> {
    let mut engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.stop();
    Ok(())
}
