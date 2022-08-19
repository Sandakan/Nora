/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import Body from './body';
import NotificationPanel from './NotificationPanel/NotificationPanel';
import Sidebar from './Sidebar/Sidebar';

export const BodyAndSideBarContainer = () => {
  return (
    <div className="body-and-side-bar-container relative w-full h-[calc(100%-8.5rem)] flex overflow-hidden">
      <NotificationPanel />
      <Body />
      <Sidebar />
    </div>
  );
};
