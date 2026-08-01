use rubato::{
    Resampler, SincFixedIn, SincInterpolationParameters, SincInterpolationType, WindowFunction,
};

// ─── OLA parameters ──────────────────────────────────────────────────────────
// 50% overlap with 2048-sample windows gives clean crossfades up to 4x speed.
const OLA_WINDOW: usize = 2048;
const OLA_SYNTH_HOP: usize = OLA_WINDOW / 2; // 1024 samples per output hop

// ─── OLA Time-Stretcher ──────────────────────────────────────────────────────
/// Overlap-Add time-stretcher. Changes playback speed WITHOUT changing pitch.
///
/// How it works:
///   analysis_hop = synthesis_hop × speed_rate
///   → at 2×, we consume 2048 input samples per 1024 output samples  (2× faster)
///   → at 0.5×, we consume  512 input samples per 1024 output samples (0.5× faster)
///   The Hann window is applied to each analysis frame before overlap-add, so
///   the frequency content (= pitch) of each frame is unchanged.
struct OlaStretcher {
    channels: usize,
    speed_rate: f32,
    input_buffer: Vec<Vec<f32>>,
    synthesis_buffer: Vec<Vec<f32>>, // running OLA accumulator (size = OLA_WINDOW)
    output_pending: Vec<Vec<f32>>,
    analysis_read_pos: usize,        // read offset into input_buffer
    hann: Vec<f32>,
}

impl OlaStretcher {
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
        }
    }

    fn set_speed(&mut self, rate: f32) {
        self.speed_rate = rate.clamp(0.25, 4.0);
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
        // analysis_hop controls how fast we consume the input (= speed control).
        // Larger hop → faster playback → same pitch (OLA preserves frequency content).
        let analysis_hop = ((OLA_SYNTH_HOP as f32 * self.speed_rate) as usize).max(1);

        loop {
            if self.input_buffer[0].len() < self.analysis_read_pos + OLA_WINDOW {
                break;
            }

            let start = self.analysis_read_pos;

            // Overlap-add windowed analysis frame into synthesis accumulator
            for ch in 0..self.channels {
                for i in 0..OLA_WINDOW {
                    self.synthesis_buffer[ch][i] +=
                        self.input_buffer[ch][start + i] * self.hann[i];
                }
            }

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

            // Advance the analysis read position
            self.analysis_read_pos += analysis_hop;

            // Drain fully consumed input samples to bound memory usage
            let safe_drain = self.analysis_read_pos.saturating_sub(OLA_WINDOW);
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
///   1. OLA time-stretcher  → changes speed, preserves pitch (only active when speed ≠ 1×)
///   2. SincFixedIn resampler → corrects device sample-rate mismatch at a fixed ratio
///      (e.g. 44100 Hz file → 48000 Hz hardware), never changes ratio.
pub struct SpeedResampler {
    ola: OlaStretcher,
    speed_rate: f32,

    sinc: Option<SincFixedIn<f32>>,
    channels: usize,
    sinc_in_buffers: Vec<Vec<f32>>,
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
        let ola = OlaStretcher::new(channels);

        // Stage 2: fixed-ratio device resampler (only created when rates differ)
        let sinc = if file_sample_rate != output_sample_rate {
            let ratio = output_sample_rate as f64 / file_sample_rate as f64;
            let params = SincInterpolationParameters {
                sinc_len: 64,
                f_cutoff: 0.95,
                interpolation: SincInterpolationType::Linear,
                oversampling_factor: 128,
                window: WindowFunction::BlackmanHarris2,
            };
            Some(
                SincFixedIn::<f32>::new(
                    ratio,
                    1.1, // fixed ratio ± 10% jitter tolerance
                    params,
                    chunk_size,
                    channels,
                )
                .expect("Failed to create device-rate SincFixedIn resampler"),
            )
        } else {
            None
        };

        Self {
            ola,
            speed_rate: 1.0,
            sinc,
            channels,
            sinc_in_buffers: vec![Vec::new(); channels],
            sinc_chunk_size: chunk_size,
        }
    }

    /// Set playback speed. Range 0.25×–4.0× (pitch is always preserved).
    pub fn set_playback_rate(&mut self, rate: f32) -> Result<(), String> {
        let clamped = rate.clamp(0.25, 4.0);
        self.speed_rate = clamped;
        self.ola.set_speed(clamped);
        Ok(())
    }

    /// Process interleaved PCM samples.
    /// Returns resampled, time-stretched samples at the hardware output rate.
    pub fn process_interleaved(&mut self, input: &[f32]) -> Result<Vec<f32>, String> {
        // Stage 1: OLA time-stretch (skip at exactly 1× to avoid artifacts)
        let after_ola = if (self.speed_rate - 1.0).abs() < 0.001 {
            input.to_vec()
        } else {
            self.ola.push_interleaved(input);
            self.ola.drain_interleaved()
        };

        // Stage 2: device sample-rate correction
        if self.sinc.is_none() {
            return Ok(after_ola);
        }

        self.run_sinc_resample(&after_ola)
    }

    fn run_sinc_resample(&mut self, interleaved: &[f32]) -> Result<Vec<f32>, String> {
        // Deinterleave into per-channel buffers
        let frames = interleaved.len() / self.channels;
        for i in 0..frames {
            for ch in 0..self.channels {
                self.sinc_in_buffers[ch].push(interleaved[i * self.channels + ch]);
            }
        }

        let mut output = Vec::new();

        while self.sinc_in_buffers[0].len() >= self.sinc_chunk_size {
            let chunk: Vec<Vec<f32>> = (0..self.channels)
                .map(|ch| {
                    self.sinc_in_buffers[ch]
                        .drain(0..self.sinc_chunk_size)
                        .collect()
                })
                .collect();

            if let Some(ref mut sinc) = self.sinc {
                let mut out_buf =
                    vec![vec![0f32; sinc.output_frames_max()]; self.channels];
                let (_in_used, out_frames) = sinc
                    .process_into_buffer(&chunk, &mut out_buf, None)
                    .map_err(|e| format!("Device resampling error: {}", e))?;

                for f in 0..out_frames {
                    for ch in 0..self.channels {
                        output.push(out_buf[ch][f]);
                    }
                }
            }
        }

        Ok(output)
    }
}
