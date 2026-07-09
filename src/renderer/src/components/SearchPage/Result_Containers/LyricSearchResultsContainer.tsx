import { store } from '@renderer/store/store';
import { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import Button from '../../Button';
import SecondaryContainer from '../../SecondaryContainer';
import Song from '../../SongsPage/Song';
import HighlightedSnippet from '../HighlightedSnippet';

type Props = {
  results: LyricsSearchResult[];
  searchInput: string;
  noOfVisibleResults?: number;
  isSimilaritySearchEnabled: boolean;
};

const LyricSearchResultsContainer = (props: Props) => {
  const { results, searchInput, noOfVisibleResults = 5, isSimilaritySearchEnabled } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const { createQueue, playSong } = useContext(AppUpdateContext);

  const handleSongPlayBtnClick = useCallback(
    (currSongId: number) => {
      const queueSongIds = results
        .filter((r) => !r.song.isBlacklisted)
        .map((r) => r.song.songId);
      createQueue(queueSongIds, 'songs', false, undefined, false);
      playSong(currSongId, true);
    },
    [createQueue, playSong, results]
  );

  const lyricResults = useMemo(
    () =>
      results.length > 0
        ? results.slice(0, noOfVisibleResults).map((result, index) => (
            <div key={result.song.songId} className="lyric-result-item mb-2">
              <Song
                index={index}
                isIndexingSongs={preferences?.isSongIndexingEnabled}
                title={result.song.title}
                artists={result.song.artists}
                album={result.song.album}
                artworkPaths={result.song.artworkPaths}
                duration={result.song.duration}
                songId={result.song.songId}
                path={result.song.path}
                isAFavorite={result.song.isAFavorite}
                year={result.song.year}
                isBlacklisted={result.song.isBlacklisted}
                onPlayClick={handleSongPlayBtnClick}
              />
              <HighlightedSnippet snippet={result.matchedLyricSnippet} />
            </div>
          ))
        : [],
    [handleSongPlayBtnClick, preferences?.isSongIndexingEnabled, noOfVisibleResults, results]
  );

  return (
    <SecondaryContainer
      className={`secondary-container lyrics-list-container ${
        lyricResults.length > 0 ? 'active relative mt-8' : 'absolute mt-4'
      }`}
    >
      <>
        <div
          className={`title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-2xl font-medium ${
            lyricResults.length > 0 ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
        >
          <div className="container flex">
            {t('common.lyric_other')}{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs">
              {results && results.length > 0 && (
                <span className="no-of-lyrics">
                  {t(
                    `searchPage.${
                      results.length > noOfVisibleResults ? 'resultAndVisibleCount' : 'resultCount'
                    }`,
                    { count: results.length, noVisible: noOfVisibleResults }
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="other-controls-container flex">
            {results.length > noOfVisibleResults && (
              <Button
                label={t('common.showAll')}
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  navigate({
                    to: '/main-player/search/all',
                    search: { isSimilaritySearchEnabled, keyword: searchInput, filterBy: 'Lyrics' }
                  })
                }
              />
            )}
          </div>
        </div>
        <div
          className={`lyrics-container mb-12 ${
            lyricResults.length > 0
              ? 'visible translate-y-0 opacity-100'
              : 'invisible translate-y-8 opacity-0 transition-transform'
          }`}
        >
          {lyricResults}
        </div>
      </>
    </SecondaryContainer>
  );
};

export default LyricSearchResultsContainer;
