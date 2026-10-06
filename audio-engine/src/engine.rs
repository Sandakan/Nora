use std::fs::File;
use std::path::Path;
use std::sync::{
    atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering},
    Arc, Mutex,
};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use cpal::traits::{DeviceTrait, StreamTrait};
use cpal::{OutputCallbackInfo, SampleFormat, Stream, StreamConfig};
use symphonia::core::codecs::audio::{AudioDecoder, AudioDecoderOptions};
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::probe::Hint;
use symphonia::core::formats::{FormatReader, SeekMode, SeekTo, TrackType};
use symphonia::core::io::MediaSourceStream;
use symphonia::core::units::{Time, Timestamp};
use symphonia::default::get_probe;

use crate::devices::DeviceManager;
use crate::dsp::EqChain;
use crate::resampler::SpeedResampler;
use crate::ring_buffer::SpscRingBuffer;
use crate::ticker::{EngineTickPayload, PositionTicker};

pub struct SendStream(pub Stream);

#[derive(Clone, Debug)]
pub struct AudioMetadata {
    pub duration_secs: f64,
    pub sample_rate: u32,
    pub channels: u32,
}

#[derive(Clone, Debug)]
pub struct VolumeState {
    pub current: f32,
    pub target: f32,
    pub step: f32,
    pub remaining_frames: u64,
}

impl VolumeState {
    pub fn new(volume: f32) -> Self {
        let v = volume.clamp(0.0, 1.0);
        Self {
            current: v,
            target: v,
            step: 0.0,
            remaining_frames: 0,
        }
    }

    pub fn set_immediate(&mut self, volume: f32) {
        let v = volume.clamp(0.0, 1.0);
        self.current = v;
        self.target = v;
        self.step = 0.0;
        self.remaining_frames = 0;
    }

    pub fn set_ramp(&mut self, target_volume: f32, duration_ms: u32, sample_rate: u32) {
        let target = target_volume.clamp(0.0, 1.0);
        self.target = target;
        let total_frames = (duration_ms as f64 * sample_rate as f64 / 1000.0).round() as u64;
        if total_frames <= 1 || (self.current - target).abs() < 1e-5 {
            self.current = target;
            self.step = 0.0;
            self.remaining_frames = 0;
        } else {
            self.remaining_frames = total_frames;
            self.step = (target - self.current) / total_frames as f32;
        }
    }
}

pub struct DecoderState {
    pub duration_secs: f64,
    pub source_sample_rate: u32,
    pub output_sample_rate: u32,
    pub source_channels: u16,
    pub is_playing: Arc<AtomicBool>,
    pub is_ended: Arc<AtomicBool>,
    pub presented_frames: Arc<AtomicU64>,
    pub volume: Arc<Mutex<VolumeState>>,
    pub volume_cache: Arc<AtomicU32>,
    pub playback_rate: Arc<Mutex<f32>>,
    pub seek_request: Arc<Mutex<Option<f64>>>,
}

impl DecoderState {
    pub fn new() -> Self {
        Self {
            duration_secs: 0.0,
            source_sample_rate: 44100,
            output_sample_rate: 48000,
            source_channels: 2,
            is_playing: Arc::new(AtomicBool::new(false)),
            is_ended: Arc::new(AtomicBool::new(false)),
            presented_frames: Arc::new(AtomicU64::new(0)),
            volume: Arc::new(Mutex::new(VolumeState::new(1.0))),
            volume_cache: Arc::new(AtomicU32::new(1.0f32.to_bits())),
            playback_rate: Arc::new(Mutex::new(1.0)),
            seek_request: Arc::new(Mutex::new(None)),
        }
    }
}

pub struct PlayerEngine {
    state: Arc<Mutex<DecoderState>>,
    eq_chain: Arc<Mutex<EqChain>>,
    device_manager: Arc<Mutex<DeviceManager>>,
    stream: Option<SendStream>,
    worker_handle: Option<JoinHandle<()>>,
    ticker: PositionTicker,
    stop_signal: Arc<AtomicBool>,
    ring_buffer: Option<Arc<SpscRingBuffer>>,
    current_file_path: Option<String>,
    generation: u64,
    is_recovering: Arc<AtomicBool>,
    on_end_cb: Option<Arc<dyn Fn() + Send + Sync + 'static>>,
    on_err_cb: Option<Arc<dyn Fn(String) + Send + Sync + 'static>>,
    recovery_trigger: Option<Arc<dyn Fn(u64) + Send + Sync + 'static>>,
}

