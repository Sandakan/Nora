import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties
} from 'react';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Button from '../Button';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const Notification = (props: AppNotification) => {
  const {
    id,
    content,
    duration = 5000,
    buttons,
    icon,
    iconName = 'info',
    iconClassName,
    type = 'DEFAULT',
    progressBarData = { total: 100, value: 50 }
  } = props;
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const { updateNotifications } = useContext(AppUpdateContext);

  const notificationRef = useRef(null as HTMLDivElement | null);
  const notificationTimeoutIdRef = useRef(undefined as NodeJS.Timeout | undefined);

  const notificationPanelStyles: CSSProperties = {};
  notificationPanelStyles['--loading-bar-progress'] =
    `${(progressBarData.value / progressBarData.total) * 100}%`;
  notificationPanelStyles['--notification-duration'] = `${duration}ms`;

  const removeNotification = useCallback(() => {
    const isNotificationAnimationDisabled =
      preferences?.isReducedMotion || type === 'WITH_PROGRESS_BAR';

    if (notificationTimeoutIdRef.current) clearTimeout(notificationTimeoutIdRef.current);

    if (notificationRef.current && !isNotificationAnimationDisabled) {
      notificationRef.current.classList.add('disappear-to-bottom');
      notificationRef.current.addEventListener(
        'animationend',
        () =>
          updateNotifications((currNotifications) => currNotifications.filter((x) => x.id !== id)),
        { once: true }
      );
    } else updateNotifications((currNotifications) => currNotifications.filter((x) => x.id !== id));
  }, [id, preferences?.isReducedMotion, type, updateNotifications]);

  useLayoutEffect(() => {
    const notification = notificationRef.current;
    if (notification) {
      notificationTimeoutIdRef.current = setTimeout(removeNotification, duration);
    }

    return () => {
      if (notificationTimeoutIdRef.current) clearTimeout(notificationTimeoutIdRef.current);
      if (notification?.classList.contains('disappear-to-bottom')) {
        clearTimeout(notificationTimeoutIdRef.current);
        updateNotifications((currNotifications) => currNotifications.filter((x) => x.id !== id));
      }
    };
  }, [duration, id, removeNotification, updateNotifications]);

  const notificationIcon = useMemo(() => {
    if (icon) return icon;
    if (iconName)
      return (
        <span
          className={`animate-dur text-font-color-highlight dark:text-dark-font-color-highlight text-xl ${
            iconClassName ?? 'material-icons-round'
          }`}
        >
          {iconName}
        </span>
      );
    return undefined;
  }, [icon, iconClassName, iconName]);

  return (
    <div
      className="notification appear-from-bottom group bg-context-menu-background/90 text-font-color-black dark:bg-dark-context-menu-background/90 dark:text-font-color-white relative mt-2 flex h-fit max-h-32 min-h-[50px] w-fit max-w-md justify-between rounded-full text-sm font-light shadow-[5px_25px_50px_0px_rgba(0,0,0,0.2)] backdrop-blur-xs transition-[opacity,transform,visibility] ease-in-out first-of-type:mt-2"
      id="notificationPanelsContainer"
      ref={notificationRef}
      style={notificationPanelStyles}
    >
      <div
        className={`progress-bar-container before:bg-font-color-highlight/25 dark:before:bg-dark-font-color-highlight/25 absolute h-full w-full overflow-hidden rounded-full before:absolute before:h-full before:w-0 before:rounded-xs before:opacity-0 before:transition-[opacity,width] before:content-[''] ${
          type === 'WITH_PROGRESS_BAR' &&
          progressBarData &&
          progressBarData.total !== progressBarData.value &&
          `before:w-(--loading-bar-progress,0%)! before:opacity-100!`
        } ${
          type !== 'WITH_PROGRESS_BAR' ||
          (type === 'WITH_PROGRESS_BAR' && progressBarData.total === progressBarData.value)
            ? `before:animate-[widthFillAnimation_var(--notification-duration)_ease-in-out]! before:opacity-40! dark:before:opacity-15!`
            : 'before:animate-none!'
        }`}
      />
      <div className="close-button-container invisible absolute top-1/2 flex -translate-x-10 -translate-y-1/2 flex-col items-center justify-center overflow-hidden opacity-0 transition-[transform,visibility,opacity] delay-200 group-hover:visible group-hover:-translate-x-14 group-hover:opacity-100">
        <span
          className="material-icons-round icon bg-context-menu-background/90 dark:bg-dark-context-menu-background/90 dark:hover:bg-dark-context-menu-background/90 relative my-2 mr-8 ml-2 rounded-full p-2 text-xl shadow-md hover:text-[crimson] dark:hover:text-[crimson]"
          onClick={removeNotification}
          onKeyDown={removeNotification}
          role="button"
          tabIndex={0}
        >
          close
        </span>
      </div>
      <div
        className={`notification-info-and-buttons-container flex w-full flex-col px-5 py-3 ${
          !(Array.isArray(buttons) && buttons.length > 0) && 'items-center justify-center'
        }`}
      >
        <div className="notification-info-container flex flex-row items-center gap-4">
          <div className="icon-container relative flex h-6 w-fit items-center justify-center [&>img]:aspect-square [&>img]:h-4">
            {notificationIcon}
          </div>
          <div className="message-container text overflow-hidden py-1 leading-none text-ellipsis">
            {content}
          </div>
        </div>
        {Array.isArray(buttons) && buttons.length > 0 && (
          <div className="buttons-container flex justify-end">
            {buttons.map((button) => (
              <Button
                key={`notificationPanelButton-${button.label}`}
                label={button.label}
                iconName={button.iconName}
                iconClassName={button.iconClassName}
                className={`text-background-color-3 dark:border-background-color-2 dark:text-background-color-2 mt-2 mr-0 mb-1 ml-4 border-2 px-2 py-1 font-medium ${button.className}`}
                clickHandler={(e, setIsDisabled, setIsPending) => {
                  removeNotification();
                  button.clickHandler(e, setIsDisabled, setIsPending);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Notification.displayName = 'Notification';
export default Notification;
