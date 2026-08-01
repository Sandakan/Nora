import type { Subscription } from '@tanstack/react-store';

import { dispatch, store } from '../store/store';
import storage from '../utils/localStorage';
import { equalizerBandHertzData } from './equalizerData';
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
 * AudioPlayer class that manages audio playback with integrated queue management. Provides
 * event-based architecture for player state changes. Owns a PlayerQueue instance and automatically
 * reacts to queue position changes.
 */
class AudioPlayer {
  private listeners: Map<PlayerEventType, Set<PlayerEventCallback<unknown>>>;

  audio: HTMLAudioElement;
  queue: PlayerQueue;
  currentVolume: number;

  currentContext: AudioContext;
  equalizerBands: Map<EqualizerBandFilters, BiquadFilterNode>;
  gainNode: GainNode;

  unsubscribeFunc: Subscription;

  private repeatMode: 'off' | 'one' | 'all' = 'off';
  private pendingAutoPlay: boolean = false;
  private boundDeviceChangeHandler: (() => void) | null = null;
  private isRecoveringFromDeviceChange = false;
  private deviceChangeGeneration = 0;
  private static readonly DEBUG = false;

  constructor(queue: PlayerQueue) {
    this.listeners = new Map();

    this.audio = new Audio();
    this.queue = queue;
    // MediaElementAudioSourceNode requires a CORS-enabled media fetch.
    this.audio.crossOrigin = 'anonymous';

    this.audio.preload = 'auto';
    this.audio.defaultPlaybackRate = 1.0;

    this.currentContext = new window.AudioContext();
    this.equalizerBands = new Map();
    this.gainNode = this.currentContext.createGain();

    // Store volume is 0-100 (default 50). The element volume is 0-1 and stays 1
    // until a store notification, so initializing from this.audio.volume would
    // leave currentVolume at 1 and Strategy 3 rebuilds would restore ~1% gain.
    this.currentVolume = store.state.player.volume.value;
    this.audio.volume = this.currentVolume / 100;

    this.unsubscribeFunc = this.subscribeToStoreEvents();
    this.initializeEqualizer();
    this.setupQueueIntegration();
    this.setupAudioEventListeners();
    this.setupDeviceChangeListener();
  }

  /**
   * Sets up integration between queue and player. Automatically loads songs when queue position
   * changes. Propagates queue events through player for convenience.
   */
  private setupQueueIntegration() {
    // React to queue position changes - load the new song
    this.queue.on('positionChange', () => {
      const songId = this.queue.currentSongId;
      const willAutoPlay = this.pendingAutoPlay;
      console.log('[AudioPlayer.positionChange]', {
        position: this.queue.position,
        songId,
        willLoad: !!songId,
        pendingAutoPlay: willAutoPlay
      });
      if (songId) {
        this.loadSong(songId, { autoPlay: willAutoPlay }).catch((err) => {
          console.error('[AudioPlayer.positionChange] Failed to load song:', err);
          if (this.queue.hasNext) {
            this.pendingAutoPlay = willAutoPlay;
            setTimeout(() => this.queue.moveToNext(), 0);
          }
        });
        this.pendingAutoPlay = false; // Reset after use
      }
    });

    // Propagate queue change events through player
    this.queue.on('queueChange', (data) => {
      this.emit('queueChange', data);
    });

    // Propagate metadata changes
    this.queue.on('metadataChange', (data) => {
      this.emit('queueMetadataChange', data);
    });
  }

  /**
   * Sets up audio element event listeners. Emits player events for time updates, playback end,
   * errors, etc.
   */
  private setupAudioEventListeners() {
    this.audio.addEventListener('ended', () => this.handleSongEnd());

    this.audio.addEventListener('timeupdate', () => {
      this.emit('timeUpdate', this.audio.currentTime);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.emit('durationChange', this.audio.duration);
    });

    this.audio.addEventListener('play', () => {
      this.emit('play');
    });

    this.audio.addEventListener('pause', () => {
      this.emit('pause');
    });

    this.audio.addEventListener('error', (e) => {
      this.emit('error', e);
    });

    this.audio.addEventListener('seeking', () => {
      this.emit('seeking');
    });

    this.audio.addEventListener('seeked', () => {
      this.emit('seeked', this.audio.currentTime);
    });
  }

