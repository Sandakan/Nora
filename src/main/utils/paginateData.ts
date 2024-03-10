function paginateData<DataType extends unknown, SortingType extends string>(
  data: DataType[],
  sortType: SortingType,
  paginationData?: PaginatingData
) {
  const result: PaginatedResult<DataType, SortingType> = {
    data,
    total: data.length,
    sortType,
    start: 0,
    end: data.length
  };

  if (paginationData) {
    const { end, start } = paginationData;

    result.start = start;
    result.end = end;

    result.data = data.slice(start, end);
  }

  return result;
}

export default paginateData;
