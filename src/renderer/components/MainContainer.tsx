/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, {
  ForwardedRef,
  MouseEvent,
  ReactElement,
  ReactNode,
} from 'react';
import ErrorBoundary from './ErrorBoundary';

interface MainContainerProp {
  children: ReactNode;
  className?: string;
  noDefaultStyles?: boolean;
  style?: React.CSSProperties;
  onContextMenu?: (
    _e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>
  ) => void;
  onClick?: (
    _e: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>
  ) => void;
  onScroll?: (_e: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  role?: React.AriaRole;
  onKeyDown?: (_e: React.KeyboardEvent<HTMLDivElement>) => void;
  focusable?: boolean;
}

const MainContainer = React.forwardRef(
  (props: MainContainerProp, ref: ForwardedRef<HTMLDivElement>) => {
    const {
      children,
      className,
      onContextMenu,
      style,
      onClick,
      onKeyDown,
      role,
      onScroll,
      noDefaultStyles = false,
      focusable = false,
    } = props;
    return (
      <ErrorBoundary>
        <div
          className={`main-container ${
            noDefaultStyles
              ? ''
              : 'flex h-fit max-h-full w-full flex-col pb-8 pl-8'
          } ${className}`}
          style={style ?? {}}
          onContextMenu={onContextMenu}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onScroll={onScroll}
          role={role ?? focusable ? 'none' : undefined}
          ref={ref}
          tabIndex={focusable ? 1 : undefined}
        >
          {children}
        </div>
      </ErrorBoundary>
    );
  }
);

MainContainer.displayName = 'MainContainer';
export default MainContainer;
