import { useCallback, useEffect } from 'react';

import type AudioPlayer from '../other/player';
import sleepTimer from '../other/sleepTimer';
import { dispatch } from '../store/store';

export function useSleepTimer(player: AudioPlayer) {
  useEffect(() => {
    sleepTimer.setPlayer(player);
  }, [player]);

  useEffect(() => {
    const handleTick = (remaining?: unknown) => {
      dispatch({
        type: 'UPDATE_SLEEP_TIMER_STATE',
        data: {
          isActive: sleepTimer.isActive(),
          mode: sleepTimer.getMode(),
          remainingSeconds: remaining as number,
          endTimestamp:
            sleepTimer.getMode() === 'time'
              ? Date.now() + (remaining as number) * 1000
              : null
        }
      });
    };

    const handleComplete = () => {
      dispatch({
        type: 'UPDATE_SLEEP_TIMER_STATE',
        data: { isActive: false, mode: null, remainingSeconds: 0, endTimestamp: null }
      });
    };

    const handleStart = () => handleTick(sleepTimer.getRemainingSeconds());
    const handleStop = () => handleTick(0);

    sleepTimer.on('tick', handleTick);
    sleepTimer.on('complete', handleComplete);
    sleepTimer.on('start', handleStart);
    sleepTimer.on('stop', handleStop);
    sleepTimer.on('pause', handleTick);
    sleepTimer.on('resume', handleTick);

    return () => {
      sleepTimer.off('tick', handleTick);
      sleepTimer.off('complete', handleComplete);
      sleepTimer.off('start', handleStart);
      sleepTimer.off('stop', handleStop);
      sleepTimer.off('pause', handleTick);
      sleepTimer.off('resume', handleTick);
    };
  }, []);

  const startTimer = useCallback((minutes: number) => {
    sleepTimer.start('time', minutes);
  }, []);

  const startTimerForSongEnd = useCallback(() => {
    sleepTimer.start('endOfSong');
  }, []);

  const stopTimer = useCallback(() => {
    sleepTimer.stop();
  }, []);

  const pauseTimer = useCallback(() => {
    sleepTimer.pause();
  }, []);

  const resumeTimer = useCallback(() => {
    sleepTimer.resume();
  }, []);

  const extendTimer = useCallback((minutes: number) => {
    sleepTimer.extend(minutes);
  }, []);

  return {
    startTimer,
    startTimerForSongEnd,
    stopTimer,
    pauseTimer,
    resumeTimer,
    extendTimer
  };
}
