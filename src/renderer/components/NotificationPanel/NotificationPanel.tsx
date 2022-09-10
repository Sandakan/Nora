/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import Notification from './Notification';

const NotificationPanel = () => {
  const { notificationPanelData } = useContext(AppContext);

  const notifications = React.useMemo(() => {
    if (
      Array.isArray(notificationPanelData.notifications) &&
      notificationPanelData.notifications.length > 0
    ) {
      return notificationPanelData.notifications.map((data) => {
        return (
          <Notification
            key={data.id}
            id={data.id}
            isLoading={data.isLoading}
            content={data.content}
            buttons={data.buttons}
            icon={data.icon}
            delay={data.delay}
            order={data.order}
          />
        );
      });
    }
    return undefined;
  }, [notificationPanelData]);

  return (
    <>
      {Array.isArray(notifications) && notifications.length > 0 && (
        <div className="notifications-container absolute right-0 z-20 flex flex-col items-end max-h-full px-8">
          {notifications}
        </div>
      )}
    </>
  );
};

NotificationPanel.displayName = 'NotificationPanel';
export default NotificationPanel;
