use cpal::traits::{DeviceTrait, HostTrait};

pub struct DeviceManager {
    host: cpal::Host,
    selected_device_name: Option<String>,
    current_active_device_name: Option<String>,
}

impl DeviceManager {
    pub fn new() -> Self {
        Self {
            host: cpal::default_host(),
            selected_device_name: None,
            current_active_device_name: None,
        }
    }

    pub fn list_output_devices(&self) -> Vec<String> {
        let mut device_names = Vec::new();
        if let Ok(devices) = self.host.output_devices() {
            for device in devices {
                if let Ok(desc) = device.description() {
                    device_names.push(desc.name().to_string());
                }
            }
        }
        device_names
    }

    pub fn is_default_selected(&self) -> bool {
        self.selected_device_name.is_none()
    }

    pub fn current_active_device_name(&self) -> Option<String> {
        self.current_active_device_name.clone()
    }

    pub fn get_default_device_name(&self) -> Option<String> {
        self.host
            .default_output_device()
            .and_then(|d| d.description().ok())
            .map(|desc| desc.name().to_string())
    }

    pub fn set_device_name(&mut self, name: Option<String>) {
        self.selected_device_name = name.filter(|s| !s.trim().is_empty());
    }

    pub fn get_selected_device(&mut self) -> Option<cpal::Device> {
        if let Some(ref target_name) = self.selected_device_name {
            if let Ok(devices) = self.host.output_devices() {
                for device in devices {
                    if let Ok(desc) = device.description() {
                        if desc.name() == target_name {
                            self.current_active_device_name = Some(target_name.clone());
                            return Some(device);
                        }
                    }
                }
            }
        }

        #[cfg(target_os = "windows")]
        {
            // On Windows WASAPI, cpal::Host::default_output_device() returns a virtual
            // DefaultOutput device handle that utilizes ActivateAudioInterfaceAsync.
            // Under Windows sleep/wake or audio endpoint change notifications, thread-pool threads
            // can be polluted into STA mode (RustAudio/cpal #1402), causing ActivateAudioInterfaceAsync
            // to fail with RPC_E_CHANGED_MODE ("Cannot change thread mode after it is set", os error -2147417850).
            // Resolving the concrete default device via enumeration (which yields DeviceHandle::Specific)
            // bypasses ActivateAudioInterfaceAsync completely and invokes IMMDevice::Activate directly.
            if let Some(default_dev) = self.host.default_output_device() {
                // First attempt to match by device ID
                if let Ok(default_id) = default_dev.id() {
                    if let Ok(devices) = self.host.output_devices() {
                        for device in devices {
                            if let Ok(id) = device.id() {
                                if id == default_id {
                                    if let Ok(desc) = device.description() {
                                        self.current_active_device_name = Some(desc.name().to_string());
                                    }
                                    return Some(device);
                                }
                            }
                        }
                    }
                }

                // Second attempt to match by device description name
                if let Ok(default_desc) = default_dev.description() {
                    let default_name = default_desc.name();
                    if let Ok(devices) = self.host.output_devices() {
                        for device in devices {
                            if let Ok(desc) = device.description() {
                                if desc.name() == default_name {
                                    self.current_active_device_name = Some(default_name.to_string());
                                    return Some(device);
                                }
                            }
                        }
                    }
                }
            }

            // Fallback: pick the first available enumerated output device
            if let Ok(mut devices) = self.host.output_devices() {
                if let Some(device) = devices.next() {
                    if let Ok(desc) = device.description() {
                        self.current_active_device_name = Some(desc.name().to_string());
                    }
                    return Some(device);
                }
            }
        }

        let fallback_default = self.host.default_output_device();
        if let Some(ref d) = fallback_default {
            if let Ok(desc) = d.description() {
                self.current_active_device_name = Some(desc.name().to_string());
            }
        }
        fallback_default
    }
}
