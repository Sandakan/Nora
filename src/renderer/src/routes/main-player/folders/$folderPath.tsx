import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import { store } from '@renderer/store/store';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import storage from '@renderer/utils/localStorage';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import MainContainer from '@renderer/components/MainContainer';
import Button from '@renderer/components/Button';
import Dropdown from '@renderer/components/Dropdown';
import { songFilterOptions, songSortOptions } from '@renderer/components/SongsPage/SongOptions';
import VirtualizedList from '@renderer/components/VirtualizedList';
import Song from '@renderer/components/SongsPage/Song';
import { songSearchSchema } from '@renderer/utils/zod/songSchema';

export const Route = createFileRoute('/main-player/folders/$folderPath')({
  validateSearch: songSearchSchema,
  component: MusicFolderInfoPage
});
function MusicFolderInfoPage() {
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { createQueue, toggleMultipleSelections, updateContextMenuData, playSong } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate({ from: Route.fullPath });
  const { folderPath } = Route.useParams();
  const {
    scrollTopOffset,
    filteringOrder = 'notSelected',
    sortingOrder = 'aToZ'
  } = Route.useSearch();

  const [folderInfo, setFolderInfo] = useState<MusicFolder>();
  const [folderSongs, setFolderSongs] = useState<SongData[]>([]);

  const fetchFolderInfo = useCallback(() => {
    if (folderPath) {
      window.api.folderData
        .getFolderData([folderPath])
        .then((res) => {
          if (res) return setFolderInfo(res[0]);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return undefined;
  }, [folderPath]);

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
    (currSongId?: number, shuffleQueue = false, startPlaying = false) => {
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
      className="appear-from-bottom h-full! pb-0!"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-2 mb-8 flex items-center justify-between pr-4 text-3xl font-medium">
          <div className="container flex">
            '{folderName}' {t('common.folder_one')}
            <div className="other-stats-container text-font-color-black dark:text-font-color-white ml-12 flex items-center text-xs">
              {isMultipleSelectionEnabled ? (
                <div className="text-font-color-highlight dark:text-dark-font-color-highlight text-sm">
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
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      filteringOrder: e.currentTarget.value as SongFilterTypes
                    })
                  });
                }}
              />
              <Dropdown
                name="musicFolderSortDropdown"
                type={`${t('common.sortBy')} :`}
                value={sortingOrder ?? ''}
                options={songSortOptions}
                onChange={(e) => {
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      sortingOrder: e.currentTarget.value as SongSortTypes
                    })
                  });
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
              scrollTopOffset={scrollTopOffset}
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
}

