import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../../contexts/AppContext';
import storage from '../../../utils/localStorage';
import Checkbox from '../../Checkbox';

const PreferencesSettings = () => {
  const { userData, localStorageData } = useContext(AppContext);
  const { t } = useTranslation();

  return (
    <li className="main-container preferences-settings-container mb-16">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">tune</span>
        {t('settingsPage.preferences')}
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="checkbox-container">
          <div className="secondary-container toggle-song-indexing mb-4">
            <div className="description">{t('settingsPage.songIndexingDescription')}</div>
            <Checkbox
              id="isSongIndexingEnabled"
              isChecked={
                localStorageData !== undefined && localStorageData.preferences.isSongIndexingEnabled
              }
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences('isSongIndexingEnabled', state)
              }
              labelContent={t('settingsPage.enableSongIndexing')}
            />
          </div>
        </li>

        <li className="checkbox-container">
          <div className="secondary-container toggle-song-indexing mb-4">
            <div className="description">
              {t('settingsPage.showTrackNumberAsSongIndexDescription')}
            </div>
            <Checkbox
              id="showTrackNumberAsSongIndex"
              isChecked={
                localStorageData !== undefined &&
                localStorageData.preferences.showTrackNumberAsSongIndex
              }
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences('showTrackNumberAsSongIndex', state)
              }
              labelContent={t('settingsPage.showTrackNumberAsSongIndex')}
            />
          </div>
        </li>

        <li className="checkbox-container">
          <div className="secondary-container show-artists-artwork-near-song-controls mb-4">
            <div className="description">
              {t('settingsPage.showArtistArtworkNearSongControlsDescription')}
            </div>
            <Checkbox
              id="showArtistArtworkNearSongControls"
              isChecked={
                userData !== undefined &&
                localStorageData.preferences.showArtistArtworkNearSongControls
              }
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences('showArtistArtworkNearSongControls', state)
              }
              labelContent={t('settingsPage.showArtistArtworkNearSongControls')}
            />
          </div>
        </li>

        <li className="checkbox-container">
          <div className="secondary-container disable-background-artworks mb-4">
            <div className="description">
              {t('settingsPage.disableBackgroundArtworksDescription')}
            </div>
            <Checkbox
              id="disableBackgroundArtwork"
              isChecked={
                localStorageData !== undefined &&
                localStorageData.preferences.disableBackgroundArtworks
              }
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences('disableBackgroundArtworks', state)
              }
              labelContent={t('settingsPage.disableBackgroundArtworks')}
            />
          </div>
        </li>

        <li className="checkbox-container">
          <div className="secondary-container enable-artwork-from-song-covers mb-4">
            <div className="description">{t('settingsPage.playlistArtworksDescription')}</div>
            <Checkbox
              id="enableArtworkFromSongCovers"
              className="mb-2"
              isChecked={
                localStorageData !== undefined &&
                localStorageData.preferences.enableArtworkFromSongCovers
              }
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences('enableArtworkFromSongCovers', state)
              }
              labelContent={t('settingsPage.enablePlaylistArtworks')}
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
                storage.preferences.setPreferences('shuffleArtworkFromSongCovers', state)
              }
              labelContent={t('settingsPage.shuffleArtworkFromSongCovers')}
            />
          </div>
        </li>
      </ul>
    </li>
  );
};

export default PreferencesSettings;
