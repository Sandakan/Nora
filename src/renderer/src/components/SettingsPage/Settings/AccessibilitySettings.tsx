import { useTranslation } from 'react-i18next';
import storage from '../../../utils/localStorage';
import Checkbox from '../../Checkbox';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

const AccessibilitySettings = () => {
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const { t } = useTranslation();

  return (
    <li className="main-container accessibility-settings-container mb-16">
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2">settings_accessibility</span>
        {t('settingsPage.accessibility')}
      </div>
      <ul className="marker:bg-background-color-3 dark:marker:bg-background-color-3 list-disc pl-6">
        <li className="secondary-container toggle-reduced-motion mb-4">
          <div className="description">{t('settingsPage.reducedMotionDescription')}</div>
          <Checkbox
            id="enableReducedMotion"
            labelContent={t('settingsPage.enableReducedMotion')}
            isChecked={preferences?.isReducedMotion}
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
