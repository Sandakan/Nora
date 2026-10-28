import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { app } from 'electron';

import { removeDefaultAppProtocolFromFilePath } from '../fs/resolveFilePaths';
import logger from '../logger';

export interface AudioMetadata {
  durationSecs: number;
  sampleRate: number;
  channels: number;
}

export interface JsMediaMetadata {
  title?: string;
  artist?: string;
  album?: string;
  durationSecs?: number;
  coverUrl?: string;
}

export interface LoadOptions {
  autoPlay?: boolean;
  volume?: number;
  playbackRate?: number;
  metadata?: JsMediaMetadata;
}

export interface JsLogRecord {
  level: string;
  message: string;
  target: string;
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
  engineOnEnded?(callback: (err: Error | null) => void): void;
  engineOnError?(callback: (err: Error | null, message: string) => void): void;
  engineInitLogger?(callback: (err: Error | null, record: JsLogRecord) => void): void;
  engineInitMediaControls?(
    hwndBuf: Buffer | null,
    callback: (err: Error | null, event: string) => void
  ): void;
  engineUpdateMetadata?(metadata: JsMediaMetadata): void;
  engineSetPlaybackStatus?(status: string, progressSecs?: number): void;
  engineListDevices(): string[];
  engineSetDevice(deviceName: string): void;
  engineSetPlaybackRate(rate: number): void;
  engineSetEqBand(frequencyHz: number, gainDb: number): void;
  engineSetEqGains(gains: number[]): void;
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

function normalizeCoverUrl(coverUrl?: string): string | undefined {
  if (!coverUrl) return undefined;
  const cleaned = removeDefaultAppProtocolFromFilePath(coverUrl).trim();
  if (!cleaned) return undefined;

  let filePath = cleaned;
  if (filePath.startsWith('file://')) {
    try {
      filePath = fileURLToPath(filePath);
    } catch {
      filePath = filePath.replace(/^file:\/\/\/?/i, '');
    }
  }

  // Remove any remaining URL query parameters
  filePath = filePath.replace(/\?.*$/, '');

  // Verify the file actually exists
  if (!fs.existsSync(filePath)) {
    logger.warn(`Cover artwork file does not exist at path: "${filePath}". Skipping.`);
    return undefined;
  }

  // On Windows, souvlaki's GetFileFromPathAsync requires `file://C:\path\to\image.jpg`
  // so that url.trim_start_matches("file://") results in `C:\path\to\image.jpg`
  if (process.platform === 'win32') {
    const winPath = path.resolve(filePath);
    return `file://${winPath}`;
  }

  try {
    return pathToFileURL(path.resolve(filePath)).href;
  } catch {
    return `file://${filePath}`;
  }
}

export const audioEngine = {
  ping: (): string => {
    return getAudioEngine().ping();
  },
  load: (filePath: string, options?: LoadOptions): AudioMetadata => {
    const rawPath = removeDefaultAppProtocolFromFilePath(filePath);
    const normalizedOptions: LoadOptions | undefined = options
      ? {
          ...options,
          metadata: options.metadata
            ? {
                ...options.metadata,
                coverUrl: normalizeCoverUrl(options.metadata.coverUrl)
              }
            : undefined
        }
      : undefined;
    return getAudioEngine().engineLoad(rawPath, normalizedOptions);
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
  onEnded: (callback: () => void): void => {
    try {
      const eng = getAudioEngine();
      if (typeof eng.engineOnEnded === 'function') {
        eng.engineOnEnded((err) => {
          if (!err) {
            callback();
          }
        });
      }
    } catch (err) {
      logger.error('Failed to register engineOnEnded callback', { error: String(err) });
    }
  },
  onError: (callback: (message: string) => void): void => {
    try {
      const eng = getAudioEngine();
      if (typeof eng.engineOnError === 'function') {
        eng.engineOnError((err, message) => {
          if (!err && message) {
            callback(message);
          }
        });
      }
    } catch (err) {
      logger.error('Failed to register engineOnError callback', { error: String(err) });
    }
  },
  initLogger: (callback: (record: JsLogRecord) => void): void => {
    try {
      const eng = getAudioEngine();
      if (typeof eng.engineInitLogger === 'function') {
        eng.engineInitLogger((err, record) => {
          if (!err && record) {
            callback(record);
          }
        });
      }
    } catch (err) {
      logger.error('Failed to initialize engineInitLogger callback', { error: String(err) });
    }
  },
  initMediaControls: (hwnd?: Buffer, onEvent?: (event: string) => void): void => {
    try {
      const eng = getAudioEngine();
      if (typeof eng.engineInitMediaControls === 'function') {
        eng.engineInitMediaControls(hwnd ?? null, (err, event) => {
          if (!err && event && onEvent) {
            onEvent(event);
          }
        });
        logger.info('Native media controls initialized via audioEngine');
      }
    } catch (err) {
      logger.error('Failed to initialize native media controls', { error: String(err) });
    }
  },
  updateMetadata: (metadata: JsMediaMetadata): void => {
    try {
      const eng = getAudioEngine();
      if (typeof eng.engineUpdateMetadata === 'function') {
        eng.engineUpdateMetadata({
          ...metadata,
          coverUrl: normalizeCoverUrl(metadata.coverUrl)
        });
      }
    } catch (err) {
      logger.error('Failed to update media controls metadata', { error: String(err) });
    }
  },
  setPlaybackStatus: (status: string, progressSecs?: number): void => {
    try {
      const eng = getAudioEngine();
      if (typeof eng.engineSetPlaybackStatus === 'function') {
        eng.engineSetPlaybackStatus(status, progressSecs);
      }
    } catch (err) {
      logger.warn('Failed to set native playback status', { error: String(err) });
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
  setEqGains: (gains: number[]): void => {
    getAudioEngine().engineSetEqGains(gains);
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
