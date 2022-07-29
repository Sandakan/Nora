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
    <div className={`secondary-container w-full h-fit mb-4 ${className}`}>
      {children}
    </div>
  );
}

export default SecondaryContainer;
