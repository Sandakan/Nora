use std::fs::File;
use std::path::Path;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};

use cpal::traits::{DeviceTrait, StreamTrait};
use cpal::{OutputCallbackInfo, SampleFormat, Stream, StreamConfig};
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::{Decoder, DecoderOptions};
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::{FormatOptions, FormatReader, SeekMode, SeekTo};
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use symphonia::core::units::Time;
use symphonia::default::get_probe;

use crate::devices::DeviceManager;
use crate::dsp::EqChain;
use crate::resampler::SpeedResampler;
use crate::ticker::{EngineTickPayload, PositionTicker};

pub struct SendStream(pub Stream);
unsafe impl Send for SendStream {}
unsafe impl Sync for SendStream {}

pub struct DecoderState {
    pub position_secs: f64,
    pub duration_secs: f64,
    pub sample_rate: u32,
    pub channels: u16,
    pub is_playing: bool,
    pub is_ended: bool,
    pub volume: f32,
    pub volume_target: f32,
    pub volume_ramp_step: f32,
    pub playback_rate: f32,
    pub seek_target: Option<f64>,
}

impl DecoderState {
    pub fn new() -> Self {
        Self {
            position_secs: 0.0,
            duration_secs: 0.0,
            sample_rate: 44100,
            channels: 2,
            is_playing: false,
            is_ended: false,
            volume: 1.0,
            volume_target: 1.0,
            volume_ramp_step: 0.0,
            playback_rate: 1.0,
            seek_target: None,
        }
    }
}

pub struct PlayerEngine {
    state: Arc<Mutex<DecoderState>>,
    eq_chain: Arc<Mutex<EqChain>>,
    device_manager: Arc<Mutex<DeviceManager>>,
    stream: Option<SendStream>,
    ticker: PositionTicker,
    stop_signal: Arc<AtomicBool>,
}

impl PlayerEngine {
    pub fn new() -> Self {
        let state = Arc::new(Mutex::new(DecoderState::new()));
        let eq_chain = Arc::new(Mutex::new(EqChain::new(44100.0)));
        let device_manager = Arc::new(Mutex::new(DeviceManager::new()));
        let ticker = PositionTicker::new();
        let stop_signal = Arc::new(AtomicBool::new(false));

        Self {
            state,
            eq_chain,
            device_manager,
            stream: None,
            ticker,
            stop_signal,
        }
    }

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
        self.stop();

        let path = Path::new(file_path);
        let file = File::open(path).map_err(|e| format!("Failed to open file '{}': {}", file_path, e))?;
        let mss = MediaSourceStream::new(Box::new(file), Default::default());

        let format_opts = FormatOptions {
            enable_gapless: true,
            ..Default::default()
        };
        let metadata_opts: MetadataOptions = Default::default();
        let decoder_opts: DecoderOptions = Default::default();

