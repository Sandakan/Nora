/* eslint-disable react/no-array-index-key */
/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import ContextMenuItem from './ContextMenuItem';
import { AppContext } from '../../contexts/AppContext';

export default React.memo(() => {
  const {
    contextMenuPageX,
    contextMenuPageY,
    isContextMenuVisible,
    updateContextMenuData,
    contextMenuItems,
  } = React.useContext(AppContext);
  const contextMenuRef = React.useRef(null as null | HTMLDivElement);
  const [dimensions, setDimensions] = React.useState({
    width: 0,
    height: 0,
    positionX: 0,
    positionY: 0,
    transformOrigin: 'top left',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contextMenuStyles: any = {};
  contextMenuStyles['--position-x'] = `${dimensions.positionX}px`;
  contextMenuStyles['--position-y'] = `${dimensions.positionY}px`;
  contextMenuStyles['--transform-origin'] = `${dimensions.transformOrigin}`;

  React.useLayoutEffect(() => {
    if (contextMenuRef.current) {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const menuHeight = contextMenuRef.current.clientHeight;
      const menuWidth = contextMenuRef.current.clientWidth;
      setDimensions({
        width: menuWidth,
        height: menuHeight,
        positionX:
          contextMenuPageX + menuWidth > viewportWidth
            ? contextMenuPageX - menuWidth
            : contextMenuPageX,
        positionY:
          contextMenuPageY + menuHeight > viewportHeight
            ? contextMenuPageY - menuHeight
            : contextMenuPageY,
        transformOrigin: `${
          contextMenuPageY + menuHeight > viewportHeight ? 'bottom' : 'top'
        } ${contextMenuPageX + menuWidth > viewportWidth ? 'right' : 'left'}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextMenuItems]);

  const menuItems = contextMenuItems.map((menuItem, index) => {
    if (menuItem.isContextMenuItemSeperator)
      return (
        <div
          key={index}
          role="separator"
          className="context-menu-item-seperator"
        />
      );
    return (
      <ContextMenuItem
        key={index}
        label={menuItem.label}
        iconName={menuItem.iconName}
        handlerFunction={menuItem.handlerFunction}
        updateContextMenuData={updateContextMenuData}
      />
    );
  });
  return (
    <div
      className={`context-menu ${isContextMenuVisible ? 'visible' : ''}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        top: dimensions.positionY,
        left: dimensions.positionX,
        transformOrigin: dimensions.transformOrigin,
      }}
      ref={contextMenuRef}
    >
      {menuItems}
    </div>
  );
});
