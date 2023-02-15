/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Img from '../Img';
import SongArtist from '../SongsPage/SongArtist';
import DefaultSongCover from '../../../../assets/images/png/song_cover_default.png';

const CurrentlyPlayingSongInfoContainer = () => {
  const { currentSongData, currentlyActivePage, userData } =
    React.useContext(AppContext);
  const { changeCurrentActivePage, updateContextMenuData } =
    React.useContext(AppUpdateContext);

  const songArtistsImages = React.useMemo(
    () =>
      navigator.onLine && currentSongData.songId
        ? currentSongData.artists
          ? Array.isArray(currentSongData.artists) &&
            (currentSongData.artists.length > 0
              ? currentSongData.artists
                  .filter(
                    (artist, index) => artist.onlineArtworkPaths && index < 2
                  )
                  .map((artist, index) => (
                    <Img
                      src={
                        navigator.onLine && artist.onlineArtworkPaths
                          ? artist.onlineArtworkPaths?.picture_small
                          : artist.artworkPath
                      }
                      key={artist.artistId}
                      className={`relative aspect-square w-6 rounded-full border-2 border-background-color-1 dark:border-dark-background-color-1 ${
                        index === 0 ? 'z-2' : '-translate-x-2'
                      }`}
                      onClick={() => {
                        if (
                          currentSongData.artists &&
                          currentlyActivePage.pageTitle === 'ArtistInfo' &&
                          currentlyActivePage.data.artistName === artist.name
                        )
                          return changeCurrentActivePage('Home');

                        return changeCurrentActivePage('ArtistInfo', {
                          artistName: artist.name,
                          artistId: artist.artistId,
                        });
                      }}
                      alt=""
                    />
                  ))
              : false)
          : false
        : false,
    [
      currentlyActivePage,
      changeCurrentActivePage,
      currentSongData.artists,
      currentSongData.songId,
    ]
  );

  const showSongInfoPage = () =>
    currentSongData.isKnownSource
      ? currentlyActivePage.pageTitle === 'SongInfo' &&
        currentlyActivePage.data &&
        currentlyActivePage.data.songInfo &&
        currentlyActivePage.data.songInfo.songId === currentSongData.songId
        ? changeCurrentActivePage('Home')
        : changeCurrentActivePage('SongInfo', {
            songId: currentSongData.songId,
          })
      : undefined;

  const songArtists = React.useMemo(() => {
    if (currentSongData.songId && Array.isArray(currentSongData.artists)) {
      if (currentSongData.artists.length > 0) {
        return currentSongData.artists.map((artist, index) => (
          <span className="flex" key={index}>
            <SongArtist
              key={index}
              artistId={artist.artistId}
              name={artist.name}
              isFromKnownSource={currentSongData.isKnownSource}
            />
            {currentSongData.artists &&
            currentSongData.artists.length - 1 !== index ? (
              <span className="mr-1">,</span>
            ) : (
              ''
            )}
          </span>
        ));
      }
      return 'Unknown Artist';
    }
    return '';
  }, [
    currentSongData.artists,
    currentSongData.songId,
    currentSongData.isKnownSource,
  ]);

  return (
    <div className="current-playing-song-info-container relative flex w-[30%] content-center items-center">
      <div
        className={`song-cover-container relative mr-2 flex h-full w-[25%] items-center justify-center overflow-hidden p-2 lg:hidden 
             
             `}
        id="currentSongCover"
      >
        {/* ${
               !currentSongData.artworkPath &&
               `before:absolute before:h-[85%] before:w-[85%] before:rounded-md before:bg-background-color-2 before:bg-dark-background-color-2 before:content-[''] after:absolute after:h-5 after:w-5 after:animate-spin-ease after:rounded-full after:border-2 after:border-[transparent] after:border-t-font-color-black after:content-[''] dark:after:border-t-font-color-white`
             } */}
        {/* {currentSongData.artworkPath && ( */}
        <Img
          className="max-w-full rounded-lg object-cover shadow-xl"
          src={currentSongData.artworkPath || DefaultSongCover}
          alt="Default song cover"
          onContextMenu={(e) => {
            e.stopPropagation();
            if (currentSongData.isKnownSource) {
              updateContextMenuData(
                true,
                [
                  {
                    label: 'Info',
                    iconName: 'info',
                    handlerFunction: showSongInfoPage,
                  },
                  {
                    label: 'Edit song tags',
                    class: 'edit',
                    iconName: 'edit',
                    handlerFunction: () =>
                      changeCurrentActivePage('SongTagsEditor', {
                        songId: currentSongData?.songId,
                        songArtworkPath: currentSongData?.artworkPath,
                        songPath: currentSongData?.path,
                      }),
                  },
                ],
                e.pageX,
                e.pageY
              );
            }
          }}
        />
        {/* )} */}
      </div>
      <div className="song-info-container flex h-full w-[65%] flex-col items-start justify-center drop-shadow-lg lg:ml-4 lg:w-full">
        {currentSongData.title && (
          <div
            className="song-title flex w-full items-center"
            id="currentSongTitle"
            title={currentSongData.title}
            onClick={showSongInfoPage}
            onContextMenu={(e) => {
              e.stopPropagation();
              if (currentSongData.isKnownSource) {
                updateContextMenuData(
                  true,
                  [
                    {
                      label: 'Info',
                      iconName: 'info',
                      handlerFunction: showSongInfoPage,
                    },
                    {
                      label: 'Edit song tags',
                      class: 'edit',
                      iconName: 'edit',
                      handlerFunction: () =>
                        changeCurrentActivePage('SongTagsEditor', {
                          songId: currentSongData?.songId,
                          songArtworkPath: currentSongData?.artworkPath,
                          songPath: currentSongData?.path,
                        }),
                    },
                  ],
                  e.pageX,
                  e.pageY
                );
              }
            }}
          >
            <span
              className={`w-fit max-w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-medium ${
                currentSongData.isKnownSource && 'hover:underline'
              }`}
            >
              {currentSongData.title}
            </span>
            {!currentSongData.isKnownSource && (
              <span
                className="material-icons-round-outlined ml-2 cursor-pointer text-xl font-light text-font-color-highlight hover:underline dark:text-dark-font-color-highlight"
                title="You are playing from an unknown source. Some features are disabled."
              >
                error
              </span>
            )}
          </div>
        )}
        <div
          className="song-artists flex w-full items-center overflow-hidden text-ellipsis whitespace-nowrap"
          id="currentSongArtists"
        >
          {userData &&
            userData.preferences.showArtistArtworkNearSongControls &&
            songArtistsImages &&
            songArtistsImages.length > 0 && (
              <span className="relative mr-2 flex min-w-[1.5rem] items-center lg:hidden">
                {songArtistsImages}
              </span>
            )}
          <span className="flex w-3/4 text-xs text-font-color-black/90 dark:text-font-color-white/90">
            {songArtists}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CurrentlyPlayingSongInfoContainer;
