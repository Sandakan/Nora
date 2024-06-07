/* eslint-disable react/no-array-index-key */
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import Genre from '../../GenresPage/Genre';
import SecondaryContainer from '../../SecondaryContainer';
import { AppContext } from '../../../contexts/AppContext';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';

type Props = {
  genres: Genre[];
  searchInput: string;
  noOfVisibleGenres?: number;
  isPredictiveSearchEnabled: boolean;
};

const GenreSearchResultsContainer = (props: Props) => {
  const { isMultipleSelectionEnabled, multipleSelectionsData } = useContext(AppContext);
  const { toggleMultipleSelections, changeCurrentActivePage } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { genres, searchInput, noOfVisibleGenres = 3, isPredictiveSearchEnabled } = props;

  const selectAllHandler = useSelectAllHandler(genres, 'genre', 'genreId');

  const genreResults = useMemo(
    () =>
      genres.length > 0
        ? genres
            .map((genre, index) => {
              if (index < noOfVisibleGenres)
                return (
                  <Genre
                    key={`${genre.genreId}-${index}`}
                    index={index}
                    title={genre.name}
                    genreId={genre.genreId}
                    songIds={genre.songs.map((song) => song.songId)}
                    artworkPaths={genre.artworkPaths}
                    paletteData={genre.paletteData}
                    selectAllHandler={selectAllHandler}
                  />
                );
              return undefined;
            })
            .filter((x) => x !== undefined)
        : [],
    [genres, noOfVisibleGenres, selectAllHandler]
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
                <div className="no-of-genres">
                  {t(
                    `searchPage.${
                      genres.length > noOfVisibleGenres ? 'resultAndVisibleCount' : 'resultCount'
                    }`,
                    { count: genres.length, noVisible: noOfVisibleGenres }
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="other-controls-container flex">
            <Button
              label={t(
                `common.${
                  isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'genre'
                    ? 'unselectAll'
                    : 'select'
                }`
              )}
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'genre'
                  ? 'remove_done'
                  : 'checklist'
              }
              clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'genre')}
              isDisabled={
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType !== 'genre'
              }
              tooltipLabel={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
            />
            {genres.length > noOfVisibleGenres && (
              <Button
                label={t('common.showAll')}
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  changeCurrentActivePage('AllSearchResults', {
                    searchQuery: searchInput,
                    searchFilter: 'Genres' as SearchFilters,
                    searchResults: genres,
                    isPredictiveSearchEnabled
                  })
                }
              />
            )}
          </div>
        </div>
        {genres.length > 0 && <div className="genres-container flex flex-wrap">{genreResults}</div>}
      </>
    </SecondaryContainer>
  );
};

export default GenreSearchResultsContainer;
