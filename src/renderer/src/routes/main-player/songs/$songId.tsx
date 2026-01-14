/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import Img from '@renderer/components/Img';
import MainContainer from '@renderer/components/MainContainer';
import NavLink from '@renderer/components/NavLink';
import SecondaryContainer from '@renderer/components/SecondaryContainer';
import ListeningActivityBarGraph from '@renderer/components/SongInfoPage/ListeningActivityBarGraph';
import SimilarTracksContainer from '@renderer/components/SongInfoPage/SimilarTracksContainer';
import SongAdditionalInfoContainer from '@renderer/components/SongInfoPage/SongAdditionalInfoContainer';
import SongStat from '@renderer/components/SongInfoPage/SongStat';
import SongsWithFeaturingArtistsSuggestion from '@renderer/components/SongInfoPage/SongsWithFeaturingArtistSuggestion';
import SongArtist from '@renderer/components/SongsPage/SongArtist';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import { queryClient } from '@renderer/index';
import { listenQuery } from '@renderer/queries/listens';
import { songQuery } from '@renderer/queries/songs';
import { store } from '@renderer/store/store';
import calculateTimeFromSeconds from '@renderer/utils/calculateTimeFromSeconds';
import { valueRounder } from '@renderer/utils/valueRounder';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/main-player/songs/$songId')({
  component: SongInfoPage,
  loader: async (route) => {
    const songId = Number(route.params.songId);

    await queryClient.ensureQueryData(listenQuery.single({ songId }));
    await queryClient.ensureQueryData(songQuery.singleSongInfo({ songId }));
  }
});

