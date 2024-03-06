import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import { AppContext } from '../../../contexts/AppContext';
import Checkbox from '../../Checkbox';

const StartupSettings = () => {
  const { userData } = React.useContext(AppContext);
  const { updateUserData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  return (
    <li className="main-container startup-settings-container mb-16">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">restart_alt</span>
        {t('settingsPage.startupAndWindowCustomization')}
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="auto-launch-at-startup-checkbox-container mb-4">
          <div className="description">
            {t('settingsPage.autoLaunchAtStartDescription')}
          </div>
          <Checkbox
            id="toggleAppAutoLaunch"
            isChecked={
              userData && userData.preferences
                ? userData.preferences.autoLaunchApp
                : false
            }
            checkedStateUpdateFunction={(state) =>
              window.api.settingsHelpers.toggleAutoLaunch(state).then(() =>
                updateUserData((prevUserData) => {
                  return {
                    ...prevUserData,
                    preferences: {
                      ...prevUserData.preferences,
                      autoLaunchApp: state,
                    },
                  };
                }),
              )
            }
            labelContent={t('settingsPage.autoLaunchAtStart')}
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
            {t('settingsPage.hideWindowAtStartDescription')}
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
              window.api.userData
                .saveUserData(
                  'preferences.openWindowAsHiddenOnSystemStart',
                  state,
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
                  }),
                )
            }
            labelContent={t('settingsPage.hideWindowAtStart')}
          />
        </li>
        <li className="hide-window-on-close-checkbox-container">
          <div className="description">
            {t('settingsPage.hideWindowOnCloseDescription')}
          </div>
          <Checkbox
            id="hideWindowOnClose"
            isChecked={
              userData && userData.preferences
                ? userData.preferences.hideWindowOnClose
                : false
            }
            checkedStateUpdateFunction={(state) =>
              window.api.userData
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
                  }),
                )
            }
            labelContent={t('settingsPage.hideWindowOnClose')}
          />
        </li>
      </ul>
    </li>
  );
};

export default StartupSettings;
