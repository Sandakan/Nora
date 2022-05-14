/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
import { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

export default () => {
  const { updateNotificationPanelData, notificationPanelData } =
    useContext(AppContext);
  return (
    <div
      className={`notification-panel-container ${
        notificationPanelData.isVisible && 'visible'
      }`}
      id="notificationPanelsContainer"
    >
      <div className="message-container">{notificationPanelData.content}</div>
      <div className="buttons-container">
        <div id="notificationPanelCloseBtn">
          <span
            className="material-icons icon"
            onClick={() => updateNotificationPanelData(0, <></>)}
          >
            close
          </span>
        </div>
      </div>
    </div>
  );
};
