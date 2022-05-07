/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
// import { ReactElement, useContext } from 'react';
import { Body } from './body';
import { SideBar } from './Sidebar/sidebar';
import DialogMenu from './DialogMenu/DialogMenu';

export const BodyAndSideBarContainer = () => {
  return (
    <div className="body-and-side-bar-container">
      <DialogMenu />
      <Body />
      <SideBar />
    </div>
  );
};
