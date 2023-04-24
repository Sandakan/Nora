import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import storage from 'renderer/utils/localStorage';
import Checkbox from '../../Checkbox';

const PerformanceSettings = () => {
  const { localStorageData } = React.useContext(AppContext);

  return (
    <li className="main-container performance-settings-container mb-16">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2 leading-none">
          offline_bolt
        </span>
        <span>Performance</span>
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="secondary-container toggle-remove-animations-on-battery-power mb-4">
          <div className="description">
            Removes animation that appears in the app when system is on battery
            power.
          </div>
          <Checkbox
            id="removeAnimationsOnBatteryPower"
            labelContent="Remove animations when in battery power"
            isChecked={
              localStorageData !== undefined &&
              localStorageData.preferences.removeAnimationsOnBatteryPower
            }
            checkedStateUpdateFunction={(state) =>
              storage.preferences.setPreferences(
                'removeAnimationsOnBatteryPower',
                state
              )
            }
          />
        </li>
      </ul>
    </li>
  );
};

export default PerformanceSettings;