impl PlayerEngine {
    pub fn new() -> Self {
        let state = Arc::new(Mutex::new(DecoderState::new()));
        let eq_chain = Arc::new(Mutex::new(EqChain::new(48000.0)));
        let device_manager = Arc::new(Mutex::new(DeviceManager::new()));
        let ticker = PositionTicker::new();
        let stop_signal = Arc::new(AtomicBool::new(false));

        Self {
            state,
            eq_chain,
            device_manager,
            stream: None,
            worker_handle: None,
            ticker,
            stop_signal,
            ring_buffer: None,
            current_file_path: None,
            generation: 0,
            is_recovering: Arc::new(AtomicBool::new(false)),
            on_end_cb: None,
            on_err_cb: None,
            recovery_trigger: None,
        }
    }

    pub fn set_recovery_trigger<F>(&mut self, trigger: F)
    where
        F: Fn(u64) + Send + Sync + 'static,
    {
        self.recovery_trigger = Some(Arc::new(trigger));
    }

    pub fn generation(&self) -> u64 {
        self.generation
    }

    pub fn is_stopped(&self) -> bool {
        self.stop_signal.load(Ordering::Acquire)
    }

    pub fn reset_recovering(&self) {
        self.is_recovering.store(false, Ordering::Release);
    }

    pub fn trigger_fatal_error(&self, message: String) {
        if let Some(ref cb) = self.on_err_cb {
            cb(message);
        }
    }

