import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import storage from 'renderer/utils/localStorage';
import Checkbox from '../../Checkbox';

const PreferencesSettings = () => {
  const { userData, localStorageData } = React.useContext(AppContext);

  return (
    <li className="main-container preferences-settings-container mb-16">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
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
              id="isSongIndexingEnabled"
              isChecked={
                localStorageData !== undefined &&
                localStorageData.preferences.isSongIndexingEnabled
              }
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences(
                  'isSongIndexingEnabled',
                  state
                )
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
                localStorageData.preferences.showArtistArtworkNearSongControls
              }
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences(
                  'showArtistArtworkNearSongControls',
                  state
                )
              }
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
                localStorageData !== undefined &&
                localStorageData.preferences.disableBackgroundArtworks
              }
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences(
                  'disableBackgroundArtworks',
                  state
                )
              }
              labelContent="Disable background artworks"
            />
          </div>
        </li>

        <li className="checkbox-container">
          <div className="secondary-container enable-artwork-from-song-covers mb-4">
            <div className="description">
              Configure settings related to the artwork made from song covers.
            </div>
            <Checkbox
              id="enableArtworkFromSongCovers"
              className="mb-2"
              isChecked={
                localStorageData !== undefined &&
                localStorageData.preferences.enableArtworkFromSongCovers
              }
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences(
                  'enableArtworkFromSongCovers',
                  state
                )
              }
              labelContent="Enable artwork made from song covers on Playlists"
            />
            <Checkbox
              id="shuffleArtworkFromSongCovers"
              isDisabled={
                !(
                  localStorageData !== undefined &&
                  localStorageData.preferences.enableArtworkFromSongCovers
                )
              }
              isChecked={
                localStorageData !== undefined &&
                localStorageData.preferences.shuffleArtworkFromSongCovers
              }
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences(
                  'shuffleArtworkFromSongCovers',
                  state
                )
              }
              labelContent="Enable shuffling the artwork made from song covers"
            />
          </div>
        </li>
      </ul>
    </li>
  );
};

export default PreferencesSettings;
