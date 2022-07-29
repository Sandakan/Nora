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
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import { calculateTime } from 'renderer/utils/calculateTime';
import DefaultArtistCover from '../../../../assets/images/default_artist_cover.png';
import { Album } from '../AlbumsPage/Album';
import { Song } from '../SongsPage/Song';
import Button from '../Button';
import MainContainer from '../MainContainer';
import OpenLinkConfirmPrompt from '../OpenLinkConfirmPrompt';

export default () => {
  const { currentlyActivePage, queue, userData } = useContext(AppContext);
  const {
    createQueue,
    updateQueueData,
    updateNotificationPanelData,
    changePromptMenuData,
  } = React.useContext(AppUpdateContext);
  const [artistData, setArtistData] = React.useState({} as ArtistInfo);
  const [albums, setAlbums] = React.useState([] as Album[]);
  const [songs, setSongs] = React.useState([] as SongData[]);

  const fetchArtistsData = React.useCallback(() => {
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

  const fetchArtistArtworks = React.useCallback(() => {
    if (artistData.artistId && navigator.onLine) {
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
    }
  }, [artistData.artistId]);

  const fetchSongsData = React.useCallback(() => {
    if (artistData.songs && artistData.songs.length > 0) {
      window.api
        .getSongInfo(artistData.songs.map((song) => song.songId))
        .then((songsData) => {
          if (songsData && songsData.length > 0) setSongs(songsData);
        });
    }
  }, [artistData.songs]);

  const fetchAlbumsData = React.useCallback(() => {
    if (artistData.albums && artistData.albums.length > 0) {
      window.api
        .getAlbumData(artistData.albums.map((album) => album.albumId))
        .then((res) => {
          if (res && res.length > 0) setAlbums(res);
        });
    }
  }, [artistData.albums]);

  React.useEffect(() => {
    fetchArtistsData();
    const manageArtistDataUpdates = (
      _: unknown,
      eventType: DataUpdateEventTypes
    ) => {
      if (eventType === 'artists') fetchArtistsData();
    };
    window.api.dataUpdateEvent(manageArtistDataUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageArtistDataUpdates);
    };
  }, [fetchArtistsData]);

  React.useEffect(() => {
    fetchArtistArtworks();
    const manageArtistArtworkUpdates = (
      _: unknown,
      eventType: DataUpdateEventTypes
    ) => {
      if (eventType === 'artists/artworks') fetchArtistArtworks();
    };
    window.api.dataUpdateEvent(manageArtistArtworkUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageArtistArtworkUpdates);
    };
  }, [fetchArtistArtworks]);

  React.useEffect(() => {
    fetchSongsData();
    const manageSongDataUpdates = (
      _: unknown,
      eventType: DataUpdateEventTypes
    ) => {
      if (eventType === 'songs') fetchSongsData();
    };
    window.api.dataUpdateEvent(manageSongDataUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageSongDataUpdates);
    };
  }, [fetchSongsData]);

  React.useEffect(() => {
    fetchAlbumsData();
    const manageAlbumDataUpdates = (
      _: unknown,
      eventType: DataUpdateEventTypes
    ) => {
      if (eventType === 'albums') fetchAlbumsData();
    };
    window.api.dataUpdateEvent(manageAlbumDataUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageAlbumDataUpdates);
    };
  }, [fetchAlbumsData]);

  const calculateTotalTime = React.useCallback(() => {
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
  }, [songs]);

  const sanitizeArtistBio = React.useCallback(() => {
    if (artistData.artistBio) {
      const x = artistData.artistBio.match(/<a .*<\/a>/gm);
      const y = x ? x[0].match(/".*"/gm) : [''];
      const link = y ? y[0].replace(/"/gm, '') : '';
      return (
        <>
          {artistData.artistBio.replace(/<a .*<\/a>/gm, '')}
          <span
            className="link hover:underline cursor-pointer"
            onClick={() =>
              userData?.preferences.doNotVerifyWhenOpeningLinks
                ? window.api.openInBrowser(
                    `https://github.com/Sandakan/Oto-Music-for-Desktop`
                  )
                : changePromptMenuData(
                    true,
                    <OpenLinkConfirmPrompt
                      link={link}
                      title={`Read more about '${artistData.name}'`}
                    />
                  )
            }
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
  }, [artistData, changePromptMenuData, userData]);

  const albumComponents = React.useMemo(
    () =>
      albums.map((album, index) => {
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
      }),
    [albums]
  );

  const songComponenets = React.useMemo(
    () =>
      songs.map((song, index) => {
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
            isAFavorite={song.isAFavorite}
          />
        );
      }),
    [songs]
  );

  return (
    <div
      className="artist-info-page-container bg-no-repeat bg-cover pt-8 pb-2 pl-2 pr-2 rounded-tl-lg"
      style={
        artistData.artistPalette && {
          background: `linear-gradient(180deg, ${`rgb(${artistData.artistPalette.LightMuted._rgb[0]},${artistData.artistPalette.LightMuted._rgb[1]},${artistData.artistPalette.LightMuted._rgb[2]})`} 0%, var(--background-color-1) 90%)`,
        }
      }
    >
      <div className="artist-img-and-info-container flex flex-row items-center pl-8 mb-12">
        <div className="artist-img-container mr-10">
          <img
            src={artistData.artworkPath}
            className="rounded-full"
            alt="Album Cover"
          />
        </div>
        <div className="artist-info-container text-font-color-black dark:text-font-color-white">
          <div
            className="artist-name text-5xl text-background-color-3 dark:text-background-color-3 mb-2"
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
            <div className="artist-buttons mt-8 flex">
              <Button
                label="Play All"
                iconName="play_arrow"
                className="!border-[hsla(0,0%,0%,0.3)] dark:!border-[hsla(0,0%,0%,0.3)] hover:!border-[hsla(0,0%,0%,0.6)] dark:hover:!border-[hsla(0,0%,0%,0.6)]"
                clickHandler={() =>
                  createQueue(
                    artistData.songs.map((song) => song.songId),
                    'songs',
                    false,
                    undefined,
                    true
                  )
                }
              />
              <Button
                label="Shuffle and Play"
                iconName="shuffle"
                className="!border-[hsla(0,0%,0%,0.3)] dark:!border-[hsla(0,0%,0%,0.3)] hover:!border-[hsla(0,0%,0%,0.6)] dark:hover:!border-[hsla(0,0%,0%,0.6)]"
                clickHandler={() =>
                  createQueue(
                    artistData.songs.map((song) => song.songId),
                    'songs',
                    true,
                    undefined,
                    true
                  )
                }
              />
              <Button
                label="Add to Queue"
                iconName="add"
                className="!border-[hsla(0,0%,0%,0.3)] dark:!border-[hsla(0,0%,0%,0.3)] hover:!border-[hsla(0,0%,0%,0.6)] dark:hover:!border-[hsla(0,0%,0%,0.6)]"
                clickHandler={() => {
                  updateQueueData(
                    undefined,
                    [...queue.queue, ...songs.map((song) => song.songId)],
                    false,
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
        <MainContainer className="main-container albums-list-container">
          <>
            <div className="title-container mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Appears On Albums
            </div>
            <div className="albums-container flex flex-wrap">
              {albumComponents}
            </div>
          </>
        </MainContainer>
      )}
      {songs && songs.length > 0 && (
        <MainContainer className="main-container songs-list-container h-fut pb-4">
          <>
            <div className="title-container mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Appears on songs
            </div>
            <div className="songs-container">{songComponenets}</div>
          </>
        </MainContainer>
      )}
      {artistData.artistBio && (
        <div className="artist-bio-container m-4 p-4 rounded-lg text-font-color-black dark:text-font-color-white bg-background-color-2 dark:bg-dark-background-color-2">
          {sanitizeArtistBio()}
        </div>
      )}
    </div>
  );
};
