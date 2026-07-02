import type AudioPlayer from './player';

type SleepTimerMode = 'time' | 'endOfSong' | 'endOfAlbum';
type SleepTimerEventType = 'tick' | 'complete' | 'start' | 'stop' | 'pause' | 'resume';
type SleepTimerEventCallback = (data?: unknown) => void;

class SleepTimer {
  private mode: SleepTimerMode | null = null;

  private endTimestamp: number | null = null;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  private playerRef: AudioPlayer | null = null;

  private listeners: Map<SleepTimerEventType, Set<SleepTimerEventCallback>> = new Map();

  private songEndedHandler: (() => void) | null = null;

  private _isPaused = false;

  private pausedRemainingSeconds = 0;

  // ========== LIFECYCLE ==========

  setPlayer(player: AudioPlayer) {
    this.playerRef = player;
  }

  // ========== PUBLIC API ==========

  start(mode: 'time', minutes: number): void;
  start(mode: 'endOfSong' | 'endOfAlbum'): void;
  start(mode: SleepTimerMode, minutes?: number): void {
    if (this.isActive()) this.stop();

    this.mode = mode;
    this._isPaused = false;

    if (mode === 'time' && minutes !== undefined) {
      const durationMs = minutes * 60 * 1000;
      this.endTimestamp = Date.now() + durationMs;
      this.startTicking();
    } else if (mode === 'endOfSong' || mode === 'endOfAlbum') {
      this.endTimestamp = null;
      this.listenForSongEnd();
    }

    this.emit('start');
    this.emit('tick', this.getRemainingSeconds());
  }

  stop(): void {
    this.clearTimer();
    this.mode = null;
    this.endTimestamp = null;
    this._isPaused = false;
    this.pausedRemainingSeconds = 0;
    this.emit('stop');
    this.emit('tick', 0);
  }

  pause(): void {
    if (!this.isActive() || this._isPaused) return;
    this._isPaused = true;
    this.pausedRemainingSeconds = this.getRemainingSeconds();
    this.clearTimer();
    this.emit('pause');
  }

  resume(): void {
    if (!this.isActive() || !this._isPaused) return;
    this._isPaused = false;

    if (this.mode === 'time') {
      this.endTimestamp = Date.now() + this.pausedRemainingSeconds * 1000;
      this.startTicking();
    } else if (this.mode === 'endOfSong' || this.mode === 'endOfAlbum') {
      this.listenForSongEnd();
    }

    this.emit('resume');
    this.emit('tick', this.getRemainingSeconds());
  }

  extend(minutes: number): void {
    if (!this.isActive() || this.mode !== 'time') return;
    const currentRemaining = this.getRemainingSeconds() * 1000;
    this.endTimestamp = Date.now() + currentRemaining + minutes * 60 * 1000;
    if (!this._isPaused) this.startTicking();
    this.emit('tick', this.getRemainingSeconds());
  }

  // ========== GETTERS ==========

  getRemainingSeconds(): number {
    if (this._isPaused) return this.pausedRemainingSeconds;
    if (this.mode === 'time' && this.endTimestamp !== null) {
      return Math.max(0, Math.ceil((this.endTimestamp - Date.now()) / 1000));
    }
    return 0;
  }

  getMode(): SleepTimerMode | null {
    return this.mode;
  }

  isActive(): boolean {
    return this.mode !== null;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  // ========== EVENTS ==========

  on(event: SleepTimerEventType, callback: SleepTimerEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: SleepTimerEventType, callback: SleepTimerEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: SleepTimerEventType, data?: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  // ========== PRIVATE ==========

  private startTicking(): void {
    this.clearTimer();
    this.intervalId = setInterval(() => {
      if (this._isPaused || this.mode !== 'time') return;

      const remaining = this.getRemainingSeconds();
      this.emit('tick', remaining);

      if (remaining <= 0) {
        this.fireTimer();
      }
    }, 1000);
  }

  private listenForSongEnd(): void {
    if (!this.playerRef) return;
    this.removeSongEndListener();

    this.songEndedHandler = () => {
      if (this.mode === 'endOfSong' || this.mode === 'endOfAlbum') {
        this.fireTimer();
      }
    };
    this.playerRef.on('songEnded', this.songEndedHandler);
  }

  private removeSongEndListener(): void {
    if (this.playerRef && this.songEndedHandler) {
      this.playerRef.off('songEnded', this.songEndedHandler);
      this.songEndedHandler = null;
    }
  }

  private async fireTimer(): Promise<void> {
    this.clearTimer();
    this.removeSongEndListener();

    if (this.playerRef) {
      await this.playerRef.pause();
    }

    const firedMode = this.mode;
    this.mode = null;
    this.endTimestamp = null;
    this._isPaused = false;

    this.emit('complete', { mode: firedMode });
  }

  private clearTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  destroy(): void {
    this.stop();
    this.removeSongEndListener();
    this.listeners.clear();
  }
}

const sleepTimer = new SleepTimer();
export default sleepTimer;
