/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import sortArtists from 'renderer/utils/sortArtists';
import { Artist } from './Artist';
// import DefaultArtistCover from '../../../../assets/images/song_cover_default.png';

interface ArtistPageReducer {
  artists: Artist[];
  sortingOrder: ArtistSortTypes;
}

type ArtistPageReducerTypes = 'SORTING_ORDER' | 'ARTISTS_DATA';

const reducer = (
  state: ArtistPageReducer,
  action: { type: ArtistPageReducerTypes; data: any }
): ArtistPageReducer => {
  switch (action.type) {
    case 'ARTISTS_DATA':
      return {
        ...state,
        artists: action.data,
      };
    case 'SORTING_ORDER':
      return {
        ...state,
        artists: sortArtists(state.artists, action.data),
        sortingOrder: action.data,
      };
    default:
      return state;
  }
};

export const ArtistPage = () => {
  const { currentlyActivePage, updateCurrentlyActivePageData } =
    React.useContext(AppContext);
  const [content, dispatch] = React.useReducer(reducer, {
    artists: [],
    sortingOrder:
      currentlyActivePage.data &&
      currentlyActivePage.data.artistsPage &&
      currentlyActivePage.data.artistsPage.sortingOrder
        ? currentlyActivePage.data.artistsPage.sortingOrder
        : 'aToZ',
  } as ArtistPageReducer);

  React.useEffect(() => {
    window.api.getArtistData('*').then((res) => {
      if (res && Array.isArray(res)) {
        dispatch({
          type: 'ARTISTS_DATA',
          data: sortArtists(res, content.sortingOrder),
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const artistComponenets =
    content.artists.length > 0 &&
    content.artists.map((artist) => (
      <Artist
        key={artist.artistId}
        artistId={artist.artistId}
        name={artist.name}
        artworkPath={artist.artworkPath}
        onlineArtworkPaths={artist.onlineArtworkPaths}
        songIds={artist.songs.map((song) => song.songId)}
      />
    ));

  return (
    <div className="main-container artists-list-container">
      <div className="title-container">
        Artists
        <select
          name="sortingOrderDropdown"
          id="sortingOrderDropdown"
          value={content.sortingOrder}
          onChange={(e) => {
            updateCurrentlyActivePageData({
              artistsPage: {
                sortingOrder: e.currentTarget.value as ArtistSortTypes,
              },
            });
            dispatch({
              type: 'SORTING_ORDER',
              data: e.currentTarget.value as ArtistSortTypes,
            });
          }}
        >
          <option value="aToZ">A to Z</option>
          <option value="ZToA">Z to A</option>
          <option value="noOfSongsAscending">No. of Songs ( Ascending )</option>
          <option value="noOfSongsDescending">
            No. of Songs ( Descending )
          </option>
        </select>
      </div>
      <div className="artists-container">{artistComponenets}</div>
    </div>
  );
};
