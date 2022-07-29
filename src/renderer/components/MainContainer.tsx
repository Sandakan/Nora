/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/require-default-props */
import React, { MouseEvent, ReactElement } from 'react';

interface MainContainerProp {
  children: ReactElement<any, any>;
  className?: string;
  style?: React.CSSProperties;
  onContextMenu?: (
    e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>
  ) => void;
}

function MainContainer(props: MainContainerProp) {
  const { children, className, onContextMenu, style } = props;
  return (
    <div
      className={`main-container w-full h-fit max-h-full flex flex-col pl-8 mb-8 ${className}`}
      onContextMenu={onContextMenu}
      style={style ?? {}}
    >
      {children}
    </div>
  );
}

export default MainContainer;
