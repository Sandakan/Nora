import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import { Playlist } from '../../PlaylistsPage/Playlist';
import SecondaryContainer from '../../SecondaryContainer';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import { AppContext } from '../../../contexts/AppContext';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';

type Props = {
  playlists: Playlist[];
  searchInput: string;
  noOfVisiblePlaylists?: number;
  isPredictiveSearchEnabled: boolean;
};

const PlaylistSearchResultsContainer = (props: Props) => {
  const { playlists, searchInput, noOfVisiblePlaylists = 4, isPredictiveSearchEnabled } = props;
  const { isMultipleSelectionEnabled, multipleSelectionsData } = React.useContext(AppContext);
  const { toggleMultipleSelections, changeCurrentActivePage } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const selectAllHandler = useSelectAllHandler(playlists, 'playlist', 'playlistId');

  const playlistResults = React.useMemo(
    () =>
      playlists.length > 0
        ? playlists
            .map((playlist, index) => {
              if (index < noOfVisiblePlaylists)
                return (
                  <Playlist
                    index={index}
                    key={`${playlist.playlistId}-${playlist.name}`}
                    name={playlist.name}
                    playlistId={playlist.playlistId}
                    createdDate={playlist.createdDate}
                    songs={playlist.songs}
                    isArtworkAvailable={playlist.isArtworkAvailable}
                    artworkPaths={playlist.artworkPaths}
                    selectAllHandler={selectAllHandler}
                  />
                );
              return undefined;
            })
            .filter((x) => x !== undefined)
        : [],
    [noOfVisiblePlaylists, playlists, selectAllHandler]
  );

  return (
    <SecondaryContainer
      className={`secondary-container playlists-list-container mt-4 ${
        playlistResults.length > 0 ? 'active relative' : 'invisible absolute'
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
            Playlists{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs">
              {playlists && playlists.length > 0 && (
                <span className="no-of-songs">
                  {t(
                    `searchPage.${
                      playlists.length > noOfVisiblePlaylists
                        ? 'resultAndVisibleCount'
                        : 'resultCount'
                    }`,
                    {
                      count: playlists.length,
                      noVisible: noOfVisiblePlaylists
                    }
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="other-controls-container flex">
            <Button
              label={t(
                `common.${
                  isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'playlist'
                    ? 'unselectAll'
                    : 'select'
                }`
              )}
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'playlist'
                  ? 'remove_done'
                  : 'checklist'
              }
              clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'playlist')}
              isDisabled={
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType !== 'playlist'
              }
              tooltipLabel={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
            />
            {playlists.length > noOfVisiblePlaylists && (
              <Button
                label={t('common.showAll')}
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  changeCurrentActivePage('AllSearchResults', {
                    searchQuery: searchInput,
                    searchFilter: 'Playlists' as SearchFilters,
                    searchResults: playlists,
                    isPredictiveSearchEnabled
                  })
                }
              />
            )}
          </div>
        </div>
        <div className="playlists-container  flex h-full flex-wrap">{playlistResults}</div>
      </>
    </SecondaryContainer>
  );
};

export default PlaylistSearchResultsContainer;
