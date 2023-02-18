import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Dropdown from '../../Dropdown';

const DefaultPageSettings = () => {
  const { userData } = React.useContext(AppContext);
  const { updateUserData } = React.useContext(AppUpdateContext);
  return (
    <>
      <div className="title-container mt-1 mb-4 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">home</span>
        Default Page
      </div>
      <div className="description">
        Change the default page you want to see when you open the app.
      </div>

      <div className="default-page-dropdown-container">
        <Dropdown
          name="defaultPageDropdown"
          className="mt-4"
          value={userData?.defaultPage || ('Home' as DefaultPages)}
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
            updateUserData((prevUserData) => {
              return {
                ...prevUserData,
                defaultPage: e.currentTarget.value as DefaultPages,
              };
            });
          }}
        />
      </div>
    </>
  );
};

export default DefaultPageSettings;
