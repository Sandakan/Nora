import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { queryClient } from '@renderer/index';
import { recommendationQuery } from '@renderer/queries/recommendations';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import Button from '../../Button';

const ReindexFeaturesConfirmPrompt = () => {
  const { changePromptMenuData, addNewNotifications } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const handleSmartReindex = async (
    _: unknown,
    setIsDisabled?: (state: boolean) => void,
    setIsPending?: (state: boolean) => void
  ) => {
    setIsDisabled?.(true);
    setIsPending?.(true);
    try {
      await window.api.recommendations.reindex('missing');
      await queryClient.invalidateQueries({
        queryKey: recommendationQuery.indexingStatus.queryKey
      });
      changePromptMenuData(false);
      addNewNotifications([
        {
          id: 'smartReindexStarted',
          duration: 4000,
          content: t(
            'settingsPage.smartReindexStarted',
            'Smart re-indexing started for unindexed songs.'
          ),
          iconName: 'refresh'
        }
      ]);
    } catch (err) {
      console.error('[ReindexFeaturesConfirmPrompt] Smart re-index failed:', err);
      setIsDisabled?.(false);
      setIsPending?.(false);
    }
  };

  const handleFullReindex = async (
    _: unknown,
    setIsDisabled?: (state: boolean) => void,
    setIsPending?: (state: boolean) => void
  ) => {
    setIsDisabled?.(true);
    setIsPending?.(true);
    try {
      await window.api.recommendations.reindex('all');
      await queryClient.invalidateQueries({
        queryKey: recommendationQuery.indexingStatus.queryKey
      });
      changePromptMenuData(false);
      addNewNotifications([
        {
          id: 'fullReindexStarted',
          duration: 4000,
          content: t(
            'settingsPage.fullReindexStarted',
            'Full library re-indexing initiated. All songs will be re-analyzed.'
          ),
          iconName: 'warning'
        }
      ]);
    } catch (err) {
      console.error('[ReindexFeaturesConfirmPrompt] Full re-index failed:', err);
      setIsDisabled?.(false);
      setIsPending?.(false);
    }
  };

  return (
    <>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        {t('settingsPage.reindexFeaturesTitle', 'Re-index Audio Features')}
      </div>

      <div className="description">
        <p className="mb-4">
          {t(
            'settingsPage.reindexDescription',
            'Audio features empower Nora to generate personalized recommendations, radio queues, and sound similarity matching based on acoustic DSP analysis.'
          )}
        </p>

        <div className="mt-4">
          <ul className="marker:text-font-color-highlight dark:marker:text-dark-font-color-highlight list-inside list-disc pl-4">
            <li className="text-sm font-light mb-3">
              <span className="font-semibold text-font-color-highlight dark:text-dark-font-color-highlight">
                {t('settingsPage.smartReindex', 'Smart Re-index (Recommended)')}
              </span>
              : {t(
                'settingsPage.smartReindexDescription',
                'Analyzes songs that have not yet been indexed or were processed with an outdated algorithm version. Existing indexed songs are preserved.'
              )}
            </li>
            <li className="text-sm font-light">
              <span className="font-semibold text-font-color-crimson">
                {t('settingsPage.fullReindex', 'Force Full Re-index')}
              </span>
              : {t(
                'settingsPage.fullReindexDescription',
                'Clears all existing audio feature vectors and re-analyzes every song in your library from scratch in the background.'
              )}
            </li>
          </ul>
        </div>
      </div>

      <div className="buttons-container mt-8 flex flex-wrap items-center justify-end gap-3">
        <Button
          label={t('common.cancel', 'Cancel')}
          className="mr-0! h-10 px-5 cursor-pointer rounded-lg font-medium text-sm"
          clickHandler={() => changePromptMenuData(false)}
        />
        <Button
          label={t('settingsPage.forceFullReindex', 'Force Full Re-index')}
          className="danger-btn bg-font-color-crimson! text-font-color-white hover:border-font-color-crimson dark:bg-font-color-crimson! dark:text-font-color-white dark:hover:border-font-color-crimson mr-0! h-10 px-5 cursor-pointer rounded-lg outline-hidden ease-in-out font-medium text-sm"
          pendingAnimationOnDisabled
          clickHandler={handleFullReindex}
        />
        <Button
          label={t('settingsPage.startSmartReindex', 'Smart Re-index')}
          className="confirm-reindex-btn bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 mr-0! h-10 px-6 cursor-pointer rounded-lg outline-hidden ease-in-out font-medium text-sm"
          pendingAnimationOnDisabled
          clickHandler={handleSmartReindex}
        />
      </div>
    </>
  );
};

export default ReindexFeaturesConfirmPrompt;
