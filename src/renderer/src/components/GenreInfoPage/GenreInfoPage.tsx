/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';

import MainContainer from '../MainContainer';
import Song from '../SongsPage/Song';
import TitleContainer from '../TitleContainer';
import GenreImgAndInfoContainer from './GenreImgAndInfoContainer';
import { songSortOptions, songFilterOptions } from '../SongsPage/SongOptions';
import VirtualizedList from '../VirtualizedList';

const GenreInfoPage = () => {
  const { currentlyActivePage, queue, localStorageData } = useContext(AppContext);
  const {
    createQueue,
    updateQueueData,
    addNewNotifications,
    updateCurrentlyActivePageData,
    playSong
  } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [genreData, setGenreData] = useState<Genre>();
  const [genreSongs, setGenreSongs] = useState<AudioInfo[]>([]);
  const [sortingOrder, setSortingOrder] = useState<SongSortTypes>('aToZ');
  const [filteringOrder, setFilteringOrder] = useState<SongFilterTypes>('notSelected');

  const fetchGenresData = useCallback(() => {
    if (currentlyActivePage.data) {
      window.api.genresData
        .getGenresData([currentlyActivePage.data.genreId])
        .then((res) => {
          if (res && res.length > 0 && res[0]) setGenreData(res[0]);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [currentlyActivePage.data]);

  const fetchSongsData = useCallback(() => {
    if (genreData && genreData.songs && genreData.songs.length > 0) {
      window.api.audioLibraryControls
        .getSongInfo(
          genreData.songs.map((song) => song.songId),
          sortingOrder,
          filteringOrder
        )
        .then((res) => {
          if (res) return setGenreSongs(res);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return undefined;
  }, [filteringOrder, genreData, sortingOrder]);

  useEffect(() => {
    fetchGenresData();
    const manageGenreUpdatesInGenresInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'genres') fetchGenresData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageGenreUpdatesInGenresInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageGenreUpdatesInGenresInfoPage);
    };
  }, [fetchGenresData]);

  useEffect(() => {
    fetchSongsData();
    const manageSongUpdatesInGenreInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
            fetchSongsData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageSongUpdatesInGenreInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageSongUpdatesInGenreInfoPage);
    };
  }, [fetchSongsData]);

  const selectAllHandler = useSelectAllHandler(genreSongs, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: string) => {
      const queueSongIds = genreSongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'genre', false, genreData?.genreId, false);
      playSong(currSongId, true);
    },
    [createQueue, genreData?.genreId, genreSongs, playSong]
  );

  const listItems = useMemo(
    () => [genreData, ...genreSongs].filter((x) => x !== undefined) as (Genre | AudioInfo)[],
    [genreData, genreSongs]
  );

  return (
    <MainContainer
      className="appear-from-bottom genre-info-page-container !h-full !pb-0"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <TitleContainer
        title={genreData?.name || ''}
        className="pr-4"
        buttons={[
          {
            label: t('common.playAll'),
            iconName: 'play_arrow',
            clickHandler: () =>
              createQueue(
                genreSongs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
                'genre',
                false,
                genreData?.genreId,
                true
              ),
            isDisabled: !(genreData && genreSongs.length > 0)
          },
          {
            iconName: 'shuffle',
            clickHandler: () =>
              createQueue(
                genreSongs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
                'genre',
                true,
                genreData?.genreId,
                true
              ),
            isDisabled: !(genreData && genreSongs.length > 0)
          },
          {
            iconName: 'add',
            clickHandler: () => {
              updateQueueData(
                undefined,
                [...queue.queue, ...genreSongs.map((song) => song.songId)],
                false,
                false
              );
              addNewNotifications([
                {
                  id: genreData?.genreId || '',
                  delay: 5000,
                  content: t('notifications.addedToQueue', {
                    count: genreSongs.length
                  })
                }
              ]);
            },
            isDisabled: !(genreData && genreSongs.length > 0)
          }
        ]}
        dropdowns={[
          {
            name: 'songsPageFilterDropdown',
            type: `${t('common.filterBy')} :`,
            value: filteringOrder,
            options: songFilterOptions,
            onChange: (e) => {
              updateCurrentlyActivePageData((currentPageData) => ({
                ...currentPageData,
                filteringOrder: e.currentTarget.value as SongFilterTypes
              }));
              setFilteringOrder(e.currentTarget.value as SongFilterTypes);
            }
          },
          {
            name: 'songsPageSortDropdown',
            type: `${t('common.sortBy')} :`,
            value: sortingOrder,
            options: songSortOptions,
            onChange: (e) => {
              const order = e.currentTarget.value as SongSortTypes;
              updateCurrentlyActivePageData((currentPageData) => ({
                ...currentPageData,
                sortingOrder: order
              }));
              setSortingOrder(order);
            },
            isDisabled: !(genreData && genreSongs.length > 0)
          }
        ]}
      />

      <VirtualizedList
        data={listItems}
        scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
        itemContent={(index, item) => {
          if ('songId' in item)
            return (
              <Song
                key={index}
                index={index}
                isIndexingSongs={localStorageData?.preferences.isSongIndexingEnabled}
                onPlayClick={handleSongPlayBtnClick}
                selectAllHandler={selectAllHandler}
                {...item}
                trackNo={undefined}
              />
            );
          return <GenreImgAndInfoContainer genreData={item} genreSongs={genreSongs} />;
        }}
      />
    </MainContainer>
  );
};

export default GenreInfoPage;
