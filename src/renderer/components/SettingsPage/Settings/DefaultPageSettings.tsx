import React from 'react';
import storage from 'renderer/utils/localStorage';
import { AppContext } from 'renderer/contexts/AppContext';
import Dropdown from '../../Dropdown';

const DefaultPageSettings = () => {
  const { localStorageData } = React.useContext(AppContext);
  return (
    <>
      <div className="title-container mt-1 mb-4 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">home</span>
        Default Page
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="default-page-dropdown-container">
          <div className="description">
            Change the default page you want to see when you open the app.
          </div>

          <Dropdown
            name="defaultPageDropdown"
            className="mt-4"
            value={
              localStorageData?.preferences?.defaultPageOnStartUp || 'Home'
            }
            options={[
              { label: 'Home', value: 'Home' },
              { label: 'Search', value: 'Search' },
              { label: 'Songs', value: 'Songs' },
              { label: 'Artists', value: 'Artists' },
              { label: 'Albums', value: 'Albums' },
              { label: 'Playlists', value: 'Playlists' },
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
    </>
  );
};

export default DefaultPageSettings;
