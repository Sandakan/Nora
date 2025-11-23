import { type ForwardedRef, forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import SongCard from '../SongsPage/SongCard';
import DefaultSongCover from '../../assets/images/webp/song_cover_default.webp';
import SecondaryContainer from '../SecondaryContainer';
import Button from '../Button';
import { useNavigate } from '@tanstack/react-router';

type Props = { latestSongs: AudioInfo[]; noOfVisibleSongs: number };

const RecentlyAddedSongs = forwardRef((props: Props, ref: ForwardedRef<HTMLDivElement>) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { latestSongs, noOfVisibleSongs = 6 } = props;
  const MAX_SONG_LIMIT = 30;

  const selectAllHandler = useSelectAllHandler(latestSongs, 'songs', 'songId');

  const latestSongComponents = useMemo(
    () =>
      latestSongs.length > 0 && latestSongs[0] !== null
        ? latestSongs
            .filter((_, i) => i < (noOfVisibleSongs || MAX_SONG_LIMIT))
            .map((song, index) => {
              const songData = song as AudioInfo;
              return (
                <SongCard
                  index={index}
                  key={songData.songId}
                  title={songData.title}
                  artworkPath={songData.artworkPaths?.artworkPath || DefaultSongCover}
                  path={songData.path}
                  songId={songData.songId}
                  artists={songData.artists}
                  album={songData.album}
                  palette={songData.paletteData}
                  isAFavorite={songData.isAFavorite}
                  isBlacklisted={songData.isBlacklisted}
                  selectAllHandler={selectAllHandler}
                />
              );
            })
        : [],
    [latestSongs, noOfVisibleSongs, selectAllHandler]
  );

  return (
    <SecondaryContainer
      className="recently-added-songs-container appear-from-bottom h-fit max-h-full w-full flex-col pb-8 pl-8"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
      ref={ref}
    >
      {latestSongs.length > 0 && latestSongs[0] !== null && (
        <>
          <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight my-4 flex items-center justify-between text-2xl font-medium">
            {t('homePage.recentlyAddedSongs')}
            <Button
              label={t('common.showAll')}
              tooltipLabel={t('homePage.openSongsWithNewestSortOption')}
              iconName="apps"
              className="show-all-btn text-sm font-normal"
              clickHandler={() =>
                navigate({
                  to: '/main-player/songs'
                })
              }
            />
          </div>
          <div
            style={{
              gridTemplateColumns: `repeat(${Math.floor(noOfVisibleSongs / 2)},1fr)`
            }}
            className="songs-container grid max-w-full grid-rows-2 gap-2 pr-2"
          >
            {latestSongComponents}
          </div>
        </>
      )}
    </SecondaryContainer>
  );
});

RecentlyAddedSongs.displayName = 'RecentlyAddedSongs';
export default RecentlyAddedSongs;
