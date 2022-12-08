// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterUniqueObjects = <Result extends Record<string, any>>(
  results: Result[],
  uniqueFieldName: keyof Result
) => {
  const output = results.filter((result, index, self) => {
    if (uniqueFieldName in result) {
      const isUnique =
        self.findIndex(
          (val) =>
            uniqueFieldName in val &&
            val[uniqueFieldName] === result[uniqueFieldName]
        ) === index;
      return isUnique;
    }

    return false;
  });
  return output;
};

export default filterUniqueObjects;
