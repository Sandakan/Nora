use std::ffi::c_void;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use lazy_static::lazy_static;
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use souvlaki::{MediaControlEvent, MediaControls, MediaMetadata, MediaPlayback, MediaPosition, PlatformConfig};

pub struct MediaControlsManager {
    controls: Option<MediaControls>,
    last_metadata: Option<CachedMetadata>,
}

#[derive(Clone, Debug)]
pub struct CachedMetadata {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration_secs: Option<f64>,
    pub cover_url: Option<String>,
}

lazy_static! {
    static ref GLOBAL_MEDIA_CONTROLS: Arc<Mutex<MediaControlsManager>> = Arc::new(Mutex::new(MediaControlsManager {
        controls: None,
        last_metadata: None,
    }));
}

pub fn init_media_controls(
    hwnd: Option<*mut c_void>,
    callback: ThreadsafeFunction<String>,
) -> Result<(), String> {
    let mut manager = GLOBAL_MEDIA_CONTROLS
        .lock()
        .map_err(|e| format!("Failed to lock media controls: {}", e))?;

    let config = PlatformConfig {
        dbus_name: "org.mpris.MediaPlayer2.nora",
        display_name: "Nora",
        hwnd,
    };

    let mut controls = MediaControls::new(config)
        .map_err(|e| format!("Failed to create MediaControls: {:?}", e))?;

    controls
        .attach(move |event: MediaControlEvent| {
            let event_name = match event {
                MediaControlEvent::Play => "play",
                MediaControlEvent::Pause => "pause",
                MediaControlEvent::Toggle => "toggle",
                MediaControlEvent::Next => "next",
                MediaControlEvent::Previous => "previous",
                MediaControlEvent::Stop => "stop",
                MediaControlEvent::Raise => "raise",
                MediaControlEvent::Quit => "quit",
                _ => return,
            };

            let _ = callback.call(Ok(event_name.to_string()), ThreadsafeFunctionCallMode::NonBlocking);
        })
        .map_err(|e| format!("Failed to attach event handler to MediaControls: {:?}", e))?;

    manager.controls = Some(controls);
    log::info!("Native media controls initialized successfully.");
    Ok(())
}

pub fn update_metadata(metadata: CachedMetadata) -> Result<(), String> {
    let mut manager = GLOBAL_MEDIA_CONTROLS
        .lock()
        .map_err(|e| format!("Failed to lock media controls: {}", e))?;

    manager.last_metadata = Some(metadata.clone());

    if let Some(ref mut controls) = manager.controls {
        let duration = metadata.duration_secs.filter(|&d| d > 0.0).map(Duration::from_secs_f64);
        let meta = MediaMetadata {
            title: metadata.title.as_deref(),
            artist: metadata.artist.as_deref(),
            album: metadata.album.as_deref(),
            duration,
            cover_url: metadata.cover_url.as_deref(),
        };

        controls
            .set_metadata(meta)
            .map_err(|e| format!("Failed to set metadata: {:?}", e))?;
    }
    Ok(())
}

pub fn set_playback_playing(progress_secs: Option<f64>) -> Result<(), String> {
    let mut manager = GLOBAL_MEDIA_CONTROLS
        .lock()
        .map_err(|e| format!("Failed to lock media controls: {}", e))?;

    if let Some(ref mut controls) = manager.controls {
        let progress = progress_secs.filter(|&s| s >= 0.0).map(|s| MediaPosition(Duration::from_secs_f64(s)));
        controls
            .set_playback(MediaPlayback::Playing { progress })
            .map_err(|e| format!("Failed to set playback Playing: {:?}", e))?;
    }
    Ok(())
}

pub fn set_playback_paused(progress_secs: Option<f64>) -> Result<(), String> {
    let mut manager = GLOBAL_MEDIA_CONTROLS
        .lock()
        .map_err(|e| format!("Failed to lock media controls: {}", e))?;

    if let Some(ref mut controls) = manager.controls {
        let progress = progress_secs.filter(|&s| s >= 0.0).map(|s| MediaPosition(Duration::from_secs_f64(s)));
        controls
            .set_playback(MediaPlayback::Paused { progress })
            .map_err(|e| format!("Failed to set playback Paused: {:?}", e))?;
    }
    Ok(())
}

pub fn set_playback_stopped() -> Result<(), String> {
    let mut manager = GLOBAL_MEDIA_CONTROLS
        .lock()
        .map_err(|e| format!("Failed to lock media controls: {}", e))?;

    if let Some(ref mut controls) = manager.controls {
        controls
            .set_playback(MediaPlayback::Stopped)
            .map_err(|e| format!("Failed to set playback Stopped: {:?}", e))?;
    }
    Ok(())
}
