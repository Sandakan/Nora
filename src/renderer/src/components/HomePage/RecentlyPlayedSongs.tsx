import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';

import Button from '../Button';
import SecondaryContainer from '../SecondaryContainer';
import SongCard from '../SongsPage/SongCard';

import DefaultSongCover from '../../assets/images/webp/song_cover_default.webp';

type Props = { recentlyPlayedSongs: SongData[]; noOfVisibleSongs: number };

const RecentlyPlayedSongs = (props: Props) => {
  const { changeCurrentActivePage } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { recentlyPlayedSongs, noOfVisibleSongs = 3 } = props;
  const MAX_SONG_LIMIT = 15;

  const selectAllHandler = useSelectAllHandler(recentlyPlayedSongs, 'songs', 'songId');
  const recentlyPlayedSongComponents = useMemo(
    () =>
      recentlyPlayedSongs
        .filter((_, i) => i < (noOfVisibleSongs || MAX_SONG_LIMIT))
        .map((song, index) => {
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
    [noOfVisibleSongs, recentlyPlayedSongs, selectAllHandler]
  );

  return (
    <>
      {recentlyPlayedSongComponents.length > 0 && (
        <SecondaryContainer
          className="recently-played-songs-container appear-from-bottom flex h-fit max-h-full flex-col pb-8 pl-8"
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
              {t('homePage.recentlyPlayedSongs')}

              <Button
                label={t('common.showAll')}
                tooltipLabel={t('homePage.openPlaybackHistory')}
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  changeCurrentActivePage('PlaylistInfo', {
                    playlistId: 'History',
                    sortingOrder: 'addedOrder'
                  })
                }
              />
            </div>
            <div
              style={{
                gridTemplateColumns: `repeat(${noOfVisibleSongs},1fr)`
              }}
              className="songs-container grid gap-2 pr-2"
            >
              {recentlyPlayedSongComponents}
            </div>
          </>
        </SecondaryContainer>
      )}
    </>
  );
};

export default RecentlyPlayedSongs;