        let mut hint = Hint::new();
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            hint.with_extension(ext);
        }

        let probed = get_probe()
            .format(&hint, mss, &format_opts, &metadata_opts)
            .map_err(|e| format!("Failed to probe audio format: {}", e))?;

        let format_reader = probed.format;
        let track = format_reader
            .default_track()
            .ok_or_else(|| "No default audio track found in file".to_string())?;

        let track_id = track.id;
        let decoder = symphonia::default::get_codecs()
            .make(&track.codec_params, &decoder_opts)
            .map_err(|e| format!("Failed to create codec decoder: {}", e))?;

        let sample_rate = track.codec_params.sample_rate.unwrap_or(44100);
        let channels = track.codec_params.channels.map(|c| c.count() as u16).unwrap_or(2);

        let duration_secs = if let Some(n_frames) = track.codec_params.n_frames {
            n_frames as f64 / sample_rate as f64
        } else {
            0.0
        };

        {
            let mut state = self.state.lock().unwrap();
            state.position_secs = 0.0;
            state.duration_secs = duration_secs;
            state.sample_rate = sample_rate;
            state.channels = channels;
            state.is_playing = true;
            state.is_ended = false;
            state.seek_target = None;
        }

        {
            let mut eq = self.eq_chain.lock().unwrap();
            eq.set_sample_rate(sample_rate as f32);
            eq.reset_state();
        }

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
        let output_sample_rate = config.sample_rate.0;

        let state_clone = self.state.clone();
        let eq_clone = self.eq_chain.clone();
        let stop_signal = Arc::new(AtomicBool::new(false));
        self.stop_signal = stop_signal.clone();

        let resampler = SpeedResampler::new(sample_rate, output_sample_rate, channels as usize, 1024);

        let send_stream = match sample_format {
            SampleFormat::F32 => self.build_audio_stream::<f32>(
                &device,
                &config,
                format_reader,
                decoder,
                track_id,
                state_clone,
                eq_clone,
                resampler,
                stop_signal,
                on_end,
                on_err,
            )?,
            _ => return Err("Unsupported sample format on output device".to_string()),
        };

        send_stream.0.play().map_err(|e| format!("Failed to start cpal stream: {}", e))?;
        self.stream = Some(send_stream);

        if let Some(on_tick) = on_tick {
            let state_for_ticker = self.state.clone();
            self.ticker.start(
                move || {
                    let st = state_for_ticker.lock().unwrap();
                    (st.position_secs, st.is_playing)
                },
                Box::new(on_tick),
            );
        }

        Ok(())
    }

    fn build_audio_stream<S>(
        &self,
        device: &cpal::Device,
        config: &StreamConfig,
        mut format_reader: Box<dyn FormatReader>,
        mut decoder: Box<dyn Decoder>,
        track_id: u32,
        state: Arc<Mutex<DecoderState>>,
        eq_chain: Arc<Mutex<EqChain>>,
        mut resampler: SpeedResampler,
        stop_signal: Arc<AtomicBool>,
        on_end: Option<impl Fn() + Send + Sync + 'static>,
        on_err: Option<impl Fn(String) + Send + Sync + 'static>,
    ) -> Result<SendStream, String>
    where
        S: cpal::Sample + cpal::FromSample<f32> + cpal::SizedSample,
    {
        let channels = config.channels as usize;
        let mut sample_buf: Option<SampleBuffer<f32>> = None;
        let mut sample_index = 0;
        let mut current_frame_samples: Vec<f32> = Vec::new();

        let err_fn = move |err| {
            log::error!("Audio stream error: {}", err);
            if let Some(ref cb) = on_err {
                cb(format!("{}", err));
            }
        };

        let stream = device
            .build_output_stream(
                config,
                move |data: &mut [S], _: &OutputCallbackInfo| {
                    if stop_signal.load(Ordering::Relaxed) {
                        for sample in data.iter_mut() {
                            *sample = S::from_sample(0.0);
                        }
                        return;
                    }

                    let (is_playing, playback_rate, seek_target) = {
                        let mut st = state.lock().unwrap();
                        (st.is_playing, st.playback_rate, st.seek_target.take())
                    };

                    if !is_playing {
                        for sample in data.iter_mut() {
                            *sample = S::from_sample(0.0);
                        }
                        return;
                    }

                    // Handle seek request
                    if let Some(target_secs) = seek_target {
                        let time = Time::from(target_secs);
                        let seek_to = SeekTo::Time {
                            time,
                            track_id: Some(track_id),
                        };
                        if let Ok(_) = format_reader.seek(SeekMode::Accurate, seek_to) {
                            decoder.reset();
                            current_frame_samples.clear();
                            sample_index = 0;
                            let mut st = state.lock().unwrap();
                            st.position_secs = target_secs;
                        }
                    }

                    // Update resampler playback rate
                    let _ = resampler.set_playback_rate(playback_rate);

                    for frame in data.chunks_mut(channels) {
                        if sample_index >= current_frame_samples.len() {
                            // Decode one or more packets until the resampler/OLA
                            // produces actual output samples. The OLA time-stretcher
                            // needs OLA_WINDOW (2048) input frames before it can emit
                            // a single hop, so we may need to decode several packets.
                            current_frame_samples.clear();
                            sample_index = 0;

                            let mut _hit_end = false;
                            // Safety cap: never spin more than 32 packets without output
                            let mut packets_read = 0usize;

                            while current_frame_samples.is_empty() && !_hit_end {
                                if packets_read >= 32 {
                                    break;
                                }

                                match format_reader.next_packet() {
                                    Ok(packet) => {
                                        if packet.track_id() != track_id {
                                            continue;
                                        }

                                        match decoder.decode(&packet) {
                                            Ok(decoded) => {
                                                if sample_buf.is_none() {
                                                    let spec = *decoded.spec();
                                                    let duration = decoded.capacity() as u64;
                                                    sample_buf = Some(SampleBuffer::new(duration, spec));
                                                }

                                                if let Some(ref mut buf) = sample_buf {
                                                    buf.copy_interleaved_ref(decoded);
                                                    let raw_samples = buf.samples();

                                                    let processed = match resampler.process_interleaved(raw_samples) {
                                                        Ok(s) => s,
                                                        Err(e) => {
                                                            log::error!("Resampler error: {}", e);
                                                            raw_samples.to_vec()
                                                        }
                                                    };

                                                    // Always track position using the raw (pre-OLA) frame count
                                                    {
                                                        let mut st = state.lock().unwrap();
                                                        let sample_rate = st.sample_rate as f64;
                                                        if sample_rate > 0.0 {
                                                            let added_secs = (raw_samples.len() / channels) as f64 / sample_rate;
                                                            st.position_secs += added_secs;
                                                        }
                                                    }

                                                    current_frame_samples.extend_from_slice(&processed);
                                                    // If processed was empty the OLA is still accumulating;
                                                    // keep looping to decode the next packet.
                                                    packets_read += 1;
                                                }
                                            }
                                            Err(SymphoniaError::DecodeError(msg)) => {
                                                log::warn!("Decode error: {}", msg);
                                                packets_read += 1;
                                                continue;
                                            }
                                            Err(e) => {
                                                log::error!("Fatal decoder error: {}", e);
                                                _hit_end = true;
                                                break;
                                            }
                                        }
                                    }
                                    Err(SymphoniaError::IoError(e))
                                        if e.kind() == std::io::ErrorKind::UnexpectedEof =>
                                    {
                                        let mut st = state.lock().unwrap();
                                        st.is_playing = false;
                                        st.is_ended = true;
                                        if let Some(ref end_cb) = on_end {
                                            end_cb();
                                        }
                                        _hit_end = true;
                                        break;
                                    }
                                    Err(e) => {
                                        log::error!("Packet read error: {}", e);
                                        _hit_end = true;
                                        break;
                                    }
                                }
                            }
                        }

                        let mut left_sample = 0.0;
                        let mut right_sample = 0.0;

                        if sample_index < current_frame_samples.len() {
                            left_sample = current_frame_samples[sample_index];
                            right_sample = if current_frame_samples.len() > sample_index + 1 {
                                current_frame_samples[sample_index + 1]
                            } else {
                                left_sample
                            };
                            sample_index += channels;
                        }

                        // Apply 10-band EQ
                        {
                            let mut eq = eq_chain.lock().unwrap();
                            let mut buf = [left_sample, right_sample];
                            eq.process_buffer(&mut buf);
                            left_sample = buf[0];
                            right_sample = buf[1];
                        }

                        // Apply volume ramping (250ms fade)
                        let vol = {
                            let mut st = state.lock().unwrap();
                            if (st.volume - st.volume_target).abs() > 0.0001 {
                                st.volume += st.volume_ramp_step;
                                if (st.volume_ramp_step > 0.0 && st.volume >= st.volume_target)
                                    || (st.volume_ramp_step < 0.0 && st.volume <= st.volume_target)
                                {
                                    st.volume = st.volume_target;
                                    if st.volume <= 0.001 {
                                        st.is_playing = false;
                                    }
                                }
                            }
                            st.volume
                        };

                        left_sample *= vol;
                        right_sample *= vol;

                        for (ch_idx, out_sample) in frame.iter_mut().enumerate() {
                            let sample_val = if ch_idx == 0 { left_sample } else { right_sample };
                            *out_sample = S::from_sample(sample_val.clamp(-1.0, 1.0));
                        }
                    }
                },
                err_fn,
                None,
            )
            .map_err(|e| format!("Failed to build cpal output stream: {}", e))?;

        Ok(SendStream(stream))
    }

    pub fn pause(&self) {
        let mut st = self.state.lock().unwrap();
        st.is_playing = false;
    }

    pub fn resume(&self) {
        let mut st = self.state.lock().unwrap();
        st.is_playing = true;
    }

    pub fn stop(&mut self) {
        self.stop_signal.store(true, Ordering::Relaxed);
        self.ticker.stop();
        if let Some(send_stream) = self.stream.take() {
            let _ = send_stream.0.pause();
        }
        let mut st = self.state.lock().unwrap();
        st.is_playing = false;
        st.position_secs = 0.0;
    }

    pub fn seek(&self, position_secs: f64) {
        let mut st = self.state.lock().unwrap();
        st.seek_target = Some(position_secs);
    }

    pub fn set_volume(&self, volume: f32) {
        let mut st = self.state.lock().unwrap();
        let target = volume.clamp(0.0, 1.0);
        st.volume = target;
        st.volume_target = target;
        st.volume_ramp_step = 0.0;
    }

    pub fn set_volume_with_ramp(&self, target_volume: f32, duration_ms: u32) {
        let mut st = self.state.lock().unwrap();
        let target = target_volume.clamp(0.0, 1.0);
        st.volume_target = target;

        let total_samples = (st.sample_rate as f64 * (duration_ms as f64 / 1000.0)) as f32;
        if total_samples > 0.0 {
            st.volume_ramp_step = (target - st.volume) / total_samples;
        } else {
            st.volume = target;
            st.volume_ramp_step = 0.0;
        }
    }

    pub fn set_playback_rate(&self, rate: f32) {
        let mut st = self.state.lock().unwrap();
        st.playback_rate = rate.clamp(0.25, 4.0);
    }

    pub fn set_eq_band(&self, frequency_hz: f32, gain_db: f32) {
        let mut eq = self.eq_chain.lock().unwrap();
        eq.set_band_gain(frequency_hz, gain_db);
    }

    pub fn reset_eq(&self) {
        let mut eq = self.eq_chain.lock().unwrap();
        eq.reset_all_gains();
    }

    pub fn get_position(&self) -> f64 {
        self.state.lock().unwrap().position_secs
    }

    pub fn get_duration(&self) -> f64 {
        self.state.lock().unwrap().duration_secs
    }

    pub fn is_playing(&self) -> bool {
        self.state.lock().unwrap().is_playing
    }

    pub fn list_devices(&self) -> Vec<String> {
        self.device_manager.lock().unwrap().list_output_devices()
    }

    pub fn set_device(&self, device_name: String) {
        self.device_manager.lock().unwrap().set_device_name(Some(device_name));
    }
}
