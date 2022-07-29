/* eslint-disable react/no-array-index-key */
/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import ContextMenuItem from './ContextMenuItem';
import { AppContext } from '../../contexts/AppContext';

const ContextMenu = React.memo(() => {
  const {
    contextMenuPageX,
    contextMenuPageY,
    isContextMenuVisible,
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

  const menuItems = React.useMemo(
    () =>
      contextMenuItems.map((menuItem, index) => {
        if (menuItem.isContextMenuItemSeperator)
          return (
            <div
              key={index}
              role="separator"
              className="context-menu-item-seperator h-[2px] w-[95%] bg-[hsla(0deg,0%,57%,0.5)] my-2 float-right"
            />
          );
        return (
          <ContextMenuItem
            key={index}
            label={menuItem.label}
            iconName={menuItem.iconName}
            iconClassName={menuItem.iconClassName}
            handlerFunction={menuItem.handlerFunction}
          />
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contextMenuItems]
  );
  return (
    <div
      className={`context-menu ${
        isContextMenuVisible
          ? 'opacity-100 scale-100'
          : 'opacity-0 invisible scale-75'
      } bg-context-menu-background dark:bg-dark-context-menu-background backdrop-blur-sm h-fit w-fit  min-w-[13.75rem] fixed z-[5] py-2 rounded-lg text-font-color-black dark:text-font-color-white origin-top-left transition-[opacity,transform,visibility] shadow-[10px_0px_53px_0px_rgba(0,0,0,0.22)]`}
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

ContextMenu.displayName = 'ContextMenu';
export default ContextMenu;
