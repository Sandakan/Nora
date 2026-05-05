import { createQueryKeys } from '@lukemorales/query-key-factory';

export const searchQuery = createQueryKeys('search', {
  recentResults: {
    queryKey: null,
    queryFn: () => window.api.userData.getUserData().then((data) => data.recentSearches)
  },
  query: (data: {
    keyword: string;
    filter: SearchFilters;
    updateSearchHistory?: boolean;
    isSimilaritySearchEnabled?: boolean;
  }) => {
    const { keyword, filter, isSimilaritySearchEnabled = false, updateSearchHistory = true } = data;

    return {
      queryKey: [{ keyword }, { filter }, { isSimilaritySearchEnabled }, { updateSearchHistory }],
      queryFn: () =>
        window.api.search.search(filter, keyword, updateSearchHistory, isSimilaritySearchEnabled)
    };
  }
});
