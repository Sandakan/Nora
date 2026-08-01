pub mod devices;
pub mod dsp;
pub mod engine;
pub mod resampler;
pub mod ticker;

use napi_derive::napi;
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;

use engine::PlayerEngine;

lazy_static! {
    static ref GLOBAL_ENGINE: Arc<Mutex<PlayerEngine>> = Arc::new(Mutex::new(PlayerEngine::new()));
}

#[napi(object)]
pub struct JsEngineTickPayload {
    pub position: f64,
    pub timestamp_ms: f64,
    pub is_playing: bool,
}

#[napi]
pub fn ping() -> String {
    "pong from audio-engine".to_string()
}

#[napi]
pub fn engine_play(path: String) -> napi::Result<()> {
    let mut engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;

    engine
        .play_file::<fn(ticker::EngineTickPayload), fn(), fn(String)>(
            &path,
            None,
            None,
            None,
        )
        .map_err(|e| napi::Error::from_reason(e))
}

#[napi]
pub fn engine_pause() -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.pause();
    Ok(())
}

#[napi]
pub fn engine_resume() -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.resume();
    Ok(())
}

#[napi]
pub fn engine_stop() -> napi::Result<()> {
    let mut engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.stop();
    Ok(())
}

#[napi]
pub fn engine_seek(position_secs: f64) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.seek(position_secs);
    Ok(())
}

#[napi]
pub fn engine_set_volume(volume: f64) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.set_volume(volume as f32);
    Ok(())
}

#[napi]
pub fn engine_set_volume_with_ramp(target: f64, duration_ms: u32) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.set_volume_with_ramp(target as f32, duration_ms);
    Ok(())
}

#[napi]
pub fn engine_get_position() -> napi::Result<f64> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    Ok(engine.get_position())
}

#[napi]
pub fn engine_get_duration() -> napi::Result<f64> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    Ok(engine.get_duration())
}

#[napi]
pub fn engine_list_devices() -> napi::Result<Vec<String>> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    Ok(engine.list_devices())
}

#[napi]
pub fn engine_set_device(device_name: String) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.set_device(device_name);
    Ok(())
}

#[napi]
pub fn engine_set_playback_rate(rate: f64) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.set_playback_rate(rate as f32);
    Ok(())
}

#[napi]
pub fn engine_set_eq_band(frequency_hz: f64, gain_db: f64) -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.set_eq_band(frequency_hz as f32, gain_db as f32);
    Ok(())
}

#[napi]
pub fn engine_reset_eq() -> napi::Result<()> {
    let engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.reset_eq();
    Ok(())
}

#[napi]
pub fn engine_destroy() -> napi::Result<()> {
    let mut engine = GLOBAL_ENGINE
        .lock()
        .map_err(|_| napi::Error::from_reason("Failed to lock engine mutex"))?;
    engine.stop();
    Ok(())
}
