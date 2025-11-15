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
// import StorageSettings from './Settings/StorageSettings';
import EqualizerSettings from './Settings/EqualizerSettings';
import PerformanceSettings from './Settings/PerformanceSettings';
import AdvancedSettings from './Settings/AdvancedSettings';
import AccountsSettings from './Settings/AccountsSettings';
import LanguageSettings from './Settings/LanguageSettings';
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
