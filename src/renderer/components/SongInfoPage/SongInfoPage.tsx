/* eslint-disable no-console */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-nested-ternary */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/destructuring-assignment */
import React, { useContext } from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import { calculateTime } from 'renderer/utils/calculateTime';
import { valueRounder } from 'renderer/utils/valueRounder';
import MainContainer from '../MainContainer';
import SecondaryContainer from '../SecondaryContainer';
import SongArtist from '../SongsPage/SongArtist';
import SongStat from './SongStat';

const SongInfoPage = () => {
  const { currentlyActivePage } = useContext(AppContext);
  const { changeCurrentActivePage } = React.useContext(AppUpdateContext);

  const x: unknown = undefined;
  const [songInfo, setSongInfo] = React.useState(x as SongData | undefined);

  let songDuration = '0 seconds';

  if (songInfo) {
    const [minutes, seconds] = calculateTime(songInfo.duration).split(':');
    if (Number(minutes) === 0) songDuration = `${seconds} seconds`;
    else songDuration = `${minutes} minutes ${seconds} seconds`;
  }

  const fetchSongInfo = React.useCallback(() => {
    if (currentlyActivePage.data && currentlyActivePage.data.songInfo.songId) {
      window.api
        .getSongInfo([currentlyActivePage.data.songInfo.songId])
        .then((res) => {
          if (res && res.length > 0) {
            setSongInfo(res[0]);
          }
        });
    }
  }, [currentlyActivePage.data]);

  React.useEffect(() => {
    fetchSongInfo();
    const manageSongInfoUpdatesInSongInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DataEvent).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs' ||
            event.dataType === 'songs/noOfListens' ||
            event.dataType === 'songs/likes'
          )
            fetchSongInfo();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageSongInfoUpdatesInSongInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongInfoUpdatesInSongInfoPage
      );
    };
  }, [fetchSongInfo]);

  const calculateTotalListensOfTheYear = React.useCallback((arr: number[]) => {
    let val = 0;
    arr.forEach((ele) => {
      val += ele;
    });
    return val;
  }, []);

  const songArtists = React.useMemo(
    () =>
      songInfo && songInfo.artists ? (
        songInfo.artists.length > 0 ? (
          songInfo.artists.map((artist, index) => (
            <>
              <SongArtist
                artistId={artist.artistId}
                name={artist.name}
                key={artist.artistId}
              />

              {songInfo.artists && songInfo.artists.length - 1 !== index
                ? ', '
                : ''}
            </>
          ))
        ) : (
          <span>&apos;Unknown Artist&apos;</span>
        )
      ) : (
        'Unknown Artist'
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentlyActivePage.data.artistName,
      currentlyActivePage.pageTitle,
      songInfo?.artists,
    ]
  );

  return (
    <>
      {songInfo && (
        <MainContainer className="song-information-container">
          <>
            <div className="container appear-from-bottom flex">
              <div className="song-cover-container mr-8 w-fit h-60 rounded-md overflow-hidden">
                <img
                  src={`otomusic://localFiles/${songInfo.artworkPath}`}
                  alt={`${songInfo.title} cover`}
                  className="h-full object-cover"
                />
              </div>
              <div className="song-info max-w-[70%] text-font-color-black dark:text-font-color-white flex flex-col justify-center">
                <div
                  className="title info-type-1 mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-[2.5rem] font-medium hover:underline"
                  title={songInfo.title}
                >
                  {songInfo.title}
                </div>
                <div className="song-artists info-type-2 mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-base flex items-center">
                  {songArtists}
                </div>
                <div
                  className="info-type-2 mb-5 overflow-hidden text-ellipsis whitespace-nowrap hover:underline"
                  title={songInfo.album ? songInfo.album.name : 'Unknown Album'}
                  onClick={() => {
                    if (songInfo.album) {
                      return currentlyActivePage.pageTitle === 'AlbumInfo' &&
                        currentlyActivePage.data.albumId === songInfo.album.name
                        ? changeCurrentActivePage('Home')
                        : changeCurrentActivePage('AlbumInfo', {
                            albumId: songInfo.album.albumId,
                          });
                    }
                    return undefined;
                  }}
                >
                  {songInfo.album ? songInfo.album.name : 'Unknown Album'}
                </div>
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

                {songInfo && songInfo.format && songInfo.format.bitrate && (
                  <div className="info-type-3 mb-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                    {Math.floor(songInfo.format.bitrate / 1000)} Kbps
                  </div>
                )}
              </div>
            </div>
            {songInfo && songInfo.listeningRate && (
              <SecondaryContainer className="secondary-container song-stats-container flex flex-wrap flex-row h-fit rounded-2xl p-2 mt-8">
                <>
                  <SongStat
                    key={0}
                    title="All time Listens"
                    value={valueRounder(songInfo.listeningRate.allTime)}
                  />
                  <SongStat
                    key={1}
                    title="Listens This Month"
                    value={valueRounder(
                      songInfo.listeningRate.monthly.months[
                        new Date().getMonth()
                      ]
                    )}
                  />
                  <SongStat
                    key={2}
                    title="Listens This Year"
                    value={
                      songInfo.listeningRate.monthly.year ===
                      new Date().getFullYear()
                        ? valueRounder(
                            calculateTotalListensOfTheYear(
                              songInfo.listeningRate.monthly.months
                            )
                          )
                        : '0'
                    }
                  />
                  <SongStat
                    key={3}
                    title={
                      songInfo.isAFavorite
                        ? 'You loved this song'
                        : "You didn't like this song"
                    }
                    value={
                      <span
                        className={`${
                          songInfo.isAFavorite
                            ? 'material-icons-round'
                            : 'material-icons-round-outlined'
                        } icon ${
                          songInfo.isAFavorite && 'liked'
                        } text-[3.5rem] font-semibold`}
                      >
                        favorite
                      </span>
                    }
                  />
                </>
              </SecondaryContainer>
            )}
          </>
        </MainContainer>
      )}
    </>
  );
};

SongInfoPage.displayName = 'SongInfoPage';
export default SongInfoPage;
