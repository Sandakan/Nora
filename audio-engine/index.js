const fs = require('fs');
const path = require('path');

const { platform, arch } = process;

let nativeBinding = null;

const candidateFilenames = [
  `audio-engine.${platform}-${arch}.node`,
  `audio-engine.${platform}-${arch}-msvc.node`,
  `audio-engine.${platform}-${arch}-gnu.node`,
  'audio-engine.node'
];

const candidateDirs = [__dirname, path.join(__dirname, 'dist')];

for (const dir of candidateDirs) {
  if (!fs.existsSync(dir)) continue;

  for (const filename of candidateFilenames) {
    const fullPath = path.join(dir, filename);
    if (fs.existsSync(fullPath)) {
      try {
        nativeBinding = require(fullPath);
        break;
      } catch {
        // Continue searching
      }
    }
  }
  if (nativeBinding) break;

  // Wildcard fallback search in directory
  try {
    const files = fs.readdirSync(dir);
    const nodeFile = files.find((f) => f.startsWith('audio-engine') && f.endsWith('.node'));
    if (nodeFile) {
      nativeBinding = require(path.join(dir, nodeFile));
      break;
    }
  } catch {
    // Continue searching
  }
}

if (!nativeBinding) {
  throw new Error(`Failed to load native audio-engine binding for ${platform}-${arch}`);
}

// Add snake_case aliases for compatibility
if (nativeBinding) {
  const aliases = {
    engine_play: nativeBinding.enginePlay,
    engine_pause: nativeBinding.enginePause,
    engine_resume: nativeBinding.engineResume,
    engine_stop: nativeBinding.engineStop,
    engine_seek: nativeBinding.engineSeek,
    engine_set_volume: nativeBinding.engineSetVolume,
    engine_set_volume_with_ramp: nativeBinding.engineSetVolumeWithRamp,
    engine_get_position: nativeBinding.engineGetPosition,
    engine_get_duration: nativeBinding.engineGetDuration,
    engine_list_devices: nativeBinding.engineListDevices,
    engine_set_device: nativeBinding.engineSetDevice,
    engine_set_playback_rate: nativeBinding.engineSetPlaybackRate,
    engine_set_eq_band: nativeBinding.engineSetEqBand,
    engine_reset_eq: nativeBinding.engineResetEq,
    engine_destroy: nativeBinding.engineDestroy
  };

  for (const [alias, fn] of Object.entries(aliases)) {
    if (typeof fn === 'function' && !nativeBinding[alias]) {
      nativeBinding[alias] = fn;
    }
  }
}

module.exports = nativeBinding;
