/* eslint-disable react/no-unescaped-entities */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import MusicFolder from './MusicFolder';
import Button from '../Button';
import Checkbox from '../Checkbox';
import { version } from '../../../../package.json';
import openSourceLicenses from '../../../../open_source_licenses.txt';
import ResetAppConfirmationPrompt from '../HomePage/ResetAppConfirmationPrompt';
import BlacklistedSong from './BlacklistedSong';
import MainContainer from '../MainContainer';
import Dropdown from '../Dropdown';
import SensitiveActionConfirmPrompt from '../SensitiveActionConfirmPrompt';
import ReleaseNotesPrompt from './ReleaseNotesPrompt';
import OpenLinkConfirmPrompt from '../OpenLinkConfirmPrompt';

interface SettingsReducer {
  userData: UserData;
}

type SettingsReducerActionTypes =
  | 'UPDATE_USER_DATA'
  | 'CHANGE_DEFAULT_PAGE'
  | 'TOGGLE_AUTO_LAUNCH';

const reducer = (
  state: SettingsReducer,
  action: { type: SettingsReducerActionTypes; data?: any }
): SettingsReducer => {
  switch (action.type) {
    case 'UPDATE_USER_DATA':
      return {
        ...state,
        userData: (action.data as UserData) || state.userData,
      };
    case 'TOGGLE_AUTO_LAUNCH':
      return {
        ...state,
        userData: {
          ...state.userData,
          preferences: {
            ...state.userData.preferences,
            autoLaunchApp:
              (action.data as boolean) ||
              state.userData.preferences.autoLaunchApp,
          },
        },
      };
    case 'CHANGE_DEFAULT_PAGE':
      return {
        ...state,
        userData: {
          ...state.userData,
          defaultPage: action.data || state.userData.defaultPage,
        },
      };
    default:
      return state;
  }
};

