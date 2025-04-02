const filterUniqueObjects = <Result extends object>(
  results: Result[],
  uniqueFieldName: keyof Result
) => {
  const output = results.filter((result, index, self) => {
    if (uniqueFieldName in result) {
      const isUnique =
        self.findIndex(
          (val) => uniqueFieldName in val && val[uniqueFieldName] === result[uniqueFieldName]
        ) === index;
      return isUnique;
    }

    return false;
  });
  return output;
};

export default filterUniqueObjects;
