/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import sortGenres from 'renderer/utils/sortGenres';
import Genre from './Genre';

const GenresPage = () => {
  const { currentlyActivePage, updateCurrentlyActivePageData } =
    React.useContext(AppContext);
  const [genresData, setGenresData] = React.useState([] as Genre[]);
  const [sortingOrder, setSortingOrder] = React.useState(
    currentlyActivePage.data &&
      currentlyActivePage.data.artistsPage &&
      currentlyActivePage.data.artistsPage.sortingOrder
      ? (currentlyActivePage.data.artistsPage.sortingOrder as GenreSortTypes)
      : ('aToZ' as GenreSortTypes)
  );

  const fetchGenresData = React.useCallback(() => {
    window.api
      .getGenresData([])
      .then((genres) => {
        if (genres && genres.length > 0)
          return setGenresData(sortGenres(genres, sortingOrder));
        return undefined;
      })
      // eslint-disable-next-line no-console
      .catch((err) => console.error(err));
  }, [sortingOrder]);

  React.useEffect(() => {
    fetchGenresData();
    window.api.dataUpdateEvent((_, dataType) => {
      if (dataType === 'userData/recentlyPlayedSongs') fetchGenresData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(
    () => setGenresData((prevData) => sortGenres(prevData, sortingOrder)),
    [sortingOrder]
  );

  const genreComponents = genresData.map((genre, index) => {
    return (
      <Genre
        key={index}
        genreId={genre.genreId}
        title={genre.name}
        noOfSongs={genre.songs.length}
        artworkPath={genre.artworkPath}
        backgroundColor={genre.backgroundColor}
      />
    );
  });

  return (
    <div className="main-container genres-list-container">
      <div className="title-container">
        <div className="container">
          Genres{' '}
          <div className="other-stats-container">
            {genresData.length > 0 && (
              <div className="no-of-genres">{`${genresData.length} genre${
                genresData.length === 1 ? '' : 's'
              }`}</div>
            )}
          </div>
        </div>
        <div className="other-controls-container">
          {' '}
          {genresData.length > 0 && (
            <select
              name="sortingOrderDropdown"
              id="sortingOrderDropdown"
              className="dropdown"
              value={sortingOrder}
              onChange={(e) => {
                updateCurrentlyActivePageData({
                  songsPage: {
                    sortingOrder: e.currentTarget.value as ArtistSortTypes,
                  },
                });
                setSortingOrder(e.currentTarget.value as GenreSortTypes);
              }}
            >
              <option value="aToZ">A to Z</option>
              <option value="zToA">Z to A</option>
              <option value="noOfSongsAscending">
                No. of Songs ( Ascending )
              </option>
              <option value="noOfSongsDescending">
                No. of Songs ( Descending )
              </option>
            </select>
          )}
        </div>
      </div>
      {genresData.length > 0 && (
        <div className="genres-container">{genreComponents}</div>
      )}
    </div>
  );
};

export default GenresPage;
