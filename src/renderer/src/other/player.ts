import type { Subscription } from '@tanstack/react-store';

import { dispatch, store } from '../store/store';
import storage from '../utils/localStorage';
import PlayerQueue from './playerQueue';

const AUDIO_FADE_DURATION = 250;
type PlayerEventType =
  | 'timeUpdate'
  | 'durationChange'
  | 'play'
  | 'pause'
  | 'error'
  | 'seeking'
  | 'seeked'
  | 'repeatOne'
  | 'repeatAll'
  | 'playbackComplete'
  | 'songLoaded'
  | 'loadError'
  | 'recordListening'
  | 'repeatSong'
  | 'repeatModeChange'
  | 'queueChange'
  | 'queueMetadataChange';

type PlayerEventCallback<T = unknown> = (data: T) => void;

/**
 * AudioPlayer class that manages pure Rust audio playback with integrated queue management.
 * Provides event-based architecture for player state changes. Owns a PlayerQueue instance and
 * automatically reacts to queue position changes.
 */
class AudioPlayer extends EventTarget {
  private listeners: Map<PlayerEventType, Set<PlayerEventCallback<unknown>>>;

  queue: PlayerQueue;
  currentVolume: number;
  private isMuted: boolean = false;
  private currentPlaybackRate: number = 1.0;

  unsubscribeFunc: Subscription;

  private repeatMode: 'off' | 'one' | 'all' = 'off';
  private pendingAutoPlay: boolean = false;
  private currentLoadedSongId: number | null = null;
  private nativeCurrentTime = 0;
  private nativeDuration = 0;
  private nativeIsPaused = true;
  private currentSongData: AudioPlayerData | null = null;
  private currentEqualizerSettings: Equalizer | null = null;
  private isTransitioningTracks: boolean = false;
  private isPlaybackTransitioning: boolean = false;
  private consecutiveLoadFailures: number = 0;
  private currentLoadSequenceId = 0;
  private activeFadeTimeout: ReturnType<typeof setTimeout> | null = null;
  private preloadedSongData: AudioPlayerData | null = null;
  private lastSetVolume: number | null = null;
  private lastSetPlaybackRate: number | null = null;
  private currentError: {
    code: number;
    message: string;
    readonly MEDIA_ERR_ABORTED: 1;
    readonly MEDIA_ERR_NETWORK: 2;
    readonly MEDIA_ERR_DECODE: 3;
    readonly MEDIA_ERR_SRC_NOT_SUPPORTED: 4;
  } | null = null;

  private trackEndedUnsubscribe: (() => void) | null = null;
  private playbackErrorUnsubscribe: (() => void) | null = null;
  private positionTickUnsubscribe: (() => void) | null = null;
  private trackTransitionedUnsubscribe: (() => void) | null = null;

  constructor(queue: PlayerQueue) {
    super();
    this.listeners = new Map();
    this.queue = queue;

    const initialVolume = store?.state?.player?.volume;
    if (initialVolume) {
      this.currentVolume = initialVolume.value;
      this.isMuted = initialVolume.isMuted;
    } else {
      this.currentVolume = 100;
      this.isMuted = false;
    }

    const initialRate = store?.state?.player?.playbackRate;
    if (typeof initialRate === 'number') {
      this.currentPlaybackRate = initialRate;
    }

    const initialRepeat = store?.state?.player?.isRepeating;
    if (initialRepeat) {
      this.syncRepeatModeFromStore(initialRepeat);
    }

    this.unsubscribeFunc = this.subscribeToStoreEvents();
    this.setupQueueIntegration();
    this.setupNativeListeners();
    this.applyEqualizerSettings();
  }

