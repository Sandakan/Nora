import { EventEmitter } from 'events';
import { dispatch, store } from '../store/store';
import storage from '../utils/localStorage';
import { equalizerBandHertzData } from './equalizerData';
import PlayerQueue from './playerQueue';

const AUDIO_FADE_DURATION = 250;

/**
 * AudioPlayer class that manages audio playback with integrated queue management.
 * Extends EventEmitter to provide event-based architecture for player state changes.
 * Owns a PlayerQueue instance and automatically reacts to queue position changes.
 */
class AudioPlayer extends EventEmitter {
  audio: HTMLAudioElement;
  queue: PlayerQueue;
  currentVolume: number;

  currentContext: AudioContext;
  equalizerBands: Map<EqualizerBandFilters, BiquadFilterNode>;
  gainNode: GainNode;

  unsubscribeFunc: () => void;

  private repeatMode: 'off' | 'one' | 'all' = 'off';
  private pendingAutoPlay: boolean = false;

  constructor(queue: PlayerQueue) {
    super();

    this.audio = new Audio();
    this.queue = queue;

    this.audio.preload = 'auto';
    this.audio.defaultPlaybackRate = 1.0;

    this.currentContext = new window.AudioContext();
    this.equalizerBands = new Map();
    this.gainNode = this.currentContext.createGain();

    this.currentVolume = this.audio.volume;

    this.unsubscribeFunc = this.subscribeToStoreEvents();
    this.initializeEqualizer();
    this.setupQueueIntegration();
    this.setupAudioEventListeners();
  }

