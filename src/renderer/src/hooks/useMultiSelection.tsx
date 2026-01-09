import { useCallback } from 'react';
import { dispatch, store } from '../store/store';

export interface UseMultiSelectionReturn {
  updateMultipleSelections: (id: number, selectionType: QueueTypes, type: 'add' | 'remove') => void;
  toggleMultipleSelections: (
    isEnabled?: boolean,
    selectionType?: QueueTypes,
    addSelections?: number[],
    replaceSelections?: boolean
  ) => void;
}

/**
 * Hook for managing multiple selection state.
 *
 * Provides functions to add/remove individual selections and toggle the
 * multi-selection mode on/off. Used when selecting multiple songs, albums,
 * artists, etc. for batch operations.
 *
 * @example
 * ```tsx
 * function ItemList() {
 *   const { updateMultipleSelections, toggleMultipleSelections } = useMultiSelection();
 *
 *   const handleSelect = (id: string) => {
 *     updateMultipleSelections(id, 'SONGS', 'add');
 *   };
 *
 *   const handleEnableMultiSelect = () => {
 *     toggleMultipleSelections(true, 'SONGS');
 *   };
 * }
 * ```
 *
 * @returns Multi-selection management functions
 */
export function useMultiSelection(): UseMultiSelectionReturn {
  const updateMultipleSelections = useCallback(
    (id: number, selectionType: QueueTypes, type: 'add' | 'remove') => {
      // Prevent changing selection type mid-selection
      if (
        store.state.multipleSelectionsData.selectionType &&
        selectionType !== store.state.multipleSelectionsData.selectionType
      )
        return;

      let { multipleSelections } = store.state.multipleSelectionsData;

      if (type === 'add') {
        // Don't add if already selected
        if (multipleSelections.includes(id)) return;
        multipleSelections.push(id);
      } else if (type === 'remove') {
        // Don't remove if not selected
        if (!multipleSelections.includes(id)) return;
        multipleSelections = multipleSelections.filter((selection) => selection !== id);
      }

      dispatch({
        type: 'UPDATE_MULTIPLE_SELECTIONS_DATA',
        data: {
          ...store.state.multipleSelectionsData,
          selectionType,
          multipleSelections: [...multipleSelections]
        } as MultipleSelectionData
      });
    },
    []
  );

  const toggleMultipleSelections = useCallback(
    (
      isEnabled?: boolean,
      selectionType?: QueueTypes,
      addSelections?: number[],
      replaceSelections = false
    ) => {
      const updatedSelectionData = store.state.multipleSelectionsData;

      if (typeof isEnabled === 'boolean') {
        updatedSelectionData.selectionType = selectionType;

        // Add initial selections if provided and enabling
        if (Array.isArray(addSelections) && isEnabled === true) {
          if (replaceSelections) {
            updatedSelectionData.multipleSelections = addSelections;
          } else {
            updatedSelectionData.multipleSelections.push(...addSelections);
          }
        }

        // Clear selections when disabling
        if (isEnabled === false) {
          updatedSelectionData.multipleSelections = [];
          updatedSelectionData.selectionType = undefined;
        }

        updatedSelectionData.isEnabled = isEnabled;

        dispatch({
          type: 'UPDATE_MULTIPLE_SELECTIONS_DATA',
          data: {
            ...updatedSelectionData
          } as MultipleSelectionData
        });
      }
    },
    []
  );

  return {
    updateMultipleSelections,
    toggleMultipleSelections
  };
}
