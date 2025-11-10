import { EventEmitter } from 'events';
import { store } from '../store/store';
import { equalizerBandHertzData } from './equalizerData';
import PlayerQueue from './playerQueue';

const AUDIO_FADE_INTERVAL = 50;
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

  fadeOutIntervalId: NodeJS.Timeout | undefined;
  fadeInIntervalId: NodeJS.Timeout | undefined;

  unsubscribeFunc: () => void;

  private repeatMode: 'off' | 'one' | 'all' = 'off';

  constructor(queue: PlayerQueue) {
    super();

    this.audio = new Audio();
    this.queue = queue;

    this.audio.preload = 'auto';
    this.audio.defaultPlaybackRate = 1.0;

    this.currentContext = new window.AudioContext();
    this.equalizerBands = new Map();

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
      if (songId) {
        this.loadSong(songId);
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
   */
  private handleSongEnd() {
    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      this.audio.play();
      this.emit('repeatOne');
      return;
    }

    if (this.queue.hasNext) {
      this.queue.moveToNext();
    } else if (this.repeatMode === 'all' && this.queue.length > 0) {
      this.queue.moveToPosition(0);
      this.emit('repeatAll');
    } else {
      this.emit('playbackComplete');
    }
  }

  /**
   * Loads a song into the audio element.
   * Fetches song data from API and sets up audio source.
   * @param songId - The ID of the song to load
   */
  private async loadSong(songId: string) {
    try {
      const songData = await window.api.audioLibraryControls.getSong(songId);
      this.audio.src = songData.path;
      await this.audio.load();
      this.emit('songLoaded', songData);
    } catch (error) {
      console.error(
        `Failed to load song (ID: ${songId}):`,
        error instanceof Error ? error.message : error
      );
      this.emit('loadError', { songId, error });
    }
  }

  /**
   * Cleans up resources and event listeners.
   * Should be called when player is no longer needed.
   */
  destroy() {
    if (this.unsubscribeFunc) this.unsubscribeFunc();
    if (this.fadeInIntervalId) clearInterval(this.fadeInIntervalId);
    if (this.fadeOutIntervalId) clearInterval(this.fadeOutIntervalId);
    this.queue.removeAllListeners();
    this.removeAllListeners();
    this.audio.pause();
    this.audio.src = '';
  }

  private fadeOutAudio(): Promise<void> {
    return new Promise((resolve) => {
      if (this.fadeInIntervalId) clearInterval(this.fadeInIntervalId);
      if (this.fadeOutIntervalId) clearInterval(this.fadeOutIntervalId);

      this.fadeOutIntervalId = setInterval(() => {
        if (this.audio.volume > 0) {
          const rate = this.currentVolume / (100 * (AUDIO_FADE_DURATION / AUDIO_FADE_INTERVAL));
          if (this.audio.volume - rate <= 0) this.audio.volume = 0;
          else this.audio.volume -= rate;
        } else {
          this.audio.pause();
          if (this.fadeOutIntervalId) clearInterval(this.fadeOutIntervalId);
          resolve(undefined);
        }
      }, AUDIO_FADE_INTERVAL);
    });
  }

  private fadeInAudio(): Promise<void> {
    return new Promise((resolve) => {
      if (this.fadeInIntervalId) clearInterval(this.fadeInIntervalId);
      if (this.fadeOutIntervalId) clearInterval(this.fadeOutIntervalId);

      this.fadeInIntervalId = setInterval(() => {
        if (this.audio.volume < this.currentVolume / 100) {
          const rate =
            (this.currentVolume / 100 / AUDIO_FADE_INTERVAL) *
            (AUDIO_FADE_DURATION / AUDIO_FADE_INTERVAL);
          if (this.audio.volume + rate >= this.currentVolume / 100)
            this.audio.volume = this.currentVolume / 100;
          else this.audio.volume += rate;
        } else if (this.fadeInIntervalId) {
          clearInterval(this.fadeInIntervalId);
          resolve(undefined);
        }
      }, AUDIO_FADE_INTERVAL);
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

        if (isTheLastFilter) filter.connect(this.currentContext.destination);
      }
    });
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
      }
    });

    return unsubscribeFunction;
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
   * Seeks to a specific time position in the current song.
   * @param time - Time in seconds to seek to
   */
  seek(time: number) {
    this.audio.currentTime = time;
  }

  // ========== QUEUE NAVIGATION ==========

  /**
   * Plays the next song in the queue.
   * Delegates to queue's moveToNext() which triggers song loading.
   */
  playNext() {
    if (this.queue.hasNext) {
      this.queue.moveToNext();
    }
  }

  /**
   * Plays the previous song in the queue.
   * Delegates to queue's moveToPrevious() which triggers song loading.
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
    this.queue.moveToPosition(position);
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
  get currentSongId(): string | null {
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
    if (this.fadeInIntervalId) clearInterval(this.fadeInIntervalId);
    if (this.fadeOutIntervalId) clearInterval(this.fadeOutIntervalId);

    this.currentVolume = volume * 100;
    this.audio.volume = volume;
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
