import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from 'renderer/contexts/AppContext';

import { Artist } from '../ArtistPage/Artist';
import UnAvailableArtist from './UnAvailableArtist';
import TitleContainer from '../TitleContainer';

type Props = { similarArtists: SimilarArtistInfo };

const SimilarArtistsContainer = (props: Props) => {
  const { bodyBackgroundImage } = React.useContext(AppContext);
  const { t } = useTranslation();

  const { similarArtists } = props;
  //   const [similarArtists, setSimilarArtists] = React.useState<SimilarArtistInfo>(
  //     { availableArtists: [], unAvailableArtists: [] },
  //   );

  const { availArtistComponents, unAvailArtistComponents } =
    React.useMemo(() => {
      if (similarArtists) {
        const { availableArtists = [], unAvailableArtists = [] } =
          similarArtists;

        const availableArtistsComponents = availableArtists.map(
          (availArtist, index) => {
            const artistData = availArtist.artistData!;
            return (
              <Artist
                index={index}
                key={artistData.artistId}
                className="mb-4"
                artistId={artistData.artistId}
                name={artistData.name}
                artworkPaths={artistData.artworkPaths}
                onlineArtworkPaths={artistData.onlineArtworkPaths}
                songIds={artistData.songs.map((song) => song.songId)}
                isAFavorite={artistData.isAFavorite}
                //   selectAllHandler={selectAllHandler}
              />
            );
          },
        );

        const unAvailableArtistsComponents = unAvailableArtists.map(
          (unAvailArtist) => {
            const { name, url } = unAvailArtist;
            return <UnAvailableArtist name={name} url={url} />;
          },
        );

        return {
          unAvailArtistComponents: unAvailableArtistsComponents,
          availArtistComponents: availableArtistsComponents,
        };
      }
      return {
        unAvailArtistComponents: [],
        availArtistComponents: [],
      };
    }, [similarArtists]);

  return (
    <div className="pl-8">
      {availArtistComponents.length > 0 && (
        <>
          <TitleContainer
            title={t('artistInfoPage.similarArtistsInLibrary')}
            titleClassName="!text-2xl text-font-color-black !font-normal dark:text-font-color-white"
            className={`title-container ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } mb-4 mt-1 text-2xl pr-4`}
          />
          <div className="flex flex-wrap my-2">{availArtistComponents}</div>
        </>
      )}
      {unAvailArtistComponents.length > 0 && (
        <>
          <TitleContainer
            title={t('artistInfoPage.otherSimilarArtists')}
            titleClassName="!text-2xl text-font-color-black !font-normal dark:text-font-color-white"
            className={`title-container ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } mb-4 mt-1 text-2xl pr-4`}
          />
          <div className="flex flex-wrap ">{unAvailArtistComponents}</div>
        </>
      )}
    </div>
  );
};

export default SimilarArtistsContainer;
