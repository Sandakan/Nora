import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import storage from '../../utils/localStorage';

import Button from '../Button';
import Dropdown from '../Dropdown';
import MainContainer from '../MainContainer';
import Song from '../SongsPage/Song';
import { songSortOptions, songFilterOptions } from '../SongsPage/SongOptions';
import VirtualizedList from '../VirtualizedList';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const MusicFolderInfoPage = () => {
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);
  const sortingStates = useStore(store, (state) => state.localStorage.sortingStates);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const {
    updateCurrentlyActivePageData,
    createQueue,
    toggleMultipleSelections,
    updateContextMenuData,
    playSong
  } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [folderInfo, setFolderInfo] = useState<MusicFolder>();
  const [folderSongs, setFolderSongs] = useState<SongData[]>([]);
  const [filteringOrder, setFilteringOrder] = useState<SongFilterTypes>('notSelected');
  const [sortingOrder, setSortingOrder] = useState<SongSortTypes>(
    sortingStates?.songsPage || 'aToZ'
  );

  const fetchFolderInfo = useCallback(() => {
    if (currentlyActivePage?.data && currentlyActivePage?.data?.folderPath) {
      window.api.folderData
        .getFolderData([currentlyActivePage?.data?.folderPath as string])
        .then((res) => {
          if (res) return setFolderInfo(res[0]);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return undefined;
  }, [currentlyActivePage?.data]);

  const fetchFolderSongs = useCallback(() => {
    if (folderInfo && folderInfo.songIds.length > 0) {
      window.api.audioLibraryControls
        .getSongInfo(folderInfo.songIds, sortingOrder, filteringOrder)
        .then((res) => {
          if (res && res.length > 0) return setFolderSongs(res);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [filteringOrder, folderInfo, sortingOrder]);

  useEffect(() => {
    fetchFolderInfo();
    const manageFolderInfoUpdatesInMusicFolderInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'userData/musicFolder') fetchFolderInfo();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageFolderInfoUpdatesInMusicFolderInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageFolderInfoUpdatesInMusicFolderInfoPage);
    };
  }, [fetchFolderInfo]);

  useEffect(() => {
    fetchFolderSongs();
    const manageSongUpdatesInMusicFolderInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
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
    document.addEventListener('app/dataUpdates', manageSongUpdatesInMusicFolderInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageSongUpdatesInMusicFolderInfoPage);
    };
  }, [fetchFolderSongs]);

  useEffect(() => {
    storage.sortingStates.setSortingStates('songsPage', sortingOrder);
  }, [sortingOrder]);

  const selectAllHandler = useSelectAllHandler(folderSongs, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId?: string, shuffleQueue = false, startPlaying = false) => {
      const queueSongIds = folderSongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'folder', shuffleQueue, folderInfo?.path, startPlaying);

      if (currSongId) playSong(currSongId, true);
    },
    [createQueue, folderInfo?.path, folderSongs, playSong]
  );

  const { folderName } = useMemo(() => {
    if (folderInfo) {
      const { path } = folderInfo;
      const name = path.split('\\').pop() || path;

      return { folderPath: path, folderName: name };
    }
    return { folderPath: undefined, folderName: undefined };
  }, [folderInfo]);

  const otherOptions = useMemo(
    () => [
      {
        label: t('settingsPage.resyncLibrary'),
        iconName: 'sync',
        handlerFunction: () => window.api.audioLibraryControls.resyncSongsLibrary()
      }
    ],
    [t]
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
          <div className="container flex">
            '{folderName}' {t('common.folder_one')}
            <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
              {isMultipleSelectionEnabled ? (
                <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                  {t('common.selectionWithCount', {
                    count: multipleSelectionsData.multipleSelections.length
                  })}
                </div>
              ) : (
                folderSongs &&
                folderSongs.length > 0 && (
                  <span className="no-of-songs">
                    {t('common.songWithCount', { count: folderSongs.length })}
                  </span>
                )
              )}
            </div>
          </div>
          {folderInfo && (
            <div className="buttons-container flex text-sm">
              <Button
                key={0}
                className="more-options-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="more_horiz"
                clickHandler={(e) => {
                  e.stopPropagation();
                  const button = e.currentTarget;
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
                iconName={isMultipleSelectionEnabled ? 'remove_done' : 'checklist'}
                clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'songs')}
                tooltipLabel={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
              />
              <Button
                key={2}
                tooltipLabel={t('common.playAll')}
                className="play-all-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="play_arrow"
                clickHandler={() => handleSongPlayBtnClick(undefined, false, true)}
              />
              <Button
                key={3}
                tooltipLabel={t('common.shuffleAndPlay')}
                className="shuffle-and-play-all-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="shuffle"
                clickHandler={() => handleSongPlayBtnClick(undefined, true, true)}
              />
              <Dropdown
                name="songsPageFilterDropdown"
                type={`${t('common.filterBy')} :`}
                value={filteringOrder}
                options={songFilterOptions}
                onChange={(e) => {
                  updateCurrentlyActivePageData((currentPageData) => ({
                    ...currentPageData,
                    filteringOrder: e.currentTarget.value as SongFilterTypes
                  }));
                  setFilteringOrder(e.currentTarget.value as SongFilterTypes);
                }}
              />
              <Dropdown
                name="musicFolderSortDropdown"
                type={`${t('common.sortBy')} :`}
                value={sortingOrder ?? ''}
                options={songSortOptions}
                onChange={(e) => {
                  updateCurrentlyActivePageData((currentPageData) => ({
                    ...currentPageData,
                    sortingOrder: e.currentTarget.value as SongSortTypes
                  }));
                  setSortingOrder(e.currentTarget.value as SongSortTypes);
                }}
              />
            </div>
          )}
        </div>
        <div className="songs-container h-full flex-1 pb-2">
          {folderSongs && folderSongs.length > 0 && (
            <VirtualizedList
              data={folderSongs}
              fixedItemHeight={60}
              scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
              itemContent={(index, song) => {
                if (song)
                  return (
                    <Song
                      key={index}
                      index={index}
                      isIndexingSongs={preferences.isSongIndexingEnabled}
                      onPlayClick={handleSongPlayBtnClick}
                      selectAllHandler={selectAllHandler}
                      {...song}
                    />
                  );
                return <div>Bad Index</div>;
              }}
            />
          )}
        </div>
      </>
    </MainContainer>
  );
};

export default MusicFolderInfoPage;
