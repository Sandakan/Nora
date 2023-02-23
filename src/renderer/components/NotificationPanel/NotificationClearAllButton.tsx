import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';

const NotificationClearAllButton = () => {
  const { updateNotifications } = React.useContext(AppUpdateContext);
  return (
    <Button
      label="Clear All"
      key="ClearAllBtn"
      clickHandler={() => updateNotifications(() => [])}
      className="notification appear-from-bottom group mt-4 !mr-0 flex h-fit max-h-32 min-h-[40px] w-fit max-w-sm justify-between rounded-2xl !border-0 bg-context-menu-background py-2 text-sm font-light text-font-color-black shadow-[5px_25px_50px_0px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-[opacity,transform,visibility] !duration-100 ease-in-out hover:text-font-color-highlight dark:bg-dark-context-menu-background dark:text-font-color-white dark:hover:text-dark-font-color-highlight"
      iconName="close"
    />
  );
};

export default NotificationClearAllButton;
