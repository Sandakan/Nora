import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../../contexts/AppContext';
import storage from '../../../utils/localStorage';
import Checkbox from '../../Checkbox';

const AccessibilitySettings = () => {
  const { localStorageData } = React.useContext(AppContext);
  const { t } = useTranslation();

  return (
    <li className="main-container accessibility-settings-container mb-16">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">settings_accessibility</span>
        {t('settingsPage.accessibility')}
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="secondary-container toggle-reduced-motion mb-4">
          <div className="description">{t('settingsPage.reducedMotionDescription')}</div>
          <Checkbox
            id="enableReducedMotion"
            labelContent={t('settingsPage.enableReducedMotion')}
            isChecked={
              localStorageData !== undefined && localStorageData.preferences.isReducedMotion
            }
            checkedStateUpdateFunction={(state) =>
              storage.preferences.setPreferences('isReducedMotion', state)
            }
          />
        </li>
      </ul>
    </li>
  );
};

export default AccessibilitySettings;
