import { useTranslation } from 'react-i18next';
import Checkbox from '../../Checkbox';
import { useMutation, useQuery } from '@tanstack/react-query';
import { settingsQuery } from '@renderer/queries/settings';
import { queryClient } from '@renderer/index';
import CollapsibleSection from "./CollapsibleSection";

const AdvancedSettings = () => {
  const { data: userSettings } = useQuery(settingsQuery.all);

  const { t } = useTranslation();

  const { mutate: updateSaveVerboseLogs } = useMutation({
    mutationFn: (enable: boolean) => window.api.settings.updateSaveVerboseLogs(enable),
    onSettled: () => {
      queryClient.invalidateQueries(settingsQuery.all);
    }
  });

  return (
    <li
      className="main-container performance-settings-container mb-4"
      id="advanced-settings-container"
    >
    <CollapsibleSection
      defaultOpen={false}
      title={
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2 leading-none">handyman</span>
        <span> {t('settingsPage.advanced')}</span>
      </div>
      }
    >
      <ul className="marker:bg-background-color-3 dark:marker:bg-background-color-3 list-disc pl-6">
        <li className="secondary-container toggle-save-verbose-logs mb-4">
          <div className="description">{t('settingsPage.saveVerboseLogsDescription')}</div>
          <Checkbox
            id="toggleSaveVerboseLogs"
            labelContent={t('settingsPage.saveVerboseLogs')}
            isChecked={userSettings ? userSettings.saveVerboseLogs : false}
            checkedStateUpdateFunction={(state) => updateSaveVerboseLogs(state)}
          />
        </li>
      </ul>
    </CollapsibleSection>
    </li>
  );
};

export default AdvancedSettings;
