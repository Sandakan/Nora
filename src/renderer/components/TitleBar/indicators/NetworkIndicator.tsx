import React from 'react';

const NetworkIndicator = () => {
  const [isOnline, setIsOnline] = React.useState(false);

  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigator.onLine]);

  return (
    <div
      className={`network-indicator mr-1 flex cursor-pointer items-center justify-center rounded-md bg-background-color-2 px-3 py-1 text-center transition-[background] dark:bg-dark-background-color-2 ${
        isOnline &&
        'invisible hidden !transition-[visibility] delay-[2500ms] duration-150'
      }`}
      title={`You are ${
        isOnline ? 'connected to' : 'disconnected from'
      } the internet.`}
    >
      <span
        className={`material-icons-round-outlined py-[2px] leading-none ${
          isOnline &&
          'invisible text-font-color-highlight opacity-0 transition-[opacity,visibility] delay-[2500ms] duration-200 dark:text-dark-font-color-highlight'
        }`}
      >
        {isOnline ? 'wifi' : 'wifi_off'}
      </span>
    </div>
  );
};

export default NetworkIndicator;
