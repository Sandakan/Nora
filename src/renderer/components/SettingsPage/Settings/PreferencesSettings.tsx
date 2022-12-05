import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Checkbox from '../../Checkbox';

const PreferencesSettings = () => {
  const { userData } = React.useContext(AppContext);
  const { updateUserData } = React.useContext(AppUpdateContext);

  return (
    <>
      {' '}
      <div className="title-container mt-1 mb-4 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">tune</span>
        Preferences
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="checkbox-container">
          <div className="secondary-container toggle-song-indexing mb-4">
            <div className="description">
              Enables indexing of songs in pages. This will help you to be in
              order.
            </div>
            <Checkbox
              id="toggleSongIndexing"
              isChecked={
                userData !== undefined && userData.preferences.songIndexing
              }
              checkedStateUpdateFunction={(state) =>
                updateUserData(async (prevUserData) => {
                  await window.api.saveUserData(
                    'preferences.songIndexing',
                    state
                  );
                  return {
                    ...prevUserData,
                    preferences: {
                      ...prevUserData.preferences,
                      songIndexing: state,
                    },
                  };
                })
              }
              labelContent="Enable song indexing"
            />
          </div>
        </li>
        <li className="checkbox-container">
          <div className="secondary-container show-artists-artwork-near-song-controls mb-4">
            <div className="description">
              Shows artist artworks next to the artist names near the title of
              the song on the song controls panel.
            </div>
            <Checkbox
              id="showArtistArtworkNearSongControls"
              isChecked={
                userData !== undefined &&
                userData.preferences.showArtistArtworkNearSongControls
              }
              checkedStateUpdateFunction={(state) => {
                window.api.saveUserData(
                  'preferences.showArtistArtworkNearSongControls',
                  state
                );
                updateUserData((prevData) => ({
                  ...prevData,
                  preferences: {
                    ...prevData.preferences,
                    showArtistArtworkNearSongControls: state,
                  },
                }));
              }}
              labelContent="Show artists artworks next to their names"
            />
          </div>
        </li>
        <li className="checkbox-container">
          <div className="secondary-container disable-background-artworks mb-4">
            <div className="description">
              Disables the background artworks that appears when visiting
              certain pages.
            </div>
            <Checkbox
              id="disableBackgroundArtwork"
              isChecked={
                userData !== undefined &&
                userData.preferences.disableBackgroundArtworks
              }
              checkedStateUpdateFunction={(state) => {
                window.api.saveUserData(
                  'preferences.disableBackgroundArtworks',
                  state
                );
                updateUserData((prevData) => ({
                  ...prevData,
                  preferences: {
                    ...prevData.preferences,
                    disableBackgroundArtworks: state,
                  },
                }));
              }}
              labelContent="Disable background artworks"
            />
          </div>
        </li>
      </ul>
    </>
  );
};

export default PreferencesSettings;
