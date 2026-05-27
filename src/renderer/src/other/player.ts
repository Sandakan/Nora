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

class AudioPlayer {
  private listeners: Map<PlayerEventType, Set<PlayerEventCallback<unknown>>>;

  audio: HTMLAudioElement;
  secondaryAudio: HTMLAudioElement;
  queue: PlayerQueue;
  currentVolume: number;

  currentContext: AudioContext;
  equalizerBands: Map<EqualizerBandFilters, BiquadFilterNode>;
  gainNode: GainNode;

  fadeGainPrimary: GainNode;
  fadeGainSecondary: GainNode;
  crossfadeMixBus: GainNode;

  unsubscribeFunc: Subscription;

  private repeatMode: 'off' | 'one' | 'all' = 'off';
  private pendingAutoPlay: boolean = false;

  private activeElement: 'primary' | 'secondary' = 'primary';
  private isCrossfading: boolean = false;
  private crossfadeDuration: number = 0;
  private crossfadeTimer: ReturnType<typeof setTimeout> | null = null;

  private preloadedSongId: number | null = null;
  private preloadedSongData: AudioPlayerData | null = null;

  private secondarySource: MediaElementAudioSourceNode | null = null;

  constructor(queue: PlayerQueue) {
    this.listeners = new Map();

    this.audio = new Audio();
    this.secondaryAudio = new Audio();
    this.queue = queue;

    this.audio.crossOrigin = 'anonymous';
    this.secondaryAudio.crossOrigin = 'anonymous';

    this.audio.preload = 'auto';
    this.secondaryAudio.preload = 'auto';
    this.audio.defaultPlaybackRate = 1.0;
    this.secondaryAudio.defaultPlaybackRate = 1.0;

    this.currentContext = new window.AudioContext();
    this.equalizerBands = new Map();
    this.gainNode = this.currentContext.createGain();
    this.fadeGainPrimary = this.currentContext.createGain();
    this.fadeGainSecondary = this.currentContext.createGain();
    this.crossfadeMixBus = this.currentContext.createGain();

    this.fadeGainPrimary.gain.value = 1;
    this.fadeGainSecondary.gain.value = 0;

    this.currentVolume = this.audio.volume;

    this.crossfadeDuration = storage.playback.getPlaybackOptions('crossfadeDuration') ?? 0;

    this.unsubscribeFunc = this.subscribeToStoreEvents();
    this.initializeEqualizer();
    this.setupQueueIntegration();
    this.setupAudioEventListeners();
  }

  private getActiveAudio(): HTMLAudioElement {
    return this.activeElement === 'primary' ? this.audio : this.secondaryAudio;
  }

  private getInactiveAudio(): HTMLAudioElement {
    return this.activeElement === 'primary' ? this.secondaryAudio : this.audio;
  }

  private getActiveFadeGain(): GainNode {
    return this.activeElement === 'primary' ? this.fadeGainPrimary : this.fadeGainSecondary;
  }

  private getInactiveFadeGain(): GainNode {
    return this.activeElement === 'primary' ? this.fadeGainSecondary : this.fadeGainPrimary;
  }

  private setupQueueIntegration() {
    this.queue.on('positionChange', () => {
      const songId = this.queue.currentSongId;
      const willAutoPlay = this.pendingAutoPlay;
      console.log('[AudioPlayer.positionChange]', {
        position: this.queue.position,
        songId,
        willLoad: !!songId,
        pendingAutoPlay: this.pendingAutoPlay,
        isCrossfading: this.isCrossfading,
        preloadedSongId: this.preloadedSongId
      });
      if (songId) {
        const wasAutoPlay = this.pendingAutoPlay;

        if (this.isCrossfading && this.preloadedSongId === songId) {
          this.pendingAutoPlay = false;
          return;
        }

        if (this.isCrossfading) {
          this.abortCrossfade();
        }

        this.loadSong(songId, { autoPlay: wasAutoPlay }).catch((err) => {
          console.error('[AudioPlayer.positionChange] Failed to load song:', err);
        });
        this.pendingAutoPlay = false;
      }
    });

    this.queue.on('queueChange', (data) => {
      this.emit('queueChange', data);
    });

    this.queue.on('metadataChange', (data) => {
      this.emit('queueMetadataChange', data);
    });
  }

  private onElementEnded = (el: HTMLAudioElement) => {
    if (el !== this.getActiveAudio()) return;
    this.handleSongEnd();
  };

