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
        Startup and Window Customization
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="auto-launch-at-startup-checkbox-container mb-4">
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
        <li
          className={`hide-window-at-startup-checkbox-container mb-4 transition-opacity ${
            userData &&
            !userData.preferences?.autoLaunchApp &&
            'cursor-not-allowed opacity-50'
          }`}
          title={
            userData && !userData?.preferences?.autoLaunchApp
              ? `'Auto Launch at Startup' should be enabled to configure these settings.`
              : undefined
          }
        >
          <div className="description">
            Configure how the window should behave when you log in to your
            computer.
          </div>
          <Checkbox
            id="hideWindowOnStartup"
            isChecked={
              userData && userData.preferences
                ? userData.preferences.openWindowAsHiddenOnSystemStart
                : false
            }
            isDisabled={userData && !userData.preferences?.autoLaunchApp}
            checkedStateUpdateFunction={(state) =>
              window.api
                .saveUserData(
                  'preferences.openWindowAsHiddenOnSystemStart',
                  state
                )
                .then(() =>
                  updateUserData((prevUserData) => {
                    return {
                      ...prevUserData,
                      preferences: {
                        ...prevUserData.preferences,
                        openWindowAsHiddenOnSystemStart: state,
                      },
                    };
                  })
                )
            }
            labelContent="Launch app with the window hidden on startup"
          />
        </li>
        <li className="hide-window-on-close-checkbox-container">
          <div className="description">
            Configure how the window should behave when you close the window.
          </div>
          <Checkbox
            id="hideWindowOnClose"
            isChecked={
              userData && userData.preferences
                ? userData.preferences.hideWindowOnClose
                : false
            }
            checkedStateUpdateFunction={(state) =>
              window.api
                .saveUserData('preferences.hideWindowOnClose', state)
                .then(() =>
                  updateUserData((prevUserData) => {
                    return {
                      ...prevUserData,
                      preferences: {
                        ...prevUserData.preferences,
                        hideWindowOnClose: state,
                      },
                    };
                  })
                )
            }
            labelContent="Hide window to the system tray when close button is clicked."
          />
        </li>
      </ul>
    </>
  );
};

export default StartupSettings;
