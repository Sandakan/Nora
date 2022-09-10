/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
/* eslint-disable promise/always-return */
/* eslint-disable consistent-return */
/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable no-else-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import { Song } from './Song';
import DefaultSongCover from '../../../../assets/images/png/song_cover_default.png';
import NoSongsImage from '../../../../assets/images/svg/Empty Inbox _Monochromatic.svg';
import DataFetchingImage from '../../../../assets/images/svg/Road trip_Monochromatic.svg';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Dropdown from '../Dropdown';
import useResizeObserver from '../../hooks/useResizeObserver';

interface SongPageReducer {
  songsData: AudioInfo[];
  sortingOrder: SongSortTypes;
}

type SongPageReducerActionTypes = 'SONGS_DATA' | 'SORTING_ORDER';

const reducer = (
  state: SongPageReducer,
  action: { type: SongPageReducerActionTypes; data: any }
): SongPageReducer => {
  switch (action.type) {
    case 'SONGS_DATA':
      return {
        ...state,
        songsData: action.data,
      };
    case 'SORTING_ORDER':
      return {
        ...state,
        sortingOrder: action.data,
      };
    default:
      return state;
  }
};

export const SongsPage = () => {
  const { currentlyActivePage, userData } = React.useContext(AppContext);
  const { createQueue, updateCurrentlyActivePageData, updatePageSortingOrder } =
    React.useContext(AppUpdateContext);

  const [content, dispatch] = React.useReducer(reducer, {
    songsData: [],
    sortingOrder:
      currentlyActivePage.data &&
      currentlyActivePage.data.songsPage &&
      currentlyActivePage.data.songsPage.sortingOrder
        ? currentlyActivePage.data.songsPage.sortingOrder
        : userData && userData.sortingStates.songsPage
        ? userData.sortingStates.songsPage
        : 'aToZ',
  });
  const songsContainerRef = React.useRef(null as HTMLDivElement | null);
  const { width, height } = useResizeObserver(songsContainerRef);

  const fetchSongsData = React.useCallback(
    () =>
      window.api
        .getAllSongs(content.sortingOrder)
        .then((audioInfoArray) => {
          if (audioInfoArray)
            return audioInfoArray.data.length === 0
              ? dispatch({
                  type: 'SONGS_DATA',
                  data: null,
                })
              : dispatch({
                  type: 'SONGS_DATA',
                  data: audioInfoArray.data,
                });
        })
        .catch((err) => console.error(err)),
    [content.sortingOrder]
  );

  React.useEffect(() => {
    fetchSongsData();
    const manageSongsDataUpdatesInSongsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DataEvent).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong'
          )
            fetchSongsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageSongsDataUpdatesInSongsPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongsDataUpdatesInSongsPage
      );
    };
  }, [fetchSongsData]);

  React.useEffect(() => {
    updatePageSortingOrder('sortingStates.songsPage', content.sortingOrder);
  }, [content.sortingOrder]);

  const addNewSongs = React.useCallback(() => {
    window.api
      .addMusicFolder(content.sortingOrder)
      .then((songs) => {
        const relevantSongsData: AudioInfo[] = songs.map((song) => {
          return {
            title: song.title,
            songId: song.songId,
            artists: song.artists,
            duration: song.duration,
            palette: song.palette,
            path: song.path,
            artworkPath: song.artworkPath,
            addedDate: song.addedDate,
            isAFavorite: song.isAFavorite,
          };
        });
        dispatch({ type: 'SONGS_DATA', data: relevantSongsData });
      })
      .catch((err) => console.error(err));
  }, [content.sortingOrder]);

  const row = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const {
        songId,
        title,
        artists,
        duration,
        isAFavorite,
        artworkPath,
        path,
      } = content.songsData[index];
      return (
        <div style={style}>
          <Song
            key={index}
            index={index}
            isIndexingSongs={
              userData !== undefined && userData.preferences.songIndexing
            }
            title={title}
            songId={songId}
            artists={artists}
            artworkPath={artworkPath}
            duration={duration}
            path={path}
            isAFavorite={isAFavorite}
          />
        </div>
      );
    },
    [content.songsData, userData]
  );

  const songs = React.useMemo(
    () =>
      content.songsData && content.songsData.length > 0
        ? content.songsData.map((song, index) => {
            return (
              <Song
                key={song.songId}
                index={index}
                isIndexingSongs={
                  userData !== undefined && userData.preferences.songIndexing
                }
                title={song.title}
                artworkPath={song.artworkPath || DefaultSongCover}
                duration={song.duration}
                songId={song.songId}
                artists={song.artists}
                path={song.path}
                isAFavorite={song.isAFavorite}
              />
            );
          })
        : [],
    [content.songsData, userData]
  );

  const dropdownOptions: { label: string; value: SongSortTypes }[] = [
    { label: 'A to Z', value: 'aToZ' },
    { label: 'Z to A', value: 'zToA' },
    { label: 'Newest', value: 'dateAddedAscending' },
    { label: 'Oldest', value: 'dateAddedDescending' },
    {
      label: 'Most Listened (All Time)',
      value: 'allTimeMostListened',
    },
    {
      label: 'Least Listened (All Time)',
      value: 'allTimeLeastListened',
    },
    {
      label: 'Most Listened (This Month)',
      value: 'monthlyMostListened',
    },
    {
      label: 'Least Listened (This Month)',
      value: 'monthlyLeastListened',
    },
    {
      label: 'Artist Name (A to Z)',
      value: 'artistNameAscending',
    },
    {
      label: 'Artist Name (Z to A)',
      value: 'artistNameDescending',
    },
    { label: 'Album Name (A to Z)', value: 'albumNameAscending' },
    {
      label: 'Album Name (Z to A)',
      value: 'albumNameDescending',
    },
  ];

  return (
    <MainContainer className="main-container songs-list-container !h-full !mb-0">
      <>
        <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
          <div className="container flex">
            Songs{' '}
            <div className="other-stats-container text-xs ml-12 flex items-center">
              {songs && songs.length > 0 && (
                <span className="no-of-songs">{songs.length} songs</span>
              )}
            </div>
          </div>
          <div className="other-controls-container flex">
            {songs && songs.length > 0 && (
              <>
                <Button
                  label="Play All"
                  className="play-all-btn text-sm"
                  iconName="play_arrow"
                  clickHandler={() =>
                    createQueue(
                      content.songsData.map((song) => song.songId),
                      'songs',
                      false,
                      undefined,
                      true
                    )
                  }
                />
                <Button
                  label="Shuffle and Play"
                  className="shuffle-and-play-all-btn text-sm"
                  iconName="shuffle"
                  clickHandler={() =>
                    createQueue(
                      content.songsData.map((song) => song.songId),
                      'songs',
                      true,
                      undefined,
                      true
                    )
                  }
                />
              </>
            )}
            <Dropdown
              name="songsPageSortDropdown"
              value={content.sortingOrder}
              options={dropdownOptions}
              onChange={(e) => {
                updateCurrentlyActivePageData({
                  songsPage: {
                    sortingOrder: e.currentTarget.value as ArtistSortTypes,
                  },
                });
                dispatch({
                  type: 'SORTING_ORDER',
                  data: e.currentTarget.value,
                });
              }}
            />
          </div>
        </div>
        <div className="songs-container h-full flex-1" ref={songsContainerRef}>
          {content.songsData && content.songsData.length > 0 && (
            <List
              itemCount={songs.length}
              itemSize={60}
              width={width || '100%'}
              height={height || 450}
              overscanCount={10}
            >
              {row}
            </List>
          )}
        </div>
        {content.songsData === null && (
          <div className="no-songs-container  h-full w-full text-[#ccc] my-[8%] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={NoSongsImage}
              alt="No songs available."
              className="w-60 mb-8"
            />
            <span>
              What&apos;s a world without music. So let&apos;s find them...
            </span>
            <Button
              label="Add Folder"
              className="mt-4 px-8 text-lg w-40 !bg-background-color-3 dark:!bg-dark-background-color-3 text-font-color-black dark:text-font-color-black rounded-md hover:border-background-color-3 dark:hover:border-background-color-3"
              clickHandler={addNewSongs}
            />
          </div>
        )}
        {content.songsData && content.songsData.length === 0 && (
          <div className="no-songs-container h-full w-full text-[#ccc] my-[10%] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={DataFetchingImage}
              alt="No songs available."
              className="w-60 mb-8"
            />
            <span>
              Like road trips? Just asking. It wouldn't take that long...
            </span>
          </div>
        )}
      </>
    </MainContainer>
  );
};
