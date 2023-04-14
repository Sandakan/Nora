/* eslint-disable react/no-array-index-key */
import React from 'react';
import Button from 'renderer/components/Button';
import Genre from 'renderer/components/GenresPage/Genre';
import SecondaryContainer from 'renderer/components/SecondaryContainer';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';

type Props = { genres: Genre[]; searchInput: string };

const GenreSearchResultsContainer = (props: Props) => {
  const { isMultipleSelectionEnabled, multipleSelectionsData } =
    React.useContext(AppContext);
  const { toggleMultipleSelections, changeCurrentActivePage } =
    React.useContext(AppUpdateContext);
  const { genres, searchInput } = props;

  const selectAllHandler = useSelectAllHandler(genres, 'genre', 'genreId');

  const genreResults = React.useMemo(
    () =>
      genres.length > 0
        ? genres
            .map((genre, index) => {
              if (index < 3)
                return (
                  <Genre
                    key={`${genre.genreId}-${index}`}
                    index={index}
                    title={genre.name}
                    genreId={genre.genreId}
                    songIds={genre.songs.map((song) => song.songId)}
                    artworkPaths={genre.artworkPaths}
                    backgroundColor={genre.backgroundColor}
                    selectAllHandler={selectAllHandler}
                  />
                );
              return undefined;
            })
            .filter((x) => x !== undefined)
        : [],
    [genres, selectAllHandler]
  );

  return (
    <SecondaryContainer
      className={`secondary-container genres-list-container appear-from=bottom mt-4 text-font-color-black dark:text-font-color-white ${
        genreResults.length > 0 ? 'active relative' : 'invisible absolute'
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
        <div className="title-container mb-8 mt-1 flex items-center pr-4 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          <div className="container flex">
            Genres
            <div className="other-stats-container ml-12 flex items-center text-xs">
              {genres.length > 0 && (
                <div className="no-of-genres">{`${genres.length} genre${
                  genres.length === 1 ? '' : 's'
                }`}</div>
              )}
            </div>
          </div>
          <div className="other-controls-container flex">
            <Button
              label={
                isMultipleSelectionEnabled &&
                multipleSelectionsData.selectionType === 'genre'
                  ? 'Unselect All'
                  : 'Select'
              }
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={
                isMultipleSelectionEnabled &&
                multipleSelectionsData.selectionType === 'genre'
                  ? 'remove_done'
                  : 'checklist'
              }
              clickHandler={() =>
                toggleMultipleSelections(!isMultipleSelectionEnabled, 'genre')
              }
              isDisabled={
                isMultipleSelectionEnabled &&
                multipleSelectionsData.selectionType !== 'genre'
              }
              tooltipLabel={
                isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
              }
            />
            {genres.length > 4 && (
              <Button
                label="Show All"
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  changeCurrentActivePage('AllSearchResults', {
                    searchQuery: searchInput,
                    searchFilter: 'Genres' as SearchFilters,
                    searchResults: genres,
                  })
                }
              />
            )}
          </div>
        </div>
        {genres.length > 0 && (
          <div className="genres-container flex flex-wrap">{genreResults}</div>
        )}
      </>
    </SecondaryContainer>
  );
};

export default GenreSearchResultsContainer;