  /**
   * Sets up native engine callbacks: track end, playback error, 100ms position tick, and track transitioned.
   */
  private setupNativeListeners() {
    if (window.api?.audioEngine?.onTrackEnded) {
      this.trackEndedUnsubscribe = window.api.audioEngine.onTrackEnded(() => {
        this.handleSongEnd();
      });
    }

    if (window.api?.audioEngine?.onPlaybackError) {
      this.playbackErrorUnsubscribe = window.api.audioEngine.onPlaybackError((err) => {
        console.error('[AudioPlayer] Native audio engine error received:', err);
        this.currentError = {
          code: 3,
          message: err.message,
          MEDIA_ERR_ABORTED: 1,
          MEDIA_ERR_NETWORK: 2,
          MEDIA_ERR_DECODE: 3,
          MEDIA_ERR_SRC_NOT_SUPPORTED: 4
        };
        this.pause();
        this.emit('error', new Error(`[NativeAudioEngine] ${err.message}`));
      });
    }

    if (window.api?.audioEngine?.onPositionTick) {
      this.positionTickUnsubscribe = window.api.audioEngine.onPositionTick((tick) => {
        this.nativeCurrentTime = tick.position;
        this.emit('timeUpdate', tick.position);

        const playerPositionChange = new CustomEvent('player/positionChange', {
          detail: Number(tick.position.toFixed(2))
        });
        document.dispatchEvent(playerPositionChange);
      });
    }

    if (window.api?.audioEngine?.onTrackTransitioned) {
      this.trackTransitionedUnsubscribe = window.api.audioEngine.onTrackTransitioned(
        (newPath) => {
          this.handleTrackTransitioned(newPath);
        }
      );
    }
  }

  /**
   * Sets up integration between queue and player. Automatically loads songs when queue position
   * changes. Propagates queue events through player for convenience.
   */
  private setupQueueIntegration() {
    this.queue.on('positionChange', () => {
      const songId = this.queue.currentSongId;
      const willAutoPlay = this.pendingAutoPlay;
      console.log('[AudioPlayer.positionChange]', {
        position: this.queue.position,
        songId,
        currentLoadedSongId: this.currentLoadedSongId,
        willLoad: !!songId,
        pendingAutoPlay: willAutoPlay
      });

      if (songId) {
        if (songId === this.currentLoadedSongId) {
          this.pendingAutoPlay = false;
          this.isTransitioningTracks = false;
          return;
        }

        this.loadSong(songId, { autoPlay: willAutoPlay }).catch((err) => {
          console.error('[AudioPlayer.positionChange] Failed to load song:', err);
          if (this.consecutiveLoadFailures < 3 && this.queue.hasNext) {
            this.pendingAutoPlay = willAutoPlay;
            setTimeout(() => this.queue.moveToNext(), 0);
          } else {
            console.warn(
              '[AudioPlayer] Consecutive load failures exceeded circuit breaker limit (3). Halting playback.'
            );
            this.consecutiveLoadFailures = 0;
            this.isTransitioningTracks = false;
            this.pendingAutoPlay = false;
            this.pause();
            this.emit('loadError', { songId, error: err });
          }
        });
        this.pendingAutoPlay = false;
      } else {
        this.isTransitioningTracks = false;
      }
    });

    this.queue.on('queueChange', (data) => {
      this.emit('queueChange', data);
      this.preloadNextTrack();
    });

    this.queue.on('metadataChange', (data) => {
      this.emit('queueMetadataChange', data);
    });
  }

  /**
   * Preloads the next upcoming track into the native Rust audio engine for zero-gap transitions.
   */
  private async preloadNextTrack(): Promise<void> {
    if (!window.api?.audioEngine?.preload) return;

    try {
      if (this.repeatMode === 'one') {
        if (this.currentSongData) {
          const rawPath = window.api.utils?.removeDefaultAppProtocolFromFilePath
            ? window.api.utils.removeDefaultAppProtocolFromFilePath(this.currentSongData.path)
            : this.currentSongData.path
                .replace(/^nora:[/\\]{1,2}localfiles[/\\]{1,2}/i, '')
                .replace(/\?.*$/, '');
          this.preloadedSongData = this.currentSongData;
          await window.api.audioEngine.preload(rawPath, this.currentSongData.duration);
        }
        return;
      }

      let nextSongId: number | null = null;
      if (this.queue.hasNext) {
        nextSongId = this.queue.nextSongId;
      } else if (this.repeatMode === 'all' && this.queue.length > 0) {
        nextSongId = this.queue.songIds[0];
      }

      if (nextSongId !== null && typeof nextSongId === 'number') {
        const nextSong = await window.api.audioLibraryControls.getSong(nextSongId);
        if (nextSong) {
          this.preloadedSongData = nextSong;
          const rawPath = window.api.utils?.removeDefaultAppProtocolFromFilePath
            ? window.api.utils.removeDefaultAppProtocolFromFilePath(nextSong.path)
            : nextSong.path
                .replace(/^nora:[/\\]{1,2}localfiles[/\\]{1,2}/i, '')
                .replace(/\?.*$/, '');
          await window.api.audioEngine.preload(rawPath, nextSong.duration);
        }
      } else {
        this.preloadedSongData = null;
      }
    } catch (err) {
      console.warn('[AudioPlayer.preloadNextTrack] Failed to preload next track:', err);
    }
  }