  private onElementTimeUpdate = (el: HTMLAudioElement) => {
    if (el === this.getActiveAudio()) {
      this.emit('timeUpdate', el.currentTime);
    }
    if (this.isCrossfading) {
      this.checkCrossfadeCompletion();
    } else if (this.crossfadeDuration > 0 && el === this.getActiveAudio()) {
      this.checkCrossfadeTrigger(el);
    }
  };

  private checkCrossfadeTrigger(el: HTMLAudioElement) {
    if (this.isCrossfading || !el.duration || !el.duration || !this.preloadedSongId) return;
    const remaining = el.duration - el.currentTime;
    const crossfadeSeconds = this.crossfadeDuration / 1000;
    if (remaining <= crossfadeSeconds && remaining > 0) {
      this.startCrossfade();
    }
  }

  private setupAudioEventListeners() {
    const setupFor = (el: HTMLAudioElement) => {
      el.addEventListener('ended', () => this.onElementEnded(el));
      el.addEventListener('timeupdate', () => this.onElementTimeUpdate(el));
      el.addEventListener('loadedmetadata', () => {
        if (el === this.getActiveAudio()) {
          this.emit('durationChange', el.duration);
        }
      });
      el.addEventListener('play', () => {
        if (el === this.getActiveAudio()) {
          this.emit('play');
        }
      });
      el.addEventListener('pause', () => {
        if (el === this.getActiveAudio()) {
          this.emit('pause');
        }
      });
      el.addEventListener('error', (e) => {
        this.emit('error', e);
      });
      el.addEventListener('seeking', () => {
        this.emit('seeking');
      });
      el.addEventListener('seeked', () => {
        if (el === this.getActiveAudio()) {
          this.emit('seeked', el.currentTime);
        }
      });
    };

    setupFor(this.audio);
    setupFor(this.secondaryAudio);
  }

  private async handleSongEnd() {
    if (this.isCrossfading) return;

    console.log('[AudioPlayer.handleSongEnd]', { repeatMode: this.repeatMode });

    if (this.repeatMode === 'one') {
      const active = this.getActiveAudio();
      active.currentTime = 0;
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
      this.emit('playbackComplete');
    }
  }

