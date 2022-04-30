/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-underscore-dangle */
/* eslint-disable promise/no-nesting */
/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import React from 'react';
import DefaultArtistCover from '../../../../assets/images/default_artist-cover.png';
import { Album } from '../AlbumsPage/Album';
import { Song } from '../SongsPage/song';

interface ArtistInfoProp {
  data?: {
    artistName: string;
  };
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
  playSong: (songId: string) => void;
  currentSongData: AudioData;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: any[],
    pageX?: number,
    pageY?: number
  ) => void;
}

export default (props: ArtistInfoProp) => {
  const [artistData, setArtistData] = React.useState({} as ArtistInfo);
  const [albums, setAlbums] = React.useState([] as Album[]);
  const [songs, setSongs] = React.useState([] as SongData[]);

  React.useEffect(() => {
    if (props.data && props.data.artistName) {
      window.api.getArtistData(props.data.artistName).then((res) => {
        if (res && !Array.isArray(res)) {
          setArtistData({ ...res, artworkPath: DefaultArtistCover });
        }
      });
    }
  }, [props.data]);

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
      const songsData: SongData[] = [];
      for (const x of artistData.songs) {
        window.api.getSongInfo(x.songId).then((res) => {
          if (res) songsData.push(res);
        });
      }
      setSongs(songsData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistData.songs]);

  React.useEffect(() => {
    if (artistData.albums) {
      const albumsData: Album[] = [];
      for (const albumData of artistData.albums) {
        window.api.getAlbumData(albumData.albumId).then((data) => {
          if (data && !Array.isArray(data)) albumsData.push(data);
        });
      }
      setAlbums(albumsData);
    }
  }, [artistData.albums]);

  // if (artistData.artistPalette)
  //   (
  //     document.querySelector('.body-and-side-bar-container') as HTMLDivElement
  //   ).style.background = `linear-gradient(180deg, ${`rgb(${artistData.artistPalette.LightVibrant._rgb[0]},${artistData.artistPalette.LightVibrant._rgb[1]},${artistData.artistPalette.LightVibrant._rgb[2]})`} 0%, var(--background-color-1) 90%)`;

  return (
    <div
      className="artist-info-page-container"
      style={
        artistData.artistPalette && {
          // color: `rgb(${artistData.artistPalette.LightMuted._rgb[0]},${artistData.artistPalette.DarkMuted._rgb[1]},${artistData.artistPalette.DarkMuted._rgb[2]})`,
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
                  changeCurrentActivePage={props.changeCurrentActivePage}
                  currentlyActivePage={props.currentlyActivePage}
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
                  path={song.path}
                  songId={song.songId}
                  changeCurrentActivePage={props.changeCurrentActivePage}
                  currentlyActivePage={props.currentlyActivePage}
                  artworkPath={song.artworkPath}
                  currentSongData={props.currentSongData}
                  playSong={props.playSong}
                  updateContextMenuData={props.updateContextMenuData}
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
