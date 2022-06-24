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
  isRepeating: RepeatTypes;
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
  | 'UPDATE_VOLUME_VALUE'
  | 'TOGGLE_REDUCED_MOTION'
  | 'TOGGLE_SONG_INDEXING'
  | 'TOGGLE_SONG_INDEXING';

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
    case 'TOGGLE_REDUCED_MOTION':
      return {
        ...state,
        userData:
          typeof action.data === 'boolean'
            ? {
                ...(state.userData as UserData),
                preferences: {
                  ...(state.userData as UserData).preferences,
                  isReducedMotion: action.data,
                },
              }
            : {
                ...(state.userData as UserData),
                preferences: {
                  ...(state.userData as UserData).preferences,
                  isReducedMotion: (state.userData as UserData).preferences
                    .isReducedMotion,
                },
              },
      };
    case 'TOGGLE_SONG_INDEXING':
      return {
        ...state,
        userData:
          typeof action.data === 'boolean'
            ? {
                ...(state.userData as UserData),
                preferences: {
                  ...(state.userData as UserData).preferences,
                  songIndexing: action.data,
                },
              }
            : {
                ...(state.userData as UserData),
                preferences: {
                  ...(state.userData as UserData).preferences,
                  songIndexing: (state.userData as UserData).preferences
                    .songIndexing,
                },
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
          typeof action.data === 'string'
            ? (action.data as RepeatTypes)
            : state.isRepeating,
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
      isLoading: false,
    },
    PromptMenuData: {
      isVisible: false,
      content: <span />,
      className: '',
    },
    volume: { isMuted: false, value: 50 },
    isRepeating: 'false',
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
  const songDurationRef = React.useRef(0);
  const isRepeatingRef = React.useRef('false' as RepeatTypes);
  const isShufflingRef = React.useRef(false);
  const currentSongDataRef = React.useRef({} as AudioData);

  const toggleSongPlayback = () => {
    if (player.paused) return player.play();
    if (player.ended) {
      player.currentTime = 0;
      return player.play();
    }
    return player.pause();
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
      await window.api.saveUserData('isRepeating', isRepeatingRef.current);
    });
    window.api.onWindowBlur(() => {
      if (document.querySelector('.App'))
        document.querySelector('.App')?.classList.add('blurred');
    });
    window.api.onWindowFocus(() => {
      if (document.querySelector('.App'))
        document.querySelector('.App')?.classList.remove('blurred');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    player.addEventListener('canplay', () => {
      if (refStartPlay.current) player.play();
    });
    player.addEventListener('ended', handleSkipForwardClick);
    player.addEventListener('play', addSongTitleToTitleBar);
    player.addEventListener('pause', () => {
      document.title = `Oto Music For Desktop`;
      window.api.saveUserData(
        'currentSong.stoppedPosition',
        player.currentTime
      );
    });
    setInterval(() => {
      if (!player.paused)
        startTransition(() =>
          dispatch({
            type: 'UPDATE_SONG_POSITION',
            data: Math.floor(songDurationRef.current),
          })
        );
    }, 1000);
    player.addEventListener('timeupdate', (e) => {
      songDurationRef.current = Math.floor(
        (e.target as HTMLAudioElement).currentTime
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
        toggleShuffling(res.isShuffling);
        toggleRepeat(res.isRepeating);
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
            .getAllSongs()
            .then((audioData) => {
              if (!audioData) return undefined;
              createQueue(
                audioData.data.map((song) => song.songId),
                'songs'
              );
              return undefined;
            })
            .catch((err) => console.error(err));
        }
      })
      .catch((err) => console.error(err));
    window.api.getMessageFromMain((_, message) => {
      updateNotificationPanelData(5000, <span>{message}</span>);
    });
    window.api.dataUpdateEvent((_, dataType, message = '') =>
      console.log('Data update event occurred.', dataType, message)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSongDataRef.current.title,
        artist: Array.isArray(currentSongDataRef.current.artists)
          ? currentSongDataRef.current.artists
              .map((artist) => artist.name)
              .join(', ')
          : `Unknown Artist`,
        album: currentSongDataRef.current.album
          ? currentSongDataRef.current.album.name || 'Unknown Album'
          : 'Unknown Album',
        artwork: [
          {
            src: `data:;base64,${currentSongDataRef.current.artwork}`,
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

  const managePlaybackUsingKeyboard = (e: KeyboardEvent) => {
    e.preventDefault();
    if (e.ctrlKey && e.key === 'ArrowUp')
      dispatch({
        type: 'UPDATE_VOLUME_VALUE',
        data: player.volume + 0.05 <= 1 ? player.volume * 100 + 5 : 1,
      });
    else if (e.ctrlKey && e.key === 'ArrowDown')
      dispatch({
        type: 'UPDATE_VOLUME_VALUE',
        data: player.volume - 0.05 >= 0 ? player.volume * 100 - 5 : 0,
      });
    else if (e.ctrlKey && e.key === 'm') toggleMutedState(!player.muted);
    else if (e.ctrlKey && e.key === 'ArrowRight') handleSkipForwardClick();
    else if (e.ctrlKey && e.key === 'ArrowLeft') handleSkipBackwardClick();
    else if (e.ctrlKey && e.key === 's') toggleShuffling();
    else if (e.ctrlKey && e.key === 't') toggleRepeat();
    else if (e.ctrlKey && e.key === 'h') toggleIsFavorite();
    else if (e.ctrlKey && e.key === 'l') {
      const currentlyActivePage =
        content.navigationHistory.history[
          content.navigationHistory.pageHistoryIndex
        ];
      if (currentlyActivePage.pageTitle === 'Lyrics')
        changeCurrentActivePage('Home');
      else changeCurrentActivePage('Lyrics');
    } else if (e.ctrlKey && e.key === 'n')
      updateMiniPlayerStatus(!content.isMiniPlayer);
    else if (e.ctrlKey && e.key === 'q') {
      const currentlyActivePage =
        content.navigationHistory.history[
          content.navigationHistory.pageHistoryIndex
        ];
      if (currentlyActivePage.pageTitle === 'CurrentQueue')
        changeCurrentActivePage('Home');
      else changeCurrentActivePage('CurrentQueue');
    } else if (e.code === 'Space') toggleSongPlayback();
    else if (e.key === 'ArrowLeft') {
      if (player.currentTime - 10 >= 0) player.currentTime -= 10;
      else player.currentTime = 0;
    } else if (e.key === 'ArrowRight') {
      if (player.currentTime + 10 < player.duration) player.currentTime += 10;
    }
  };

  React.useEffect(() => {
    window.addEventListener('click', handleContextMenuVisibilityUpdate);
    window.addEventListener('keydown', managePlaybackUsingKeyboard);
    return () => {
      window.removeEventListener('click', handleContextMenuVisibilityUpdate);
      window.removeEventListener('keydown', managePlaybackUsingKeyboard);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSongTitleToTitleBar = () => {
    if (currentSongDataRef.current.title && currentSongDataRef.current.artists)
      document.title = `${currentSongDataRef.current.title} - ${
        Array.isArray(currentSongDataRef.current.artists) &&
        currentSongDataRef.current.artists
          .map((artist) => artist.name)
          .join(', ')
        // : currentSongDataRef.current.artists.name
      }`;
  };

  const toggleRepeat = (newState?: RepeatTypes) => {
    const repeatState =
      newState ||
      // eslint-disable-next-line no-nested-ternary
      (isRepeatingRef.current === 'false'
        ? 'repeat'
        : isRepeatingRef.current === 'repeat'
        ? 'repeat-1'
        : 'false');
    isRepeatingRef.current = repeatState;
    dispatch({
      type: 'UPDATE_IS_REPEATING_STATE',
      data: repeatState,
    });
  };

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
    if (isRepeatingRef.current === 'repeat-1') {
      player.currentTime = 0;
      toggleSongPlayback();
      window.api.incrementNoOfSongListens(currentSongDataRef.current.songId);
    } else if (typeof currentSongIndex === 'number') {
      if (refQueue.current.queue.length - 1 === currentSongIndex) {
        if (isRepeatingRef.current === 'repeat') changeQueueCurrentSongIndex(0);
      } else changeQueueCurrentSongIndex(currentSongIndex + 1);
    } else changeQueueCurrentSongIndex(0);
  };

  const playSong = (songId: string, isStartPlay = true) => {
    if (typeof songId === 'string') {
      if (currentSongDataRef.current.songId === songId)
        return toggleSongPlayback();
      return window.api
        .getSong(songId)
        .then((songData) => {
          if (songData) {
            console.log('playSong', songId, songData.path);
            dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });
            currentSongDataRef.current = songData;
            if (player.src !== `otoMusic://localFiles/${songData.path}`)
              player.src = `otoMusic://localFiles/${songData.path}`;
            window.api.saveUserData('currentSong.songId', songData.songId);
            refStartPlay.current = isStartPlay;
            if (isStartPlay) toggleSongPlayback();
            if (refQueue.current.queue.length > 0) {
              if (refQueue.current.queue.indexOf(songData.songId) !== -1)
                refQueue.current.currentSongIndex =
                  refQueue.current.queue.indexOf(songData.songId);
              else {
                console.log(
                  `song ${songData.title} with id ${songData.songId} is not present in the queue`
                );
                refQueue.current.queue.push(songData.songId);
                if (refQueue.current.currentSongIndex !== null)
                  refQueue.current.currentSongIndex += 1;
                else refQueue.current.currentSongIndex = 0;
              }
            } else if (refQueue.current.queue.length === 0)
              refQueue.current.queue.push(songData.songId);
          } else console.log(songData);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    updateNotificationPanelData(
      5000,
      <span>Seems like we can&apos;t play that song.</span>,
      <span className="material-icons-round icon">error_outline</span>
    );
    return window.api.sendLogs(
      `======= ERROR OCCURRED WHEN TRYING TO PLAY A S0NG. =======\nERROR : Song id is of unknown type; SONGIDTYPE : ${typeof songId}`
    );
    // todo : Alert the user about the song problem.
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
      .catch((err: Error) => console.error(err));
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

  const toggleShuffling = (isShuffling?: boolean) => {
    dispatch({ type: 'TOGGLE_SHUFFLE_STATE', data: isShuffling });
    if (isShuffling !== undefined) isShufflingRef.current = isShuffling;
    else isShufflingRef.current = !isShufflingRef.current;
  };

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
    icon: ReactElement<any, any> = <></>,
    isLoading = false
  ) => {
    if (delay === 0) {
      dispatch({
        type: 'NOTIFICATION_PANEL_DATA_CHANGE',
        data: {
          ...content.notificationPanelData,
          isVisible: false,
          icon: <></>,
          isLoading,
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
              isLoading,
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

  const toggleIsFavorite = (isFavorite?: boolean) => {
    const newFavorite = isFavorite ?? !currentSongDataRef.current.isAFavorite;
    if (currentSongDataRef.current.isAFavorite !== newFavorite)
      window.api
        .toggleLikeSong(currentSongDataRef.current.songId, newFavorite)
        .then(() => {
          currentSongDataRef.current.isAFavorite = newFavorite;
          return dispatch({
            type: 'TOGGLE_IS_FAVORITE_STATE',
            data: newFavorite,
          });
        })
        .catch((err) => console.error(err));
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

  const toggleReducedMotion = (state?: boolean) => {
    window.api
      .saveUserData(
        'preferences.isReducedMotion',
        state !== undefined
          ? state
          : content.userData?.preferences.isReducedMotion || false
      )
      .then(() =>
        dispatch({
          type: 'TOGGLE_REDUCED_MOTION',
          data: state,
        })
      )
      .catch((err) => console.error(err));
  };

  const toggleSongIndexing = (state?: boolean) => {
    window.api
      .saveUserData(
        'preferences.songIndexing',
        state !== undefined
          ? state
          : content.userData?.preferences.songIndexing || false
      )
      .then(() =>
        dispatch({
          type: 'TOGGLE_SONG_INDEXING',
          data: state,
        })
      )
      .catch((err) => console.error(err));
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
    currentSongData: currentSongDataRef.current,
    currentlyActivePage:
      content.navigationHistory.history[
        content.navigationHistory.pageHistoryIndex
      ],
    changeCurrentActivePage,
    updateCurrentlyActivePageData,
    updateNotificationPanelData,
    notificationPanelData: content.notificationPanelData,
    userData: content.userData,
    toggleReducedMotion,
    toggleSongIndexing,
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
    isRepeating: isRepeatingRef.current,
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
        <div
          className={`App ${content.isDarkMode ? 'dark-mode' : ''} ${
            content.userData && content.userData.preferences.isReducedMotion
              ? 'reduced-motion'
              : ''
          }`}
        >
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
      <SongPositionContext.Provider
        value={{ songPosition: player.currentTime }}
      >
        {content.isMiniPlayer && <MiniPlayer />}
      </SongPositionContext.Provider>
    </AppContext.Provider>
  );
}
