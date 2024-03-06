import React from 'react';
import { useTranslation } from 'react-i18next';
// import { FixedSizeList as List } from 'react-window';
// import useResizeObserver from '../../hooks/useResizeObserver';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import storage from '../../utils/localStorage';
import i18n from '../../i18n';

import Button from '../Button';
import Dropdown, { DropdownOption } from '../Dropdown';
import Img from '../Img';
import MainContainer from '../MainContainer';
import AddMusicFoldersPrompt from './AddMusicFoldersPrompt';
import Folder from './Folder';

import NoFoldersImage from '../../../../assets/images/svg/Empty Inbox _Monochromatic.svg';

const folderDropdownOptions: DropdownOption<FolderSortTypes>[] = [
  { label: i18n.t('sortTypes.aToZ'), value: 'aToZ' },
  { label: i18n.t('sortTypes.zToA'), value: 'zToA' },
  {
    label: i18n.t('sortTypes.noOfSongsDescending'),
    value: 'noOfSongsDescending',
  },
  {
    label: i18n.t('sortTypes.noOfSongsAscending'),
    value: 'noOfSongsAscending',
  },
  {
    label: i18n.t('sortTypes.blacklistedFolders'),
    value: 'blacklistedFolders',
  },
  {
    label: i18n.t('sortTypes.whitelistedFolders'),
    value: 'whitelistedFolders',
  },
];

const MusicFoldersPage = () => {
  const {
    isMultipleSelectionEnabled,
    // currentlyActivePage,
    multipleSelectionsData,
    currentlyActivePage,
    localStorageData,
  } = React.useContext(AppContext);
  const {
    updateCurrentlyActivePageData,
    toggleMultipleSelections,
    changePromptMenuData,
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [musicFolders, setMusicFolders] = React.useState<MusicFolder[]>([]);
  const [sortingOrder, setSortingOrder] = React.useState<FolderSortTypes>(
    currentlyActivePage?.data?.sortingOrder ||
      localStorageData?.sortingStates?.musicFoldersPage ||
      'aToZ',
  );

  // const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const foldersContainerRef = React.useRef(null as HTMLDivElement | null);
  // const { width, height } = useResizeObserver(foldersContainerRef);

  const fetchFoldersData = React.useCallback(
    () =>
      window.api.folderData
        .getFolderData([], sortingOrder)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) return setMusicFolders(res);
          return undefined;
        })
        .catch((err) => console.error(err)),
    [sortingOrder],
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
      manageFolderDataUpdatesInMusicFoldersPage,
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageFolderDataUpdatesInMusicFoldersPage,
      );
    };
  }, [fetchFoldersData]);

  React.useEffect(() => {
    storage.sortingStates.setSortingStates('musicFoldersPage', sortingOrder);
  }, [sortingOrder]);

  const musicFoldersWithPaths = React.useMemo(
    () => musicFolders.map((x) => ({ ...x, folderPath: x.path })),
    [musicFolders],
  );

  const selectAllHandler = useSelectAllHandler(
    musicFoldersWithPaths,
    'folder',
    'folderPath',
  );

  // const folders = React.useCallback(
  //   (props: { index: number; style: React.CSSProperties }) => {
  //     const { index, style } = props;
  //     const { path, songIds, isBlacklisted, subFolders } = musicFolders[index];

  // return (
  //   <div style={style}>
  //     <Folder
  //       key={path}
  //       folderPath={path}
  //       subFolders={subFolders}
  //       index={index}
  //       isBlacklisted={isBlacklisted}
  //       songIds={songIds}
  //       selectAllHandler={selectAllHandler}
  //     />
  //   </div>
  // );
  //   },
  //   [musicFolders, selectAllHandler]
  // );

  const folderComponents = React.useMemo(() => {
    return musicFolders.map((musicFolder, index) => {
      const { path, songIds, isBlacklisted, subFolders } = musicFolder;
      return (
        <Folder
          key={path}
          folderPath={path}
          subFolders={subFolders}
          index={index}
          isBlacklisted={isBlacklisted}
          songIds={songIds}
          selectAllHandler={selectAllHandler}
        />
      );
    });
  }, [musicFolders, selectAllHandler]);

  const addNewFolder = React.useCallback(() => {
    changePromptMenuData(
      true,
      <AddMusicFoldersPrompt onFailure={(err) => console.error(err)} />,
    );
  }, [changePromptMenuData]);

  const importAppData = React.useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void,
    ) => {
      setIsDisabled(true);
      setIsPending(true);

      return window.api.settingsHelpers
        .importAppData()
        .then((res) => {
          if (res) storage.setAllItems(res);
          return undefined;
        })
        .finally(() => {
          setIsDisabled(false);
          setIsPending(false);
        })
        .catch((err) => console.error(err));
    },
    [],
  );

  return (
    <MainContainer
      className="music-folders-page appear-from-bottom relative !h-full !pb-0 !pr-4"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        {musicFolders && musicFolders.length > 0 && (
          <div className="title-container mb-8 mt-2 flex items-center justify-between text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
            <div className="container flex">
              {t('foldersPage.musicFolders')}
              <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
                {isMultipleSelectionEnabled ? (
                  <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                    {t('common.selectionWithCount', {
                      count: multipleSelectionsData.multipleSelections.length,
                    })}
                  </div>
                ) : (
                  musicFolders.length > 0 && (
                    <span className="no-of-folders">
                      {t('common.folderWithCount', {
                        count: musicFolders.length,
                      })}
                    </span>
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
                      'folder',
                    )
                  }
                  tooltipLabel={t(
                    `common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`,
                  )}
                />
                <Button
                  label={t('foldersPage.addFolder')}
                  iconName="create_new_folder"
                  pendingAnimationOnDisabled
                  iconClassName="material-icons-round-outlined"
                  clickHandler={addNewFolder}
                />
                <Dropdown
                  name="folderSortDropdown"
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
        )}

        <div
          className={`folders-container [scrollbar-gutter:stable] ${
            musicFolders && musicFolders.length > 0 && 'h-full'
          }`}
          ref={foldersContainerRef}
        >
          {folderComponents}
          {/* {musicFolders && musicFolders.length > 0 && (
            <List
              className="appear-from-bottom h-full delay-100"
              itemCount={musicFolders.length}
              itemSize={70}
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
          )} */}
        </div>

        {musicFolders.length === 0 && (
          <div className="no-folders-container flex h-full flex-col items-center justify-center text-lg text-font-color-black dark:text-font-color-white">
            <Img src={NoFoldersImage} className="w-60" />
            <br />
            <p> {t('foldersPage.empty')}</p>

            <div className="flex items-center justify-between">
              <Button
                label={t('foldersPage.addFolder')}
                className="mt-4 !bg-background-color-3 px-8 text-lg !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:text-font-color-black dark:hover:border-background-color-3"
                iconName="create_new_folder"
                pendingAnimationOnDisabled
                iconClassName="material-icons-round-outlined"
                clickHandler={addNewFolder}
              />
              <Button
                label={t('settingsPage.importAppData')}
                iconName="upload"
                className="mt-4 !bg-background-color-3 px-8 text-lg !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
                clickHandler={importAppData}
              />
            </div>
          </div>
        )}
      </>
    </MainContainer>
  );
};

export default MusicFoldersPage;
