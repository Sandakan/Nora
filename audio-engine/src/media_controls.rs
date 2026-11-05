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

        let normalized_cover_url: Option<String> = metadata.cover_url.as_ref().and_then(|raw_url| {
            #[cfg(target_os = "windows")]
            {
                // souvlaki on Windows trims "file://" and passes the rest to StorageFile::GetFileFromPathAsync.
                // It fails if there is a leading slash before the drive letter (e.g. "/C:/...").
                let trimmed = raw_url.trim_start_matches("file://");
                let clean_path = trimmed.trim_start_matches('/');
                let clean_path = clean_path.split('?').next().unwrap_or(clean_path);
                let path_obj = std::path::Path::new(clean_path);
                if path_obj.exists() {
                    Some(format!("file://{}", clean_path.replace('/', "\\")))
                } else {
                    log::warn!("Cover artwork does not exist at path: '{}'. Skipping cover.", clean_path);
                    None
                }
            }
            #[cfg(not(target_os = "windows"))]
            {
                Some(raw_url.clone())
            }
        });

        let meta = MediaMetadata {
            title: metadata.title.as_deref(),
            artist: metadata.artist.as_deref(),
            album: metadata.album.as_deref(),
            duration,
            cover_url: normalized_cover_url.as_deref(),
        };

        if let Err(err) = controls.set_metadata(meta) {
            log::warn!(
                "Failed to set media metadata with cover ({:?}). Retrying without cover...",
                err
            );
            let fallback_meta = MediaMetadata {
                title: metadata.title.as_deref(),
                artist: metadata.artist.as_deref(),
                album: metadata.album.as_deref(),
                duration,
                cover_url: None,
            };
            controls
                .set_metadata(fallback_meta)
                .map_err(|e| format!("Failed to set metadata: {:?}", e))?;
        }
    }
    Ok(())
}

pub fn set_playback_status(status: &str, progress_secs: Option<f64>) -> Result<(), String> {
    match status {
        "playing" => set_playback_playing(progress_secs),
        "paused" => set_playback_paused(progress_secs),
        "stopped" => set_playback_stopped(),
        _ => Err(format!("Unknown playback status: {}", status)),
    }
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
