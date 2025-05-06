import { useTranslation } from 'react-i18next';
import storage from '../../../utils/localStorage';
import Checkbox from '../../Checkbox';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const PerformanceSettings = () => {
  const localStorageData = useStore(store, (state) => state.localStorage);

  const { t } = useTranslation();

  return (
    <li className="main-container performance-settings-container mb-16">
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2 leading-none">offline_bolt</span>
        <span> {t('settingsPage.performance')}</span>
      </div>
      <ul className="marker:bg-background-color-3 dark:marker:bg-background-color-3 list-disc pl-6">
        <li className="secondary-container toggle-remove-animations-on-battery-power mb-4">
          <div className="description">{t('settingsPage.removeAnimationOnBatteryDescription')}</div>
          <Checkbox
            id="removeAnimationsOnBatteryPower"
            labelContent={t('settingsPage.removeAnimationOnBattery')}
            isChecked={
              localStorageData !== undefined &&
              localStorageData.preferences.removeAnimationsOnBatteryPower
            }
            checkedStateUpdateFunction={(state) =>
              storage.preferences.setPreferences('removeAnimationsOnBatteryPower', state)
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
              storage.preferences.setPreferences('allowToPreventScreenSleeping', state)
            }
          />
        </li>
      </ul>
    </li>
  );
};

export default PerformanceSettings;
