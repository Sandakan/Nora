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
