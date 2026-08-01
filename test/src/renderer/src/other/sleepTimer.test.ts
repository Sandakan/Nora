import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../../../src/renderer/src/store/store', () => ({
  dispatch: vi.fn(),
  store: { state: { player: { volume: { value: 50, isMuted: false }, playbackRate: 1, isRepeating: 'off' as const } }, subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) }
}));

import sleepTimer from '../../../../../src/renderer/src/other/sleepTimer';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SleepTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sleepTimer.stop();
    sleepTimer.destroy();
    // Re-init listener map after destroy clears it (the module singleton is
    // reused across tests, so recreate listeners via the public surface).
  });

  afterEach(() => {
    vi.useRealTimers();
    sleepTimer.stop();
  });

  it('ticks and completes a time timer once', async () => {
    const tickSpy = vi.fn();
    const completeSpy = vi.fn();
    sleepTimer.on('tick', tickSpy);
    sleepTimer.on('complete', completeSpy);

    sleepTimer.start('time', 1); // 60s
    expect(sleepTimer.isActive()).toBe(true);
    expect(sleepTimer.getRemainingSeconds()).toBeGreaterThan(0);

    // Advance past 60s
    await vi.advanceTimersByTimeAsync(61_000);
    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(sleepTimer.isActive()).toBe(false);

    sleepTimer.off('tick', tickSpy);
    sleepTimer.off('complete', completeSpy);
  });

  it('pause freezes the remaining duration', () => {
    sleepTimer.start('time', 5);
    const before = sleepTimer.getRemainingSeconds();
    sleepTimer.pause();
    const frozen = sleepTimer.getRemainingSeconds();
    expect(frozen).toBeGreaterThan(0);
    expect(frozen).toBeLessThanOrEqual(before);
  });

  it('resume restarts from the paused duration', async () => {
    sleepTimer.start('time', 5);
    sleepTimer.pause();
    const paused = sleepTimer.getRemainingSeconds();
    sleepTimer.resume();
    // After resume the timer is counting again; remaining should be close to paused.
    expect(sleepTimer.getRemainingSeconds()).toBeLessThanOrEqual(paused);
    expect(sleepTimer.isActive()).toBe(true);
  });

  it('stop removes the interval and songEnded listener', () => {
    const player = { on: vi.fn(), off: vi.fn(), pause: vi.fn().mockResolvedValue(undefined), stopAfterCurrentSong: false };
    sleepTimer.setPlayer(player as any);
    sleepTimer.start('endOfSong');
    expect(player.on).toHaveBeenCalledWith('songEnded', expect.any(Function));

    sleepTimer.stop();
    expect(player.off).toHaveBeenCalledWith('songEnded', expect.any(Function));
    expect(sleepTimer.isActive()).toBe(false);
  });

  it('setPlayer removes the old listener before attaching a new one', () => {
    const playerA = { on: vi.fn(), off: vi.fn(), pause: vi.fn().mockResolvedValue(undefined), stopAfterCurrentSong: false };
    const playerB = { on: vi.fn(), off: vi.fn(), pause: vi.fn().mockResolvedValue(undefined), stopAfterCurrentSong: false };
    sleepTimer.setPlayer(playerA as any);
    sleepTimer.start('endOfSong');
    sleepTimer.setPlayer(playerB as any);
    expect(playerA.off).toHaveBeenCalledWith('songEnded', expect.any(Function));
  });

  it('end-of-song completion sets stopAfterCurrentSong before pausing', () => {
    const player = {
      on: vi.fn(),
      off: vi.fn(),
      pause: vi.fn().mockResolvedValue(undefined),
      stopAfterCurrentSong: false
    };
    sleepTimer.setPlayer(player as any);
    sleepTimer.start('endOfSong');

    // Capture the handler the player registered
    const handler = player.on.mock.calls.find(([event]) => event === 'songEnded')?.[1] as () => void;
    handler();

    expect(player.stopAfterCurrentSong).toBe(true);
  });

  it('a newer timer is not cleared by an old completion during fade', async () => {
    let resolvePause: (() => void) | undefined;
    const player = {
      on: vi.fn(),
      off: vi.fn(),
      pause: vi.fn().mockImplementation(() => new Promise((resolve) => { resolvePause = resolve; })),
      stopAfterCurrentSong: false
    };
    sleepTimer.setPlayer(player as any);

    const completeSpy = vi.fn();
    sleepTimer.on('complete', completeSpy);

    sleepTimer.start('endOfSong');
    const handler = player.on.mock.calls.find(([event]) => event === 'songEnded')?.[1] as () => void;
    handler(); // fireTimer starts, awaits pause

    // User starts a new timer while the old fade is pending
    sleepTimer.start('time', 10);

    // Old pause resolves
    resolvePause?.();

    // Old completion must NOT emit complete for the new timer
    expect(completeSpy).not.toHaveBeenCalled();
    expect(sleepTimer.isActive()).toBe(true);
  });

  it('invalid duration values do not activate or extend a timer', () => {
    sleepTimer.start('time', NaN);
    expect(sleepTimer.isActive()).toBe(false);
    sleepTimer.start('time', Infinity);
    expect(sleepTimer.isActive()).toBe(false);
    sleepTimer.start('time', 0);
    expect(sleepTimer.isActive()).toBe(false);
    sleepTimer.start('time', -5);
    expect(sleepTimer.isActive()).toBe(false);

    sleepTimer.start('time', 10);
    const before = sleepTimer.getRemainingSeconds();
    sleepTimer.extend(NaN);
    sleepTimer.extend(Infinity);
    sleepTimer.extend(0);
    sleepTimer.extend(-1);
    expect(sleepTimer.getRemainingSeconds()).toBeLessThanOrEqual(before);
  });
});
