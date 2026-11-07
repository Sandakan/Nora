use std::f32::consts::PI;
use std::fs::File;
use std::path::Path;
use napi_derive::napi;
use symphonia::core::codecs::audio::AudioDecoderOptions;
use symphonia::core::formats::probe::Hint;
use symphonia::core::formats::{SeekMode, SeekTo, TrackType};
use symphonia::core::io::MediaSourceStream;
use symphonia::core::units::Time;
use symphonia::default::get_probe;

use crate::dsp::BiquadFilter;

#[napi(object)]
#[derive(Debug, Clone)]
pub struct JsAudioFeatures {
    pub rms_energy: f64,
    pub crest_factor: f64,
    pub zero_crossing_rate: f64,
    pub spectral_centroid: f64,
    pub low_energy_ratio: f64,
    pub mid_energy_ratio: f64,
    pub high_energy_ratio: f64,
    pub estimated_bpm: f64,
    pub pulse_clarity: f64,
}

impl Default for JsAudioFeatures {
    fn default() -> Self {
        Self {
            rms_energy: 0.0,
            crest_factor: 1.0,
            zero_crossing_rate: 0.0,
            spectral_centroid: 1000.0,
            low_energy_ratio: 0.33,
            mid_energy_ratio: 0.34,
            high_energy_ratio: 0.33,
            estimated_bpm: 120.0,
            pulse_clarity: 0.0,
        }
    }
}

