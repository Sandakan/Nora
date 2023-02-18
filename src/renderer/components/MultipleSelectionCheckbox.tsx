import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Checkbox from './Checkbox';

type Props = {
  id: string;
  selectionType: QueueTypes;
  className?: string;
};

const MultipleSelectionCheckbox = (props: Props) => {
  const { id, selectionType, className = '' } = props;
  const { multipleSelectionsData } = useContext(AppContext);
  const { updateMultipleSelections } = useContext(AppUpdateContext);

  const isChecked = React.useMemo(() => {
    if (multipleSelectionsData.selectionType !== selectionType) return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (
      multipleSelectionsData.multipleSelections.some(
        (selectionId) => selectionId === id
      )
    )
      return true;
    return false;
  }, [id, multipleSelectionsData, selectionType]);

  return (
    <Checkbox
      id={id}
      isChecked={isChecked}
      checkedStateUpdateFunction={(state) =>
        updateMultipleSelections(id, selectionType, state ? 'remove' : 'add')
      }
      className={` [&>.checkmark]:peer-checked:!shadow-lg [&>.checkmark]:dark:peer-checked:!border-font-color-highlight [&>.checkmark]:dark:peer-checked:!bg-font-color-highlight [&>.checkmark]:dark:peer-checked:!text-font-color-highlight  ${
        multipleSelectionsData.isEnabled ? '' : 'hidden'
      } !m-0 ${className}`}
    />
  );
};

export default MultipleSelectionCheckbox;
