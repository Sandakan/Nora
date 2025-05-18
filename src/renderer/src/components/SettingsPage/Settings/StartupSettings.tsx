import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import Checkbox from '../../Checkbox';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

const StartupSettings = () => {
  const userData = useStore(store, (state) => state.userData);

  const { updateUserData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  return (
    <li className="main-container startup-settings-container mb-16">
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2">restart_alt</span>
        {t('settingsPage.startupAndWindowCustomization')}
      </div>
      <ul className="marker:bg-background-color-3 dark:marker:bg-background-color-3 list-disc pl-6">
        <li className="auto-launch-at-startup-checkbox-container mb-4">
          <div className="description">{t('settingsPage.autoLaunchAtStartDescription')}</div>
          <Checkbox
            id="toggleAppAutoLaunch"
            isChecked={
              userData && userData.preferences ? userData.preferences.autoLaunchApp : false
            }
            checkedStateUpdateFunction={(state) =>
              window.api.settingsHelpers.toggleAutoLaunch(state).then(() =>
                updateUserData((prevUserData) => {
                  return {
                    ...prevUserData,
                    preferences: {
                      ...prevUserData.preferences,
                      autoLaunchApp: state
                    }
                  };
                })
              )
            }
            labelContent={t('settingsPage.autoLaunchAtStart')}
          />
        </li>
        <li
          className={`hide-window-at-startup-checkbox-container mb-4 transition-opacity ${
            userData && !userData.preferences?.autoLaunchApp && 'cursor-not-allowed opacity-50'
          }`}
          title={
            userData && !userData?.preferences?.autoLaunchApp
              ? `'Auto Launch at Startup' should be enabled to configure these settings.`
              : undefined
          }
        >
          <div className="description">{t('settingsPage.hideWindowAtStartDescription')}</div>
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
                .saveUserData('preferences.openWindowAsHiddenOnSystemStart', state)
                .then(() =>
                  updateUserData((prevUserData) => {
                    return {
                      ...prevUserData,
                      preferences: {
                        ...prevUserData.preferences,
                        openWindowAsHiddenOnSystemStart: state
                      }
                    };
                  })
                )
            }
            labelContent={t('settingsPage.hideWindowAtStart')}
          />
        </li>
        <li className="hide-window-on-close-checkbox-container">
          <div className="description">{t('settingsPage.hideWindowOnCloseDescription')}</div>
          <Checkbox
            id="hideWindowOnClose"
            isChecked={
              userData && userData.preferences ? userData.preferences.hideWindowOnClose : false
            }
            checkedStateUpdateFunction={(state) =>
              window.api.userData.saveUserData('preferences.hideWindowOnClose', state).then(() =>
                updateUserData((prevUserData) => {
                  return {
                    ...prevUserData,
                    preferences: {
                      ...prevUserData.preferences,
                      hideWindowOnClose: state
                    }
                  };
                })
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
