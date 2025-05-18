import AlbumImgAndInfoContainer from '@renderer/components/AlbumInfoPage/AlbumImgAndInfoContainer';
import OnlineAlbumInfoContainer from '@renderer/components/AlbumInfoPage/OnlineAlbumInfoContainer';
import MainContainer from '@renderer/components/MainContainer';
import Song from '@renderer/components/SongsPage/Song';
import { songSortOptions } from '@renderer/components/SongsPage/SongOptions';
import TitleContainer from '@renderer/components/TitleContainer';
import VirtualizedList from '@renderer/components/VirtualizedList';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import { store } from '@renderer/store/store';
import { baseInfoPageSearchParamsSchema } from '@renderer/utils/zod/baseInfoPageSearchParamsSchema';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { zodValidator } from '@tanstack/zod-adapter';
import { useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import type { LastFMAlbumInfo } from 'src/types/last_fm_album_info_api';

export const Route = createFileRoute('/main-player/albums/$albumId')({
  validateSearch: zodValidator(baseInfoPageSearchParamsSchema),
  component: AlbumInfoPage
});

interface AlbumContentReducer {
  albumData: Album;
  otherAlbumData?: LastFMAlbumInfo;
  songsData: SongData[];
  sortingOrder: SongSortTypes;
}

type AlbumContentReducerActions =
  | 'ALBUM_DATA_UPDATE'
  | 'OTHER_ALBUM_DATA_UPDATE'
  | 'SONGS_DATA_UPDATE'
  | 'UPDATE_SORTING_ORDER';

const reducer = (
  state: AlbumContentReducer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: { type: AlbumContentReducerActions; data: any }
): AlbumContentReducer => {
  switch (action.type) {
    case 'ALBUM_DATA_UPDATE':
      return {
        ...state,
        albumData: action.data
      };
    case 'OTHER_ALBUM_DATA_UPDATE':
      return {
        ...state,
        otherAlbumData: action.data
      };
    case 'SONGS_DATA_UPDATE':
      return {
        ...state,
        songsData: action.data
      };
    case 'UPDATE_SORTING_ORDER':
      return {
        ...state,
        sortingOrder: action.data
      };
    default:
      return state;
  }
};

function AlbumInfoPage() {
  const { albumId } = Route.useParams();
  const { scrollTopOffset } = Route.useSearch();

  const preferences = useStore(store, (state) => state?.localStorage?.preferences);
  const queue = useStore(store, (state) => state.localStorage.queue);

  const {
    createQueue,
    updateQueueData,
    addNewNotifications,
    updateCurrentlyActivePageData,
    playSong
  } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [albumContent, dispatch] = useReducer(reducer, {
    albumData: {} as Album,
    songsData: [] as SongData[],
    sortingOrder: 'trackNoAscending' as SongSortTypes
  });

  useEffect(() => {
    if (albumId)
      window.api.albumsData
        .getAlbumInfoFromLastFM(albumId)
        .then((res) => {
          if (res) dispatch({ type: 'OTHER_ALBUM_DATA_UPDATE', data: res });
          return undefined;
        })
        .catch((err) => console.error(err));
  }, [albumId]);

  const fetchAlbumData = useCallback(() => {
    if (albumId) {
      window.api.albumsData
        .getAlbumData([albumId as string])
        .then((res) => {
          if (res && res.length > 0 && res[0]) {
            dispatch({ type: 'ALBUM_DATA_UPDATE', data: res[0] });
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [albumId]);

  const fetchAlbumSongs = useCallback(() => {
    if (albumContent.albumData.songs && albumContent.albumData.songs.length > 0) {
      window.api.audioLibraryControls
        .getSongInfo(
          albumContent.albumData.songs.map((song) => song.songId),
          albumContent.sortingOrder
        )
        .then((res) => {
          if (res && res.length > 0) {
            dispatch({ type: 'SONGS_DATA_UPDATE', data: res });
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [albumContent.albumData, albumContent.sortingOrder]);

  useEffect(() => {
    fetchAlbumData();
    const manageDataUpdatesInAlbumsInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'albums') fetchAlbumData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageDataUpdatesInAlbumsInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageDataUpdatesInAlbumsInfoPage);
    };
  }, [fetchAlbumData]);

  useEffect(() => {
    fetchAlbumSongs();
    const manageAlbumSongUpdatesInAlbumInfoPage = (e: Event) => {
      const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
      if ('detail' in e) {
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
            fetchAlbumSongs();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageAlbumSongUpdatesInAlbumInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageAlbumSongUpdatesInAlbumInfoPage);
    };
  }, [fetchAlbumSongs]);

  const selectAllHandler = useSelectAllHandler(albumContent.songsData, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: string) => {
      const queueSongIds = albumContent.songsData
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'album', false, albumContent.albumData.albumId, false);
      playSong(currSongId, true);
    },
    [albumContent.songsData, albumContent.albumData.albumId, createQueue, playSong]
  );

  const listItems = useMemo(() => {
    const items: (Album | SongData | LastFMAlbumInfo)[] = [
      albumContent.albumData,
      ...albumContent.songsData
    ];

    if (albumContent?.otherAlbumData) items.push(albumContent.otherAlbumData);

    return items;
  }, [albumContent.albumData, albumContent?.otherAlbumData, albumContent.songsData]);

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
        title={albumContent.albumData.title}
        className="pr-4"
        buttons={[
          {
            tooltipLabel: t('common.shuffleAndPlay'),
            iconName: 'shuffle',
            clickHandler: () =>
              createQueue(
                albumContent.songsData
                  .filter((song) => !song.isBlacklisted)
                  .map((song) => song.songId),
                'songs',
                true,
                albumContent.albumData.albumId,
                true
              ),
            isDisabled: !(albumContent.songsData.length > 0)
          },
          {
            tooltipLabel: t('common.addToQueue'),
            iconName: 'add',
            clickHandler: () => {
              updateQueueData(
                undefined,
                [...queue.queue, ...albumContent.songsData.map((song) => song.songId)],
                false,
                false
              );
              addNewNotifications([
                {
                  id: albumContent.albumData.albumId,
                  duration: 5000,
                  content: t('notifications.addedToQueue', {
                    count: albumContent.songsData.length
                  })
                }
              ]);
            },
            isDisabled: !(albumContent.songsData.length > 0)
          },
          {
            label: t('common.playAll'),
            iconName: 'play_arrow',
            clickHandler: () =>
              createQueue(
                albumContent.songsData
                  .filter((song) => !song.isBlacklisted)
                  .map((song) => song.songId),
                'songs',
                false,
                albumContent.albumData.albumId,
                true
              ),
            isDisabled: !(albumContent.songsData.length > 0)
          }
        ]}
        dropdowns={[
          {
            name: 'AlbumInfoPageSortDropdown',
            value: albumContent.sortingOrder,
            options: songSortOptions,
            onChange: (e) => {
              const order = e.currentTarget.value as SongSortTypes;
              updateCurrentlyActivePageData((currentPageData) => ({
                ...currentPageData,
                sortingOrder: order
              }));
              dispatch({ type: 'UPDATE_SORTING_ORDER', data: order });
            },
            isDisabled: !(albumContent.songsData.length > 0)
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
                trackNo={
                  preferences?.showTrackNumberAsSongIndex ? (item.trackNo ?? '--') : undefined
                }
              />
            );

          if ('sortedAllTracks' in item)
            return (
              <OnlineAlbumInfoContainer
                albumTitle={albumContent.albumData.title}
                otherAlbumData={item}
              />
            );

          return <AlbumImgAndInfoContainer albumData={item} songsData={albumContent.songsData} />;
        }}
      />
    </MainContainer>
  );
}
