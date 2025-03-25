import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import calculateTimeFromSeconds from '../../utils/calculateTimeFromSeconds';

import Img from '../Img';

type Props = {
  genreData: Genre;
  genreSongs: AudioInfo[];
};

const GenreImgAndInfoContainer = (props: Props) => {
  const { t } = useTranslation();

  const { genreData, genreSongs } = props;

  const totalGenreSongsDuration = useMemo(
    () =>
      calculateTimeFromSeconds(genreSongs.reduce((prev, current) => prev + current.duration, 0))
        .timeString,
    [genreSongs]
  );

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {genreData && genreData.genreId && (
        <div className="genre-img-and-info-container flex flex-row items-center pb-8 text-font-color-black dark:text-font-color-white">
          <Img
            src={genreData.artworkPaths.artworkPath}
            className="mr-8 aspect-square max-w-[14rem] rounded-lg"
            loading="eager"
          />
          <div className="genre-info-container grow">
            <div className="font-semibold uppercase tracking-wider opacity-50">
              {t('common.genre_one')}
            </div>
            <div className="genre-title h-fit max-w-[80%] overflow-hidden text-ellipsis whitespace-nowrap pb-2 text-6xl text-font-color-highlight dark:text-dark-font-color-highlight">
              {genreData.name}
            </div>
            <div className="genre-no-of-songs">
              {t('common.songWithCount', { count: genreData.songs.length })}
            </div>
            <div className="genre-total-duration">{totalGenreSongsDuration}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default GenreImgAndInfoContainer;
