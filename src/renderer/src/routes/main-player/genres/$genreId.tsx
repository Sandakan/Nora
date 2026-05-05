import GenreImgAndInfoContainer from '@renderer/components/GenreInfoPage/GenreImgAndInfoContainer';
import MainContainer from '@renderer/components/MainContainer';
import Song from '@renderer/components/SongsPage/Song';
import { songFilterOptions, songSortOptions } from '@renderer/components/SongsPage/SongOptions';
import TitleContainer from '@renderer/components/TitleContainer';
import VirtualizedList from '@renderer/components/VirtualizedList';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import { queryClient } from '@renderer/index';
import { genreQuery } from '@renderer/queries/genres';
import { songQuery } from '@renderer/queries/songs';
import { store } from '@renderer/store/store';
import { songSearchSchema } from '@renderer/utils/zod/songSchema';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/main-player/genres/$genreId')({
  validateSearch: songSearchSchema,
  component: GenreInfoPage,
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(genreQuery.single({ genreId: Number(params.genreId) }));
  }
});

function GenreInfoPage() {
  const queue = useStore(store, (state) => state.localStorage.queue);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { createQueue, updateQueueData, addNewNotifications, playSong } =
    useContext(AppUpdateContext);

  const { t } = useTranslation();
  const navigate = useNavigate({ from: Route.fullPath });
  const { genreId } = Route.useParams({
    select: (params) => ({ genreId: Number(params.genreId) })
  });
  const {
    scrollTopOffset,
    sortingOrder = 'aToZ',
    filteringOrder = 'notSelected'
  } = Route.useSearch();

  const { data: genreData } = useSuspenseQuery({
    ...genreQuery.single({ genreId }),
    select: (data) => data.data[0]
  });
  const { data: genreSongs = [] } = useQuery(
    songQuery.allSongInfo({
      songIds: genreData?.songs.map((song) => song.songId) ?? [],
      sortType: sortingOrder,
      filterType: filteringOrder
    })
  );

  const selectAllHandler = useSelectAllHandler(genreSongs, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: number) => {
      const queueSongIds = genreSongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'genre', false, genreData?.genreId, false);
      playSong(currSongId, true);
    },
    [createQueue, genreData?.genreId, genreSongs, playSong]
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
                [...queue.songIds, ...genreSongs.map((song) => song.songId)],
                false,
                false
              );
              addNewNotifications([
                {
                  id: String(genreData?.genreId || ''),
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
        data={genreSongs}
        fixedItemHeight={60}
        scrollTopOffset={scrollTopOffset}
        components={{
          Header: () => <GenreImgAndInfoContainer genreData={genreData} genreSongs={genreSongs} />
        }}
        itemContent={(index, item) => {
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
        }}
      />
    </MainContainer>
  );
}
