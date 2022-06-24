/* eslint-disable no-console */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
/* eslint-disable promise/no-nesting */
/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { calculateTime } from 'renderer/utils/calculateTime';
import DefaultArtistCover from '../../../../assets/images/default_artist_cover.png';
import { Album } from '../AlbumsPage/Album';
import { Song } from '../SongsPage/Song';
import Button from '../Button';

export default () => {
  const {
    currentlyActivePage,
    queue,
    createQueue,
    updateQueueData,
    updateNotificationPanelData,
  } = useContext(AppContext);
  const [artistData, setArtistData] = React.useState({} as ArtistInfo);
  const [albums, setAlbums] = React.useState([] as Album[]);
  const [songs, setSongs] = React.useState([] as SongData[]);

  React.useEffect(() => {
    if (currentlyActivePage.data && currentlyActivePage.data.artistName) {
      window.api
        .getArtistData([currentlyActivePage.data.artistName])
        .then((res) => {
          if (res && res.length > 0) {
            setArtistData({ ...res[0], artworkPath: DefaultArtistCover });
          }
        });
    }
  }, [currentlyActivePage.data]);

  React.useEffect(() => {
    if (artistData.artistId)
      if (navigator.onLine)
        window.api
          .getArtistArtworks(artistData.artistId)
          .then((x) => {
            if (x)
              setArtistData((prevData) => {
                return {
                  ...prevData,
                  artworkPath:
                    x.artistArtworks?.picture_medium || prevData.artworkPath,
                  artistPalette: x.artistPalette || prevData.artistPalette,
                  artistBio: x.artistBio || prevData.artistBio,
                };
              });
          })
          .catch((err) => {
            console.error(err);
          });
  }, [artistData.artistId]);

  React.useEffect(() => {
    if (artistData.songs && artistData.songs.length > 0) {
      window.api
        .getSongInfo(artistData.songs.map((song) => song.songId))
        .then((songsData) => {
          if (songsData && songsData.length > 0) setSongs(songsData);
        });
    }
  }, [artistData.songs]);

  React.useEffect(() => {
    if (artistData.albums && artistData.albums.length > 0) {
      window.api
        .getAlbumData(artistData.albums.map((album) => album.albumId))
        .then((res) => {
          if (res && res.length > 0) setAlbums(res);
        });
    }
  }, [artistData.albums]);

  const calculateTotalTime = () => {
    const val = calculateTime(
      songs.reduce((prev, current) => prev + current.duration, 0)
    );
    const duration = val.split(':');
    return `${
      Number(duration[0]) / 60 >= 1
        ? `${Math.floor(Number(duration[0]) / 60)} hour${
            Math.floor(Number(duration[0]) / 60) === 1 ? '' : 's'
          } `
        : ''
    }${Math.floor(Number(duration[0]) % 60)} minute${
      Math.floor(Number(duration[0]) % 60) === 1 ? '' : 's'
    } ${duration[1]} second${Number(duration[1]) === 1 ? '' : 's'}`;
  };

  const sanitizeArtistBio = () => {
    if (artistData.artistBio) {
      const x = artistData.artistBio.match(/<a .*<\/a>/gm);
      const y = x ? x[0].match(/".*"/gm) : [''];
      const link = y ? y[0].replace(/"/gm, '') : '';
      return (
        <>
          {artistData.artistBio.replace(/<a .*<\/a>/gm, '')}
          <span
            className="link"
            onClick={() => window.api.openInBrowser(link)}
            role="link"
            tabIndex={0}
            title={link}
          >
            Read more...
          </span>
        </>
      );
    }
    return '';
  };

  return (
    <div
      className="artist-info-page-container"
      style={
        artistData.artistPalette && {
          background: `linear-gradient(180deg, ${`rgb(${artistData.artistPalette.LightMuted._rgb[0]},${artistData.artistPalette.LightMuted._rgb[1]},${artistData.artistPalette.LightMuted._rgb[2]})`} 0%, var(--background-color-1) 90%)`,
        }
      }
    >
      <div className="artist-img-and-info-container">
        <div className="artist-img-container">
          <img src={artistData.artworkPath} alt="Album Cover" />
        </div>
        <div className="artist-info-container">
          <div
            className="artist-name"
            style={
              artistData.artistPalette && {
                color: `rgb(${artistData.artistPalette.DarkMuted._rgb[0]},${artistData.artistPalette.DarkMuted._rgb[1]},${artistData.artistPalette.DarkMuted._rgb[2]})`,
              }
            }
          >
            {artistData.name}
          </div>
          {artistData.songs && (
            <div className="artist-no-of-songs">
              {artistData.albums && artistData.albums.length > 0
                ? `${artistData.albums.length} album${
                    artistData.albums.length === 1 ? '' : 's'
                  } `
                : '0 albums '}
              &bull;
              {` ${artistData.songs.length} song${
                artistData.songs.length === 1 ? '' : 's'
              } `}
            </div>
          )}
          {songs.length > 0 && (
            <div className="artist-total-songs-duration">
              {calculateTotalTime()}
            </div>
          )}
          {artistData.songs && artistData.songs.length > 0 && (
            <div className="artist-buttons">
              <Button
                label="Play All"
                iconName="play_arrow"
                clickHandler={() =>
                  createQueue(
                    artistData.songs.map((song) => song.songId),
                    'songs',
                    undefined,
                    true
                  )
                }
              />
              <Button
                label="Shuffle and Play"
                iconName="shuffle"
                clickHandler={() =>
                  createQueue(
                    artistData.songs
                      .map((song) => song.songId)
                      .sort(() => 0.5 - Math.random()),
                    'songs',
                    undefined,
                    true
                  )
                }
              />
              <Button
                label="Add to Queue"
                iconName="add"
                clickHandler={() => {
                  updateQueueData(
                    undefined,
                    [...queue.queue, ...songs.map((song) => song.songId)],
                    false
                  );
                  updateNotificationPanelData(
                    5000,
                    <span>
                      Added {songs.length} song
                      {songs.length === 1 ? '' : 's'} to the queue.
                    </span>
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>
      {albums && albums.length > 0 && (
        <div className="main-container albums-list-container">
          <div className="title-container">Appears On Albums</div>
          <div className="albums-container">
            {albums.map((album, index) => {
              return (
                <Album
                  albumId={album.albumId}
                  artists={album.artists}
                  artworkPath={album.artworkPath}
                  songs={album.songs}
                  title={album.title}
                  year={album.year}
                  key={index}
                />
              );
            })}
          </div>
        </div>
      )}
      {songs && songs.length > 0 && (
        <div className="main-container songs-list-container">
          <div className="title-container">Appears on songs</div>
          <div className="songs-container">
            {songs.map((song, index) => {
              return (
                <Song
                  key={song.songId}
                  index={index}
                  title={song.title}
                  artists={song.artists}
                  duration={song.duration}
                  songId={song.songId}
                  artworkPath={song.artworkPath}
                  path={song.path}
                />
              );
            })}
          </div>
        </div>
      )}
      {artistData.artistBio && (
        <div className="artist-bio-container">{sanitizeArtistBio()}</div>
      )}
    </div>
  );
};
