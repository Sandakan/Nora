import React from 'react';
import { useTranslation } from 'react-i18next';
import { Artist } from '../../ArtistPage/Artist';
import Button from '../../Button';
import SecondaryContainer from '../../SecondaryContainer';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import { AppContext } from '../../../contexts/AppContext';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';

type Props = {
  artists: Artist[];
  searchInput: string;
  isPredictiveSearchEnabled: boolean;
  noOfVisibleArtists?: number;
};

const ArtistsSearchResultsContainer = (props: Props) => {
  const { artists, searchInput, noOfVisibleArtists = 5, isPredictiveSearchEnabled } = props;
  const { isMultipleSelectionEnabled, multipleSelectionsData } = React.useContext(AppContext);
  const { toggleMultipleSelections, changeCurrentActivePage } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const selectAllHandler = useSelectAllHandler(artists, 'artist', 'artistId');

  const artistResults = React.useMemo(
    () =>
      artists.length > 0
        ? artists
            .map((artist, index) => {
              if (index < noOfVisibleArtists)
                return (
                  <Artist
                    index={index}
                    key={`${artist.artistId}-${artist.name}`}
                    name={artist.name}
                    artworkPaths={artist.artworkPaths}
                    artistId={artist.artistId}
                    songIds={artist.songs.map((song) => song.songId)}
                    onlineArtworkPaths={artist.onlineArtworkPaths}
                    className="mb-4"
                    isAFavorite={artist.isAFavorite}
                    selectAllHandler={selectAllHandler}
                  />
                );
              return undefined;
            })
            .filter((artist) => artist !== undefined)
        : [],
    [artists, noOfVisibleArtists, selectAllHandler]
  );

  return (
    <SecondaryContainer
      className={`secondary-container artists-list-container mt-4 ${
        artistResults.length > 0 ? 'active relative' : 'invisible absolute opacity-0'
      }`}
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        <div
          className={`title-container mb-8 mt-1 flex items-center pr-4 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight ${
            artistResults.length > 0 && 'visible opacity-100'
          }`}
        >
          <div className="container flex">
            Artists{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs">
              {artists && artists.length > 0 && (
                <span className="no-of-songs">
                  {t(
                    `searchPage.${
                      artists.length > noOfVisibleArtists ? 'resultAndVisibleCount' : 'resultCount'
                    }`,
                    { count: artists.length, noVisible: noOfVisibleArtists }
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="other-controls-container flex">
            <Button
              label={t(
                `common.${
                  isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'artist'
                    ? 'unselectAll'
                    : 'select'
                }`
              )}
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'artist'
                  ? 'remove_done'
                  : 'checklist'
              }
              clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'artist')}
              isDisabled={
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType !== 'artist'
              }
              tooltipLabel={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
            />
            {artists.length > noOfVisibleArtists && (
              <Button
                label={t('common.showAll')}
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  changeCurrentActivePage('AllSearchResults', {
                    searchQuery: searchInput,
                    searchFilter: 'Artists' as SearchFilters,
                    searchResults: artists,
                    isPredictiveSearchEnabled
                  })
                }
              />
            )}
          </div>
        </div>
        <div className="artists-container mb-12 flex flex-wrap">{artistResults}</div>
      </>
    </SecondaryContainer>
  );
};

export default ArtistsSearchResultsContainer;
