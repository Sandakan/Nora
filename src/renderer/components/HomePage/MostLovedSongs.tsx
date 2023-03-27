/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';

import SecondaryContainer from '../SecondaryContainer';
import SongCard from '../SongsPage/SongCard';

import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';

type Props = { mostLovedSongs: AudioInfo[] };

const MostLovedSongs = (props: Props) => {
  const { mostLovedSongs } = props;

  const selectAllHandler = useSelectAllHandler(
    mostLovedSongs,
    'songs',
    'songId'
  );
  const mostLovedSongComponents = React.useMemo(
    () =>
      mostLovedSongs
        .filter((_, index) => index < 3)
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
              palette={song.palette}
              isAFavorite={song.isAFavorite}
              isBlacklisted={song.isBlacklisted}
              selectAllHandler={selectAllHandler}
            />
          );
        }),
    [mostLovedSongs, selectAllHandler]
  );

  return (
    <>
      {mostLovedSongComponents.length > 0 && (
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
            <div className="title-container mt-1 mb-4 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
              Most Loved Songs
            </div>
            <div className="songs-container grid grid-cols-3 grid-rows-1 gap-2 pr-2">
              {mostLovedSongComponents}
            </div>
          </>
        </SecondaryContainer>
      )}
    </>
  );
};

export default MostLovedSongs;
