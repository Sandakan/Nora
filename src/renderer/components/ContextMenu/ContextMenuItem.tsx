/* eslint-disable react/require-default-props */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
// import react from 'react';

import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppContext';

const ContextMenuItem = (props: ContextMenuItem) => {
  const { updateContextMenuData } = React.useContext(AppUpdateContext);
  return (
    <div
      className={`menu-item ${
        props.class || ''
      } cursor-pointer px-4 py-1 flex flex-row items-center font-light text-font-color-black dark:text-font-color-white hover:bg-context-menu-list-hover dark:hover:bg-dark-context-menu-list-hover`}
      onClick={() => {
        props.handlerFunction();
        updateContextMenuData(false, []);
      }}
    >
      {props.iconName && (
        <span
          className={
            props.iconClassName || 'material-icons-round icon mr-4 text-xl'
          }
        >
          {props.iconName}
        </span>
      )}{' '}
      {props.label}
    </div>
  );
};

ContextMenuItem.displayName = 'ContextMenuItem';
export default ContextMenuItem;
