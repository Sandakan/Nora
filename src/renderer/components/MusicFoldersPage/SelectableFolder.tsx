import React from 'react';
import Img from '../Img';
import { SelectableFolderStructure } from './AddMusicFoldersPrompt';
import FolderImg from '../../../../assets/images/webp/empty-folder.webp';
import Button from '../Button';
import Checkbox from '../Checkbox';

interface Props {
  structure: SelectableFolderStructure;
  updateFolders: (state: boolean, structure: SelectableFolderStructure) => void;
}

const SelectableFolder = (props: Props) => {
  const { structure, updateFolders } = props;
  const { isSelected, path, subFolders } = structure;

  const [isSubFoldersVisible, setIsSubFoldersVisible] = React.useState(false);

  const folderName = window.api.getBaseName(path);

  const subFoldersComponents = React.useMemo(
    () =>
      structure.subFolders.map((x) => (
        <SelectableFolder
          key={x.path}
          structure={x}
          updateFolders={updateFolders}
        />
      )),
    [structure.subFolders, updateFolders]
  );

  return (
    <div className="group">
      <label
        htmlFor={`${structure.path}RevealBtn`}
        className={`mb-2 flex cursor-pointer items-center justify-between rounded-md bg-background-color-2 px-2 py-4 transition-opacity dark:bg-dark-background-color-2/50 dark:text-font-color-white ${
          !isSelected && 'opacity-30'
        }`}
      >
        <div className="flex items-center">
          <Checkbox
            className="!mx-2 !my-0"
            id={structure.path}
            isChecked={structure.isSelected ?? false}
            checkedStateUpdateFunction={(state) =>
              updateFolders(state, structure)
            }
          />
          <Img src={FolderImg} className="ml-2 h-8 w-8" />
          <div className="ml-4">
            <p className="">{folderName}</p>
            <p className=" text-xs opacity-50">
              {subFolders.length} sub-folders &bull; {structure.noOfSongs ?? 0}{' '}
              songs
            </p>
          </div>
        </div>
        {subFolders.length > 0 && (
          <Button
            className="!rounded-full !border-none !p-1 group-hover:bg-background-color-1 dark:group-hover:bg-dark-background-color-1"
            iconClassName="!text-2xl !leading-none"
            id={`${structure.path}RevealBtn`}
            iconName={isSubFoldersVisible ? 'arrow_drop_up' : 'arrow_drop_down'}
            clickHandler={() => setIsSubFoldersVisible((state) => !state)}
          />
        )}
      </label>
      {subFolders.length > 0 && isSubFoldersVisible && (
        <div className="ml-4 mt-1 border-l-[3px] border-background-color-2 pl-4 dark:border-dark-background-color-2/50">
          {subFoldersComponents}
        </div>
      )}
    </div>
  );
};

export default SelectableFolder;
