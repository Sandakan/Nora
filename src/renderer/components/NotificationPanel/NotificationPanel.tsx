/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
import React, { useContext } from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import Button from '../Button';

const NotificationPanel = () => {
  const { notificationPanelData } = useContext(AppContext);
  const { updateNotificationPanelData } = React.useContext(AppUpdateContext);

  const notificationPanelRef = React.useRef(null as HTMLDivElement | null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  const notificationPanelStyles: any = {};
  notificationPanelStyles['--loading-bar-width'] = `${dimensions.width - 35}px`;

  React.useLayoutEffect(() => {
    if (notificationPanelRef.current) {
      setDimensions({
        width: notificationPanelRef.current.offsetWidth,
        height: notificationPanelRef.current.offsetHeight,
      });
    }
  }, [notificationPanelData]);

  return (
    <div
      className={`notification-panel-container group w-fit min-w-[300px] max-w-lg min-h-[50px] h-fit max-h-32 bg-background-color-1 dark:bg-dark-background-color-2 flex justify-between py-2 rounded-lg text-font-color-black dark:text-font-color-white text-sm font-light absolute right-6 mt-4 shadow-[5px_15px_30px_0px_rgba(0,0,0,0.35)]  transition-[opacity,transform,visibility] z-20 ${
        notificationPanelData.isVisible
          ? 'visible translate-y-0 opacity-100'
          : 'opacity-0 translate-y-10 invisible'
      }`}
      id="notificationPanelsContainer"
      ref={notificationPanelRef}
      style={notificationPanelStyles}
    >
      <div className="notification-info-and-buttons-container flex flex-col w-fit mr-4 group-hover:mr-0">
        <div className="notification-info-container flex flex-row items-center">
          <div className="icon-container flex items-center justify-center mx-3 [&>img]:h-4 [&>img]:aspect-square">
            {notificationPanelData.icon}
          </div>
          <div className="message-container text-justify py-1 overflow-hidden text-ellipsis">
            {notificationPanelData.content}
          </div>
        </div>
        {Array.isArray(notificationPanelData.buttons) &&
          notificationPanelData.buttons.length > 0 && (
            <div className="buttons-container flex justify-end">
              {notificationPanelData.buttons.map((button, index) => (
                <Button
                  key={`notification-panel-button-${index}`}
                  label={button.label}
                  iconName={button.iconName}
                  iconClassName={button.iconClassName}
                  className={`px-2 py-1 border-2 dark:border-background-color-2 mt-2 mb-1 dark:text-background-color-2 text-background-color-3 font-medium mr-0 ml-4 ${button.className}`}
                  clickHandler={(e) => {
                    updateNotificationPanelData(0, <></>, <></>);
                    button.clickHandler(e);
                  }}
                />
              ))}
            </div>
          )}
        {notificationPanelData.isLoading && (
          <div className="notification-loading-bar h-1 w-[95%] bg-background-color-2 dark:bg-dark-background-color-2 overflow-hidden mt-2 relative before:content-[''] before:w-20 before:h-1 before:bg-background-color-3 dark:before:bg-dark-background-color-3 before:absolute before:-translate-x-9 animate-[loading_2s_ease_infinite]"></div>
        )}
      </div>
      <div className="close-button-container w-12 flex-col items-center justify-center hover:text-[crimson] dark:hover:text-[crimson] flex absolute invisible group-hover:relative group-hover:visible">
        <span
          className="material-icons icon text-lg p-2"
          onClick={() => updateNotificationPanelData(0, <></>, <></>)}
          role="button"
          tabIndex={0}
        >
          close
        </span>
      </div>
    </div>
  );
};

NotificationPanel.displayName = 'NotificationPanel';
export default NotificationPanel;
