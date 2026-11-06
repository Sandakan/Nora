use rubato::audioadapter_buffers::direct::InterleavedSlice;
use rubato::{
    Async, FixedAsync, Resampler, SincInterpolationParameters, SincInterpolationType, WindowFunction,
};

// ─── WSOLA parameters ────────────────────────────────────────────────────────
// 2048-sample windows with 1024-sample synthesis hops (50% overlap).
const OLA_WINDOW: usize = 2048;
const OLA_SYNTH_HOP: usize = OLA_WINDOW / 2; // 1024 samples per output hop
const WSOLA_SEARCH_DELTA: usize = 256;       // Search window for waveform similarity

// ─── WSOLA Time-Stretcher ────────────────────────────────────────────────────
/// Waveform Similarity Overlap-Add (WSOLA) time-stretcher.
/// Changes playback speed WITHOUT changing pitch or causing robotic phase comb filtering.
struct WsolaStretcher {
    channels: usize,
    speed_rate: f32,
    input_buffer: Vec<Vec<f32>>,
    synthesis_buffer: Vec<Vec<f32>>, // running OLA accumulator (size = OLA_WINDOW)
    output_pending: Vec<Vec<f32>>,
    analysis_read_pos: usize,        // nominal read offset into input_buffer
    hann: Vec<f32>,
    has_template: bool,
}

impl WsolaStretcher {
    fn new(channels: usize) -> Self {
        let hann: Vec<f32> = (0..OLA_WINDOW)
            .map(|i| {
                0.5 * (1.0
                    - (2.0 * std::f32::consts::PI * i as f32 / (OLA_WINDOW - 1) as f32).cos())
            })
            .collect();

        Self {
            channels,
            speed_rate: 1.0,
            input_buffer: vec![Vec::new(); channels],
            synthesis_buffer: vec![vec![0.0f32; OLA_WINDOW]; channels],
            output_pending: vec![Vec::new(); channels],
            analysis_read_pos: 0,
            hann,
            has_template: false,
        }
    }

    fn set_speed(&mut self, rate: f32) {
        let new_rate = rate.clamp(0.25, 4.0);
        if (self.speed_rate - new_rate).abs() > 0.001 {
            self.speed_rate = new_rate;
            self.reset();
        }
    }

    fn reset(&mut self) {
        for ch in 0..self.channels {
            self.input_buffer[ch].clear();
            self.synthesis_buffer[ch].fill(0.0);
            self.output_pending[ch].clear();
        }
        self.analysis_read_pos = 0;
        self.has_template = false;
    }

    fn push_interleaved(&mut self, samples: &[f32]) {
        let frames = samples.len() / self.channels;
        for i in 0..frames {
            for ch in 0..self.channels {
                self.input_buffer[ch].push(samples[i * self.channels + ch]);
            }
        }
        self.process();
    }

    fn process(&mut self) {
        let analysis_hop = ((OLA_SYNTH_HOP as f32 * self.speed_rate) as usize).max(1);

        loop {
            // Ensure we have enough samples for the search delta plus window
            let min_required = self.analysis_read_pos + WSOLA_SEARCH_DELTA + OLA_WINDOW;
            if self.input_buffer[0].len() < min_required {
                break;
            }

            // Find best candidate start position using cross-correlation with previous synthesis tail
            let best_start = if self.has_template {
                let nominal = self.analysis_read_pos;
                let min_start = nominal.saturating_sub(WSOLA_SEARCH_DELTA);
                let max_start = (nominal + WSOLA_SEARCH_DELTA).min(self.input_buffer[0].len() - OLA_WINDOW);

                let mut best_score = f32::MIN;
                let mut best_pos = nominal;

                // Step candidate positions by 2 for computational efficiency in real-time
                for cand in (min_start..=max_start).step_by(2) {
                    let mut score = 0.0f32;
                    for ch in 0..self.channels {
                        let inp = &self.input_buffer[ch];
                        let tmpl = &self.synthesis_buffer[ch];
                        for i in (0..OLA_SYNTH_HOP).step_by(4) {
                            score += inp[cand + i] * tmpl[i];
                        }
                    }
                    if score > best_score {
                        best_score = score;
                        best_pos = cand;
                    }
                }
                best_pos
            } else {
                self.analysis_read_pos
            };

            // Overlap-add windowed analysis frame into synthesis accumulator
            for ch in 0..self.channels {
                for i in 0..OLA_WINDOW {
                    self.synthesis_buffer[ch][i] +=
                        self.input_buffer[ch][best_start + i] * self.hann[i];
                }
            }
            self.has_template = true;

            // Emit the first OLA_SYNTH_HOP samples as output
            for ch in 0..self.channels {
                self.output_pending[ch]
                    .extend_from_slice(&self.synthesis_buffer[ch][..OLA_SYNTH_HOP]);
            }

            // Shift synthesis buffer left by OLA_SYNTH_HOP, zero-fill the tail
            for ch in 0..self.channels {
                self.synthesis_buffer[ch].rotate_left(OLA_SYNTH_HOP);
                let tail_start = OLA_WINDOW - OLA_SYNTH_HOP;
                for i in tail_start..OLA_WINDOW {
                    self.synthesis_buffer[ch][i] = 0.0;
                }
            }

            // Advance nominal analysis position from best_start
            self.analysis_read_pos = best_start + analysis_hop;

            // Drain consumed input samples to bound memory usage
            let safe_drain = self.analysis_read_pos.saturating_sub(WSOLA_SEARCH_DELTA + OLA_WINDOW);
            if safe_drain > 0 {
                for ch in 0..self.channels {
                    self.input_buffer[ch].drain(0..safe_drain);
                }
                self.analysis_read_pos -= safe_drain;
            }
        }
    }