/// Computes DSP acoustic features directly from mono PCM f32 samples.
pub fn compute_dsp_features(samples: &[f32], sample_rate: f32) -> JsAudioFeatures {
    if samples.is_empty() || sample_rate <= 0.0 {
        return JsAudioFeatures::default();
    }

    let n = samples.len();

    // 1. RMS Energy & Crest Factor
    let mut sum_sq = 0.0f64;
    let mut peak = 0.0f32;
    for &s in samples {
        let abs_s = s.abs();
        if abs_s > peak {
            peak = abs_s;
        }
        sum_sq += (s as f64) * (s as f64);
    }
    let rms = (sum_sq / n as f64).sqrt() as f32;
    let crest_factor = if rms > 1e-6 {
        (peak / rms) as f64
    } else {
        1.0
    };

    // 2. Zero Crossing Rate
    let mut zero_crossings = 0usize;
    for i in 1..n {
        if (samples[i] >= 0.0 && samples[i - 1] < 0.0) || (samples[i] < 0.0 && samples[i - 1] >= 0.0) {
            zero_crossings += 1;
        }
    }
    let zero_crossing_rate = if n > 1 {
        zero_crossings as f64 / (n - 1) as f64
    } else {
        0.0
    };

    // 3. 3-Band Spectral Energy Ratios (using BiquadFilter from dsp.rs)
    // Low: < 250Hz, Mid: 250Hz - 4000Hz, High: > 4000Hz
    let mut low_filter = BiquadFilter::new();
    low_filter.set_low_pass(sample_rate, 250.0, 0.7071);

    let mut high_filter = BiquadFilter::new();
    high_filter.set_high_pass(sample_rate, 4000.0, 0.7071);

    let mut mid_hp = BiquadFilter::new();
    mid_hp.set_high_pass(sample_rate, 250.0, 0.7071);
    let mut mid_lp = BiquadFilter::new();
    mid_lp.set_low_pass(sample_rate, 4000.0, 0.7071);

    let mut low_energy = 0.0f64;
    let mut mid_energy = 0.0f64;
    let mut high_energy = 0.0f64;

    for &s in samples {
        let l = low_filter.process_sample(s);
        low_energy += (l as f64) * (l as f64);

        let m = mid_lp.process_sample(mid_hp.process_sample(s));
        mid_energy += (m as f64) * (m as f64);

        let h = high_filter.process_sample(s);
        high_energy += (h as f64) * (h as f64);
    }

    let total_band_energy = low_energy + mid_energy + high_energy + 1e-9;
    let low_energy_ratio = low_energy / total_band_energy;
    let mid_energy_ratio = mid_energy / total_band_energy;
    let high_energy_ratio = high_energy / total_band_energy;

    // 4. Spectral Centroid via Radix-2 FFT
    let fft_size = 2048;
    let hop_size = 1024;
    let mut centroid_sum = 0.0f64;
    let mut frame_count = 0usize;

    if n >= fft_size {
        let mut window = vec![0.0f32; fft_size];
        for i in 0..fft_size {
            window[i] = 0.5 * (1.0 - (2.0 * PI * i as f32 / (fft_size as f32 - 1.0)).cos());
        }

        let mut real = vec![0.0f32; fft_size];
        let mut imag = vec![0.0f32; fft_size];

        let mut offset = 0;
        while offset + fft_size <= n {
            for i in 0..fft_size {
                real[i] = samples[offset + i] * window[i];
                imag[i] = 0.0;
            }

            fft_radix2(&mut real, &mut imag);

            let mut num = 0.0f64;
            let mut den = 0.0f64;
            let half = fft_size / 2;
            for k in 0..half {
                let mag = ((real[k] * real[k] + imag[k] * imag[k]) as f64).sqrt();
                let freq = (k as f64) * (sample_rate as f64) / (fft_size as f64);
                num += freq * mag;
                den += mag;
            }

            if den > 1e-6 {
                centroid_sum += num / den;
                frame_count += 1;
            }

            offset += hop_size;
        }
    }

    let spectral_centroid = if frame_count > 0 {
        centroid_sum / frame_count as f64
    } else {
        1000.0
    };

    // 5. Estimated BPM & Pulse Clarity via Onset Novelty & Autocorrelation
    // Frame size ~10ms
    let env_frame_size = (sample_rate * 0.010).round() as usize;
    let mut onset_envelope = Vec::new();

    if env_frame_size > 0 && n > env_frame_size {
        let mut prev_energy = 0.0f32;
        let mut idx = 0;
        while idx + env_frame_size <= n {
            let mut e = 0.0f32;
            for j in 0..env_frame_size {
                let s = samples[idx + j];
                e += s * s;
            }
            let diff = e - prev_energy;
            onset_envelope.push(if diff > 0.0 { diff } else { 0.0 });
            prev_energy = e;
            idx += env_frame_size;
        }
    }

    let (estimated_bpm, pulse_clarity) = if onset_envelope.len() > 100 {
        let env_fps = sample_rate / env_frame_size as f32; // ~100 Hz
        // Autocorrelation for BPM 60..200
        // lag = 60 * env_fps / bpm
        let min_bpm = 60.0f32;
        let max_bpm = 200.0f32;
        let min_lag = (60.0 * env_fps / max_bpm).round() as usize;
        let max_lag = (60.0 * env_fps / min_bpm).round() as usize;

        let num_frames = onset_envelope.len();
        let mut best_lag = min_lag;
        let mut max_corr = -1.0f64;
        let mut sum_corr = 0.0f64;
        let mut count = 0usize;

        for lag in min_lag..=max_lag.min(num_frames / 2) {
            let mut corr = 0.0f64;
            let pairs = num_frames - lag;
            for i in 0..pairs {
                corr += (onset_envelope[i] as f64) * (onset_envelope[i + lag] as f64);
            }
            corr /= pairs as f64;
            sum_corr += corr;
            count += 1;

            if corr > max_corr {
                max_corr = corr;
                best_lag = lag;
            }
        }

        let mean_corr = if count > 0 { sum_corr / count as f64 } else { 0.0 };
        let bpm = 60.0 * (env_fps as f64) / (best_lag as f64);
        let clarity = if max_corr > 1e-9 {
            ((max_corr - mean_corr) / (max_corr + mean_corr)).clamp(0.0, 1.0)
        } else {
            0.0
        };

        (bpm.clamp(50.0, 220.0), clarity)
    } else {
        (120.0, 0.0)
    };

    JsAudioFeatures {
        rms_energy: (rms as f64).clamp(0.0, 1.0),
        crest_factor: crest_factor.clamp(1.0, 50.0),
        zero_crossing_rate: zero_crossing_rate.clamp(0.0, 1.0),
        spectral_centroid: spectral_centroid.clamp(20.0, 20000.0),
        low_energy_ratio: low_energy_ratio.clamp(0.0, 1.0),
        mid_energy_ratio: mid_energy_ratio.clamp(0.0, 1.0),
        high_energy_ratio: high_energy_ratio.clamp(0.0, 1.0),
        estimated_bpm,
        pulse_clarity,
    }
}

