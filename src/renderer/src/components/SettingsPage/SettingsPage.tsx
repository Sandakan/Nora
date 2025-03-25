import { useTranslation } from 'react-i18next';

import MainContainer from '../MainContainer';
import AppearanceSettings from './Settings/AppearanceSettings';
import AudioPlaybackSettings from './Settings/AudioPlaybackSettings';
import LyricsSettings from './Settings/LyricsSettings';
import DefaultPageSettings from './Settings/DefaultPageSettings';
import PreferencesSettings from './Settings/PreferencesSettings';
import AccessibilitySettings from './Settings/AccessibilitySettings';
import StartupSettings from './Settings/StartupSettings';
import AboutSettings from './Settings/AboutSettings';
import StorageSettings from './Settings/StorageSettings';
import EqualizerSettings from './Settings/EqualizerSettings';
import PerformanceSettings from './Settings/PerformanceSettings';
import AdvancedSettings from './Settings/AdvancedSettings';
import AccountsSettings from './Settings/AccountsSettings';
import LanguageSettings from './Settings/LanguageSettings';

const SettingsPage = () => {
  const { t } = useTranslation();
  return (
    <MainContainer className="main-container settings-container appear-from-bottom mb-0! h-fit! pb-8 pr-8 text-font-color-black [scrollbar-gutter:stable] dark:text-font-color-white">
      <>
        <div className="title-container mb-4 mt-1 flex items-center justify-between text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          {t('settingsPage.settings')}
        </div>

        <ul className="pl-4">
          {/*  APPEARANCE SETTINGS */}
          <AppearanceSettings />

          {/*  LANGUAGE SETTINGS */}
          <LanguageSettings />

          {/* ? AUDIO PLAYBACK SETTINGS */}
          <AudioPlaybackSettings />

          {/* ? ACCOUNTS SETTINGS */}
          <AccountsSettings />

          {/* ? LYRICS SETTINGS */}
          <LyricsSettings />

          {/* ? EQUALIZER SETTINGS */}
          <EqualizerSettings />

          {/* DEFAULT PAGE SETTINGS */}
          <DefaultPageSettings />

          {/* ? PREFERENCES SETTINGS */}
          <PreferencesSettings />

          {/* ? ACCESSIBILITY SETTINGS */}
          <AccessibilitySettings />

          {/* PERFORMANCE SETTINGS */}
          <PerformanceSettings />

          {/* STARTUP SETTINGS */}
          <StartupSettings />

          {/* STARTUP SETTINGS */}
          <StorageSettings />

          {/* ADVANCED SETTINGS */}
          <AdvancedSettings />

          {/* ABOUT SETTINGS */}
          <AboutSettings />
        </ul>
      </>
    </MainContainer>
  );
};

export default SettingsPage;
