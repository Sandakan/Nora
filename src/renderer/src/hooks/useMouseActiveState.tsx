import { type MutableRefObject, useCallback, useLayoutEffect, useRef, useState } from 'react';
import debounce from '../utils/debounce';

const defaultOptions = {
  idleTimeout: 5000,
  activeTimeout: 0,
  /* No of pixels mouse has to move to trigger the event */
  range: 0,
  /* Make the mouse state idle if the cursor leaves the area */
  idleOnMouseOut: false
};

const isValuesInRange = (prevValue: number, newValue: number, range: number) =>
  Math.abs(newValue - prevValue) >= range;

const useMouseActiveState = (
  elementRef: MutableRefObject<HTMLElement | null | undefined>,
  options = defaultOptions as Partial<typeof defaultOptions>
) => {
  const { idleTimeout, activeTimeout, range, idleOnMouseOut } = options;

  const [isMouseActive, setIsMouseActive] = useState(false);
  const prevPositionRef = useRef({ x: 0, y: 0 });
  const activeTimeOutIdRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const idleTimeOutIdRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const manageMouseMovement = useCallback(() => {
    const setIdleTimeouts = () => {
      if (idleTimeOutIdRef.current) clearTimeout(idleTimeOutIdRef.current);
      idleTimeOutIdRef.current = setTimeout(() => setIsMouseActive(false), idleTimeout);
    };

    const setActiveTimeouts = () => {
      if (activeTimeOutIdRef.current) clearTimeout(activeTimeOutIdRef.current);
      activeTimeOutIdRef.current = setTimeout(() => {
        setIsMouseActive(true);
      }, activeTimeout);
    };

    if (activeTimeout) setActiveTimeouts();
    else setIsMouseActive(true);

    setIdleTimeouts();
  }, [activeTimeout, idleTimeout]);

  const mouseMoveHandler = useCallback(
    (e: MouseEvent) => {
      const { clientX: newX, clientY: newY } = e;

      if (range && prevPositionRef.current) {
        const { x: prevX, y: prevY } = prevPositionRef.current;

        if (isValuesInRange(prevX, newX, range) || isValuesInRange(prevY, newY, range))
          manageMouseMovement();
      } else manageMouseMovement();

      return debounce(() => {
        prevPositionRef.current = { x: e.clientX, y: e.clientY };
      }, 100);
    },
    [manageMouseMovement, range]
  );

  const mouseLeaveHandler = useCallback(
    () => idleOnMouseOut && setIsMouseActive(false),
    [idleOnMouseOut]
  );

  useLayoutEffect(() => {
    const ref = elementRef?.current;

    if (ref) {
      ref.addEventListener('mousemove', mouseMoveHandler);
      ref.addEventListener('mouseleave', mouseLeaveHandler);
    }

    return () => {
      if (ref) {
        ref.removeEventListener('mousemove', mouseMoveHandler);
        ref.removeEventListener('mouseleave', mouseLeaveHandler);
      }
    };
  }, [elementRef, mouseLeaveHandler, mouseMoveHandler]);

  return { isMouseActive };
};

export default useMouseActiveState;
