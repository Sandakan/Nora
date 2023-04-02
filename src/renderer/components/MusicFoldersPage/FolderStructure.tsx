import React from 'react';
import Img from '../Img';
import { SelectableFolderStructure } from './AddMusicFolderPrompt';
import FolderImg from '../../../../assets/images/webp/empty-folder.webp';
import Button from '../Button';
import Checkbox from '../Checkbox';

interface Props {
  structure: SelectableFolderStructure;
  updateFolders: (
    _callback: (
      _data: SelectableFolderStructure[]
    ) => SelectableFolderStructure[]
  ) => void;
}

const updateFolderSelectedState = (
  folders: SelectableFolderStructure[],
  state: boolean,
  folder?: SelectableFolderStructure
) => {
  for (let i = 0; i < folders.length; i += 1) {
    if (folder === undefined || folders[i].path === folder.path) {
      folders[i].isSelected = state ?? !folders[i].isSelected;

      if (folders[i].subFolders.length > 0) {
        folders[i].subFolders = updateFolderSelectedState(
          folders[i].subFolders,
          state
        );
      }
    } else if (folders[i].subFolders.length > 0) {
      folders[i].subFolders = updateFolderSelectedState(
        folders[i].subFolders,
        state,
        folder
      );
    }
  }
  return folders;
};

const FolderStructure = (props: Props) => {
  const { structure, updateFolders } = props;
  const { isSelected, path, subFolders } = structure;

  const [isSubFoldersVisible, setIsSubFoldersVisible] = React.useState(false);

  const folderName = window.api.getBaseName(path);

  const subFoldersComponents = React.useMemo(
    () =>
      structure.subFolders.map((x) => (
        <FolderStructure
          key={x.path}
          structure={x}
          updateFolders={updateFolders}
        />
      )),
    [structure.subFolders, updateFolders]
  );

  return (
    <div className={`${!isSelected && 'opacity-30'}`}>
      <div className="mb-2 flex cursor-pointer items-center justify-between rounded-md bg-background-color-2 px-2 py-4 dark:bg-dark-background-color-2/50">
        <div className="flex items-center">
          <Checkbox
            className="!mx-2 !my-0"
            id={structure.path}
            isChecked={structure.isSelected}
            checkedStateUpdateFunction={(state) =>
              updateFolders((data) => {
                const arr = updateFolderSelectedState(data, state, structure);
                return arr;
              })
            }
          />
          <Img src={FolderImg} className="ml-2 h-8 w-8" />
          <div className="ml-4">
            <p className="">{folderName}</p>
            <p className=" text-xs opacity-50">
              {subFolders.length} sub-folders
            </p>
          </div>
        </div>
        {subFolders.length > 0 && (
          <Button
            className="!rounded-full !border-none bg-background-color-1 !p-1 dark:bg-dark-background-color-1"
            iconClassName="!text-2xl !leading-none"
            iconName={isSubFoldersVisible ? 'arrow_drop_up' : 'arrow_drop_down'}
            clickHandler={() => setIsSubFoldersVisible((state) => !state)}
          />
        )}
      </div>
      {subFolders.length > 0 && isSubFoldersVisible && (
        <div className="ml-4 mt-1 border-l-[3px] border-background-color-2 pl-4 dark:border-dark-background-color-2/50">
          {subFoldersComponents}
        </div>
      )}
    </div>
  );
};

export default FolderStructure;
