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
          <div
            className="artists info-type-2"
            title={
              Array.isArray(props.currentSongData.artists)
                ? props.currentSongData.artists.join(', ')
                : props.currentSongData.artists
            }
          >
            {Array.isArray(props.currentSongData.artists)
              ? props.currentSongData.artists.join(', ')
              : props.currentSongData.artists}
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
              {songInfo.format.bitrate / 1000} Kbps
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
        </div>
      )}
    </div>
  );
};
