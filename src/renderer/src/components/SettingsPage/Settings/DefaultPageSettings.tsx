import { useTranslation } from 'react-i18next';
import storage from '../../../utils/localStorage';
import Dropdown from '../../Dropdown';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

const DefaultPageSettings = () => {
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { t } = useTranslation();

  return (
    <li className="main-container mb-16" id="default-page-settings-container">
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2">home</span>
        {t('settingsPage.defaultPage')}
      </div>
      <ul className="marker:bg-background-color-3 dark:marker:bg-background-color-3 list-disc pl-6">
        <li className="default-page-dropdown-container">
          <div className="description"> {t('settingsPage.changeDefaultPageDescription')}</div>

          <Dropdown
            name="defaultPageDropdown"
            className="mt-4"
            value={preferences?.defaultPageOnStartUp || 'Home'}
            options={[
              { label: t('sideBar.home'), value: 'Home' },
              { label: t('sideBar.search'), value: 'Search' },
              { label: t('common.song_other'), value: 'Songs' },
              { label: t('common.playlist_other'), value: 'Playlists' },
              { label: t('common.artist_other'), value: 'Artists' },
              { label: t('common.album_other'), value: 'Albums' },
              { label: t('common.genre_other'), value: 'Genres' }
            ]}
            onChange={(e) => {
              storage.preferences.setPreferences(
                'defaultPageOnStartUp',
                e.target.value as DefaultPages
              );
            }}
          />
        </li>
      </ul>
    </li>
  );
};

export default DefaultPageSettings;
