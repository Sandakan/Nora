/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-restricted-syntax */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { calculateTime } from 'renderer/calculateTime';
import { valueRounder } from 'renderer/valueRounder';
import SongStat from './SongStat';

interface SongInfoProp {
  currentSongData: AudioData;
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
}

export default (props: SongInfoProp) => {
  const x: unknown = undefined;
  const [songInfo, setSongInfo] = React.useState(x as SongData | undefined);
  let songDuration = '0 seconds';
  if (props.currentSongData && songInfo) {
    const [minutes, seconds] = calculateTime(songInfo.duration).split(':');
    if (Number(minutes) === 0) songDuration = `${seconds} seconds`;
    else songDuration = `${minutes} minutes ${seconds} seconds`;
  }

  React.useEffect(() => {
    if (props.currentSongData) {
      window.api.getSongInfo(props.currentSongData.songId).then((res) => {
        if (res) setSongInfo(res);
      });
    }
  }, [props.currentSongData]);

  const calculateTotalListensOfTheYear = (arr: number[]) => {
    let val = 0;
    for (const ele of arr) {
      val += ele;
    }
    return val;
  };

  return (
    <div className="main-container song-information-container">
      <div className="container">
        <div className="song-cover-container">
          <img
            src={`otomusic://localFiles/${props.currentSongData.artworkPath}`}
            alt={`${props.currentSongData.title} cover`}
          />
        </div>
        <div className="song-info">
          <div
            className="title info-type-1"
            title={props.currentSongData.title}
          >
            {props.currentSongData.title}
          </div>
          <div className="song-artists info-type-2">
            {props.currentSongData.artists ? (
              Array.isArray(props.currentSongData.artists) ? (
                props.currentSongData.artists.length > 0 &&
                props.currentSongData.artists[0] !== '' ? (
                  props.currentSongData.artists.map((artist, index) => (
                    <>
                      <span
                        className="artist"
                        key={index}
                        title={artist}
                        onClick={() =>
                          props.currentlyActivePage.pageTitle ===
                            'ArtistInfo' &&
                          props.currentlyActivePage.data.artistName === artist
                            ? props.changeCurrentActivePage('Home')
                            : props.changeCurrentActivePage('ArtistInfo', {
                                artistName: artist,
                              })
                        }
                      >
                        {artist}
                      </span>
                      {props.currentSongData.artists.length === 0 ||
                      props.currentSongData.artists.length - 1 === index
                        ? ''
                        : ', '}
                    </>
                  ))
                ) : (
                  'Unknown Artist'
                )
              ) : (
                <span className="artist" title={props.currentSongData.artists}>
                  {props.currentSongData.artists}
                </span>
              )
            ) : (
              'Unknown Artist'
            )}
          </div>
          <div className="info-type-2" title={props.currentSongData.album}>
            {props.currentSongData.album}
          </div>
          <div className="info-type-3" title={songDuration}>
            {songDuration}
          </div>

          {songInfo && songInfo.sampleRate && (
            <div className="info-type-3">{songInfo.sampleRate / 1000} KHZ</div>
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
              songInfo.listeningRate.monthly.year === new Date().getFullYear()
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
                className={`fa-${
                  songInfo.isAFavorite ? 'solid' : 'regular'
                } fa-heart ${songInfo.isAFavorite && 'liked'}`}
              ></span>
            }
          />
        </div>
      )}
    </div>
  );
};