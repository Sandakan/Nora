import { useTranslation } from 'react-i18next';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';
import storage from '../../../utils/localStorage';
import Checkbox from '../../Checkbox';

const PreferencesSettings = () => {
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const { t } = useTranslation();

  return (
    <li
      className="main-container preferences-settings-container mb-16"
      id="preferences-settings-container"
    >
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2">tune</span>
        {t('settingsPage.preferences')}
      </div>
      <ul className="marker:bg-background-color-3 dark:marker:bg-background-color-3 list-disc pl-6">
        <li className="checkbox-container">
          <div className="secondary-container toggle-song-indexing mb-4">
            <div className="description">{t('settingsPage.songIndexingDescription')}</div>
            <Checkbox
              id="isSongIndexingEnabled"
              isChecked={preferences?.isSongIndexingEnabled}
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
              isChecked={preferences?.showTrackNumberAsSongIndex}
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
              isChecked={preferences?.showArtistArtworkNearSongControls}
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
              isChecked={preferences?.disableBackgroundArtworks}
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
              isChecked={preferences?.enableArtworkFromSongCovers}
              checkedStateUpdateFunction={(state) =>
                storage.preferences.setPreferences('enableArtworkFromSongCovers', state)
              }
              labelContent={t('settingsPage.enablePlaylistArtworks')}
            />
            <Checkbox
              id="shuffleArtworkFromSongCovers"
              isDisabled={!preferences?.enableArtworkFromSongCovers}
              isChecked={preferences?.shuffleArtworkFromSongCovers}
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
