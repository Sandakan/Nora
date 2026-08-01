use audio_engine::engine::PlayerEngine;
use audio_engine::ticker::EngineTickPayload;
use std::env;
use std::io::{self, Write};
use std::thread;
use std::time::Duration;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        println!("Usage: cargo run --example cli_player -- <path-to-audio-file>");
        println!("Example: cargo run --example cli_player -- sample.flac");
        return Ok(());
    }

    let file_path = &args[1];
    println!("Initializing Audio Engine...");
    let mut engine = PlayerEngine::new();

    println!("Available audio output devices:");
    for (idx, name) in engine.list_devices().iter().enumerate() {
        println!("  [{}] {}", idx, name);
    }

    println!("\nAttempting to play file: {}", file_path);

    engine.play_file(
        file_path,
        Some(|tick: EngineTickPayload| {
            print!(
                "\r[TICK] Position: {:.2}s | Playing: {}   ",
                tick.position, tick.is_playing
            );
            let _ = io::stdout().flush();
        }),
        Some(|| {
            println!("\n[EVENT] Song finished playing (EOF reached)!");
        }),
        Some(|err: String| {
            println!("\n[ERROR] Audio playback error: {}", err);
        }),
    )?;

    println!("Playing! Duration: {:.2}s", engine.get_duration());
    println!("\nInteractive CLI Controls:");
    println!("  p - Pause / Resume (with 250ms volume ramp)");
    println!("  + / - - Volume Up / Down");
    println!("  > / < - Seek +10s / -10s");
    println!("  1..9 - Boost/cut 1kHz EQ band (-12dB to +12dB)");
    println!("  r - Reset EQ");
    println!("  s - Toggle speed (1.0x <-> 1.5x with pitch preservation)");
    println!("  q - Quit CLI player\n");

    loop {
        thread::sleep(Duration::from_millis(500));
        if !engine.is_playing() && engine.get_position() >= engine.get_duration() && engine.get_duration() > 0.0 {
            println!("\nPlayback finished cleanly.");
            break;
        }
    }

    engine.stop();
    println!("Engine stopped gracefully.");
    Ok(())
}
