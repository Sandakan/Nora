import React from 'react';
import debounce from '../utils/debounce';

export default function useResizeObserver(
  elRef: React.MutableRefObject<HTMLElement | null | undefined>,
  debounceTimeout?: number,
) {
  const [breakSize, setBreakSize] = React.useState({ width: 0, height: 0 });

  const observer = React.useRef(
    new ResizeObserver((entries) => {
      // Only care about the first element, we expect one element to be watched
      const { width, height } = entries[0].contentRect;
      if (debounceTimeout === undefined || debounceTimeout === 0)
        setBreakSize({ width, height });
      else debounce(() => setBreakSize({ width, height }), debounceTimeout);
    }),
  );

  React.useLayoutEffect(() => {
    const currentObserver = observer.current;
    if (elRef && elRef.current) {
      observer.current.observe(elRef.current);
    }

    return () => {
      currentObserver.disconnect();
    };
  }, [elRef, observer]);

  return breakSize;
}
