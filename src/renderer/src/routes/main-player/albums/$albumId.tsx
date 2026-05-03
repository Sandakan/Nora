import AlbumImgAndInfoContainer from '@renderer/components/AlbumInfoPage/AlbumImgAndInfoContainer';
import OnlineAlbumInfoContainer from '@renderer/components/AlbumInfoPage/OnlineAlbumInfoContainer';
import MainContainer from '@renderer/components/MainContainer';
import Song from '@renderer/components/SongsPage/Song';
import { songSortOptions } from '@renderer/components/SongsPage/SongOptions';
import TitleContainer from '@renderer/components/TitleContainer';
import VirtualizedList from '@renderer/components/VirtualizedList';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import { queryClient } from '@renderer/index';
import { albumQuery } from '@renderer/queries/albums';
import { songQuery } from '@renderer/queries/songs';
import { store } from '@renderer/store/store';
import { songSearchSchema } from '@renderer/utils/zod/songSchema';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/main-player/albums/$albumId')({
  validateSearch: songSearchSchema,
  component: AlbumInfoPage,
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(albumQuery.single({ albumId: Number(params.albumId) }));
  }
});

function AlbumInfoPage() {
  const { albumId } = Route.useParams({
    select: (params) => ({ albumId: Number(params.albumId) })
  });
  const { scrollTopOffset, sortingOrder = 'trackNoDescending' } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const preferences = useStore(store, (state) => state?.localStorage?.preferences);
  const queue = useStore(store, (state) => state.localStorage.queue);

  const { createQueue, updateQueueData, addNewNotifications, playSong } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { data: albumData } = useSuspenseQuery({
    ...albumQuery.single({ albumId: albumId }),
    select: (data) => data.data[0]
  });

  const { data: onlineAlbumInfo } = useQuery(albumQuery.fetchOnlineInfo({ albumId }));

  const { data: albumSongs = [] } = useQuery({
    ...songQuery.allSongInfo({
      songIds: albumData.songs.map((song) => song.songId) || [],
      sortType: sortingOrder,
      filterType: 'notSelected'
    }),
    enabled: !!albumData?.songs && albumData.songs.length > 0
  });

  const selectAllHandler = useSelectAllHandler(albumSongs, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: number) => {
      const queueSongIds = albumSongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'album', false, albumData.albumId, false);
      playSong(currSongId, true);
    },
    [albumData.albumId, createQueue, playSong, albumSongs]
  );

  return (
    <MainContainer
      className="album-info-page-container appear-from-bottom h-full pb-0! pl-8"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <TitleContainer
        title={albumData.title}
        className="pr-4"
        buttons={[
          {
            tooltipLabel: t('common.shuffleAndPlay'),
            iconName: 'shuffle',
            clickHandler: () =>
              createQueue(
                albumSongs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
                'songs',
                true,
                albumData.albumId,
                true
              ),
            isDisabled: !(albumSongs.length > 0)
          },
          {
            tooltipLabel: t('common.addToQueue'),
            iconName: 'add',
            clickHandler: () => {
              updateQueueData(
                undefined,
                [...queue.songIds, ...albumSongs.map((song) => song.songId)],
                false,
                false
              );
              addNewNotifications([
                {
                  id: String(albumData.albumId),
                  duration: 5000,
                  content: t('notifications.addedToQueue', {
                    count: albumSongs.length
                  })
                }
              ]);
            },
            isDisabled: !(albumSongs.length > 0)
          },
          {
            label: t('common.playAll'),
            iconName: 'play_arrow',
            clickHandler: () =>
              createQueue(
                albumSongs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
                'songs',
                false,
                albumData.albumId,
                true
              ),
            isDisabled: !(albumSongs.length > 0)
          }
        ]}
        dropdowns={[
          {
            name: 'AlbumInfoPageSortDropdown',
            value: sortingOrder,
            options: songSortOptions,
            onChange: (e) => {
              const order = e.currentTarget.value as SongSortTypes;
              navigate({
                search: (prev) => ({
                  ...prev,
                  sortingOrder: order
                })
              });
            },
            isDisabled: !(albumSongs.length > 0)
          }
        ]}
      />

      <VirtualizedList
        data={albumSongs}
        fixedItemHeight={60}
        scrollTopOffset={scrollTopOffset}
        components={{
          Header: () => <AlbumImgAndInfoContainer albumData={albumData} songsData={albumSongs} />,
          Footer: onlineAlbumInfo
            ? () => (
                <OnlineAlbumInfoContainer
                  biographyClassName="ml-0!"
                  albumTitle={albumData.title}
                  otherAlbumData={onlineAlbumInfo}
                />
              )
            : undefined
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
              trackNo={preferences?.showTrackNumberAsSongIndex ? (item.trackNo ?? '--') : undefined}
            />
          );
        }}
      />
    </MainContainer>
  );
}
