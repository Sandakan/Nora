const isAnObject = (obj: unknown): obj is Record<string, unknown> => typeof obj === 'object';

const isAnArray = (obj: unknown): obj is [] => Array.isArray(obj);

const hasArrayChanged = (oldArr: unknown[], newArr: unknown[]) => {
  const isLengthEqual = newArr.length === oldArr.length;
  const arePropertiesEqual = newArr.every((newValue, index) => {
    const oldValue = oldArr[index];
    if (isAnObject(oldValue) && isAnObject(newValue)) {
      const hasChanged = hasDataChanged(oldValue, newValue);
      const isChanged = Object.values(hasChanged).some((value) => value.isModified);

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

type ModifiedData = { isModified: boolean; prev: unknown; current: unknown };

function hasDataChanged(oldObj: object, newObj: object) {
  const comp: Record<string, ModifiedData> = {};

  try {
    const oldObjEntries = Object.keys(oldObj);
    const newObjEntries = Object.keys(newObj);
    const entries = [...new Set([...oldObjEntries, ...newObjEntries])];

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

            comp[entry] = { isModified: isArrayDataChanged, prev: oldArr, current: newArr };
          } else {
            // newObj is an object but not an array

            const hasObjDataChanged = hasDataChanged(oldObjEntry, newObjEntry);
            const isObjDataChanged = Object.values(hasObjDataChanged).some(
              (value) => value.isModified
            );

            comp[entry] = { isModified: isObjDataChanged, prev: oldObjEntry, current: newObjEntry };
          }
        } else if (newObj[entry] === oldObj[entry]) {
          comp[entry] = { isModified: false, prev: oldObj[entry], current: newObj[entry] };
        } else {
          comp[entry] = { isModified: true, prev: oldObj[entry], current: newObj[entry] };
        }
      } else {
        comp[entry] = { isModified: true, prev: oldObj[entry], current: newObj[entry] };
      }
    }

    return comp;
  } catch (error) {
    console.error(error);
    return comp;
  }
}

export const isDataChanged = <T extends object>(oldObj: T, newObj: T) => {
  const hasChanged = hasDataChanged(oldObj, newObj);
  const isChanged = Object.values(hasChanged).some((value) => value.isModified);

  if (typeof isChanged === 'boolean') return isChanged;
  throw new Error('hasDataChanged retuned a non boolean output eventhough returnBoolean is true.');
};
export default hasDataChanged;
