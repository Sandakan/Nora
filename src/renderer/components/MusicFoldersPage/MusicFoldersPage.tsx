/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';
import Dropdown from '../Dropdown';
import MainContainer from '../MainContainer';
import Folder from './Folder';

const MusicFoldersPage = () => {
  const { updateCurrentlyActivePageData } = React.useContext(AppUpdateContext);
  const [musicFolders, setMusicFolders] = React.useState<MusicFolder[]>([]);
  const [sortingOrder, setSortingOrder] =
    React.useState<FolderSortTypes>('aToZ');

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
          if (event.dataType === 'userData/musicFolder') fetchFoldersData();
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

  const musicFolderComponents = React.useMemo(() => {
    if (musicFolders.length > 0) {
      return musicFolders.map((folder, index) => {
        return (
          <Folder
            key={index}
            folderPath={folder.folderData.path}
            songIds={folder.songIds}
          />
        );
      });
    }
    return [];
  }, [musicFolders]);

  return (
    <MainContainer className="music-folders-page appear-from-bottom pr-4">
      <>
        <div className="title-container mt-2 mb-8 flex items-center justify-between text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          Music Folders
          <div className="other-controls-container flex text-sm">
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
              options={[
                { label: 'A to Z', value: 'aToZ' },
                { label: 'Z to A', value: 'zToA' },
                { label: 'High Song Count', value: 'noOfSongsDescending' },
                { label: 'Low Song Count', value: 'noOfSongsAscending' },
              ]}
              onChange={(e) => {
                updateCurrentlyActivePageData((currentData) => ({
                  ...currentData,
                  sortingOrder: e.currentTarget.value as ArtistSortTypes,
                }));
                setSortingOrder(e.currentTarget.value as GenreSortTypes);
              }}
            />
          </div>
        </div>

        <div className="folders-container">{musicFolderComponents}</div>
      </>
    </MainContainer>
  );
};

export default MusicFoldersPage;
