import React from 'react';
import Img from '../Img';

import NoResultsImage from '../../../../assets/images/svg/Sad face_Monochromatic.svg';
import RecentSearchResult from './RecentSearchResult';

type Props = {
  searchResults: SearchResult;
  searchInput: string;
  updateSearchInput: (input: string) => void;
};

const NoRearchResultsContainer = (props: Props) => {
  const { searchInput, searchResults, updateSearchInput } = props;
  const { albums, artists, genres, playlists, songs } = searchResults;

  const availableSearchResultComponents = React.useMemo(
    () =>
      searchResults.availableResults.length > 0
        ? searchResults.availableResults.map((result, index) => (
            <RecentSearchResult
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              result={result}
              clickHandler={() => {
                updateSearchInput(result);
              }}
            />
          ))
        : [],
    [searchResults.availableResults, updateSearchInput]
  );

  return (
    <>
      {songs.length === 0 &&
        artists.length === 0 &&
        albums.length === 0 &&
        playlists.length === 0 &&
        genres.length === 0 &&
        searchInput !== '' && (
          <div className="no-search-results-container active appear-from-bottom relative mt-16 flex w-full flex-col items-center justify-center text-center">
            <Img
              src={NoResultsImage}
              className={
                songs.length === 0 &&
                artists.length === 0 &&
                albums.length === 0 &&
                playlists.length === 0 &&
                genres.length === 0 &&
                searchInput !== ''
                  ? 'mb-4 w-60 max-w-full'
                  : ''
              }
              alt="Flying kite"
            />
            <div className="description text-xl text-font-color-black dark:text-font-color-white">
              Hmm... There&apos;s nothing that matches with what you look for.
            </div>
            <div className="recent-search-results-container mt-2 flex flex-wrap items-center justify-center px-[15%]">
              {availableSearchResultComponents}
            </div>
          </div>
        )}
    </>
  );
};

export default NoRearchResultsContainer;