    /// Load and prepare an audio file atomically.
    pub fn load_file<FEnd, FErr>(
        &mut self,
        file_path: &str,
        auto_play: bool,
        volume: f32,
        playback_rate: f32,
        on_end: Option<FEnd>,
        on_err: Option<FErr>,
    ) -> Result<AudioMetadata, String>
    where
        FEnd: Fn() + Send + Sync + 'static,
        FErr: Fn(String) + Send + Sync + 'static,
    {
        let on_end_arc: Option<Arc<dyn Fn() + Send + Sync + 'static>> =
            on_end.map(|cb| Arc::new(cb) as Arc<dyn Fn() + Send + Sync + 'static>);
        let on_err_arc: Option<Arc<dyn Fn(String) + Send + Sync + 'static>> =
            on_err.map(|cb| Arc::new(cb) as Arc<dyn Fn(String) + Send + Sync + 'static>);

        self.on_end_cb = on_end_arc.clone();
        self.on_err_cb = on_err_arc.clone();

        self.load_file_internal(
            file_path,
            auto_play,
            volume,
            playback_rate,
            on_end_arc,
            on_err_arc,
            true,
        )
    }

    fn load_file_internal(
        &mut self,
        file_path: &str,
        auto_play: bool,
        volume: f32,
        playback_rate: f32,
        on_end: Option<Arc<dyn Fn() + Send + Sync + 'static>>,
        on_err: Option<Arc<dyn Fn(String) + Send + Sync + 'static>>,
        increment_generation: bool,
    ) -> Result<AudioMetadata, String> {
        self.stop_internal(increment_generation);
        self.current_file_path = Some(file_path.to_string());

        let path = Path::new(file_path);
        let file = File::open(path).map_err(|e| format!("Failed to open file '{}': {}", file_path, e))?;
        let mss = MediaSourceStream::new(Box::new(file), Default::default());

        let mut hint = Hint::new();
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            hint.with_extension(ext);
        }

        let format_reader = get_probe()
            .probe(&hint, mss, Default::default(), Default::default())
            .map_err(|e| format!("Failed to probe audio format: {}", e))?;

        let track = format_reader
            .default_track(TrackType::Audio)
            .ok_or_else(|| "No default audio track found in file".to_string())?;

        let codec_params = track
            .codec_params
            .as_ref()
            .and_then(|cp| cp.audio())
            .ok_or_else(|| "No audio codec parameters found in track".to_string())?;

        let track_id = track.id;
        let track_time_base = track.time_base;
        let decoder_opts: AudioDecoderOptions = Default::default();
        let decoder = symphonia::default::get_codecs()
            .make_audio_decoder(codec_params, &decoder_opts)
            .map_err(|e| format!("Failed to create codec decoder: {}", e))?;

        let source_sample_rate = codec_params.sample_rate.unwrap_or(44100);
        let source_channels = codec_params.channels.as_ref().map(|c| c.count() as u16).unwrap_or(2);

        let duration_secs = if let Some(n_frames) = track.num_frames {
            n_frames as f64 / source_sample_rate as f64
        } else if let (Some(tb), Some(dur)) = (track.time_base, track.duration) {
            tb.calc_duration(dur).map(|t| t.as_secs_f64()).unwrap_or(0.0)
        } else {
            0.0
        };

        let device = self
            .device_manager
            .lock()
            .unwrap()
            .get_selected_device()
            .ok_or_else(|| "No audio output device available".to_string())?;

        let supported_config = device
            .default_output_config()
            .map_err(|e| format!("Failed to get default output config: {}", e))?;

        let sample_format = supported_config.sample_format();
        let config: StreamConfig = supported_config.into();
        let output_sample_rate = config.sample_rate;
        let device_channels = config.channels as usize;

        // Calibrate 10-band EQ to the device output sample rate
        {
            let mut eq = self.eq_chain.lock().unwrap();
            eq.set_sample_rate(output_sample_rate as f32);
            eq.reset_state();
        }

        let is_playing = Arc::new(AtomicBool::new(auto_play));
        let is_ended = Arc::new(AtomicBool::new(false));
        let presented_frames = Arc::new(AtomicU64::new(0));
        let clamped_vol = volume.clamp(0.0, 1.0);
        let volume_lock = Arc::new(Mutex::new(VolumeState::new(clamped_vol)));
        let volume_cache = Arc::new(AtomicU32::new(clamped_vol.to_bits()));
        let playback_rate_lock = Arc::new(Mutex::new(playback_rate.clamp(0.25, 4.0)));
        let seek_request = Arc::new(Mutex::new(None));

        {
            let mut st = self.state.lock().unwrap();
            st.duration_secs = duration_secs;
            st.source_sample_rate = source_sample_rate;
            st.output_sample_rate = output_sample_rate;
            st.source_channels = source_channels;
            st.is_playing = is_playing.clone();
            st.is_ended = is_ended.clone();
            st.presented_frames = presented_frames.clone();
            st.volume = volume_lock.clone();
            st.volume_cache = volume_cache.clone();
            st.playback_rate = playback_rate_lock.clone();
            st.seek_request = seek_request.clone();
        }

        // Bounded lock-free SPSC ring buffer (~0.68s of stereo audio at 48kHz)
        let ring_buffer = SpscRingBuffer::new(65536);
        self.ring_buffer = Some(ring_buffer.clone());

        let stop_signal = Arc::new(AtomicBool::new(false));
        self.stop_signal = stop_signal.clone();

        let resampler = SpeedResampler::new(
            source_sample_rate,
            output_sample_rate,
            2, // Resampler operates on normalized stereo
            1024,
        );

        // Spawn background decoder worker thread
        let worker_stop = stop_signal.clone();
        let worker_seek = seek_request.clone();
        let worker_rate = playback_rate_lock.clone();
        let worker_ring = ring_buffer.clone();
        let worker_presented = presented_frames.clone();

        let worker_handle = thread::Builder::new()
            .name("nora-audio-decoder".into())
            .spawn(move || {
                Self::decoder_worker_loop(
                    format_reader,
                    decoder,
                    track_id,
                    track_time_base,
                    source_sample_rate,
                    source_channels as usize,
                    output_sample_rate,
                    resampler,
                    worker_ring,
                    worker_stop,
                    worker_seek,
                    worker_rate,
                    worker_presented,
                );
            })
            .map_err(|e| format!("Failed to spawn audio decoder thread: {}", e))?;

        self.worker_handle = Some(worker_handle);

        let err_fn = Self::create_error_handler(
            self.generation,
            stop_signal.clone(),
            self.is_recovering.clone(),
            self.recovery_trigger.clone(),
            on_err,
        );

        let send_stream = Self::build_cpal_stream(
            &device,
            config,
            sample_format,
            device_channels,
            ring_buffer,
            stop_signal,
            is_playing,
            is_ended,
            presented_frames,
            volume_lock,
            volume_cache,
            self.eq_chain.clone(),
            on_end,
            err_fn,
        )?;

        send_stream
            .0
            .play()
            .map_err(|e| format!("Failed to start cpal stream: {}", e))?;
        self.stream = Some(send_stream);

        Ok(AudioMetadata {
            duration_secs,
            sample_rate: source_sample_rate,
            channels: source_channels as u32,
        })
    }

    /// Background worker thread decoding loop (off the real-time audio callback).
    fn decoder_worker_loop(
        mut format_reader: Box<dyn FormatReader>,
        mut decoder: Box<dyn AudioDecoder>,
        track_id: u32,
        track_time_base: Option<symphonia::core::units::TimeBase>,
        source_sample_rate: u32,
        source_channels: usize,
        _output_sample_rate: u32,
        mut resampler: SpeedResampler,
        ring_buffer: Arc<SpscRingBuffer>,
        stop_signal: Arc<AtomicBool>,
        seek_request: Arc<Mutex<Option<f64>>>,
        playback_rate_lock: Arc<Mutex<f32>>,
        _presented_frames: Arc<AtomicU64>,
    ) {
        let mut raw_samples_buf = Vec::new();
        let mut stereo_buf = Vec::new();
        let mut eof_reached = false;

        while !stop_signal.load(Ordering::Relaxed) {
            // Check for seek request
            let target_secs_opt = {
                let mut lock = seek_request.lock().unwrap();
                lock.take()
            };

            if let Some(target_secs) = target_secs_opt {
                let time = Time::try_from_secs_f64(target_secs).unwrap_or(Time::ZERO);
                let seek_ok = format_reader
                    .seek(SeekMode::Accurate, SeekTo::Time { time, track_id: Some(track_id) })
                    .is_ok()
                    || format_reader
                        .seek(SeekMode::Coarse, SeekTo::Time { time, track_id: Some(track_id) })
                        .is_ok()
                    || format_reader
                        .seek(SeekMode::Accurate, SeekTo::Time { time, track_id: None })
                        .is_ok()
                    || format_reader
                        .seek(SeekMode::Coarse, SeekTo::Time { time, track_id: None })
                        .is_ok()
                    || {
                        let ts_opt = if let Some(tb) = track_time_base {
                            tb.calc_timestamp(time)
                        } else {
                            Timestamp::try_from((target_secs * source_sample_rate as f64).round() as u64).ok()
                        };
                        if let Some(ts) = ts_opt {
                            format_reader
                                .seek(SeekMode::Coarse, SeekTo::Timestamp { ts, track_id })
                                .is_ok()
                        } else {
                            false
                        }
                    };

                if seek_ok {
                    decoder.reset();
                    resampler.reset();
                    ring_buffer.clear();
                    eof_reached = false;
                } else {
                    log::warn!("Seek to {:.2}s failed on format reader", target_secs);
                }
            }

            // Update playback rate
            if let Ok(rate) = playback_rate_lock.try_lock() {
                let _ = resampler.set_playback_rate(*rate);
            }

            if eof_reached {
                thread::sleep(Duration::from_millis(10));
                continue;
            }

            // If ring buffer has plenty of data, throttle worker to avoid busy-spin
            if ring_buffer.available_write() < 4096 {
                thread::sleep(Duration::from_millis(5));
                continue;
            }

            match format_reader.next_packet() {
                Ok(Some(packet)) => {
                    if packet.track_id != track_id {
                        continue;
                    }

                    match decoder.decode(&packet) {
                        Ok(decoded) => {
                            let num_samples = decoded.samples_interleaved();
                            if raw_samples_buf.len() < num_samples {
                                raw_samples_buf.resize(num_samples, 0.0);
                            }
                            let slice = &mut raw_samples_buf[..num_samples];
                            decoded.copy_to_slice_interleaved(&mut *slice);

                            // Normalize source channels to stereo
                            stereo_buf.clear();
                            match source_channels {
                                1 => {
                                    for &s in slice.iter() {
                                        stereo_buf.push(s);
                                        stereo_buf.push(s);
                                    }
                                }
                                2 => {
                                    stereo_buf.extend_from_slice(slice);
                                }
                                n => {
                                    for frame in slice.chunks_exact(n) {
                                        let fl = frame[0];
                                        let fr = frame[1];
                                        let center = frame.get(2).copied().unwrap_or(0.0);
                                        let sl = frame.get(4).copied().unwrap_or(0.0);
                                        let sr = frame.get(5).copied().unwrap_or(0.0);
                                        stereo_buf.push(fl + 0.707 * center + 0.707 * sl);
                                        stereo_buf.push(fr + 0.707 * center + 0.707 * sr);
                                    }
                                }
                            }

                            // Process through WSOLA time-stretcher and device resampler
                            let processed = match resampler.process_interleaved(&stereo_buf) {
                                Ok(p) => p,
                                Err(e) => {
                                    log::error!("Resampling error: {}", e);
                                    stereo_buf.clone()
                                }
                            };

                            // Push resampled stereo samples into ring buffer
                            let mut offset = 0;
                            while offset < processed.len() && !stop_signal.load(Ordering::Relaxed) {
                                let written = ring_buffer.push_slice(&processed[offset..]);
                                offset += written;
                                if written == 0 {
                                    thread::sleep(Duration::from_millis(2));
                                }
                            }
                        }
                        Err(SymphoniaError::DecodeError(msg)) => {
                            log::warn!("Audio decode error: {}", msg);
                            continue;
                        }
                        Err(e) => {
                            log::error!("Fatal audio decoder error: {}", e);
                            ring_buffer.set_eof(true);
                            break;
                        }
                    }
                }
                Ok(None) => {
                    // EOF reached: signal ring buffer so consumer drains remainder
                    eof_reached = true;
                    ring_buffer.set_eof(true);
                }
                Err(e) => {
                    log::error!("Packet read error: {}", e);
                    ring_buffer.set_eof(true);
                    break;
                }
            }
        }
    }

    /// Real-time CPAL audio output callback: lock-free, zero allocation, strict deadline.
    fn audio_callback_f32(
        data: &mut [f32],
        device_channels: usize,
        ring_buffer: &Arc<SpscRingBuffer>,
        stop_signal: &Arc<AtomicBool>,
        is_playing: &Arc<AtomicBool>,
        is_ended: &Arc<AtomicBool>,
        presented_frames: &Arc<AtomicU64>,
        volume_lock: &Arc<Mutex<VolumeState>>,
        volume_cache: &Arc<AtomicU32>,
        eq_chain: &Arc<Mutex<EqChain>>,
        on_end: &Option<Arc<dyn Fn() + Send + Sync + 'static>>,
    ) {
        if stop_signal.load(Ordering::Relaxed) || !is_playing.load(Ordering::Relaxed) {
            data.fill(0.0);
            return;
        }

        let frames_needed = data.len() / device_channels;
        let mut stereo_scratch = [0.0f32; 1024]; // Stack buffer for up to 512 stereo frames

        let mut frames_processed = 0;
        let mut vol_lock = volume_lock.try_lock();

        while frames_processed < frames_needed {
            let chunk_frames = (frames_needed - frames_processed).min(512);
            let samples_to_read = chunk_frames * 2;

            let popped = ring_buffer.pop_slice(&mut stereo_scratch[..samples_to_read]);
            if popped < samples_to_read {
                stereo_scratch[popped..samples_to_read].fill(0.0);

                if ring_buffer.is_eof_and_empty() {
                    if !is_ended.swap(true, Ordering::Release) {
                        is_playing.store(false, Ordering::Release);
                        if let Some(ref cb) = on_end {
                            cb();
                        }
                    }
                }
            }

            // Apply 10-band EQ (isolated per-channel)
            if let Ok(mut eq) = eq_chain.try_lock() {
                eq.process_interleaved_stereo(&mut stereo_scratch[..samples_to_read]);
            }

            // Write to device channels with perceptual quadratic volume scaling and smooth ramping
            let data_offset = frames_processed * device_channels;

            if let Ok(ref mut v) = vol_lock {
                if v.remaining_frames > 0 {
                    // Frame-by-frame interpolation during ramping
                    for f in 0..chunk_frames {
                        if v.remaining_frames > 0 {
                            v.current += v.step;
                            v.remaining_frames -= 1;
                            if v.remaining_frames == 0 {
                                v.current = v.target;
                                v.step = 0.0;
                            }
                        }
                        let gain = v.current * v.current;
                        let l = (stereo_scratch[f * 2] * gain).clamp(-1.0, 1.0);
                        let r = (stereo_scratch[f * 2 + 1] * gain).clamp(-1.0, 1.0);

                        let out_frame = &mut data[data_offset + f * device_channels..data_offset + (f + 1) * device_channels];
                        out_frame[0] = l;
                        if device_channels > 1 {
                            out_frame[1] = r;
                        }
                        for ch in 2..device_channels {
                            out_frame[ch] = 0.0;
                        }
                    }
                    volume_cache.store(v.current.to_bits(), Ordering::Relaxed);
                } else {
                    // Constant volume: compute quadratic gain once for the entire chunk
                    let gain = v.current * v.current;
                    volume_cache.store(v.current.to_bits(), Ordering::Relaxed);

                    for f in 0..chunk_frames {
                        let l = (stereo_scratch[f * 2] * gain).clamp(-1.0, 1.0);
                        let r = (stereo_scratch[f * 2 + 1] * gain).clamp(-1.0, 1.0);

                        let out_frame = &mut data[data_offset + f * device_channels..data_offset + (f + 1) * device_channels];
                        out_frame[0] = l;
                        if device_channels > 1 {
                            out_frame[1] = r;
                        }
                        for ch in 2..device_channels {
                            out_frame[ch] = 0.0;
                        }
                    }
                }
            } else {
                // If mutex is contested, fallback to volume_cache to prevent glitches/blasts
                let fallback_vol = f32::from_bits(volume_cache.load(Ordering::Relaxed));
                let gain = fallback_vol * fallback_vol;

                for f in 0..chunk_frames {
                    let l = (stereo_scratch[f * 2] * gain).clamp(-1.0, 1.0);
                    let r = (stereo_scratch[f * 2 + 1] * gain).clamp(-1.0, 1.0);

                    let out_frame = &mut data[data_offset + f * device_channels..data_offset + (f + 1) * device_channels];
                    out_frame[0] = l;
                    if device_channels > 1 {
                        out_frame[1] = r;
                    }
                    for ch in 2..device_channels {
                        out_frame[ch] = 0.0;
                    }
                }
            }

            frames_processed += chunk_frames;
        }

        presented_frames.fetch_add(frames_needed as u64, Ordering::Relaxed);
    }

    /// Legacy compatibility play_file wrapper.
    pub fn play_file<FTick, FEnd, FErr>(
        &mut self,
        file_path: &str,
        on_tick: Option<FTick>,
        on_end: Option<FEnd>,
        on_err: Option<FErr>,
    ) -> Result<(), String>
    where
        FTick: Fn(EngineTickPayload) + Send + Sync + 'static,
        FEnd: Fn() + Send + Sync + 'static,
        FErr: Fn(String) + Send + Sync + 'static,
    {
        self.load_file(file_path, true, 1.0, 1.0, on_end, on_err)?;

        if let Some(on_tick) = on_tick {
            let state_clone = self.state.clone();
            self.ticker.start(
                move || {
                    let st = state_clone.lock().unwrap();
                    let pos = st.presented_frames.load(Ordering::Relaxed) as f64 / st.output_sample_rate as f64;
                    let playing = st.is_playing.load(Ordering::Relaxed);
                    (pos, playing)
                },
                Box::new(on_tick),
            );
        }

        Ok(())
    }

    pub fn pause(&self) {
        let st = self.state.lock().unwrap();
        st.is_playing.store(false, Ordering::Release);
    }

    pub fn resume(&self) {
        let st = self.state.lock().unwrap();
        st.is_playing.store(true, Ordering::Release);
    }

    fn build_cpal_stream(
        device: &cpal::Device,
        config: StreamConfig,
        sample_format: SampleFormat,
        device_channels: usize,
        ring_buffer: Arc<SpscRingBuffer>,
        stop_signal: Arc<AtomicBool>,
        is_playing: Arc<AtomicBool>,
        is_ended: Arc<AtomicBool>,
        presented_frames: Arc<AtomicU64>,
        volume_lock: Arc<Mutex<VolumeState>>,
        volume_cache: Arc<AtomicU32>,
        eq_chain: Arc<Mutex<EqChain>>,
        on_end: Option<Arc<dyn Fn() + Send + Sync + 'static>>,
        err_fn: impl FnMut(cpal::Error) + Send + 'static,
    ) -> Result<SendStream, String> {
        let stream = match sample_format {
            SampleFormat::F32 => device
                .build_output_stream(
                    config,
                    move |data: &mut [f32], _: &OutputCallbackInfo| {
                        Self::audio_callback_f32(
                            data,
                            device_channels,
                            &ring_buffer,
                            &stop_signal,
                            &is_playing,
                            &is_ended,
                            &presented_frames,
                            &volume_lock,
                            &volume_cache,
                            &eq_chain,
                            &on_end,
                        );
                    },
                    err_fn,
                    None,
                )
                .map_err(|e| format!("Failed to build cpal output stream: {}", e))?,
            _ => return Err("Unsupported sample format on output device".to_string()),
        };
        Ok(SendStream(stream))
    }

    fn create_error_handler(
        generation: u64,
        stop_signal: Arc<AtomicBool>,
        is_recovering: Arc<AtomicBool>,
        recovery_trigger: Option<Arc<dyn Fn(u64) + Send + Sync + 'static>>,
        on_err: Option<Arc<dyn Fn(String) + Send + Sync + 'static>>,
    ) -> impl FnMut(cpal::Error) + Send + 'static {
        move |err: cpal::Error| {
            if stop_signal.load(Ordering::Relaxed) {
                return;
            }

            let is_recoverable = match err.kind() {
                cpal::ErrorKind::StreamInvalidated
                | cpal::ErrorKind::DeviceNotAvailable
                | cpal::ErrorKind::DeviceChanged => true,
                _ => {
                    let msg = err.to_string();
                    msg.contains("stream configuration is no longer valid")
                        || msg.contains("must be rebuilt")
                        || msg.contains("device is not available")
                }
            };

            if is_recoverable {
                log::warn!(
                    "Audio stream invalidated by system: {}. Initiating automatic rebuild...",
                    err
                );
                if is_recovering
                    .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
                    .is_ok()
                {
                    if let Some(ref trigger) = recovery_trigger {
                        trigger(generation);
                    }
                }
            } else {
                log::error!("Audio stream error: {}", err);
                if let Some(ref cb) = on_err {
                    cb(format!("{}", err));
                }
            }
        }
    }

