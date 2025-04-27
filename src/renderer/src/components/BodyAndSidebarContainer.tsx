// import Body from './Body';
import NotificationPanel from './NotificationPanel/NotificationPanel';
import Sidebar from './Sidebar/Sidebar';
import ErrorBoundary from './ErrorBoundary';
import { Outlet } from '@tanstack/react-router';

const BodyAndSideBarContainer = () => {
  return (
    <div className="body-and-side-bar-container relative flex h-full w-full overflow-hidden">
      <ErrorBoundary>
        <NotificationPanel />
        <Sidebar />
        <div className="body relative order-2 h-full! w-full overflow-hidden rounded-tl-lg *:overflow-x-hidden lg:pl-14">
          <Outlet />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default BodyAndSideBarContainer;
