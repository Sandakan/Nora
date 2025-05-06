import { useMemo } from 'react';
import Notification from './Notification';
import NotificationClearAllButton from './NotificationClearAllButton';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const NotificationPanel = () => {
  const notificationPanelData = useStore(store, (state) => state.notificationPanelData);

  const notifications = useMemo(() => {
    const notificationData = notificationPanelData.notifications;

    if (notificationData.length > 0) {
      return notificationData.map((data) => {
        const {
          content,
          duration,
          id,
          buttons,
          icon,
          iconName,
          iconClassName,
          order,
          progressBarData,
          type
        } = data;
        return (
          <Notification
            key={id}
            id={id}
            content={content}
            buttons={buttons}
            icon={icon}
            iconName={iconName}
            iconClassName={iconClassName}
            duration={duration}
            order={order}
            type={type}
            progressBarData={progressBarData}
          />
        );
      });
    }
    return undefined;
  }, [notificationPanelData]);

  return (
    <>
      {Array.isArray(notifications) && notifications.length > 0 && (
        <div className="notifications-container absolute right-8 bottom-6 z-20 flex max-h-full flex-col-reverse items-end">
          {notifications.reverse()}
          {notifications.length > 0 && <NotificationClearAllButton />}
        </div>
      )}
    </>
  );
};

NotificationPanel.displayName = 'NotificationPanel';
export default NotificationPanel;
