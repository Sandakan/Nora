/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import Notification from './Notification';
import NotificationClearAllButton from './NotificationClearAllButton';

const NotificationPanel = () => {
  const { notificationPanelData } = useContext(AppContext);

  const notifications = React.useMemo(() => {
    const notificationData = notificationPanelData.notifications;

    if (notificationData.length > 0) {
      return notificationData.map((data) => {
        const {
          content,
          delay,
          id,
          buttons,
          icon,
          iconName,
          iconClassName,
          order,
          progressBarData,
          type,
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
            delay={delay}
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
        <div className="notifications-container absolute bottom-6 right-0 z-20 flex max-h-full flex-col-reverse items-end px-8">
          {notifications.reverse()}
          {notifications.length > 0 && <NotificationClearAllButton />}
        </div>
      )}
    </>
  );
};

NotificationPanel.displayName = 'NotificationPanel';
export default NotificationPanel;
