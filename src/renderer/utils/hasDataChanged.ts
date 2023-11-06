const isAnObject = (obj: unknown): obj is Record<string, unknown> =>
  typeof obj === 'object';

const isAnArray = (obj: unknown): obj is [] => Array.isArray(obj);

const hasArrayChanged = (oldArr: unknown[], newArr: unknown[]) => {
  const isLengthEqual = newArr.length === oldArr.length;
  const arePropertiesEqual = newArr.every((newValue, index) => {
    const oldValue = oldArr[index];
    if (isAnObject(oldValue) && isAnObject(newValue)) {
      const isChanged = hasDataChanged(oldValue, newValue, true);
      return !isChanged;
    }
    return oldValue === newValue;
  });

  const isArrayDataChanged = !(isLengthEqual && arePropertiesEqual);

  return isArrayDataChanged;
};

/** Returns an object containing the properties of the input objects and and a boolean as a value stating whether those properties have changed or not.
 *@param oldObj Old object to be compared to
 *@param newObj New object to be compared to
 */

function hasDataChanged(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  returnBoolean = false,
) {
  try {
    const oldObjEntries = Object.keys(oldObj);
    const newObjEntries = Object.keys(newObj);
    const entries = [...new Set([...oldObjEntries, ...newObjEntries])];
    const comp: Record<string, unknown> = {};
    let isDataChanged = false;

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      if (entry in oldObj && entry in newObj) {
        const newObjEntry = newObj[entry];
        const oldObjEntry = oldObj[entry];
        if (isAnObject(newObjEntry) && isAnObject(oldObjEntry)) {
          // is newObj an object. This can be also an array.
          if (isAnArray(newObjEntry) && isAnArray(oldObjEntry)) {
            // newObj is an array
            const newArr = newObjEntry;
            const oldArr = oldObjEntry;
            const isArrayDataChanged = hasArrayChanged(oldArr, newArr);

            if (isArrayDataChanged) isDataChanged = true;
            comp[entry] = isArrayDataChanged;
          } else {
            // newObj is an object but not an array

            const isObjDataChanged = hasDataChanged(
              oldObjEntry,
              newObjEntry,
              true,
            ) as boolean;

            if (isObjDataChanged) isDataChanged = true;
            comp[entry] = isObjDataChanged;
          }
        } else if (newObj[entry] === oldObj[entry]) {
          comp[entry] = false;
        } else {
          isDataChanged = true;
          comp[entry] = true;
        }
      } else {
        isDataChanged = true;
        comp[entry] = true;
      }
    }

    if (returnBoolean) return isDataChanged;
    return comp;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export const isDataChanged = (
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
) => {
  const isChanged = hasDataChanged(oldObj, newObj, true);
  if (typeof isChanged === 'boolean') return isChanged;
  throw new Error(
    'hasDataChanged retuned a non boolean output eventhough returnBoolean is true.',
  );
};
export default hasDataChanged;