export const SettingsPage = () => {
  const { userData } = useContext(AppContext);
  const {
    toggleDarkMode,
    changePromptMenuData,
    updateNotificationPanelData,
    toggleReducedMotion,
    toggleSongIndexing,
  } = React.useContext(AppUpdateContext);

  const [content, dispatch] = React.useReducer(reducer, {
    userData,
  } as SettingsReducer);

  const fetchUserData = React.useCallback(
    () =>
      window.api
        .getUserData()
        .then((res) => dispatch({ type: 'UPDATE_USER_DATA', data: res }))
        .catch((err) => console.error(err)),
    []
  );

  React.useEffect(() => {
    fetchUserData();
    const manageUserDataUpdates = (
      _: unknown,
      eventType: DataUpdateEventTypes
    ) => {
      if (eventType === 'userData') fetchUserData();
    };
    window.api.dataUpdateEvent(manageUserDataUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageUserDataUpdates);
    };
  }, [fetchUserData]);

  const musicFolders = React.useMemo(
    () =>
      content.userData.musicFolders
        ? content.userData.musicFolders.map((musicFolder, index) => {
            return <MusicFolder key={index} musicFolder={musicFolder} />;
          })
        : [],
    [content.userData.musicFolders]
  );

  const blacklistedSongComponents = React.useMemo(
    () =>
      content.userData.songBlacklist
        ? content.userData.songBlacklist.map((songPath, index) => (
            <BlacklistedSong songPath={songPath} key={index} index={index} />
          ))
        : [],
    [content.userData.songBlacklist]
  );

  return (
    <MainContainer className="main-container settings-container appear-from-bottom text-font-color-black dark:text-font-color-white pr-8">
      <>
        <div className="title-container mt-1 mb-4 text-font-color-black text-3xl font-medium dark:text-font-color-white">
          Settings
        </div>

        <div className="pl-4">
          {/*  THEME SETTINGS */}
          <div className="main-container mb-6">
            <div className="title-container font-medium mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Theme
            </div>
            <div className="description">
              Change the of the application as you need. We don&apos;t judge you
              for it.
            </div>
            <div className="theme-change-radio-btns py-4 pl-8">
              <div className="theme-change-radio-btn mb-2 text-lg">
                <input
                  type="radio"
                  name="theme"
                  className="hidden mr-4 peer"
                  value="lightTheme"
                  id="lightThemeRadioBtn"
                  defaultChecked={!content.userData.theme.isDarkMode}
                  onClick={() => toggleDarkMode('light')}
                />
                <label
                  className="cursor-pointer before:content-[''] before:inline-block before:align-middle before:w-4 before:h-4 before:mr-4 before:rounded-full before:border-solid before:border-[0.2rem] before:border-[#ccc]"
                  htmlFor="lightThemeRadioBtn"
                >
                  Light Theme
                </label>
              </div>
              <div className="theme-change-radio-btn mb-2 text-lg">
                <input
                  type="radio"
                  name="theme"
                  className="hidden mr-4"
                  value="darkTheme"
                  id="darkThemeRadioBtn"
                  defaultChecked={content.userData.theme.isDarkMode}
                  onClick={() => toggleDarkMode('dark')}
                />
                <label
                  className="cursor-pointer before:content-[''] before:inline-block before:align-middle before:w-4 before:h-4 before:mr-4 before:rounded-full before:border-solid before:border-[0.2rem] before:border-[#ccc]"
                  htmlFor="darkThemeRadioBtn"
                >
                  Dark Theme
                </label>
              </div>
            </div>
          </div>

          {/* MUSIC FOLDERS SETTINGS */}
          <div className="main-container mt-4 mb-6 mr-8">
            <div className="title-container font-medium  mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Music Folders
            </div>
            <div className="description">
              Tell us where to look for your songs to create you an amazing
              music library.
            </div>
            <div className="music-folders pl-4 min-h-[5rem] mt-4 border-[3px] rounded-xl border-background-color-2 dark:border-dark-background-color-2 relative empty:after:content-['There_are_no_folders.'] empty:after:text-[#ccc] empty:after:absolute empty:after:top-1/2 empty:after:left-1/2 empty:after:-translate-x-1/2 empty:after:-translate-y-1/2">
              {musicFolders}
            </div>
            <Button
              label="Add Music Folder"
              iconName="add"
              iconClassName="mr-4"
              className="add-new-music-folder-btn text-base my-4 rounded-2xl"
              clickHandler={() =>
                window.api.addMusicFolder().catch((err) => console.error(err))
              }
            />
          </div>

          {/* BLACKLISTED SONGS SETTINGS */}
          {content.userData && content.userData.songBlacklist && (
            <div className="main-container blacklisted-songs-container mb-12">
              <div className="title-container font-medium mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
                Blacklisted Songs
              </div>
              <div className="description">
                Songs that have been removed from the library will appear here.
              </div>
              <div className="blacklisted-songs min-h-[5rem] my-4 mr-8 border-[0.2rem] border-background-color-2 dark:border-dark-background-color-2 rounded-2xl relative empty:after:content-['There_are_no_blacklisted_songs.'] empty:after:text-[#ccc] empty:after:absolute empty:after:top-1/2 empty:after:left-1/2 empty:after:-translate-x-1/2 empty:after:-translate-y-1/2">
                {blacklistedSongComponents}
              </div>
            </div>
          )}

          {/* DEFAULT PAGE SETTINGS */}
          <div className="main-container mb-12">
            <div className="title-container font-medium  mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Default Page
            </div>
            <div className="description">
              Change the default page you want to see when you open the app.
            </div>

            <div className="default-page-dropdown-container">
              <Dropdown
                name="defaultPageDropdown"
                className="mt-4"
                value={content.userData.defaultPage}
                options={[
                  { label: 'Home', value: 'Home' },
                  { label: 'Search', value: 'Search' },
                  { label: 'Songs', value: 'Songs' },
                  { label: 'Artists', value: 'Artists' },
                  { label: 'Albums', value: 'Albums' },
                  { label: 'Playlists', value: 'Playlists' },
                ]}
                onChange={(e) => {
                  window.api.saveUserData('defaultPage', e.target.value);
                  dispatch({
                    type: 'CHANGE_DEFAULT_PAGE',
                    data: e.target.value,
                  });
                }}
              />
            </div>
          </div>

          {/* ? PREFERENCES SETTINGS */}
          <div className="main-container preferences-settings-container mb-12">
            <div className="title-container font-medium  mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Preferences
            </div>
            <div className="checkboxes-container">
              <div className="secondary-container toggle-song-indexing mb-4">
                <div className="description">
                  Enables indexing of songs in pages. This will help you to be
                  in order.
                </div>
                <Checkbox
                  id="toggleSongIndexing"
                  isChecked={
                    userData !== undefined && userData.preferences.songIndexing
                  }
                  checkedStateUpdateFunction={(state) =>
                    toggleSongIndexing(state)
                  }
                  labelContent="Enable song indexing"
                />
              </div>
            </div>
          </div>

          {/* ? ACCESSIBILITY SETTINGS */}
          <div className="main-container accessibility-settings-container mb-12">
            <div className="title-container font-medium  mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Accessibility
            </div>
            <div className="checkbox-container">
              <div className="secondary-container toggle-reduced-motion mb-4">
                <div className="description">
                  Removes every duration of the animations that happens in the
                  app. This will also reduce the smoothness of the app.
                </div>
                <Checkbox
                  id="enableReducedMotion"
                  labelContent="Enable reduced motion"
                  isChecked={
                    userData !== undefined &&
                    userData.preferences.isReducedMotion
                  }
                  checkedStateUpdateFunction={(state) =>
                    toggleReducedMotion(state)
                  }
                />
              </div>
            </div>
          </div>

          {/* STARTUP SETTINGS */}
          <div className="main-container startup-settings-container mb-12">
            <div className="title-container font-medium  mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Startup
            </div>
            <div className="auto-launch-at-startup-checkbox-container">
              <div className="description">
                Enabling this setting will automatically launch this app when
                you log in to your computer.
              </div>
              <Checkbox
                id="toggleAppAutoLaunch"
                isChecked={
                  content && content.userData && content.userData.preferences
                    ? content.userData.preferences.autoLaunchApp
                    : false
                }
                checkedStateUpdateFunction={(state) =>
                  window.api
                    .toggleAutoLaunch(state)
                    .then(() =>
                      dispatch({ type: 'TOGGLE_AUTO_LAUNCH', data: state })
                    )
                }
                labelContent="Auto launch at startup"
              />
            </div>
          </div>

          {/* ABOUT SETTINGS */}
          <div className="main-container about-container">
            <div className="title-container font-medium mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              About
            </div>
            <div className="mb-3 text-lg flex flex-col">
              <span className="block">Oto Music for Desktop</span>
              <span className="text-sm font-light">v{version}</span>
            </div>
            <span
              className="release-notes-prompt-btn about-link text-[#6c5ce7] dark:text-[#6c5ce7] cursor-pointer w-fit hover:underline block"
              onClick={() =>
                changePromptMenuData(
                  true,
                  <ReleaseNotesPrompt />,
                  'release-notes px-8 py-4'
                )
              }
            >
              Release notes
            </span>
            <span
              className="open-source-licenses-btn about-link text-[#6c5ce7] dark:text-[#6c5ce7] cursor-pointer w-fit hover:underline block"
              onClick={() =>
                changePromptMenuData(
                  true,
                  <>
                    <div className="text-center text-3xl font-medium mb-4">
                      Open Source Licenses
                    </div>
                    <pre className="overflow-y-auto h-[750px] relative px-4 w-full">
                      {openSourceLicenses}
                    </pre>
                  </>,
                  ''
                )
              }
            >
              Open source licenses
            </span>
            <span
              className="about-link text-[#6c5ce7] dark:text-[#6c5ce7] cursor-pointer w-fit hover:underline block"
              onClick={() =>
                userData?.preferences.doNotVerifyWhenOpeningLinks
                  ? window.api.openInBrowser(
                      `https://github.com/Sandakan/Oto-Music-for-Desktop`
                    )
                  : changePromptMenuData(
                      true,
                      <OpenLinkConfirmPrompt
                        link="https://github.com/Sandakan/Oto-Music-for-Desktop"
                        title="Oto Music for Desktop Github Repository"
                      />,
                      'confirm-app-reset'
                    )
              }
            >
              Github repository
            </span>
            <span
              className="about-link text-[#6c5ce7] dark:text-[#6c5ce7] cursor-pointer w-fit hover:underline block"
              onClick={() => window.api.openLogFile()}
            >
              Open log file
            </span>
            <div className="about-buttons-container mb-8 mt-6 flex">
              <Button
                label="Reset App"
                iconName="auto_mode"
                className="rounded-2xl"
                clickHandler={() =>
                  changePromptMenuData(
                    true,
                    <ResetAppConfirmationPrompt />,
                    'confirm-app-reset'
                  )
                }
              />
              <Button
                label="Open Devtools"
                iconName="code"
                className="rounded-2xl"
                clickHandler={() => window.api.openDevtools()}
              />
              <Button
                label="Resync songs"
                iconName="sync"
                className="rounded-2xl"
                clickHandler={() => window.api.resyncSongsLibrary()}
              />
              <Button
                label="Clear History"
                iconName="clear"
                className="rounded-2xl"
                clickHandler={() => {
                  changePromptMenuData(
                    true,
                    <SensitiveActionConfirmPrompt
                      title="Confrim the action to clear Song History"
                      content={
                        <div>
                          You wouldn't be able to see what you have listened
                          previously if you decide to continue this action.
                        </div>
                      }
                      confirmButton={{
                        label: 'Clear History',
                        clickHandler: () => {
                          window.api
                            .clearSongHistory()
                            .then((res) => {
                              if (res.success) {
                                updateNotificationPanelData(
                                  5000,
                                  <span>
                                    Cleared the song history successfully.
                                  </span>
                                );
                              }
                              return changePromptMenuData(false);
                            })
                            .catch((err) => console.error(err));
                        },
                      }}
                    />
                  );
                }}
              />
            </div>
            <div className="about-description mt-4 mb-6">
              <div>
                If you have any feedback about bugs, feature requests etc. about
                the app, please let me know through my email.
              </div>
              <span
                className="about-link text-[#6c5ce7] dark:text-[#6c5ce7] cursor-pointer w-fit hover:underline block"
                onClick={() =>
                  window.api.openInBrowser(
                    'mailto:sandakannipunajith@gmail.com?subject=Regarding Oto Music for Desktop&body=If you found a bug in the app, please try to attach the log file of the app with a detailed explanation of the bug. You can get to it by going to  Settings > About > Open Log File.'
                  )
                }
              >
                Contact me
              </span>
              <div className="my-1">
                This product is licensed under the MIT license.
              </div>
              <div className="text-center mt-4 text-sm font-light">
                Made with{' '}
                <span className="heart text-foreground-color-1 dark:text-foreground-color-1">
                  &#10084;
                </span>{' '}
                by Sandakan Nipunajith. 🇱🇰
              </div>
            </div>
          </div>
        </div>
      </>
    </MainContainer>
  );
};
