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
import { AppContext } from 'renderer/contexts/AppContext';
import sortSongs from 'renderer/utils/sortSongs';
import { Song } from './song';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';

interface SongPageReducer {
  songsData: AudioInfo[];
  sortingOrder: SongsPageSortTypes;
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
        songsData: sortSongs(state.songsData, action.data),
        sortingOrder: action.data,
      };
    default:
      return state;
  }
};

export const SongsPage = () => {
  const { createQueue, currentlyActivePage, updateCurrentlyActivePageData } =
    React.useContext(AppContext);
  const [content, dispatch] = React.useReducer(reducer, {
    songsData: [],
    sortingOrder:
      currentlyActivePage.data &&
      currentlyActivePage.data.songsPage &&
      currentlyActivePage.data.songsPage.sortingOrder
        ? currentlyActivePage.data.songsPage.sortingOrder
        : 'aToZ',
  });

  React.useEffect(() => {
    window.api
      .checkForSongs()
      .then((audioInfoArray) => {
        if (audioInfoArray)
          return dispatch({
            type: 'SONGS_DATA',
            data: sortSongs(audioInfoArray, content.sortingOrder),
          });
      })
      .catch((err) => console.log(err));
  }, []);

  const songs = content.songsData.map((song) => {
    return (
      <Song
        key={song.songId}
        title={song.title}
        artworkPath={song.artworkPath || DefaultSongCover}
        duration={song.duration}
        songId={song.songId}
        artists={song.artists}
        path={song.path}
      />
    );
  });

  return (
    <div className="main-container songs-list-container">
      <div className="title-container">
        <div className="container">
          Songs{' '}
          <div className="other-stats-container">
            {songs.length > 0 && (
              <span className="no-of-songs">{songs.length} songs</span>
            )}
            <button
              type="button"
              className="play-all-btn"
              onClick={() =>
                createQueue(
                  content.songsData.map((song) => song.songId),
                  'songs',
                  undefined,
                  true
                )
              }
            >
              <span className="material-icons-round icon">play_arrow</span> Play
              All
            </button>
          </div>
        </div>
        <select
          name="sortingOrderDropdown"
          id="sortingOrderDropdown"
          value={content.sortingOrder}
          onChange={(e) => {
            updateCurrentlyActivePageData({
              songsPage: {
                sortingOrder: e.currentTarget.value as ArtistSortTypes,
              },
            });
            dispatch({ type: 'SORTING_ORDER', data: e.currentTarget.value });
          }}
        >
          <option value="aToZ">A to Z</option>
          <option value="zToA">Z to A</option>
          <option value="dateAddedAscending">Date added ( Ascending )</option>
          <option value="dateAddedDescending">Date added ( Descending )</option>
          <option value="artistNameAscending">Artist ( Ascending )</option>
          <option value="artistNameDescending">Artist ( Descending )</option>
          {/* <option value="albumNameAscending">Album ( Ascending )</option>
          <option value="albumNameDescending">Album ( Descending )</option> */}
        </select>
      </div>
      <div className="songs-container">{songs}</div>
    </div>
  );
};
