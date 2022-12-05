/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/require-default-props */
import { ReactElement } from 'react';

interface SecondaryContainerProp {
  children: ReactElement<any, any>;
  className?: string;
}

function SecondaryContainer(props: SecondaryContainerProp) {
  const { children, className } = props;
  return (
    <div className={`secondary-container mb-4 h-fit w-full ${className}`}>
      {children}
    </div>
  );
}

export default SecondaryContainer;
