import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import PlaylistDefaultCover from '../../../../assets/images/png/playlist_cover_default.png';

interface GenreProp {
  // eslint-disable-next-line react/no-unused-prop-types
  index: number;
  genreId: string;
  title: string;
  noOfSongs: number;
  artworkPath?: string;
  backgroundColor?: { rgb: unknown };
  className?: string;
}

const Genre = (props: GenreProp) => {
  const { genreId, noOfSongs, title, artworkPath, backgroundColor, className } =
    props;
  const { currentlyActivePage } = React.useContext(AppContext);
  const { changeCurrentActivePage } = React.useContext(AppUpdateContext);

  const goToGenreInfoTab = () =>
    currentlyActivePage.pageTitle === 'GenreInfo' &&
    currentlyActivePage.data.genreId === genreId
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('GenreInfo', {
          genreInfoPage: { genreId },
        });

  return (
    <div
      className={`genre appear-from-bottom relative w-72 h-36 mr-10 mb-6 p-4 text-background-color-2 dark:text-dark-background-color-2 flex items-center rounded-2xl cursor-pointer overflow-hidden ${className}`}
      style={{
        backgroundColor: `rgb(${
          backgroundColor
            ? (backgroundColor.rgb as [number, number, number]).join(',')
            : '23,23,23'
        })`,
        // animationDelay: `${50 * (index + 1)}ms`,
      }}
      onClick={goToGenreInfoTab}
      onKeyUp={goToGenreInfoTab}
      role="button"
      tabIndex={0}
    >
      <div className="genre-info-container w-3/4">
        <div className="genre-title text-2xl w-full text-ellipsis whitespace-nowrap overflow-hidden text-font-color-white dark:text-font-color-white">
          {title}
        </div>
        <div className="genre-no-of-songs text-[#ccc] dark:text-[#ccc]">{`${noOfSongs} song${
          noOfSongs === 1 ? '' : 's'
        }`}</div>
      </div>
      <div className="genre-artwork-container absolute -right-4 top-1/2 -translate-y-1/2">
        <img
          src={
            artworkPath
              ? `otomusic://localFiles/${artworkPath}`
              : PlaylistDefaultCover
          }
          className="w-24 rotate-12 rounded-md"
          alt="Artwork cover"
        />
      </div>
    </div>
  );
};

Genre.defaultProps = {
  artworkPath: '',
  backgroundColor: { rgb: [23, 23, 23] },
  className: '',
};

export default Genre;
