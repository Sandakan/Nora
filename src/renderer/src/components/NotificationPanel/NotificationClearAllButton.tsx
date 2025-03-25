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
      className="notification appear-from-bottom group mr-0! mt-4 flex h-fit max-h-32 min-h-[40px] w-fit max-w-sm justify-between rounded-2xl border-0! bg-context-menu-background/90 py-2 text-sm font-light text-font-color-black shadow-[5px_25px_50px_0px_rgba(0,0,0,0.2)] backdrop-blur-xs transition-[opacity,transform,visibility] duration-100! ease-in-out animate-delay-200! first:mt-0 hover:text-font-color-highlight dark:bg-dark-context-menu-background/90 dark:text-font-color-white dark:hover:text-dark-font-color-highlight"
      iconName="close"
    />
  );
};

export default NotificationClearAllButton;
