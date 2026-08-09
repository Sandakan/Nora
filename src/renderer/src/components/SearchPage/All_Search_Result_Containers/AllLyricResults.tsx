import { store } from '@renderer/store/store';
import { useStore } from '@tanstack/react-store';
import { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import Song from '../../SongsPage/Song';
import HighlightedSnippet from '../HighlightedSnippet';

type Props = {
  lyricData: LyricsSearchResult[];
};

const AllLyricResults = (props: Props) => {
  const { lyricData } = props;
  const { t } = useTranslation();
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { createQueue, playSong } = useContext(AppUpdateContext);

  const handleSongPlayBtnClick = useCallback(
    (currSongId: number) => {
      const queueSongIds = lyricData
        .filter((result) => !result.song.isBlacklisted)
        .map((result) => result.song.songId);
      createQueue(queueSongIds, 'songs', false, undefined, false);
      playSong(currSongId, true);
    },
    [createQueue, playSong, lyricData]
  );

  const results = useMemo(
    () =>
      lyricData.map((result, index) => (
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
          <HighlightedSnippet snippet={result.matchedLyricSnippet} truncate={false} />
        </div>
      )),
    [lyricData, preferences?.isSongIndexingEnabled, handleSongPlayBtnClick]
  );

  if (lyricData.length === 0) {
    return (
      <div className="no-lyrics-results text-font-color-black dark:text-font-color-white mt-4 text-xl">
        {t('searchPage.noResults')}
      </div>
    );
  }

  return <div className="all-lyric-results-container">{results}</div>;
};

export default AllLyricResults;
