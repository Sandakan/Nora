/* eslint-disable react/no-array-index-key */
/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
// import React from 'react';
import ContextMenuItem from './ContextMenuItem';

interface ContextMenuProp {
  isVisible: boolean;
  menuItems: ContextMenuItem[];
  pageX: number;
  pageY: number;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: ContextMenuItem[],
    pageX?: number,
    pageY?: number
  ) => void;
}

export const ContextMenu = (props: ContextMenuProp) => {
  const menuItems = props.menuItems.map((menuItem, index) => (
    <ContextMenuItem
      key={index}
      label={menuItem.label}
      handlerFunction={menuItem.handlerFunction}
      updateContextMenuData={props.updateContextMenuData}
    />
  ));
  return (
    <div
      className={`context-menu ${props.isVisible ? 'visible' : ''}`}
      onClick={(e) => e.stopPropagation()}
      style={{ top: props.pageY, left: props.pageX }}
    >
      {menuItems}
    </div>
  );
};
