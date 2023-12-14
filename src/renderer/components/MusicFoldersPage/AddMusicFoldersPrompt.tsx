import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import SelectableFolder from './SelectableFolder';
import Button from '../Button';

export interface SelectableFolderStructure extends FolderStructure {
  isSelected?: boolean;
  subFolders: SelectableFolderStructure[];
}

type Props = {
  sortType?: SongSortTypes;
  onSuccess?: (data: SongData[]) => void;
  onFailure?: (reason: unknown) => void;
  onFinally?: () => void;
};

const makeStructureSelectable = (
  structure: FolderStructure,
): SelectableFolderStructure => {
  const selectableStructure = {
    ...structure,
    isSelected: true,
  } as SelectableFolderStructure;

  if (structure.subFolders.length > 0) {
    selectableStructure.subFolders = selectableStructure.subFolders.map(
      (folder) => makeStructureSelectable(folder),
    );
  }
  return selectableStructure;
};

const removeUnselectedFolders = (
  selectableFolders: SelectableFolderStructure[],
) => {
  const validFolders: FolderStructure[] = [];
  for (const folder of selectableFolders) {
    if (folder.isSelected) {
      if (folder.subFolders.length > 0) {
        const subFolders = removeUnselectedFolders(folder.subFolders);
        folder.subFolders = subFolders;
      }
      validFolders.push(folder);
    }

    delete folder.isSelected;
  }
  return validFolders;
};

const updateFolderSelectedState = (
  folders: SelectableFolderStructure[],
  state: boolean,
  folder?: SelectableFolderStructure,
) => {
  for (let i = 0; i < folders.length; i += 1) {
    if (folder === undefined || folders[i].path === folder.path) {
      folders[i].isSelected = state ?? !folders[i].isSelected;

      if (folders[i].subFolders.length > 0) {
        folders[i].subFolders = updateFolderSelectedState(
          folders[i].subFolders,
          state,
        );
      }
    } else if (folders[i].subFolders.length > 0) {
      folders[i].subFolders = updateFolderSelectedState(
        folders[i].subFolders.slice(),
        state,
        folder,
      );
    }
  }
  return folders;
};

const getAllSubDirectories = (
  folders: SelectableFolderStructure[],
): SelectableFolderStructure[] => {
  const output: SelectableFolderStructure[] = [];
  const subDirs = folders.map((folder) => folder.subFolders);

  output.push(...subDirs.flat(2));
  for (const subDir of subDirs) {
    const subSubDirs = getAllSubDirectories(subDir);
    output.push(...subSubDirs);
  }
  return output;
};

const AddMusicFoldersPrompt = (props: Props) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { sortType, onFailure, onSuccess, onFinally } = props;

  const [folders, setFolders] = React.useState<SelectableFolderStructure[]>([]);

  const getFolderInfo = React.useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void,
    ) => {
      setIsDisabled(true);
      setIsPending(true);
      window.api.folderData
        .getFolderStructures()
        .then((structures) => {
          console.log(structures);
          const selectableStructures = structures.map((structure) =>
            makeStructureSelectable(structure),
          );
          return setFolders(selectableStructures);
        })
        .finally(() => {
          setIsDisabled(false);
          setIsPending(false);
        })
        .catch((err) => console.error(err));
    },
    [],
  );

  const updateFolders = React.useCallback(
    (state: boolean, structure: SelectableFolderStructure) =>
      setFolders((data) => {
        const updatedFolders = updateFolderSelectedState(
          data.slice(),
          state,
          structure,
        );
        return updatedFolders;
      }),
    [],
  );

  const folderComponents = React.useMemo(() => {
    if (folders.length > 0) {
      return folders.map((x) => (
        <SelectableFolder
          key={x.path}
          structure={x}
          updateFolders={updateFolders}
        />
      ));
    }
    return [];
  }, [folders, updateFolders]);

  const selectedNoOfParentFolders = React.useMemo(
    () => folders.filter((x) => x.isSelected).length,
    [folders],
  );

  const selectedNoOfDirectories = React.useMemo(() => {
    const subDirs = getAllSubDirectories(folders);
    const selectedSubDirs = subDirs.filter((subDir) => subDir.isSelected);

    return selectedSubDirs.length;
  }, [folders]);

  const isAddFolderButtonDisabled = selectedNoOfParentFolders === 0;
  return (
    <div className="">
      <div className="title-container mb-4 flex items-center text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2 text-4xl">
          create_new_folder
        </span>{' '}
        {t('addMusicFoldersPrompt.title')}
      </div>
      <div className="mt-8">
        {folderComponents.length > 0 ? (
          folderComponents
        ) : (
          <div className="flex flex-col items-center justify-center pt-8">
            <div className="flex w-4/5 flex-col items-center justify-center text-center text-sm opacity-80">
              <span className="material-icons-round-outlined mb-4 text-5xl">
                folder_open
              </span>
              <p>{t('addMusicFoldersPrompt.emptyMessage1')}</p>
              <p>{t('addMusicFoldersPrompt.emptyMessage2')}</p>
            </div>
            <Button
              label={t('addMusicFoldersPrompt.chooseFolders')}
              iconName="folder"
              iconClassName="material-icons-round-outlined"
              className="!mr-0 mt-4"
              clickHandler={getFolderInfo}
            />
          </div>
        )}
      </div>
      {folders.length > 0 && (
        <div className="mt-10 flex items-center justify-end">
          <div className="folder-info-container mr-8 text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
            <span>
              {t('folder.selectedParentFolderCount', {
                count: selectedNoOfParentFolders,
              })}
            </span>
            <span className="mx-2">&bull;</span>
            <span>
              {t('folder.selectedDirectoryCount', {
                count: selectedNoOfDirectories,
              })}
            </span>
          </div>
          <div className="buttons-container flex">
            <Button
              label={t('common.cancel')}
              iconName="close"
              className="mr-4"
              clickHandler={() => changePromptMenuData(false)}
            />
            <Button
              label={t('addMusicFoldersPrompt.addSelectedFolders')}
              iconName="done"
              className="!bg-background-color-3 !text-font-color-black"
              clickHandler={(_, setIsDisabled, setIsPending) => {
                const validFolders = removeUnselectedFolders(folders);
                console.log(validFolders);

                setIsDisabled(true);
                setIsPending(true);

                window.api.audioLibraryControls
                  .addSongsFromFolderStructures(validFolders, sortType)
                  .then(onSuccess)
                  .finally(() => {
                    if (onFinally) onFinally();
                    setIsDisabled(false);
                    setIsPending(false);
                  })
                  .catch(onFailure);
                changePromptMenuData(false);
              }}
              isDisabled={isAddFolderButtonDisabled}
              tooltipLabel={
                isAddFolderButtonDisabled
                  ? t('addMusicFoldersPrompt.noFoldersSelected')
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMusicFoldersPrompt;
