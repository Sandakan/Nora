import React from 'react';
import { Album } from 'renderer/components/AlbumsPage/Album';
import Button from 'renderer/components/Button';
import SecondaryContainer from 'renderer/components/SecondaryContainer';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';

type Props = { albums: Album[]; searchInput: string };

const AlbumSearchResultsContainer = (props: Props) => {
  const { albums, searchInput } = props;
  const {
    isMultipleSelectionEnabled,
    multipleSelectionsData,
    currentlyActivePage,
  } = React.useContext(AppContext);
  const { toggleMultipleSelections, changeCurrentActivePage } =
    React.useContext(AppUpdateContext);

  const albumResults = React.useMemo(
    () =>
      albums.length > 0
        ? albums
            .map((album, index) => {
              if (index < 4)
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
                  />
                );
              return undefined;
            })
            .filter((album) => album !== undefined)
        : [],
    [albums]
  );

  return (
    <SecondaryContainer
      className={`secondary-container albums-list-container mt-4 ${
        albumResults.length > 0
          ? 'active relative'
          : 'invisible absolute opacity-0'
      }`}
    >
      <>
        <div className="title-container mt-1 mb-8 flex items-center pr-4 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          <div className="container flex">
            Albums{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs">
              {albums && albums.length > 0 && (
                <span className="no-of-songs">{albums.length} results</span>
              )}
            </div>
          </div>
          <div className="other-controls-container flex">
            <Button
              label={
                isMultipleSelectionEnabled &&
                multipleSelectionsData.selectionType === 'album'
                  ? 'Unselect All'
                  : 'Select'
              }
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={
                isMultipleSelectionEnabled &&
                multipleSelectionsData.selectionType === 'album'
                  ? 'remove_done'
                  : 'checklist'
              }
              clickHandler={() =>
                toggleMultipleSelections(!isMultipleSelectionEnabled, 'album')
              }
              isDisabled={
                isMultipleSelectionEnabled &&
                multipleSelectionsData.selectionType !== 'album'
              }
              tooltipLabel={
                isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
              }
            />
            {albums.length > 4 && (
              <Button
                label="Show All"
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  currentlyActivePage.pageTitle === 'AllSearchResults' &&
                  currentlyActivePage.data.allSearchResultsPage.searchQuery ===
                    searchInput
                    ? changeCurrentActivePage('Home')
                    : changeCurrentActivePage('AllSearchResults', {
                        searchQuery: searchInput,
                        searchFilter: 'Albums' as SearchFilters,
                        searchResults: albums,
                      })
                }
              />
            )}
          </div>
        </div>
        <div className="albums-container flex flex-wrap">{albumResults}</div>
      </>
    </SecondaryContainer>
  );
};

export default AlbumSearchResultsContainer;
