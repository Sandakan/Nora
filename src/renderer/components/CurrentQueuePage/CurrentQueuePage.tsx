/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable promise/always-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/catch-or-return */
import React, { useContext } from 'react';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { FixedSizeList, FixedSizeList as List } from 'react-window';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import { Song } from '../SongsPage/Song';
import Button from '../Button';
import DefaultSongCover from '../../../../assets/images/png/song_cover_default.png';
import DefaultArtistCover from '../../../../assets/images/png/default_artist_cover.png';
import DefaultAlbumCover from '../../../../assets/images/png/album-cover-default.png';
import DefaultPlaylistCover from '../../../../assets/images/png/playlist_cover_default.png';
import NoSongsImage from '../../../../assets/images/svg/Sun_Monochromatic.svg';
import { calculateTime } from '../../utils/calculateTime';
import MainContainer from '../MainContainer';

interface QueueInfo {
  artworkPath: string;
  onlineArtworkPath?: string;
  title: string;
}

export default () => {
  const { queue, currentSongData, userData } = useContext(AppContext);
  const { updateQueueData, addNewNotifications } =
    React.useContext(AppUpdateContext);

  const [queuedSongs, setQueuedSongs] = React.useState([] as AudioInfo[]);
  const [queueInfo, setQueueInfo] = React.useState({
    artworkPath: DefaultSongCover,
    title: '',
  } as QueueInfo);
  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { width, height } = useResizeObserver(containerRef);
  const ListRef = React.useRef(null as FixedSizeList | null);

  const fetchAllSongsData = React.useCallback(
    () =>
      window.api.getAllSongs().then((res) => {
        if (res) {
          const x = queue.queue
            .map((songId) => {
              return res.data.map((y) => {
                if (songId === y.songId) return y;
                return undefined;
              });
            })
            .flat()
            .filter((y) => y !== undefined) as AudioInfo[];
          setQueuedSongs(x);
        }
      }),
    [queue.queue]
  );

  React.useEffect(() => {
    fetchAllSongsData();
    const manageSongUpdatesInCurrentQueue = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DataEvent).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'songs' || event.dataType === 'userData/queue')
            fetchAllSongsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageSongUpdatesInCurrentQueue
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongUpdatesInCurrentQueue
      );
    };
  }, [fetchAllSongsData]);

  React.useEffect(() => {
    if (queue.queueType) {
      if (queue.queueType === 'songs') {
        setQueueInfo((prevData) => {
          return {
            ...prevData,
            artworkPath: DefaultSongCover,
            title: 'All Songs',
          };
        });
      }
      if (queue.queueId) {
        if (queue.queueType === 'artist') {
          window.api.getArtistData([queue.queueId]).then((res) => {
            if (res && Array.isArray(res) && res[0]) {
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: res[0].artworkPath
                    ? `otomusic://localFiles/${res[0].artworkPath}`
                    : DefaultArtistCover,
                  onlineArtworkPath: res[0].onlineArtworkPaths
                    ? res[0].onlineArtworkPaths.picture_medium
                    : undefined,
                  title: res[0].name,
                };
              });
            }
          });
        }
        if (queue.queueType === 'album') {
          window.api.getAlbumData([queue.queueId]).then((res) => {
            if (res && res.length > 0 && res[0]) {
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: res[0].artworkPath
                    ? `otomusic://localFiles/${res[0].artworkPath}`
                    : DefaultAlbumCover,
                  title: res[0].title,
                };
              });
            }
          });
        }
        if (queue.queueType === 'playlist') {
          window.api.getPlaylistData([queue.queueId]).then((res) => {
            if (res && res.length > 0 && res[0]) {
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: res[0].artworkPath
                    ? `otomusic://localFiles/${res[0].artworkPath}`
                    : DefaultPlaylistCover,
                  title: res[0].name,
                };
              });
            }
          });
        }
      }
    }
  }, [queue.queueId, queue.queueType]);

  React.useLayoutEffect(() => {
    setTimeout(() => {
      const index = queue?.queue?.indexOf(currentSongData.songId);
      if (index >= 0) {
        if (ListRef.current) {
          ListRef.current.scrollToItem(index, 'smart');
        }
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const row = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const {
        songId,
        title,
        artists,
        duration,
        isAFavorite,
        artworkPath,
        path,
      } = queuedSongs[index];
      return (
        <div style={style}>
          <Song
            key={songId}
            // style={style}
            isDraggable
            index={index}
            isIndexingSongs={
              userData !== undefined && userData.preferences.songIndexing
            }
            title={title}
            songId={songId}
            artists={artists}
            artworkPath={artworkPath}
            duration={duration}
            path={path}
            isAFavorite={isAFavorite}
            additionalContextMenuItems={[
              {
                label: 'Remove from Queue',
                iconName: 'remove_circle_outline',
                handlerFunction: () =>
                  updateQueueData(
                    undefined,
                    queue.queue.filter((id) => id !== songId)
                  ),
              },
            ]}
          />
        </div>
      );
    },
    [queue.queue, queuedSongs, updateQueueData, userData]
  );

  const calculateTotalTime = React.useCallback(() => {
    const val = calculateTime(
      queuedSongs.reduce((prev, current) => prev + current.duration, 0)
    );
    const duration = val.split(':');
    return `${
      Number(duration[0]) / 60 >= 1
        ? `${Math.floor(Number(duration[0]) / 60)} hour${
            Math.floor(Number(duration[0]) / 60) === 1 ? '' : 's'
          } `
        : ''
    }${Math.floor(Number(duration[0]) % 60)} minute${
      Math.floor(Number(duration[0]) % 60) === 1 ? '' : 's'
    } ${duration[1]} second${Number(duration[1]) === 1 ? '' : 's'}`;
  }, [queuedSongs]);

  return (
    <MainContainer className="main-container songs-list-container current-queue-container !h-full !mb-0 relative">
      <>
        <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
          Currently Playing Queue
        </div>
        {queue.queue.length > 0 && (
          <div className="queue-info-container flex items-center text-font-color-black dark:text-font-color-white mb-8 ml-8">
            <div className="cover-img-container mr-8">
              <img
                className={`w-40 h-40 rounded-xl ${
                  queue.queueType === 'artist'
                    ? 'artist-img !rounded-full'
                    : `${queue.queueType}-img`
                }`}
                src={
                  queue.queueType === 'artist' &&
                  navigator.onLine &&
                  queueInfo.onlineArtworkPath
                    ? queueInfo.onlineArtworkPath
                    : queueInfo.artworkPath
                }
                alt="Current Playing Queue Cover"
              />
            </div>
            <div className="queue-info">
              <div className="queue-title text-5xl">{queueInfo.title}</div>
              <div className="queue-no-of-songs">{`${queuedSongs.length} songs`}</div>
              <div className="queue-total-duration">{calculateTotalTime()}</div>
              <div className="queue-buttons flex mt-4">
                <Button
                  label="Shuffle All"
                  className="shuffle-all-button"
                  iconName="shuffle"
                  clickHandler={() => {
                    updateQueueData(undefined, queue.queue, true);
                    addNewNotifications([
                      {
                        id: 'shuffleQueue',
                        delay: 5000,
                        content: <span>Queue shuffled successfully.</span>,
                        icon: (
                          <span className="material-icons-round icon">
                            shuffle
                          </span>
                        ),
                      },
                    ]);
                  }}
                />
                <Button
                  label="Clear Queue"
                  className="clear-queue-button"
                  iconName="clear"
                  clickHandler={() => {
                    updateQueueData(undefined, []);
                    addNewNotifications([
                      {
                        id: 'clearQueue',
                        delay: 5000,
                        content: <span>Queue cleared.</span>,
                        icon: (
                          <span className="material-icons-round icon">
                            check
                          </span>
                        ),
                      },
                    ]);
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <div
          className={`songs-container ${
            queuedSongs.length > 0 ? 'h-full' : 'h-0'
          }`}
          ref={containerRef}
        >
          {queuedSongs.length > 0 && (
            <List
              height={height}
              itemCount={queuedSongs.length}
              itemSize={60}
              width={width}
              overscanCount={15}
              ref={ListRef}
            >
              {row}
            </List>
          )}
        </div>
        {queue.queue.length === 0 && (
          <div className="no-songs-container h-full w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl">
            <img src={NoSongsImage} className="w-60 mb-8" alt="" /> Queue is
            empty.
          </div>
        )}
      </>
    </MainContainer>
  );
};
