import type AudioPlayer from './player';

type SleepTimerMode = 'time' | 'endOfSong';
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

  /** Incremented on start/stop so a stale async completion cannot clear a newer timer. */
  private completionGeneration = 0;

  private isValidDuration(minutes: number): boolean {
    return Number.isFinite(minutes) && minutes > 0;
  }

  setPlayer(player: AudioPlayer) {
    if (this.playerRef && this.songEndedHandler) {
      this.playerRef.off('songEnded', this.songEndedHandler);
    }
    this.playerRef = player;
    if (this.isActive() && this.mode !== 'time' && !this._isPaused) {
      this.listenForSongEnd();
    }
  }

  start(mode: 'time', minutes: number): void;
  start(mode: 'endOfSong'): void;
  start(mode: SleepTimerMode, minutes?: number): void {
    // Reject invalid durations at the engine boundary (NaN, Infinity, <= 0).
    if (mode === 'time' && (minutes === undefined || !this.isValidDuration(minutes))) {
      return;
    }

    // Only tear down an existing timer for a valid start request.
    if (this.isActive()) this.stop();

    this.completionGeneration += 1;
    this.mode = mode;
    this._isPaused = false;

    if (mode === 'time' && minutes !== undefined) {
      const durationMs = minutes * 60 * 1000;
      this.endTimestamp = Date.now() + durationMs;
      this.startTicking();
    } else if (mode === 'endOfSong') {
      this.endTimestamp = null;
      this.listenForSongEnd();
    }

    this.emit('start');
    this.emit('tick', this.getRemainingSeconds());
  }

  stop(): void {
    this.completionGeneration += 1;
    this.clearTimer();
    this.removeSongEndListener();
    this.mode = null;
    this.endTimestamp = null;
    this._isPaused = false;
    this.pausedRemainingSeconds = 0;
    this.emit('stop');
    this.emit('tick', 0);
  }

  pause(): void {
    if (!this.isActive() || this._isPaused) return;
    // Capture remaining BEFORE flipping the paused flag: getRemainingSeconds()
    // reads pausedRemainingSeconds once paused, so ordering matters.
    this.pausedRemainingSeconds = this.getRemainingSeconds();
    this._isPaused = true;

    if (this.mode === 'time') {
      this.clearTimer();
      this.endTimestamp = null;
    } else {
      this.removeSongEndListener();
    }

    this.emit('pause');
    this.emit('tick', this.getRemainingSeconds());
  }

  resume(): void {
    if (!this.isActive() || !this._isPaused) return;
    this._isPaused = false;

    if (this.mode === 'time') {
      this.endTimestamp = Date.now() + this.pausedRemainingSeconds * 1000;
      this.startTicking();
    } else if (this.mode === 'endOfSong') {
      this.listenForSongEnd();
    }

    this.emit('resume');
    this.emit('tick', this.getRemainingSeconds());
  }

  extend(minutes: number): void {
    if (!this.isActive() || this.mode !== 'time') return;
    if (!this.isValidDuration(minutes)) return;
    if (this._isPaused) {
      this.pausedRemainingSeconds += minutes * 60;
    } else {
      const currentRemaining = this.getRemainingSeconds() * 1000;
      this.endTimestamp = Date.now() + currentRemaining + minutes * 60 * 1000;
      this.startTicking();
    }
    this.emit('tick', this.getRemainingSeconds());
  }

  getRemainingSeconds(): number {
    if (this._isPaused) return this.pausedRemainingSeconds;
    if (this.mode === 'time' && this.endTimestamp !== null) {
      return Math.max(0, Math.ceil((this.endTimestamp - Date.now()) / 1000));
    }
    return 0;
  }

  getEndTimestamp(): number | null {
    return this.endTimestamp;
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
      if (this.mode === 'endOfSong') {
        // Mark playback to stop BEFORE any await so the player's
        // handleSongEnd() sees it synchronously and skips queue auto-play.
        // Without this, the queue advances and can start the next track
        // while the fade-out below is still awaiting.
        if (this.playerRef) this.playerRef.stopAfterCurrentSong = true;
        void this.fireTimer();
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
    const generation = this.completionGeneration;
    this.clearTimer();
    this.removeSongEndListener();

    if (this.playerRef) {
      await this.playerRef.pause();
    }

    // A newer timer may have started during the fade. Only complete this one
    // if it is still the current timer, so an old completion cannot reset a
    // newly started timer's state.
    if (generation !== this.completionGeneration) return;

    const firedMode = this.mode;
    this.mode = null;
    this.endTimestamp = null;
    this._isPaused = false;
    this.pausedRemainingSeconds = 0;

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