    fn drain_interleaved(&mut self) -> Vec<f32> {
        let frames = self.output_pending[0].len();
        if frames == 0 {
            return Vec::new();
        }
        let mut out = Vec::with_capacity(frames * self.channels);
        for f in 0..frames {
            for ch in 0..self.channels {
                out.push(self.output_pending[ch][f]);
            }
        }
        for ch in 0..self.channels {
            self.output_pending[ch].clear();
        }
        out
    }
}

// ─── Public SpeedResampler ───────────────────────────────────────────────────
/// Two-stage audio pipeline:
///   1. WSOLA time-stretcher → changes speed, preserves pitch with waveform alignment
///   2. Rubato 5 Async resampler → corrects device sample-rate mismatch at a fixed ratio
pub struct SpeedResampler {
    stretcher: WsolaStretcher,
    speed_rate: f32,

    sinc: Option<Async<f32>>,
    channels: usize,
    interleaved_in_buffer: Vec<f32>,
    sinc_chunk_size: usize,
}

impl SpeedResampler {
    pub fn new(
        file_sample_rate: u32,
        output_sample_rate: u32,
        channels: usize,
        chunk_size: usize,
    ) -> Self {
        let channels = channels.max(1);
        let stretcher = WsolaStretcher::new(channels);

        // Stage 2: fixed-ratio device resampler (only created when rates differ)
        let sinc = if file_sample_rate != output_sample_rate {
            let ratio = output_sample_rate as f64 / file_sample_rate as f64;
            let params = SincInterpolationParameters {
                sinc_len: 64,
                f_cutoff: Some(0.95),
                interpolation: SincInterpolationType::Linear,
                oversampling_factor: 128,
                window: WindowFunction::BlackmanHarris2,
            };
            Some(
                Async::<f32>::new_sinc(
                    ratio,
                    1.1, // fixed ratio ± 10% jitter tolerance
                    &params,
                    chunk_size,
                    channels,
                    FixedAsync::Input,
                )
                .expect("Failed to create device-rate Sinc resampler"),
            )
        } else {
            None
        };

        Self {
            stretcher,
            speed_rate: 1.0,
            sinc,
            channels,
            interleaved_in_buffer: Vec::new(),
            sinc_chunk_size: chunk_size,
        }
    }

    /// Reset all internal buffers, OLA history, and resampler delay.
    pub fn reset(&mut self) {
        self.stretcher.reset();
        self.interleaved_in_buffer.clear();
        if let Some(ref mut sinc) = self.sinc {
            let _ = sinc.reset();
        }
    }

    /// Set playback speed. Range 0.25×–4.0× (pitch is always preserved).
    pub fn set_playback_rate(&mut self, rate: f32) -> Result<(), String> {
        let clamped = rate.clamp(0.25, 4.0);
        self.speed_rate = clamped;
        self.stretcher.set_speed(clamped);
        Ok(())
    }

    /// Process interleaved PCM samples.
    /// Returns resampled, time-stretched samples at the hardware output rate.
    pub fn process_interleaved(&mut self, input: &[f32]) -> Result<Vec<f32>, String> {
        // Stage 1: WSOLA time-stretch (skip at exactly 1× to avoid artifacts)
        let after_stretch = if (self.speed_rate - 1.0).abs() < 0.001 {
            input.to_vec()
        } else {
            self.stretcher.push_interleaved(input);
            self.stretcher.drain_interleaved()
        };

        // Stage 2: device sample-rate correction
        if self.sinc.is_none() {
            return Ok(after_stretch);
        }

        self.run_sinc_resample(&after_stretch)
    }

    fn run_sinc_resample(&mut self, interleaved: &[f32]) -> Result<Vec<f32>, String> {
        self.interleaved_in_buffer.extend_from_slice(interleaved);

        let chunk_samples = self.sinc_chunk_size * self.channels;
        let mut output = Vec::new();

        while self.interleaved_in_buffer.len() >= chunk_samples {
            let chunk: Vec<f32> = self.interleaved_in_buffer.drain(0..chunk_samples).collect();

            if let Some(ref mut sinc) = self.sinc {
                let in_adapter = InterleavedSlice::new(&chunk, self.channels, self.sinc_chunk_size)
                    .map_err(|e| format!("Resampling buffer error: {}", e))?;
                let out_owned = sinc
                    .process(&in_adapter, None)
                    .map_err(|e| format!("Device resampling error: {}", e))?;
                output.extend(out_owned.take_data());
            }
        }

        Ok(output)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wsola_speed_change_and_reset() {
        let mut resampler = SpeedResampler::new(44100, 44100, 2, 1024);
        assert!(resampler.set_playback_rate(1.5).is_ok());

        // Generate synthetic stereo sine wave
        let sample_count = 8192;
        let mut input = Vec::with_capacity(sample_count * 2);
        for i in 0..sample_count {
            let s = (i as f32 * 0.1).sin();
            input.push(s);
            input.push(s * 0.5);
        }

        let out = resampler.process_interleaved(&input).unwrap();
        // At 1.5x speed, output should be produced without NaN
        for &s in out.iter() {
            assert!(!s.is_nan(), "Output contained NaN sample");
        }

        // Test reset on transition back to 1.0x
        resampler.reset();
        assert!(resampler.set_playback_rate(1.0).is_ok());
        let out_1x = resampler.process_interleaved(&input).unwrap();
        assert_eq!(out_1x.len(), input.len());
        assert_eq!(out_1x, input);

        // Transition back to 1.25x after reset
        assert!(resampler.set_playback_rate(1.25).is_ok());
        let out_fast = resampler.process_interleaved(&input).unwrap();
        for &s in out_fast.iter() {
            assert!(!s.is_nan(), "Output contained NaN sample after reset");
        }
    }
}
