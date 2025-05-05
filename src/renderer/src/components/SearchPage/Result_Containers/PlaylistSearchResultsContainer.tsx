import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import { Playlist } from '../../PlaylistsPage/Playlist';
import SecondaryContainer from '../../SecondaryContainer';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';
import { useNavigate } from '@tanstack/react-router';

type Props = {
  playlists: Playlist[];
  searchInput: string;
  noOfVisiblePlaylists?: number;
  isPredictiveSearchEnabled: boolean;
};

const PlaylistSearchResultsContainer = (props: Props) => {
  const { playlists, searchInput, noOfVisiblePlaylists = 4, isPredictiveSearchEnabled } = props;
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const { toggleMultipleSelections } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const selectAllHandler = useSelectAllHandler(playlists, 'playlist', 'playlistId');

  const playlistResults = useMemo(
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
        <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-2xl font-medium">
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
                  navigate({
                    to: '/main-player/search/all',
                    search: {
                      keyword: searchInput,
                      isPredictiveSearchEnabled,
                      filterBy: 'Playlists'
                    }
                  })
                }
              />
            )}
          </div>
        </div>
        <div className="playlists-container flex h-full flex-wrap">{playlistResults}</div>
      </>
    </SecondaryContainer>
  );
};

export default PlaylistSearchResultsContainer;

