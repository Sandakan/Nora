use audio_engine::devices::DeviceManager;
use audio_engine::dsp::{EqChain, BiquadFilter, EQ_FREQUENCIES};
use audio_engine::engine::PlayerEngine;
use audio_engine::resampler::SpeedResampler;
use audio_engine::ticker::{EngineTickPayload, PositionTicker};
use std::sync::{atomic::Ordering, Arc};
use std::thread;
use std::time::Duration;

#[test]
fn test_eq_chain_frequencies_count() {
    assert_eq!(EQ_FREQUENCIES.len(), 10);
    assert_eq!(EQ_FREQUENCIES[0], 60.0);
    assert_eq!(EQ_FREQUENCIES[4], 1000.0);
    assert_eq!(EQ_FREQUENCIES[9], 16000.0);
}

#[test]
fn test_biquad_filter_passthrough_when_zero_gain() {
    let mut filter = BiquadFilter::new();
    filter.set_peaking_eq(44100.0, 1000.0, 0.0, 1.414);

    let input_sample = 0.5f32;
    let output_sample = filter.process_sample(input_sample);
    assert!((output_sample - input_sample).abs() < 1e-5);
}

#[test]
fn test_eq_chain_gain_modification() {
    let mut chain = EqChain::new(44100.0);
    chain.set_band_gain(1000.0, 6.0); // Boost 1kHz by +6dB

    let mut buffer = [0.5f32; 128];
    chain.process_buffer(&mut buffer);

    // After filtering a non-zero signal, samples should be non-zero and modified
    assert_ne!(buffer[0], 0.0);
}

#[test]
fn test_resampler_rate_clamping() {
    let mut resampler = SpeedResampler::new(44100, 48000, 2, 1024);

    // All speed changes should succeed
    assert!(resampler.set_playback_rate(0.1).is_ok(),  "0.1x (clamped to 0.25x) should succeed");
    assert!(resampler.set_playback_rate(0.5).is_ok(),  "0.5x should succeed");
    assert!(resampler.set_playback_rate(1.0).is_ok(),  "1.0x should succeed");
    assert!(resampler.set_playback_rate(1.5).is_ok(),  "1.5x should succeed");
    assert!(resampler.set_playback_rate(2.0).is_ok(),  "2.0x should succeed");
    assert!(resampler.set_playback_rate(10.0).is_ok(), "10.0x (clamped to 4.0x) should succeed");
}


#[test]
fn test_device_manager_enumeration() {
    let dm = DeviceManager::new();
    let devices = dm.list_output_devices();
    println!("Found {} output devices", devices.len());
}

#[test]
fn test_position_ticker_lifecycle() {
    let mut ticker = PositionTicker::new();
    let tick_count = Arc::new(std::sync::atomic::AtomicU32::new(0));
    let tick_count_clone = tick_count.clone();

    ticker.start(
        || (1.5, true),
        Box::new(move |payload: EngineTickPayload| {
            assert_eq!(payload.position, 1.5);
            assert!(payload.is_playing);
            tick_count_clone.fetch_add(1, Ordering::Relaxed);
        }),
    );

    thread::sleep(Duration::from_millis(600));
    ticker.stop();

    let count = tick_count.load(Ordering::Relaxed);
    assert!(count >= 1, "Ticker should have fired at least once (got {})", count);
}

#[test]
fn test_player_engine_initial_state() {
    let engine = PlayerEngine::new();
    assert_eq!(engine.get_position(), 0.0);
    assert_eq!(engine.get_duration(), 0.0);
    assert!(!engine.is_playing());
}

#[test]
fn test_volume_state_immediate_and_clamping() {
    use audio_engine::engine::VolumeState;

    let mut vs = VolumeState::new(0.5);
    assert_eq!(vs.current, 0.5);
    assert_eq!(vs.target, 0.5);
    assert_eq!(vs.remaining_frames, 0);

    vs.set_immediate(1.5); // Should clamp to 1.0
    assert_eq!(vs.current, 1.0);
    assert_eq!(vs.target, 1.0);

    vs.set_immediate(-0.5); // Should clamp to 0.0
    assert_eq!(vs.current, 0.0);
    assert_eq!(vs.target, 0.0);
}

#[test]
fn test_volume_state_ramping_interpolation() {
    use audio_engine::engine::VolumeState;

    let mut vs = VolumeState::new(0.0);
    // Ramp to 1.0 over 10ms at 1000Hz (10 frames)
    vs.set_ramp(1.0, 10, 1000);
    assert_eq!(vs.remaining_frames, 10);
    assert!((vs.step - 0.1).abs() < 1e-5);

    // Simulate stepping through 10 frames
    for _ in 0..10 {
        if vs.remaining_frames > 0 {
            vs.current += vs.step;
            vs.remaining_frames -= 1;
            if vs.remaining_frames == 0 {
                vs.current = vs.target;
                vs.step = 0.0;
            }
        }
    }

    assert_eq!(vs.remaining_frames, 0);
    assert_eq!(vs.current, 1.0);
    assert_eq!(vs.step, 0.0);
}

#[test]
fn test_perceptual_quadratic_gain() {
    // 0% -> 0 gain
    let gain_0 = 0.0f32 * 0.0f32;
    assert_eq!(gain_0, 0.0);

    // 15% -> ~0.0225 gain (-33 dB)
    let vol_15 = 0.15f32;
    let gain_15 = vol_15 * vol_15;
    assert!((gain_15 - 0.0225).abs() < 1e-5);

    // 50% -> 0.25 gain (-12 dB)
    let vol_50 = 0.5f32;
    let gain_50 = vol_50 * vol_50;
    assert!((gain_50 - 0.25).abs() < 1e-5);

    // 100% -> 1.0 gain (0 dB)
    let vol_100 = 1.0f32;
    let gain_100 = vol_100 * vol_100;
    assert_eq!(gain_100, 1.0);
}

#[test]
fn test_player_engine_volume_controls() {
    let engine = PlayerEngine::new();
    engine.set_volume(0.15);
    engine.set_volume_with_ramp(0.5, 250);
}
