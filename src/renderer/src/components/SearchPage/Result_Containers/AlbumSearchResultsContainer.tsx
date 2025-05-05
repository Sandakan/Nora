import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Album } from '../../AlbumsPage/Album';
import Button from '../../Button';
import SecondaryContainer from '../../SecondaryContainer';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';
import { store } from '@renderer/store';
import { useStore } from '@tanstack/react-store';
import { useNavigate } from '@tanstack/react-router';

type Props = {
  albums: Album[];
  searchInput: string;
  noOfVisibleAlbums?: number;
  isPredictiveSearchEnabled: boolean;
};

const AlbumSearchResultsContainer = (props: Props) => {
  const { albums, searchInput, noOfVisibleAlbums = 4, isPredictiveSearchEnabled } = props;
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const { toggleMultipleSelections } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const selectAllHandler = useSelectAllHandler(albums, 'album', 'albumId');

  const albumResults = useMemo(
    () =>
      albums.length > 0
        ? albums
            .map((album, index) => {
              if (index < noOfVisibleAlbums)
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
                    selectAllHandler={selectAllHandler}
                  />
                );
              return undefined;
            })
            .filter((album) => album !== undefined)
        : [],
    [albums, noOfVisibleAlbums, selectAllHandler]
  );

  return (
    <SecondaryContainer
      className={`secondary-container albums-list-container mt-4 ${
        albumResults.length > 0 ? 'active relative' : 'invisible absolute opacity-0'
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
            Albums{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs">
              {albums && albums.length > 0 && (
                <span className="no-of-songs">
                  {t(
                    `searchPage.${
                      albums.length > noOfVisibleAlbums ? 'resultAndVisibleCount' : 'resultCount'
                    }`,
                    { count: albums.length, noVisible: noOfVisibleAlbums }
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="other-controls-container flex">
            <Button
              label={t(
                `common.${
                  isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'album'
                    ? 'unselectAll'
                    : 'select'
                }`
              )}
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'album'
                  ? 'remove_done'
                  : 'checklist'
              }
              clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'album')}
              isDisabled={
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType !== 'album'
              }
              tooltipLabel={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
            />
            {albums.length > noOfVisibleAlbums && (
              <Button
                label={t('common.showAll')}
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  navigate({
                    to: '/main-player/search/all',
                    search: { keyword: searchInput, isPredictiveSearchEnabled, filterBy: 'Albums' }
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

