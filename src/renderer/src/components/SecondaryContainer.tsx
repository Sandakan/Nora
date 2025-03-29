import { type ForwardedRef, type ReactNode, forwardRef } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface SecondaryContainerProp {
  children: ReactNode;
  className?: string;
  onKeyDown?: (_e: React.KeyboardEvent<HTMLDivElement>) => void;
  role?: React.AriaRole;
  focusable?: boolean;
}

const SecondaryContainer = forwardRef(
  (props: SecondaryContainerProp, ref: ForwardedRef<HTMLDivElement>) => {
    const { children, className, onKeyDown, role, focusable = false } = props;
    return (
      <ErrorBoundary>
        <div
          className={`secondary-container mb-4 h-fit w-full ${className}`}
          onKeyDown={onKeyDown}
          role={(role ?? focusable) ? 'none' : undefined}
          tabIndex={focusable ? 1 : undefined}
          ref={ref}
        >
          {children}
        </div>
      </ErrorBoundary>
    );
  }
);

SecondaryContainer.displayName = 'SecondaryContainer';
export default SecondaryContainer;
