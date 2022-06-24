/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

export default () => {
  const { updateNotificationPanelData, notificationPanelData } =
    useContext(AppContext);
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
      className={`notification-panel-container ${
        notificationPanelData.isVisible && 'visible'
      }`}
      id="notificationPanelsContainer"
      ref={notificationPanelRef}
      style={notificationPanelStyles}
    >
      <div className="notification-info-container">
        <div className="icon-container">{notificationPanelData.icon}</div>
        <div className="message-container">{notificationPanelData.content}</div>
        <div className="buttons-container">
          <div id="notificationPanelCloseBtn">
            <span
              className="material-icons icon"
              onClick={() => updateNotificationPanelData(0, <></>, <></>)}
              role="button"
              tabIndex={0}
            >
              close
            </span>
          </div>
        </div>
      </div>
      {notificationPanelData.isLoading && (
        <div className="notification-loading-bar"></div>
      )}
    </div>
  );
};
