import { useEffect, useMemo, useState } from 'react';

import Img from '../Img';

import DefaultImgCover from '../../assets/images/webp/song_cover_default.webp';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

type Props = {
  className?: string;
  songIds: string[];
  imgClassName?: string;
  holderClassName?: string;
  type?: number;
  enableImgFadeIns?: boolean;
};

const MultipleArtworksCover = (props: Props) => {
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const {
    className,
    songIds,
    imgClassName,
    holderClassName,
    type = 2,
    enableImgFadeIns = true
  } = props;

  const [artworks, setArtworks] = useState<string[]>([]);

  useEffect(() => {
    window.api.playlistsData
      .getArtworksForMultipleArtworksCover(songIds)
      .then((res) => setArtworks(res))
      .catch((err) => console.error(err));
  }, [songIds]);

  const images = useMemo(() => {
    if (artworks.length > 1) {
      const repeatedArtworks: string[] = [];

      while (repeatedArtworks.length < 10) {
        repeatedArtworks.push(...artworks);
      }

      if (preferences?.shuffleArtworkFromSongCovers) {
        for (let i = repeatedArtworks.length - 1; i > 0; i -= 1) {
          const randomIndex = Math.floor(Math.random() * (i + 1));
          [repeatedArtworks[i], repeatedArtworks[randomIndex]] = [
            repeatedArtworks[randomIndex],
            repeatedArtworks[i]
          ];
        }
      }

      return repeatedArtworks
        .filter((_, i) => i < (type === 1 ? 10 : 5))
        .map((artwork, i) => {
          const cond = (i + (type === 1 ? 1 : 0)) % 2 === 1;

          return (
            <Img
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className={`inline shadow-xl ${type === 1 ? 'rounded-md' : 'rounded-xs'} ${
                cond && 'col-span-2 row-span-2 rounded-md!'
              } ${imgClassName}`}
              src={artwork}
              fallbackSrc={DefaultImgCover}
              enableImgFadeIns={enableImgFadeIns}
            />
          );
        });
    }
    return [];
  }, [artworks, enableImgFadeIns, imgClassName, preferences?.shuffleArtworkFromSongCovers, type]);

  return (
    <div className={`relative overflow-hidden rounded-lg shadow-md ${className}`}>
      <div
        className={`relative grid rotate-45 scale-150 grid-flow-row gap-1 p-1 ${
          type === 1 ? 'grid-cols-5' : 'grid-cols-3'
        } ${holderClassName}`}
      >
        {images}
      </div>
    </div>
  );
};

export default MultipleArtworksCover;