  /**
   * Sets up integration between queue and player.
   * Automatically loads songs when queue position changes.
   * Propagates queue events through player for convenience.
   */
  private setupQueueIntegration() {
    // React to queue position changes - load the new song
    this.queue.on('positionChange', () => {
      const songId = this.queue.currentSongId;
      console.log('[AudioPlayer.positionChange]', {
        position: this.queue.position,
        songId,
        willLoad: !!songId,
        pendingAutoPlay: this.pendingAutoPlay
      });
      if (songId) {
        this.loadSong(songId, { autoPlay: this.pendingAutoPlay }).catch((err) => {
          console.error('[AudioPlayer.positionChange] Failed to load song:', err);
          // Error will be handled by error event listener
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
   * Sets up audio element event listeners.
   * Emits player events for time updates, playback end, errors, etc.
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
   * Handles song end based on repeat mode.
   * Automatically advances queue or repeats as configured.
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
   * Loads a song into the audio element.
   * Fetches song data from API if songId is provided, or uses provided songData.
   * Sets up audio source and dispatches events.
   * @param songIdOrData - The ID of the song to load or the song data object
   * @param options - Optional configuration for song loading
   * @returns Promise resolving to the song data
   */
  private async loadSong(
    songIdOrData: number | AudioPlayerData,
    options?: { autoPlay?: boolean; updateStore?: boolean }
  ): Promise<AudioPlayerData> {
    let songData: AudioPlayerData;

    if (typeof songIdOrData === 'number') {
      // Fetch song data if ID provided
      songData = await window.api.audioLibraryControls.getSong(songIdOrData);
    } else {
      // Use provided song data
      songData = songIdOrData;
    }

    try {
      console.log('[AudioPlayer.loadSong]', { songId: songData.songId, options });

      // Update store with current song data if requested
      if (options?.updateStore !== false) {
        dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });

        // Update localStorage
        storage.playback.setCurrentSongOptions('songId', songData.songId);
      }

      // Set audio source with cache-busting timestamp
      this.audio.src = `${songData.path}?ts=${Date.now()}`;

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
      const trackChangeEvent = new CustomEvent('player/trackchange', { detail: songData.songId });
      this.audio.dispatchEvent(trackChangeEvent);

      this.emit('songLoaded', songData);
      console.log('[AudioPlayer.loadSong.done]', {
        songId: songData.songId,
        title: songData.title
      });

      return songData;
    } catch (error) {
      console.error(
        `Failed to load song (ID: ${songData.songId}):`,
        error instanceof Error ? error.message : error
      );
      this.emit('loadError', { songId: songData.songId, error });
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * Cleans up resources and event listeners.
   * Should be called when player is no longer needed.
   */
  destroy() {
    if (this.unsubscribeFunc) this.unsubscribeFunc();
    this.queue.removeAllListeners();
    this.removeAllListeners();
    this.audio.pause();
    this.audio.src = '';
    this.currentContext.close();
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
  private updateEqualizerPreset(equalizerPreset: LocalStorage['equalizerPreset']) {
    if (equalizerPreset) {
      const filters = equalizerPreset;
      for (const filter of Object.entries(filters)) {
        const filterName = filter[0] as EqualizerBandFilters;
        const gainValue: number = filter[1];

        const equalizerFilter = this.equalizerBands.get(filterName);
        if (equalizerFilter) equalizerFilter.gain.value = gainValue;
      }
    }
  }

  private updatePlayerVolume(volume: PlayerVolume) {
    this.volume = volume.value / 100;
    this.audio.muted = volume.isMuted;
  }

  private updatePlaybackRate(playbackRate: number) {
    if (this.audio.playbackRate !== playbackRate) this.audio.playbackRate = playbackRate;
  }

  private subscribeToStoreEvents() {
    const unsubscribeFunction = store.subscribe(() => {
      if (store) {
        const { localStorage, player } = store.state;

        this.updateEqualizerPreset(localStorage.equalizerPreset);
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

  /**
   * Starts or resumes audio playback with fade-in effect.
   */
  play() {
    this.audio.play();
    return this.fadeInAudio();
  }

  /**
   * Pauses audio playback with fade-out effect.
   */
  pause() {
    return this.fadeOutAudio();
  }

  /**
   * Toggles playback between play and pause.
   * @param forcePlay - If true, always play; if false, always pause; if undefined, toggle
   * @returns Promise that resolves when fade completes
   */
  async togglePlayback(forcePlay?: boolean): Promise<void> {
    const shouldPlay = forcePlay !== undefined ? forcePlay : this.audio.paused;

    if (shouldPlay) {
      if (this.audio.readyState > 0) {
        await this.play();
      }
    } else {
      await this.pause();
    }
  }

  /**
   * Seeks to a specific time position in the current song.
   * @param time - Time in seconds to seek to
   */
  seek(time: number) {
    this.audio.currentTime = time;
  }

  /**
   * Loads and optionally plays a song by ID.
   * This is the public API for loading songs - handles store updates, localStorage, and analytics.
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
   * Skips forward to the next song in the queue.
   * Handles repeat modes and automatically loads/plays the next song.
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
      console.log('[AudioPlayer.skipForward.moved]', { position: this.queue.position });
    } else if (this.repeatMode === 'all' && this.queue.length > 0) {
      this.pendingAutoPlay = true; // Auto-play when restarting queue
      this.queue.moveToStart();
    } else if (this.queue.isEmpty) {
      console.log('[AudioPlayer.skipForward] Queue is empty.');
    }
    // else: at end without repeat, do nothing (song ends)
  }

  /**
   * Skips backward to the previous song or restarts current song.
   * If current time > 5 seconds, restarts current song.
   * Otherwise, moves to previous song in queue.
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
   * Plays the next song in the queue.
   * Delegates to queue's moveToNext() which triggers song loading.
   * @deprecated Use skipForward() instead for better control
   */
  playNext() {
    if (this.queue.hasNext) {
      this.queue.moveToNext();
    }
  }

  /**
   * Plays the previous song in the queue.
   * Delegates to queue's moveToPrevious() which triggers song loading.
   * @deprecated Use skipBackward() instead for better control
   */
  playPrevious() {
    if (this.queue.hasPrevious) {
      this.queue.moveToPrevious();
    }
  }

  /**
   * Plays a song at a specific position in the queue.
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
   * @param mode - 'off' | 'one' | 'all'
   */
  setRepeatMode(mode: 'off' | 'one' | 'all') {
    this.repeatMode = mode;
    this.emit('repeatModeChange', mode);
  }

  /**
   * Gets the current repeat mode.
   */
  getRepeatMode(): 'off' | 'one' | 'all' {
    return this.repeatMode;
  }

  // ========== GETTERS FOR CURRENT STATE ==========

  /**
   * Gets the current song ID from the queue.
   */
  get currentSongId(): number | null {
    return this.queue.currentSongId;
  }

  /**
   * Gets the current playback time in seconds.
   */
  get currentTime(): number {
    return this.audio.currentTime;
  }

  /**
   * Sets the current playback time in seconds.
   */
  set currentTime(time: number) {
    this.audio.currentTime = time;
  }

  /**
   * Gets the duration of the current song in seconds.
   */
  get duration(): number {
    return this.audio.duration;
  }

  /**
   * Gets whether the audio is currently paused.
   */
  get paused(): boolean {
    return this.audio.paused;
  }

  /**
   * Gets the current volume (0-1).
   */
  get volume(): number {
    return this.currentVolume / 100;
  }

  /**
   * Sets the volume (0-1).
   */
  set volume(volume: number) {
    this.currentVolume = volume * 100;
    this.audio.volume = volume;
    this.gainNode.gain.value = volume;
  }

  /**
   * Gets the muted state.
   */
  get muted(): boolean {
    return this.audio.muted;
  }

  /**
   * Sets the muted state.
   */
  set muted(value: boolean) {
    this.audio.muted = value;
    this.gainNode.gain.value = value ? 0 : this.volume;
  }

  /**
   * Gets the current playback rate.
   */
  get playbackRate(): number {
    return this.audio.playbackRate;
  }

  /**
   * Sets the playback rate.
   */
  set playbackRate(value: number) {
    this.audio.playbackRate = value;
  }
}

export default AudioPlayer;
