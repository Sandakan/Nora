/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/require-default-props */
import React, { ForwardedRef, MouseEvent, ReactElement } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface MainContainerProp {
  children: ReactElement<any, any>;
  className?: string;
  noDefaultStyles?: boolean;
  style?: React.CSSProperties;
  onContextMenu?: (
    e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>
  ) => void;
  onClick?: (
    e: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>
  ) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  role?: React.AriaRole;
}

const MainContainer = React.forwardRef(
  (props: MainContainerProp, ref: ForwardedRef<HTMLDivElement>) => {
    const {
      children,
      className,
      onContextMenu,
      style,
      onClick,
      role,
      onScroll,
      noDefaultStyles = false,
    } = props;
    return (
      <ErrorBoundary>
        <div
          className={`main-container ${
            noDefaultStyles
              ? ''
              : 'flex h-fit max-h-full w-full flex-col pb-8 pl-8 '
          } ${className}`}
          style={style ?? {}}
          onContextMenu={onContextMenu}
          onClick={onClick}
          onScroll={onScroll}
          role={role}
          ref={ref}
        >
          {children}
        </div>
      </ErrorBoundary>
    );
  }
);

export default MainContainer;
