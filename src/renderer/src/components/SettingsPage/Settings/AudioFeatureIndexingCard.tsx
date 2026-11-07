import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@renderer/index';
import { recommendationQuery } from '@renderer/queries/recommendations';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import Button from '../../Button';
import ReindexFeaturesConfirmPrompt from './ReindexFeaturesConfirmPrompt';

const AudioFeatureIndexingCard = () => {
  const { t } = useTranslation();
  const { changePromptMenuData } = useContext(AppUpdateContext);

  const { data: statusData } = useQuery(recommendationQuery.indexingStatus);

  useEffect(() => {
    if (!window.api?.recommendations?.onIndexingProgress) return;

    const unsubscribe = window.api.recommendations.onIndexingProgress((updatedStatus) => {
      queryClient.setQueryData(recommendationQuery.indexingStatus.queryKey, updatedStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const status = statusData?.status ?? 'idle';
  const totalSongs = statusData?.totalSongs ?? 0;
  const indexedSongs = statusData?.indexedSongs ?? 0;
  const remainingSongs = statusData?.remainingSongs ?? 0;
  const percentage =
    statusData?.percentage ?? (totalSongs > 0 ? Math.round((indexedSongs / totalSongs) * 100) : 0);
  const currentSong = statusData?.currentSong;

  return (
    <div className="audio-feature-indexing-card w-full">
      <div className="flex items-center justify-between text-sm uppercase opacity-50">
        <span>{t('settingsPage.audioFeatureIndexing', 'Audio Feature Indexing')}</span>
        <span>
          {t('settingsPage.audioFeatureIndexingProgress', '{{indexed}} / {{total}} SONGS ({{percentage}}%)', {
            indexed: indexedSongs.toLocaleString(),
            total: totalSongs.toLocaleString(),
            percentage
          })}
        </span>
      </div>

      <div
        className="bg-background-color-2 dark:bg-dark-background-color-2/75 mt-2 flex h-4 overflow-hidden rounded-md"
        title={`${percentage}%`}
      >
        <div
          className="h-full bg-font-color-highlight dark:bg-dark-font-color-highlight transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 max-w-[65%] text-xs">
          {status === 'indexing' ? (
            currentSong ? (
              <div
                className="flex items-center gap-1.5 text-font-color-highlight dark:text-dark-font-color-highlight truncate"
                title={`${t('settingsPage.analyzingPrefix', 'Analyzing')}: "${currentSong.title}"${
                  currentSong.artists ? ` • ${currentSong.artists}` : ''
                }`}
              >
                <span className="material-icons-round text-sm animate-pulse">graphic_eq</span>
                <span className="truncate">
                  <span className="opacity-75">{t('settingsPage.analyzingPrefix', 'Analyzing')}: </span>
                  <span className="font-medium">&quot;{currentSong.title}&quot;</span>
                  {currentSong.artists && <span className="opacity-75"> • {currentSong.artists}</span>}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-font-color-highlight dark:text-dark-font-color-highlight">
                <span className="material-icons-round text-sm animate-pulse">graphic_eq</span>
                <span>{t('settingsPage.indexingInProgress', 'Analyzing audio features...')}</span>
              </div>
            )
          ) : status === 'paused' ? (
            <div className="flex items-center gap-1.5 text-amber-500">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>
                {remainingSongs > 0
                  ? t('settingsPage.indexingPausedRemaining', 'Paused • {{count}} songs remaining', {
                      count: remainingSongs
                    })
                  : t('settingsPage.indexingPaused', 'Indexing paused')}
              </span>
            </div>
          ) : remainingSongs === 0 && totalSongs > 0 ? (
            <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
              <span className="material-icons-round text-sm">check_circle</span>
              <span>{t('settingsPage.libraryFullyIndexed', 'All songs indexed')}</span>
            </div>
          ) : (
            <div className="text-font-color-dimmed dark:text-dark-font-color-dimmed">
              {remainingSongs > 0
                ? t('settingsPage.remainingCount', '{{count}} songs remaining in queue', {
                    count: remainingSongs
                  })
                : t('settingsPage.statusIdle', 'Idle')}
            </div>
          )}
        </div>

        <div className="flex items-center">
          {remainingSongs > 0 &&
            (status === 'indexing' ? (
              <Button
                label={t('settingsPage.pause', 'Pause')}
                iconName="pause"
                className="mr-3! py-1! px-3!"
                clickHandler={async (_, setIsDisabled, setIsPending) => {
                  setIsDisabled(true);
                  setIsPending(true);
                  try {
                    await window.api.recommendations.pauseIndexing();
                    await queryClient.invalidateQueries({
                      queryKey: recommendationQuery.indexingStatus.queryKey
                    });
                  } finally {
                    setIsDisabled(false);
                    setIsPending(false);
                  }
                }}
              />
            ) : (
              <Button
                label={t('settingsPage.resume', 'Resume')}
                iconName="play_arrow"
                className="mr-3! py-1! px-3!"
                clickHandler={async (_, setIsDisabled, setIsPending) => {
                  setIsDisabled(true);
                  setIsPending(true);
                  try {
                    await window.api.recommendations.resumeIndexing();
                    await queryClient.invalidateQueries({
                      queryKey: recommendationQuery.indexingStatus.queryKey
                    });
                  } finally {
                    setIsDisabled(false);
                    setIsPending(false);
                  }
                }}
              />
            ))}

          <Button
            label={t('settingsPage.reindex', 'Re-index')}
            iconName="refresh"
            className="mr-0! py-1! px-3!"
            clickHandler={() => {
              changePromptMenuData(true, <ReindexFeaturesConfirmPrompt />);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioFeatureIndexingCard;
