/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import Img from '../Img';
import SongArtist from '../SongsPage/SongArtist';

import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';
import Button from '../Button';
import AddSongsToPlaylists from '../SongsPage/AddSongsToPlaylists';
import BlacklistSongConfrimPrompt from '../SongsPage/BlacklistSongConfirmPrompt';
import DeleteSongsFromSystemConfrimPrompt from '../SongsPage/DeleteSongsFromSystemConfrimPrompt';

const CurrentlyPlayingSongInfoContainer = () => {
  const { currentSongData, queue, localStorageData } =
    React.useContext(AppContext);
  const {
    changeCurrentActivePage,
    updateContextMenuData,
    changePromptMenuData,
    toggleMultipleSelections,
    addNewNotifications,
  } = React.useContext(AppUpdateContext);

  const [upNextSongData, setUpNextSongData] = React.useState<SongData>();
  const upNextSongDataCache = React.useRef<SongData>();

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let timeIntervalId: NodeJS.Timeout;
    if (queue.queue.length > 1 && queue.currentSongIndex) {
      setUpNextSongData(undefined);
      const nextSongIndex = queue.queue[queue.currentSongIndex + 1];

      if (nextSongIndex) {
        timeoutId = setTimeout(
          () =>
            window.api
              .getSongInfo([nextSongIndex])
              .then((res) => {
                if (res && res[0]) {
                  const [nextSongData] = res;
                  upNextSongDataCache.current = nextSongData;
                  // setUpNextSongData(upNextSongDataCache.current);

                  timeIntervalId = setInterval(() => {
                    setUpNextSongData(upNextSongDataCache.current);
                    setTimeout(() => setUpNextSongData(undefined), 10000);
                  }, 40000);
                }

                return undefined;
              })
              .catch((err) => console.error(err)),
          5000
        );
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (timeIntervalId) clearInterval(timeIntervalId);
    };
  }, [queue.currentSongIndex, queue.queue]);

  const songArtistsImages = React.useMemo(() => {
    if (
      currentSongData.songId &&
      Array.isArray(currentSongData.artists) &&
      currentSongData.artists.length > 0
    )
      return currentSongData.artists
        .filter((artist, index) => artist.onlineArtworkPaths && index < 2)
        .map((artist, index) => (
          <Img
            src={artist.onlineArtworkPaths?.picture_small}
            fallbackSrc={artist.artworkPath}
            key={artist.artistId}
            className={`absolute aspect-square w-6 rounded-full border-2 border-background-color-1 dark:border-dark-background-color-1 ${
              index === 0 ? 'z-2' : 'translate-x-4'
            }`}
            onClick={() => {
              changeCurrentActivePage('ArtistInfo', {
                artistName: artist.name,
                artistId: artist.artistId,
              });
            }}
            alt=""
          />
        ));
    return undefined;
  }, [
    changeCurrentActivePage,
    currentSongData.artists,
    currentSongData.songId,
  ]);

  const showSongInfoPage = React.useCallback(
    (songId: string) =>
      currentSongData.isKnownSource
        ? changeCurrentActivePage('SongInfo', {
            songId,
          })
        : undefined,
    [changeCurrentActivePage, currentSongData.isKnownSource]
  );

  const gotToSongAlbumPage = React.useCallback(
    () =>
      currentSongData.isKnownSource && currentSongData.album
        ? changeCurrentActivePage('AlbumInfo', {
            albumId: currentSongData.album.albumId,
          })
        : undefined,
    [
      changeCurrentActivePage,
      currentSongData.album,
      currentSongData.isKnownSource,
    ]
  );

  const songArtists = React.useMemo(() => {
    if (currentSongData.songId && Array.isArray(currentSongData.artists)) {
      if (currentSongData.artists.length > 0) {
        return currentSongData.artists
          .map((artist, i) => {
            const arr = [
              <SongArtist
                key={artist.artistId}
                artistId={artist.artistId}
                name={artist.name}
                isFromKnownSource={currentSongData.isKnownSource}
              />,
            ];

            if ((currentSongData.artists?.length ?? 1) - 1 !== i)
              arr.push(<span className="mr-1">,</span>);

            return arr;
          })
          .flat();
      }
      return <span>Unknown Artist</span>;
    }
    return '';
  }, [
    currentSongData.artists,
    currentSongData.songId,
    currentSongData.isKnownSource,
  ]);

  const contextMenuCurrentSongData =
    React.useMemo((): ContextMenuAdditionalData => {
      const { title, artworkPath, artists } = currentSongData;
      return {
        title,
        artworkPath: artworkPath ?? DefaultSongCover,
        subTitle:
          artists?.map((artist) => artist.name).join(', ') || 'Unknown artist',
        // subTitle2: album?.name,
      };
    }, [currentSongData]);

  const contextMenuItems = React.useMemo((): ContextMenuItem[] => {
    const {
      title,
      songId,
      album,
      artworkPath,
      isBlacklisted,
      isKnownSource,
      path,
    } = currentSongData;

    return [
      {
        label: 'Add to Playlists',
        iconName: 'playlist_add',
        handlerFunction: () => {
          changePromptMenuData(
            true,
            <AddSongsToPlaylists songIds={[songId]} title={title} />
          );
          toggleMultipleSelections(false);
        },
      },
      {
        label: 'Hr',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true,
      },
      {
        label: 'Reveal in File Explorer',
        class: 'reveal-file-explorer',
        iconName: 'folder_open',
        handlerFunction: () => window.api.revealSongInFileExplorer(songId),
      },
      {
        label: 'Info',
        iconName: 'info',
        handlerFunction: () => showSongInfoPage(songId),
        isDisabled: !isKnownSource,
      },
      {
        label: 'Go to Album',
        iconName: 'album',
        handlerFunction: gotToSongAlbumPage,
        isDisabled: !isKnownSource || !album,
      },
      {
        label: 'Edit song tags',
        class: 'edit',
        iconName: 'edit',
        handlerFunction: () =>
          changeCurrentActivePage('SongTagsEditor', {
            songId,
            songArtworkPath: artworkPath,
            songPath: path,
            isKnownSource,
          }),
      },
      {
        label: 'Hr',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true,
      },
      {
        label: isBlacklisted ? 'Restore from Blacklist' : 'Blacklist Song',
        iconName: isBlacklisted ? 'settings_backup_restore' : 'block',
        handlerFunction: () => {
          if (isBlacklisted)
            window.api
              .restoreBlacklistedSongs([songId])
              .catch((err) => console.error(err));
          else if (localStorageData?.preferences.doNotShowBlacklistSongConfirm)
            window.api
              .blacklistSongs([songId])
              .then(() =>
                addNewNotifications([
                  {
                    id: `${title}Blacklisted`,
                    delay: 5000,
                    content: <span>&apos;{title}&apos; blacklisted.</span>,
                    icon: <span className="material-icons-round">block</span>,
                  },
                ])
              )
              .catch((err) => console.error(err));
          else
            changePromptMenuData(
              true,
              <BlacklistSongConfrimPrompt title={title} songIds={[songId]} />
            );
          return toggleMultipleSelections(false);
        },
      },
      {
        label: 'Delete from System',
        iconName: 'delete',
        handlerFunction: () => {
          changePromptMenuData(
            true,
            <DeleteSongsFromSystemConfrimPrompt songIds={[songId]} />
          );
          toggleMultipleSelections(false);
        },
      },
    ];
  }, [
    addNewNotifications,
    changeCurrentActivePage,
    changePromptMenuData,
    currentSongData,
    gotToSongAlbumPage,
    localStorageData?.preferences.doNotShowBlacklistSongConfirm,
    showSongInfoPage,
    toggleMultipleSelections,
  ]);

  return (
    <div className="current-playing-song-info-container grid w-full max-w-full grid-cols-[6rem_minmax(0,1fr)] items-center gap-2 lg:grid-cols-[minmax(0,1fr)]">
      <div
        className="song-cover-container relativeflex aspect-square h-full items-center justify-center overflow-hidden p-2 lg:hidden"
        id="currentSongCover"
      >
        {/* ${
               !currentSongData.artworkPath &&
               `before:absolute before:h-[85%] before:w-[85%] before:rounded-md before:bg-background-color-2 before:bg-dark-background-color-2 before:content-[''] after:absolute after:h-5 after:w-5 after:animate-spin-ease after:rounded-full after:border-2 after:border-[transparent] after:border-t-font-color-black after:content-[''] dark:after:border-t-font-color-white`
             } */}
        <Img
          className="h-full max-w-full rounded-lg object-fill shadow-xl"
          src={currentSongData.artworkPath}
          fallbackSrc={DefaultSongCover}
          alt="Default song cover"
          onContextMenu={(e) => {
            e.stopPropagation();
            updateContextMenuData(
              true,
              contextMenuItems,
              e.pageX,
              e.pageY,
              contextMenuCurrentSongData
            );
          }}
        />
      </div>
      <div className="song-info-container relative flex h-full w-full flex-col items-start justify-center drop-shadow-lg lg:ml-4 lg:w-full">
        {currentSongData.title && (
          <div className="song-title flex w-full items-center">
            <div
              className={`w-fit max-w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-medium outline-1 outline-offset-1 focus-visible:!outline ${
                currentSongData.isKnownSource && 'hover:underline'
              }`}
              id="currentSongTitle"
              title={currentSongData.title}
              onClick={() => showSongInfoPage(currentSongData.songId)}
              onKeyDown={(e) =>
                e.key === 'Enter' && showSongInfoPage(currentSongData.songId)
              }
              onContextMenu={(e) => {
                e.stopPropagation();
                updateContextMenuData(
                  true,
                  contextMenuItems,
                  e.pageX,
                  e.pageY,
                  contextMenuCurrentSongData
                );
              }}
              tabIndex={0}
            >
              {currentSongData.title}
            </div>
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
        {!upNextSongData && (
          <div
            className="song-artists appear-from-bottom flex w-full items-center truncate"
            id="currentSongArtists"
          >
            {localStorageData?.preferences.showArtistArtworkNearSongControls &&
              songArtistsImages &&
              songArtistsImages.length > 0 && (
                <span
                  className={`relative mr-2 flex h-6 items-center lg:hidden ${
                    songArtistsImages.length === 1 ? 'w-6' : 'w-10'
                  } `}
                >
                  {songArtistsImages}
                </span>
              )}
            <span className="w-3/4 grow-0 text-xs text-font-color-black/90 dark:text-font-color-white/90">
              {songArtists}
            </span>
          </div>
        )}
        {upNextSongData && (
          <div className="next-song appear-from-bottom group/nextSong relative flex max-w-full items-center rounded-full bg-background-color-2 px-3 py-1 text-xs dark:bg-dark-background-color-2">
            <p className="truncate">
              <span className="font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
                Up Next
              </span>{' '}
              <span
                className="cursor-pointer outline-1 outline-offset-1 hover:underline focus-visible:!outline"
                onClick={() => showSongInfoPage(upNextSongData.songId)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && showSongInfoPage(upNextSongData.songId)
                }
              >
                {upNextSongData.title}
              </span>
              {upNextSongData.artists && upNextSongData.artists.length > 0 && (
                <>
                  {' '}
                  <span className="font-light text-font-color-highlight dark:text-dark-font-color-highlight">
                    by
                  </span>{' '}
                  <span
                    className="cursor-pointer outline-1 outline-offset-1 hover:underline focus-visible:!outline"
                    onClick={() =>
                      upNextSongData?.artists![0] &&
                      changeCurrentActivePage('ArtistInfo', {
                        artistId: upNextSongData.artists[0].artistId,
                      })
                    }
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      upNextSongData?.artists![0] &&
                      changeCurrentActivePage('ArtistInfo', {
                        artistId: upNextSongData.artists[0].artistId,
                      })
                    }
                  >
                    {upNextSongData.artists[0].name}
                  </span>
                  {upNextSongData.artists.length - 1 > 0 && (
                    <span className="opacity-80">
                      {' '}
                      +{upNextSongData.artists.length - 1}
                    </span>
                  )}
                </>
              )}
            </p>
            <Button
              iconName="close"
              tooltipLabel="Close Up Next"
              className="!m-0 !hidden !border-none !py-0 !pl-1 !pr-0 !text-base !text-font-color-highlight outline-1 outline-offset-1 focus-visible:!outline group-hover/nextSong:!flex dark:!text-dark-font-color-highlight"
              clickHandler={() => setUpNextSongData(undefined)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentlyPlayingSongInfoContainer;
