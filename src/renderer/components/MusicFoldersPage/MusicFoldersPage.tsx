/* eslint-disable no-unused-vars */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import Button from '../Button';
import Dropdown, { DropdownOption } from '../Dropdown';
import Img from '../Img';
import MainContainer from '../MainContainer';
import Folder from './Folder';

import NoFoldersImage from '../../../../assets/images/svg/Empty Inbox _Monochromatic.svg';

const folderDropdownOptions: DropdownOption<FolderSortTypes>[] = [
  { label: 'A to Z', value: 'aToZ' },
  { label: 'Z to A', value: 'zToA' },
  { label: 'High Song Count', value: 'noOfSongsDescending' },
  { label: 'Low Song Count', value: 'noOfSongsAscending' },
  { label: 'Blacklisted Folders', value: 'blacklistedFolders' },
  { label: 'Whitelisted Folders', value: 'whitelistedFolders' },
];

const MusicFoldersPage = () => {
  const {
    isMultipleSelectionEnabled,
    currentlyActivePage,
    multipleSelectionsData,
  } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData, toggleMultipleSelections } =
    React.useContext(AppUpdateContext);
  const [musicFolders, setMusicFolders] = React.useState<MusicFolder[]>([]);
  const [sortingOrder, setSortingOrder] =
    React.useState<FolderSortTypes>('aToZ');

  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);

  const foldersContainerRef = React.useRef(null as HTMLDivElement | null);
  const { width, height } = useResizeObserver(foldersContainerRef);

  const fetchFoldersData = React.useCallback(
    () =>
      window.api
        .getFolderData([], sortingOrder)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) return setMusicFolders(res);
          return undefined;
        })
        .catch((err) => console.error(err)),
    [sortingOrder]
  );

  React.useEffect(() => {
    fetchFoldersData();
    const manageFolderDataUpdatesInMusicFoldersPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'userData/musicFolder' ||
            event.dataType === 'blacklist/folderBlacklist' ||
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong'
          )
            fetchFoldersData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageFolderDataUpdatesInMusicFoldersPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageFolderDataUpdatesInMusicFoldersPage
      );
    };
  }, [fetchFoldersData]);

  const addNewFolder = React.useCallback(
    (
      _: unknown,
      isDisabled: (state: boolean) => void,
      isPending: (state: boolean) => void
    ) => {
      isDisabled(true);
      isPending(true);
      return window.api
        .addMusicFolder()
        .then((res) => console.log(res))
        .catch((err) => console.error(err))
        .finally(() => {
          isDisabled(false);
          isPending(false);
        });
    },
    []
  );

  const folders = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const folder = musicFolders[index];
      return (
        <div style={style} key={index}>
          <Folder
            key={index}
            folderPath={folder.folderData.path}
            songIds={folder.songIds}
            index={index}
            isBlacklisted={folder.isBlacklisted}
          />
        </div>
      );
    },
    [musicFolders]
  );

  return (
    <MainContainer className="music-folders-page appear-from-bottom !h-full pr-4 !pb-0">
      <>
        <div className="title-container mt-2 mb-8 flex items-center justify-between text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          <div className="container flex">
            Music Folders{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
              {isMultipleSelectionEnabled ? (
                <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                  {multipleSelectionsData.multipleSelections.length} selections
                </div>
              ) : (
                musicFolders.length > 0 && (
                  <span className="no-of-folders">{`${
                    musicFolders.length
                  } folder${musicFolders.length === 1 ? '' : 's'}`}</span>
                )
              )}
            </div>
          </div>
          {musicFolders.length > 0 && (
            <div className="other-controls-container flex text-sm">
              <Button
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={
                  isMultipleSelectionEnabled ? 'remove_done' : 'checklist'
                }
                clickHandler={() =>
                  toggleMultipleSelections(
                    !isMultipleSelectionEnabled,
                    'folder'
                  )
                }
                tooltipLabel={
                  isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
                }
              />
              <Button
                label="Add new Folder"
                iconName="create_new_folder"
                pendingAnimationOnDisabled
                iconClassName="material-icons-round-outlined"
                clickHandler={(_, isDisabled, isPending) => {
                  isDisabled(true);
                  isPending(true);
                  return window.api
                    .addMusicFolder()
                    .then((res) => console.log(res))
                    .catch((err) => console.error(err))
                    .finally(() => {
                      isDisabled(false);
                      isPending(false);
                    });
                }}
              />
              <Dropdown
                name="genreSortDropdown"
                value={sortingOrder}
                options={folderDropdownOptions}
                onChange={(e) => {
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    sortingOrder: e.currentTarget.value as ArtistSortTypes,
                  }));
                  setSortingOrder(e.currentTarget.value as GenreSortTypes);
                }}
              />
            </div>
          )}
        </div>

        <div className="folders-container h-full" ref={foldersContainerRef}>
          {musicFolders && musicFolders.length > 0 && (
            <List
              itemCount={musicFolders.length}
              itemSize={75}
              width={width || '100%'}
              height={height || 450}
              overscanCount={10}
              initialScrollOffset={
                currentlyActivePage.data?.scrollTopOffset ?? 0
              }
              onScroll={(data) => {
                if (scrollOffsetTimeoutIdRef.current)
                  clearTimeout(scrollOffsetTimeoutIdRef.current);
                if (!data.scrollUpdateWasRequested && data.scrollOffset !== 0)
                  scrollOffsetTimeoutIdRef.current = setTimeout(
                    () =>
                      updateCurrentlyActivePageData((currentPageData) => ({
                        ...currentPageData,
                        scrollTopOffset: data.scrollOffset,
                      })),
                    500
                  );
              }}
            >
              {folders}
            </List>
          )}
        </div>

        {musicFolders.length === 0 && (
          <div className="no-folders-container flex h-full flex-col items-center justify-center text-lg">
            <Img src={NoFoldersImage} className="w-60" />
            <br />
            <p>No Folders added to the library.</p>
            <Button
              label="Add new Folder"
              className="mt-4 rounded-md !bg-background-color-3 px-8 text-lg text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:text-font-color-black dark:hover:border-background-color-3"
              iconName="create_new_folder"
              pendingAnimationOnDisabled
              iconClassName="material-icons-round-outlined"
              clickHandler={addNewFolder}
            />
          </div>
        )}
      </>
    </MainContainer>
  );
};

export default MusicFoldersPage;