  /**
   * Listens for OS audio output device changes (Bluetooth connect/disconnect, USB, FxSound).
   * When the active device drops, Chromium's AudioContext sink dies silently. This handler
   * detects the change and recovers playback by reloading the audio source on the new device.
   */
  private setupDeviceChangeListener() {
    if (!navigator.mediaDevices || !('ondevicechange' in navigator.mediaDevices)) return;

    this.boundDeviceChangeHandler = () => {
      if (this.isRecoveringFromDeviceChange) return;
      this.handleDeviceChange().catch((err) => {
        console.error('[AudioPlayer] Device change recovery failed:', err);
      });
    };
    navigator.mediaDevices.ondevicechange = this.boundDeviceChangeHandler;
  }

  private waitForCanPlay(timeoutMs = 5000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const cleanup = () => {
        if (timer) clearTimeout(timer);
        this.audio.removeEventListener('canplay', onCanPlay);
        this.audio.removeEventListener('error', onError);
      };
      const onCanPlay = () => { cleanup(); resolve(); };
      const onError = (e: Event) => { cleanup(); reject(e); };
      this.audio.addEventListener('canplay', onCanPlay);
      this.audio.addEventListener('error', onError);
      timer = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout waiting for canplay'));
      }, timeoutMs);
    });
  }

  /**
   * Recovers playback after an audio output device change. Saves position, attempts a simple
   * play() first (Chromium often auto-reroutes to the new default). If that fails, reloads
   * the audio element to force Chromium to re-establish the audio path. As a last resort,
   * rebuilds the entire AudioContext + EQ chain with a fresh Audio element.
   *
   * @param options.shouldResume - Whether recovery should resume playback. For an OS
   *   devicechange event this defaults to the pre-event playing state (a deliberate pause
   *   must not be undone). For a failed explicit play() request the caller passes true so a
   *   rejected playback actually retries instead of silently reporting success while paused.
   */
  private async handleDeviceChange(options?: { shouldResume?: boolean }) {
    const savedTime = this.audio.currentTime;
    const currentSrc = this.audio.src;

    if (!currentSrc) return;

    // Do not infer user intent from audio.paused AFTER a failed play() — a rejected
    // play() leaves the element paused even when the user asked for playback. The
    // caller decides: devicechange keeps paused state, an explicit play request forces
    // a resume attempt.
    const shouldResume = options?.shouldResume ?? !this.audio.paused;

    const generation = ++this.deviceChangeGeneration;

    if (AudioPlayer.DEBUG) console.log('[AudioPlayer.handleDeviceChange]', { savedTime, shouldResume });

    // Mark recovery in progress so other methods know
    this.isRecoveringFromDeviceChange = true;

    const isStale = () => generation !== this.deviceChangeGeneration;

    try {
      if (this.currentContext.state === 'suspended') {
        await this.currentContext.resume();
      }

      if (await this.trySimplePlay(savedTime, shouldResume, isStale)) return;
      if (isStale()) return;

      try {
        await this.reloadSrc(currentSrc, savedTime, shouldResume, isStale);
        if (AudioPlayer.DEBUG) console.log('[AudioPlayer.handleDeviceChange] Reload recovery succeeded');
      } catch (err) {
        if (isStale()) return;

        console.error('[AudioPlayer.handleDeviceChange] Reload failed, rebuilding AudioContext', err);

        try {
          await this.rebuildAndPlay(currentSrc, savedTime, shouldResume, isStale);
          if (AudioPlayer.DEBUG) console.log('[AudioPlayer.handleDeviceChange] AudioContext rebuild recovery succeeded');
        } catch (rebuildErr) {
          console.error('[AudioPlayer.handleDeviceChange] All recovery strategies failed', rebuildErr);
          this.emit('error', rebuildErr);
          // Dispatch native error event so the app's playback-error UI picks it up
          this.audio.dispatchEvent(new Event('error'));
        }
      }
    } finally {
      if (!isStale()) {
        this.isRecoveringFromDeviceChange = false;
      }
    }
  }

  /** Strategy 1: plain play() — Chromium may auto-reroute to the new device. Returns true when handled. */
  private async trySimplePlay(
    savedTime: number,
    shouldResume: boolean,
    isStale: () => boolean
  ): Promise<boolean> {
    try {
      if (shouldResume) await this.audio.play();
      if (isStale()) return true;
      this.audio.currentTime = savedTime;
      if (AudioPlayer.DEBUG) console.log('[AudioPlayer.handleDeviceChange] Simple play() succeeded');
      return true;
    } catch {
      if (isStale()) return true;
      if (AudioPlayer.DEBUG) console.log('[AudioPlayer.handleDeviceChange] Simple play() failed, reloading src');
      return false;
    }
  }

  /** Strategy 2: cache-busting src reload to force a fresh audio path. */
  private async reloadSrc(
    currentSrc: string,
    savedTime: number,
    shouldResume: boolean,
    isStale: () => boolean
  ): Promise<void> {
    this.audio.src = '';
    const url = new URL(currentSrc.split('?')[0]);
    url.searchParams.set('ts', `${Date.now()}`);
    this.audio.src = url.toString();
    this.audio.load();

    await this.waitForCanPlay();
    if (isStale()) return;

    this.audio.currentTime = savedTime;
    if (shouldResume) await this.audio.play();
  }

  /** Strategy 3: rebuild the AudioContext + EQ chain with a new Audio element, then resume. */
  private async rebuildAndPlay(
    currentSrc: string,
    savedTime: number,
    shouldResume: boolean,
    isStale: () => boolean
  ): Promise<void> {
    this.rebuildAudioContext();
    this.audio.src = currentSrc;
    this.audio.load();

    await this.waitForCanPlay();
    if (isStale()) return;

    this.audio.currentTime = savedTime;
    if (shouldResume) await this.audio.play();
  }

  /**
   * Tears down and rebuilds the entire Web Audio graph (AudioContext, EQ chain, gain, destination).
   * Creates a new Audio element because Chromium permanently binds an element to its first
   * MediaElementSourceNode — reusing the same element after closing the old context throws
   * InvalidStateError. Restores EQ band values, volume, mute state, and re-attaches all event
   * listeners to the new element.
   */
  private rebuildAudioContext() {
    if (AudioPlayer.DEBUG) console.log('[AudioPlayer.rebuildAudioContext]');

    // Save current state from old element
    const savedSrc = this.audio.src;
    const savedTime = this.audio.currentTime;
    const savedVolume = this.audio.volume;
    const savedMuted = this.audio.muted;
    const savedPlaybackRate = this.audio.playbackRate;

    // Disconnect and close old context
    try {
      this.gainNode.disconnect();
    } catch {
      // Already disconnected
    }
    this.equalizerBands.forEach((filter) => {
      try {
        filter.disconnect();
      } catch {
        // Already disconnected
      }
    });
    try {
      this.currentContext.close();
    } catch {
      // Already closed
    }

    // Release the old audio element to free media resources
    const oldAudio = this.audio;
    oldAudio.pause();
    oldAudio.removeAttribute('src');
    oldAudio.load();

    // Create a new Audio element (Chromium requires this — see Critical #2)
    const newAudio = new Audio();
    newAudio.crossOrigin = 'anonymous';
    newAudio.preload = 'auto';
    newAudio.src = savedSrc;
    newAudio.volume = savedVolume;
    newAudio.muted = savedMuted;
    newAudio.defaultPlaybackRate = 1.0;
    newAudio.playbackRate = savedPlaybackRate;

    // Replace the old element
    this.audio = newAudio;

    // Re-attach all event listeners to the new element
    this.setupAudioEventListeners();

    // Create fresh context
    this.currentContext = new window.AudioContext();
    this.gainNode = this.currentContext.createGain();

    // Rebuild EQ chain with saved values
    for (const [filterName, hertzValue] of Object.entries(equalizerBandHertzData)) {
      const filter = this.currentContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = hertzValue;
      filter.Q.value = 1;
      const oldBand = this.equalizerBands.get(filterName as EqualizerBandFilters);
      filter.gain.value = oldBand?.gain?.value ?? 0;
      this.equalizerBands.set(filterName as EqualizerBandFilters, filter);
    }

    // Re-wire: source -> EQ filters -> gain -> destination
    const source = this.currentContext.createMediaElementSource(this.audio);
    const filterMapKeys = [...this.equalizerBands.keys()];

    this.equalizerBands.forEach((filter, key, map) => {
      const idx = filterMapKeys.indexOf(key);
      if (idx === 0) {
        source.connect(filter);
      } else {
        const prev = map.get(filterMapKeys[idx - 1]);
        if (prev) prev.connect(filter);
        if (idx === filterMapKeys.length - 1) filter.connect(this.gainNode);
      }
    });

    this.gainNode.connect(this.currentContext.destination);

    // Restore volume and mute state on the gain node
    this.gainNode.gain.value = this.audio.muted ? 0 : this.currentVolume / 100;

    // Restore position after load
    this.audio.currentTime = savedTime;

    // Force React re-render so hooks re-read this.audio and get the new element.
    // Without this, hooks like useAppLifecycle hold stale references to the old element.
    dispatch({ type: 'CURRENT_SONG_PLAYBACK_STATE', data: false });
  }

  /**
   * Handles song end based on repeat mode. Automatically advances queue or repeats as configured.
   * Auto-resumes playback for the next song.
   */
  private async handleSongEnd() {
    console.log('[AudioPlayer.handleSongEnd]', { repeatMode: this.repeatMode });

    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      await this.play();
      this.emit('repeatOne');
      return;
    }

    if (this.queue.hasNext) {
      this.pendingAutoPlay = true;
      this.queue.moveToNext();
      // Song will be auto-loaded via positionChange event with autoPlay
    } else if (this.repeatMode === 'all' && this.queue.length > 0) {
      this.pendingAutoPlay = true;
      this.queue.moveToPosition(0);
      this.emit('repeatAll');
      // Song will be auto-loaded via positionChange event with autoPlay
    } else {
      this.emit('playbackComplete');
    }
  }

  /**
   * Loads a song into the audio element. Fetches song data from API if songId is provided, or uses
   * provided songData. Sets up audio source and dispatches events.
   *
   * @param songIdOrData - The ID of the song to load or the song data object
   * @param options - Optional configuration for song loading
   * @returns Promise resolving to the song data
   */
  private async loadSong(
    songIdOrData: number | AudioPlayerData,
    options?: { autoPlay?: boolean; updateStore?: boolean }
  ): Promise<AudioPlayerData> {
    // Cancel any in-flight device-change recovery when loading a new track
    ++this.deviceChangeGeneration;
    this.isRecoveringFromDeviceChange = false;
    let songData: AudioPlayerData;

    try {
      if (typeof songIdOrData === 'number') {
        // Fetch song data if ID provided (may throw if file not found)
        songData = await window.api.audioLibraryControls.getSong(songIdOrData);
      } else {
        // Use provided song data
        songData = songIdOrData;
      }

      console.log('[AudioPlayer.loadSong]', {
        songId: songData.songId,
        options
      });

      // Update store with current song data if requested
      if (options?.updateStore !== false) {
        dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });

        // Update localStorage
        storage.playback.setCurrentSongOptions('songId', songData.songId);
      }

      // Set audio source with a single cache-busting timestamp.
      // Bump generation again to cancel any device-change recovery that started
      // during the getSong() fetch window (before we set the new src).
      ++this.deviceChangeGeneration;
      this.isRecoveringFromDeviceChange = false;

      const audioSourceUrl = new URL(songData.path);
      audioSourceUrl.searchParams.set('ts', `${Date.now()}`);
      this.audio.src = audioSourceUrl.toString();

      // Load is synchronous, no need to await
      this.audio.load();

      // Set up auto-play if requested
      if (options?.autoPlay) {
        // Check if audio is already ready to play (cached/buffered)
        if (this.audio.readyState >= 3) {
          // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA - ready to play
          this.play().catch((err) =>
            console.error('[AudioPlayer] Immediate auto-play failed:', err)
          );
        } else {
          // Wait for canplay event
          const autoPlayHandler = () => {
            this.play().catch((err) =>
              console.error('[AudioPlayer] Auto-play on canplay failed:', err)
            );
            this.audio.removeEventListener('canplay', autoPlayHandler);
          };
          this.audio.addEventListener('canplay', autoPlayHandler);
        }
      }

      // Dispatch custom track change event
      const trackChangeEvent = new CustomEvent('player/trackchange', {
        detail: songData.songId
      });
      this.audio.dispatchEvent(trackChangeEvent);

      this.emit('songLoaded', songData);
      console.log('[AudioPlayer.loadSong.done]', {
        songId: songData.songId,
        title: songData.title
      });

      return songData;
    } catch (error) {
      const failedSongId = typeof songIdOrData === 'number' ? songIdOrData : songIdOrData.songId;
      console.error(
        `Failed to load song (ID: ${failedSongId}):`,
        error instanceof Error ? error.message : error
      );
      this.emit('loadError', { songId: failedSongId ?? 0, error });
      throw error; // Re-throw for caller to handle
    }
  }

  /** Cleans up resources and event listeners. Should be called when player is no longer needed. */
  destroy() {
    if (this.unsubscribeFunc) this.unsubscribeFunc.unsubscribe();
    // Cancel any in-flight device-change recovery so pending continuations
    // bail at their next generation checkpoint instead of touching a torn-
    // down context or dispatching errors after teardown.
    ++this.deviceChangeGeneration;
    this.isRecoveringFromDeviceChange = false;
    this.queue.removeAllListeners();
    this.removeAllListeners();
    this.audio.pause();
    this.audio.src = '';
    this.currentContext.close();

    // Clean up device change listener
    if (this.boundDeviceChangeHandler && navigator.mediaDevices?.ondevicechange) {
      navigator.mediaDevices.ondevicechange = null;
      this.boundDeviceChangeHandler = null;
    }
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
  }

  /** Remove all listeners for all events. */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  private fadeOutAudio(): Promise<void> {
    return new Promise((resolve) => {
      const currentTime = this.currentContext.currentTime;
      const targetVolume = 0.001; // Very low but not zero to avoid clicks
      const fadeDuration = AUDIO_FADE_DURATION / 1000; // Convert to seconds

      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(targetVolume, currentTime + fadeDuration);

      // Schedule pause after fade completes
      setTimeout(() => {
        this.audio.pause();
        resolve(undefined);
      }, AUDIO_FADE_DURATION);
    });
  }

  private fadeInAudio(): Promise<void> {
    return new Promise((resolve) => {
      const currentTime = this.currentContext.currentTime;
      const targetVolume = this.currentVolume / 100;
      const fadeDuration = AUDIO_FADE_DURATION / 1000; // Convert to seconds

      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(targetVolume, currentTime + fadeDuration);

      // Resolve after fade completes
      setTimeout(() => {
        resolve(undefined);
      }, AUDIO_FADE_DURATION);
    });
  }

  private initializeEqualizer() {
    for (const [filterName, hertzValue] of Object.entries(equalizerBandHertzData)) {
      const equalizerFilterName = filterName as EqualizerBandFilters;
      const equalizerBand = this.currentContext.createBiquadFilter();

      equalizerBand.type = 'peaking';
      equalizerBand.frequency.value = hertzValue;
      equalizerBand.Q.value = 1;
      equalizerBand.gain.value = 0;

      this.equalizerBands.set(equalizerFilterName, equalizerBand);
    }

    const source = this.currentContext.createMediaElementSource(this.audio);
    const filterMapKeys = [...this.equalizerBands.keys()];

    this.equalizerBands.forEach((filter, key, map) => {
      const currentFilterIndex = filterMapKeys.indexOf(key);
      const isTheFirstFilter = currentFilterIndex === 0;
      const isTheLastFilter = currentFilterIndex === filterMapKeys.length - 1;

      if (isTheFirstFilter) source.connect(filter);
      else {
        const prevFilter = map.get(filterMapKeys[currentFilterIndex - 1]);
        if (prevFilter) prevFilter.connect(filter);

        if (isTheLastFilter) filter.connect(this.gainNode);
      }
    });

    // Connect gain node to destination
    this.gainNode.connect(this.currentContext.destination);
  }

  // ? PLAYER RELATED STORE UPDATES HANDLING
  private updatePlayerVolume(volume: PlayerVolume) {
    this.volume = volume.value / 100;
    this.audio.muted = volume.isMuted;
  }

  private updatePlaybackRate(playbackRate: number) {
    if (this.audio.playbackRate !== playbackRate) {
      this.audio.playbackRate = playbackRate;
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
    // Convert store's RepeatTypes to AudioPlayer's repeat mode format
    const newMode = isRepeating === 'repeat-1' ? 'one' : isRepeating === 'repeat' ? 'all' : 'off';
    if (this.repeatMode !== newMode) {
      this.repeatMode = newMode;
    }
  }

  // ========== PUBLIC PLAYBACK CONTROLS ==========

  /** Starts or resumes audio playback with fade-in effect. */
  async play() {
    if (this.currentContext.state === 'suspended') {
      await this.currentContext.resume();
    }
    try {
      await this.audio.play();
    } catch (err) {
      if (this.isRecoveringFromDeviceChange) throw err;
      // A rejected play() leaves the element paused even when the user asked
      // for playback. Force a resume attempt so recovery doesn't silently
      // report success while audio stays paused.
      await this.handleDeviceChange({ shouldResume: true });
      return;
    }
    return this.fadeInAudio();
  }

  /** Pauses audio playback with fade-out effect. */
  pause() {
    return this.fadeOutAudio();
  }

  /**
   * Toggles playback between play and pause.
   *
   * @param forcePlay - If true, always play; if false, always pause; if undefined, toggle
   * @returns Promise that resolves when fade completes
   */
  async togglePlayback(forcePlay?: boolean): Promise<void> {
    const shouldPlay = forcePlay !== undefined ? forcePlay : this.audio.paused;

    if (shouldPlay) {
      if (this.audio.readyState > 0) {
        try {
          await this.play();
        } catch {
          // Play failed and recovery already ran (or is in flight). Surface it.
          this.emit('error', new Error('Play failed while recovery is in progress'));
          this.audio.dispatchEvent(new Event('error'));
        }
      } else if (this.audio.src) {
        // readyState is 0 but src exists — try a normal play first; only
        // escalate to device recovery if that fails. This avoids treating a
        // still-buffering song as a dead audio path.
        try {
          await this.play();
        } catch {
          if (!this.isRecoveringFromDeviceChange) {
            await this.handleDeviceChange({ shouldResume: true });
          }
        }
      }
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
    this.audio.currentTime = time;
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
  ): Promise<void> {
    const { autoPlay = true, recordListening = true, onError } = options;

    try {
      console.log('[AudioPlayer.playSongById]', { songId, autoPlay });

      // Fetch song data once
      const songData = await window.api.audioLibraryControls.getSong(songId);

      // Load song with store updates
      await this.loadSong(songData, { autoPlay, updateStore: true });

      // Record listening data if requested
      if (recordListening) {
        // Note: Listening data recording will be handled by the hook until fully migrated
        this.emit('recordListening', { songId, duration: songData.duration });
      }
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

    // Handle repeat-one mode (only auto-repeat, not on user skip)
    if (this.repeatMode === 'one' && reason !== 'USER_SKIP') {
      this.audio.currentTime = 0;
      await this.play();

      // Emit event for listening data recording (repetition)
      if (store.state.currentSongData?.songId) {
        this.emit('repeatSong', {
          songId: store.state.currentSongData.songId,
          duration: store.state.currentSongData.duration
        });
      }
      return;
    }

    // Move to next song or restart queue if repeat-all
    if (this.queue.hasNext) {
      this.pendingAutoPlay = true; // Auto-play next song on manual skip
      this.queue.moveToNext();
      console.log('[AudioPlayer.skipForward.moved]', {
        position: this.queue.position
      });
    } else if (this.repeatMode === 'all' && this.queue.length > 0) {
      this.pendingAutoPlay = true; // Auto-play when restarting queue
      this.queue.moveToStart();
    } else if (this.queue.isEmpty) {
      console.log('[AudioPlayer.skipForward] Queue is empty.');
    }
    // else: at end without repeat, do nothing (song ends)
  }

  /**
   * Skips backward to the previous song or restarts current song. If current time > 5 seconds,
   * restarts current song. Otherwise, moves to previous song in queue.
   */
  skipBackward(): void {
    console.log('[AudioPlayer.skipBackward]', {
      currentTime: this.audio.currentTime,
      position: this.queue.position,
      hasPrevious: this.queue.hasPrevious
    });

    // If more than 5 seconds into song, restart it
    if (this.audio.currentTime > 5) {
      this.audio.currentTime = 0;
      return;
    }

    // Move to previous song if available
    if (this.queue.currentSongId !== null) {
      if (this.queue.hasPrevious) {
        this.pendingAutoPlay = true; // Auto-play previous song on manual skip
        this.queue.moveToPrevious();
      } else {
        // At first song, restart it
        this.pendingAutoPlay = true;
        this.queue.moveToStart();
      }
    } else if (this.queue.length > 0) {
      // No current song but queue has songs, play first
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
      this.queue.moveToPrevious();
    }
  }

  /**
   * Plays a song at a specific position in the queue.
   *
   * @param position - The queue position (0-indexed)
   */
  playSongAtPosition(position: number) {
    this.pendingAutoPlay = true; // Auto-play when manually selecting a position
    const moved = this.queue.moveToPosition(position);
    if (!moved) {
      console.error('[AudioPlayer.playSongAtPosition] Failed to move to position:', position);
    }
    // Song will be auto-loaded via queue's positionChange event
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
  }

  /** Gets the current repeat mode. */
  getRepeatMode(): 'off' | 'one' | 'all' {
    return this.repeatMode;
  }

  // ========== GETTERS FOR CURRENT STATE ==========

  /** Gets the current song ID from the queue. */
  get currentSongId(): number | null {
    return this.queue.currentSongId;
  }

  /** Gets the current playback time in seconds. */
  get currentTime(): number {
    return this.audio.currentTime;
  }

  /** Sets the current playback time in seconds. */
  set currentTime(time: number) {
    this.audio.currentTime = time;
  }

  /** Gets the duration of the current song in seconds. */
  get duration(): number {
    return this.audio.duration;
  }

  /** Gets whether the audio is currently paused. */
  get paused(): boolean {
    return this.audio.paused;
  }

  /** Gets the current volume (0-1). */
  get volume(): number {
    return this.currentVolume / 100;
  }

  /** Sets the volume (0-1). */
  set volume(volume: number) {
    this.currentVolume = volume * 100;
    this.audio.volume = volume;
    this.gainNode.gain.value = volume;
  }

  /** Gets the muted state. */
  get muted(): boolean {
    return this.audio.muted;
  }

  /** Sets the muted state. */
  set muted(value: boolean) {
    this.audio.muted = value;
    this.gainNode.gain.value = value ? 0 : this.volume;
  }

  /** Gets the current playback rate. */
  get playbackRate(): number {
    return this.audio.playbackRate;
  }

  /** Sets the playback rate. */
  set playbackRate(value: number) {
    this.audio.playbackRate = value;
  }
}

export default AudioPlayer;
