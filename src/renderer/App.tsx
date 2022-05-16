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
import { AppContext } from './contexts/AppContext';
import MiniPlayer from './components/MiniPlayer/MiniPlayer';

interface AppReducer {
  userData?: UserData;
  startPlay: boolean;
  isDarkMode: boolean;
  currentSongData: AudioData;
  queue: Queue;
  PromptMenuData: PromptMenuData;
  notificationPanelData: NotificationPanelData;
  contextMenuData: ContextMenuData;
  navigationHistory: NavigationHistoryData;
  isCurrentSongPlaying: boolean;
  isMiniPlayer: boolean;
  volume: { isMuted: boolean; value: number };
  isRepeating: boolean;
  songPosition: number;
  isShuffling: boolean;
}

type AppReducerStateActions =
  | 'USER_DATA_CHANGE'
  | 'START_PLAY_STATE_CHANGE'
  | 'IS_DARK_MODE_CHANGE'
  | 'CURRENT_SONG_DATA_CHANGE'
  | 'CURRENT_SONG_PLAYBACK_STATE'
  | 'QUEUE_DATA_CHANGE'
  | 'PROMPT_MENU_DATA_CHANGE'
  | 'NOTIFICATION_PANEL_DATA_CHANGE'
  | 'CONTEXT_MENU_DATA_CHANGE'
  | 'CONTEXT_MENU_VISIBILITY_CHANGE'
  | 'CURRENT_ACTIVE_PAGE_CHANGE'
  | 'UPDATE_NAVIGATION_HISTORY_DATA'
  | 'UPDATE_MINI_PLAYER_STATE'
  | 'UPDATE_VOLUME'
  | 'UPDATE_MUTED_STATE'
  | 'UPDATE_SONG_POSITION'
  | 'UPDATE_IS_REPEATING_STATE'
  | 'TOGGLE_IS_FAVORITE_STATE'
  | 'TOGGLE_SHUFFLE_STATE'
  | 'UPDATE_VOLUME_VALUE'
  | 'CURRENT_SONG_INDEX_CHANGE';

const reducer = (
  state: AppReducer,
  action: { type: AppReducerStateActions; data?: any }
): AppReducer => {
  switch (action.type) {
    case 'IS_DARK_MODE_CHANGE':
      return {
        ...state,
        isDarkMode: action.data || !state.isDarkMode,
      };
    case 'START_PLAY_STATE_CHANGE':
      return {
        ...state,
        startPlay: action.data || state.startPlay,
      };
    case 'USER_DATA_CHANGE':
      return {
        ...state,
        userData: action.data || state.userData,
      };
    case 'QUEUE_DATA_CHANGE':
      return {
        ...state,
        queue: (action.data as Queue) || state.queue,
      };
    case 'CURRENT_SONG_INDEX_CHANGE':
      return {
        ...state,
        queue: {
          ...state.queue,
          currentSongIndex:
            action.data !== undefined
              ? Number(action.data)
              : state.queue.currentSongIndex,
        },
      };
    case 'PROMPT_MENU_DATA_CHANGE':
      return {
        ...state,
        PromptMenuData: (action.data as PromptMenuData) || state.PromptMenuData,
      };
    case 'NOTIFICATION_PANEL_DATA_CHANGE':
      return {
        ...state,
        notificationPanelData:
          (action.data as NotificationPanelData) || state.notificationPanelData,
      };
    case 'CONTEXT_MENU_DATA_CHANGE':
      return {
        ...state,
        contextMenuData:
          (action.data as ContextMenuData) || state.contextMenuData,
      };
    case 'CONTEXT_MENU_VISIBILITY_CHANGE':
      return {
        ...state,
        contextMenuData: {
          ...state.contextMenuData,
          isVisible: action.data,
        },
      };
    case 'CURRENT_ACTIVE_PAGE_CHANGE':
      return {
        ...state,
        navigationHistory: {
          pageHistoryIndex: state.navigationHistory.pageHistoryIndex + 1,
          history: action.data
            ? [
                ...state.navigationHistory.history,
                action.data as NavigationHistory,
              ]
            : state.navigationHistory.history,
        },
      };
    case 'UPDATE_NAVIGATION_HISTORY_DATA':
      return {
        ...state,
        navigationHistory: action.data || state.navigationHistory,
      };
    case 'CURRENT_SONG_DATA_CHANGE':
      return {
        ...state,
        currentSongData:
          Object.keys(action.data).length > 0
            ? action.data
            : state.currentSongData,
      };
    case 'CURRENT_SONG_PLAYBACK_STATE':
      return {
        ...state,
        isCurrentSongPlaying:
          action.data !== undefined ? action.data : !state.isCurrentSongPlaying,
      };
    case 'UPDATE_MINI_PLAYER_STATE':
      window.api.toggleMiniPlayer(
        action.data !== undefined ? action.data : state.isMiniPlayer
      );
      return {
        ...state,
        isMiniPlayer:
          action.data !== undefined ? action.data : state.isMiniPlayer,
      };
    case 'UPDATE_SONG_POSITION':
      return {
        ...state,
        songPosition:
          action.data !== undefined ? action.data : state.songPosition,
      };
    case 'UPDATE_IS_REPEATING_STATE':
      return {
        ...state,
        isRepeating:
          action.data !== undefined ? action.data : !state.isRepeating,
      };
    case 'TOGGLE_IS_FAVORITE_STATE':
      return {
        ...state,
        currentSongData: {
          ...state.currentSongData,
          isAFavorite:
            action.data !== undefined
              ? action.data
              : !state.currentSongData.isAFavorite,
        },
      };
    case 'TOGGLE_SHUFFLE_STATE':
      return {
        ...state,
        isShuffling:
          action.data !== undefined ? action.data : !state.isShuffling,
      };
    case 'UPDATE_VOLUME':
      return {
        ...state,
        volume: action.data !== undefined ? action.data : state.volume,
      };
    case 'UPDATE_VOLUME_VALUE':
      return {
        ...state,
        volume: {
          ...state.volume,
          value: action.data !== undefined ? action.data : state.volume.value,
        },
      };
    case 'UPDATE_MUTED_STATE':
      return {
        ...state,
        volume: {
          ...state.volume,
          isMuted:
            action.data !== undefined ? action.data : !state.volume.isMuted,
        },
      };
    default:
      return state;
  }
};

