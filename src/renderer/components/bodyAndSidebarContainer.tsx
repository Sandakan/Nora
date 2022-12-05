/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import Body from './Body';
import NotificationPanel from './NotificationPanel/NotificationPanel';
import Sidebar from './Sidebar/Sidebar';
import ErrorBoundary from './ErrorBoundary';

const BodyAndSideBarContainer = () => {
  return (
    <div className="body-and-side-bar-container relative flex h-[calc(100%-8.5rem)] w-full overflow-hidden">
      <ErrorBoundary>
        <NotificationPanel />
        <Body />
        <Sidebar />
      </ErrorBoundary>
    </div>
  );
};

export default BodyAndSideBarContainer;
