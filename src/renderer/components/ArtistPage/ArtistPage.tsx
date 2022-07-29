/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import sortArtists from 'renderer/utils/sortArtists';
import { Artist } from './Artist';
import NoArtistImage from '../../../../assets/images/Sun_Monochromatic.svg';
import FetchingDataImage from '../../../../assets/images/Lemonade_Monochromatic.svg';
import Dropdown from '../Dropdown';
import MainContainer from '../MainContainer';

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
  const { currentlyActivePage, userData } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData, updatePageSortingOrder } =
    React.useContext(AppUpdateContext);
  const [content, dispatch] = React.useReducer(reducer, {
    artists: [],
    sortingOrder:
      currentlyActivePage.data &&
      currentlyActivePage.data.artistsPage &&
      currentlyActivePage.data.artistsPage.sortingOrder
        ? currentlyActivePage.data.artistsPage.sortingOrder
        : userData && userData.sortingStates.artistsPage
        ? userData.sortingStates.artistsPage
        : 'aToZ',
  } as ArtistPageReducer);

  const fetchArtistsData = React.useCallback(
    () =>
      window.api.getArtistData().then((res) => {
        if (res && Array.isArray(res)) {
          if (res.length > 0)
            dispatch({
              type: 'ARTISTS_DATA',
              data: sortArtists(res, content.sortingOrder),
            });
          else
            dispatch({
              type: 'ARTISTS_DATA',
              data: null,
            });
        }
      }),
    [content.sortingOrder]
  );

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
    updatePageSortingOrder('sortingStates.artistsPage', content.sortingOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.sortingOrder]);

  const artistComponenets = React.useMemo(
    () =>
      content.artists &&
      content.artists.length > 0 &&
      content.artists.map((artist) => (
        <Artist
          key={artist.artistId}
          className="mb-12"
          artistId={artist.artistId}
          name={artist.name}
          artworkPath={artist.artworkPath}
          onlineArtworkPaths={artist.onlineArtworkPaths}
          songIds={artist.songs.map((song) => song.songId)}
        />
      )),
    [content.artists]
  );

  return (
    <MainContainer className="main-container artists-list-container">
      <>
        <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
          <div className="container flex">
            Artists{' '}
            <div className="other-stats-container text-xs ml-12 flex items-center">
              {content.artists && (
                <span className="no-of-artists">{`${
                  content.artists.length
                } artist${content.artists.length === 1 ? '' : 's'}`}</span>
              )}
            </div>
          </div>
          <div className="other-control-container">
            <Dropdown
              name="artistsSortDropdown"
              value={content.sortingOrder}
              options={[
                { label: 'A to Z', value: 'aToZ' },
                { label: 'Z to A', value: 'zToA' },
                { label: 'High Song Count', value: 'noOfSongsDescending' },
                { label: 'Low Song Count', value: 'noOfSongsAscending' },
              ]}
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
            />
          </div>
        </div>
        <div className="artists-container flex flex-wrap">
          {artistComponenets}
        </div>
        {content.artists === null && (
          <div className="no-songs-container h-full w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={NoArtistImage}
              alt="Sun in a desert"
              className="w-60 mb-8"
            />
            <div>Hmm... Where did the artists go?</div>
          </div>
        )}
        {content.artists && content.artists.length === 0 && (
          <div className="no-songs-container h-full w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={FetchingDataImage}
              alt="No songs available."
              className="w-60 mb-8"
            />
            <div>What about a Lemonade? They are cool, right ?</div>
          </div>
        )}
      </>
    </MainContainer>
  );
};
