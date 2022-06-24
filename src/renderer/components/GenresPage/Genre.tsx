import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import blah from '../../../../assets/images/playlist_cover_default.png';

interface GenreProp {
  genreId: string;
  title: string;
  noOfSongs: number;
  artworkPath?: string;
  backgroundColor?: { rgb: unknown };
}

const Genre = (props: GenreProp) => {
  const { genreId, noOfSongs, title, artworkPath, backgroundColor } = props;
  const { changeCurrentActivePage, currentlyActivePage } =
    React.useContext(AppContext);

  const goToGenreInfoTab = () =>
    currentlyActivePage.pageTitle === 'GenreInfo' &&
    currentlyActivePage.data.genreId === genreId
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('GenreInfo', {
          genreInfoPage: { genreId },
        });

  return (
    <div
      className="genre appear-from-bottom"
      style={{
        backgroundColor: `rgb(${
          backgroundColor
            ? (backgroundColor.rgb as [number, number, number]).join(',')
            : '23,23,23'
        })`,
      }}
      onClick={goToGenreInfoTab}
      onKeyUp={goToGenreInfoTab}
      role="button"
      tabIndex={0}
    >
      <div className="genre-info-container">
        <div className="genre-title">{title}</div>
        <div className="genre-no-of-songs">{`${noOfSongs} song${
          noOfSongs === 1 ? '' : 's'
        }`}</div>
      </div>
      <div className="genre-artwork-container">
        <img
          src={artworkPath ? `otomusic://localFiles/${artworkPath}` : blah}
          alt="Artwork cover"
        />
      </div>
    </div>
  );
};

Genre.defaultProps = {
  artworkPath: '',
  backgroundColor: { rgb: [23, 23, 23] },
};

export default Genre;
