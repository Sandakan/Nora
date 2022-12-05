import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Checkbox from '../../Checkbox';

const StartupSettings = () => {
  const { userData } = React.useContext(AppContext);
  const { updateUserData } = React.useContext(AppUpdateContext);
  return (
    <>
      <div className="title-container mt-1 mb-4 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">restart_alt</span>
        Startup
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="auto-launch-at-startup-checkbox-container">
          <div className="description">
            Enabling this setting will automatically launch this app when you
            log in to your computer.
          </div>
          <Checkbox
            id="toggleAppAutoLaunch"
            isChecked={
              userData && userData.preferences
                ? userData.preferences.autoLaunchApp
                : false
            }
            checkedStateUpdateFunction={(state) =>
              window.api.toggleAutoLaunch(state).then(() =>
                updateUserData((prevUserData) => {
                  return {
                    ...prevUserData,
                    preferences: {
                      ...prevUserData.preferences,
                      autoLaunchApp: state,
                    },
                  };
                })
              )
            }
            labelContent="Auto launch at startup"
          />
        </li>
      </ul>
    </>
  );
};

export default StartupSettings;
