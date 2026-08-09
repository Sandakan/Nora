import { store } from '@renderer/store/store';
import { useStore } from '@tanstack/react-store';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../contexts/AppUpdateContext';
import Button from './Button';

const SleepTimerPrompt = () => {
  const { t } = useTranslation();
  const sleepTimer = useStore(store, (state) => state.sleepTimer);
  const {
    startSleepTimer,
    startSleepTimerForSongEnd,
    stopSleepTimer,
    extendSleepTimer,
    changePromptMenuData
  } = useContext(AppUpdateContext);

  const close = () => changePromptMenuData(false);

  const handleStart = (minutes: number) => {
    startSleepTimer(minutes);
    close();
  };

  const handleStartEndOfSong = () => {
    startSleepTimerForSongEnd();
    close();
  };

  const handleExtend = (minutes: number) => {
    extendSleepTimer(minutes);
    close();
  };

  const handleCancel = () => {
    stopSleepTimer();
    close();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="title-container mb-2 flex items-center text-2xl font-medium">
        <span className="material-icons-round mr-3 text-3xl">bedtime</span>
        <span>{t('player.sleepTimerTitle')}</span>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          label={t('player.sleepTimer15')}
          iconName="timer"
          className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:hover:border-dark-background-color-3 mt-2 w-full"
          iconClassName="material-icons-round-outlined mr-2"
          clickHandler={() => handleStart(15)}
        />
        <Button
          label={t('player.sleepTimer30')}
          iconName="timer"
          className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:hover:border-dark-background-color-3 mt-2 w-full"
          iconClassName="material-icons-round-outlined mr-2"
          clickHandler={() => handleStart(30)}
        />
        <Button
          label={t('player.sleepTimer45')}
          iconName="timer"
          className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:hover:border-dark-background-color-3 mt-2 w-full"
          iconClassName="material-icons-round-outlined mr-2"
          clickHandler={() => handleStart(45)}
        />
        <Button
          label={t('player.sleepTimer60')}
          iconName="timer"
          className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:hover:border-dark-background-color-3 mt-2 w-full"
          iconClassName="material-icons-round-outlined mr-2"
          clickHandler={() => handleStart(60)}
        />
      </div>

      <div className="border-t border-background-color-3 dark:border-dark-background-color-3 my-2" />

      <div className="flex flex-col gap-2">
        <Button
          label={t('player.sleepTimerEndOfSong')}
          iconName="music_note"
          className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:hover:border-dark-background-color-3 mt-2 w-full"
          iconClassName="material-icons-round-outlined mr-2"
          clickHandler={handleStartEndOfSong}
        />
      </div>

      {sleepTimer.isActive && sleepTimer.mode === 'time' && (
        <>
          <div className="border-t border-background-color-3 dark:border-dark-background-color-3 my-2" />

          <div className="flex flex-col gap-2">
            <Button
              label={t('player.sleepTimerExtend15')}
              iconName="add"
              className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:hover:border-dark-background-color-3 mt-2 w-full"
              iconClassName="material-icons-round-outlined mr-2"
              clickHandler={() => handleExtend(15)}
            />
            <Button
              label={t('player.sleepTimerExtend30')}
              iconName="add"
              className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:hover:border-dark-background-color-3 mt-2 w-full"
              iconClassName="material-icons-round-outlined mr-2"
              clickHandler={() => handleExtend(30)}
            />
          </div>
        </>
      )}

      <div className="border-t border-background-color-3 dark:border-dark-background-color-3 my-2" />

      <Button
        label={t('player.sleepTimerCancel')}
        iconName="cancel"
        className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:hover:border-dark-background-color-3 mt-2 w-full"
        iconClassName="material-icons-round-outlined mr-2"
        clickHandler={handleCancel}
      />
    </div>
  );
};

export default SleepTimerPrompt;
