/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-array-index-key */
/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import ContextMenuItem from './ContextMenuItem';
import { AppContext } from '../../contexts/AppContext';
import ContextMenuDataItem from './ContextMenuDataItem';

const ContextMenu = React.memo(() => {
  const { contextMenuData } = React.useContext(AppContext);
  const { isVisible, menuItems, pageX, pageY, data } = contextMenuData;

  const contextMenuRef = React.useRef(null as null | HTMLDivElement);
  const [dimensions, setDimensions] = React.useState({
    width: 0,
    height: 0,
    positionX: 0,
    positionY: 0,
    transformOrigin: 'top left',
  });

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
      // console.log('viewportHeight', viewportHeight, 'viewportWidth', viewportWidth, 'menuHeight', menuHeight, 'menuWidth', menuWidth, 'pageX', pageX, 'pageY', pageY);

      setDimensions({
        width: menuWidth,
        height: menuHeight,
        positionX:
          pageX + menuWidth > viewportWidth ? pageX - menuWidth : pageX,
        positionY:
          pageY + menuHeight > viewportHeight
            ? pageY -
              menuHeight +
              // ? 40px get added to stop the context menu from reaching the title-bar.
              // ? Height of the title bar is  60px (3.75rem).
              (pageY - menuHeight > 60 ? 0 : 60)
            : pageY,
        transformOrigin: `${
          pageY + menuHeight > viewportHeight ? 'bottom' : 'top'
        } ${pageX + menuWidth > viewportWidth ? 'right' : 'left'}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextMenuData]);

  const contextMenuItems = React.useMemo(
    () =>
      menuItems
        .filter((menuItem) => !menuItem.isDisabled)
        .map((menuItem, index) => {
          if (menuItem.isContextMenuItemSeperator)
            return (
              <div
                key={index}
                role="separator"
                className="context-menu-item-seperator float-right my-2 h-[2px] w-[95%] bg-[hsla(0deg,0%,57%,0.5)]"
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
    [menuItems]
  );
  return (
    <div
      className={`context-menu ${
        isVisible ? 'scale-100 opacity-100' : 'invisible scale-75 opacity-0'
      } ${
        !data && 'pt-2'
      } absolute z-50 h-fit w-fit min-w-[13.75rem] origin-top-left overflow-hidden overflow-y-auto rounded-lg bg-context-menu-background pt-1 pb-1 text-font-color-black shadow-[10px_0px_53px_0px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-[opacity,transform,visibility,width,height] dark:bg-dark-context-menu-background dark:text-font-color-white `}
      onClick={(e) => e.stopPropagation()}
      style={{
        top: dimensions.positionY,
        left: dimensions.positionX,
        transformOrigin: dimensions.transformOrigin,
      }}
      ref={contextMenuRef}
    >
      <>
        {data && <ContextMenuDataItem data={data} />}
        {contextMenuItems}
      </>
    </div>
  );
});

ContextMenu.displayName = 'ContextMenu';
export default ContextMenu;
