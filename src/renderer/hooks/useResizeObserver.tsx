import React from 'react';

export default function useResizeObserver(
  elRef: React.MutableRefObject<HTMLElement | null | undefined>
) {
  const [breakSize, setBreakSize] = React.useState({ width: 0, height: 0 });

  const observer = React.useRef(
    new ResizeObserver((entries) => {
      // Only care about the first element, we expect one element ot be watched
      const { width, height } = entries[0].contentRect;
      setBreakSize({ width, height });
    })
  );

  React.useLayoutEffect(() => {
    if (elRef && elRef.current) {
      observer.current.observe(elRef.current);
    }

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      observer.current.disconnect();
    };
  }, [elRef, observer]);

  return breakSize;
}
