import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import DefaultSongCover from '../../assets/images/webp/song_cover_default.webp';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import SecondaryContainer from '../SecondaryContainer';
import SongCard from '../SongsPage/SongCard';

type Props = { recommendedSongs: RecommendedSongResult[]; noOfVisibleSongs: number };

const RecommendedSongs = (props: Props) => {
  const { t } = useTranslation();
  const { recommendedSongs, noOfVisibleSongs = 3 } = props;
  const MAX_SONG_LIMIT = 15;

  const songs = useMemo(() => recommendedSongs.map((r) => r.song), [recommendedSongs]);
  const selectAllHandler = useSelectAllHandler(songs, 'songs', 'songId');

  const songComponents = useMemo(
    () =>
      recommendedSongs
        .filter((_, i) => i < (noOfVisibleSongs || MAX_SONG_LIMIT))
        .map((rec, index) => {
          const { song } = rec;
          return (
            <SongCard
              index={index}
              key={song.songId}
              title={song.title}
              artworkPath={song.artworkPaths?.artworkPath || DefaultSongCover}
              path={song.path}
              songId={song.songId}
              artists={song.artists}
              album={song.album}
              palette={song.paletteData}
              isAFavorite={song.isAFavorite}
              isBlacklisted={song.isBlacklisted}
              selectAllHandler={selectAllHandler}
            />
          );
        }),
    [noOfVisibleSongs, recommendedSongs, selectAllHandler]
  );

  return (
    <>
      {songComponents.length > 0 && (
        <SecondaryContainer
          className="recommended-songs-container appear-from-bottom flex h-fit max-h-full flex-col pb-8 pl-8"
          focusable
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'a') {
              e.stopPropagation();
              selectAllHandler();
            }
          }}
        >
          <>
            <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center justify-between text-2xl font-medium">
              {t('homePage.recommendedForYou', 'Recommended For You')}
            </div>
            <div
              style={{
                gridTemplateColumns: `repeat(${noOfVisibleSongs},1fr)`
              }}
              className="songs-container grid gap-2 pr-2"
            >
              {songComponents}
            </div>
          </>
        </SecondaryContainer>
      )}
    </>
  );
};

export default RecommendedSongs;
