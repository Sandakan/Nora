/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-nested-ternary */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/destructuring-assignment */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { calculateTime } from 'renderer/utils/calculateTime';
import { valueRounder } from 'renderer/utils/valueRounder';
import SongStat from './SongStat';

export default () => {
  const { currentlyActivePage, changeCurrentActivePage } =
    useContext(AppContext);
  const x: unknown = undefined;
  const [songInfo, setSongInfo] = React.useState(x as SongData | undefined);
  let songDuration = '0 seconds';
  if (songInfo) {
    const [minutes, seconds] = calculateTime(songInfo.duration).split(':');
    if (Number(minutes) === 0) songDuration = `${seconds} seconds`;
    else songDuration = `${minutes} minutes ${seconds} seconds`;
  }

  React.useEffect(() => {
    if (currentlyActivePage.data && currentlyActivePage.data.songInfo.songId) {
      window.api
        .getSongInfo(currentlyActivePage.data.songInfo.songId)
        .then((res) => {
          if (res) setSongInfo(res);
        });
    }
  }, [currentlyActivePage.data]);

  const calculateTotalListensOfTheYear = (arr: number[]) => {
    let val = 0;
    arr.forEach((ele) => {
      val += ele;
    });
    return val;
  };

  return (
    <>
      {songInfo && (
        <div className="main-container song-information-container">
          <div className="container">
            <div className="song-cover-container">
              <img
                src={`otomusic://localFiles/${songInfo.artworkPath}`}
                alt={`${songInfo.title} cover`}
              />
            </div>
            <div className="song-info">
              <div className="title info-type-1" title={songInfo.title}>
                {songInfo.title}
              </div>
              <div className="song-artists info-type-2">
                {songInfo.artists ? (
                  Array.isArray(songInfo.artists) ? (
                    songInfo.artists.length > 0 &&
                    songInfo.artists[0] !== '' ? (
                      songInfo.artists.map((artist, index) => (
                        <>
                          <span
                            className="artist"
                            key={index}
                            title={artist}
                            onClick={() =>
                              currentlyActivePage.pageTitle === 'ArtistInfo' &&
                              currentlyActivePage.data.artistName === artist
                                ? changeCurrentActivePage('Home')
                                : changeCurrentActivePage('ArtistInfo', {
                                    artistName: artist,
                                  })
                            }
                          >
                            {artist}
                          </span>
                          {songInfo.artists.length === 0 ||
                          songInfo.artists.length - 1 === index
                            ? ''
                            : ', '}
                        </>
                      ))
                    ) : (
                      'Unknown Artist'
                    )
                  ) : (
                    <span className="artist" title={songInfo.artists}>
                      {songInfo.artists}
                    </span>
                  )
                ) : (
                  'Unknown Artist'
                )}
              </div>
              <div
                className="info-type-2"
                title={songInfo.album}
                // TODO - CANNOT ADD THIS FUNCTIONALITY BECAUSE OF ABSENCE OF INPUT DATA
                // onClick={() =>
                //   currentlyActivePage.pageTitle === 'ArtistInfo' &&
                //   currentlyActivePage.data.artistName === artist
                //     ? changeCurrentActivePage('Home')
                //     : changeCurrentActivePage('ArtistInfo', {
                //         artistName: artist,
                //       })
                // }
              >
                {songInfo.album}
              </div>
              <div className="info-type-3" title={songDuration}>
                {songDuration}
              </div>

              {songInfo && songInfo.sampleRate && (
                <div className="info-type-3">
                  {songInfo.sampleRate / 1000} KHZ
                </div>
              )}

              {songInfo && songInfo.format && songInfo.format.bitrate && (
                <div className="info-type-3">
                  {Math.floor(songInfo.format.bitrate / 1000)} Kbps
                </div>
              )}
            </div>
          </div>
          {songInfo && songInfo.listeningRate && (
            <div className="secondary-container song-stats-container">
              <SongStat
                title="All time Listens"
                value={valueRounder(songInfo.listeningRate.allTime)}
              />
              <SongStat
                title="Listens This Month"
                value={valueRounder(
                  songInfo.listeningRate.monthly.months[new Date().getMonth()]
                )}
              />
              <SongStat
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
                title={
                  songInfo.isAFavorite
                    ? 'You loved this song'
                    : "You didn't like this song"
                }
                value={
                  <span
                    className={`material-icons-round icon ${
                      songInfo.isAFavorite && 'liked'
                    }`}
                  >
                    {songInfo.isAFavorite ? 'favorite' : 'favorite_border'}
                  </span>
                }
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
