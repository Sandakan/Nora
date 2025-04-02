import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';

import { Artist } from '../ArtistPage/Artist';
import SecondaryContainer from '../SecondaryContainer';

type Props = {
  recentlyPlayedSongArtists: Artist[];
  noOfVisibleArtists: number;
};

const RecentlyPlayedArtists = (props: Props) => {
  const { recentlyPlayedSongArtists, noOfVisibleArtists = 5 } = props;
  const { t } = useTranslation();

  const selectAllHandler = useSelectAllHandler(recentlyPlayedSongArtists, 'artist', 'artistId');

  const recentlyPlayedSongArtistsComponents = useMemo(
    () =>
      recentlyPlayedSongArtists
        .filter((_, i) => i < (noOfVisibleArtists || 5))
        .map((val, index) => {
          if (val)
            return (
              <Artist
                index={index}
                name={val.name}
                key={val.artistId}
                artworkPaths={val.artworkPaths}
                artistId={val.artistId}
                songIds={val.songs.map((song) => song.songId)}
                onlineArtworkPaths={val.onlineArtworkPaths}
                className="mb-4"
                isAFavorite={val.isAFavorite}
                selectAllHandler={selectAllHandler}
              />
            );
          return undefined;
        })
        .filter((x) => x !== undefined),
    [noOfVisibleArtists, recentlyPlayedSongArtists, selectAllHandler]
  );

  return (
    <>
      {recentlyPlayedSongArtists.length > 0 && (
        <SecondaryContainer
          className="artists-list-container appear-from-bottom max-h-full flex-col pb-8 pl-8"
          focusable
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'a') {
              e.stopPropagation();
              selectAllHandler();
            }
          }}
        >
          <>
            <div className="title-container mb-4 mt-1 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
              {t('homePage.recentArtists')}
            </div>
            <div
              style={{
                gridTemplateColumns: `repeat(${noOfVisibleArtists},1fr)`
              }}
              className="artists-container grid justify-items-center"
            >
              {recentlyPlayedSongArtistsComponents}
            </div>
          </>
        </SecondaryContainer>
      )}
    </>
  );
};

export default RecentlyPlayedArtists;
