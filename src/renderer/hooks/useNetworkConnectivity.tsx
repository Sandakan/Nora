import React from 'react';

const useNetworkConnectivity = () => {
  const [isOnline, setIsOnline] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true), {
      signal: controller.signal,
    });
    window.addEventListener('offline', () => setIsOnline(false), {
      signal: controller.signal,
    });
    return () => controller.abort();
  }, []);

  return { isOnline };
};

export default useNetworkConnectivity;
