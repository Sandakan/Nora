import React from 'react';
import calculateTimeFromSeconds from 'renderer/utils/calculateTimeFromSeconds';

import Img from '../Img';

type Props = {
  genreData: Genre;
  genreSongs: AudioInfo[];
};

const GenreImgAndInfoContainer = (props: Props) => {
  const { genreData, genreSongs } = props;

  const totalGenreSongsDuration = React.useMemo(() => {
    const { hours, minutes, seconds } = calculateTimeFromSeconds(
      genreSongs.reduce((prev, current) => prev + current.duration, 0),
    );
    return `${
      hours >= 1 ? `${hours} hour${hours === 1 ? '' : 's'} ` : ''
    }${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${
      seconds === 1 ? '' : 's'
    }`;
  }, [genreSongs]);

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {genreData && genreData.genreId && (
        <div className="genre-img-and-info-container flex flex-row items-center text-font-color-black dark:text-font-color-white">
          <Img
            src={genreData.artworkPaths.artworkPath}
            className="mr-8 aspect-square max-w-[14rem] rounded-lg"
            loading="eager"
          />
          <div className="genre-info-container flex-grow">
            <div className="font-semibold tracking-wider opacity-50">GENRE</div>
            <div className="genre-title h-fit max-w-[80%] overflow-hidden text-ellipsis whitespace-nowrap pb-2 text-6xl text-font-color-highlight dark:text-dark-font-color-highlight">
              {genreData.name}
            </div>
            <div className="genre-no-of-songs">{`${
              genreData.songs.length
            } song${genreData.songs.length !== 1 ? 's' : ''}`}</div>
            <div className="genre-total-duration">
              {totalGenreSongsDuration}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GenreImgAndInfoContainer;
