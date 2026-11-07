import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import Button from '../../Button';

const AudioFeatureExplainerPrompt = () => {
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  return (
    <div>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mb-4 flex items-center text-3xl font-medium">
        <span className="material-icons-round mr-2 text-4xl">insights</span>
        {t('audioFeatureExplainerPrompt.title', 'How Audio Analysis Works')}
      </div>

      <div className="description">
        <p className="mb-4">
          {t(
            'audioFeatureExplainerPrompt.intro',
            'To recommend music that naturally matches what you love, Nora looks beyond basic metadata like genres and artist names by listening to the actual acoustic texture of your tracks.'
          )}
        </p>

        <h4 className="font-semibold text-font-color-highlight dark:text-dark-font-color-highlight text-lg mt-4 mb-2 flex items-center">
          <span className="material-icons-round mr-2 text-2xl">graphic_eq</span>
          {t('audioFeatureExplainerPrompt.whatWeMeasureTitle', 'What Nora Measures')}
        </h4>
        <ul className="marker:text-font-color-highlight dark:marker:text-dark-font-color-highlight list-inside list-disc pl-4 space-y-2 mb-4">
          <li>
            <strong className="text-font-color-highlight dark:text-dark-font-color-highlight">
              {t('audioFeatureExplainerPrompt.tempo', 'Tempo & Speed')}:
            </strong>{' '}
            {t(
              'audioFeatureExplainerPrompt.tempoDesc',
              'Detects the beats per minute (BPM) to distinguish slow acoustic ballads from high-energy dance tracks.'
            )}
          </li>
          <li>
            <strong className="text-font-color-highlight dark:text-dark-font-color-highlight">
              {t('audioFeatureExplainerPrompt.energy', 'Energy & Rhythm')}:
            </strong>{' '}
            {t(
              'audioFeatureExplainerPrompt.energyDesc',
              'Measures dynamic punchiness, pulse clarity, and loudness to gauge musical intensity and groove.'
            )}
          </li>
          <li>
            <strong className="text-font-color-highlight dark:text-dark-font-color-highlight">
              {t('audioFeatureExplainerPrompt.brightness', 'Tonal Color & Mood')}:
            </strong>{' '}
            {t(
              'audioFeatureExplainerPrompt.brightnessDesc',
              'Evaluates sound brightness—whether a song leans toward warm, deep bass or airy, shimmering highs.'
            )}
          </li>
        </ul>

        <h4 className="font-semibold text-font-color-highlight dark:text-dark-font-color-highlight text-lg mt-6 mb-2 flex items-center">
          <span className="material-icons-round mr-2 text-2xl">lock</span>
          {t('audioFeatureExplainerPrompt.privacyTitle', '100% Local & Private')}
        </h4>
        <p className="mb-4">
          {t(
            'audioFeatureExplainerPrompt.privacyDesc',
            'Your audio files never leave your computer. All processing is computed entirely on your device using Nora’s native audio engine. No audio data, recordings, or song files are ever uploaded to cloud services or external servers.'
          )}
        </p>

        <h4 className="font-semibold text-font-color-highlight dark:text-dark-font-color-highlight text-lg mt-6 mb-2 flex items-center">
          <span className="material-icons-round mr-2 text-2xl">verified_user</span>
          {t('audioFeatureExplainerPrompt.safetyTitle', 'Safe & Gentle on Your Library')}
        </h4>
        <p>
          {t(
            'audioFeatureExplainerPrompt.safetyDesc',
            'Your music files are strictly read-only and are never modified or rewritten. Analysis runs quietly in the background with minimal CPU usage, and you can pause or resume it at any time. Even when paused, Nora gently analyzes songs as you play them so your recommendations stay fresh without putting extra load on your system.'
          )}
        </p>
      </div>

      <div className="buttons-container mt-12 flex justify-end">
        <Button
          label={t('common.gotIt', 'Got it')}
          className="bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 w-[10rem] py-3!"
          clickHandler={() => changePromptMenuData(false)}
        />
      </div>
    </div>
  );
};

export default AudioFeatureExplainerPrompt;
