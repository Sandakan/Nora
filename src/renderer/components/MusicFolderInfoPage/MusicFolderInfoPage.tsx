import React from 'react';
import { useTranslation } from 'react-i18next';
import { FixedSizeList as List } from 'react-window';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';
import storage from 'renderer/utils/localStorage';

import Button from '../Button';
import Dropdown from '../Dropdown';
import MainContainer from '../MainContainer';
import Song from '../SongsPage/Song';
import { songSortOptions } from '../SongsPage/SongsPage';

const MusicFolderInfoPage = () => {
  const {
    currentlyActivePage,
    multipleSelectionsData,
    isMultipleSelectionEnabled,
    localStorageData,
  } = React.useContext(AppContext);
  const {
    updateCurrentlyActivePageData,
    createQueue,
    toggleMultipleSelections,
    updateContextMenuData,
    playSong,
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [folderInfo, setFolderInfo] = React.useState<MusicFolder>();
  const [folderSongs, setFolderSongs] = React.useState<SongData[]>([]);
  const [sortingOrder, setSortingOrder] = React.useState<SongSortTypes>(
    localStorageData?.sortingStates?.songsPage || 'aToZ',
  );

  const songsContainerRef = React.useRef(null as HTMLDivElement | null);
  const { width, height } = useResizeObserver(songsContainerRef);

  const fetchFolderInfo = React.useCallback(() => {
    if (currentlyActivePage?.data && currentlyActivePage?.data?.folderPath) {
      window.api.folderData
        .getFolderData([currentlyActivePage?.data?.folderPath])
        .then((res) => {
          if (res) return setFolderInfo(res[0]);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return undefined;
  }, [currentlyActivePage?.data]);

  const fetchFolderSongs = React.useCallback(() => {
    if (folderInfo && folderInfo.songIds.length > 0) {
      window.api.audioLibraryControls
        .getSongInfo(folderInfo.songIds, sortingOrder)
        .then((res) => {
          if (res && res.length > 0) return setFolderSongs(res);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [folderInfo, sortingOrder]);

  React.useEffect(() => {
    fetchFolderInfo();
    const manageFolderInfoUpdatesInMusicFolderInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'userData/musicFolder') fetchFolderInfo();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageFolderInfoUpdatesInMusicFolderInfoPage,
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageFolderInfoUpdatesInMusicFolderInfoPage,
      );
    };
  }, [fetchFolderInfo]);

  React.useEffect(() => {
    fetchFolderSongs();
    const manageSongUpdatesInMusicFolderInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs/artworks' ||
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong' ||
            event.dataType === 'songs/updatedSong' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
            fetchFolderSongs();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageSongUpdatesInMusicFolderInfoPage,
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongUpdatesInMusicFolderInfoPage,
      );
    };
  }, [fetchFolderSongs]);

  React.useEffect(() => {
    storage.sortingStates.setSortingStates('songsPage', sortingOrder);
  }, [sortingOrder]);

  const selectAllHandler = useSelectAllHandler(folderSongs, 'songs', 'songId');

  const handleSongPlayBtnClick = React.useCallback(
    (currSongId?: string, shuffleQueue = false, startPlaying = false) => {
      const queueSongIds = folderSongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(
        queueSongIds,
        'folder',
        shuffleQueue,
        folderInfo?.path,
        startPlaying,
      );

      if (currSongId) playSong(currSongId, true);
    },
    [createQueue, folderInfo?.path, folderSongs, playSong],
  );

  const row = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const {
        songId,
        title,
        artists,
        album,
        duration,
        isAFavorite,
        artworkPaths,
        year,
        path,
        isBlacklisted,
      } = folderSongs[index];
      return (
        <div style={style}>
          <Song
            key={index}
            index={index}
            isIndexingSongs={
              localStorageData?.preferences?.isSongIndexingEnabled
            }
            title={title}
            songId={songId}
            artists={artists}
            album={album}
            artworkPaths={artworkPaths}
            duration={duration}
            year={year}
            path={path}
            isAFavorite={isAFavorite}
            isBlacklisted={isBlacklisted}
            selectAllHandler={selectAllHandler}
            onPlayClick={handleSongPlayBtnClick}
          />
        </div>
      );
    },
    [
      folderSongs,
      handleSongPlayBtnClick,
      localStorageData?.preferences?.isSongIndexingEnabled,
      selectAllHandler,
    ],
  );

  const { folderName } = React.useMemo(() => {
    if (folderInfo) {
      const { path } = folderInfo;
      const name = path.split('\\').pop() || path;

      return { folderPath: path, folderName: name };
    }
    return { folderPath: undefined, folderName: undefined };
  }, [folderInfo]);

  const otherOptions = React.useMemo(
    () => [
      {
        label: t('settingsPage.resyncLibrary'),
        iconName: 'sync',
        handlerFunction: () =>
          window.api.audioLibraryControls.resyncSongsLibrary(),
      },
    ],
    [t],
  );

  return (
    <MainContainer
      className="appear-from-bottom !h-full !pb-0"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        <div className="title-container mb-8 mt-2 flex items-center justify-between pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          '{folderName}' Folder
          <div className="other-stats-container flex items-center text-xs text-font-color-black dark:text-font-color-white">
            {isMultipleSelectionEnabled ? (
              <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                {t('common.selectionWithCount', {
                  count: multipleSelectionsData.multipleSelections.length,
                })}
              </div>
            ) : (
              folderSongs &&
              folderSongs.length > 0 && (
                <span className="no-of-songs">
                  {t('common.folderWithCount', { count: folderSongs.length })}
                </span>
              )
            )}
          </div>
          {folderInfo && (
            <div className="buttons-container flex text-sm">
              <Button
                key={0}
                className="more-options-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="more_horiz"
                clickHandler={(e) => {
                  e.stopPropagation();
                  const button = e.currentTarget || e.target;
                  const { x, y } = button.getBoundingClientRect();
                  updateContextMenuData(true, otherOptions, x + 10, y + 50);
                }}
                tooltipLabel={t('common.moreOptions')}
                onContextMenu={(e) => {
                  e.preventDefault();
                  updateContextMenuData(true, otherOptions, e.pageX, e.pageY);
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
                tooltipLabel={t(
                  `common.${
                    isMultipleSelectionEnabled ? 'unselectAll' : 'select'
                  }`,
                )}
              />
              <Button
                key={2}
                tooltipLabel={t('common.playAll')}
                className="play-all-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="play_arrow"
                clickHandler={() =>
                  handleSongPlayBtnClick(undefined, false, true)
                }
              />
              <Button
                key={3}
                tooltipLabel={t('common.shuffleAndPlay')}
                className="shuffle-and-play-all-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="shuffle"
                clickHandler={() =>
                  handleSongPlayBtnClick(undefined, true, true)
                }
              />
              <Dropdown
                name="musicFolderSortDropdown"
                value={sortingOrder ?? ''}
                options={songSortOptions}
                onChange={(e) => {
                  updateCurrentlyActivePageData((currentPageData) => ({
                    ...currentPageData,
                    sortingOrder: e.currentTarget.value as SongSortTypes,
                  }));
                  setSortingOrder(e.currentTarget.value as SongSortTypes);
                }}
              />
            </div>
          )}
        </div>
        <div
          className="songs-container h-full flex-1 pb-2"
          ref={songsContainerRef}
        >
          {folderSongs && folderSongs.length > 0 && (
            <List
              className="appear-from-bottom delay-100 [scrollbar-gutter:stable]"
              itemCount={folderSongs.length}
              itemSize={60}
              width={width || '100%'}
              height={height || 450}
              overscanCount={10}
              initialScrollOffset={
                currentlyActivePage.data?.scrollTopOffset ?? 0
              }
            >
              {row}
            </List>
          )}
        </div>
      </>
    </MainContainer>
  );
};

export default MusicFolderInfoPage;
