const removeElementFromArray = <Type>(arr: Type[], element: Type) => {
  const indexOfElement = arr.indexOf(element);
  if (indexOfElement < 0) return arr;
  return arr.splice(indexOfElement, 1);
};

export default removeElementFromArray;