const player = new Audio();

export default function App() {
  const [content, dispatch] = React.useReducer(reducer, {
    isDarkMode: false,
    startPlay: false,
    isMiniPlayer: false,
    userData: undefined,
    currentSongData: {} as AudioData,
    isCurrentSongPlaying: false,
    navigationHistory: {
      pageHistoryIndex: 0,
      history: [
        {
          pageTitle: 'Home',
          data: undefined,
        },
      ],
    },
    contextMenuData: {
      isVisible: false,
      menuItems: [],
      pageX: 200,
      pageY: 200,
    },
    notificationPanelData: {
      isVisible: false,
      content: <span></span>,
    },
    PromptMenuData: {
      isVisible: false,
      content: <span></span>,
      className: '',
    },
    queue: {
      currentSongIndex: null,
      queue: [],
    },
    volume: { isMuted: false, value: 50 },
    isRepeating: false,
    isShuffling: false,
    songPosition: 0,
  } as AppReducer);

  if (content.isCurrentSongPlaying && player.readyState > 0) player.play();
  else player.pause();

  React.useEffect(() => {
    player.addEventListener('canplay', () => {
      if (content.startPlay) player.play();
      else player.pause();
    });
  }, []);

  React.useEffect(
    () => playSong(content.queue.queue[Number(content.queue.currentSongIndex)]),
    [content.queue.currentSongIndex]
  );

  const playCurrentSong = () => content.startPlay && toggleSongPlayback();

  const handleSongEnd = () => {
    if (content.isRepeating) {
      player.currentTime = 0;
      player.play();
    } else {
      handleSkipForwardClick();
    }
  };

  const toggleSongPlayback = () =>
    dispatch({
      type: 'CURRENT_SONG_PLAYBACK_STATE',
    });

  React.useEffect(() => {
    player.addEventListener('canplay', playCurrentSong);
    player.addEventListener('ended', handleSongEnd);
    return () => {
      player.removeEventListener('canplay', playCurrentSong);
      player.addEventListener('ended', handleSongEnd);
    };
  }, []);

  // VOLUME RELATED SETTINGS
  React.useEffect(() => {
    player.volume = content.volume.value / 100;
    player.muted = content.volume.isMuted;
  }, [content.volume]);

  const manageSpaceKeyPlayback = (e: KeyboardEvent) => {
    e.preventDefault();
    if (e.code === 'Space') toggleSongPlayback();
  };

  const addSongTitleToTitleBar = () => {
    if (content.currentSongData.title && content.currentSongData.artists)
      document.title = `${content.currentSongData.title} - ${
        Array.isArray(content.currentSongData.artists)
          ? content.currentSongData.artists.join(', ')
          : content.currentSongData.artists
      }`;
  };

  React.useEffect(() => {
    player.addEventListener('pause', () => {
      document.title = `Oto Music For Desktop`;
      window.api.saveUserData(
        'currentSong.stoppedPosition',
        player.currentTime.toString()
      );
    });

    player.addEventListener('timeupdate', (e) => {
      dispatch({
        type: 'UPDATE_SONG_POSITION',
        data: Math.floor((e.target as HTMLAudioElement).currentTime),
      });
    });
    player.addEventListener('ended', handleSongEnd);
    player.addEventListener('play', addSongTitleToTitleBar);
    return () => {
      player.removeEventListener('ended', handleSongEnd);
      player.removeEventListener('play', addSongTitleToTitleBar);
    };
  }, []);

  const toggleRepeat = () => dispatch({ type: 'UPDATE_IS_REPEATING_STATE' });

  const handleSkipBackwardClick = () => {
    const { currentSongIndex } = content.queue;
    if (player.currentTime > 5) player.currentTime = 0;
    else if (typeof currentSongIndex === 'number') {
      if (currentSongIndex === 0)
        changeQueueCurrentSongIndex(content.queue.queue.length - 1);
      else changeQueueCurrentSongIndex(currentSongIndex - 1);
    } else changeQueueCurrentSongIndex(0);
  };

  const handleSkipForwardClick = () => {
    const { currentSongIndex } = content.queue;
    console.log('isRepeating ', content.isRepeating);
    if (content.isRepeating) {
      player.currentTime = 0;
      toggleSongPlayback();
    } else if (typeof currentSongIndex === 'number') {
      if (content.queue.queue.length - 1 === currentSongIndex)
        changeQueueCurrentSongIndex(0);
      else changeQueueCurrentSongIndex(currentSongIndex + 1);
    } else changeQueueCurrentSongIndex(0);
  };

  const handleContextMenuDataUpdate = () =>
    dispatch({
      type: 'CONTEXT_MENU_VISIBILITY_CHANGE',
      data: false,
    });

  React.useEffect(() => {
    window.addEventListener('click', handleContextMenuDataUpdate);
    window.addEventListener('keypress', manageSpaceKeyPlayback);
    return () => {
      window.removeEventListener('click', handleContextMenuDataUpdate);
      window.removeEventListener('keypress', manageSpaceKeyPlayback);
    };
  }, []);

  React.useEffect(() => {
    window.api.getUserData().then((res) => {
      if (!res) return;
      dispatch({ type: 'USER_DATA_CHANGE', data: res });
      dispatch({ type: 'IS_DARK_MODE_CHANGE', data: res.theme.isDarkMode });
      dispatch({ type: 'UPDATE_VOLUME', data: res.volume });
      content.navigationHistory.history.at(-1)?.pageTitle !== res.defaultPage &&
        dispatch({
          type: 'CURRENT_ACTIVE_PAGE_CHANGE',
          data: { pageTitle: res.defaultPage, data: undefined },
        });
      if (res.currentSong.songId) playSong(res.currentSong.songId, false);
    });
    window.api.checkForSongs().then((audioData) => {
      if (!audioData) return undefined;
      createQueue(audioData.map((song) => song.songId));
      return undefined;
    });
    window.api.getMessageFromMain((_, message) => {
      updateNotificationPanelData(5000, <span>{message}</span>);
    });
    window.api.dataUpdateEvent((_, dataType, message) =>
      console.log(dataType, message)
    );
  }, []);

  React.useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: content.currentSongData.title,
        artist: Array.isArray(content.currentSongData.artists)
          ? content.currentSongData.artists.join(', ')
          : content.currentSongData.artists,
        album: content.currentSongData.album || 'Unknown Album',
        artwork: [
          {
            src: `data:;base64,${content.currentSongData.artwork}`,
            sizes: '300x300',
            type: 'image/png',
          },
        ],
      });
      navigator.mediaSession.setActionHandler('pause', toggleSongPlayback);
      navigator.mediaSession.setActionHandler('play', toggleSongPlayback);
      navigator.mediaSession.setActionHandler(
        'previoustrack',
        handleSkipBackwardClick
      );
      navigator.mediaSession.setActionHandler(
        `nexttrack`,
        handleSkipForwardClick
      );
    }
  }, [content.currentSongData]);

  const playSong = (songId: string, isStartPlay = true) => {
    if (content.currentSongData.songId === songId)
      dispatch({ type: 'START_PLAY_STATE_CHANGE', data: true });
    else if (isStartPlay !== content.startPlay)
      dispatch({ type: 'START_PLAY_STATE_CHANGE', data: isStartPlay });
    content.currentSongData.songId !== songId &&
      window.api.getSong(songId).then((songData) => {
        if (songData) {
          console.log('playSong', songId, songData.path);
          dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });
          player.src = `otoMusic://localFiles/${songData.path}`;
          window.api.saveUserData('currentSong.songId', songData.songId);
          if (
            content.queue.queue.length > 0 &&
            content.queue.queue.includes(songData.songId)
          ) {
            dispatch({
              type: 'QUEUE_DATA_CHANGE',
              data: {
                ...content.queue,
                currentSongIndex: content.queue.queue.indexOf(songData.songId),
              },
            });
          }
        } else console.log(songData);
      });
  };

  const createQueue = (
    songIds: string[],
    playlistId?: string,
    startPlaying = false
  ) => {
    dispatch({
      type: 'QUEUE_DATA_CHANGE',
      data: {
        currentSongIndex: 0,
        playlistId: playlistId || undefined,
        queue: songIds.map((songId) => songId),
      } as Queue,
    });
    if (startPlaying) changeQueueCurrentSongIndex(0);
  };

  const changeQueueCurrentSongIndex = (currentSongIndex: number) => {
    console.log('currentSongIndex', currentSongIndex);
    dispatch({
      type: 'CURRENT_SONG_INDEX_CHANGE',
      data: currentSongIndex,
    });
  };

  const updateQueueData = (
    currentSongIndex?: number,
    newQueue?: string[],
    playCurrentSongIndex = true
  ) => {
    dispatch({
      type: 'QUEUE_DATA_CHANGE',
      data: {
        ...content.queue,
        currentSongIndex:
          currentSongIndex !== undefined
            ? currentSongIndex
            : content.queue.currentSongIndex,
        queue: newQueue || content.queue.queue,
      },
    });
    dispatch({ type: 'TOGGLE_SHUFFLE_STATE' });
    if (playCurrentSongIndex && typeof currentSongIndex === 'number')
      playSong(content.queue.queue[currentSongIndex]);
  };

  const updateCurrentSongPlaybackState = (isPlaying: boolean) => {
    isPlaying !== content.isCurrentSongPlaying &&
      dispatch({ type: 'CURRENT_SONG_PLAYBACK_STATE', data: isPlaying });
  };

  const toggleDarkMode = (theme?: 'dark' | 'light') => {
    if (theme) {
      const isDarkMode = theme === 'dark';
      isDarkMode !== content.isDarkMode &&
        window.api.saveUserData('theme.isDarkMode', isDarkMode.toString());
      dispatch({
        type: 'IS_DARK_MODE_CHANGE',
        data: isDarkMode,
      });
    } else {
      window.api.saveUserData(
        'theme.isDarkMode',
        (!content.isDarkMode).toString()
      );
      dispatch({
        type: 'IS_DARK_MODE_CHANGE',
        data: !content.isDarkMode,
      });
    }
  };

  const updateContextMenuData = (
    isVisible: boolean,
    menuItems: ContextMenuItem[] = [],
    pageX?: number,
    pageY?: number
  ) => {
    console.log('context menu event triggered', isVisible, pageX, pageY);
    dispatch({
      type: 'CONTEXT_MENU_DATA_CHANGE',
      data: {
        isVisible,
        menuItems:
          menuItems.length > 0 ? menuItems : content.contextMenuData.menuItems,
        pageX: pageX !== undefined ? pageX : content.contextMenuData.pageX,
        pageY: pageY !== undefined ? pageY : content.contextMenuData.pageY,
      },
    });
  };

  const changeCurrentActivePage = (pageClass: PageTitles, data?: object) =>
    (content.navigationHistory.history.at(-1)?.pageTitle !== pageClass ||
      content.navigationHistory.history.at(-1)?.data !== data) &&
    dispatch({
      type: 'CURRENT_ACTIVE_PAGE_CHANGE',
      data: {
        pageTitle: pageClass,
        data,
      },
    });

  const changePromptMenuData = (
    isVisible = false,
    contentData?: ReactElement<any, any>,
    className = ''
  ) => {
    dispatch({
      type: 'PROMPT_MENU_DATA_CHANGE',
      data: {
        isVisible,
        content: contentData || content.PromptMenuData.content,
        className: className || content.PromptMenuData.className,
      },
    });
  };

  const updateNotificationPanelData = (
    delay = 5000,
    contentData: ReactElement<any, any>
  ) => {
    if (delay === 0) {
      dispatch({
        type: 'NOTIFICATION_PANEL_DATA_CHANGE',
        data: { ...content.notificationPanelData, isVisible: false },
      });
    } else {
      dispatch({
        type: 'NOTIFICATION_PANEL_DATA_CHANGE',
        data: { isVisible: true, content: contentData },
      });
      setTimeout(
        () =>
          dispatch({
            type: 'NOTIFICATION_PANEL_DATA_CHANGE',
            data: { ...content.notificationPanelData, isVisible: false },
          }),
        delay
      );
    }
  };

  const updatePageHistoryIndex = (
    type: 'increment' | 'decrement',
    index?: number
  ) => {
    if (type === 'decrement') {
      const { history } = content.navigationHistory;
      history.pop();
      dispatch({
        type: 'UPDATE_NAVIGATION_HISTORY_DATA',
        data: {
          pageHistoryIndex:
            index !== undefined
              ? content.navigationHistory.pageHistoryIndex - index
              : content.navigationHistory.pageHistoryIndex - 1,
          history,
        } as NavigationHistoryData,
      });
    }
  };

  const updateMiniPlayerStatus = (isVisible: boolean) => {
    content.isMiniPlayer !== isVisible &&
      dispatch({ type: 'UPDATE_MINI_PLAYER_STATE', data: isVisible });
  };

  const toggleIsFavorite = (isFavorite: boolean) => {
    content.currentSongData.isAFavorite !== isFavorite &&
      window.api
        .toggleLikeSong(content.currentSongData.songId, isFavorite)
        .then(() =>
          dispatch({ type: 'TOGGLE_IS_FAVORITE_STATE', data: isFavorite })
        )
        .catch((err) => console.log(err));
  };

  const updateVolume = (volume: number) =>
    dispatch({
      type: 'UPDATE_VOLUME_VALUE',
      data: volume,
    });

  const updateSongPosition = (position: number) => {
    if (position >= 0 && position <= player.duration)
      player.currentTime = position;
  };

  const toggleMutedState = (isMuted?: boolean) => {
    if (isMuted !== undefined)
      isMuted !== content.volume.isMuted &&
        dispatch({ type: 'UPDATE_MUTED_STATE', data: isMuted });
    else dispatch({ type: 'UPDATE_MUTED_STATE' });
  };

  return (
    <AppContext.Provider
      value={{
        toggleDarkMode,
        isDarkMode: content.isDarkMode,
        isContextMenuVisible: content.contextMenuData.isVisible,
        contextMenuItems: content.contextMenuData.menuItems,
        contextMenuPageX: content.contextMenuData.pageX,
        contextMenuPageY: content.contextMenuData.pageY,
        updateContextMenuData,
        PromptMenuData: content.PromptMenuData,
        changePromptMenuData,
        playSong,
        currentSongData: content.currentSongData,
        currentlyActivePage:
          content.navigationHistory.history[
            content.navigationHistory.pageHistoryIndex
          ],
        changeCurrentActivePage,
        updateNotificationPanelData,
        notificationPanelData: content.notificationPanelData,
        userData: content.userData,
        isStartPlay: content.startPlay,
        createQueue,
        queue: content.queue,
        updateQueueData,
        changeQueueCurrentSongIndex,
        updateCurrentSongPlaybackState,
        isCurrentSongPlaying: content.isCurrentSongPlaying,
        pageHistoryIndex: content.navigationHistory.pageHistoryIndex,
        updatePageHistoryIndex,
        updateMiniPlayerStatus,
        isMiniPlayer: content.isMiniPlayer,
        handleSkipBackwardClick,
        handleSkipForwardClick,
        songPosition: content.songPosition,
        volume: content.volume.value,
        isMuted: content.volume.isMuted,
        isRepeating: content.isRepeating,
        isShuffling: content.isShuffling,
        toggleSongPlayback,
        toggleRepeat,
        toggleIsFavorite,
        updateVolume,
        updateSongPosition,
        toggleMutedState,
        isPlaying: !player.paused,
      }}
    >
      {!content.isMiniPlayer && (
        <div className={`App ${content.isDarkMode ? 'dark-mode' : ''}`}>
          <ContextMenu />
          <PromptMenu />
          <Header />
          <BodyAndSideBarContainer />
          <SongControlsContainer />
        </div>
      )}
      {content.isMiniPlayer && <MiniPlayer />}
    </AppContext.Provider>
  );
}
