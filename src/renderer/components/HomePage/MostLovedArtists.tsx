/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import { useTranslation } from 'react-i18next';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';

import { Artist } from '../ArtistPage/Artist';
import SecondaryContainer from '../SecondaryContainer';

type Props = { mostLovedArtists: Artist[]; noOfVisibleArtists: number };

const MostLovedArtists = (props: Props) => {
  const { mostLovedArtists, noOfVisibleArtists = 5 } = props;
  const { t } = useTranslation();

  const selectAllHandler = useSelectAllHandler(
    mostLovedArtists,
    'artist',
    'artistId',
  );
  const mostLovedArtistComponents = React.useMemo(
    () =>
      mostLovedArtists
        .filter((_, i) => i < noOfVisibleArtists)
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
    [mostLovedArtists, noOfVisibleArtists, selectAllHandler],
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
              {t('homePage.mostLovedArtists')}
            </div>
            <div
              style={{
                gridTemplateColumns: `repeat(${noOfVisibleArtists},1fr)`,
              }}
              className="artists-container grid justify-items-center"
            >
              {mostLovedArtistComponents}
            </div>
          </>
        </SecondaryContainer>
      )}
    </>
  );
};

export default MostLovedArtists;
