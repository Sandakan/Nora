import { useCallback, useContext, useLayoutEffect, useMemo, useRef } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Button from '../Button';

const Notification = (props: AppNotification) => {
  const {
    id,
    content,
    delay = 5000,
    buttons,
    icon,
    iconName = 'info',
    iconClassName,
    type = 'DEFAULT',
    progressBarData = { total: 100, value: 50 }
  } = props;
  const { localStorageData } = useContext(AppContext);
  const { updateNotifications } = useContext(AppUpdateContext);

  const notificationRef = useRef(null as HTMLDivElement | null);
  const notificationTimeoutIdRef = useRef(undefined as NodeJS.Timeout | undefined);
  // const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const notificationPanelStyles: any = {};
  // notificationPanelStyles['--loading-bar-width'] = `${dimensions.width - 35}px`;
  notificationPanelStyles['--loading-bar-progress'] =
    `${(progressBarData.value / progressBarData.total) * 100}%`;
  notificationPanelStyles['--notification-duration'] = `${delay}ms`;

  const removeNotification = useCallback(() => {
    const isNotificationAnimationDisabled =
      localStorageData?.preferences?.isReducedMotion || type === 'WITH_PROGRESS_BAR';

    if (notificationTimeoutIdRef.current) clearTimeout(notificationTimeoutIdRef.current);

    if (notificationRef.current && !isNotificationAnimationDisabled) {
      notificationRef.current.classList.add('disappear-to-bottom');
      notificationRef.current.addEventListener('animationend', () =>
        updateNotifications((currNotifications) => currNotifications.filter((x) => x.id !== id))
      );
    } else updateNotifications((currNotifications) => currNotifications.filter((x) => x.id !== id));
  }, [id, localStorageData?.preferences?.isReducedMotion, type, updateNotifications]);

  useLayoutEffect(() => {
    const notification = notificationRef.current;
    if (notification) {
      // setDimensions({
      //   width: notification.offsetWidth,
      //   height: notification.offsetHeight,
      // });
      notificationTimeoutIdRef.current = setTimeout(removeNotification, delay);
    }
    return () => {
      if (notificationTimeoutIdRef.current) clearTimeout(notificationTimeoutIdRef.current);
      if (notification?.classList.contains('disappear-to-bottom')) {
        clearTimeout(notificationTimeoutIdRef.current);
        updateNotifications((currNotifications) => currNotifications.filter((x) => x.id !== id));
      }
    };
  }, [delay, id, removeNotification, updateNotifications]);

  const notificationIcon = useMemo(() => {
    if (icon) return icon;
    if (iconName)
      return (
        <span
          className={`animate-dur text-xl text-font-color-highlight dark:text-dark-font-color-highlight ${
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
      className="notification appear-from-bottom group relative mt-2 flex h-fit max-h-32 min-h-[50px] w-fit max-w-md justify-between rounded-full bg-context-menu-background/90 text-sm font-light text-font-color-black shadow-[5px_25px_50px_0px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-[opacity,transform,visibility] ease-in-out first-of-type:mt-2 dark:bg-dark-context-menu-background/90 dark:text-font-color-white"
      id="notificationPanelsContainer"
      ref={notificationRef}
      style={notificationPanelStyles}
    >
      <div
        className={`progress-bar-container absolute h-full w-full overflow-hidden rounded-full before:absolute before:h-full before:w-0 before:rounded-sm before:bg-font-color-highlight/25 before:opacity-0 before:transition-[opacity,width] before:content-[''] dark:before:bg-dark-font-color-highlight/25 ${
          type === 'WITH_PROGRESS_BAR' &&
          progressBarData &&
          progressBarData.total !== progressBarData.value &&
          `before:!w-[var(--loading-bar-progress,0%)] before:!opacity-100`
        } ${
          type !== 'WITH_PROGRESS_BAR' ||
          (type === 'WITH_PROGRESS_BAR' && progressBarData.total === progressBarData.value)
            ? `before:!animate-[widthFillAnimation_var(--notification-duration)_ease-in-out] before:!opacity-40 dark:before:!opacity-15`
            : 'before:!animate-none'
        }`}
      />
      <div className="close-button-container invisible absolute top-1/2 flex -translate-x-10 -translate-y-1/2 flex-col items-center justify-center overflow-hidden opacity-0 transition-[transform,visibility,opacity] delay-200 group-hover:visible group-hover:-translate-x-14 group-hover:opacity-100">
        <span
          className="material-icons-round icon relative my-2 ml-2 mr-8 rounded-full bg-context-menu-background/90 p-2 text-xl shadow-md hover:text-[crimson] dark:bg-dark-context-menu-background/90 dark:hover:bg-dark-context-menu-background/90 dark:hover:text-[crimson]"
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
          <div className="message-container text overflow-hidden text-ellipsis py-1 leading-none">
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
                className={`mb-1 ml-4 mr-0 mt-2 border-2 px-2 py-1 font-medium text-background-color-3 dark:border-background-color-2 dark:text-background-color-2 ${button.className}`}
                clickHandler={(e, setIsDisabled, setIsPending) => {
                  removeNotification();
                  button.clickHandler(e, setIsDisabled, setIsPending);
                }}
              />
            ))}
          </div>
        )}
      </div>
      {/* {type === 'WITH_PROGRESS_BAR' && progressBarData && (
        <div className="notification-loading-bar absolute bottom-0 left-1/2 h-1 w-[85%] flex-grow -translate-x-1/2 overflow-hidden rounded-sm bg-font-color-highlight/10 before:absolute before:h-1 before:w-[var(--loading-bar-progress,0%)] before:rounded-sm before:bg-font-color-highlight/50 before:content-[''] dark:bg-dark-font-color-highlight/20 dark:before:bg-dark-font-color-highlight" />
      )}   */}
    </div>
  );
};

Notification.displayName = 'Notification';
export default Notification;
