/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
// import { ReactElement, useContext } from 'react';
import { Body } from './body';
import Sidebar from './Sidebar/Sidebar';
import NotificationPanel from './NotificationPanel/NotificationPanel';

export const BodyAndSideBarContainer = () => {
  return (
    <div className="body-and-side-bar-container">
      <NotificationPanel />
      <Body />
      <Sidebar />
    </div>
  );
};
