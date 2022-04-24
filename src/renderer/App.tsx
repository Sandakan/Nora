/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-unneeded-ternary */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/self-closing-comp */
/* eslint-disable no-else-return */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable promise/no-nesting */
/* eslint-disable consistent-return */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import React, { ReactElement } from 'react';
import '../../assets/styles/main.css';
import { Header } from './components/Header/header';
import { BodyAndSideBarContainer } from './components/bodyAndSidebarContainer';
import SongControlsContainer from './components/SongsControlsContainer/SongControlsContainer';
import { PromptMenu } from './components/PromptMenu/PromptMenu';
import { ContextMenu } from './components/ContextMenu/ContextMenu';
import '../../assets/fonts/fontawesome-free-6.0.0-web/css/all.min.css';

function App() {
  const x: unknown = undefined;
  const [userData, setUserData] = React.useState(x as UserData | undefined);
  const [startPlay, setStartPlay] = React.useState(false);
  const [isDarkMode, setDarkMode] = React.useState(false);
  const [currentSongData, setCurrentSongData] = React.useState({} as AudioData);
  // const [queue, setQueue] = React.useState({
  //   currentSongIndex: null,
  //   queue: [],
  // } as Queue);
  const [promptMenuData, setPromptMenuData] = React.useState({
    isVisible: false,
    content: <span></span>,
    className: '',
  } as PromptMenuData);
  const [dialogMenuData, setDialogMenuData] = React.useState({
    isVisible: false,
    content: <span></span>,
  } as DialogMenuData);
  const [contextMenuData, setContextMenuData] = React.useState({
    isVisible: false,
    menuItems: [] as ContextMenuItem[],
    pageX: 200,
    pageY: 200,
  });
  const [currentlyActivePage, setCurrentlyActivePage] = React.useState('Home');

  const updateContextMenuData = (
    isVisible: boolean,
    menuItems: ContextMenuItem[] = [],
    pageX?: number,
    pageY?: number
  ) => {
    console.log('context menu event triggered', isVisible, pageX, pageY);
    setContextMenuData((prevData) => {
      return {
        isVisible,
        menuItems: menuItems.length > 0 ? menuItems : prevData.menuItems,
        pageX: pageX !== undefined ? pageX : prevData.pageX,
        pageY: pageY !== undefined ? pageY : prevData.pageY,
      };
    });
  };

  React.useEffect(() => {
    window.addEventListener('click', () =>
      setContextMenuData((prevData) => {
        return { ...prevData, isVisible: false };
      })
    );
  }, []);

  const changeCurrentActivePage = (pageClass: string) =>
    setCurrentlyActivePage(pageClass);

  const playSong = (songId: string, isStartPlay = true) => {
    // console.log('isStartPlay', isStartPlay, startPlay);
    if (isStartPlay !== startPlay) setStartPlay(isStartPlay);
    window.api.getSong(songId).then((songData) => {
      if (typeof songData === 'object') {
        console.log('playSong', songId, songData.path);
        setCurrentSongData(songData);
        window.api.saveUserData('currentSong.songId', songData.songId);
        // if (queue.queue.length > 0 && queue.queue.includes(songData.songId)) {
        //   setQueue((prevQueueData) => {
        //     return {
        //       ...prevQueueData,
        //       currentSongIndex: queue.queue.indexOf(songData.songId),
        //     };
        //   });
        // }
      } else console.log(songData);
    });
  };

  // const createQueue = (songsData: AudioInfo[], startPlaying = false) => {
  //   queue.queue = songsData.map((songData) => songData.songId);
  //   if (startPlaying) changeQueueCurrentSongIndex(0);
  // };

  React.useEffect(() => {
    window.api.getUserData().then((res) => {
      if (!res) return;
      setUserData(res);
      setDarkMode(res.theme.isDarkMode);
      if (res.currentSong.songId) playSong(res.currentSong.songId, false);
    });

    // window.api.checkForSongs().then((audioData) => {
    //   if (!audioData) return undefined;
    //   createQueue(audioData);
    //   return undefined;
    // });
    // to make it run only once
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prevState) => {
      window.api.saveUserData('theme.isDarkMode', (!prevState).toString());
      return !prevState;
    });
  };

  // const changeQueueCurrentSongIndex = (currentSongIndex: number) => {
  //   console.log('currentSongIndex', currentSongIndex);
  //   setQueue((prevQueueData) => {
  //     return { ...prevQueueData, currentSongIndex };
  //   });
  //   playSong(queue.queue[currentSongIndex || 0]);
  // };

  // const updateQueueData = (
  //   currentSongIndex?: number,
  //   newQueue?: string[],
  //   playCurrentSongIndex = true
  // ) => {
  //   setQueue((prevData) => {
  //     return {
  //       currentSongIndex:
  //         currentSongIndex !== undefined
  //           ? currentSongIndex
  //           : prevData.currentSongIndex,
  //       queue: newQueue || prevData.queue,
  //     };
  //   });
  //   if (playCurrentSongIndex && typeof currentSongIndex === 'number')
  //     playSong(queue.queue[currentSongIndex]);
  // };

  // console.log('queue', queue.currentSongIndex);

  const changePromptMenuData = (
    isVisible = false,
    content?: ReactElement<any, any>,
    className = ''
  ) => {
    setPromptMenuData((prevData) => {
      return {
        isVisible,
        content: content || prevData.content,
        className: className || prevData.className,
      };
    });
  };

  const updateDialogMenuData = (
    delay = 5000,
    content: ReactElement<any, any>
  ) => {
    if (delay === 0) {
      setDialogMenuData((prevData) => {
        return { ...prevData, isVisible: false };
      });
    } else {
      setDialogMenuData({ isVisible: true, content });
      setTimeout(
        () =>
          setDialogMenuData((prevData) => {
            return { ...prevData, isVisible: false };
          }),
        delay
      );
    }
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
      <ContextMenu
        isVisible={contextMenuData.isVisible}
        menuItems={contextMenuData.menuItems}
        pageX={contextMenuData.pageX}
        pageY={contextMenuData.pageY}
        updateContextMenuData={updateContextMenuData}
      />
      <PromptMenu
        data={promptMenuData}
        changePromptMenuData={changePromptMenuData}
      />
      <Header setDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <BodyAndSideBarContainer
        playSong={playSong}
        currentSongData={currentSongData}
        changeCurrentActivePage={changeCurrentActivePage}
        currentlyActivePage={currentlyActivePage}
        changePromptMenuData={changePromptMenuData}
        dialogMenuData={dialogMenuData}
        updateDialogMenuData={updateDialogMenuData}
        updateContextMenuData={updateContextMenuData}
        // createQueue={createQueue}
        // queue={queue}
        // updateQueueData={updateQueueData}
      />
      <SongControlsContainer
        playSong={playSong}
        currentSongData={currentSongData}
        userData={userData}
        currentlyActivePage={currentlyActivePage}
        changeCurrentActivePage={changeCurrentActivePage}
        isStartPlay={startPlay}
        updateContextMenuData={updateContextMenuData}
        // changeQueueCurrentSongIndex={changeQueueCurrentSongIndex}
        // queue={queue}
      />
    </div>
  );
}

export default App;