function SongInfoPage() {
  const { songId } = Route.useParams({ select: (params) => ({ songId: Number(params.songId) }) });

  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);

  const { updateBodyBackgroundImage, updateContextMenuData, updateSongPosition } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { data: songInfo } = useSuspenseQuery({
    ...songQuery.singleSongInfo({ songId }),
    select: (data) => (Array.isArray(data) && data.length > 0 ? data[0] : undefined)
  });
  const { data: listeningData } = useSuspenseQuery({
    ...listenQuery.single({ songId }),
    select: (data) => data[0] ?? undefined
  });

  const { currentMonth, currentYear } = useMemo(() => {
    const currentDate = new Date();
    return {
      currentDate,
      currentYear: currentDate.getFullYear(),
      currentMonth: currentDate.getMonth(),
      currentDay: currentDate.getDate()
    };
  }, []);

  const songDuration = useMemo(() => {
    const { timeString } = calculateTimeFromSeconds(songInfo?.duration ?? 0);

    return timeString;
  }, [songInfo]);

  useEffect(() => {
    if (songInfo) {
      if (songInfo.isArtworkAvailable) {
        updateBodyBackgroundImage(true, songInfo.artworkPaths?.artworkPath);
      }
    }
  }, [songInfo, updateBodyBackgroundImage]);

  // const updateSongInfo = useCallback((callback: (prevData: SongData) => SongData) => {
  //   setSongInfo((prevData) => {
  //     if (prevData) {
  //       const updatedSongData = callback(prevData);
  //       return updatedSongData;
  //     }
  //     return prevData;
  //   });
  // }, []);

  // const fetchSongInfo = useCallback(() => {
  //   if (songId) {
  //     console.time('fetchTime');

  //     window.api.audioLibraryControls
  //       .getSongInfo([songId])
  //       .then((res) => {
  //         console.log(`Time end : ${console.timeEnd('fetchTime')}`);
  //         if (res && res.length > 0) {
  //           if (res[0].isArtworkAvailable)
  //             updateBodyBackgroundImage(true, res[0].artworkPaths?.artworkPath);
  //           setSongInfo(res[0]);
  //         }
  //         return undefined;
  //       })
  //       .catch((err) => log(err));
  //   }
  // }, [songId, updateBodyBackgroundImage]);

  // useEffect(() => {
  //   fetchSongInfo();
  //   const manageSongInfoUpdatesInSongInfoPage = (e: Event) => {
  //     if ('detail' in e) {
  //       const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
  //       for (let i = 0; i < dataEvents.length; i += 1) {
  //         const event = dataEvents[i];
  //         if (
  //           event.dataType === 'songs' ||
  //           event.dataType === 'songs/listeningData' ||
  //           event.dataType === 'songs/listeningData/fullSongListens' ||
  //           event.dataType === 'songs/listeningData/inNoOfPlaylists' ||
  //           event.dataType === 'songs/listeningData/listens' ||
  //           event.dataType === 'songs/listeningData/skips' ||
  //           event.dataType === 'songs/likes'
  //         )
  //           fetchSongInfo();
  //       }
  //     }
  //   };
  //   document.addEventListener('app/dataUpdates', manageSongInfoUpdatesInSongInfoPage);
  //   return () => {
  //     document.removeEventListener('app/dataUpdates', manageSongInfoUpdatesInSongInfoPage);
  //   };
  // }, [fetchSongInfo]);

  const songArtists = useMemo(() => {
    const artists = songInfo?.artists;
    if (Array.isArray(artists) && artists.length > 0) {
      return artists
        .map((artist, i, artistArr) => {
          const arr = [
            <SongArtist
              key={artist.artistId}
              artistId={artist.artistId}
              name={artist.name}
              className={`ml-1 text-base! first:ml-0! ${bodyBackgroundImage && 'text-white!'}`}
            />
          ];

          if ((artists?.length ?? 1) - 1 !== i)
            arr.push(
              <span className="mr-1" key={`${artistArr[i]}=>${artistArr[i + 1]}`}>
                ,
              </span>
            );

          return arr;
        })
        .flat();
    }
    return <span className="text-xs font-normal">{t('common.unknownArtist')}</span>;
  }, [bodyBackgroundImage, songInfo?.artists, t]);

  const { allTimeListens, thisYearListens, thisMonthListens } = useMemo(() => {
    let allTime = 0;
    let thisYearNoofListens = 0;
    let thisMonthNoOfListens = 0;
    if (listeningData) {
      const { playEvents } = listeningData;

      allTime = playEvents.length;

      thisYearNoofListens = playEvents.filter((pe) => {
        const playEventDate = new Date(pe.createdAt);
        return playEventDate.getFullYear() === currentYear;
      }).length;

      thisMonthNoOfListens = playEvents.filter((pe) => {
        const playEventDate = new Date(pe.createdAt);
        return (
          playEventDate.getFullYear() === currentYear && playEventDate.getMonth() === currentMonth
        );
      }).length;
    }
    return {
      allTimeListens: allTime,
      thisYearListens: thisYearNoofListens,
      thisMonthListens: thisMonthNoOfListens
    };
  }, [currentMonth, currentYear, listeningData]);

  const { totalSongFullListens, totalSongSkips, maxSongSeekPosition, maxSongSeekFrequency } =
    useMemo(() => {
      if (listeningData) {
        const { playEvents, skipEvents, seekEvents } = listeningData;

        const groupedSeeks = Object.groupBy(seekEvents, (seek) =>
          parseFloat(seek.position).toFixed(2)
        );

        // find the seek group with the most seeks
        let groupWithMostSeeks: { position: string; seeks: typeof seekEvents } | null = null;
        for (const group in groupedSeeks) {
          if (
            groupWithMostSeeks === null ||
            groupedSeeks[group]!.length > groupWithMostSeeks.seeks.length
          ) {
            groupWithMostSeeks = { position: group, seeks: groupedSeeks[group]! };
          }
        }

        const totalFullListens = playEvents.filter((pe) => {
          const playbackPercentage = parseFloat(pe.playbackPercentage);
          return playbackPercentage > 0.99;
        }).length;

        const totalSkips = skipEvents.length;

        if (!groupWithMostSeeks) {
          return {
            totalSongFullListens: valueRounder(totalFullListens),
            totalSongSkips: valueRounder(totalSkips)
          };
        }

        const maxSeekPosition = parseFloat(groupWithMostSeeks.position);
        const maxSeekFrequency = groupWithMostSeeks.seeks.length;

        return {
          totalSongFullListens: valueRounder(totalFullListens),
          totalSongSkips: valueRounder(totalSkips),
          maxSongSeekPosition: maxSeekPosition,
          maxSongSeekFrequency: maxSeekFrequency
        };
      }
      return {
        totalSongFullListens: 0,
        totalSongSkips: 0
      };
    }, [listeningData]);

  return songInfo ? (
    <MainContainer className="song-information-container pt-8 [scrollbar-gutter:stable]">
      <>
        <div className="appear-from-bottom container flex">
          <div className="song-cover-container mr-8 h-60 w-fit overflow-hidden rounded-md">
            <Img
              src={songInfo.artworkPaths?.artworkPath}
              alt={`${songInfo.title} cover`}
              className="h-full object-cover"
              loading="eager"
              onContextMenu={(e) =>
                !songInfo.artworkPaths.isDefaultArtwork &&
                updateContextMenuData(
                  true,
                  [
                    {
                      label: t('common.saveArtwork'),
                      class: 'edit',
                      iconName: 'image',
                      iconClassName: 'material-icons-round-outlined',
                      handlerFunction: () =>
                        window.api.songUpdates.saveArtworkToSystem(
                          songInfo.artworkPaths.artworkPath,
                          `${songInfo.title} song artwork`.replaceAll(' ', '_')
                        )
                    }
                  ],
                  e.pageX,
                  e.pageY
                )
              }
            />
          </div>
          <div
            className={`song-info flex max-w-[70%] flex-col justify-center ${
              bodyBackgroundImage
                ? 'text-font-color-white! dark:text-font-color-white!'
                : 'text-font-color-black dark:text-font-color-white'
            }`}
          >
            <div className="font-semibold uppercase opacity-50 dark:font-medium">
              {t('common.song_one')}
            </div>
            <div
              className={`title info-type-1 text-font-color-highlight dark:text-dark-font-color-highlight mb-1 overflow-hidden text-5xl font-medium text-ellipsis whitespace-nowrap ${
                bodyBackgroundImage && 'text-dark-font-color-highlight!'
              }`}
              title={songInfo.title}
            >
              {songInfo.title}
            </div>
            <div className="song-artists info-type-2 mb-1 flex items-center overflow-hidden text-base text-ellipsis whitespace-nowrap">
              {songArtists}
            </div>

            {songInfo.album && (
              <NavLink
                to="/main-player/albums/$albumId"
                params={{ albumId: String(songInfo.album?.albumId!) }}
                className={`info-type-2 mr-0! mb-5 w-fit! truncate border-0! p-0! ${
                  songInfo.album && 'hover:underline'
                } ${bodyBackgroundImage && 'text-white!'}`}
              >
                {songInfo.album ? songInfo.album.name : t('common.unknownAlbum')}
              </NavLink>
            )}

            <div
              className="info-type-3 mb-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap"
              title={songDuration}
            >
              {songDuration}
            </div>
            {songInfo && songInfo.sampleRate && (
              <div className="info-type-3 mb-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                {songInfo.sampleRate / 1000} KHZ
              </div>
            )}
            {songInfo && songInfo.bitrate && (
              <div className="info-type-3 mb-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                {Math.floor(songInfo.bitrate / 1000)} Kbps
              </div>
            )}
          </div>
        </div>

        <SongsWithFeaturingArtistsSuggestion
          songId={songInfo.songId}
          songTitle={songInfo.title}
          artistNames={songInfo.artists?.map((x) => x.name) || []}
          path={songInfo.path}
          // updateSongInfo={updateSongInfo}
          updateSongInfo={() => {}}
        />

        <SecondaryContainer className="secondary-container song-stats-container mt-8 flex h-fit flex-row flex-wrap items-center justify-center rounded-2xl p-2">
          {listeningData && (
            <div className="grid w-full grid-flow-col place-content-center gap-4 py-4 pr-4 xl:grid-flow-row">
              <ListeningActivityBarGraph listeningData={listeningData} className="xl:order-2" />
              <div className="stat-cards grid max-h-full w-fit min-w-lg grid-cols-2 flex-wrap items-center justify-center gap-4 place-self-center xl:order-1 xl:mt-4 xl:flex xl:max-h-none xl:grid-cols-3 xl:grid-rows-2">
                <SongStat
                  key={0}
                  title={t('songInfoPage.allTimeListens')}
                  value={valueRounder(allTimeListens)}
                />
                <SongStat
                  key={1}
                  title={t('songInfoPage.listensThisMonth')}
                  value={valueRounder(thisMonthListens)}
                />
                <SongStat
                  key={2}
                  title={t('songInfoPage.listensThisYear')}
                  value={valueRounder(thisYearListens)}
                />
                <SongStat
                  key={3}
                  title={t(`songInfoPage.${songInfo.isAFavorite ? 'lovedSong' : 'unlovedSong'}`)}
                  value={
                    <span
                      className={`${
                        songInfo.isAFavorite
                          ? 'material-icons-round'
                          : 'material-icons-round-outlined'
                      } icon ${songInfo.isAFavorite && 'liked'} text-[3.5rem] font-semibold`}
                    >
                      favorite
                    </span>
                  }
                />
                <SongStat key={4} title={t('songInfoPage.totalSongSkips')} value={totalSongSkips} />
                <SongStat
                  key={5}
                  title={t('songInfoPage.fullSongListens')}
                  value={totalSongFullListens}
                />
                {maxSongSeekPosition !== undefined && (
                  <SongStat
                    key={6}
                    title={t('songInfoPage.mostSoughtPosition')}
                    value={
                      <span
                        className="flex flex-col"
                        onClick={() => updateSongPosition(maxSongSeekPosition)}
                      >
                        <span className="text-2xl">{maxSongSeekPosition.toFixed(1)}</span>
                        <span className="text-xs">
                          {t('time.second', {
                            count: parseFloat(maxSongSeekPosition.toFixed(1))
                          })}
                        </span>
                      </span>
                    }
                  />
                )}
                {maxSongSeekFrequency !== undefined && (
                  <SongStat
                    key={7}
                    title={t('songInfoPage.mostSoughtFrequency')}
                    value={maxSongSeekFrequency}
                  />
                )}
              </div>
            </div>
          )}
          <SongAdditionalInfoContainer songInfo={songInfo} songDurationStr={songDuration} />
          {songId && <SimilarTracksContainer songId={songId} />}
        </SecondaryContainer>
      </>
    </MainContainer>
  ) : null;
}
