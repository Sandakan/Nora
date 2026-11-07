import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@renderer/index';
import { settingsQuery } from '@renderer/queries/settings';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import Checkbox from '../../Checkbox';
import AudioFeatureExplainerPrompt from './AudioFeatureExplainerPrompt';
import AudioFeatureIndexingCard from './AudioFeatureIndexingCard';

const RecommendationSettings = () => {
  const { t } = useTranslation();
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { data: userSettings } = useQuery(settingsQuery.all);

  const { mutate: toggleSmartAutoPlay } = useMutation({
    mutationFn: (enable: boolean) => window.api.settingsHelpers.toggleSmartAutoPlay(enable),
    onSettled: () => {
      queryClient.invalidateQueries(settingsQuery.all);
    }
  });

  return (
    <li
      className="main-container recommendation-settings-container mb-16"
      id="recommendation-settings-container"
    >
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2">auto_awesome</span>
        {t('settingsPage.recommendations', 'Recommendations')}
      </div>
      <p className="description mb-4">
        {t(
          'settingsPage.recommendationsDescription',
          'Configure smart playback recommendations, seamless autoplay, and acoustic DSP audio feature analysis.'
        )}
      </p>
      <ul className="marker:bg-font-color-highlight dark:marker:bg-dark-font-color-highlight list-disc pl-6">
        <li className="secondary-container enable-smart-autoplay mb-6">
          <div className="description">
            {t(
              'settingsPage.smartAutoPlayDescription',
              'Keep the music playing. Automatically queues matching songs from your library when playback reaches the end of the queue.'
            )}
          </div>
          <Checkbox
            id="toggleSmartAutoPlay"
            isChecked={userSettings ? userSettings.enableSmartAutoPlay : false}
            checkedStateUpdateFunction={(state) => toggleSmartAutoPlay(state)}
            labelContent={t('settingsPage.enableSmartAutoPlay', 'Enable Smart Auto-Play')}
          />
        </li>

        <li className="secondary-container audio-feature-indexing mb-6">
          <div className="description mb-4 flex items-center">
            <span>
              {t(
                'settingsPage.audioFeatureIndexingDesc',
                'Extracts acoustic DSP fingerprints for recommendation & radio queues.'
              )}
            </span>
            <button
              type="button"
              className="text-font-color-highlight dark:text-dark-font-color-highlight ml-2 inline-flex cursor-pointer items-center justify-center transition-transform hover:scale-115 focus-visible:outline-hidden"
              title={t('settingsPage.learnMoreAudioFeatures', 'Learn how audio analysis works')}
              onClick={() => changePromptMenuData(true, <AudioFeatureExplainerPrompt />)}
            >
              <span className="material-icons-round-outlined text-lg leading-none">help</span>
            </button>
          </div>
          <AudioFeatureIndexingCard />
        </li>
      </ul>
    </li>
  );
};

export default RecommendationSettings;