    pub fn stop(&mut self) {
        self.stop_internal(true);
    }

    fn stop_internal(&mut self, increment_generation: bool) {
        self.stop_signal.store(true, Ordering::Release);
        self.ticker.stop();

        if let Some(send_stream) = self.stream.take() {
            let _ = send_stream.0.pause();
        }

        if let Some(handle) = self.worker_handle.take() {
            let _ = handle.join();
        }

        if let Some(ref rb) = self.ring_buffer {
            rb.clear();
        }

        let st = self.state.lock().unwrap();
        st.is_ended.store(false, Ordering::Release);
        st.is_playing.store(false, Ordering::Release);
        st.presented_frames.store(0, Ordering::Release);

        if increment_generation {
            self.generation = self.generation.wrapping_add(1);
        }
        self.is_recovering.store(false, Ordering::Release);
    }

    pub fn rebuild_stream(&mut self) -> Result<(), String> {
        if self.stop_signal.load(Ordering::Acquire) {
            return Ok(());
        }

        let file_path = match self.current_file_path.as_ref() {
            Some(p) => p.clone(),
            None => return Err("No file loaded".to_string()),
        };

        let device = self
            .device_manager
            .lock()
            .unwrap()
            .get_selected_device()
            .ok_or_else(|| "No audio output device available".to_string())?;

        let supported_config = device
            .default_output_config()
            .map_err(|e| format!("Failed to get default output config: {}", e))?;

        let sample_format = supported_config.sample_format();
        let config: StreamConfig = supported_config.into();
        let new_output_sample_rate = config.sample_rate;
        let device_channels = config.channels as usize;

        let current_output_sample_rate = {
            let st = self.state.lock().unwrap();
            st.output_sample_rate
        };

        // Release previous stream handle before building new one
        self.stream = None;

        if new_output_sample_rate == current_output_sample_rate && self.ring_buffer.is_some() {
            log::info!(
                "Rebuilding stream with identical sample rate ({} Hz)",
                new_output_sample_rate
            );

            {
                let mut eq = self.eq_chain.lock().unwrap();
                eq.set_sample_rate(new_output_sample_rate as f32);
            }

            let st = self.state.lock().unwrap();
            let err_fn = Self::create_error_handler(
                self.generation,
                self.stop_signal.clone(),
                self.is_recovering.clone(),
                self.recovery_trigger.clone(),
                self.on_err_cb.clone(),
            );

            let send_stream = Self::build_cpal_stream(
                &device,
                config,
                sample_format,
                device_channels,
                self.ring_buffer.as_ref().unwrap().clone(),
                self.stop_signal.clone(),
                st.is_playing.clone(),
                st.is_ended.clone(),
                st.presented_frames.clone(),
                st.volume.clone(),
                st.volume_cache.clone(),
                self.eq_chain.clone(),
                self.on_end_cb.clone(),
                err_fn,
            )?;

            send_stream
                .0
                .play()
                .map_err(|e| format!("Failed to start cpal stream: {}", e))?;
            self.stream = Some(send_stream);
            Ok(())
        } else {
            log::info!(
                "Device sample rate changed ({} Hz -> {} Hz). Re-anchoring playback...",
                current_output_sample_rate,
                new_output_sample_rate
            );

            let current_pos = self.get_position();
            let was_playing = self.is_playing();
            let volume = self.state.lock().unwrap().volume.lock().unwrap().target;
            let rate = *self.state.lock().unwrap().playback_rate.lock().unwrap();
            let on_end = self.on_end_cb.clone();
            let on_err = self.on_err_cb.clone();

            self.load_file_internal(
                &file_path,
                was_playing,
                volume,
                rate,
                on_end,
                on_err,
                false,
            )?;

            self.seek(current_pos);
            Ok(())
        }
    }

