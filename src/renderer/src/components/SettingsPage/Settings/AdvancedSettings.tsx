import { useTranslation } from 'react-i18next';
import Checkbox from '../../Checkbox';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';
import { useContext } from 'react';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';

const AdvancedSettings = () => {
  const userData = useStore(store, (state) => state.userData);

  const { updateUserData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  return (
    <li className="main-container performance-settings-container mb-16">
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2 leading-none">handyman</span>
        <span> {t('settingsPage.advanced')}</span>
      </div>
      <ul className="marker:bg-background-color-3 dark:marker:bg-background-color-3 list-disc pl-6">
        <li className="secondary-container toggle-save-verbose-logs mb-4">
          <div className="description">{t('settingsPage.saveVerboseLogsDescription')}</div>
          <Checkbox
            id="toggleSaveVerboseLogs"
            labelContent={t('settingsPage.saveVerboseLogs')}
            isChecked={
              userData && userData.preferences ? userData.preferences.saveVerboseLogs : false
            }
            checkedStateUpdateFunction={(state) =>
              window.api.userData.saveUserData('preferences.saveVerboseLogs', state).then(() =>
                updateUserData((prevUserData) => {
                  return {
                    ...prevUserData,
                    preferences: {
                      ...prevUserData.preferences,
                      saveVerboseLogs: state
                    }
                  };
                })
              )
            }
          />
        </li>
      </ul>
    </li>
  );
};

export default AdvancedSettings;
