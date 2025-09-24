import { useTranslation } from 'react-i18next';
import Checkbox from '../../Checkbox';
import { useMutation, useQuery } from '@tanstack/react-query';
import { settingsQuery } from '@renderer/queries/settings';
import { queryClient } from '@renderer/index';

const StartupSettings = () => {
  const { data: userSettings } = useQuery(settingsQuery.all);

  const { t } = useTranslation();

  const { mutate: updateOpenWindowAsHiddenOnSystemStart } = useMutation({
    mutationFn: (enableHidden: boolean) =>
      window.api.settings.updateOpenWindowAsHiddenOnSystemStart(enableHidden),
    onSettled: () => {
      queryClient.invalidateQueries(settingsQuery.all);
    }
  });

  const { mutate: updateHideWindowOnCloseState } = useMutation({
    mutationFn: (hideOnClose: boolean) =>
      window.api.settings.updateHideWindowOnCloseState(hideOnClose),
    onSettled: () => {
      queryClient.invalidateQueries(settingsQuery.all);
    }
  });

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
            isChecked={userSettings ? userSettings.autoLaunchApp : false}
            checkedStateUpdateFunction={(state) =>
              window.api.settingsHelpers.toggleAutoLaunch(state)
            }
            labelContent={t('settingsPage.autoLaunchAtStart')}
          />
        </li>
        <li
          className={`hide-window-at-startup-checkbox-container mb-4 transition-opacity ${
            userSettings && !userSettings.autoLaunchApp && 'cursor-not-allowed opacity-50'
          }`}
          title={
            userSettings && !userSettings?.autoLaunchApp
              ? `'Auto Launch at Startup' should be enabled to configure these settings.`
              : undefined
          }
        >
          <div className="description">{t('settingsPage.hideWindowAtStartDescription')}</div>
          <Checkbox
            id="hideWindowOnStartup"
            isChecked={
              userSettings && userSettings ? userSettings.openWindowAsHiddenOnSystemStart : false
            }
            isDisabled={userSettings && !userSettings.autoLaunchApp}
            checkedStateUpdateFunction={(state) => updateOpenWindowAsHiddenOnSystemStart(state)}
            labelContent={t('settingsPage.hideWindowAtStart')}
          />
        </li>
        <li className="hide-window-on-close-checkbox-container">
          <div className="description">{t('settingsPage.hideWindowOnCloseDescription')}</div>
          <Checkbox
            id="hideWindowOnClose"
            isChecked={userSettings ? userSettings.hideWindowOnClose : false}
            checkedStateUpdateFunction={(state) => updateHideWindowOnCloseState(state)}
            labelContent={t('settingsPage.hideWindowOnClose')}
          />
        </li>
      </ul>
    </li>
  );
};

export default StartupSettings;
