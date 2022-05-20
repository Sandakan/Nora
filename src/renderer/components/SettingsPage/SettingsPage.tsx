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
import { version } from '../../../../package.json';

interface SettingsReducer {
  userData: UserData;
}

type SettingsReducerActionTypes = 'UPDATE_USER_DATA' | 'CHANGE_DEFAULT_PAGE';

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
  } = useContext(AppContext);
  const [content, dispatch] = React.useReducer(reducer, {
    userData: {},
  } as SettingsReducer);
  React.useEffect(() => {
    window.api
      .getUserData()
      .then((res) => dispatch({ type: 'UPDATE_USER_DATA', data: res }))
      .catch((err) => console.log(err));
  }, []);

  const musicFolders = content.userData.musicFolders
    ? content.userData.musicFolders.map((musicFolder, index) => {
        return <MusicFolder key={index} musicFolder={musicFolder} />;
      })
    : [];
  return (
    <div className="main-container settings-container">
      <div className="title-container">Settings</div>
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
      <div className="main-container">
        <div className="title-container">Music Folders</div>
        <div className="description">
          Tell us where to look for your songs to create you an amazing music
          library.
        </div>
        <div className="music-folders">{musicFolders}</div>
        <button
          type="button"
          className="add-new-music-folder-btn"
          onClick={async () => {
            const data = await window.api.addMusicFolder();
            if (data.length > 0)
              window.api
                .getUserData()
                .then((res) =>
                  dispatch({ type: 'UPDATE_USER_DATA', data: res })
                )
                .catch((err) => console.log(err));
          }}
        >
          <span className="material-icons-round icon">add</span> Add New Folder
        </button>
      </div>
      <div className="main-container">
        <div className="title-container">Default Page</div>
        <div className="description">
          Change the default page you want to see when you open the app.
        </div>
        <div className="default-page-dropdown-container">
          <select
            name="defaultPageDropdown"
            id="defaultPageDropdown"
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
      <div className="main-container about-container">
        <div className="title-container">About</div>
        <span
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
        </span>
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
