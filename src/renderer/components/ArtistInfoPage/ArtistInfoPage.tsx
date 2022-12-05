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
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import calculateTimeFromSeconds from 'renderer/utils/calculateTimeFromSeconds';
import DefaultArtistCover from '../../../../assets/images/png/artist_cover_default.png';
import { Album } from '../AlbumsPage/Album';
import { Song } from '../SongsPage/Song';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Hyperlink from '../Hyperlink';
import Img from '../Img';

export default () => {
  const {
    currentlyActivePage,
    queue,
    userData,
    isDarkMode,
    bodyBackgroundImage,
  } = useContext(AppContext);
  const {
    createQueue,
    updateQueueData,
    addNewNotifications,
    updateBodyBackgroundImage,
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
            if (res[0].onlineArtworkPaths?.picture_medium)
              updateBodyBackgroundImage(
                true,
                res[0].onlineArtworkPaths?.picture_medium
              );
            setArtistData(res[0]);
          }
        });
    }
  }, [currentlyActivePage.data, updateBodyBackgroundImage]);

  const fetchArtistArtworks = React.useCallback(() => {
    if (artistData.artistId && navigator.onLine) {
      window.api
        .getArtistArtworks(artistData.artistId)
        .then((x) => {
          if (x)
            setArtistData((prevData) => {
              return {
                ...prevData,
                artworkPaths: {
                  isDefaultArtwork: false,
                  artworkPath:
                    x.artistArtworks?.picture_medium ||
                    prevData.artworkPaths.artworkPath,
                  optimizedArtworkPath:
                    x.artistArtworks?.picture_medium ||
                    prevData.artworkPaths.optimizedArtworkPath,
                },
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
    const manageArtistDataUpdatesInArtistInfoPage = (e: Event) => {
      const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
      if ('detail' in e) {
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'artists') fetchArtistsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageArtistDataUpdatesInArtistInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageArtistDataUpdatesInArtistInfoPage
      );
    };
  }, [fetchArtistsData]);

  React.useEffect(() => {
    fetchArtistArtworks();
    const manageArtistArtworkUpdatesInArtistInfoPage = (e: Event) => {
      const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
      if ('detail' in e) {
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'artists/artworks') fetchArtistArtworks();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageArtistArtworkUpdatesInArtistInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageArtistArtworkUpdatesInArtistInfoPage
      );
    };
  }, [fetchArtistArtworks]);

  React.useEffect(() => {
    fetchSongsData();
    const manageSongDataUpdatesInArtistInfoPage = (e: Event) => {
      const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
      if ('detail' in e) {
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'albums/newAlbum') fetchSongsData();
          if (event.dataType === 'albums/deletedAlbum') fetchSongsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageSongDataUpdatesInArtistInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongDataUpdatesInArtistInfoPage
      );
    };
  }, [fetchSongsData]);

  React.useEffect(() => {
    fetchAlbumsData();
    const manageAlbumDataUpdatesInArtistInfoPage = (e: Event) => {
      const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
      if ('detail' in e) {
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'albums/newAlbum') fetchAlbumsData();
          if (event.dataType === 'albums/deletedAlbum') fetchAlbumsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageAlbumDataUpdatesInArtistInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageAlbumDataUpdatesInArtistInfoPage
      );
    };
  }, [fetchAlbumsData]);

  const calculateTotalTime = React.useCallback(() => {
    const { hours, minutes, seconds } = calculateTimeFromSeconds(
      songs.reduce((prev, current) => prev + current.duration, 0)
    );
    return `${
      hours >= 1 ? `${hours} hour${hours === 1 ? '' : 's'} ` : ''
    }${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${
      seconds === 1 ? '' : 's'
    }`;
  }, [songs]);

  const sanitizeArtistBio = React.useCallback(() => {
    if (artistData.artistBio) {
      const x = artistData.artistBio.match(/<a .*<\/a>/gm);
      const y = x ? x[0].match(/".*"/gm) : [''];
      const link = y ? y[0].replace(/"/gm, '') : '';
      return (
        <>
          <span className="artist-bio z-10">
            {artistData.artistBio.replace(/<a .*<\/a>/gm, '')}
          </span>
          <Hyperlink
            label="Read more..."
            linkTitle={`Read more about '${artistData.name}'`}
            link={link}
          />
        </>
      );
    }
    return '';
  }, [artistData]);

  const albumComponents = React.useMemo(
    () =>
      albums.map((album, index) => {
        return (
          <Album
            index={index}
            albumId={album.albumId}
            artists={album.artists}
            artworkPaths={album.artworkPaths}
            songs={album.songs}
            title={album.title}
            year={album.year}
            key={index}
            className={
              bodyBackgroundImage
                ? '[&_:not(.icon)]:!text-font-color-white'
                : ''
            }
          />
        );
      }),
    [albums, bodyBackgroundImage]
  );

  const songComponenets = React.useMemo(
    () =>
      songs.map((song, index) => {
        return (
          <Song
            key={song.songId}
            index={index}
            isIndexingSongs={
              userData !== undefined && userData.preferences.songIndexing
            }
            title={song.title}
            artists={song.artists}
            duration={song.duration}
            songId={song.songId}
            artworkPaths={song.artworkPaths}
            path={song.path}
            isAFavorite={song.isAFavorite}
          />
        );
      }),
    [songs, userData]
  );

  return (
    <MainContainer
      noDefaultStyles
      className="artist-info-page-container relative overflow-hidden rounded-tl-lg bg-cover bg-no-repeat pt-8 pb-2 pl-2 pr-2"
      // style={
      //   artistData.artistPalette && {
      //     background: `linear-gradient(180deg, ${`rgb(${artistData.artistPalette.LightMuted.rgb[0]},${artistData.artistPalette.LightMuted.rgb[1]},${artistData.artistPalette.LightMuted.rgb[2]})`} 0%, var(--background-color-1) 90%)`,
      //   }
      // }
    >
      <>
        {/* <div className="artist-info-page-background absolute top-0 left-0 !z-0 h-full w-full">
          <Img
            src={artistData.onlineArtworkPaths?.picture_medium}
            className="!z-0 h-full w-full object-cover blur-md brightness-75 transition-[filter] dark:blur-lg  dark:brightness-[0.5]"
            alt=""
          />
        </div> */}
        <div className="artist-img-and-info-container relative mb-12 flex flex-row items-center pl-8 [&>*]:z-10">
          <div className="artist-img-container mr-10 max-h-60 lg:hidden">
            <Img
              src={artistData?.artworkPaths?.artworkPath || DefaultArtistCover}
              className="aspect-square max-h-60 rounded-full"
              alt="Album Cover"
            />
          </div>
          <div
            className={`artist-info-container relative ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } [&>*]:z-10`}
          >
            <div
              className="artist-name mb-2 text-5xl text-background-color-3 dark:text-background-color-3"
              style={
                artistData.artistPalette?.LightVibrant && {
                  color: `${
                    isDarkMode
                      ? `rgb(${artistData.artistPalette?.LightVibrant.rgb[0]},${artistData.artistPalette?.LightVibrant.rgb[1]},${artistData.artistPalette?.LightVibrant.rgb[2]})`
                      : `rgb(${artistData.artistPalette?.LightVibrant.rgb[0]},${artistData.artistPalette?.LightVibrant.rgb[1]},${artistData.artistPalette?.LightVibrant.rgb[2]})`
                  }`,
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
            <div className="artist-like-btn-container">
              <span
                className={`material-icons-round${
                  !artistData.isAFavorite ? '-outlined' : ''
                } mr-2 cursor-pointer !text-xl`}
                onClick={() =>
                  window.api
                    .toggleLikeArtist(
                      artistData.artistId,
                      !artistData.isAFavorite
                    )
                    .then(
                      (res) =>
                        res &&
                        setArtistData((prevData) => ({
                          ...prevData,
                          isAFavorite: !prevData.isAFavorite,
                        }))
                    )
                    .catch((err) => console.error(err))
                }
                role="button"
                tabIndex={0}
              >
                favorite
              </span>
              {/* {artistData.isAFavorite ? 'Unlike' : 'Like'} */}
            </div>
            {artistData.songs && artistData.songs.length > 0 && (
              <div className="artist-buttons mt-8 flex">
                <Button
                  label="Play All"
                  iconName="play_arrow"
                  className={
                    bodyBackgroundImage
                      ? '!text-font-color-white'
                      : 'text-font-color-black dark:text-font-color-white'
                  }
                  clickHandler={() =>
                    createQueue(
                      artistData.songs.map((song) => song.songId),
                      'artist',
                      false,
                      artistData.artistId,
                      true
                    )
                  }
                />
                <Button
                  label="Shuffle and Play"
                  iconName="shuffle"
                  className={
                    bodyBackgroundImage
                      ? '!text-font-color-white'
                      : 'text-font-color-black dark:text-font-color-white'
                  }
                  clickHandler={() =>
                    createQueue(
                      artistData.songs.map((song) => song.songId),
                      'artist',
                      true,
                      artistData.artistId,
                      true
                    )
                  }
                />
                <Button
                  label="Add to Queue"
                  iconName="add"
                  className={
                    bodyBackgroundImage
                      ? '!text-font-color-white'
                      : 'text-font-color-black dark:text-font-color-white'
                  }
                  clickHandler={() => {
                    updateQueueData(
                      undefined,
                      [...queue.queue, ...songs.map((song) => song.songId)],
                      false,
                      false
                    );
                    addNewNotifications([
                      {
                        id: 'addSongsToQueue',
                        delay: 5000,
                        content: (
                          <span>
                            Added {songs.length} song
                            {songs.length === 1 ? '' : 's'} to the queue.
                          </span>
                        ),
                      },
                    ]);
                  }}
                />
              </div>
            )}
          </div>
        </div>
        {albums && albums.length > 0 && (
          <MainContainer className="main-container albums-list-container relative [&>*]:z-10">
            <>
              <div
                className={`title-container ${
                  bodyBackgroundImage
                    ? 'text-font-color-white'
                    : 'text-font-color-black dark:text-font-color-white'
                } mt-1 mb-4
                  text-2xl`}
              >
                Appears On Albums
              </div>
              <div className="albums-container flex flex-wrap">
                {albumComponents}
              </div>
            </>
          </MainContainer>
        )}
        {songs && songs.length > 0 && (
          <MainContainer className="main-container songs-list-container h-fut relative pb-4 [&>*]:z-10">
            <>
              <div
                className={`title-container ${
                  bodyBackgroundImage
                    ? 'text-font-color-white'
                    : 'text-font-color-black dark:text-font-color-white'
                } mt-1 mb-4
                  text-2xl`}
              >
                Appears on songs
              </div>
              <div className="songs-container">{songComponenets}</div>
            </>
          </MainContainer>
        )}
        {artistData.artistBio && (
          <div
            className={`"artist-bio-container relative z-10 m-4 rounded-lg p-4 text-font-color-black  dark:text-font-color-white ${
              bodyBackgroundImage
                ? `bg-background-color-2/70 backdrop-blur-md dark:bg-dark-background-color-2/70`
                : `bg-background-color-2 dark:bg-dark-background-color-2`
            }`}
          >
            {sanitizeArtistBio()}
          </div>
        )}
      </>
    </MainContainer>
  );
};
