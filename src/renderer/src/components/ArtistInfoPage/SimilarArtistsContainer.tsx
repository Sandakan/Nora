import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Artist } from '../ArtistPage/Artist';
import UnAvailableArtist from './UnAvailableArtist';
import TitleContainer from '../TitleContainer';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

type Props = { similarArtists: SimilarArtistInfo };

const SimilarArtistsContainer = (props: Props) => {
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);

  const { t } = useTranslation();

  const { similarArtists } = props;
  //   const [similarArtists, setSimilarArtists] = useState<SimilarArtistInfo>(
  //     { availableArtists: [], unAvailableArtists: [] },
  //   );

  const { availArtistComponents, unAvailArtistComponents } = useMemo(() => {
    if (similarArtists) {
      const { availableArtists = [], unAvailableArtists = [] } = similarArtists;

      const availableArtistsComponents = availableArtists.map((availArtist, index) => {
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
      });

      const unAvailableArtistsComponents = unAvailableArtists.map((unAvailArtist) => {
        const { name, url } = unAvailArtist;
        return <UnAvailableArtist key={url} name={name} url={url} />;
      });

      return {
        unAvailArtistComponents: unAvailableArtistsComponents,
        availArtistComponents: availableArtistsComponents
      };
    }
    return {
      unAvailArtistComponents: [],
      availArtistComponents: []
    };
  }, [similarArtists]);

  return (
    <div className="pl-8">
      {availArtistComponents.length > 0 && (
        <>
          <TitleContainer
            title={t('artistInfoPage.similarArtistsInLibrary')}
            titleClassName="text-2xl! text-font-color-black dark:text-font-color-white"
            className={`title-container ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } mt-1 mb-4 pr-4 text-2xl`}
          />
          <div className="my-2 flex flex-wrap">{availArtistComponents}</div>
        </>
      )}
      {unAvailArtistComponents.length > 0 && (
        <>
          <TitleContainer
            title={t('artistInfoPage.otherSimilarArtists')}
            titleClassName="text-2xl! text-font-color-black font-normal! dark:text-font-color-white"
            className={`title-container ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } mt-1 mb-4 pr-4 text-2xl`}
          />
          <div className="flex flex-wrap">{unAvailArtistComponents}</div>
        </>
      )}
    </div>
  );
};

export default SimilarArtistsContainer;