    pub fn seek(&self, position_secs: f64) {
        let st = self.state.lock().unwrap();
        let target = position_secs.clamp(0.0, st.duration_secs.max(0.0));
        st.is_ended.store(false, Ordering::Release);
        let target_frame = (target * st.output_sample_rate as f64).round() as u64;
        st.presented_frames.store(target_frame, Ordering::Release);
        if let Some(ref rb) = self.ring_buffer {
            rb.clear();
        }
        let mut req = st.seek_request.lock().unwrap();
        *req = Some(target);
    }

    pub fn set_volume(&self, volume: f32) {
        let (volume_cache, volume_lock) = {
            let st = self.state.lock().unwrap();
            (st.volume_cache.clone(), st.volume.clone())
        };
        let clamped = volume.clamp(0.0, 1.0);
        volume_cache.store(clamped.to_bits(), Ordering::Release);
        if let Ok(mut v) = volume_lock.lock() {
            v.set_immediate(clamped);
        };
    }

    pub fn set_volume_with_ramp(&self, target_volume: f32, duration_ms: u32) {
        let (sample_rate, volume_lock) = {
            let st = self.state.lock().unwrap();
            let sr = if st.output_sample_rate > 0 {
                st.output_sample_rate
            } else {
                48000
            };
            (sr, st.volume.clone())
        };
        if let Ok(mut v) = volume_lock.lock() {
            v.set_ramp(target_volume, duration_ms, sample_rate);
        };
    }