  private async preloadNextSong() {
    const nextId = this.queue.nextSongId;
    if (nextId === null || nextId === undefined) {
      this.preloadedSongId = null;
      this.preloadedSongData = null;
      return;
    }

    if (this.repeatMode === 'one') {
      this.preloadedSongId = null;
      this.preloadedSongData = null;
      return;
    }

    if (nextId === this.preloadedSongId) return;

    try {
      console.log('[AudioPlayer.preloadNextSong]', { nextId });
      const songData = await window.api.audioLibraryControls.getSong(nextId);
      const inactiveAudio = this.getInactiveAudio();
      const audioSourceUrl = new URL(songData.path);
      audioSourceUrl.searchParams.set('ts', `${Date.now()}`);
      inactiveAudio.src = audioSourceUrl.toString();
      inactiveAudio.load();

      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          inactiveAudio.removeEventListener('canplay', onCanPlay);
          resolve();
        };
        const onError = () => {
          inactiveAudio.removeEventListener('error', onError);
          reject(new Error(`Failed to preload song ${nextId}`));
        };
        inactiveAudio.addEventListener('canplay', onCanPlay);
        inactiveAudio.addEventListener('error', onError);
        if (inactiveAudio.readyState >= 3) {
          inactiveAudio.removeEventListener('canplay', onCanPlay);
          resolve();
        }
      });

      this.preloadedSongId = nextId;
      this.preloadedSongData = songData;
      console.log('[AudioPlayer.preloadNextSong.done]', { nextId });
    } catch (error) {
      console.warn('[AudioPlayer.preloadNextSong] Failed:', error);
      this.preloadedSongId = null;
      this.preloadedSongData = null;
    }
  }

  private startCrossfade() {
    if (!this.preloadedSongData || !this.preloadedSongId) return;

    const inactiveAudio = this.getInactiveAudio();
    const activeGain = this.getActiveFadeGain();
    const inactiveGain = this.getInactiveFadeGain();

    const fadeSec = Math.min(
      this.crossfadeDuration / 1000,
      (this.getActiveAudio().duration || Infinity) * 0.5
    );

    if (fadeSec <= 0) return;

    this.isCrossfading = true;

    dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: this.preloadedSongData });
    storage.playback.setCurrentSongOptions('songId', this.preloadedSongId);

    const now = this.currentContext.currentTime;

    activeGain.gain.cancelScheduledValues(now);
    inactiveGain.gain.cancelScheduledValues(now);

    activeGain.gain.setValueAtTime(activeGain.gain.value, now);
    activeGain.gain.exponentialRampToValueAtTime(0.001, now + fadeSec);

    inactiveGain.gain.setValueAtTime(0.001, now);
    inactiveGain.gain.exponentialRampToValueAtTime(1, now + fadeSec);

    inactiveAudio.play();

    this.crossfadeTimer = setTimeout(() => {
      this.completeCrossfade();
    }, fadeSec * 1000);
  }

  private completeCrossfade() {
    if (!this.isCrossfading) return;
    const wasPrimary = this.activeElement === 'primary';
    const oldActive = wasPrimary ? this.audio : this.secondaryAudio;

    this.activeElement = wasPrimary ? 'secondary' : 'primary';
    this.isCrossfading = false;

    this.fadeGainPrimary.gain.value = this.activeElement === 'primary' ? 1 : 0.001;
    this.fadeGainSecondary.gain.value = this.activeElement === 'primary' ? 0.001 : 1;

    oldActive.pause();

    if (this.preloadedSongId && this.queue.currentSongId !== this.preloadedSongId) {
      const idx = this.queue.songIds.indexOf(this.preloadedSongId);
      if (idx >= 0) {
        this.queue.position = idx;
      }
    }

    this.preloadedSongId = null;
    this.preloadedSongData = null;

    this.emit('songLoaded', store.state.currentSongData);

    if (this.queue.hasNext) {
      this.preloadNextSong().catch(() => {});
    }

    if (this.currentContext.state === 'suspended') {
      this.currentContext.resume();
    }
  }

  private abortCrossfade() {
    if (!this.isCrossfading) return;

    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }

    this.isCrossfading = false;

    const now = this.currentContext.currentTime;
    this.fadeGainPrimary.gain.cancelScheduledValues(now);
    this.fadeGainSecondary.gain.cancelScheduledValues(now);
    this.fadeGainPrimary.gain.value = this.activeElement === 'primary' ? 1 : 0.001;
    this.fadeGainSecondary.gain.value = this.activeElement === 'primary' ? 0.001 : 1;

    const inactive = this.getInactiveAudio();
    inactive.pause();
  }

  private checkCrossfadeCompletion() {
    if (!this.isCrossfading) return;

    const oldElement = this.activeElement === 'primary' ? this.audio : this.secondaryAudio;

    if (oldElement.ended || (oldElement.duration > 0 && oldElement.currentTime >= oldElement.duration)) {
      if (this.crossfadeTimer) {
        clearTimeout(this.crossfadeTimer);
        this.crossfadeTimer = null;
      }
      this.completeCrossfade();
    }
  }

  private async loadSong(
    songIdOrData: number | AudioPlayerData,
    options?: { autoPlay?: boolean; updateStore?: boolean }
  ): Promise<AudioPlayerData> {
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

      if (options?.updateStore !== false) {
        dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });
        storage.playback.setCurrentSongOptions('songId', songData.songId);
      }

      const targetAudio = this.getActiveAudio();
      const audioSourceUrl = new URL(songData.path);
      audioSourceUrl.searchParams.set('ts', `${Date.now()}`);
      targetAudio.src = audioSourceUrl.toString();
      targetAudio.load();

      if (options?.autoPlay) {
        if (targetAudio.readyState >= 3) {
          this.play().catch((err) =>
            console.error('[AudioPlayer] Immediate auto-play failed:', err)
          );
        } else {
          const autoPlayHandler = () => {
            this.play().catch((err) =>
              console.error('[AudioPlayer] Auto-play on canplay failed:', err)
            );
            targetAudio.removeEventListener('canplay', autoPlayHandler);
          };
          targetAudio.addEventListener('canplay', autoPlayHandler);
        }
      }

      const trackChangeEvent = new CustomEvent('player/trackchange', {
        detail: songData.songId
      });
      targetAudio.dispatchEvent(trackChangeEvent);

      this.emit('songLoaded', songData);
      console.log('[AudioPlayer.loadSong.done]', {
        songId: songData.songId,
        title: songData.title
      });

      this.preloadNextSong().catch((err) =>
        console.warn('[AudioPlayer.loadSong] Preload failed:', err)
      );

      return songData;
    } catch (error) {
      const failedSongId = typeof songIdOrData === 'number' ? songIdOrData : songIdOrData.songId;
      console.error(
        `Failed to load song (ID: ${failedSongId}):`,
        error instanceof Error ? error.message : error
      );
      this.emit('loadError', { songId: failedSongId ?? 0, error });
      throw error;
    }
  }

  destroy() {
    if (this.unsubscribeFunc) this.unsubscribeFunc.unsubscribe();
    this.queue.removeAllListeners();
    this.removeAllListeners();

    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }

    this.audio.pause();
    this.audio.src = '';
    this.secondaryAudio.pause();
    this.secondaryAudio.src = '';
    this.currentContext.close();
  }

  on<T = unknown>(eventType: PlayerEventType, callback: PlayerEventCallback<T>): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback as PlayerEventCallback<unknown>);
  }

  off<T = unknown>(eventType: PlayerEventType, callback: PlayerEventCallback<T>): void {
    this.listeners.get(eventType)?.delete(callback as PlayerEventCallback<unknown>);
  }

  protected emit<T = unknown>(eventType: PlayerEventType, data?: T): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(data);
      });
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  private fadeOutAudio(): Promise<void> {
    return new Promise((resolve) => {
      const fadeGain = this.getActiveFadeGain();
      const currentTime = this.currentContext.currentTime;
      const targetVolume = 0.001;
      const fadeDuration = AUDIO_FADE_DURATION / 1000;

      fadeGain.gain.setValueAtTime(fadeGain.gain.value, currentTime);
      fadeGain.gain.exponentialRampToValueAtTime(targetVolume, currentTime + fadeDuration);

      setTimeout(() => {
        this.getActiveAudio().pause();
        resolve(undefined);
      }, AUDIO_FADE_DURATION);
    });
  }

  private fadeInAudio(): Promise<void> {
    return new Promise((resolve) => {
      const fadeGain = this.getActiveFadeGain();
      const currentTime = this.currentContext.currentTime;
      const targetVolume = 1;
      const fadeDuration = AUDIO_FADE_DURATION / 1000;

      fadeGain.gain.setValueAtTime(fadeGain.gain.value, currentTime);
      fadeGain.gain.exponentialRampToValueAtTime(targetVolume, currentTime + fadeDuration);

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

    const primarySource = this.currentContext.createMediaElementSource(this.audio);
    primarySource.connect(this.fadeGainPrimary);
    this.fadeGainPrimary.connect(this.crossfadeMixBus);

    this.secondarySource = this.currentContext.createMediaElementSource(this.secondaryAudio);
    this.secondarySource.connect(this.fadeGainSecondary);
    this.fadeGainSecondary.connect(this.crossfadeMixBus);

    const filterMapKeys = [...this.equalizerBands.keys()];

    this.equalizerBands.forEach((filter, key, map) => {
      const currentFilterIndex = filterMapKeys.indexOf(key);
      const isTheFirstFilter = currentFilterIndex === 0;
      const isTheLastFilter = currentFilterIndex === filterMapKeys.length - 1;

      if (isTheFirstFilter) this.crossfadeMixBus.connect(filter);
      else {
        const prevFilter = map.get(filterMapKeys[currentFilterIndex - 1]);
        if (prevFilter) prevFilter.connect(filter);

        if (isTheLastFilter) filter.connect(this.gainNode);
      }
    });

    this.gainNode.connect(this.currentContext.destination);
  }

  private updatePlayerVolume(volume: PlayerVolume) {
    this.volume = volume.value / 100;
    this.audio.muted = volume.isMuted;
    this.secondaryAudio.muted = volume.isMuted;
  }

  private updatePlaybackRate(playbackRate: number) {
    if (this.audio.playbackRate !== playbackRate) {
      this.audio.playbackRate = playbackRate;
    }
    if (this.secondaryAudio.playbackRate !== playbackRate) {
      this.secondaryAudio.playbackRate = playbackRate;
    }
  }

  private subscribeToStoreEvents() {
    const unsubscribeFunction = store.subscribe(() => {
      if (store) {
        const { player, localStorage: ls } = store.state;

        this.updatePlayerVolume(player.volume);
        this.updatePlaybackRate(player.playbackRate);
        this.syncRepeatModeFromStore(player.isRepeating);

        const storedCrossfade = ls?.playback?.crossfadeDuration;
        if (storedCrossfade !== undefined && storedCrossfade !== this.crossfadeDuration) {
          this.crossfadeDuration = storedCrossfade;
          if (this.isCrossfading) {
            this.abortCrossfade();
          }
        }
      }
    });

    return unsubscribeFunction;
  }

  private syncRepeatModeFromStore(isRepeating: RepeatTypes) {
    const newMode = isRepeating === 'repeat-1' ? 'one' : isRepeating === 'repeat' ? 'all' : 'off';
    if (this.repeatMode !== newMode) {
      this.repeatMode = newMode;
    }
  }

  play() {
    const active = this.getActiveAudio();
    active.play();
    return this.fadeInAudio();
  }

  pause() {
    return this.fadeOutAudio();
  }

  async togglePlayback(forcePlay?: boolean): Promise<void> {
    const shouldPlay = forcePlay !== undefined ? forcePlay : this.getActiveAudio().paused;

    if (shouldPlay) {
      if (this.getActiveAudio().readyState > 0) {
        await this.play();
      }
    } else {
      await this.pause();
    }
  }

  seek(time: number) {
    this.getActiveAudio().currentTime = time;
  }

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

      const songData = await window.api.audioLibraryControls.getSong(songId);

      await this.loadSong(songData, { autoPlay, updateStore: true });

      if (recordListening) {
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

  async skipForward(reason: SongSkipReason = 'USER_SKIP'): Promise<void> {
    console.log('[AudioPlayer.skipForward]', {
      reason,
      position: this.queue.position,
      hasNext: this.queue.hasNext,
      repeatMode: this.repeatMode
    });

    if (this.repeatMode === 'one' && reason !== 'USER_SKIP') {
      const active = this.getActiveAudio();
      active.currentTime = 0;
      await this.play();

      if (store.state.currentSongData?.songId) {
        this.emit('repeatSong', {
          songId: store.state.currentSongData.songId,
          duration: store.state.currentSongData.duration
        });
      }
      return;
    }

    if (this.crossfadeDuration > 0 && this.queue.hasNext && this.preloadedSongId === this.queue.nextSongId) {
      this.startCrossfade();
      this.queue.moveToNext();
      return;
    }

    if (this.isCrossfading) {
      this.abortCrossfade();
    }

    if (this.queue.hasNext) {
      this.pendingAutoPlay = true;
      this.queue.moveToNext();
    } else if (this.repeatMode === 'all' && this.queue.length > 0) {
      this.pendingAutoPlay = true;
      this.queue.moveToStart();
    } else if (this.queue.isEmpty) {
      console.log('[AudioPlayer.skipForward] Queue is empty.');
    }
  }

  skipBackward(): void {
    console.log('[AudioPlayer.skipBackward]', {
      currentTime: this.getActiveAudio().currentTime,
      position: this.queue.position,
      hasPrevious: this.queue.hasPrevious
    });

    if (this.isCrossfading) {
      this.abortCrossfade();
    }

    if (this.getActiveAudio().currentTime > 5) {
      this.getActiveAudio().currentTime = 0;
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

  playNext() {
    if (this.queue.hasNext) {
      this.queue.moveToNext();
    }
  }

  playPrevious() {
    if (this.queue.hasPrevious) {
      this.queue.moveToPrevious();
    }
  }

  playSongAtPosition(position: number) {
    if (this.isCrossfading) {
      this.abortCrossfade();
    }
    this.pendingAutoPlay = true;
    const moved = this.queue.moveToPosition(position);
    if (!moved) {
      console.error('[AudioPlayer.playSongAtPosition] Failed to move to position:', position);
    }
  }

  setRepeatMode(mode: 'off' | 'one' | 'all') {
    this.repeatMode = mode;
    this.emit('repeatModeChange', mode);
  }

  getRepeatMode(): 'off' | 'one' | 'all' {
    return this.repeatMode;
  }

  get currentSongId(): number | null {
    return this.queue.currentSongId;
  }

  get currentTime(): number {
    return this.getActiveAudio().currentTime;
  }

  set currentTime(time: number) {
    this.getActiveAudio().currentTime = time;
  }

  get duration(): number {
    return this.getActiveAudio().duration;
  }

  get paused(): boolean {
    return this.getActiveAudio().paused;
  }

  get volume(): number {
    return this.currentVolume / 100;
  }

  set volume(volume: number) {
    this.currentVolume = volume * 100;
    this.audio.volume = volume;
    this.secondaryAudio.volume = volume;
    this.gainNode.gain.value = volume;
  }

  get muted(): boolean {
    return this.getActiveAudio().muted;
  }

  set muted(value: boolean) {
    this.audio.muted = value;
    this.secondaryAudio.muted = value;
    this.gainNode.gain.value = value ? 0 : this.volume;
  }

  get playbackRate(): number {
    return this.getActiveAudio().playbackRate;
  }

  set playbackRate(value: number) {
    this.audio.playbackRate = value;
    this.secondaryAudio.playbackRate = value;
  }
}

export default AudioPlayer;
