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
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import { Song } from './Song';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';
import NoSongsImage from '../../../../assets/images/Empty Inbox _Monochromatic.svg';
import DataFetchingImage from '../../../../assets/images/Road trip_Monochromatic.svg';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Dropdown from '../Dropdown';

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

// const row = ({ index, style }) => <div style={style}>Row {index}</div>;

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
  // const List = React.useMemo(() => window.api.getReactWindowComponenet(), []);

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
    const manageSongsDataUpdates = (
      _: unknown,
      eventType: DataUpdateEventTypes
    ) => {
      if (eventType === 'songs/deletedSong' || eventType === 'songs/newSong')
        fetchSongsData();
    };
    window.api.dataUpdateEvent(manageSongsDataUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageSongsDataUpdates);
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

  // const row = React.useCallback(({ index, style }) => {
  //   const { songId, artists, duration, path, title, artworkPath } =
  //     content.songsData[index];
  //   return (
  //     <div style={style}>
  //       <Song
  //         title={title}
  //         duration={duration}
  //         songId={songId}
  //         path={path}
  //         artists={artists}
  //         artworkPath={artworkPath}
  //         index={index}
  //       />
  //     </div>
  //   );
  // }, []);
  const songs = React.useMemo(
    () =>
      content.songsData && content.songsData.length > 0
        ? content.songsData.map((song, index) => {
            return (
              <Song
                key={song.songId}
                index={index}
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
    [content.songsData]
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
    <MainContainer className="main-container songs-list-container">
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
        {songs && songs.length > 0 && (
          <div className="songs-container">{songs}</div>
        )}
        {content.songsData === null && (
          <div className="no-songs-container  h-full w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl">
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
              className="text-[#ccc] dark:text-[#ccc] rounded-md mt-4 px-8 text-lg"
              clickHandler={addNewSongs}
            />
          </div>
        )}
        {content.songsData && content.songsData.length === 0 && (
          <div className="no-songs-container h-full w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl">
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