    pub fn set_playback_rate(&self, rate: f32) {
        let st = self.state.lock().unwrap();
        if let Ok(mut r) = st.playback_rate.lock() {
            *r = rate.clamp(0.25, 4.0);
        };
    }

    pub fn set_eq_band(&self, frequency_hz: f32, gain_db: f32) {
        let mut eq = self.eq_chain.lock().unwrap();
        eq.set_band_gain(frequency_hz, gain_db);
    }

    pub fn set_eq_gains(&self, gains: &[f32]) {
        let mut eq = self.eq_chain.lock().unwrap();
        eq.set_all_gains(gains);
    }

    pub fn reset_eq(&self) {
        let mut eq = self.eq_chain.lock().unwrap();
        eq.reset_all_gains();
    }

    pub fn get_position(&self) -> f64 {
        let st = self.state.lock().unwrap();
        if st.output_sample_rate > 0 {
            st.presented_frames.load(Ordering::Relaxed) as f64 / st.output_sample_rate as f64
        } else {
            0.0
        }
    }

    pub fn get_duration(&self) -> f64 {
        self.state.lock().unwrap().duration_secs
    }

    pub fn is_playing(&self) -> bool {
        self.state.lock().unwrap().is_playing.load(Ordering::Acquire)
    }

    pub fn is_ended(&self) -> bool {
        self.state.lock().unwrap().is_ended.load(Ordering::Acquire)
    }

    pub fn list_devices(&self) -> Vec<String> {
        self.device_manager.lock().unwrap().list_output_devices()
    }

    pub fn set_device(&mut self, device_name: String) {
        self.device_manager.lock().unwrap().set_device_name(Some(device_name));
        if self.stream.is_some() && !self.stop_signal.load(Ordering::Relaxed) {
            let _ = self.rebuild_stream();
        }
    }
}
