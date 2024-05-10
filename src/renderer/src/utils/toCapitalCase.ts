const toCapitalCase = (string: string) => {
  const strArr = string.split(' ');
  const filteredStrArr = strArr.filter((x) => x.trim() !== '');

  return filteredStrArr
    .map((str) => {
      const arr = str.toLowerCase().split('');
      arr[0] = arr[0].toUpperCase();
      return arr.join('');
    })
    .join(' ');
};

export default toCapitalCase;
