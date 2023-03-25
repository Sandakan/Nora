import React from 'react';
import FolderStructure from './FolderStructure';

export interface SelectableFolderStructure extends FolderStructure {
  isSelected: boolean;
  subFolders: SelectableFolderStructure[];
}

const makeStructureSelectable = (
  structure: FolderStructure
): SelectableFolderStructure => {
  const selectableStructure = {
    ...structure,
    isSelected: true,
  } as SelectableFolderStructure;

  if (structure.subFolders.length > 0) {
    selectableStructure.subFolders = selectableStructure.subFolders.map(
      (folder) => makeStructureSelectable(folder)
    );
  }
  return selectableStructure;
};

const AddMusicFolderPrompt = () => {
  const [folders, setFolders] = React.useState<SelectableFolderStructure[]>([]);

  React.useEffect(() => {
    window.api
      .getFolderInfo()
      .then((res) => {
        const selectableStructure = makeStructureSelectable(res);
        return setFolders([selectableStructure]);
      })
      .catch((err) => console.error(err));
  }, []);

  const updateFolders = React.useCallback(
    (
      callback: (
        _data: SelectableFolderStructure[]
      ) => SelectableFolderStructure[]
    ) => setFolders((data) => callback(data)),
    []
  );

  const folderComponents = React.useMemo(() => {
    if (folders.length > 0) {
      return folders.map((x) => (
        <FolderStructure structure={x} updateFolders={updateFolders} />
      ));
    }
    return [];
  }, [folders, updateFolders]);

  return <div>{folderComponents}</div>;
};

export default AddMusicFolderPrompt;
