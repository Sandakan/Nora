/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import { ReactElement } from 'react';
import { Body } from './body';
import { SideBar } from './Sidebar/sidebar';
import DialogMenu from './DialogMenu/DialogMenu';

interface BodyAndSidebar {
  playSong: (url: string) => void;
  currentSongData: AudioData;
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
  currentlyActivePage: { pageTitle: string; data?: any };
  changePromptMenuData: (
    isVisible?: boolean,
    content?: ReactElement<any, any>
  ) => void;
  dialogMenuData: DialogMenuData;
  updateDialogMenuData: (
    delay: number,
    content: ReactElement<any, any>
  ) => void;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: any[],
    pageX?: number,
    pageY?: number
  ) => void;
  // createQueue: (songData: AudioInfo[]) => void;
  //   queue: Queue;
  // updateQueueData: (currentSongIndex?: number, queue?: string[]) => void;
}

export const BodyAndSideBarContainer = (props: BodyAndSidebar) => {
  return (
    <div className="body-and-side-bar-container">
      <DialogMenu
        data={props.dialogMenuData}
        updateDialogMenuData={props.updateDialogMenuData}
      />
      <Body
        playSong={props.playSong}
        currentlyActivePage={props.currentlyActivePage}
        currentSongData={props.currentSongData}
        changeCurrentActivePage={props.changeCurrentActivePage}
        // createQueue={props.createQueue}
        changePromptMenuData={props.changePromptMenuData}
        updateDialogMenuData={props.updateDialogMenuData}
        updateContextMenuData={props.updateContextMenuData}
        // queue={props.queue}
        // updateQueueData={props.updateQueueData}
      />
      <SideBar
        changeCurrentActivePage={props.changeCurrentActivePage}
        currentlyActivePage={props.currentlyActivePage}
      />
    </div>
  );
};
