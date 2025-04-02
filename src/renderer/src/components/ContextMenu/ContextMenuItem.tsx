/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { useContext } from 'react';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

const ContextMenuItem = (props: ContextMenuItem) => {
  const { updateContextMenuData } = useContext(AppUpdateContext);
  return (
    <div
      className={`menu-item ${
        props.class || ''
      } flex cursor-pointer flex-row items-center px-4 py-1 text-sm font-light text-font-color-black hover:bg-context-menu-list-hover/75 dark:text-font-color-white dark:hover:bg-dark-context-menu-list-hover/25`}
      onClick={() => {
        if (!props.isContextMenuItemSeperator && props.handlerFunction) {
          props.handlerFunction();
          updateContextMenuData(false, []);
        }
      }}
    >
      {props.iconName && (
        <span className={`material-icons-round icon mr-4 text-lg ${props.iconClassName}`}>
          {props.iconName}
        </span>
      )}{' '}
      {props.label}
    </div>
  );
};

ContextMenuItem.displayName = 'ContextMenuItem';
export default ContextMenuItem;
