import { store } from '@renderer/store/store';
import { useStore } from '@tanstack/react-store';
import { lazy, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../contexts/AppUpdateContext';

const SleepTimerPrompt = lazy(() => import('./SleepTimerPrompt'));

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SleepTimerIndicator = () => {
  const { t } = useTranslation();
  const sleepTimer = useStore(store, (state) => state.sleepTimer);
  const { changePromptMenuData } = useContext(AppUpdateContext);

  const [remaining, setRemaining] = useState(sleepTimer.remainingSeconds);

  useEffect(() => {
    if (!sleepTimer.isActive || sleepTimer.mode !== 'time') return;

    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer.isActive, sleepTimer.mode]);

  useEffect(() => {
    setRemaining(sleepTimer.remainingSeconds);
  }, [sleepTimer.remainingSeconds]);

  if (!sleepTimer.isActive) return null;

  return (
    <button
      type="button"
      className="sleep-timer-indicator bg-background-color-3/50 text-font-color-black dark:bg-dark-background-color-3/50 dark:text-font-color-white flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:bg-background-color-3 dark:hover:bg-dark-background-color-3"
      onClick={() => changePromptMenuData(true, <SleepTimerPrompt />)}
      title={t('player.sleepTimer')}
    >
      <span className="material-icons-round text-sm">bedtime</span>
      {sleepTimer.mode === 'time' && <span>{formatTime(remaining)}</span>}
      {sleepTimer.mode === 'endOfSong' && (
        <span className="material-icons-round text-sm">music_note</span>
      )}
    </button>
  );
};

export default SleepTimerIndicator;
