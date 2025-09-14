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
    isPredictiveSearchEnabled?: boolean;
  }) => {
    const { keyword, filter, isPredictiveSearchEnabled = false, updateSearchHistory = true } = data;

    return {
      queryKey: [{ keyword }, { filter }, { isPredictiveSearchEnabled }, { updateSearchHistory }],
      queryFn: () =>
        window.api.search.search(filter, keyword, isPredictiveSearchEnabled, updateSearchHistory)
    };
  }
});
