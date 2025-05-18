import GenreImgAndInfoContainer from '@renderer/components/GenreInfoPage/GenreImgAndInfoContainer';
import MainContainer from '@renderer/components/MainContainer';
import Song from '@renderer/components/SongsPage/Song';
import { songFilterOptions, songSortOptions } from '@renderer/components/SongsPage/SongOptions';
import TitleContainer from '@renderer/components/TitleContainer';
import VirtualizedList from '@renderer/components/VirtualizedList';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import { store } from '@renderer/store/store';
import { songSearchSchema } from '@renderer/utils/zod/songSchema';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { zodValidator } from '@tanstack/zod-adapter';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/main-player/genres/$genreId')({
  validateSearch: zodValidator(songSearchSchema),
  component: GenreInfoPage
});

function GenreInfoPage() {
  const queue = useStore(store, (state) => state.localStorage.queue);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { createQueue, updateQueueData, addNewNotifications, playSong } =
    useContext(AppUpdateContext);

  const { t } = useTranslation();
  const navigate = useNavigate({ from: Route.fullPath });
  const { genreId } = Route.useParams();
  const {
    scrollTopOffset,
    sortingOrder = 'aToZ',
    filteringOrder = 'notSelected'
  } = Route.useSearch();

  const [genreData, setGenreData] = useState<Genre>();
  const [genreSongs, setGenreSongs] = useState<AudioInfo[]>([]);

  const fetchGenresData = useCallback(() => {
    window.api.genresData
      .getGenresData([genreId])
      .then((res) => {
        if (res && res.length > 0 && res[0]) setGenreData(res[0]);
        return undefined;
      })
      .catch((err) => console.error(err));
  }, [genreId]);

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
      className="appear-from-bottom genre-info-page-container h-full! pb-0!"
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
                  duration: 5000,
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
              navigate({
                search: (prev) => ({
                  ...prev,
                  filteringOrder: e.currentTarget.value as SongFilterTypes
                })
              });
            }
          },
          {
            name: 'songsPageSortDropdown',
            type: `${t('common.sortBy')} :`,
            value: sortingOrder,
            options: songSortOptions,
            onChange: (e) => {
              const order = e.currentTarget.value as SongSortTypes;
              navigate({ search: (prev) => ({ ...prev, sortingOrder: order }) });
            },
            isDisabled: !(genreData && genreSongs.length > 0)
          }
        ]}
      />

      <VirtualizedList
        data={listItems}
        fixedItemHeight={60}
        scrollTopOffset={scrollTopOffset}
        itemContent={(index, item) => {
          if ('songId' in item)
            return (
              <Song
                key={index}
                index={index}
                isIndexingSongs={preferences?.isSongIndexingEnabled}
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
}
