import { useEffect, useRef, useState } from 'react';

function useBooleanStateChange(initialState: boolean, durationMs: number) {
  const [state, setState] = useState(initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setState(initialState);
    }, durationMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [initialState, durationMs]);

  const updateState = (newState: boolean) => {
    setState(newState);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return [state !== initialState, updateState] as const;
}

export default useBooleanStateChange;
