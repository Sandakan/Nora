/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

import AppearanceSettings from './Settings/AppearanceSettings';
import AudioPlaybackSettings from './Settings/AudioPlaybackSettings';
import MusicFoldersSettings from './Settings/MusicFoldersSettings';
import BlacklistedSongSettings from './Settings/BlacklistedSongSettings';

import MainContainer from '../MainContainer';

import DefaultPageSettings from './Settings/DefaultPageSettings';
import PreferencesSettings from './Settings/PreferencesSettings';
import AccessibilitySettings from './Settings/AccessibilitySettings';
import StartupSettings from './Settings/StartupSettings';
import AboutSettings from './Settings/AboutSettings';

const SettingsPage = () => {
  const { userData } = useContext(AppContext);

  const [settingsUserData, setSettingsUserData] = React.useState(userData);

  const fetchUserData = React.useCallback(
    () =>
      window.api
        .getUserData()
        .then((res) => setSettingsUserData(res))
        .catch((err) => console.error(err)),
    []
  );

  React.useEffect(() => {
    fetchUserData();
    const manageUserDataUpdatesInSettingsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType.includes('userData')) fetchUserData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageUserDataUpdatesInSettingsPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageUserDataUpdatesInSettingsPage
      );
    };
  }, [fetchUserData]);

  return (
    <MainContainer className="main-container settings-container appear-from-bottom !mb-0 !h-fit pr-8 pb-8 text-font-color-black dark:text-font-color-white">
      <>
        <div className="title-container mt-1 mb-4 flex items-center justify-between text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          Settings
          {/* <div className="other-controls-container flex text-sm font-normal">
            <span className="material-icons-round-outlined mr-2">warning</span>{' '}
            App Updates Failed
          </div> */}
        </div>

        <ul className="pl-4">
          {/*  APPEARANCE SETTINGS */}
          <li className="main-container appearance-settings-container mb-16">
            <AppearanceSettings themeData={settingsUserData?.theme} />
          </li>

          {/* ? AUDIO PLAYBACK SETTINGS */}
          <li className="main-container audio-playback-settings-container mb-16">
            <AudioPlaybackSettings />
          </li>

          {/* MUSIC FOLDERS SETTINGS */}
          <li className="main-container mb-16 mr-8">
            <MusicFoldersSettings
              musicFoldersData={settingsUserData?.musicFolders ?? []}
            />
          </li>

          {/* BLACKLISTED SONGS SETTINGS */}
          {settingsUserData && settingsUserData.songBlacklist && (
            <li className="main-container blacklisted-songs-container mb-16">
              <BlacklistedSongSettings
                songBlacklist={settingsUserData.songBlacklist}
              />
            </li>
          )}

          {/* DEFAULT PAGE SETTINGS */}
          <li className="main-container mb-16">
            <DefaultPageSettings />
          </li>

          {/* ? PREFERENCES SETTINGS */}
          <li className="main-container preferences-settings-container mb-16">
            <PreferencesSettings />
          </li>

          {/* ? ACCESSIBILITY SETTINGS */}
          <li className="main-container accessibility-settings-container mb-16">
            <AccessibilitySettings />
          </li>

          {/* STARTUP SETTINGS */}
          <li className="main-container startup-settings-container mb-16">
            <StartupSettings />
          </li>

          {/* ABOUT SETTINGS */}
          <li className="main-container about-container">
            <AboutSettings />
          </li>
        </ul>
      </>
    </MainContainer>
  );
};

export default SettingsPage;
