pub mod devices;
pub mod dsp;
pub mod engine;
pub mod resampler;
pub mod ring_buffer;
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

    let meta = engine
        .load_file::<fn(), fn(String)>(
            &path,
            auto_play,
            volume,
            playback_rate,
            None,
            None,
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

    engine
        .play_file::<fn(ticker::EngineTickPayload), fn(), fn(String)>(
            &path,
            None,
            None,
            None,
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
    let engine = GLOBAL_ENGINE
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
