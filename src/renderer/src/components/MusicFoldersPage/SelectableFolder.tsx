import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type SelectableFolderStructure } from './AddMusicFoldersPrompt';

import Img from '../Img';
import Button from '../Button';
import Checkbox from '../Checkbox';

import FolderImg from '../../assets/images/webp/empty-folder.webp';

interface Props {
  structure: SelectableFolderStructure;
  updateFolders: (state: boolean, structure: SelectableFolderStructure) => void;
}

const SelectableFolder = (props: Props) => {
  const { t } = useTranslation();

  const { structure, updateFolders } = props;
  const { isSelected, path, subFolders } = structure;

  const [isSubFoldersVisible, setIsSubFoldersVisible] = useState(false);

  const folderName = window.api.utils.getBaseName(path);

  const subFoldersComponents = useMemo(
    () =>
      structure.subFolders.map((x) => (
        <SelectableFolder key={x.path} structure={x} updateFolders={updateFolders} />
      )),
    [structure.subFolders, updateFolders]
  );

  return (
    <div className="group">
      <label
        htmlFor={`${structure.path}RevealBtn`}
        className={`bg-background-color-2 dark:bg-dark-background-color-2/50 dark:text-font-color-white mb-2 flex cursor-pointer items-center justify-between rounded-md px-2 py-4 transition-opacity ${
          !isSelected && 'opacity-30'
        }`}
      >
        <div className="flex items-center">
          <Checkbox
            className="mx-2! my-0!"
            id={structure.path}
            isChecked={structure.isSelected ?? false}
            checkedStateUpdateFunction={(state) => updateFolders(state, structure)}
          />
          <Img src={FolderImg} className="ml-2 h-8 w-8" loading="eager" />
          <div className="ml-4">
            <p className="">{folderName}</p>
            <p className="text-xs opacity-50">
              {t('common.subFolderWithCount', { count: subFolders.length })}
              <span className="mx-1">&bull;</span>
              {t('common.songWithCount', {
                count: structure.noOfSongs ?? 0
              })}
            </p>
          </div>
        </div>
        {subFolders.length > 0 && (
          <Button
            className="group-hover:bg-background-color-1 dark:group-hover:bg-dark-background-color-1 rounded-full! border-none! p-1!"
            iconClassName="text-2xl! leading-none!"
            id={`${structure.path}RevealBtn`}
            iconName={isSubFoldersVisible ? 'arrow_drop_up' : 'arrow_drop_down'}
            clickHandler={(e) => {
              e.preventDefault();
              setIsSubFoldersVisible((state) => !state);
            }}
          />
        )}
      </label>
      {subFolders.length > 0 && isSubFoldersVisible && (
        <div className="border-background-color-2 dark:border-dark-background-color-2/50 mt-1 ml-4 border-l-[3px] pl-4">
          {subFoldersComponents}
        </div>
      )}
    </div>
  );
};

export default SelectableFolder;
