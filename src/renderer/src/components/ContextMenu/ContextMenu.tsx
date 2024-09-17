/* eslint-disable jsx-a11y/click-events-have-key-events */
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ContextMenuItem from './ContextMenuItem';
import ContextMenuDataItem from './ContextMenuDataItem';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const ContextMenu = memo(() => {
  const contextMenuData = useStore(store, (state) => state.contextMenuData);

  const { isVisible, menuItems, data } = contextMenuData;

  const contextMenuRef = useRef(null as null | HTMLDivElement);
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    positionX: 0,
    positionY: 0,
    transformOrigin: 'top left'
  });

  const contextMenuStyles: any = {};
  contextMenuStyles['--position-x'] = `${dimensions.positionX}px`;
  contextMenuStyles['--position-y'] = `${dimensions.positionY}px`;
  contextMenuStyles['--transform-origin'] = `${dimensions.transformOrigin}`;

  useLayoutEffect(() => {
    const { pageX, pageY } = contextMenuData;

    if (contextMenuRef.current) {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const menuHeight = contextMenuRef.current.clientHeight;
      const menuWidth = contextMenuRef.current.clientWidth;
      // console.log('viewportHeight', viewportHeight, 'viewportWidth', viewportWidth, 'menuHeight', menuHeight, 'menuWidth', menuWidth, 'pageX', pageX, 'pageY', pageY);

      setDimensions({
        width: menuWidth,
        height: menuHeight,
        positionX: pageX + menuWidth > viewportWidth ? pageX - menuWidth : pageX,
        positionY:
          pageY + menuHeight > viewportHeight
            ? pageY -
              menuHeight +
              // ? 40px get added to stop the context menu from reaching the title-bar.
              // ? Height of the title bar is  40px (2.5rem).
              (pageY - menuHeight > 40 ? 0 : Math.abs(pageY - menuHeight) + 40)
            : pageY,
        transformOrigin: `${
          pageY + menuHeight > viewportHeight ? 'bottom' : 'top'
        } ${pageX + menuWidth > viewportWidth ? 'right' : 'left'}`
      });
    }
  }, [contextMenuData]);

  const contextMenuItems = useMemo(
    () =>
      menuItems
        .filter((menuItem) => !menuItem.isDisabled)
        .map((menuItem, index) => {
          if (menuItem.isContextMenuItemSeperator)
            return (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                role="separator"
                className="context-menu-item-seperator float-right my-2 h-[1px] w-[95%] bg-[hsla(0deg,0%,57%,0.5)]"
              />
            );
          return (
            <ContextMenuItem
              key={menuItem.label}
              label={menuItem.label}
              iconName={menuItem.iconName}
              iconClassName={menuItem.iconClassName}
              handlerFunction={menuItem.handlerFunction}
            />
          );
        }),
    [menuItems]
  );
  return (
    <div
      className={`context-menu ${
        isVisible ? 'scale-100 opacity-100' : 'invisible scale-75 opacity-0'
      } ${
        !data && 'pt-2'
      } absolute z-50 h-fit w-fit min-w-[15rem] origin-top-left overflow-hidden overflow-y-auto rounded-lg bg-context-menu-background/90 pb-1 pt-1 text-font-color-black shadow-[10px_0px_53px_0px_rgba(0,0,0,0.22)] backdrop-blur-md transition-[opacity,transform,visibility,width,height] dark:bg-dark-context-menu-background/90 dark:text-font-color-white`}
      onClick={(e) => e.stopPropagation()}
      style={{
        top: dimensions.positionY,
        left: dimensions.positionX,
        // transform: `translate(${dimensions.positionX}px,${dimensions.positionY}px)`,
        transformOrigin: dimensions.transformOrigin
      }}
      ref={contextMenuRef}
      tabIndex={isVisible ? 0 : -1}
      role="menu"
    >
      {data && <ContextMenuDataItem data={data} />}
      {contextMenuItems}
    </div>
  );
});

ContextMenu.displayName = 'ContextMenu';
export default ContextMenu;
