/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { ReactElement } from 'react';
import '../../assets/styles/main.css';
import Header from './components/Header/Header';
import { BodyAndSideBarContainer } from './components/bodyAndSidebarContainer';
import SongControlsContainer from './components/SongsControlsContainer/SongControlsContainer';
import { PromptMenu } from './components/PromptMenu/PromptMenu';
import ContextMenu from './components/ContextMenu/ContextMenu';
import { AppContext, SongPositionContext } from './contexts/AppContext';
import MiniPlayer from './components/MiniPlayer/MiniPlayer';

interface AppReducer {
  userData?: UserData;
  isDarkMode: boolean;
  currentSongData: AudioData;
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
  | 'PROMPT_MENU_DATA_CHANGE'
  | 'NOTIFICATION_PANEL_DATA_CHANGE'
  | 'CONTEXT_MENU_DATA_CHANGE'
  | 'CONTEXT_MENU_VISIBILITY_CHANGE'
  | 'CURRENT_ACTIVE_PAGE_CHANGE'
  | 'CURRENT_ACTIVE_PAGE_DATA_UPDATE'
  | 'UPDATE_NAVIGATION_HISTORY_DATA'
  | 'UPDATE_MINI_PLAYER_STATE'
  | 'UPDATE_VOLUME'
  | 'UPDATE_MUTED_STATE'
  | 'UPDATE_SONG_POSITION'
  | 'UPDATE_IS_REPEATING_STATE'
  | 'TOGGLE_IS_FAVORITE_STATE'
  | 'TOGGLE_SHUFFLE_STATE'
  | 'UPDATE_VOLUME_VALUE';

const reducer = (
  state: AppReducer,
  action: { type: AppReducerStateActions; data?: unknown }
): AppReducer => {
  switch (action.type) {
    case 'IS_DARK_MODE_CHANGE':
      return {
        ...state,
        isDarkMode:
          typeof action.data === 'boolean' &&
          (action.data || !state.isDarkMode),
      };
    case 'USER_DATA_CHANGE':
      return {
        ...state,
        userData:
          typeof action.data === 'object'
            ? (action.data as UserData)
            : state.userData,
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
          isVisible:
            typeof action.data === 'boolean'
              ? action.data
              : state.contextMenuData.isVisible,
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
    case 'CURRENT_ACTIVE_PAGE_DATA_UPDATE':
      state.navigationHistory.history[
        state.navigationHistory.pageHistoryIndex
      ].data = action.data;
      return {
        ...state,
        navigationHistory: state.navigationHistory,
      };
    case 'UPDATE_NAVIGATION_HISTORY_DATA':
      return {
        ...state,
        navigationHistory:
          typeof action.data === 'object'
            ? { ...state.navigationHistory, ...action.data }
            : state.navigationHistory,
      };
    case 'CURRENT_SONG_DATA_CHANGE':
      return {
        ...state,
        currentSongData:
          typeof action.data === 'object'
            ? { ...state.currentSongData, ...action.data }
            : state.currentSongData,
      };
    case 'CURRENT_SONG_PLAYBACK_STATE':
      return {
        ...state,
        isCurrentSongPlaying:
          typeof action.data === 'boolean'
            ? action.data
            : !state.isCurrentSongPlaying,
      };
    case 'UPDATE_MINI_PLAYER_STATE':
      window.api.toggleMiniPlayer(
        typeof action.data === 'boolean' ? action.data : state.isMiniPlayer
      );
      return {
        ...state,
        isMiniPlayer:
          typeof action.data === 'boolean' ? action.data : state.isMiniPlayer,
      };
    case 'UPDATE_SONG_POSITION':
      return {
        ...state,
        songPosition:
          typeof action.data === 'number' ? action.data : state.songPosition,
      };
    case 'UPDATE_IS_REPEATING_STATE':
      return {
        ...state,
        isRepeating:
          typeof action.data === 'boolean' ? action.data : !state.isRepeating,
      };
    case 'TOGGLE_IS_FAVORITE_STATE':
      return {
        ...state,
        currentSongData: {
          ...state.currentSongData,
          isAFavorite:
            typeof action.data === 'boolean'
              ? action.data
              : !state.currentSongData.isAFavorite,
        },
      };
    case 'TOGGLE_SHUFFLE_STATE':
      return {
        ...state,
        isShuffling:
          typeof action.data === 'boolean' ? action.data : !state.isShuffling,
      };
    case 'UPDATE_VOLUME':
      return {
        ...state,
        volume:
          typeof action.data === 'object'
            ? { ...state.volume, ...action.data }
            : state.volume,
      };
    case 'UPDATE_VOLUME_VALUE':
      return {
        ...state,
        volume: {
          ...state.volume,
          value:
            typeof action.data === 'number' ? action.data : state.volume.value,
        },
      };
    case 'UPDATE_MUTED_STATE':
      return {
        ...state,
        volume: {
          ...state.volume,
          isMuted:
            typeof action.data === 'boolean'
              ? action.data
              : !state.volume.isMuted,
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
      icon: <></>,
      content: <span />,
    },
    PromptMenuData: {
      isVisible: false,
      content: <span />,
      className: '',
    },
    volume: { isMuted: false, value: 50 },
    isRepeating: false,
    isShuffling: false,
    songPosition: 0,
  } as AppReducer);

  const [, startTransition] = React.useTransition();

  const refStartPlay = React.useRef(false);
  const refQueue = React.useRef({
    currentSongIndex: null,
    queue: [],
    queueType: 'songs',
  } as Queue);

  // const playCurrentSong = () => content.startPlay && toggleSongPlayback();

  const handleSongEnd = () => {
    if (content.isRepeating) {
      player.currentTime = 0;
      player.play();
    } else {
      handleSkipForwardClick();
    }
  };

  const toggleSongPlayback = () => {
    if (player.paused) player.play();
    else player.pause();
  };

  React.useEffect(() => {
    player.addEventListener('play', () => {
      dispatch({
        type: 'CURRENT_SONG_PLAYBACK_STATE',
        data: true,
      });
    });
    player.addEventListener('pause', () => {
      dispatch({
        type: 'CURRENT_SONG_PLAYBACK_STATE',
        data: false,
      });
    });
    window.api.beforeQuitEvent(async () => {
      window.api.sendSongPosition(player.currentTime);
      await window.api.saveUserData('isShuffling', content.isShuffling);
      await window.api.saveUserData('isRepeating', content.isRepeating);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    player.addEventListener('canplay', () => {
      if (refStartPlay.current) player.play();
    });
    player.addEventListener('ended', handleSongEnd);
    player.addEventListener('play', addSongTitleToTitleBar);
    player.addEventListener('pause', () => {
      document.title = `Oto Music For Desktop`;
      window.api.saveUserData(
        'currentSong.stoppedPosition',
        player.currentTime
      );
    });
    player.addEventListener('timeupdate', (e) => {
      if (Math.floor((e.target as HTMLAudioElement).currentTime) % 1 === 0)
        startTransition(() =>
          dispatch({
            type: 'UPDATE_SONG_POSITION',
            data: Math.floor((e.target as HTMLAudioElement).currentTime),
          })
        );
    });

    return () => {
      player.removeEventListener('play', addSongTitleToTitleBar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // VOLUME RELATED SETTINGS
  React.useEffect(() => {
    player.volume = content.volume.value / 100;
    player.muted = content.volume.isMuted;
  }, [content.volume]);

  React.useEffect(() => {
    window.api
      .getUserData()
      .then((res) => {
        if (!res) return;
        dispatch({ type: 'USER_DATA_CHANGE', data: res });
        dispatch({ type: 'IS_DARK_MODE_CHANGE', data: res.theme.isDarkMode });
        dispatch({ type: 'UPDATE_VOLUME', data: res.volume });
        dispatch({
          type: 'TOGGLE_SHUFFLE_STATE',
          data: res.isShuffling || false,
        });
        dispatch({
          type: 'UPDATE_IS_REPEATING_STATE',
          data: res.isRepeating || false,
        });
        if (
          content.navigationHistory.history.at(-1)?.pageTitle !==
          res.defaultPage
        )
          dispatch({
            type: 'CURRENT_ACTIVE_PAGE_CHANGE',
            data: { pageTitle: res.defaultPage, data: undefined },
          });
        if (res.currentSong.songId) playSong(res.currentSong.songId, false);
        player.currentTime = Number(res.currentSong.stoppedPosition);
        // eslint-disable-next-line promise/always-return
        if (res.queue) {
          refQueue.current = {
            ...refQueue.current,
            queue: res.queue.queue || [],
            queueType: res.queue.queueType,
            queueId: res.queue.queueId,
          };
        } else {
          // eslint-disable-next-line promise/no-nesting
          window.api
            .checkForSongs()
            .then((audioData) => {
              if (!audioData) return undefined;
              createQueue(
                audioData.map((song) => song.songId),
                'songs'
              );
              return undefined;
            })
            .catch((err) => console.log(err));
        }
      })
      .catch((err) => console.log(err));
    window.api.getMessageFromMain((_, message) => {
      updateNotificationPanelData(5000, <span>{message}</span>);
    });
    window.api.dataUpdateEvent((_, dataType, message) =>
      console.log('Data update event occurred.', dataType, message)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: content.currentSongData.title,
        artist: Array.isArray(content.currentSongData.artists)
          ? content.currentSongData.artists.join(', ')
          : content.currentSongData.artists,
        album: content.currentSongData.album
          ? content.currentSongData.album.name || 'Unknown Album'
          : 'Unknown Album',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.currentSongData]);

  const handleContextMenuVisibilityUpdate = () =>
    dispatch({
      type: 'CONTEXT_MENU_VISIBILITY_CHANGE',
      data: false,
    });

  const manageSpaceKeyPlayback = (e: KeyboardEvent) => {
    e.preventDefault();
    if (e.code === 'Space') toggleSongPlayback();
  };

  React.useEffect(() => {
    window.addEventListener('click', handleContextMenuVisibilityUpdate);
    window.addEventListener('keypress', manageSpaceKeyPlayback);
    return () => {
      window.removeEventListener('click', handleContextMenuVisibilityUpdate);
      window.removeEventListener('keypress', manageSpaceKeyPlayback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSongTitleToTitleBar = () => {
    if (content.currentSongData.title && content.currentSongData.artists)
      document.title = `${content.currentSongData.title} - ${
        Array.isArray(content.currentSongData.artists)
          ? content.currentSongData.artists.join(', ')
          : content.currentSongData.artists
      }`;
  };

  const toggleRepeat = () => dispatch({ type: 'UPDATE_IS_REPEATING_STATE' });

  const handleSkipBackwardClick = () => {
    const { currentSongIndex } = refQueue.current;
    if (player.currentTime > 5) player.currentTime = 0;
    else if (typeof currentSongIndex === 'number') {
      if (currentSongIndex === 0)
        changeQueueCurrentSongIndex(refQueue.current.queue.length - 1);
      else changeQueueCurrentSongIndex(currentSongIndex - 1);
    } else changeQueueCurrentSongIndex(0);
  };

  const handleSkipForwardClick = () => {
    const { currentSongIndex } = refQueue.current;
    console.log('isRepeating ', content.isRepeating);
    if (content.isRepeating) {
      player.currentTime = 0;
      toggleSongPlayback();
      window.api.incrementNoOfSongListens(content.currentSongData.songId);
    } else if (typeof currentSongIndex === 'number') {
      if (refQueue.current.queue.length - 1 === currentSongIndex)
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        true; // changeQueueCurrentSongIndex(0); prevents repeating the playlist
      else changeQueueCurrentSongIndex(currentSongIndex + 1);
    } else changeQueueCurrentSongIndex(0);
  };

  const playSong = (songId: string, isStartPlay = true) => {
    if (content.currentSongData.songId === songId) toggleSongPlayback();
    else
      window.api
        .getSong(songId)
        .then((songData) => {
          if (songData) {
            console.log('playSong', songId, songData.path);
            dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });
            if (player.src !== `otoMusic://localFiles/${songData.path}`)
              player.src = `otoMusic://localFiles/${songData.path}`;
            window.api.saveUserData('currentSong.songId', songData.songId);
            refStartPlay.current = isStartPlay;
            if (isStartPlay) toggleSongPlayback();
            if (refQueue.current.queue.length > 0) {
              refQueue.current.currentSongIndex =
                refQueue.current.queue.indexOf(songData.songId) || 0;
            } else if (refQueue.current.queue.length === 0)
              refQueue.current.queue.push(songData.songId);
          } else console.log(songData);
          return undefined;
        })
        .catch((err) => console.log(err));
  };

  const createQueue = (
    songIds: string[],
    queueType: QueueTypes,
    queueId?: string,
    startPlaying = false
  ) => {
    window.api
      .saveUserData('queue', {
        queue: songIds,
        queueType,
        queueId,
        currentSongIndex: 0,
      })
      .then(() => {
        refQueue.current = {
          currentSongIndex: 0,
          queue: songIds.map((songId) => songId),
          queueId,
          queueType,
        };
        if (startPlaying) return changeQueueCurrentSongIndex(0);
        return undefined;
      })
      .catch((err: Error) => console.log(err));
  };

  const changeQueueCurrentSongIndex = (currentSongIndex: number) => {
    console.log('currentSongIndex', currentSongIndex);
    refQueue.current.currentSongIndex = currentSongIndex;
    playSong(refQueue.current.queue[currentSongIndex]);
  };

  const updateQueueData = (
    currentSongIndex?: number,
    newQueue?: string[],
    playCurrentSongIndex = true
  ) => {
    window.api.saveUserData('queue', {
      ...refQueue.current,
      currentSongIndex: currentSongIndex ?? refQueue.current.currentSongIndex,
      queue: newQueue ?? refQueue.current.queue,
    } as Queue);
    if (currentSongIndex !== undefined)
      refQueue.current.currentSongIndex = currentSongIndex;
    if (newQueue) refQueue.current.queue = newQueue;
    if (playCurrentSongIndex && typeof currentSongIndex === 'number')
      playSong(refQueue.current.queue[currentSongIndex]);
  };

  const toggleShuffling = (isShuffling?: boolean) =>
    dispatch({ type: 'TOGGLE_SHUFFLE_STATE', data: isShuffling });

  const updateCurrentSongPlaybackState = (isPlaying: boolean) => {
    if (isPlaying !== content.isCurrentSongPlaying)
      dispatch({ type: 'CURRENT_SONG_PLAYBACK_STATE', data: isPlaying });
  };

  const toggleDarkMode = (theme?: 'dark' | 'light') => {
    if (theme) {
      const isDarkMode = theme === 'dark';
      if (isDarkMode !== content.isDarkMode)
        window.api.saveUserData('theme.isDarkMode', isDarkMode);
      dispatch({
        type: 'IS_DARK_MODE_CHANGE',
        data: isDarkMode,
      });
    } else {
      window.api.saveUserData('theme.isDarkMode', !content.isDarkMode);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contentData: ReactElement<any, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: ReactElement<any, any> = <></>
  ) => {
    if (delay === 0) {
      dispatch({
        type: 'NOTIFICATION_PANEL_DATA_CHANGE',
        data: {
          ...content.notificationPanelData,
          isVisible: false,
          icon: <></>,
        },
      });
    } else {
      dispatch({
        type: 'NOTIFICATION_PANEL_DATA_CHANGE',
        data: { isVisible: true, content: contentData, icon },
      });
      setTimeout(
        () =>
          dispatch({
            type: 'NOTIFICATION_PANEL_DATA_CHANGE',
            data: {
              ...content.notificationPanelData,
              isVisible: false,
              icon: <></>,
            },
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
            index !== undefined &&
            index < content.navigationHistory.pageHistoryIndex
              ? content.navigationHistory.pageHistoryIndex - index
              : content.navigationHistory.pageHistoryIndex - 1,
          history,
        } as NavigationHistoryData,
      });
    }
  };

  const updateMiniPlayerStatus = (isVisible: boolean) => {
    if (content.isMiniPlayer !== isVisible)
      dispatch({ type: 'UPDATE_MINI_PLAYER_STATE', data: isVisible });
  };

  const toggleIsFavorite = (isFavorite: boolean) => {
    if (content.currentSongData.isAFavorite !== isFavorite)
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
      if (isMuted !== content.volume.isMuted)
        dispatch({ type: 'UPDATE_MUTED_STATE', data: isMuted });
      else dispatch({ type: 'UPDATE_MUTED_STATE' });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateCurrentlyActivePageData = (data: any) => {
    dispatch({ type: 'CURRENT_ACTIVE_PAGE_DATA_UPDATE', data });
  };

  const appContextValues = {
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
    updateCurrentlyActivePageData,
    updateNotificationPanelData,
    notificationPanelData: content.notificationPanelData,
    userData: content.userData,
    createQueue,
    queue: refQueue.current,
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
    updateSongPosition,
    volume: content.volume.value,
    updateVolume,
    isMuted: content.volume.isMuted,
    toggleMutedState,
    isRepeating: content.isRepeating,
    toggleRepeat,
    isShuffling: content.isShuffling,
    toggleShuffling,
    toggleIsFavorite,
    isPlaying: !player.paused,
    toggleSongPlayback,
  };

  return (
    <AppContext.Provider value={appContextValues}>
      {!content.isMiniPlayer && (
        <div className={`App ${content.isDarkMode ? 'dark-mode' : ''}`}>
          <ContextMenu />
          <PromptMenu />
          <Header />
          <BodyAndSideBarContainer />
          <SongPositionContext.Provider
            value={{ songPosition: player.currentTime }}
          >
            <SongControlsContainer />
          </SongPositionContext.Provider>
        </div>
      )}
      {content.isMiniPlayer && <MiniPlayer />}
    </AppContext.Provider>
  );
}
