/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppContext';
import Button from '../Button';

const Notification = (props: AppNotification) => {
  const notificationData = props;
  const { updateNotifications } = React.useContext(AppUpdateContext);

  const notificationRef = React.useRef(null as HTMLDivElement | null);
  const notificationTimeoutIdRef = React.useRef(
    undefined as NodeJS.Timeout | undefined
  );
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notificationPanelStyles: any = {};
  notificationPanelStyles['--loading-bar-width'] = `${dimensions.width - 35}px`;

  const removeNotification = React.useCallback(() => {
    if (notificationTimeoutIdRef.current)
      clearTimeout(notificationTimeoutIdRef.current);
    if (
      notificationRef.current
      //  && !notificationRef.current.classList.contains('disappear-to-bottom')
    ) {
      notificationRef.current.classList.add('disappear-to-bottom');
      notificationRef.current.addEventListener('animationend', () =>
        updateNotifications((currNotifications) =>
          currNotifications.filter((x) => x.id !== notificationData.id)
        )
      );
    } else
      updateNotifications((currNotifications) =>
        currNotifications.filter((x) => x.id !== notificationData.id)
      );
  }, [notificationData.id, updateNotifications]);

  React.useLayoutEffect(() => {
    if (notificationRef.current) {
      setDimensions({
        width: notificationRef.current.offsetWidth,
        height: notificationRef.current.offsetHeight,
      });
      notificationTimeoutIdRef.current = setTimeout(
        removeNotification,
        notificationData.delay ?? 5000
      );
    }
    return () => {
      if (notificationTimeoutIdRef.current)
        clearTimeout(notificationTimeoutIdRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (notificationRef?.current?.classList.contains('disappear-to-bottom')) {
        clearTimeout(notificationTimeoutIdRef.current);
        updateNotifications((currNotifications) =>
          currNotifications.filter((x) => x.id !== notificationData.id)
        );
      }
    };
  }, [notificationData, removeNotification, updateNotifications]);
  return (
    <div
      className="notification appear-from-bottom group w-fit min-w-[300px] max-w-lg min-h-[50px] h-fit max-h-32 bg-context-menu-background dark:bg-dark-context-menu-background backdrop-blur-sm flex justify-between py-2 rounded-2xl text-font-color-black dark:text-font-color-white text-sm font-light mt-4 shadow-[5px_15px_30px_0px_rgba(0,0,0,0.35)]  transition-[opacity,transform,visibility] ease-in-out"
      id="notificationPanelsContainer"
      ref={notificationRef}
      style={notificationPanelStyles}
    >
      <div className="notification-info-and-buttons-container flex flex-col w-fit mr-4 group-hover:mr-0">
        <div className="notification-info-container flex flex-row items-center">
          <div className="icon-container flex items-center justify-center mx-3 [&>img]:h-4 [&>img]:aspect-square">
            {notificationData.icon}
          </div>
          <div className="message-container text-justify py-1 overflow-hidden text-ellipsis">
            {notificationData.content}
          </div>
        </div>
        {Array.isArray(notificationData.buttons) &&
          notificationData.buttons.length > 0 && (
            <div className="buttons-container flex justify-end">
              {notificationData.buttons.map((button, index) => (
                <Button
                  key={`notification-panel-button-${index}`}
                  label={button.label}
                  iconName={button.iconName}
                  iconClassName={button.iconClassName}
                  className={`px-2 py-1 border-2 dark:border-background-color-2 mt-2 mb-1 dark:text-background-color-2 text-background-color-3 font-medium mr-0 ml-4 ${button.className}`}
                  clickHandler={(e) => {
                    removeNotification();
                    button.clickHandler(e);
                  }}
                />
              ))}
            </div>
          )}
        {notificationData.isLoading && (
          <div className="notification-loading-bar h-1 w-[95%] bg-background-color-2 dark:bg-dark-background-color-2 overflow-hidden mt-2 relative before:content-[''] before:w-20 before:h-1 before:bg-background-color-3 dark:before:bg-dark-background-color-3 before:absolute before:-translate-x-9 animate-[loading_2s_ease_infinite]" />
        )}
      </div>
      <div className="close-button-container w-12 flex-col items-center justify-center flex absolute invisible group-hover:relative group-hover:visible">
        <span
          className="material-icons-round icon text-lg p-2 hover:bg-background-color-dimmed dark:hover:bg-dark-background-color-1 hover:text-[crimson] dark:hover:text-[crimson] rounded-md"
          onClick={removeNotification}
          onKeyDown={removeNotification}
          role="button"
          tabIndex={0}
        >
          close
        </span>
      </div>
    </div>
  );
};

Notification.displayName = 'Notification';
export default Notification;
