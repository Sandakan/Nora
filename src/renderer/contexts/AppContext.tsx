/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */
import { createContext, ReactElement } from 'react';

interface AppContextType {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  isContextMenuVisible: boolean;
  contextMenuItems: ContextMenuItem[];
  contextMenuPageX: number;
  contextMenuPageY: number;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems?: ContextMenuItem[],
    pageX?: number | undefined,
    pageY?: number | undefined
  ) => void;
  promptMenuData: { content: any; isVisible: boolean; className: string };
  changePromptMenuData: (
    isVisible: boolean,
    content?: ReactElement<any, any>,
    className?: string
  ) => void;
  playSong: (url: string) => void;
  currentSongData: AudioData;
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
  currentlyActivePage: { pageTitle: string; data?: any };
  dialogMenuData: DialogMenuData;
  updateDialogMenuData: (
    delay: number | undefined,
    content: ReactElement<any, any>
  ) => void;
  userData: UserData | undefined;
  isStartPlay: boolean;
  // createQueue: (songData: AudioInfo[]) => void;
  //   queue: Queue;
  // updateQueueData: (currentSongIndex?: number, queue?: string[]) => void;
}

export const AppContext = createContext({} as AppContextType);
