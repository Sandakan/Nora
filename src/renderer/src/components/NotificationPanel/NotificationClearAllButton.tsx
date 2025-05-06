import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Button from '../Button';

const NotificationClearAllButton = () => {
  const { updateNotifications } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  return (
    <Button
      label={t('notifications.clearAll')}
      key="ClearAllBtn"
      clickHandler={() => updateNotifications(() => [])}
      className="notification appear-from-bottom group bg-context-menu-background/90 text-font-color-black animate-delay-200! hover:text-font-color-highlight dark:bg-dark-context-menu-background/90 dark:text-font-color-white dark:hover:text-dark-font-color-highlight mt-4 mr-0! flex h-fit max-h-32 min-h-[40px] w-fit max-w-sm justify-between rounded-2xl border-0! py-2 text-sm font-light shadow-[5px_25px_50px_0px_rgba(0,0,0,0.2)] backdrop-blur-xs transition-[opacity,transform,visibility] duration-100! ease-in-out first:mt-0"
      iconName="close"
    />
  );
};

export default NotificationClearAllButton;