  /**
   * Handles gapless transition notification emitted by the native Rust engine.
   */
  private async handleTrackTransitioned(newPath: string) {
    console.log('[AudioPlayer.handleTrackTransitioned]', { newPath });

    if (this.repeatMode === 'one' && this.currentSongData) {
      this.emit('repeatOne');
      this.emit('songLoaded', this.currentSongData);
      this.emit('repeatSong', {
        songId: this.currentSongData.songId,
        duration: this.currentSongData.duration
      });
      this.nativeCurrentTime = 0;
      this.emit('timeUpdate', 0);
      document.dispatchEvent(
        new CustomEvent('player/positionChange', { detail: 0 })
      );
      this.preloadNextTrack();
      return;
    }

    let transitionedSong = this.preloadedSongData;
    if (!transitionedSong || (newPath && !transitionedSong.path.includes(newPath))) {
      const nextId = this.queue.nextSongId;
      if (nextId) {
        try {
          transitionedSong = await window.api.audioLibraryControls.getSong(nextId);
        } catch (e) {
          console.error('[AudioPlayer.handleTrackTransitioned] Failed to resolve next song:', e);
        }
      }
    }

    if (transitionedSong) {
      this.preloadedSongData = null;
      this.currentSongData = transitionedSong;
      this.currentLoadedSongId = transitionedSong.songId;
      this.nativeDuration = transitionedSong.duration;
      this.nativeCurrentTime = 0;

      dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: transitionedSong });
      storage.playback.setCurrentSongOptions('songId', transitionedSong.songId);

      if (this.queue.hasNext) {
        this.queue.moveToNext();
      } else if (this.repeatMode === 'all') {
        this.queue.moveToPosition(0);
      }

      this.emit('songLoaded', transitionedSong);
      this.emit('durationChange', this.nativeDuration);
      this.emit('timeUpdate', 0);
      document.dispatchEvent(
        new CustomEvent('player/positionChange', { detail: 0 })
      );
      this.dispatchEvent(
        new CustomEvent('player/trackchange', { detail: transitionedSong.songId })
      );

