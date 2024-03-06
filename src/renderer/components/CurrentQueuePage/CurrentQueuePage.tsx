/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FixedSizeList, FixedSizeList as List } from 'react-window';
import {
  Draggable,
  DropResult,
  Droppable,
  DragDropContext,
} from 'react-beautiful-dnd';
import useResizeObserver from '../../hooks/useResizeObserver';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import calculateTimeFromSeconds from '../../utils/calculateTimeFromSeconds';

import Button from '../Button';
import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';
import DefaultPlaylistCover from '../../../../assets/images/webp/playlist_cover_default.webp';
import FolderImg from '../../../../assets/images/webp/empty-folder.webp';
import NoSongsImage from '../../../../assets/images/svg/Sun_Monochromatic.svg';
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
    isMultipleSelectionEnabled,
    multipleSelectionsData,
    localStorageData,
  } = useContext(AppContext);
  const {
    updateQueueData,
    addNewNotifications,
    updateCurrentlyActivePageData,
    updateContextMenuData,
    toggleMultipleSelections,
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [queuedSongs, setQueuedSongs] = React.useState([] as AudioInfo[]);
  const previousQueueRef = React.useRef<string[]>([]);
  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const [queueInfo, setQueueInfo] = React.useState({
    artworkPath: DefaultSongCover,
    title: '',
  } as QueueInfo);
  const [isAutoScrolling, setIsAutoScrolling] = React.useState(false);

  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { width, height } = useResizeObserver(containerRef);
  const ListRef = React.useRef(null as FixedSizeList | null);
  const isFirstRenderFinishedRef = React.useRef(false);

  const isTheSameQueue = React.useCallback((newQueueSongIds: string[]) => {
    const prevQueueSongIds = previousQueueRef.current;
    const isSameQueue = prevQueueSongIds.every((id) =>
      newQueueSongIds.includes(id),
    );

    return isSameQueue;
  }, []);

  const fetchAllSongsData = React.useCallback(
    (skipSameQueueCheck = false) => {
      if (skipSameQueueCheck || !isTheSameQueue(queue.queue)) {
        window.api.audioLibraryControls
          .getSongInfo(queue.queue, 'addedOrder', undefined, true)
          .then((res) => {
            if (res) {
              setQueuedSongs(res);
              previousQueueRef.current = queue.queue.slice();
            }
          });
      }
    },
    [isTheSameQueue, queue.queue],
  );

  React.useEffect(() => {
    fetchAllSongsData(true);
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
      manageSongUpdatesInCurrentQueue,
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongUpdatesInCurrentQueue,
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
          window.api.artistsData.getArtistData([queue.queueId]).then((res) => {
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
          window.api.albumsData.getAlbumData([queue.queueId]).then((res) => {
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
          window.api.playlistsData
            .getPlaylistData([queue.queueId])
            .then((res) => {
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
          window.api.genresData.getGenresData([queue.queueId]).then((res) => {
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
          window.api.folderData.getFolderData([queue.queueId]).then((res) => {
            if (res && res.length > 0 && res[0]) {
              const folderName = res[0].path.split('\\').pop();
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: FolderImg,
                  title: t(
                    folderName
                      ? 'currentQueuePage.folderWithName'
                      : 'common.unknownFolder',
                    {
                      name: folderName,
                    },
                  ),
                };
              });
            }
          });
        }
      }
    }
  }, [currentSongData.artworkPath, queue.queueId, queue.queueType, t]);

  const selectAllHandler = useSelectAllHandler(queuedSongs, 'songs', 'songId');

  const row = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      // eslint-disable-next-line react/jsx-no-useless-fragment
      if (queuedSongs[index] === undefined) return <></>;

      const {
        songId,
        title,
        artists,
        album,
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
                    localStorageData?.preferences?.isSongIndexingEnabled
                  }
                  title={title}
                  songId={songId}
                  artists={artists}
                  album={album}
                  artworkPaths={artworkPaths}
                  duration={duration}
                  path={path}
                  year={year}
                  isBlacklisted={isBlacklisted}
                  isAFavorite={isAFavorite}
                  selectAllHandler={selectAllHandler}
                  // no need for onPlayClick because the component is in the currentQueuePage
                  // onPlayClick={handleSongPlayBtnClick}
                  additionalContextMenuItems={[
                    {
                      label: t('common.removeFromQueue'),
                      iconName: 'remove_circle_outline',
                      handlerFunction: () => {
                        updateQueueData(
                          undefined,
                          queue.queue.filter((id) =>
                            isMultipleSelectionsEnabled
                              ? !songIds.includes(id)
                              : id !== songId,
                          ),
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
      localStorageData?.preferences?.isSongIndexingEnabled,
      multipleSelectionsData,
      queue.queue,
      queuedSongs,
      selectAllHandler,
      t,
      toggleMultipleSelections,
      updateQueueData,
    ],
  );

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

  React.useEffect(() => {
    let timeOutId: NodeJS.Timeout;
    if (isAutoScrolling) {
      timeOutId = setTimeout(() => centerCurrentlyPlayingSong(), 1000);
    }

    return () => {
      if (timeOutId) clearTimeout(timeOutId);
    };
  }, [centerCurrentlyPlayingSong, isAutoScrolling]);

  const moreOptionsContextMenuItems = React.useMemo(
    () => [
      {
        label: t('currentQueuePage.scrollToCurrentPlayingSong'),
        iconName: 'vertical_align_center',
        handlerFunction: centerCurrentlyPlayingSong,
      },
    ],
    [centerCurrentlyPlayingSong, t],
  );

  const queueDuration = React.useMemo(
    () =>
      calculateTimeFromSeconds(
        queuedSongs.reduce((prev, current) => prev + current.duration, 0),
      ).timeString,
    [queuedSongs],
  );

  const completedQueueDuration = React.useMemo(
    () =>
      calculateTimeFromSeconds(
        queuedSongs
          .slice(queue.currentSongIndex ?? 0)
          .reduce((prev, current) => prev + current.duration, 0),
      ).timeString,
    [queue.currentSongIndex, queuedSongs],
  );

  return (
    <MainContainer
      className="current-queue-container appear-from-bottom relative !h-full overflow-hidden !pb-0"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        <div className="title-container mb-4 mt-2 flex items-center justify-between pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          {t('currentQueuePage.queue')}
          <div className="other-controls-container float-right flex">
            <Button
              key={0}
              className="more-options-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName="more_horiz"
              isDisabled={queue.queue.length > 0 === false}
              clickHandler={(e) => {
                e.stopPropagation();
                const button = e.currentTarget;
                const { x, y } = button.getBoundingClientRect();
                updateContextMenuData(
                  true,
                  moreOptionsContextMenuItems,
                  x + 10,
                  y + 50,
                );
              }}
              tooltipLabel="More Options"
              onContextMenu={(e) => {
                e.preventDefault();
                updateContextMenuData(
                  true,
                  moreOptionsContextMenuItems,
                  e.pageX,
                  e.pageY,
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
              tooltipLabel={t(
                `common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`,
              )}
            />
            <Button
              key={1}
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={isAutoScrolling ? 'flash_off' : 'flash_on'}
              clickHandler={() => setIsAutoScrolling((state) => !state)}
              isDisabled={queue.queue.length > 0 === false}
              tooltipLabel={t(
                `currentQueuePage.${isAutoScrolling ? 'disableAutoScrolling' : 'enableAutoScrolling'}`,
              )}
            />
            <Button
              key={2}
              className="shuffle-all-button text-sm"
              iconName="shuffle"
              tooltipLabel={t('currentQueuePage.shuffleQueue')}
              isDisabled={queue.queue.length > 0 === false}
              clickHandler={() => {
                updateQueueData(undefined, queue.queue, true);
                fetchAllSongsData(true);
                addNewNotifications([
                  {
                    id: 'shuffleQueue',
                    delay: 5000,
                    content: t('currentQueuePage.queueShuffleSuccess'),
                    iconName: 'shuffle',
                  },
                ]);
              }}
            />
            <Button
              key={3}
              label={t('currentQueuePage.clearQueue')}
              className="clear-queue-button text-sm"
              iconName="clear"
              isDisabled={queue.queue.length > 0 === false}
              clickHandler={() => {
                updateQueueData(undefined, []);
                addNewNotifications([
                  {
                    id: 'clearQueue',
                    delay: 5000,
                    content: t('currentQueuePage.queueCleared'),
                    iconName: 'check',
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
                loading="eager"
                alt="Current Playing Queue Cover"
              />
            </div>
            <div className="queue-info">
              <div className="queue-type text-sm font-semibold uppercase opacity-50 dark:font-medium">
                {queue.queueType}
              </div>
              <div className="queue-title text-3xl">{queueInfo.title}</div>
              <div className="other-info flex text-sm font-light">
                <div className="queue-no-of-songs">
                  {t('common.songWithCount', { count: queuedSongs.length })}
                </div>
                <span className="mx-1">&bull;</span>
                <div className="queue-duration">
                  <span>{queueDuration}</span>{' '}
                  <span>
                    (
                    {t('currentQueuePage.durationRemaining', {
                      duration: completedQueueDuration,
                    })}
                    )
                  </span>
                </div>
              </div>
              {/* <div className="queue-buttons mt-4 flex"></div> */}
            </div>
          </div>
        )}
        <div
          className={`songs-container overflow-auto ${queuedSongs.length > 0 ? 'h-full' : 'h-0'}`}
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
                        localStorageData?.preferences?.isSongIndexingEnabled
                      }
                      title={data.title}
                      songId={data.songId}
                      artists={data.artists}
                      album={data.album}
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
                    className="appear-from-bottom delay-100 [scrollbar-gutter:stable]"
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
                            currentSongData.songId,
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
                              }),
                            ),
                          500,
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
            <Img src={NoSongsImage} className="mb-8 w-60" alt="" />{' '}
            {t('currentQueuePage.empty')}
          </div>
        )}
      </>
    </MainContainer>
  );
};
CurrentQueuePage.displayName = 'CurrentQueuePage';
export default CurrentQueuePage;
