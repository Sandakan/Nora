import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import storage from 'renderer/utils/localStorage';
import Checkbox from '../../Checkbox';

const AccessibilitySettings = () => {
  const { localStorageData } = React.useContext(AppContext);

  return (
    <>
      <div className="title-container mt-1 mb-4 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">
          settings_accessibility
        </span>
        Accessibility
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="secondary-container toggle-reduced-motion mb-4">
          <div className="description">
            Removes animation that appears in the app. This will also reduce the
            smoothness of the app.
          </div>
          <Checkbox
            id="enableReducedMotion"
            labelContent="Enable reduced motion"
            isChecked={
              localStorageData !== undefined &&
              localStorageData.preferences.isReducedMotion
            }
            checkedStateUpdateFunction={(state) =>
              storage.preferences.setPreferences('isReducedMotion', state)
            }
          />
        </li>
      </ul>
    </>
  );
};

export default AccessibilitySettings;
