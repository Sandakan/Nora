import { useContext, useMemo } from 'react';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import Checkbox from './Checkbox';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

type Props = {
  id: string;
  selectionType: QueueTypes;
  className?: string;
};

const MultipleSelectionCheckbox = (props: Props) => {
  const { id, selectionType, className = '' } = props;
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);

  const { updateMultipleSelections } = useContext(AppUpdateContext);

  const isChecked = useMemo(() => {
    if (multipleSelectionsData.selectionType !== selectionType) return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (multipleSelectionsData.multipleSelections.some((selectionId) => selectionId === id))
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
      className={`peer-checked:[&>.checkmark]:shadow-lg! dark:peer-checked:[&>.checkmark]:border-font-color-highlight! dark:peer-checked:[&>.checkmark]:bg-font-color-highlight! dark:peer-checked:[&>.checkmark]:text-font-color-highlight! ${
        multipleSelectionsData.isEnabled ? '' : 'hidden'
      } !m-0 ${className}`}
    />
  );
};

export default MultipleSelectionCheckbox;
