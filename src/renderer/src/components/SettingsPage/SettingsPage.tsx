import { useTranslation } from 'react-i18next';

import MainContainer from '../MainContainer';
import AboutSettings from './Settings/AboutSettings';
import AccessibilitySettings from './Settings/AccessibilitySettings';
import AccountsSettings from './Settings/AccountsSettings';
import AdvancedSettings from './Settings/AdvancedSettings';
import AppearanceSettings from './Settings/AppearanceSettings';
import AudioPlaybackSettings from './Settings/AudioPlaybackSettings';
import DefaultPageSettings from './Settings/DefaultPageSettings';
// import StorageSettings from './Settings/StorageSettings';
import EqualizerSettings from './Settings/EqualizerSettings';
import LanguageSettings from './Settings/LanguageSettings';
import LyricsSettings from './Settings/LyricsSettings';
import PerformanceSettings from './Settings/PerformanceSettings';
import PreferencesSettings from './Settings/PreferencesSettings';
import StartupSettings from './Settings/StartupSettings';
import StorageSettings from './Settings/StorageSettings';

const SettingsPage = () => {
  const { t } = useTranslation();
  return (
    <MainContainer className="main-container settings-container appear-from-bottom text-font-color-black dark:text-font-color-white mb-0! h-fit! pr-8 pb-8 [scrollbar-gutter:stable]">
      <>
        <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center justify-between text-3xl font-medium">
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

          {/* STORAGE SETTINGS */}
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
