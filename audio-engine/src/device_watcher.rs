use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::thread;
use std::time::Duration;
use cpal::traits::{DeviceTrait, HostTrait};

pub type DevicesChangedCallback = Box<dyn Fn(String, Vec<String>) + Send + Sync + 'static>;
pub type DefaultDeviceSwitchCallback = Box<dyn Fn(String) + Send + Sync + 'static>;

pub struct DeviceWatcher {
    running: Arc<AtomicBool>,
    handle: Option<thread::JoinHandle<()>>,
}

impl DeviceWatcher {
    pub fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(false)),
            handle: None,
        }
    }

    pub fn start<F>(
        &mut self,
        on_default_switched: F,
        on_devices_changed: Option<DevicesChangedCallback>,
    ) where
        F: Fn(String) + Send + Sync + 'static,
    {
        self.stop();

        let running = Arc::new(AtomicBool::new(true));
        self.running = running.clone();

        let on_default_switched = Arc::new(on_default_switched);
        let on_devices_changed = on_devices_changed.map(Arc::new);

        let handle = thread::Builder::new()
            .name("nora-device-watcher".into())
            .spawn(move || {
                let host = cpal::default_host();
                let mut last_default: Option<String> = host
                    .default_output_device()
                    .and_then(|d| d.description().ok())
                    .map(|desc| desc.name().to_string());

                let mut last_devices = Self::query_output_devices(&host);

                while running.load(Ordering::Relaxed) {
                    thread::sleep(Duration::from_millis(500));

                    if !running.load(Ordering::Relaxed) {
                        break;
                    }

                    let current_default = host
                        .default_output_device()
                        .and_then(|d| d.description().ok())
                        .map(|desc| desc.name().to_string());

                    let current_devices = Self::query_output_devices(&host);

                    let default_changed = current_default != last_default;
                    let devices_changed = current_devices != last_devices;

                    if default_changed || devices_changed {
                        let new_default_name = current_default.clone().unwrap_or_default();

                        if default_changed {
                            log::info!(
                                "System default audio device changed: '{:?}' -> '{:?}'",
                                last_default,
                                current_default
                            );
                            if let Some(ref name) = current_default {
                                on_default_switched(name.clone());
                            }
                        }

                        if let Some(ref cb) = on_devices_changed {
                            cb(new_default_name, current_devices.clone());
                        }

                        last_default = current_default;
                        last_devices = current_devices;
                    }
                }
            });

        self.handle = handle.ok();
    }

    pub fn stop(&mut self) {
        if self.running.swap(false, Ordering::Relaxed) {
            if let Some(handle) = self.handle.take() {
                let _ = handle.join();
            }
        }
    }

    fn query_output_devices(host: &cpal::Host) -> Vec<String> {
        let mut device_names = Vec::new();
        if let Ok(devices) = host.output_devices() {
            for device in devices {
                if let Ok(desc) = device.description() {
                    device_names.push(desc.name().to_string());
                }
            }
        }
        device_names
    }
}

impl Drop for DeviceWatcher {
    fn drop(&mut self) {
        self.stop();
    }
}
