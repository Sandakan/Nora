/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';

import Button from '../Button';
import SecondaryContainer from '../SecondaryContainer';
import SongCard from '../SongsPage/SongCard';

import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';

type Props = { recentlyPlayedSongs: SongData[]; noOfVisibleSongs: number };

const RecentlyPlayedSongs = (props: Props) => {
  const { changeCurrentActivePage } = React.useContext(AppUpdateContext);

  const { recentlyPlayedSongs, noOfVisibleSongs = 3 } = props;

  const selectAllHandler = useSelectAllHandler(
    recentlyPlayedSongs,
    'songs',
    'songId'
  );
  const recentlyPlayedSongComponents = React.useMemo(
    () =>
      recentlyPlayedSongs.map((song, index) => {
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
    [recentlyPlayedSongs, selectAllHandler]
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
            <div className="title-container mb-4 mt-1 flex items-center justify-between text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
              Recently Played Songs
              <Button
                label="Show All"
                tooltipLabel="Opens 'Songs' with 'Newest' sort option."
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  changeCurrentActivePage('PlaylistInfo', {
                    playlistId: 'History',
                    sortingOrder: 'addedOrder',
                  })
                }
              />
            </div>
            <div
              style={{
                gridTemplateColumns: `repeat(${
                  noOfVisibleSongs < 3 ? 3 : noOfVisibleSongs
                },1fr)`,
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
