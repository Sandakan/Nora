/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-array-index-key */
/* eslint-disable promise/always-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/catch-or-return */
import React, { useContext } from 'react';
import { FixedSizeList, FixedSizeList as List } from 'react-window';
import {
  Draggable,
  // ResponderProvided,
  DropResult,
  Droppable,
  DragDropContext,
} from 'react-beautiful-dnd';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';
import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';
import DefaultPlaylistCover from '../../../../assets/images/webp/playlist_cover_default.webp';
import FolderImg from '../../../../assets/images/webp/empty-folder.webp';
import NoSongsImage from '../../../../assets/images/svg/Sun_Monochromatic.svg';
import calculateTimeFromSeconds from '../../utils/calculateTimeFromSeconds';
import MainContainer from '../MainContainer';
import Img from '../Img';
import Song from '../SongsPage/Song';

interface QueueInfo {
  artworkPath: string;
  onlineArtworkPath?: string;
  title: string;
}

const CurrentQueuePage = () => {
  const {
    queue,
    currentSongData,
    currentlyActivePage,
    userData,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = useContext(AppContext);
  const {
    updateQueueData,
    addNewNotifications,
    updateCurrentlyActivePageData,
    updateContextMenuData,
    toggleMultipleSelections,
  } = React.useContext(AppUpdateContext);

  const [queuedSongs, setQueuedSongs] = React.useState([] as AudioInfo[]);
  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const [queueInfo, setQueueInfo] = React.useState({
    artworkPath: DefaultSongCover,
    title: '',
  } as QueueInfo);
  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { width, height } = useResizeObserver(containerRef);
  const ListRef = React.useRef(null as FixedSizeList | null);
  const isFirstRenderFinishedRef = React.useRef(false);

  const fetchAllSongsData = React.useCallback(() => {
    const isTheSameQueue = () => {
      const prevSongIds = queuedSongs.map((song) => song.songId);
      const newSongIds = queue.queue;

      return prevSongIds.every((id) => newSongIds.includes(id));
    };

    if (isTheSameQueue() && queuedSongs.length > 0) {
      setQueuedSongs((prevQueuedSongs) => {
        const newQueuedSongs = queue.queue.map((id) => {
          for (let i = 0; i < prevQueuedSongs.length; i += 1) {
            const prevQueuedSong = prevQueuedSongs[i];
            if (prevQueuedSong.songId === id) return prevQueuedSong;
          }
          return undefined;
        });
        const arr = newQueuedSongs.filter((x) => x) as AudioInfo[];
        return arr;
      });
    } else {
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
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.queue]);

  React.useEffect(() => {
    fetchAllSongsData();
    const manageSongUpdatesInCurrentQueue = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType.includes('songs') ||
            event.dataType === 'userData/queue' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
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
            artworkPath: currentSongData.artworkPath || DefaultSongCover,
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
                  artworkPath: res[0].artworkPaths.artworkPath,
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
                  artworkPath: res[0].artworkPaths.artworkPath,
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
                  artworkPath: res[0].artworkPaths
                    ? res[0].artworkPaths.artworkPath
                    : DefaultPlaylistCover,
                  title: res[0].name,
                };
              });
            }
          });
        }
        if (queue.queueType === 'genre') {
          window.api.getGenresData([queue.queueId]).then((res) => {
            if (res && res.length > 0 && res[0]) {
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: res[0].artworkPaths.artworkPath,
                  title: res[0].name,
                };
              });
            }
          });
        }
        if (queue.queueType === 'folder') {
          window.api.getFolderData([queue.queueId]).then((res) => {
            if (res && res.length > 0 && res[0]) {
              const folderName = res[0].folderData.path.split('\\').pop();
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: FolderImg,
                  title: `'${folderName || 'Unknown'}' Folder`,
                };
              });
            }
          });
        }
      }
    }
  }, [currentSongData.artworkPath, queue.queueId, queue.queueType]);

  const row = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      if (queuedSongs[index] === undefined) return <></>;

      const {
        songId,
        title,
        artists,
        duration,
        isAFavorite,
        artworkPaths,
        path,
        year,
        isBlacklisted,
      } = queuedSongs[index];
      return (
        <Draggable draggableId={songId} index={index} key={songId}>
          {(provided) => {
            const { multipleSelections: songIds } = multipleSelectionsData;
            const isMultipleSelectionsEnabled =
              multipleSelectionsData.selectionType === 'songs' &&
              multipleSelectionsData.multipleSelections.length !== 1;

            return (
              <div style={style}>
                <Song
                  provided={provided}
                  key={`${songId}-${index}`}
                  isDraggable
                  index={index}
                  ref={provided.innerRef}
                  isIndexingSongs={
                    userData !== undefined && userData.preferences.songIndexing
                  }
                  title={title}
                  songId={songId}
                  artists={artists}
                  artworkPaths={artworkPaths}
                  duration={duration}
                  path={path}
                  year={year}
                  isBlacklisted={isBlacklisted}
                  isAFavorite={isAFavorite}
                  additionalContextMenuItems={[
                    {
                      label: 'Remove from Queue',
                      iconName: 'remove_circle_outline',
                      handlerFunction: () => {
                        updateQueueData(
                          undefined,
                          queue.queue.filter((id) =>
                            isMultipleSelectionsEnabled
                              ? !songIds.includes(id)
                              : id !== songId
                          )
                        );
                        toggleMultipleSelections(false);
                      },
                    },
                  ]}
                />
              </div>
            );
          }}
        </Draggable>
      );
    },
    [
      multipleSelectionsData,
      queue.queue,
      queuedSongs,
      toggleMultipleSelections,
      updateQueueData,
      userData,
    ]
  );

  const calculateTotalTime = React.useCallback(() => {
    const { hours, minutes, seconds } = calculateTimeFromSeconds(
      queuedSongs.reduce((prev, current) => prev + current.duration, 0)
    );
    return `${
      hours >= 1 ? `${hours} hour${hours === 1 ? '' : 's'} ` : ''
    }${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${
      seconds === 1 ? '' : 's'
    }`;
  }, [queuedSongs]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return undefined;
    const updatedQueue = Array.from(queue.queue);
    const [item] = updatedQueue.splice(result.source.index, 1);
    updatedQueue.splice(result.destination.index, 0, item);

    updateQueueData(undefined, updatedQueue, undefined, undefined, true);

    return updateQueueData();
  };

  const centerCurrentlyPlayingSong = React.useCallback(() => {
    const index = queue.queue.indexOf(currentSongData.songId);
    if (ListRef && index >= 0) ListRef.current?.scrollToItem(index, 'center');
  }, [currentSongData.songId, queue.queue]);

  const moreOptionsContextMenuItems = React.useMemo(
    () => [
      {
        label: 'Scroll to currently playing song',
        iconName: 'vertical_align_center',
        handlerFunction: centerCurrentlyPlayingSong,
      },
    ],
    [centerCurrentlyPlayingSong]
  );

  return (
    <MainContainer className="main-container songs-list-container current-queue-container relative !h-full overflow-hidden !pb-0">
      <>
        <div className="title-container mt-2 mb-4 flex items-center justify-between pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          Currently Playing Queue
          <div className="other-controls-container float-right flex">
            <Button
              key={0}
              className="more-options-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName="more_horiz"
              isDisabled={queue.queue.length > 0 === false}
              clickHandler={(e) => {
                e.stopPropagation();
                const button = e.currentTarget || e.target;
                const { x, y } = button.getBoundingClientRect();
                updateContextMenuData(
                  true,
                  moreOptionsContextMenuItems,
                  x + 10,
                  y + 50
                );
              }}
              tooltipLabel="More Options"
              onContextMenu={(e) => {
                e.preventDefault();
                updateContextMenuData(
                  true,
                  moreOptionsContextMenuItems,
                  e.pageX,
                  e.pageY
                );
              }}
            />
            <Button
              key={1}
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={
                isMultipleSelectionEnabled ? 'remove_done' : 'checklist'
              }
              clickHandler={() =>
                toggleMultipleSelections(!isMultipleSelectionEnabled, 'songs')
              }
              isDisabled={queue.queue.length > 0 === false}
              tooltipLabel={
                isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
              }
            />
            <Button
              key={2}
              className="shuffle-all-button text-sm"
              iconName="shuffle"
              tooltipLabel="Shuffle Queue"
              isDisabled={queue.queue.length > 0 === false}
              clickHandler={() => {
                updateQueueData(undefined, queue.queue, true);
                addNewNotifications([
                  {
                    id: 'shuffleQueue',
                    delay: 5000,
                    content: <span>Queue shuffled successfully.</span>,
                    icon: (
                      <span className="material-icons-round icon">shuffle</span>
                    ),
                  },
                ]);
              }}
            />
            <Button
              key={3}
              label="Clear Queue"
              className="clear-queue-button text-sm"
              iconName="clear"
              isDisabled={queue.queue.length > 0 === false}
              clickHandler={() => {
                updateQueueData(undefined, []);
                addNewNotifications([
                  {
                    id: 'clearQueue',
                    delay: 5000,
                    content: <span>Queue cleared.</span>,
                    icon: (
                      <span className="material-icons-round icon">check</span>
                    ),
                  },
                ]);
              }}
            />
          </div>
        </div>
        {queue.queue.length > 0 && (
          <div className="queue-info-container mb-6 ml-8 flex items-center text-font-color-black dark:text-font-color-white">
            <div className="cover-img-container mr-8">
              <Img
                className={`h-20 w-20 rounded-md shadow-lg ${
                  queue.queueType === 'artist'
                    ? 'artist-img !rounded-full'
                    : `${queue.queueType}-img`
                }`}
                src={queueInfo.onlineArtworkPath}
                fallbackSrc={queueInfo.artworkPath}
                alt="Current Playing Queue Cover"
              />
            </div>
            <div className="queue-info">
              <div className="queue-title text-3xl">{queueInfo.title}</div>
              <div className="other-info flex text-sm font-light">
                <div className="queue-no-of-songs">{`${queuedSongs.length} songs`}</div>
                <span className="mx-1">&bull;</span>
                <div className="queue-total-duration">
                  {calculateTotalTime()}
                </div>
              </div>
              {/* <div className="queue-buttons mt-4 flex"></div> */}
            </div>
          </div>
        )}
        <div
          className={`songs-container overflow-auto ${
            queuedSongs.length > 0 ? 'h-full' : 'h-0'
          }`}
          ref={containerRef}
        >
          {queuedSongs.length > 0 && (
            // $ Enabling React.StrictMode throws an error in the CurrentQueuePage when using react-beautiful-dnd for drag and drop.

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable
                droppableId="droppable"
                mode="virtual"
                renderClone={(provided, _, rubric) => {
                  const data = queuedSongs[rubric.source.index];
                  return (
                    <Song
                      provided={provided}
                      key={data.songId}
                      isDraggable
                      index={rubric.source.index}
                      ref={provided.innerRef}
                      isIndexingSongs={
                        userData !== undefined &&
                        userData.preferences.songIndexing
                      }
                      title={data.title}
                      songId={data.songId}
                      artists={data.artists}
                      artworkPaths={data.artworkPaths}
                      duration={data.duration}
                      path={data.path}
                      isAFavorite={data.isAFavorite}
                      year={data.year}
                      isBlacklisted={data.isBlacklisted}
                    />
                  );
                }}
              >
                {(droppableProvided, snapshot) => (
                  <List
                    height={height}
                    itemCount={
                      snapshot.isUsingPlaceholder
                        ? queuedSongs.length
                        : queuedSongs.length + 1
                    }
                    itemSize={60}
                    width={width}
                    overscanCount={20}
                    outerRef={droppableProvided.innerRef}
                    ref={ListRef}
                    onItemsRendered={() => {
                      if (!isFirstRenderFinishedRef.current) {
                        setTimeout(() => {
                          const index = queue?.queue?.indexOf(
                            currentSongData.songId
                          );
                          if (index >= 0) {
                            if (ListRef.current) {
                              ListRef.current.scrollToItem(index, 'smart');
                            }
                          }
                        }, 500);
                      }
                      isFirstRenderFinishedRef.current = true;
                    }}
                    initialScrollOffset={
                      currentlyActivePage.data?.scrollTopOffset ?? 0
                    }
                    onScroll={(data) => {
                      if (scrollOffsetTimeoutIdRef.current)
                        clearTimeout(scrollOffsetTimeoutIdRef.current);
                      if (
                        !data.scrollUpdateWasRequested &&
                        data.scrollOffset !== 0
                      )
                        scrollOffsetTimeoutIdRef.current = setTimeout(
                          () =>
                            updateCurrentlyActivePageData(
                              (currentPageData) => ({
                                ...currentPageData,
                                scrollTopOffset: data.scrollOffset,
                              })
                            ),
                          500
                        );
                    }}
                  >
                    {row}
                  </List>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
        {queue.queue.length === 0 && (
          <div className="no-songs-container flex h-full w-full flex-col items-center justify-center text-center text-2xl text-[#ccc]">
            <Img src={NoSongsImage} className="mb-8 w-60" alt="" /> Queue is
            empty.
          </div>
        )}
      </>
    </MainContainer>
  );
};
CurrentQueuePage.displayName = 'CurrentQueuePage';
export default CurrentQueuePage;
