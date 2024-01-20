import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from 'renderer/contexts/AppContext';
import storage from 'renderer/utils/localStorage';
import Checkbox from '../../Checkbox';

const PerformanceSettings = () => {
  const { localStorageData } = React.useContext(AppContext);
  const { t } = useTranslation();

  return (
    <li className="main-container performance-settings-container mb-16">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2 leading-none">
          offline_bolt
        </span>
        <span> {t('settingsPage.performance')}</span>
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="secondary-container toggle-remove-animations-on-battery-power mb-4">
          <div className="description">
            {t('settingsPage.removeAnimationOnBatteryDescription')}
          </div>
          <Checkbox
            id="removeAnimationsOnBatteryPower"
            labelContent={t('settingsPage.removeAnimationOnBattery')}
            isChecked={
              localStorageData !== undefined &&
              localStorageData.preferences.removeAnimationsOnBatteryPower
            }
            checkedStateUpdateFunction={(state) =>
              storage.preferences.setPreferences(
                'removeAnimationsOnBatteryPower',
                state,
              )
            }
          />
        </li>
        <li className="secondary-container toggle-allow-to-prevent-screen-sleeping mb-4">
          <div className="description">
            {t('settingsPage.allowToPreventScreenSleepingDescription')}
          </div>
          <Checkbox
            id="allowToPreventScreenSleeping"
            labelContent={t('settingsPage.allowToPreventScreenSleeping')}
            isChecked={
              localStorageData !== undefined &&
              localStorageData.preferences.allowToPreventScreenSleeping
            }
            checkedStateUpdateFunction={(state) =>
              storage.preferences.setPreferences(
                'allowToPreventScreenSleeping',
                state,
              )
            }
          />
        </li>
      </ul>
    </li>
  );
};

export default PerformanceSettings;