      this.preloadNextTrack();
    }
  }

  /**
   * Handles song end when no gapless transition occurred. Advances queue or repeats as configured.
   */
  private async handleSongEnd() {
    if (this.isTransitioningTracks) {
      return;
    }
    this.isTransitioningTracks = true;
    console.log('[AudioPlayer.handleSongEnd]', { repeatMode: this.repeatMode });

    this.nativeIsPaused = true;

    if (this.repeatMode === 'one') {
      this.currentTime = 0;
      this.isTransitioningTracks = false;
      await this.play();
      this.emit('repeatOne');
      return;
    }

    if (this.queue.hasNext) {
      this.pendingAutoPlay = true;
      this.queue.moveToNext();
    } else if (this.repeatMode === 'all' && this.queue.length > 0) {
      this.pendingAutoPlay = true;
      this.queue.moveToPosition(0);
      this.emit('repeatAll');
    } else {
      this.isTransitioningTracks = false;
      this.nativeIsPaused = true;
      this.emit('pause');
      this.emit('playbackComplete');
      window.api?.audioEngine?.setPlaybackStatus?.('paused', this.currentTime).catch(() => {});
      dispatch({ type: 'CURRENT_SONG_PLAYBACK_STATE', data: false });
    }
  }

  /**
   * Loads a song into the native Rust audio engine.
   *
   * @param songIdOrData - The ID of the song to load or the song data object
   * @param options - Optional configuration for song loading
   * @returns Promise resolving to the song data
   */
  async loadSong(
    songIdOrData: number | AudioPlayerData,
    options?: { autoPlay?: boolean; updateStore?: boolean }
  ): Promise<AudioPlayerData> {
    const sequenceId = ++this.currentLoadSequenceId;

    if (this.activeFadeTimeout) {
      clearTimeout(this.activeFadeTimeout);
      this.activeFadeTimeout = null;
    }

    let songData: AudioPlayerData;

    try {
      if (typeof songIdOrData === 'number') {
        songData = await window.api.audioLibraryControls.getSong(songIdOrData);
      } else {
        songData = songIdOrData;
      }

      if (!songData) {
        throw new Error(`Song data not found for ${JSON.stringify(songIdOrData)}`);
      }

      console.log('[AudioPlayer.loadSong]', {
        songId: songData.songId,
        options
      });

      if (options?.updateStore !== false) {
        dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });
        storage.playback.setCurrentSongOptions('songId', songData.songId);
      }

      this.currentSongData = songData;

      if (!window.api?.audioEngine) {
        throw new Error('Native audio engine is not available');
      }

      const rawPath = window.api.utils?.removeDefaultAppProtocolFromFilePath
        ? window.api.utils.removeDefaultAppProtocolFromFilePath(songData.path)
        : songData.path
            .replace(/^nora:[/\\]{1,2}localfiles[/\\]{1,2}/i, '')
            .replace(/\?.*$/, '');

      const storeVolume = store?.state?.player?.volume;
      if (storeVolume) {
        this.currentVolume = storeVolume.value;
        this.isMuted = storeVolume.isMuted;
      }

      const effectiveVolume = this.muted ? 0 : this.volume;
      const rawArtworkPath = songData.artworkPath
        ? window.api.utils?.removeDefaultAppProtocolFromFilePath
          ? window.api.utils.removeDefaultAppProtocolFromFilePath(songData.artworkPath)
          : songData.artworkPath
              .replace(/^nora:[/\\]{1,2}localfiles[/\\]{1,2}/i, '')
              .replace(/\?.*$/, '')
        : undefined;

      const coverUrl = rawArtworkPath
        ? window.api.utils?.pathToFileURL
          ? window.api.utils.pathToFileURL(rawArtworkPath)
          : `file:///${rawArtworkPath.replace(/\\/g, '/')}`
        : undefined;

      const autoPlay = options?.autoPlay ?? true;

      const meta = await window.api.audioEngine.load(rawPath, {
        autoPlay,
        volume: effectiveVolume,
        playbackRate: this.playbackRate,
        fallbackDuration: songData.duration,
        metadata: {
          title: songData.title,
          artist: songData.artists?.map((a) => a.name).join(', ') || 'Unknown Artist',
          album: songData.album?.name || 'Unknown Album',
          durationSecs: songData.duration,
          coverUrl
        }
      });

      if (sequenceId !== this.currentLoadSequenceId) {
        console.warn(
          `[AudioPlayer] Aborting loadSong for sequence ${sequenceId} - superseded by ${this.currentLoadSequenceId}`
        );
        return songData;
      }

      this.currentLoadedSongId = songData.songId;
      this.consecutiveLoadFailures = 0;
      this.isTransitioningTracks = false;
      this.currentError = null;

      this.nativeDuration =
        meta?.durationSecs && meta.durationSecs > 0 ? meta.durationSecs : songData.duration;
      this.nativeCurrentTime = 0;
      this.emit('durationChange', this.nativeDuration);

      this.applyEqualizerSettings();

      // Scrobbling order: emit songLoaded BEFORE emitting play so listeners are ready
      this.emit('songLoaded', songData);

      const trackChangeEvent = new CustomEvent('player/trackchange', {
        detail: songData.songId
      });
      this.dispatchEvent(trackChangeEvent);

      if (autoPlay) {
        this.nativeIsPaused = false;
        this.emit('play');
        window.api?.audioEngine?.setPlaybackStatus?.('playing', 0).catch(() => {});
      } else {
        this.nativeIsPaused = true;
        this.emit('pause');
        window.api?.audioEngine?.setPlaybackStatus?.('paused', 0).catch(() => {});
      }

      this.preloadNextTrack();

      return songData;
    } catch (error) {
      if (sequenceId === this.currentLoadSequenceId) {
        this.isTransitioningTracks = false;
        const failedSongId = typeof songIdOrData === 'number' ? songIdOrData : songIdOrData.songId;
        console.error(
          `Failed to load song (ID: ${failedSongId}):`,
          error instanceof Error ? error.message : error
        );
        this.currentError = {
          code: 4,
          message: error instanceof Error ? error.message : String(error),
          MEDIA_ERR_ABORTED: 1,
          MEDIA_ERR_NETWORK: 2,
          MEDIA_ERR_DECODE: 3,
          MEDIA_ERR_SRC_NOT_SUPPORTED: 4
        };
        this.consecutiveLoadFailures += 1;
        this.emit('loadError', { songId: failedSongId ?? 0, error });
      }
      throw error;
    }
  }

  /** Cleans up resources and event listeners. Should be called when player is no longer needed. */
  destroy() {
    if (this.activeFadeTimeout) {
      clearTimeout(this.activeFadeTimeout);
      this.activeFadeTimeout = null;
    }
    if (this.trackEndedUnsubscribe) {
      this.trackEndedUnsubscribe();
      this.trackEndedUnsubscribe = null;
    }
    if (this.playbackErrorUnsubscribe) {
      this.playbackErrorUnsubscribe();
      this.playbackErrorUnsubscribe = null;
    }
    if (this.positionTickUnsubscribe) {
      this.positionTickUnsubscribe();
      this.positionTickUnsubscribe = null;
    }
    if (this.trackTransitionedUnsubscribe) {
      this.trackTransitionedUnsubscribe();
      this.trackTransitionedUnsubscribe = null;
    }
    if (window.api?.audioEngine) {
      window.api.audioEngine.stop().catch(() => {});
    }
    if (this.unsubscribeFunc) this.unsubscribeFunc.unsubscribe();
    this.queue.removeAllListeners();
    this.removeAllListeners();
    this.currentLoadedSongId = null;
  }

  /**
   * Subscribe to an event.
   *
   * @param eventType - The type of event to listen for
   * @param callback - Function to call when event is emitted
   */
  on<T = unknown>(eventType: PlayerEventType, callback: PlayerEventCallback<T>): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback as PlayerEventCallback<unknown>);
  }

  /**
   * Remove an event listener.
   *
   * @param eventType - The type of event
   * @param callback - The callback to remove
   */
  off<T = unknown>(eventType: PlayerEventType, callback: PlayerEventCallback<T>): void {
    this.listeners.get(eventType)?.delete(callback as PlayerEventCallback<unknown>);
  }

  /**
   * Emit an event to all listeners.
   *
   * @param eventType - The type of event to emit
   * @param data - The data to pass to listeners
   */
  protected emit<T = unknown>(eventType: PlayerEventType, data?: T): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(data);
      });
    }

    this.dispatchEvent(new CustomEvent(eventType, { detail: data }));
    if (eventType === 'timeUpdate') {
      this.dispatchEvent(new CustomEvent('timeupdate', { detail: data }));
    } else if (eventType === 'durationChange') {
      this.dispatchEvent(new CustomEvent('loadedmetadata', { detail: data }));
    } else if (eventType === 'playbackComplete') {
      this.dispatchEvent(new CustomEvent('ended', { detail: data }));
    } else if (eventType === 'songLoaded') {
      this.dispatchEvent(new CustomEvent('canplay', { detail: data }));
    }
  }

  /** Remove all listeners for all events. */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  private fadeOutAudioNative(): Promise<void> {
    if (this.activeFadeTimeout) {
      clearTimeout(this.activeFadeTimeout);
      this.activeFadeTimeout = null;
    }

    return new Promise((resolve) => {
      if (!window.api?.audioEngine) {
        resolve();
        return;
      }
      window.api.audioEngine.setVolumeWithRamp(0, AUDIO_FADE_DURATION).catch((err) => {
        console.error('[AudioPlayer] Error ramping down native volume:', err);
      });
      this.activeFadeTimeout = setTimeout(async () => {
        this.activeFadeTimeout = null;
        try {
          await window.api.audioEngine.pause();
        } catch (err) {
          console.error('[AudioPlayer] Error pausing native engine after fade:', err);
        }
        resolve();
      }, AUDIO_FADE_DURATION);
    });
  }

  private fadeInAudioNative(): Promise<void> {
    if (this.activeFadeTimeout) {
      clearTimeout(this.activeFadeTimeout);
      this.activeFadeTimeout = null;
    }

    return new Promise((resolve) => {
      if (!window.api?.audioEngine) {
        resolve();
        return;
      }
      const targetVolume = this.muted ? 0 : this.volume;
      this.lastSetVolume = targetVolume;
      window.api.audioEngine
        .setVolume(0)
        .then(() => window.api.audioEngine.resume())
        .then(() => window.api.audioEngine.setVolumeWithRamp(targetVolume, AUDIO_FADE_DURATION))
        .catch((err) => {
          console.error('[AudioPlayer] Error ramping up native volume:', err);
        });
      this.activeFadeTimeout = setTimeout(() => {
        this.activeFadeTimeout = null;
        resolve();
      }, AUDIO_FADE_DURATION);
    });
  }

  /**
   * Applies equalizer band settings to the native Rust audio engine.
   *
   * @param equalizer - Optional equalizer configuration. If omitted, reads from localStorage.
   */
  applyEqualizerSettings(equalizer?: Equalizer): void {
    const eq =
      equalizer || this.currentEqualizerSettings || storage.equalizerPreset.getEqualizerPreset();
    if (!eq) return;
    this.currentEqualizerSettings = eq;

    if (window.api?.audioEngine) {
      const gains = [
        eq.thirtyTwoHertzFilter ?? 0,
        eq.sixtyFourHertzFilter ?? 0,
        eq.hundredTwentyFiveHertzFilter ?? 0,
        eq.twoHundredFiftyHertzFilter ?? 0,
        eq.fiveHundredHertzFilter ?? 0,
        eq.thousandHertzFilter ?? 0,
        eq.twoThousandHertzFilter ?? 0,
        eq.fourThousandHertzFilter ?? 0,
        eq.eightThousandHertzFilter ?? 0,
        eq.sixteenThousandHertzFilter ?? 0
      ];
      window.api.audioEngine.setEqGains(gains).catch((err) => {
        console.error('[AudioPlayer] Error setting native EQ gains:', err);
      });
    }
  }

  /** Gets the current MediaError, if any. */
  get error(): MediaError | null {
    return this.currentError as MediaError | null;
  }

  /** Gets the current media source path. */
  get src(): string {
    return this.currentSongData?.path || '';
  }

  /** Sets the current media source path. */
  set src(_value: string) {
    // Retained for compatibility with callers setting player.src
  }

  /** Reloads the media element (compatibility). */
  load(): void {
    if (this.currentSongData) {
      this.loadSong(this.currentSongData, { autoPlay: !this.nativeIsPaused }).catch((err) => {
        console.error('[AudioPlayer.load] Error reloading song:', err);
      });
    }
  }

  private updatePlayerVolume(volume: PlayerVolume) {
    this.muted = volume.isMuted;
    this.volume = volume.value / 100;
  }

  private updatePlaybackRate(playbackRate: number) {
    if (this.playbackRate !== playbackRate) {
      this.playbackRate = playbackRate;
    }
  }

  private subscribeToStoreEvents() {
    const unsubscribeFunction = store.subscribe(() => {
      if (store) {
        const { player } = store.state;

        this.updatePlayerVolume(player.volume);
        this.updatePlaybackRate(player.playbackRate);
        this.syncRepeatModeFromStore(player.isRepeating);
      }
    });

    return unsubscribeFunction;
  }

  private syncRepeatModeFromStore(isRepeating: RepeatTypes) {
    const newMode = isRepeating === 'repeat-1' ? 'one' : isRepeating === 'repeat' ? 'all' : 'off';
    if (this.repeatMode !== newMode) {
      this.repeatMode = newMode;
      this.preloadNextTrack();
    }
  }

  // ========== PUBLIC PLAYBACK CONTROLS ==========

  /** Starts or resumes audio playback with fade-in effect. */
  play() {
    if (!this.nativeIsPaused) {
      return Promise.resolve();
    }
    this.nativeIsPaused = false;
    this.isPlaybackTransitioning = true;
    this.emit('play');
    window.api?.audioEngine?.setPlaybackStatus?.('playing', this.currentTime).catch(() => {});
    return this.fadeInAudioNative().finally(() => {
      this.isPlaybackTransitioning = false;
    });
  }

  /** Pauses audio playback with fade-out effect. */
  pause() {
    if (this.nativeIsPaused) {
      return Promise.resolve();
    }
    this.nativeIsPaused = true;
    this.isPlaybackTransitioning = true;
    this.emit('pause');
    window.api?.audioEngine?.setPlaybackStatus?.('paused', this.currentTime).catch(() => {});
    return this.fadeOutAudioNative().finally(() => {
      this.isPlaybackTransitioning = false;
    });
  }

  /**
   * Toggles playback between play and pause.
   *
   * @param forcePlay - If true, always play; if false, always pause; if undefined, toggle
   * @returns Promise that resolves when fade completes
   */
  async togglePlayback(forcePlay?: boolean): Promise<void> {
    if (this.isPlaybackTransitioning) {
      if (typeof forcePlay === 'boolean' && forcePlay !== this.nativeIsPaused) {
        return;
      }
    }

    const shouldPlay = typeof forcePlay === 'boolean' ? forcePlay : this.paused;

    if (shouldPlay) {
      await this.play();
    } else {
      await this.pause();
    }
  }

  /**
   * Seeks to a specific time position in the current song.
   *
   * @param time - Time in seconds to seek to
   */
  seek(time: number) {
    this.currentTime = time;
  }

  /**
   * Loads and optionally plays a song by ID. This is the public API for loading songs - handles
   * store updates, localStorage, and analytics.
   *
   * @param songId - The ID of the song to load
   * @param options - Configuration options
   * @returns Promise that resolves when song is loaded and optionally playing
   */
  async playSongById(
    songId: number,
    options: {
      autoPlay?: boolean;
      recordListening?: boolean;
      onError?: (error: unknown) => void;
    } = {}
  ): Promise<AudioPlayerData | void> {
    const { autoPlay = true, recordListening = true, onError } = options;

    try {
      console.log('[AudioPlayer.playSongById]', { songId, autoPlay });

      const songData = await window.api.audioLibraryControls.getSong(songId);
      if (!songData) {
        throw new Error(`Song not found for ID: ${songId}`);
      }

      await this.loadSong(songData, { autoPlay, updateStore: true });

      if (recordListening) {
        this.emit('recordListening', { songId, duration: songData.duration });
      }

      return songData;
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        throw error;
      }
    }
  }

  // ========== QUEUE NAVIGATION ==========

  /**
   * Skips forward to the next song in the queue. Handles repeat modes and automatically loads/plays
   * the next song.
   *
   * @param reason - Why the skip occurred ('USER_SKIP' or 'PLAYER_SKIP')
   */
  async skipForward(reason: SongSkipReason = 'USER_SKIP'): Promise<void> {
    console.log('[AudioPlayer.skipForward]', {
      reason,
      position: this.queue.position,
      hasNext: this.queue.hasNext,
      repeatMode: this.repeatMode
    });

    if (this.repeatMode === 'one' && reason !== 'USER_SKIP') {
      this.currentTime = 0;
      await this.play();

      if (store.state.currentSongData?.songId) {
        this.emit('repeatSong', {
          songId: store.state.currentSongData.songId,
          duration: store.state.currentSongData.duration
        });
      }
      return;
    }

    if (this.queue.hasNext) {
      this.pendingAutoPlay = true;
      this.queue.moveToNext();
      console.log('[AudioPlayer.skipForward.moved]', {
        position: this.queue.position
      });
    } else if (this.repeatMode === 'all' && this.queue.length > 0) {
      this.pendingAutoPlay = true;
      this.queue.moveToStart();
    } else if (this.queue.isEmpty) {
      console.log('[AudioPlayer.skipForward] Queue is empty.');
    }
  }

  /**
   * Skips backward to the previous song or restarts current song. If current time > 5 seconds,
   * restarts current song. Otherwise, moves to previous song in queue.
   */
  skipBackward(): void {
    console.log('[AudioPlayer.skipBackward]', {
      currentTime: this.currentTime,
      position: this.queue.position,
      hasPrevious: this.queue.hasPrevious
    });

    if (this.currentTime > 5) {
      this.currentTime = 0;
      return;
    }

    if (this.queue.currentSongId !== null) {
      if (this.queue.hasPrevious) {
        this.pendingAutoPlay = true;
        this.queue.moveToPrevious();
      } else {
        this.pendingAutoPlay = true;
        this.queue.moveToStart();
      }
    } else if (this.queue.length > 0) {
      this.pendingAutoPlay = true;
      this.queue.moveToStart();
    }
  }

  /**
   * Plays the next song in the queue. Delegates to queue's moveToNext() which triggers song
   * loading.
   *
   * @deprecated Use skipForward() instead for better control
   */
  playNext() {
    if (this.queue.hasNext) {
      this.pendingAutoPlay = true;
      this.queue.moveToNext();
    }
  }

  /**
   * Plays the previous song in the queue. Delegates to queue's moveToPrevious() which triggers song
   * loading.
   *
   * @deprecated Use skipBackward() instead for better control
   */
  playPrevious() {
    if (this.queue.hasPrevious) {
      this.pendingAutoPlay = true;
      this.queue.moveToPrevious();
    }
  }

  /**
   * Plays a song at a specific position in the queue.
   *
   * @param position - The queue position (0-indexed)
   */
  playSongAtPosition(position: number) {
    this.pendingAutoPlay = true;
    const moved = this.queue.moveToPosition(position);
    if (!moved) {
      console.error('[AudioPlayer.playSongAtPosition] Failed to move to position:', position);
    }
  }

  // ========== REPEAT MODE MANAGEMENT ==========

  /**
   * Sets the repeat mode.
   *
   * @param mode - 'off' | 'one' | 'all'
   */
  setRepeatMode(mode: 'off' | 'one' | 'all') {
    this.repeatMode = mode;
    this.emit('repeatModeChange', mode);
    this.preloadNextTrack();
  }

  /** Gets the current repeat mode. */
  getRepeatMode(): 'off' | 'one' | 'all' {
    return this.repeatMode;
  }

  // ========== GETTERS AND SETTERS FOR CURRENT STATE ==========

  /** Gets the current song ID from the queue. */
  get currentSongId(): number | null {
    return this.queue.currentSongId;
  }

  /** Gets the current playback time in seconds. */
  get currentTime(): number {
    return this.nativeCurrentTime;
  }

  /** Sets the current playback time in seconds. */
  set currentTime(time: number) {
    this.nativeCurrentTime = time;
    this.emit('timeUpdate', time);
    this.emit('seeking');

    const playerPositionChange = new CustomEvent('player/positionChange', {
      detail: Number(time.toFixed(2))
    });
    document.dispatchEvent(playerPositionChange);

    window.api?.audioEngine
      ?.seek(time)
      .then(() => {
        this.emit('seeked', time);
      })
      .catch((err) => {
        console.error('[AudioPlayer] Error seeking native audio engine:', err);
      });
  }

  /** Gets the duration of the current song in seconds. */
  get duration(): number {
    return this.nativeDuration;
  }

  /** Gets whether the audio is currently paused. */
  get paused(): boolean {
    return this.nativeIsPaused;
  }

  /** Gets the current volume (0-1). */
  get volume(): number {
    return this.currentVolume / 100;
  }

  /** Sets the volume (0-1). */
  set volume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.currentVolume = clamped * 100;
    const effectiveVolume = this.muted ? 0 : clamped;

    if (this.lastSetVolume !== effectiveVolume && window.api?.audioEngine) {
      this.lastSetVolume = effectiveVolume;
      window.api.audioEngine.setVolume(effectiveVolume).catch((err) => {
        console.error('[AudioPlayer] Error setting native audio engine volume:', err);
      });
    }
  }

  /** Gets the muted state. */
  get muted(): boolean {
    return this.isMuted;
  }

  /** Sets the muted state. */
  set muted(value: boolean) {
    if (this.isMuted === value) return;
    this.isMuted = value;
    const effectiveVolume = value ? 0 : this.volume;

    if (this.lastSetVolume !== effectiveVolume && window.api?.audioEngine) {
      this.lastSetVolume = effectiveVolume;
      window.api.audioEngine.setVolume(effectiveVolume).catch((err) => {
        console.error('[AudioPlayer] Error muting native audio engine:', err);
      });
    }
  }

  /** Gets the current playback rate. */
  get playbackRate(): number {
    return this.currentPlaybackRate;
  }

  /** Sets the playback rate. */
  set playbackRate(value: number) {
    if (this.currentPlaybackRate === value) return;
    this.currentPlaybackRate = value;

    if (this.lastSetPlaybackRate !== value && window.api?.audioEngine) {
      this.lastSetPlaybackRate = value;
      window.api.audioEngine.setPlaybackRate(value).catch((err) => {
        console.error('[AudioPlayer] Error setting native audio engine playback rate:', err);
      });
    }
  }
}

export default AudioPlayer;
