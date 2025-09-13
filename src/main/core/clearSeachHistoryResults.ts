import { getUserSettings, saveUserSettings } from '@main/db/queries/settings';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const clearSearchHistoryResults = async (resultsToRemove = [] as string[]) => {
  logger.debug(
    `User request to remove ${
      resultsToRemove.length > 0 ? resultsToRemove.length : 'all'
    } results from the search history.`
  );
  const { recentSearches } = await getUserSettings();
  if (Array.isArray(recentSearches)) {
    if (recentSearches.length === 0) return true;
    if (resultsToRemove.length === 0) await saveUserSettings({ recentSearches: [] });
    else {
      const updatedRecentSearches = recentSearches.filter(
        (recentSearch) => !resultsToRemove.some((result) => recentSearch === result)
      );
      await saveUserSettings({ recentSearches: updatedRecentSearches });
    }
  }
  dataUpdateEvent('userData/recentSearches');
  logger.debug('Finished the cleaning process of the search history.');
  return true;
};

export default clearSearchHistoryResults;
