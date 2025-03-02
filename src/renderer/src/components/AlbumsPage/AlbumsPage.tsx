/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import storage from '../../utils/localStorage';
import i18n from '../../i18n';

import { Album } from './Album';
import MainContainer from '../MainContainer';
import Dropdown, { type DropdownOption } from '../Dropdown';
import Img from '../Img';
import Button from '../Button';

import NoAlbumsImage from '../../assets/images/svg/Easter bunny_Monochromatic.svg';
import VirtualizedGrid from '../VirtualizedGrid';
import { store } from '@renderer/store';
import { useStore } from '@tanstack/react-store';

const albumSortOptions: DropdownOption<AlbumSortTypes>[] = [
  { label: i18n.t('sortTypes.aToZ'), value: 'aToZ' },
  { label: i18n.t('sortTypes.zToA'), value: 'zToA' },
  {
    label: i18n.t('sortTypes.noOfSongsDescending'),
    value: 'noOfSongsDescending'
  },
  {
    label: i18n.t('sortTypes.noOfSongsAscending'),
    value: 'noOfSongsAscending'
  }
];
const MIN_ITEM_WIDTH = 220;
const MIN_ITEM_HEIGHT = 280;

const AlbumsPage = () => {
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);
  const sortingStates = useStore(store, (state) => state.localStorage.sortingStates);

  const { updateCurrentlyActivePageData, toggleMultipleSelections } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [albumsData, setAlbumsData] = useState([] as Album[]);
  const [sortingOrder, setSortingOrder] = useState<AlbumSortTypes>(
    currentlyActivePage?.data?.sortingOrder || sortingStates?.albumsPage || 'aToZ'
  );

  const fetchAlbumData = useCallback(
    () =>
      window.api.albumsData.getAlbumData([], sortingOrder).then((res) => {
        if (res && Array.isArray(res)) {
          if (res.length > 0) setAlbumsData(res);
          else setAlbumsData([]);
        }
        return undefined;
      }),
    [sortingOrder]
  );

  useEffect(() => {
    fetchAlbumData();
    const manageDataUpdatesInAlbumsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'albums/newAlbum') fetchAlbumData();
          if (event.dataType === 'albums/deletedAlbum') fetchAlbumData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageDataUpdatesInAlbumsPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageDataUpdatesInAlbumsPage);
    };
  }, [fetchAlbumData]);

  useEffect(() => {
    storage.sortingStates.setSortingStates('albumsPage', sortingOrder);
  }, [sortingOrder]);

  const selectAllHandler = useSelectAllHandler(albumsData, 'album', 'albumId');

  return (
    <MainContainer
      className="appear-from-bottom albums-list-container !h-full overflow-hidden !pb-0"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        {albumsData.length > 0 && (
          <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
            <div className="container flex">
              {t('common.album_other')}{' '}
              <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
                {isMultipleSelectionEnabled ? (
                  <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                    {t('common.selectionWithCount', {
                      count: multipleSelectionsData.multipleSelections.length
                    })}
                  </div>
                ) : (
                  albumsData.length > 0 && (
                    <span className="no-of-albums">
                      {t('common.albumWithCount', { count: albumsData.length })}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="other-controls-container flex">
              <Button
                label={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={isMultipleSelectionEnabled ? 'remove_done' : 'checklist'}
                clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'album')}
              />
              <Dropdown
                name="albumSortDropdown"
                value={sortingOrder}
                options={albumSortOptions}
                onChange={(e) => {
                  const albumSortTypes = e.currentTarget.value as AlbumSortTypes;
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    sortingOrder: albumSortTypes
                  }));
                  setSortingOrder(albumSortTypes);
                }}
              />
            </div>
          </div>
        )}
        <div
          className={`albums-container h-full w-full flex-grow ${!(albumsData && albumsData.length > 0) && 'hidden'}`}
        >
          {albumsData && albumsData.length > 0 && (
            <VirtualizedGrid
              data={albumsData}
              fixedItemWidth={MIN_ITEM_WIDTH}
              fixedItemHeight={MIN_ITEM_HEIGHT}
              // scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
              itemContent={(index, item) => {
                return (
                  <Album
                    index={index}
                    key={`${item.albumId}-${item.title}`}
                    selectAllHandler={selectAllHandler}
                    {...item}
                  />
                );
              }}
            />
          )}
        </div>
        {/* {albumsData && albumsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-2xl text-[#ccc]">
            <Img
              src={FetchingDataImage}
              alt="No songs available."
              className="mb-8 w-60"
            />
            <div>We&apos;re already there...</div>
          </div>
        )} */}
        {albumsData && albumsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img src={NoAlbumsImage} alt="No songs available." className="mb-8 w-60" />
            <div>{t('albumsPage.empty')}</div>
          </div>
        )}
      </>
    </MainContainer>
  );
};

export default AlbumsPage;
