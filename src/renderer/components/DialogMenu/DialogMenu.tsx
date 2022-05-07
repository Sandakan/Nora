/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
import { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

export default () => {
  const { updateDialogMenuData, dialogMenuData } = useContext(AppContext);
  return (
    <div
      className={`dialog-menu-container ${
        dialogMenuData.isVisible && 'visible'
      }`}
      id="dialogMenusContainer"
    >
      <div className="message-container">{dialogMenuData.content}</div>
      <div className="buttons-container">
        <div id="dialogMenuCloseBtn">
          <span
            className="material-icons icon"
            onClick={() => updateDialogMenuData(0, <></>)}
          >
            close
          </span>
        </div>
      </div>
    </div>
  );
};
