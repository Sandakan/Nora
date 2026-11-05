use std::sync::{Arc, Mutex, Once};
use lazy_static::lazy_static;
use log::{LevelFilter, Log, Metadata, Record};
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi_derive::napi;

#[napi(object)]
pub struct JsLogRecord {
    pub level: String,
    pub message: String,
    pub target: String,
}

lazy_static! {
    static ref LOG_CALLBACK: Arc<Mutex<Option<ThreadsafeFunction<JsLogRecord>>>> =
        Arc::new(Mutex::new(None));
}

static LOGGER_INIT: Once = Once::new();
static NATIVE_LOGGER: NativeBridgeLogger = NativeBridgeLogger;

struct NativeBridgeLogger;

impl Log for NativeBridgeLogger {
    fn enabled(&self, _metadata: &Metadata) -> bool {
        true
    }

    fn log(&self, record: &Record) {
        if let Ok(guard) = LOG_CALLBACK.lock() {
            if let Some(ref cb) = *guard {
                let level_str = match record.level() {
                    log::Level::Error => "error",
                    log::Level::Warn => "warn",
                    log::Level::Info => "info",
                    log::Level::Debug => "debug",
                    log::Level::Trace => "trace",
                };
                let payload = JsLogRecord {
                    level: level_str.to_string(),
                    message: format!("{}", record.args()),
                    target: record.target().to_string(),
                };
                cb.call(Ok(payload), ThreadsafeFunctionCallMode::NonBlocking);
                return;
            }
        }

        #[cfg(test)]
        eprintln!("[{}] {}: {}", record.level(), record.target(), record.args());
    }

    fn flush(&self) {}
}

#[napi(js_name = "engineInitLogger")]
pub fn engine_init_logger(callback: ThreadsafeFunction<JsLogRecord>) -> napi::Result<()> {
    {
        let mut guard = LOG_CALLBACK
            .lock()
            .map_err(|_| napi::Error::from_reason("Failed to lock log callback mutex"))?;
        *guard = Some(callback);
    }

    LOGGER_INIT.call_once(|| {
        let _ = log::set_logger(&NATIVE_LOGGER);
        log::set_max_level(LevelFilter::Debug);
    });

    Ok(())
}
