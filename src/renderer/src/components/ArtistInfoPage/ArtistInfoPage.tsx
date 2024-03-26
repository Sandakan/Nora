/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { CSSProperties, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FixedSizeList as List, FixedSizeGrid as Grid } from 'react-window';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import calculateTimeFromSeconds from '../../utils/calculateTimeFromSeconds';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import useResizeObserver from '../../hooks/useResizeObserver';
import clamp from '../../utils/clamp';

import { Album } from '../AlbumsPage/Album';
import Song from '../SongsPage/Song';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Img from '../Img';
// import Dropdown from '../Dropdown';

import SeparateArtistsSuggestion from './SeparateArtistsSuggestion';
import DuplicateArtistsSuggestion from './DuplicateArtistsSuggestion';
import TitleContainer from '../TitleContainer';
import SimilarArtistsContainer from './SimilarArtistsContainer';
import Biography from '../Biography/Biography';
import { songSortOptions } from '../SongsPage/SongsPage';

const ArtistInfoPage = () => {
  const {
    currentlyActivePage,
    // queue,
    isDarkMode,
    bodyBackgroundImage,
    localStorageData,
    multipleSelectionsData,
    isMultipleSelectionEnabled
  } = useContext(AppContext);
  const {
    createQueue,
    updateBodyBackgroundImage,
    // updateQueueData,
    // addNewNotifications,
    // updateCurrentlyActivePageData,
    // changeCurrentActivePage,
    updateContextMenuData,
    toggleMultipleSelections,
    playSong
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [artistData, setArtistData] = React.useState<ArtistInfo>();
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [songs, setSongs] = React.useState<SongData[]>([]);
  const [isAllAlbumsVisible, setIsAllAlbumsVisible] = React.useState(false);
  const [isAllSongsVisible, setIsAllSongsVisible] = React.useState(false);
  const [sortingOrder, setSortingOrder] = React.useState<SongSortTypes>('aToZ');

  const songsContainerRef = React.useRef(null);
  const { width, height } = useResizeObserver(songsContainerRef);

  const CONTAINER_PADDING = 30;
  const relevantWidth = React.useMemo(() => width - CONTAINER_PADDING, [width]);

  const MIN_ITEM_WIDTH = 220;
  const MIN_ITEM_HEIGHT = 280;
  const noOfColumns = Math.floor(relevantWidth / MIN_ITEM_WIDTH);
  const noOfRows = Math.ceil(albums.length / noOfColumns);
  const itemWidth = MIN_ITEM_WIDTH + ((relevantWidth % MIN_ITEM_WIDTH) - 10) / noOfColumns;

  const noOfVisibleAlbums = React.useMemo(
    () => Math.floor(relevantWidth / 250) || 4,
    [relevantWidth]
  );

  const fetchArtistsData = React.useCallback(() => {
    if (currentlyActivePage?.data?.artistId) {
      window.api.artistsData
        .getArtistData([currentlyActivePage.data.artistId])
        .then((res) => {
          if (res && res.length > 0) {
            if (res[0].onlineArtworkPaths?.picture_medium)
              updateBodyBackgroundImage(true, res[0].onlineArtworkPaths?.picture_medium);
            setArtistData(res[0]);
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [currentlyActivePage.data, updateBodyBackgroundImage]);

  const fetchArtistArtworks = React.useCallback(() => {
    if (artistData?.artistId) {
      window.api.artistsData
        .getArtistArtworks(artistData.artistId)
        .then((x) => {
          if (x)
            setArtistData((prevData) => {
              if (prevData) {
                updateBodyBackgroundImage(true, x.artistArtworks?.picture_medium);
                return {
                  ...prevData,
                  onlineArtworkPaths: x.artistArtworks,
                  artistPalette: x.artistPalette || prevData.artistPalette,
                  artistBio: x.artistBio || prevData.artistBio,
                  similarArtists: x.similarArtists || prevData.similarArtists,
                  tags: x.tags
                };
              }
              return undefined;
            });
          return undefined;
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [artistData?.artistId, updateBodyBackgroundImage]);

  const fetchSongsData = React.useCallback(() => {
    if (artistData?.songs && artistData.songs.length > 0) {
      window.api.audioLibraryControls
        .getSongInfo(
          artistData.songs.map((song) => song.songId),
          sortingOrder
        )
        .then((songsData) => {
          if (songsData && songsData.length > 0) setSongs(songsData);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return setSongs([]);
  }, [artistData?.songs, sortingOrder]);

  const fetchAlbumsData = React.useCallback(() => {
    if (artistData?.albums && artistData.albums.length > 0) {
      window.api.albumsData
        .getAlbumData(artistData.albums.map((album) => album.albumId))
        .then((res) => {
          if (res && res.length > 0) setAlbums(res);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return setAlbums([]);
  }, [artistData?.albums]);

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
    document.addEventListener('app/dataUpdates', manageArtistDataUpdatesInArtistInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageArtistDataUpdatesInArtistInfoPage);
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
    document.addEventListener('app/dataUpdates', manageArtistArtworkUpdatesInArtistInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageArtistArtworkUpdatesInArtistInfoPage);
    };
  }, [fetchArtistArtworks]);

  React.useEffect(() => {
    fetchSongsData();
    const manageSongDataUpdatesInArtistInfoPage = (e: Event) => {
      const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
      if ('detail' in e) {
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
            fetchSongsData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageSongDataUpdatesInArtistInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageSongDataUpdatesInArtistInfoPage);
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
    document.addEventListener('app/dataUpdates', manageAlbumDataUpdatesInArtistInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageAlbumDataUpdatesInArtistInfoPage);
    };
  }, [fetchAlbumsData]);

  const artistSongsDuration = React.useMemo(
    () =>
      calculateTimeFromSeconds(songs.reduce((prev, current) => prev + current.duration, 0))
        .timeString,
    [songs]
  );

  const selectAllHandlerForAlbums = useSelectAllHandler(albums, 'album', 'albumId');

  const albumComponents = React.useMemo(
    () =>
      albums
        .filter((_, i) => i < noOfVisibleAlbums)
        .map((album, index) => {
          return (
            <Album
              index={index}
              key={album.albumId}
              albumId={album.albumId}
              artists={album.artists}
              artworkPaths={album.artworkPaths}
              songs={album.songs}
              title={album.title}
              year={album.year}
              className={bodyBackgroundImage ? '[&_:not(.icon)]:!text-font-color-white' : ''}
              selectAllHandler={selectAllHandlerForAlbums}
            />
          );
        }),
    [albums, bodyBackgroundImage, noOfVisibleAlbums, selectAllHandlerForAlbums]
  );

  const albumGridComponents = React.useCallback(
    (props: { columnIndex: number; rowIndex: number; style: CSSProperties }) => {
      const { columnIndex, rowIndex, style } = props;
      const index = rowIndex * noOfColumns + columnIndex;
      // eslint-disable-next-line no-console
      if (index < albums.length) {
        const { albumId, year, artists, title, songs: songsInfo, artworkPaths } = albums[index];
        return (
          <div style={{ ...style, display: 'flex', justifyContent: 'center' }}>
            <Album
              key={`${albumId}-${title}`}
              index={index}
              artworkPaths={artworkPaths}
              albumId={albumId}
              title={title}
              year={year}
              artists={artists}
              songs={songsInfo}
              selectAllHandler={selectAllHandlerForAlbums}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [albums, noOfColumns, selectAllHandlerForAlbums]
  );

  const selectAllHandlerForSongs = useSelectAllHandler(songs, 'songs', 'songId');

  const handleSongPlayBtnClick = React.useCallback(
    (currSongId: string) => {
      const queueSongIds = songs.filter((song) => !song.isBlacklisted).map((song) => song.songId);
      createQueue(queueSongIds, 'artist', false, artistData?.artistId, false);
      playSong(currSongId, true);
    },
    [artistData?.artistId, createQueue, playSong, songs]
  );

  const songComponenets = React.useMemo(
    () =>
      songs
        .filter((_, i) => i < 5)
        .map((song, index) => {
          return (
            <Song
              key={song.songId}
              index={index}
              isIndexingSongs={localStorageData?.preferences?.isSongIndexingEnabled}
              title={song.title}
              artists={song.artists}
              album={song.album}
              duration={song.duration}
              songId={song.songId}
              artworkPaths={song.artworkPaths}
              path={song.path}
              isAFavorite={song.isAFavorite}
              year={song.year}
              isBlacklisted={song.isBlacklisted}
              selectAllHandler={selectAllHandlerForSongs}
              onPlayClick={handleSongPlayBtnClick}
            />
          );
        }),
    [
      handleSongPlayBtnClick,
      localStorageData?.preferences?.isSongIndexingEnabled,
      selectAllHandlerForSongs,
      songs
    ]
  );

  const selectAllHandler = useSelectAllHandler(songs, 'songs', 'songId');

  const songListComponents = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const {
        songId,
        title,
        artists,
        album,
        duration,
        isAFavorite,
        artworkPaths,
        year,
        path,
        isBlacklisted
      } = songs[index];

      return (
        <div style={style}>
          <Song
            key={index}
            index={index}
            isIndexingSongs={localStorageData?.preferences.isSongIndexingEnabled}
            title={title}
            songId={songId}
            artists={artists}
            album={album}
            artworkPaths={artworkPaths}
            duration={duration}
            year={year}
            path={path}
            isAFavorite={isAFavorite}
            isBlacklisted={isBlacklisted}
            onPlayClick={handleSongPlayBtnClick}
            selectAllHandler={selectAllHandler}
          />
        </div>
      );
    },
    [
      handleSongPlayBtnClick,
      localStorageData?.preferences.isSongIndexingEnabled,
      selectAllHandler,
      songs
    ]
  );

  const fontColor = React.useMemo(() => {
    if (
      artistData?.artistPalette &&
      artistData.artistPalette?.LightMuted &&
      artistData.artistPalette?.LightVibrant
    ) {
      const { LightVibrant, LightMuted } = artistData.artistPalette;
      const [h, s, l] = isDarkMode ? LightVibrant.hsl : LightMuted.hsl;

      return `hsl(${h * 360} ${s * 100} ${l * 100})`;
    }
    return undefined;
  }, [artistData?.artistPalette, isDarkMode]);

  return (
    <MainContainer
      className="artist-info-page-container appear-from-bottom relative overflow-y-auto rounded-tl-lg pb-2 pl-2 pr-2 pt-8 [scrollbar-gutter:stable]"
      ref={songsContainerRef}
    >
      <div className="artist-img-and-info-container relative mb-12 flex flex-row items-center pl-8 [&>*]:z-10">
        <div className="artist-img-container relative mr-10 max-h-60 lg:hidden">
          <Img
            src={artistData?.onlineArtworkPaths?.picture_medium}
            fallbackSrc={artistData?.artworkPaths?.artworkPath}
            className="!aspect-square h-60 w-[15rem] rounded-full object-cover"
            loading="eager"
            alt="Album Cover"
            onContextMenu={(e) =>
              (artistData?.onlineArtworkPaths?.picture_xl ||
                artistData?.onlineArtworkPaths?.picture_medium) &&
              updateContextMenuData(
                true,
                [
                  {
                    label: t('common.saveArtwork'),
                    class: 'save',
                    iconName: 'image',
                    iconClassName: 'material-icons-round-outlined',
                    handlerFunction: () => {
                      const artworkPath =
                        artistData?.onlineArtworkPaths?.picture_xl ||
                        artistData?.onlineArtworkPaths?.picture_medium;

                      if (artworkPath)
                        window.api.songUpdates.saveArtworkToSystem(artworkPath, artistData.name);
                    }
                  }
                ],
                e.pageX,
                e.pageY
              )
            }
          />
          <Button
            className="absolute bottom-4 right-2 !m-0 flex rounded-full !border-0 bg-background-color-1 !p-3 shadow-xl outline-1 -outline-offset-[6px] focus-visible:!outline dark:bg-dark-background-color-2"
            tooltipLabel={t(
              `artistInfoPage.${artistData?.isAFavorite ? `dislikeArtist` : `likeArtist`}`,
              {
                name: artistData?.name
              }
            )}
            iconName="favorite"
            iconClassName={`!text-3xl !leading-none ${
              artistData?.isAFavorite
                ? 'material-icons-round text-font-color-crimson'
                : 'material-icons-round material-icons-round-outlined !font-medium text-font-color-black/60 dark:text-font-color-white/60'
            }`}
            clickHandler={() => {
              if (artistData)
                window.api.artistsData
                  .toggleLikeArtists([artistData.artistId], !artistData.isAFavorite)
                  .then(
                    (res) =>
                      res &&
                      setArtistData((prevData) =>
                        prevData
                          ? {
                              ...prevData,
                              isAFavorite: !prevData.isAFavorite
                            }
                          : undefined
                      )
                  )
                  .catch((err) => console.error(err));
            }}
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
            className="artist-name mb-2 text-5xl text-font-color-highlight dark:text-dark-font-color-highlight"
            style={
              fontColor
                ? {
                    color: fontColor
                  }
                : undefined
            }
          >
            {artistData?.name || t('common.unknownArtist')}
          </div>
          {artistData?.songs && (
            <div className="artist-no-of-songs">
              {t('common.albumWithCount', {
                count: artistData?.albums?.length || 0
              })}{' '}
              &bull; {t('common.songWithCount', { count: artistData.songs.length })}
            </div>
          )}
          {songs.length > 0 && (
            <div className="artist-total-songs-duration">{artistSongsDuration}</div>
          )}
        </div>
      </div>

      <SeparateArtistsSuggestion name={artistData?.name} artistId={artistData?.artistId} />

      <DuplicateArtistsSuggestion name={artistData?.name} artistId={artistData?.artistId} />

      {albums && albums.length > 0 && (
        <MainContainer
          className="main-container albums-list-container relative [&>*]:z-10"
          focusable
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'a') {
              e.stopPropagation();
              selectAllHandlerForAlbums();
            }
          }}
        >
          <>
            <TitleContainer
              title={t('artistInfoPage.appearsInAlbums')}
              titleClassName="!text-2xl text-font-color-black !font-normal dark:text-font-color-white"
              className={`title-container ${
                bodyBackgroundImage
                  ? 'text-font-color-white'
                  : 'text-font-color-black dark:text-font-color-white'
              } mb-4 mt-1
                  text-2xl`}
              otherItems={[
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'album' ? (
                  <p className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                    {t('common.selectionWithCount', {
                      count: multipleSelectionsData.multipleSelections.length
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-font-color-highlight dark:text-dark-font-color-highlight">
                    {t('common.albumWithCount', { count: albums.length })}{' '}
                    {albums.length > noOfVisibleAlbums &&
                      !isAllAlbumsVisible &&
                      t('common.shownWithCount', {
                        count: artistData?.albums?.length || 0
                      })}
                  </p>
                )
              ]}
              buttons={[
                {
                  label: t('common.showAll'),
                  iconName: 'apps',
                  className: 'show-all-btn text-sm font-normal',
                  clickHandler: () => setIsAllAlbumsVisible(true),
                  isVisible: albums.length > noOfVisibleAlbums && !isAllAlbumsVisible
                }
              ]}
            />
            <div className="albums-container flex flex-wrap overflow-x-hidden">
              {isAllAlbumsVisible ? (
                <Grid
                  className="appear-from-bottom delay-100"
                  columnCount={noOfColumns || 5}
                  columnWidth={itemWidth}
                  rowCount={noOfRows || 5}
                  rowHeight={MIN_ITEM_HEIGHT}
                  width={relevantWidth}
                  height={clamp(300, height || 0, 400)}
                  overscanRowCount={2}
                >
                  {albumGridComponents}
                </Grid>
              ) : (
                albumComponents
              )}
            </div>
          </>
        </MainContainer>
      )}
      {songs && songs.length > 0 && (
        <MainContainer
          className="main-container songs-list-container relative h-full pb-4 [&>*]:z-10"
          focusable
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'a') {
              e.stopPropagation();
              selectAllHandlerForSongs();
            }
          }}
        >
          <>
            <TitleContainer
              title={t('artistInfoPage.appearsInSongs')}
              titleClassName="!text-2xl text-font-color-black !font-normal dark:text-font-color-white"
              className={`title-container ${
                bodyBackgroundImage
                  ? 'text-font-color-white'
                  : 'text-font-color-black dark:text-font-color-white'
              } mb-4 mt-1 pr-4 text-2xl`}
              otherItems={[
                // eslint-disable-next-line react/jsx-key
                <p className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                  {isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'songs'
                    ? t('common.selectionWithCount', {
                        count: multipleSelectionsData.multipleSelections.length
                      })
                    : `${t('common.songWithCount', { count: songs.length })} ${
                        songs.length > 5 && !isAllSongsVisible
                          ? t('common.shownWithCount', { count: 5 })
                          : ''
                      }`}
                </p>
              ]}
              buttons={[
                {
                  tooltipLabel: t('common.moreOptions'),
                  className:
                    'more-options-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0 !bg-background-color-1/40 dark:!bg-dark-background-color-1/40',
                  iconName: 'more_horiz',
                  clickHandler: (e) => {
                    e.stopPropagation();
                    const button = e.currentTarget;
                    const { x, y } = button.getBoundingClientRect();
                    updateContextMenuData(
                      true,
                      [
                        {
                          label: t('common.shuffleAndPlay'),
                          iconName: 'shuffle',
                          handlerFunction: () =>
                            createQueue(
                              songs
                                .filter((song) => !song.isBlacklisted)
                                .map((song) => song.songId),
                              'songs',
                              true,
                              undefined,
                              true
                            )
                        },
                        {
                          label: t('common.playAll'),
                          iconName: 'play_arrow',
                          handlerFunction: () =>
                            createQueue(
                              songs
                                .filter((song) => !song.isBlacklisted)
                                .map((song) => song.songId),
                              'songs',
                              false,
                              undefined,
                              true
                            )
                        },
                        {
                          iconName: isMultipleSelectionEnabled ? 'remove_done' : 'checklist',
                          handlerFunction: () =>
                            toggleMultipleSelections(!isMultipleSelectionEnabled, 'songs'),
                          label: t(
                            `common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`
                          )
                        }
                      ],
                      x + 10,
                      y + 50
                    );
                  }
                },
                {
                  label: t('common.showAll'),
                  iconName: 'apps',
                  className:
                    'show-all-btn text-sm font-normal !bg-background-color-1/40 dark:!bg-dark-background-color-1/40',
                  clickHandler: () => setIsAllSongsVisible(true),
                  isVisible: songs.length > 5 && !isAllSongsVisible
                }
              ]}
              dropdown={{
                name: 'ArtistInfoPageSongsSortDropdown',
                value: sortingOrder,
                options: songSortOptions,
                onChange: (e) => setSortingOrder(e.currentTarget.value as SongSortTypes)
              }}
            />
            <div className="songs-container">
              {isAllSongsVisible ? (
                <List
                  itemCount={songs.length}
                  itemSize={60}
                  width={relevantWidth || '100%'}
                  height={clamp(300, height || 0, 400)}
                  overscanCount={10}
                  className="appear-from-bottom delay-100"
                >
                  {songListComponents}
                </List>
              ) : (
                songComponenets
              )}
            </div>
          </>
        </MainContainer>
      )}

      {artistData?.similarArtists && (
        <SimilarArtistsContainer similarArtists={artistData.similarArtists} />
      )}

      {artistData?.artistBio && (
        <Biography
          bioUserName={artistData.name}
          bio={artistData?.artistBio}
          tags={artistData.tags}
          hyperlinkData={{
            labelTitle: t('common.readMoreAboutTitle', {
              title: artistData.name
            })
          }}
        />
      )}
    </MainContainer>
  );
};

export default ArtistInfoPage;
