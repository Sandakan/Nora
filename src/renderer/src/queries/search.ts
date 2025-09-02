import { createQueryKeys } from '@lukemorales/query-key-factory';

export const searchQuery = createQueryKeys('search', {
  recentResults: {
    queryKey: null,
    queryFn: () => window.api.userData.getUserData().then((data) => data.recentSearches)
  }
});
