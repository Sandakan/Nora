import { useCallback, useContext } from 'react';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import { useStore } from '@tanstack/react-store';
import { store } from '../store/store';

const slice = (arr: number[], start: number, end: number) => {
  if (start > end) {
    return arr.slice(end, start + 1).reverse();
  }
  return arr.slice(start, end + 1);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useSelectAllHandler = <Obj extends Record<string, any>>(
  arr: Obj[],
  selectionType: QueueTypes,
  idProperty: keyof Obj
) => {
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);

  const { toggleMultipleSelections } = useContext(AppUpdateContext);

  const selectAllHandler = useCallback(
    (upToId?: number) => {
      const getItemFromIndex = (id?: number) => {
        if (id !== undefined) {
          for (let x = 0; x < arr.length; x += 1) {
            if (arr[x][idProperty] === id) return x;
          }
        }
        return undefined;
      };

      const ids: number[] = multipleSelectionsData.multipleSelections;
      if (upToId !== undefined) {
        if (multipleSelectionsData.multipleSelections.length > 0) {
          const currIndex = getItemFromIndex(upToId);
          const lastAddedId = multipleSelectionsData.multipleSelections.at(-1);

          const lastAddedIndex = getItemFromIndex(lastAddedId);

          if (lastAddedIndex !== undefined && currIndex !== undefined) {
            const selectedIds = slice(
              arr.map((prop) => prop[idProperty] as number),
              lastAddedIndex,
              currIndex
            );
            ids.push(...selectedIds);
          }
        } else ids.push(upToId);
      } else {
        const selectedIds = arr.map((prop) => prop[idProperty] as number);
        if (selectedIds.length !== multipleSelectionsData.multipleSelections.length)
          ids.push(...selectedIds);
      }

      const uniqueIds = new Set(ids);
      toggleMultipleSelections(true, selectionType, [...uniqueIds], true);
    },
    [
      arr,
      idProperty,
      multipleSelectionsData.multipleSelections,
      selectionType,
      toggleMultipleSelections
    ]
  );

  return selectAllHandler;
};

export default useSelectAllHandler;
