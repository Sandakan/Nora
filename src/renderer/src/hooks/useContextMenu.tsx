import { useCallback, useEffect } from 'react';
import { dispatch, store } from '../store/store';

/**
 * Return type for the useContextMenu hook
 */
export interface UseContextMenuReturn {
  /**
   * Update the context menu data (show/hide, position, menu items)
   *
   * @param isVisible - Whether the context menu should be visible
   * @param menuItems - Array of menu items to display (optional)
   * @param pageX - X coordinate for the menu position (optional)
   * @param pageY - Y coordinate for the menu position (optional)
   * @param contextMenuData - Additional data to pass to menu item handlers (optional)
   *
   * @example
   * ```tsx
   * // Show context menu at cursor position
   * updateContextMenuData(
   *   true,
   *   [
   *     { label: 'Play', handler: () => playSong() },
   *     { label: 'Add to Queue', handler: () => addToQueue() }
   *   ],
   *   event.pageX,
   *   event.pageY,
   *   { songId: '123' }
   * );
   *
   * // Hide context menu
   * updateContextMenuData(false);
   * ```
   */
  updateContextMenuData: (
    isVisible: boolean,
    menuItems?: ContextMenuItem[],
    pageX?: number,
    pageY?: number,
    contextMenuData?: ContextMenuAdditionalData
  ) => void;

  /**
   * Hide the context menu if it's currently visible
   *
   * This is typically called when clicking outside the menu
   * or when an action is performed.
   *
   * @example
   * ```tsx
   * // Add click listener to hide menu
   * useEffect(() => {
   *   window.addEventListener('click', handleContextMenuVisibilityUpdate);
   *   return () => window.removeEventListener('click', handleContextMenuVisibilityUpdate);
   * }, [handleContextMenuVisibilityUpdate]);
   * ```
   */
  handleContextMenuVisibilityUpdate: () => void;
}

/**
 * Hook for managing context menu state and visibility
 *
 * Provides functions to show/hide context menus, update menu items,
 * and manage menu position. The context menu is typically triggered
 * by right-clicking on elements like songs, playlists, or artists.
 *
 * Automatically sets up a global click listener to close the menu
 * when clicking outside of it.
 *
 * @returns Object containing context menu management functions
 *
 * @example
 * ```tsx
 * function SongItem({ song }) {
 *   const { updateContextMenuData, handleContextMenuVisibilityUpdate } = useContextMenu();
 *
 *   const handleRightClick = (e: React.MouseEvent) => {
 *     e.preventDefault();
 *     updateContextMenuData(
 *       true,
 *       [
 *         { label: 'Play', handler: () => playSong(song.id) },
 *         { label: 'Add to Queue', handler: () => addToQueue(song.id) },
 *         { label: 'Delete', handler: () => deleteSong(song.id) }
 *       ],
 *       e.pageX,
 *       e.pageY,
 *       { songId: song.id }
 *     );
 *   };
 *
 *   return (
 *     <div onContextMenu={handleRightClick}>
 *       {song.title}
 *     </div>
 *   );
 * }
 * ```
 */
export function useContextMenu(): UseContextMenuReturn {
  const updateContextMenuData = useCallback(
    (
      isVisible: boolean,
      menuItems: ContextMenuItem[] = [],
      pageX?: number,
      pageY?: number,
      contextMenuData?: ContextMenuAdditionalData
    ) => {
      const menuData: ContextMenuData = {
        isVisible,
        data: contextMenuData,
        menuItems: menuItems.length > 0 ? menuItems : store.state.contextMenuData.menuItems,
        pageX: pageX !== undefined ? pageX : store.state.contextMenuData.pageX,
        pageY: pageY !== undefined ? pageY : store.state.contextMenuData.pageY
      };

      dispatch({
        type: 'CONTEXT_MENU_DATA_CHANGE',
        data: menuData
      });
    },
    []
  );

  const handleContextMenuVisibilityUpdate = useCallback(() => {
    if (store.state.contextMenuData.isVisible) {
      dispatch({
        type: 'CONTEXT_MENU_VISIBILITY_CHANGE',
        data: false
      });
      store.state.contextMenuData.isVisible = false;
    }
  }, []);

  // Set up global click listener to close menu when clicking outside
  useEffect(() => {
    window.addEventListener('click', handleContextMenuVisibilityUpdate);

    return () => {
      window.removeEventListener('click', handleContextMenuVisibilityUpdate);
    };
  }, [handleContextMenuVisibilityUpdate]);

  return {
    updateContextMenuData,
    handleContextMenuVisibilityUpdate
  };
}
