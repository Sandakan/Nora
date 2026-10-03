import fs from 'fs';
import path from 'path';

import { app } from 'electron';

import { removeDefaultAppProtocolFromFilePath } from '../fs/resolveFilePaths';
import logger from '../logger';

export interface AudioEngineNative {
  ping(): string;
  engine_play(path: string): void;
  engine_pause(): void;
  engine_resume(): void;
  engine_stop(): void;
  engine_seek(positionSecs: number): void;
  engine_set_volume(volume: number): void;
  engine_set_volume_with_ramp(target: number, durationMs: number): void;
  engine_get_position(): number;
  engine_get_duration(): number;
  engine_list_devices(): string[];
  engine_set_device(deviceName: string): void;
  engine_set_playback_rate(rate: number): void;
  engine_set_eq_band(frequencyHz: number, gainDb: number): void;
  engine_reset_eq(): void;
  engine_destroy(): void;
}

let nativeModule: AudioEngineNative | null = null;

function resolveNativeBinaryPath(): string | null {
  const candidateDirs = [
    path.join(process.resourcesPath, 'app.asar.unpacked', 'audio-engine', 'dist'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'audio-engine', 'dist'),
    path.join(app.getAppPath(), 'audio-engine', 'dist'),
    path.join(app.getAppPath(), 'audio-engine'),
    path.join(__dirname, '../../audio-engine/dist'),
    path.join(__dirname, '../audio-engine/dist')
  ];

  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        const nodeFile = files.find((f) => f.startsWith('audio-engine') && f.endsWith('.node'));
        if (nodeFile) {
          return path.join(dir, nodeFile);
        }
      } catch (err) {
        logger.warn(`Error scanning directory for audio-engine binary: ${dir}`, {
          error: String(err)
        });
      }
    }
  }

  return null;
}

export function getAudioEngine(): AudioEngineNative {
  if (nativeModule) {
    return nativeModule;
  }

  // 1. Try standard module resolution
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('audio-engine') as AudioEngineNative;
    if (mod && typeof mod.ping === 'function') {
      logger.info('Loaded native audio-engine via require("audio-engine")');
      nativeModule = mod;
      return nativeModule;
    }
  } catch {
    // Fall back to disk discovery
  }

  // 2. Discover from candidate binary directories
  const binaryPath = resolveNativeBinaryPath();
  if (binaryPath) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      nativeModule = require(binaryPath) as AudioEngineNative;
      logger.info(`Loaded native audio-engine from ${binaryPath}`);
      return nativeModule;
    } catch (err) {
      logger.error(`Failed to load audio-engine from ${binaryPath}`, { error: String(err) });
      throw err;
    }
  }

  throw new Error('Native audio-engine binary (.node) could not be located.');
}

export const audioEngine = {
  ping: (): string => {
    return getAudioEngine().ping();
  },
  play: (filePath: string): void => {
    const rawPath = removeDefaultAppProtocolFromFilePath(filePath);
    const engine = getAudioEngine() as any;
    if (typeof engine.enginePlay === 'function') engine.enginePlay(rawPath);
    else if (typeof engine.engine_play === 'function') engine.engine_play(rawPath);
  },
  pause: (): void => {
    const engine = getAudioEngine() as any;
    if (typeof engine.enginePause === 'function') engine.enginePause();
    else if (typeof engine.engine_pause === 'function') engine.engine_pause();
  },
  resume: (): void => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineResume === 'function') engine.engineResume();
    else if (typeof engine.engine_resume === 'function') engine.engine_resume();
  },
  stop: (): void => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineStop === 'function') engine.engineStop();
    else if (typeof engine.engine_stop === 'function') engine.engine_stop();
  },
  seek: (positionSecs: number): void => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineSeek === 'function') engine.engineSeek(positionSecs);
    else if (typeof engine.engine_seek === 'function') engine.engine_seek(positionSecs);
  },
  setVolume: (volume: number): void => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineSetVolume === 'function') engine.engineSetVolume(volume);
    else if (typeof engine.engine_set_volume === 'function') engine.engine_set_volume(volume);
  },
  setVolumeWithRamp: (target: number, durationMs: number): void => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineSetVolumeWithRamp === 'function')
      engine.engineSetVolumeWithRamp(target, durationMs);
    else if (typeof engine.engine_set_volume_with_ramp === 'function')
      engine.engine_set_volume_with_ramp(target, durationMs);
  },
  getPosition: (): number => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineGetPosition === 'function') return engine.engineGetPosition();
    if (typeof engine.engine_get_position === 'function') return engine.engine_get_position();
    return 0;
  },
  getDuration: (): number => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineGetDuration === 'function') return engine.engineGetDuration();
    if (typeof engine.engine_get_duration === 'function') return engine.engine_get_duration();
    return 0;
  },
  listDevices: (): string[] => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineListDevices === 'function') return engine.engineListDevices();
    if (typeof engine.engine_list_devices === 'function') return engine.engine_list_devices();
    return [];
  },
  setDevice: (deviceName: string): void => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineSetDevice === 'function') engine.engineSetDevice(deviceName);
    else if (typeof engine.engine_set_device === 'function') engine.engine_set_device(deviceName);
  },
  setPlaybackRate: (rate: number): void => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineSetPlaybackRate === 'function') engine.engineSetPlaybackRate(rate);
    else if (typeof engine.engine_set_playback_rate === 'function')
      engine.engine_set_playback_rate(rate);
  },
  setEqBand: (frequencyHz: number, gainDb: number): void => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineSetEqBand === 'function') engine.engineSetEqBand(frequencyHz, gainDb);
    else if (typeof engine.engine_set_eq_band === 'function')
      engine.engine_set_eq_band(frequencyHz, gainDb);
  },
  resetEq: (): void => {
    const engine = getAudioEngine() as any;
    if (typeof engine.engineResetEq === 'function') engine.engineResetEq();
    else if (typeof engine.engine_reset_eq === 'function') engine.engine_reset_eq();
  },
  destroy: (): void => {
    if (nativeModule) {
      try {
        const engine = nativeModule as any;
        if (typeof engine.engineDestroy === 'function') engine.engineDestroy();
        else if (typeof engine.engine_destroy === 'function') engine.engine_destroy();
      } catch (err) {
        logger.error('Error destroying native audio-engine instance', { error: String(err) });
      }
    }
  }
};

export default audioEngine;
