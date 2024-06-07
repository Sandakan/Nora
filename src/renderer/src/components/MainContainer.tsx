/* eslint-disable jsx-a11y/no-autofocus */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import {
  AriaRole,
  CSSProperties,
  FocusEvent,
  ForwardedRef,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  UIEvent,
  forwardRef
} from 'react';
import ErrorBoundary from './ErrorBoundary';

interface MainContainerProp {
  children: ReactNode;
  className?: string;
  noDefaultStyles?: boolean;
  style?: CSSProperties;
  onContextMenu?: (_e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => void;
  onClick?: (_e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => void;
  onScroll?: (_e: UIEvent<HTMLDivElement, globalThis.UIEvent>) => void;
  role?: AriaRole;
  onKeyDown?: (_e: KeyboardEvent<HTMLDivElement>) => void;
  onFocus?: (_e: FocusEvent<HTMLDivElement, Element>) => void;
  onBlur?: (_e: FocusEvent<HTMLDivElement, Element>) => void;
  focusable?: boolean;
  autoFocus?: boolean;
}

const MainContainer = forwardRef((props: MainContainerProp, ref: ForwardedRef<HTMLDivElement>) => {
  const {
    children,
    className,
    onContextMenu,
    style,
    onClick,
    onKeyDown,
    role,
    onScroll,
    onFocus,
    onBlur,
    noDefaultStyles = false,
    focusable = false,
    autoFocus = false
  } = props;
  return (
    <ErrorBoundary>
      <div
        className={`main-container ${
          noDefaultStyles ? '' : 'flex h-fit max-h-full w-full flex-col pb-8 pl-8'
        } ${className}`}
        style={style ?? {}}
        onContextMenu={onContextMenu}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
        role={role ?? focusable ? 'none' : undefined}
        ref={ref}
        tabIndex={focusable ? 1 : undefined}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={focusable && autoFocus}
      >
        {children}
      </div>
    </ErrorBoundary>
  );
});

MainContainer.displayName = 'MainContainer';
export default MainContainer;
