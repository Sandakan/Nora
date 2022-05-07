/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
import { ReactElement } from 'react';

interface DialogMenuProp {
  data: DialogMenuData;
  updateDialogMenuData: (
    delay: number,
    content: ReactElement<any, any>
  ) => void;
}

export default (props: DialogMenuProp) => {
  return (
    <div
      className={`dialog-menu-container ${props.data.isVisible && 'visible'}`}
      id="dialogMenusContainer"
    >
      <div className="message-container">{props.data.content}</div>
      <div className="buttons-container">
        <div id="dialogMenuCloseBtn">
          <span
            className="material-icons icon"
            onClick={() => props.updateDialogMenuData(0, <></>)}
          >
            close
          </span>
        </div>
      </div>
    </div>
  );
};
