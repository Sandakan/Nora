use std::f32::consts::PI;

pub const EQ_FREQUENCIES: [f32; 10] = [
    60.0, 170.0, 310.0, 600.0, 1000.0, 3000.0, 6000.0, 12000.0, 14000.0, 16000.0,
];

#[derive(Debug, Clone, Copy)]
pub struct BiquadFilter {
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
}

impl BiquadFilter {
    pub fn new() -> Self {
        Self {
            b0: 1.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
        }
    }

    /// Configures a peaking EQ filter based on RBJ Audio EQ Cookbook.
    pub fn set_peaking_eq(&mut self, sample_rate: f32, freq_hz: f32, gain_db: f32, q: f32) {
        if gain_db.abs() < 0.01 {
            // Passthrough (flat)
            self.b0 = 1.0;
            self.b1 = 0.0;
            self.b2 = 0.0;
            self.a1 = 0.0;
            self.a2 = 0.0;
            return;
        }

        let a = 10.0f32.powf(gain_db / 40.0);
        let w0 = 2.0 * PI * (freq_hz / sample_rate);
        let alpha = w0.sin() / (2.0 * q);

        let b0 = 1.0 + alpha * a;
        let b1 = -2.0 * w0.cos();
        let b2 = 1.0 - alpha * a;
        let a0 = 1.0 + alpha / a;
        let a1 = -2.0 * w0.cos();
        let a2 = 1.0 - alpha / a;

        self.b0 = b0 / a0;
        self.b1 = b1 / a0;
        self.b2 = b2 / a0;
        self.a1 = a1 / a0;
        self.a2 = a2 / a0;
    }

    #[inline]
    pub fn process_sample(&mut self, input: f32) -> f32 {
        let output = self.b0 * input + self.b1 * self.x1 + self.b2 * self.x2
            - self.a1 * self.y1
            - self.a2 * self.y2;

        self.x2 = self.x1;
        self.x1 = input;
        self.y2 = self.y1;
        self.y1 = output;

        output
    }

    pub fn reset_state(&mut self) {
        self.x1 = 0.0;
        self.x2 = 0.0;
        self.y1 = 0.0;
        self.y2 = 0.0;
    }
}

pub struct EqChain {
    sample_rate: f32,
    filters: [[BiquadFilter; 10]; 2],
    gains_db: [f32; 10],
    enabled: bool,
}

impl EqChain {
    pub fn new(sample_rate: f32) -> Self {
        let mut chain = Self {
            sample_rate,
            filters: [[BiquadFilter::new(); 10]; 2],
            gains_db: [0.0; 10],
            enabled: false,
        };
        chain.update_filters();
        chain
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        if (self.sample_rate - sample_rate).abs() > 1.0 {
            self.sample_rate = sample_rate;
            self.update_filters();
        }
    }

    pub fn set_band_gain(&mut self, freq_hz: f32, gain_db: f32) {
        // Find closest band frequency index
        let mut closest_idx = 0;
        let mut min_diff = f32::MAX;
        for (i, &band_freq) in EQ_FREQUENCIES.iter().enumerate() {
            let diff = (band_freq - freq_hz).abs();
            if diff < min_diff {
                min_diff = diff;
                closest_idx = i;
            }
        }

        self.gains_db[closest_idx] = gain_db.clamp(-24.0, 24.0);
        self.update_filters();
    }

    pub fn set_all_gains(&mut self, gains: &[f32]) {
        for (i, &gain) in gains.iter().take(10).enumerate() {
            self.gains_db[i] = gain.clamp(-24.0, 24.0);
        }
        self.update_filters();
    }

    pub fn reset_all_gains(&mut self) {
        self.gains_db = [0.0; 10];
        self.update_filters();
    }

    fn update_filters(&mut self) {
        let mut any_non_zero = false;
        for (i, &freq) in EQ_FREQUENCIES.iter().enumerate() {
            let gain = self.gains_db[i];
            if gain.abs() >= 0.01 {
                any_non_zero = true;
            }
            self.filters[0][i].set_peaking_eq(self.sample_rate, freq, gain, 1.414);
            self.filters[1][i].set_peaking_eq(self.sample_rate, freq, gain, 1.414);
        }
        self.enabled = any_non_zero;
    }

    #[inline]
    pub fn process_interleaved_stereo(&mut self, buffer: &mut [f32]) {
        if !self.enabled {
            return;
        }

        for frame in buffer.chunks_exact_mut(2) {
            let mut l = frame[0];
            let mut r = frame[1];
            for i in 0..10 {
                l = self.filters[0][i].process_sample(l);
                r = self.filters[1][i].process_sample(r);
            }
            frame[0] = l;
            frame[1] = r;
        }
    }

    #[inline]
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        self.process_interleaved_stereo(buffer);
    }

    pub fn reset_state(&mut self) {
        for ch in 0..2 {
            for filter in self.filters[ch].iter_mut() {
                filter.reset_state();
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_eq_channel_isolation_no_crosstalk() {
        let mut chain = EqChain::new(48000.0);
        chain.set_band_gain(1000.0, 6.0);

        // Interleaved stereo buffer: Left has impulse, Right is strictly silence (0.0)
        let mut buffer = [0.0f32; 32];
        for i in (0..32).step_by(2) {
            buffer[i] = 1.0; // Left channel has 1.0
            buffer[i + 1] = 0.0; // Right channel is 0.0
        }

        chain.process_buffer(&mut buffer);

        // Verify Right channel remains 100% zero - no crosstalk from Left channel biquad state!
        for i in (0..32).step_by(2) {
            assert_eq!(buffer[i + 1], 0.0, "Right channel had crosstalk at frame {}", i / 2);
        }
    }

    #[test]
    fn test_eq_chain_batch_gains() {
        let mut chain = EqChain::new(48000.0);
        let test_gains = [1.0, 2.0, 3.0, 4.0, 5.0, -1.0, -2.0, -3.0, -4.0, -5.0];
        chain.set_all_gains(&test_gains);
        for i in 0..10 {
            assert_eq!(chain.gains_db[i], test_gains[i]);
        }
        assert!(chain.enabled);

        chain.reset_all_gains();
        for i in 0..10 {
            assert_eq!(chain.gains_db[i], 0.0);
        }
        assert!(!chain.enabled);
    }
}
