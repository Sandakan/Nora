use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Copy)]
pub struct EngineTickPayload {
    pub position: f64,
    pub timestamp_ms: f64,
    pub is_playing: bool,
}

pub type TickCallback = Box<dyn Fn(EngineTickPayload) + Send + Sync + 'static>;

pub struct PositionTicker {
    running: Arc<AtomicBool>,
    handle: Option<thread::JoinHandle<()>>,
}

impl PositionTicker {
    pub fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(false)),
            handle: None,
        }
    }

    pub fn start<F>(&mut self, get_state: F, callback: TickCallback)
    where
        F: Fn() -> (f64, bool) + Send + Sync + 'static,
    {
        self.stop();

        let running = Arc::new(AtomicBool::new(true));
        self.running = running.clone();

        let get_state = Arc::new(get_state);
        let callback = Arc::new(callback);

        let handle = thread::spawn(move || {
            let start_instant = Instant::now();

            while running.load(Ordering::Relaxed) {
                thread::sleep(Duration::from_millis(250));

                if !running.load(Ordering::Relaxed) {
                    break;
                }

                let (position, is_playing) = get_state();
                let timestamp_ms = start_instant.elapsed().as_secs_f64() * 1000.0;

                let payload = EngineTickPayload {
                    position,
                    timestamp_ms,
                    is_playing,
                };

                callback(payload);
            }
        });

        self.handle = Some(handle);
    }

    pub fn stop(&mut self) {
        self.running.store(false, Ordering::Relaxed);
        if let Some(handle) = self.handle.take() {
            let _ = handle.join();
        }
    }
}

impl Drop for PositionTicker {
    fn drop(&mut self) {
        self.stop();
    }
}
