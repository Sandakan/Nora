/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';

import { Artist } from '../ArtistPage/Artist';
import SecondaryContainer from '../SecondaryContainer';

type Props = { mostLovedArtists: Artist[] };

const MostLovedArtists = (props: Props) => {
  const { mostLovedArtists } = props;

  const selectAllHandler = useSelectAllHandler(
    mostLovedArtists,
    'artist',
    'artistId'
  );
  const mostLovedArtistComponents = React.useMemo(
    () =>
      mostLovedArtists
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
    [mostLovedArtists, selectAllHandler]
  );

  return (
    <>
      {mostLovedArtistComponents.length > 0 && (
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
              Most Loved Artists
            </div>
            <div className="artists-container grid grid-flow-col justify-items-center">
              {mostLovedArtistComponents}
            </div>
          </>
        </SecondaryContainer>
      )}
    </>
  );
};

export default MostLovedArtists;
