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
import AccountsSettings from './Settings/AccountsSettings';

const SettingsPage = () => {
  return (
    <MainContainer className="main-container settings-container appear-from-bottom !mb-0 !h-fit pb-8 pr-8 text-font-color-black dark:text-font-color-white">
      <>
        <div className="title-container mb-4 mt-1 flex items-center justify-between text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          Settings
        </div>

        <ul className="pl-4">
          {/*  APPEARANCE SETTINGS */}
          <AppearanceSettings />

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

          {/* ABOUT SETTINGS */}
          <AboutSettings />
        </ul>
      </>
    </MainContainer>
  );
};

export default SettingsPage;
