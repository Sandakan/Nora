/* eslint-disable @typescript-eslint/no-explicit-any */
const hasArrayChanged = (oldArr: unknown[], newArr: unknown[]) => {
  const isLengthEqual = newArr.length === oldArr.length;
  const arePropertiesEqual = newArr.every(
    (value, index) => value === oldArr[index]
  );

  return isLengthEqual && arePropertiesEqual;
};

const isAnObject = (obj: unknown): obj is Record<string, unknown> =>
  typeof obj === 'object';

const isAnArray = (obj: unknown): obj is [] => Array.isArray(obj);

/** Returns an object containing the properties of the input objects and and a boolean as a value stating whether those properties have changed or not.
 *@param oldObj Old object to be compared to
 *@param newObj New object to be compared to
 */

const hasDataChanged = (
  oldObj: Record<string, any>,
  newObj: Record<string, any>
) => {
  try {
    const oldObjEntries = Object.keys(oldObj);
    const newObjEntries = Object.keys(newObj);
    const entries = [...new Set([...oldObjEntries, ...newObjEntries])];
    const comp: Record<string, unknown> = {};
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
            comp[entry] = hasArrayChanged(oldArr, newArr);
          } else {
            // newObj is an object but not an array
            const data = hasDataChanged(oldObjEntry, newObjEntry);
            comp[entry] = Object.values(data).every((x: boolean) => x);
          }
        } else if (newObj[entry] === oldObj[entry]) {
          comp[entry] = true;
        } else comp[entry] = false;
      } else comp[entry] = false;
    }
    return comp;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export default hasDataChanged;
