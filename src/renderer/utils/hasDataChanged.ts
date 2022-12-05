/* eslint-disable @typescript-eslint/no-explicit-any */
const hasArrayChanged = (oldArr: unknown[], newArr: unknown[]) => {
  const isLengthEqual = newArr.length === oldArr.length;
  const arePropertiesEqual = newArr.every(
    (value, index) => value === oldArr[index]
  );

  return isLengthEqual && arePropertiesEqual;
};

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
    const comp = {} as Record<string, any>;
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      if (entry in oldObj && entry in newObj) {
        if (typeof newObj[entry] === 'object') {
          // is newObj an object. This can be also an array.
          if (Array.isArray(newObj[entry])) {
            // newObj is an array
            const newArr = newObj[entry] as [];
            const oldArr = oldObj[entry] as [];
            comp[entry] = hasArrayChanged(oldArr, newArr);
          } else {
            // newObj is an object but not an array
            const data = hasDataChanged(oldObj[entry], newObj[entry]);
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
