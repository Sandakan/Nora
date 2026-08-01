use cpal::traits::{DeviceTrait, HostTrait};

pub struct DeviceManager {
    host: cpal::Host,
    selected_device_name: Option<String>,
}

impl DeviceManager {
    pub fn new() -> Self {
        Self {
            host: cpal::default_host(),
            selected_device_name: None,
        }
    }

    pub fn list_output_devices(&self) -> Vec<String> {
        let mut device_names = Vec::new();
        if let Ok(devices) = self.host.output_devices() {
            for device in devices {
                if let Ok(name) = device.name() {
                    device_names.push(name);
                }
            }
        }
        device_names
    }

    pub fn set_device_name(&mut self, name: Option<String>) {
        self.selected_device_name = name;
    }

    pub fn get_selected_device(&self) -> Option<cpal::Device> {
        if let Some(ref target_name) = self.selected_device_name {
            if let Ok(devices) = self.host.output_devices() {
                for device in devices {
                    if let Ok(name) = device.name() {
                        if &name == target_name {
                            return Some(device);
                        }
                    }
                }
            }
        }
        self.host.default_output_device()
    }
}
