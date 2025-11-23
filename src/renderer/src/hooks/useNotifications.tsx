import { useCallback, useEffect, useTransition } from 'react';
import { dispatch, store } from '../store/store';
import throttle from '../utils/throttle';
import parseNotificationFromMain from '../other/parseNotificationFromMain';

export interface UseNotificationsOptions {
  maxNotifications?: number;
}

export interface UseNotificationsReturn {
  addNewNotifications: (newNotifications: AppNotification[]) => void;
  updateNotifications: (
    callback: (currentNotifications: AppNotification[]) => AppNotification[]
  ) => void;
}

/**
 * Hook for managing application notifications.
 *
 * Provides functions to add and update notifications in the notification panel.
 * Automatically handles notification limits, deduplication, and main process messages.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { addNewNotifications } = useNotifications();
 *
 *   const showSuccess = () => {
 *     addNewNotifications([{
 *       id: 'success',
 *       content: 'Operation completed!',
 *       iconName: 'check_circle',
 *       iconClassName: 'material-icons-round-outlined'
 *     }]);
 *   };
 *
 *   return <button onClick={showSuccess}>Show Success</button>;
 * }
 * ```
 *
 * @param options - Configuration options
 * @param options.maxNotifications - Maximum number of notifications to keep (default: 4)
 * @returns Notification management functions
 */
export function useNotifications(options?: UseNotificationsOptions): UseNotificationsReturn {
  const { maxNotifications = 4 } = options || {};
  const [, startTransition] = useTransition();

  const addNewNotifications = useCallback(
    (newNotifications: AppNotification[]) => {
      if (newNotifications.length > 0) {
        const currentNotifications = store.state.notificationPanelData.notifications;
        const newNotificationIds = newNotifications.map((x) => x.id);

        // Filter out duplicate notifications and enforce max limit
        const resultNotifications = currentNotifications.filter(
          (x, index) => !newNotificationIds.some((y) => y === x.id) && index < maxNotifications
        );

        // Add new notifications at the beginning
        resultNotifications.unshift(...newNotifications);

        startTransition(() =>
          dispatch({
            type: 'ADD_NEW_NOTIFICATIONS',
            data: resultNotifications
          })
        );
      }
    },
    [maxNotifications, startTransition]
  );

  const updateNotifications = useCallback(
    (callback: (currentNotifications: AppNotification[]) => AppNotification[]) => {
      const currentNotifications = store.state.notificationPanelData.notifications;
      const updatedNotifications = callback(currentNotifications);

      dispatch({ type: 'UPDATE_NOTIFICATIONS', data: updatedNotifications });
    },
    []
  );

  const displayMessageFromMain = useCallback(
    (_: unknown, messageCode: MessageCodes, data?: Record<string, unknown>) => {
      // Throttle notifications from main process to avoid overwhelming the UI
      throttle(() => {
        const notification = parseNotificationFromMain(messageCode, data);
        addNewNotifications([notification]);
      }, 1000)();
    },
    [addNewNotifications]
  );

  // Set up IPC listener for messages from main process
  useEffect(() => {
    window.api.messages.getMessageFromMain(displayMessageFromMain);

    return () => {
      window.api.messages.removeMessageToRendererEventListener(displayMessageFromMain);
    };
  }, [displayMessageFromMain]);

  return {
    addNewNotifications,
    updateNotifications
  };
}
