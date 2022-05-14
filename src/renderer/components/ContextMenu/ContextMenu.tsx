/* eslint-disable react/no-array-index-key */
/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import ContextMenuItem from './ContextMenuItem';
import { AppContext } from '../../contexts/AppContext';

export const ContextMenu = () => {
  const {
    contextMenuPageX,
    contextMenuPageY,
    isContextMenuVisible,
    updateContextMenuData,
    contextMenuItems,
  } = React.useContext(AppContext);
  const menuItems = contextMenuItems.map((menuItem, index) => (
    <ContextMenuItem
      key={index}
      label={menuItem.label}
      iconName={menuItem.iconName}
      handlerFunction={menuItem.handlerFunction}
      updateContextMenuData={updateContextMenuData}
    />
  ));
  return (
    <div
      className={`context-menu ${isContextMenuVisible ? 'visible' : ''}`}
      onClick={(e) => e.stopPropagation()}
      style={{ top: contextMenuPageY, left: contextMenuPageX }}
    >
      {menuItems}
    </div>
  );
};
