/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import Body from './Body';
import NotificationPanel from './NotificationPanel/NotificationPanel';
import Sidebar from './Sidebar/Sidebar';
import ErrorBoundary from './ErrorBoundary';

const BodyAndSideBarContainer = () => {
  return (
    <div className="body-and-side-bar-container relative flex h-full w-full overflow-hidden">
      <ErrorBoundary>
        <NotificationPanel />
        <Sidebar />
        <Body />
      </ErrorBoundary>
    </div>
  );
};

export default BodyAndSideBarContainer;
