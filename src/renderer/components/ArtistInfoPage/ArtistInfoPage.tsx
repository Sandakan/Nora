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
import { Song } from '../SongsPage/song';

export default () => {
  const { currentlyActivePage } = useContext(AppContext);
  const [artistData, setArtistData] = React.useState({} as ArtistInfo);
  const [albums, setAlbums] = React.useState([] as Album[]);
  const [songs, setSongs] = React.useState([] as SongData[]);

  React.useEffect(() => {
    if (currentlyActivePage.data && currentlyActivePage.data.artistName) {
      window.api
        .getArtistData(currentlyActivePage.data.artistName)
        .then((res) => {
          if (res && !Array.isArray(res)) {
            setArtistData({ ...res, artworkPath: DefaultArtistCover });
          }
        });
    }
  }, [currentlyActivePage.data]);

  React.useEffect(() => {
    if (artistData.artistId)
      window.api.getArtistArtworks(artistData.artistId).then((x) => {
        if (x)
          setArtistData((prevData) => {
            return {
              ...prevData,
              artworkPath: x.picture_big || prevData.artworkPath,
              artistPalette: x.artistPalette || prevData.artistPalette,
              artistBio: x.artistBio || prevData.artistBio,
            };
          });
      });
  }, [artistData.artistId]);

  React.useEffect(() => {
    if (artistData.songs && artistData.songs.length > 0) {
      const songsData = artistData.songs.map((song) =>
        window.api.getSongInfo(song.songId)
      );
      Promise.all(songsData).then((res) => {
        const data = res.filter((x) => x !== undefined) as SongData[];
        setSongs(data);
      });
    }
  }, [artistData.songs]);

  React.useEffect(() => {
    if (artistData.albums) {
      const albumsData = artistData.albums.map((album) =>
        window.api.getAlbumData(album.albumId)
      );
      Promise.all(albumsData).then((res) => {
        const data = res.filter(
          (x) => x !== undefined && !Array.isArray(x)
        ) as Album[];
        setAlbums(data);
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

  return (
    <div
      className="artist-info-page-container"
      style={
        artistData.artistPalette && {
          background: `linear-gradient(180deg, ${`rgb(${artistData.artistPalette.LightMuted._rgb[0]},${artistData.artistPalette.LightMuted._rgb[1]},${artistData.artistPalette.LightMuted._rgb[2]})`} 0%, var(--background-color-1) 90%)`,
        }
      }
    >
      {/* <div className="title-container">{artistData.name}</div> */}
      <div className="artist-img-and-info-container">
        <div className="artist-img-container">
          <img src={artistData.artworkPath} alt="" />
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
            {songs.map((song) => {
              return (
                <Song
                  key={song.songId}
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
        <div className="artist-bio-container">{artistData.artistBio}</div>
      )}
    </div>
  );
};