/// Radix-2 In-place Cooley-Tukey FFT (Decimation-in-time)
fn fft_radix2(real: &mut [f32], imag: &mut [f32]) {
    let n = real.len();
    assert!(n.is_power_of_two());

    // Bit reversal permutation
    let mut j = 0;
    for i in 0..n {
        if i < j {
            real.swap(i, j);
            imag.swap(i, j);
        }
        let mut bit = n >> 1;
        while j & bit != 0 {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
    }

    // Cooley-Tukey butterflies
    let mut len = 2;
    while len <= n {
        let half = len / 2;
        let angle = -2.0 * PI / (len as f32);
        let w_step_real = angle.cos();
        let w_step_imag = angle.sin();

        let mut i = 0;
        while i < n {
            let mut w_real = 1.0f32;
            let mut w_imag = 0.0f32;

            for k in 0..half {
                let u_real = real[i + k];
                let u_imag = imag[i + k];

                let v_real = real[i + k + half] * w_real - imag[i + k + half] * w_imag;
                let v_imag = real[i + k + half] * w_imag + imag[i + k + half] * w_real;

                real[i + k] = u_real + v_real;
                imag[i + k] = u_imag + v_imag;
                real[i + k + half] = u_real - v_real;
                imag[i + k + half] = u_imag - v_imag;

                let next_w_real = w_real * w_step_real - w_imag * w_step_imag;
                let next_w_imag = w_real * w_step_imag + w_imag * w_step_real;
                w_real = next_w_real;
                w_imag = next_w_imag;
            }
            i += len;
        }
        len <<= 1;
    }
}

/// Analyzes an audio file statelessly by decoding 3 representative 4-second windows.
/// Never locks GLOBAL_ENGINE.
pub fn analyze_audio_file(file_path: &str) -> Result<JsAudioFeatures, String> {
    let path = Path::new(file_path);
    if !path.exists() {
        return Err(format!("File not found: {}", file_path));
    }

    let file = File::open(path).map_err(|e| format!("Failed to open file '{}': {}", file_path, e))?;
    let mss = MediaSourceStream::new(Box::new(file), Default::default());

    let mut hint = Hint::new();
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        hint.with_extension(ext);
    }

    let mut format_reader = get_probe()
        .probe(&hint, mss, Default::default(), Default::default())
        .map_err(|e| format!("Failed to probe audio file: {}", e))?;

    let track = format_reader
        .default_track(TrackType::Audio)
        .ok_or_else(|| "No default audio track found in file".to_string())?;

    let codec_params = track
        .codec_params
        .as_ref()
        .and_then(|cp| cp.audio())
        .ok_or_else(|| "No audio codec parameters found in track".to_string())?;

    let track_id = track.id;
    let sample_rate = codec_params.sample_rate.unwrap_or(44100) as f32;
    let channels = codec_params.channels.as_ref().map(|c| c.count()).unwrap_or(2).max(1);

    let duration_secs = if let Some(n_frames) = track.num_frames {
        n_frames as f64 / sample_rate as f64
    } else if let (Some(tb), Some(dur)) = (track.time_base, track.duration) {
        tb.calc_duration(dur).map(|t| t.as_secs_f64()).unwrap_or(180.0)
    } else {
        180.0
    };

    let decoder_opts: AudioDecoderOptions = Default::default();
    let mut decoder = symphonia::default::get_codecs()
        .make_audio_decoder(codec_params, &decoder_opts)
        .map_err(|e| format!("Failed to create codec decoder: {}", e))?;

    // Determine sample windows (4 seconds each at 25%, 50%, 75% of duration)
    let window_secs = 4.0;
    let target_windows = if duration_secs > 12.0 {
        vec![
            duration_secs * 0.25,
            duration_secs * 0.50,
            duration_secs * 0.75,
        ]
    } else {
        vec![0.0]
    };

    let mut mono_samples = Vec::new();
    let max_samples_per_window = (window_secs * sample_rate) as usize;

    for target_sec in target_windows {
        if target_sec > 0.0 {
            let time = Time::try_from_secs_f64(target_sec).unwrap_or(Time::ZERO);
            let _ = format_reader.seek(SeekMode::Coarse, SeekTo::Time { time, track_id: Some(track_id) });
            decoder.reset();
        }

        let mut samples_in_window = 0usize;
        let mut raw_buf = Vec::new();

        while samples_in_window < max_samples_per_window {
            match format_reader.next_packet() {
                Ok(Some(packet)) => {
                    if packet.track_id != track_id {
                        continue;
                    }
                    match decoder.decode(&packet) {
                        Ok(decoded) => {
                            let n_samples = decoded.samples_interleaved();
                            if raw_buf.len() < n_samples {
                                raw_buf.resize(n_samples, 0.0);
                            }
                            decoded.copy_to_slice_interleaved(&mut raw_buf[..n_samples]);

                            // Downmix to mono
                            for frame in raw_buf[..n_samples].chunks(channels) {
                                let mono = frame.iter().copied().sum::<f32>() / (frame.len() as f32);
                                mono_samples.push(mono);
                                samples_in_window += 1;
                                if samples_in_window >= max_samples_per_window {
                                    break;
                                }
                            }
                        }
                        Err(_) => break,
                    }
                }
                _ => break,
            }
        }
    }

    if mono_samples.is_empty() {
        return Ok(JsAudioFeatures::default());
    }

    Ok(compute_dsp_features(&mono_samples, sample_rate))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fft_radix2_impulse() {
        let mut real = vec![0.0f32; 16];
        let mut imag = vec![0.0f32; 16];
        real[0] = 1.0; // impulse at 0 -> flat spectrum of 1.0

        fft_radix2(&mut real, &mut imag);

        for k in 0..16 {
            let mag = (real[k] * real[k] + imag[k] * imag[k]).sqrt();
            assert!((mag - 1.0).abs() < 1e-4, "Bin {} mag was {}", k, mag);
        }
    }

    #[test]
    fn test_compute_dsp_features_low_frequency_sine() {
        // 100 Hz sine wave at 44100 Hz sample rate (should have high low_energy_ratio)
        let sample_rate = 44100.0f32;
        let freq = 100.0f32;
        let mut samples = vec![0.0f32; 44100];
        for i in 0..samples.len() {
            samples[i] = (2.0 * PI * freq * i as f32 / sample_rate).sin();
        }

        let features = compute_dsp_features(&samples, sample_rate);
        assert!(features.rms_energy > 0.6 && features.rms_energy < 0.8);
        assert!(features.low_energy_ratio > features.mid_energy_ratio);
        assert!(features.low_energy_ratio > features.high_energy_ratio);
        assert!(features.spectral_centroid < 500.0);
    }

    #[test]
    fn test_compute_dsp_features_high_frequency_sine() {
        // 8000 Hz sine wave at 44100 Hz sample rate (should have high high_energy_ratio)
        let sample_rate = 44100.0f32;
        let freq = 8000.0f32;
        let mut samples = vec![0.0f32; 44100];
        for i in 0..samples.len() {
            samples[i] = (2.0 * PI * freq * i as f32 / sample_rate).sin();
        }

        let features = compute_dsp_features(&samples, sample_rate);
        assert!(features.high_energy_ratio > features.low_energy_ratio);
        assert!(features.spectral_centroid > 5000.0);
    }

    #[test]
    fn test_compute_dsp_features_empty_samples() {
        let features = compute_dsp_features(&[], 44100.0);
        assert_eq!(features.rms_energy, 0.0);
        assert_eq!(features.estimated_bpm, 120.0);
    }
}
