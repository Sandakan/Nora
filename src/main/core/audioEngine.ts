import fs from 'fs';
import path from 'path';

import { app } from 'electron';

import { removeDefaultAppProtocolFromFilePath } from '../fs/resolveFilePaths';
import logger from '../logger';

export interface AudioMetadata {
  durationSecs: number;
  sampleRate: number;
  channels: number;
}

export interface LoadOptions {
  autoPlay?: boolean;
  volume?: number;
  playbackRate?: number;
}

export interface AudioEngineNative {
  ping(): string;
  engineLoad(path: string, options?: LoadOptions): AudioMetadata;
  enginePlay(path: string): void;
  enginePause(): void;
  engineResume(): void;
  engineStop(): void;
  engineSeek(positionSecs: number): void;
  engineSetVolume(volume: number): void;
  engineSetVolumeWithRamp(target: number, durationMs: number): void;
  engineGetPosition(): number;
  engineGetDuration(): number;
  engineIsPlaying?(): boolean;
  engineIsEnded?(): boolean;
  engineListDevices(): string[];
  engineSetDevice(deviceName: string): void;
  engineSetPlaybackRate(rate: number): void;
  engineSetEqBand(frequencyHz: number, gainDb: number): void;
  engineResetEq(): void;
  engineDestroy(): void;
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
  load: (filePath: string, options?: LoadOptions): AudioMetadata => {
    const rawPath = removeDefaultAppProtocolFromFilePath(filePath);
    return getAudioEngine().engineLoad(rawPath, options);
  },
  play: (filePath: string): void => {
    const rawPath = removeDefaultAppProtocolFromFilePath(filePath);
    getAudioEngine().enginePlay(rawPath);
  },
  pause: (): void => {
    getAudioEngine().enginePause();
  },
  resume: (): void => {
    getAudioEngine().engineResume();
  },
  stop: (): void => {
    getAudioEngine().engineStop();
  },
  seek: (positionSecs: number): void => {
    getAudioEngine().engineSeek(positionSecs);
  },
  setVolume: (volume: number): void => {
    getAudioEngine().engineSetVolume(volume);
  },
  setVolumeWithRamp: (target: number, durationMs: number): void => {
    getAudioEngine().engineSetVolumeWithRamp(target, durationMs);
  },
  getPosition: (): number => {
    try {
      return getAudioEngine().engineGetPosition();
    } catch {
      return 0;
    }
  },
  getDuration: (): number => {
    try {
      return getAudioEngine().engineGetDuration();
    } catch {
      return 0;
    }
  },
  isPlaying: (): boolean => {
    try {
      const eng = getAudioEngine();
      if (typeof eng.engineIsPlaying === 'function') {
        return eng.engineIsPlaying();
      }
      return false;
    } catch {
      return false;
    }
  },
  isEnded: (): boolean => {
    try {
      const eng = getAudioEngine();
      if (typeof eng.engineIsEnded === 'function') {
        return eng.engineIsEnded();
      }
      return false;
    } catch {
      return false;
    }
  },
  listDevices: (): string[] => {
    try {
      return getAudioEngine().engineListDevices();
    } catch {
      return [];
    }
  },
  setDevice: (deviceName: string): void => {
    getAudioEngine().engineSetDevice(deviceName);
  },
  setPlaybackRate: (rate: number): void => {
    getAudioEngine().engineSetPlaybackRate(rate);
  },
  setEqBand: (frequencyHz: number, gainDb: number): void => {
    getAudioEngine().engineSetEqBand(frequencyHz, gainDb);
  },
  resetEq: (): void => {
    getAudioEngine().engineResetEq();
  },
  destroy: (): void => {
    if (nativeModule) {
      try {
        nativeModule.engineDestroy();
      } catch (err) {
        logger.error('Error destroying native audio-engine instance', { error: String(err) });
      }
    }
  }
};

export default audioEngine;
