import type { Subscription } from '@tanstack/react-store';

import { dispatch, store } from '../store/store';
import storage from '../utils/localStorage';
import log from '../utils/log';
import { normalizeCrossfadeDuration } from '../utils/normalizeCrossfadeDuration';
import { equalizerBandHertzData } from './equalizerData';
import PlayerQueue from './playerQueue';

const AUDIO_FADE_DURATION = 250;
const GAIN_FLOOR = 0.001;

type PlayerEventType =
  | 'timeUpdate'
  | 'durationChange'
  | 'play'
  | 'pause'
  | 'error'
  | 'seeking'
  | 'seeked'
  | 'canplay'
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
  private pendingAutoPlayHandler: (() => void) | null = null;
  private pendingAutoPlayElement: HTMLAudioElement | null = null;

  private activeElement: 'primary' | 'secondary' = 'primary';
  private isCrossfading: boolean = false;
  private crossfadeDuration: number = 0;
  private crossfadeTimer: ReturnType<typeof setTimeout> | null = null;
  private fadeOutTimer: ReturnType<typeof setTimeout> | null = null;

  private preloadedSongId: number | null = null;
  private preloadedSongData: AudioPlayerData | null = null;

  private preloadGeneration: number = 0;
  private suppressNextPositionLoad: boolean = false;
  private boundListeners: Map<HTMLAudioElement, Record<string, EventListener>> = new Map();
  private queueHandlers: Record<string, (...args: unknown[]) => void> = {};

  private secondarySource!: MediaElementAudioSourceNode;

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

    this.crossfadeDuration = normalizeCrossfadeDuration(
      storage.playback.getPlaybackOptions('crossfadeDuration') ?? 0
    );

    this.unsubscribeFunc = this.subscribeToStoreEvents();
    this.initializeEqualizer();
    this.setupQueueIntegration();
    this.setupAudioEventListeners();
  }

  getActiveAudio(): HTMLAudioElement {
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
    this.queueHandlers.positionChange = () => {
      const songId = this.queue.currentSongId;
      const willAutoPlay = this.pendingAutoPlay;
      log('[AudioPlayer.positionChange]', {
        position: this.queue.position,
        songId,
        willLoad: !!songId,
        pendingAutoPlay: this.pendingAutoPlay,
        isCrossfading: this.isCrossfading,
        preloadedSongId: this.preloadedSongId
      });
      if (songId) {
        const wasAutoPlay = this.pendingAutoPlay;

        if (this.suppressNextPositionLoad) {
          this.suppressNextPositionLoad = false;
          this.pendingAutoPlay = false;
          return;
        }

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
    };

    this.queueHandlers.queueChange = (data: unknown) => {
      this.emit('queueChange', data);

      // A queue edit (insert / reorder / remove) can change the effective next
      // song. If the preloaded song is stale, preload the new next so crossfade
      // / gapless remain seamless. Skip the position commit that already routed
      // through the transition path.
      if (this.suppressNextPositionLoad) return;
      const nextId = this.getEffectiveNextSongId();
      if (nextId === null || nextId === this.preloadedSongId) return;

      // Do not load a new source into the incoming element while it is part of
      // an active crossfade: that would replace the fade target mid-transition.
      // Abort the crossfade first, then preload the new next song.
      if (this.isCrossfading) {
        this.abortCrossfade();
      }

      this.preloadNextSong().catch((err) => {
        console.error('[AudioPlayer.queueChange] Failed to refresh preload:', err);
      });
    };

    this.queueHandlers.metadataChange = (data: unknown) => {
      this.emit('queueMetadataChange', data);
    };

    this.queue.on('positionChange', this.queueHandlers.positionChange);
    this.queue.on('queueChange', this.queueHandlers.queueChange);
    this.queue.on('metadataChange', this.queueHandlers.metadataChange);
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
    if (
      this.isCrossfading ||
      !el.duration ||
      !isFinite(el.duration) ||
      this.preloadedSongId === null
    )
      return;
    const remaining = el.duration - el.currentTime;
    const fadeSec = Math.min(this.crossfadeDuration / 1000, el.duration * 0.5);
    if (remaining <= fadeSec && remaining > 0) {
      this.startCrossfade();
    }
  }

  private setupAudioEventListeners() {
    const setupFor = (el: HTMLAudioElement) => {
      const handlers: Record<string, EventListener> = {
        ended: () => this.onElementEnded(el),
        timeupdate: () => this.onElementTimeUpdate(el),
        loadedmetadata: () => {
          if (el === this.getActiveAudio()) {
            this.emit('durationChange', el.duration);
          }
        },
        play: () => {
          if (el === this.getActiveAudio()) {
            this.emit('play');
          }
        },
        pause: () => {
          if (el === this.getActiveAudio()) {
            this.emit('pause');
          }
        },
        error: (e) => {
          if (el === this.getActiveAudio()) {
            this.emit('error', e);
          } else {
            this.preloadedSongId = null;
            this.preloadedSongData = null;
          }
        },
        seeking: () => {
          if (el === this.getActiveAudio()) {
            this.emit('seeking');
          }
        },
        seeked: () => {
          if (el === this.getActiveAudio()) {
            this.emit('seeked', el.currentTime);
          }
        },
        canplay: () => {
          if (el === this.getActiveAudio()) {
            this.emit('canplay');
          }
        }
      };
      this.boundListeners.set(el, handlers);
      Object.entries(handlers).forEach(([event, fn]) => el.addEventListener(event, fn));
    };

    setupFor(this.audio);
    setupFor(this.secondaryAudio);
  }

  private getEffectiveNextSongId(): number | null {
    if (this.queue.nextSongId !== null) return this.queue.nextSongId;
    if (this.repeatMode === 'all' && this.queue.length > 0) return this.queue.songIds[0] ?? null;
    return null;
  }

  private async handleSongEnd() {
    if (this.isCrossfading) return;

    if (this.repeatMode === 'one') {
      const active = this.getActiveAudio();
      active.currentTime = 0;
      await this.play();
      this.emit('repeatOne');
      return;
    }

    const effectiveNext = this.getEffectiveNextSongId();

    if (effectiveNext !== null) {
      if (this.crossfadeDuration === 0 && this.preloadedSongId === effectiveNext) {
        this.gaplessSwapToNext();
        return;
      }
      this.pendingAutoPlay = true;
      if (this.queue.hasNext) {
        this.queue.moveToNext();
      } else {
        this.queue.moveToPosition(0);
        this.emit('repeatAll');
      }
    } else {
      this.emit('playbackComplete');
    }
  }

  private async preloadNextSong() {
    const nextId = this.getEffectiveNextSongId();
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

    const gen = ++this.preloadGeneration;

    try {
      const songData = await window.api.audioLibraryControls.getSong(nextId);
      if (gen !== this.preloadGeneration) return;

      const inactiveAudio = this.getInactiveAudio();
      const audioSourceUrl = new URL(songData.path);
      audioSourceUrl.searchParams.set('ts', `${Date.now()}`);
      inactiveAudio.src = audioSourceUrl.toString();
      inactiveAudio.load();

      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          inactiveAudio.removeEventListener('canplay', onCanPlay);
          inactiveAudio.removeEventListener('error', onError);
        };
        const onCanPlay = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error(`Failed to preload song ${nextId}`));
        };
        inactiveAudio.addEventListener('canplay', onCanPlay);
        inactiveAudio.addEventListener('error', onError);
        if (inactiveAudio.readyState >= 3) {
          cleanup();
          resolve();
        }
      });

      if (gen !== this.preloadGeneration) return;

      this.preloadedSongId = nextId;
      this.preloadedSongData = songData;
    } catch (error) {
      console.error(`[AudioPlayer.preloadNextSong] Failed to preload song ${nextId}:`, error);
      if (gen === this.preloadGeneration) {
        this.preloadedSongId = null;
        this.preloadedSongData = null;
      }
    }
  }

  private startCrossfade() {
    if (this.isCrossfading || !this.preloadedSongData || this.preloadedSongId === null) return;
    if (this.getEffectiveNextSongId() !== this.preloadedSongId) return;

    const inactiveAudio = this.getInactiveAudio();
    const activeGain = this.getActiveFadeGain();
    const inactiveGain = this.getInactiveFadeGain();

    const fadeSec = Math.min(
      this.crossfadeDuration / 1000,
      (this.getActiveAudio().duration || Infinity) * 0.5
    );

    if (fadeSec <= 0) return;

    this.isCrossfading = true;

    // Song identity switch deferred to completeCrossfade() — avoids state mismatch
    // during the crossfade overlap window (seek bar, currentTime, duration all still
    // belong to the old active element until the swap completes).
    dispatch({ type: 'CURRENT_SONG_PLAYBACK_STATE', data: true });

    // No durationChange here: the incoming element is not active yet, so a
    // consumer reading getActiveAudio() would pair the incoming duration with
    // the outgoing song's metadata. completeCrossfade() emits durationChange
    // once it has swapped the active element and updated song metadata.

    const now = this.currentContext.currentTime;

    activeGain.gain.cancelScheduledValues(now);
    inactiveGain.gain.cancelScheduledValues(now);

    activeGain.gain.setValueAtTime(activeGain.gain.value, now);
    activeGain.gain.exponentialRampToValueAtTime(GAIN_FLOOR, now + fadeSec);

    inactiveGain.gain.setValueAtTime(GAIN_FLOOR, now);
    inactiveGain.gain.exponentialRampToValueAtTime(1, now + fadeSec);

    inactiveAudio.play().catch((err) => {
      console.error('[AudioPlayer.startCrossfade] play() rejected:', err);
      this.abortCrossfade();
    });

    this.crossfadeTimer = setTimeout(() => {
      this.completeCrossfade();
    }, fadeSec * 1000);
  }

  private completeCrossfade() {
    if (!this.isCrossfading) return;

    const nextSongId = this.preloadedSongId;
    const nextSongData = this.preloadedSongData;
    if (nextSongId === null || nextSongData === null) {
      this.abortCrossfade();
      return;
    }

    const idx = this.queue.songIds.indexOf(nextSongId);
    if (idx < 0) {
      this.abortCrossfade();
      return;
    }
    if (this.queue.currentSongId !== nextSongId && this.getEffectiveNextSongId() !== nextSongId) {
      this.abortCrossfade();
      return;
    }

    const wasPrimary = this.activeElement === 'primary';
    const oldActive = wasPrimary ? this.audio : this.secondaryAudio;

    this.activeElement = wasPrimary ? 'secondary' : 'primary';
    this.isCrossfading = false;

    this.fadeGainPrimary.gain.value = this.activeElement === 'primary' ? 1 : 0;
    this.fadeGainSecondary.gain.value = this.activeElement === 'primary' ? 0 : 1;

    // Update current-song metadata BEFORE emitting durationChange so consumers
    // (media session, position sync) never read incoming duration against
    // outgoing song metadata.
    oldActive.pause();
    dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: nextSongData });
    dispatch({ type: 'CURRENT_SONG_PLAYBACK_STATE', data: true });
    storage.playback.setCurrentSongOptions('songId', nextSongId);

    // Re-emit durationChange after element swap — covers edge cases where duration
    // metadata differs between preload and completion time (e.g. VBR streams).
    this.emit('durationChange', this.getActiveAudio().duration);
    this.emit('play');

    this.suppressNextPositionLoad = true;
    this.queue.moveToPosition(idx);

    this.preloadedSongId = null;
    this.preloadedSongData = null;

    this.emit('songLoaded', nextSongData);

    if (this.getEffectiveNextSongId() !== null) {
      this.preloadNextSong().catch(() => {});
    }

    if (this.currentContext.state === 'suspended') {
      void this.currentContext.resume().catch((err) => {
        console.error('[AudioPlayer] Failed to resume AudioContext:', err);
      });
    }
  }

  private gaplessSwapToNext() {
    if (this.preloadedSongId === null || this.preloadedSongData === null) return;
    if (this.getEffectiveNextSongId() !== this.preloadedSongId) return;

    const nextSongId = this.preloadedSongId;
    const nextSongData = this.preloadedSongData;
    const idx = this.queue.songIds.indexOf(nextSongId);
    if (idx < 0) {
      this.preloadedSongId = null;
      this.preloadedSongData = null;
      return;
    }

    const wasPrimary = this.activeElement === 'primary';
    const oldActive = wasPrimary ? this.audio : this.secondaryAudio;

    this.activeElement = wasPrimary ? 'secondary' : 'primary';
    const newActive = this.getActiveAudio();

    this.fadeGainPrimary.gain.value = this.activeElement === 'primary' ? 1 : 0;
    this.fadeGainSecondary.gain.value = this.activeElement === 'primary' ? 0 : 1;

    oldActive.pause();

    this.preloadedSongId = null;
    this.preloadedSongData = null;

    dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: nextSongData });
    storage.playback.setCurrentSongOptions('songId', nextSongId);
    this.suppressNextPositionLoad = true;
    this.queue.moveToPosition(idx);

    newActive.currentTime = 0;
    newActive.play().catch((err) => {
      console.error('[AudioPlayer.gaplessSwapToNext] play() rejected:', err);
      dispatch({ type: 'CURRENT_SONG_PLAYBACK_STATE', data: false });
      this.emit('pause');
      this.emit('error', err);
    });

    this.emit('songLoaded', nextSongData);

    if (this.getEffectiveNextSongId() !== null) {
      this.preloadNextSong().catch(() => {});
    }

    if (this.currentContext.state === 'suspended') {
      void this.currentContext.resume().catch((err) => {
        console.error('[AudioPlayer] Failed to resume AudioContext:', err);
      });
    }
  }

  private abortCrossfade() {
    if (!this.isCrossfading) return;

    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }

    this.preloadGeneration++;

    this.isCrossfading = false;

    const now = this.currentContext.currentTime;
    this.fadeGainPrimary.gain.cancelScheduledValues(now);
    this.fadeGainSecondary.gain.cancelScheduledValues(now);
    this.fadeGainPrimary.gain.value = this.activeElement === 'primary' ? 1 : 0;
    this.fadeGainSecondary.gain.value = this.activeElement === 'primary' ? 0 : 1;

    const inactive = this.getInactiveAudio();
    inactive.pause();
    inactive.currentTime = 0;

    this.preloadedSongId = null;
    this.preloadedSongData = null;
  }

  private checkCrossfadeCompletion() {
    if (!this.isCrossfading) return;

    const oldElement = this.activeElement === 'primary' ? this.audio : this.secondaryAudio;

    if (
      oldElement.ended ||
      (oldElement.duration > 0 && oldElement.currentTime >= oldElement.duration)
    ) {
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
    // A new load supersedes any pending fade-out: do not let its timer pause
    // the newly selected track.
    if (this.fadeOutTimer) {
      clearTimeout(this.fadeOutTimer);
      this.fadeOutTimer = null;
    }

    let songData: AudioPlayerData;

    try {
      if (typeof songIdOrData === 'number') {
        // Fetch song data if ID provided (may throw if file not found)
        songData = await window.api.audioLibraryControls.getSong(songIdOrData);
      } else {
        // Use provided song data
        songData = songIdOrData;
      }

      log('[AudioPlayer.loadSong]', {
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
          // A new auto-play supersedes any pending one: remove the old handler
          // from the element that owns it (which may be a stale element).
          if (this.pendingAutoPlayHandler && this.pendingAutoPlayElement) {
            this.pendingAutoPlayElement.removeEventListener('canplay', this.pendingAutoPlayHandler);
          }
          const autoPlayHandler = () => {
            this.pendingAutoPlayHandler = null;
            this.pendingAutoPlayElement = null;
            this.play().catch((err) =>
              console.error('[AudioPlayer] Auto-play on canplay failed:', err)
            );
            targetAudio.removeEventListener('canplay', autoPlayHandler);
          };
          this.pendingAutoPlayHandler = autoPlayHandler;
          this.pendingAutoPlayElement = targetAudio;
          targetAudio.addEventListener('canplay', autoPlayHandler);
        }
      }

      const trackChangeEvent = new CustomEvent('player/trackchange', {
        detail: songData.songId
      });
      targetAudio.dispatchEvent(trackChangeEvent);

      this.emit('songLoaded', songData);
      log('[AudioPlayer.loadSong.done]', {
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
    for (const [event, handler] of Object.entries(this.queueHandlers)) {
      this.queue.off(event, handler);
    }
    this.removeAllListeners();

    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
    if (this.fadeOutTimer) {
      clearTimeout(this.fadeOutTimer);
      this.fadeOutTimer = null;
    }
    // Remove a pending auto-play canplay handler so teardown cannot resume a
    // closed AudioContext.
    if (this.pendingAutoPlayHandler && this.pendingAutoPlayElement) {
      this.pendingAutoPlayElement.removeEventListener('canplay', this.pendingAutoPlayHandler);
      this.pendingAutoPlayHandler = null;
      this.pendingAutoPlayElement = null;
    }

    for (const [el, handlers] of this.boundListeners) {
      Object.entries(handlers).forEach(([event, fn]) => el.removeEventListener(event, fn));
    }
    this.boundListeners.clear();

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
      // Capture the fading element: the timer callback must pause THIS element,
      // not whichever element is active when it fires (a resume or new track
      // could have replaced it within the fade window).
      const fadingAudio = this.getActiveAudio();
      const fadeGain = this.getActiveFadeGain();
      const currentTime = this.currentContext.currentTime;
      const targetVolume = GAIN_FLOOR;
      const fadeDuration = AUDIO_FADE_DURATION / 1000;

      fadeGain.gain.setValueAtTime(fadeGain.gain.value, currentTime);
      fadeGain.gain.exponentialRampToValueAtTime(targetVolume, currentTime + fadeDuration);

      if (this.fadeOutTimer) clearTimeout(this.fadeOutTimer);
      this.fadeOutTimer = setTimeout(() => {
        this.fadeOutTimer = null;
        if (this.getActiveAudio() === fadingAudio) {
          fadingAudio.pause();
        }
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
        const persistedCrossfade = normalizeCrossfadeDuration(storedCrossfade);
        if (persistedCrossfade !== this.crossfadeDuration) {
          this.crossfadeDuration = persistedCrossfade;
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

  async play() {
    // Resuming supersedes any pending fade-out: its timer must not pause this
    // play later.
    if (this.fadeOutTimer) {
      clearTimeout(this.fadeOutTimer);
      this.fadeOutTimer = null;
    }
    await this.currentContext.resume().catch((err) => {
      console.error('[AudioPlayer.play] Failed to resume AudioContext:', err);
    });
    const active = this.getActiveAudio();
    return active
      .play()
      .then(() => this.fadeInAudio())
      .catch((err) => {
        console.error('[AudioPlayer.play] play() rejected:', err);
        this.emit('error', err);
      });
  }

  pause() {
    if (this.isCrossfading) {
      this.abortCrossfade();
    }
    return this.fadeOutAudio();
  }

  async togglePlayback(forcePlay?: boolean): Promise<void> {
    const shouldPlay = forcePlay !== undefined ? forcePlay : this.getActiveAudio().paused;

    if (shouldPlay) {
      await this.play();
    } else {
      await this.pause();
    }
  }

  seek(time: number) {
    this.getActiveAudio().currentTime = time;
  }

  /**
   * Loads a song from an external (non-library) source onto the ACTIVE element. Unknown-source
   * playback must not write to AudioPlayer.audio, which is always the primary element and can be
   * the inactive one after a crossfade/gapless swap.
   */
  async loadExternalSong(audioPlayerData: AudioPlayerData, autoPlay = true): Promise<void> {
    if (this.isCrossfading) this.abortCrossfade();

    // External-source playback does not belong to the library queue. Clear any
    // stale preload so the external file cannot crossfade or gaplessly swap
    // into a previously queued song after the active element is replaced.
    this.preloadGeneration += 1;
    this.preloadedSongId = null;
    this.preloadedSongData = null;
    const inactive = this.getInactiveAudio();
    inactive.pause();
    inactive.currentTime = 0;
    inactive.removeAttribute('src');
    inactive.load();

    const target = this.getActiveAudio();
    target.src = `${audioPlayerData.path}?ts=${Date.now()}`;
    this.pendingAutoPlay = autoPlay;

    target.load();

    if (autoPlay) {
      await this.play();
    }
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
      log('[AudioPlayer.playSongById]', { songId, autoPlay });

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
    log('[AudioPlayer.skipForward]', {
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

    const effectiveNext = this.getEffectiveNextSongId();

    if (
      this.crossfadeDuration === 0 &&
      effectiveNext !== null &&
      this.preloadedSongId === effectiveNext
    ) {
      this.gaplessSwapToNext();
      return;
    }

    if (
      this.crossfadeDuration > 0 &&
      effectiveNext !== null &&
      this.preloadedSongId === effectiveNext
    ) {
      this.startCrossfade();
      if (this.queue.hasNext) {
        this.queue.moveToNext();
      } else {
        this.queue.moveToPosition(0);
      }
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
      log('[AudioPlayer.skipForward] Queue is empty.');
    }
  }

  skipBackward(): void {
    log('[AudioPlayer.skipBackward]', {
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
