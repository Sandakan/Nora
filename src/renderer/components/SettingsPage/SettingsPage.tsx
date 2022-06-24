/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import MusicFolder from './MusicFolder';
import Button from '../Button';
import Checkbox from '../Checkbox';
import { version } from '../../../../package.json';
import ResetAppConfirmationPrompt from '../HomePage/ResetAppConfirmationPrompt';
import BlacklistedSong from './BlacklistedSong';

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
  const {
    isDarkMode,
    toggleDarkMode,
    changePromptMenuData,
    updateNotificationPanelData,
    userData,
    toggleReducedMotion,
    toggleSongIndexing,
  } = useContext(AppContext);
  const [content, dispatch] = React.useReducer(reducer, {
    userData: {},
  } as SettingsReducer);

  React.useEffect(() => {
    window.api
      .getUserData()
      .then((res) => dispatch({ type: 'UPDATE_USER_DATA', data: res }))
      .catch((err) => console.error(err));
  }, []);

  const musicFolders = content.userData.musicFolders
    ? content.userData.musicFolders.map((musicFolder, index) => {
        return <MusicFolder key={index} musicFolder={musicFolder} />;
      })
    : [];
  return (
    <div className="main-container settings-container appear-from-bottom">
      <div className="title-container">Settings</div>

      {/*  THEME SETTINGS */}
      <div className="main-container">
        <div className="title-container">Theme</div>
        <div className="description">
          Change the of the application as you need. We don&apos;t take you
          granted for it...
        </div>
        <div className="theme-change-radio-btns">
          <div className="theme-change-radio-btn">
            <input
              type="radio"
              name="theme"
              value="lightTheme"
              id="lightThemeRadioBtn"
              defaultChecked={!isDarkMode}
              onClick={() => toggleDarkMode('light')}
            />
            <label htmlFor="lightThemeRadioBtn">Light Theme</label>
          </div>
          <div className="theme-change-radio-btn">
            <input
              type="radio"
              name="theme"
              value="darkTheme"
              id="darkThemeRadioBtn"
              defaultChecked={isDarkMode}
              onClick={() => toggleDarkMode('dark')}
            />
            <label htmlFor="darkThemeRadioBtn">Dark Theme</label>
          </div>
        </div>
      </div>

      {/* MUSIC FOLDERS SETTINGS */}
      <div className="main-container">
        <div className="title-container">Music Folders</div>
        <div className="description">
          Tell us where to look for your songs to create you an amazing music
          library.
        </div>
        <div className="music-folders">{musicFolders}</div>
        <Button
          label="Add Music Folder"
          iconName="add"
          className="add-new-music-folder-btn"
          clickHandler={async () => {
            const data = await window.api
              .addMusicFolder()
              .catch((err) => console.error(err));
            if (data && data.length > 0)
              window.api
                .getUserData()
                .then((res) =>
                  dispatch({ type: 'UPDATE_USER_DATA', data: res })
                )
                .catch((err) => console.error(err));
          }}
        />
      </div>

      {/* BLACKLISTED SONGS SETTINGS */}
      {content.userData && content.userData.songBlacklist && (
        <div className="main-container blacklisted-songs-container">
          <div className="title-container">Blacklisted Songs</div>
          <div className="description">
            Songs that have been removed from the library will appear here.
          </div>
          <div className="blacklisted-songs">
            {content.userData.songBlacklist.map((songPath, index) => (
              <BlacklistedSong songPath={songPath} key={index} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* DEFAULT PAGE SETTINGS */}
      <div className="main-container">
        <div className="title-container">Default Page</div>
        <div className="description">
          Change the default page you want to see when you open the app.
        </div>

        <div className="default-page-dropdown-container">
          <select
            name="defaultPageDropdown"
            id="defaultPageDropdown"
            className="dropdown"
            value={content.userData.defaultPage}
            onChange={(e) => {
              window.api.saveUserData('defaultPage', e.target.value);
              dispatch({ type: 'CHANGE_DEFAULT_PAGE', data: e.target.value });
            }}
          >
            <option value="Home">Home</option>
            <option value="Search">Search</option>
            <option value="Songs">Songs</option>
            <option value="Artists">Artists</option>
            <option value="Albums">Albums</option>
            <option value="Playlists">Playlists</option>
          </select>
        </div>
      </div>

      {/* ? ACCESSIBILITY SETTINGS */}
      <div className="main-container accessibility-settings-container">
        <div className="title-container">Accessibility</div>
        <div className="reduced-motion-checkbox-container">
          <div className="secondary-container toggle-reduced-motion">
            <div className="description">
              Removes every duration of the animations that happens in the app.
              This will also reduce the smoothness of the app.
            </div>
            <Checkbox
              id="enableReducedMotion"
              labelContent="Enable reduced motion"
              isChecked={
                userData !== undefined && userData.preferences.isReducedMotion
              }
              checkedStateUpdateFunction={(state) => toggleReducedMotion(state)}
            />
          </div>
          <div className="secondary-container toggle-song-indexing">
            <div className="description">
              Enables indexing of songs in pages. This will help you to be in
              order.
            </div>
            <Checkbox
              id="toggleSongIndexing"
              isChecked={
                userData !== undefined && userData.preferences.songIndexing
              }
              checkedStateUpdateFunction={(state) => toggleSongIndexing(state)}
              labelContent="Enable song indexing"
            />
          </div>
        </div>
      </div>

      {/* STARTUP SETTINGS */}
      <div className="main-container startup-settings-container">
        <div className="title-container">Startup</div>
        <div className="auto-launch-at-startup-checkbox-container">
          <div className="description">
            Enabling this setting will automatically launch this app when you
            log in to your computer.
          </div>
          <Checkbox
            id="toggleAppAutoLaunch"
            isChecked={
              content && content.userData && content.userData.preferences
                ? content.userData.preferences.autoLaunchApp
                : false
            }
            // TODO - Add support for auto lanching the app.
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
        <div className="title-container">About</div>
        {/* <span
          className="release-notes-prompt-btn about-link"
          onClick={async () => {
            const data = await fetch(
              'https://raw.githubusercontent.com/Sandakan/Oto-Music-for-Desktop/master/changelog.md'
            );
            const res = await data.text();
            changePromptMenuData(
              true,
              <div dangerouslySetInnerHTML={{ __html: res }} />,
              'release-notes'
            );
          }}
        >
          Release notes
        </span> */}
        <span
          className="open-source-licenses-btn about-link"
          onClick={() =>
            updateNotificationPanelData(
              5000,
              <span>
                Open source licenses will be added in an upcoming release.
              </span>
            )
          }
        >
          Open source licenses
        </span>
        <span
          className="about-link"
          onClick={() =>
            window.api.openInBrowser(
              'https://github.com/Sandakan/Oto-Music-for-Desktop'
            )
          }
        >
          Github repository
        </span>
        <span className="about-link" onClick={() => window.api.openLogFile()}>
          Open log file
        </span>
        <div className="about-buttons-container">
          <Button
            label="Reset App"
            iconName="auto_mode"
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
            clickHandler={() => window.api.openDevtools()}
          />
        </div>
        <div className="about-description">
          <div>{`Oto Music for Desktop v${version}`}</div>
          <div>
            Made with <span className="heart">&#10084;</span> by Sandakan
            Nipunajith.
          </div>
        </div>
      </div>
    </div>
  );
};
