import { useCallback, useRef } from 'react';

export const useUpNextPopup = () => {
  const showUpNextPopupRef = useRef<(() => void) | null>(null);

  const registerUpNextPopupFn = useCallback((fn: () => void) => {
    showUpNextPopupRef.current = fn;
  }, []);

  const showUpNextSongPopup = useCallback(() => {
    showUpNextPopupRef.current?.();
  }, []);

  return { registerUpNextPopupFn, showUpNextSongPopup };
};

export default useUpNextPopup;
