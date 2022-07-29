/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import sortGenres from 'renderer/utils/sortGenres';
import Dropdown from '../Dropdown';
import MainContainer from '../MainContainer';
import Genre from './Genre';
import NoSongsImage from '../../../../assets/images/Summer landscape_Monochromatic.svg';

const GenresPage = () => {
  const { currentlyActivePage, userData } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData, updatePageSortingOrder } =
    React.useContext(AppUpdateContext);

  const [genresData, setGenresData] = React.useState([] as Genre[] | null);
  const [sortingOrder, setSortingOrder] = React.useState(
    currentlyActivePage.data &&
      currentlyActivePage.data.artistsPage &&
      currentlyActivePage.data.artistsPage.sortingOrder
      ? (currentlyActivePage.data.artistsPage.sortingOrder as GenreSortTypes)
      : userData && userData.sortingStates.genresPage
      ? userData.sortingStates.genresPage
      : ('aToZ' as GenreSortTypes)
  );

  const fetchGenresData = React.useCallback(() => {
    window.api
      .getGenresData([])
      .then((genres) => {
        if (genres && genres.length > 0)
          return setGenresData(sortGenres(genres, sortingOrder));
        return setGenresData(null);
      })
      // eslint-disable-next-line no-console
      .catch((err) => console.error(err));
  }, [sortingOrder]);

  React.useEffect(() => {
    fetchGenresData();
    const manageGenreDataUpdates = (
      _: unknown,
      dataType: DataUpdateEventTypes
    ) => {
      if (dataType === 'genres') fetchGenresData();
    };
    window.api.dataUpdateEvent(manageGenreDataUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageGenreDataUpdates);
    };
  }, [fetchGenresData]);

  React.useEffect(
    () => updatePageSortingOrder('sortingStates.genresPage', sortingOrder),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortingOrder]
  );

  const genreComponents = React.useMemo(
    () =>
      genresData
        ? genresData.map((genre, index) => {
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
          })
        : [],
    [genresData]
  );

  return (
    <MainContainer className="main-container genres-list-container appear-from=bottom text-font-color-black dark:text-font-color-white">
      <>
        <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
          <div className="container flex">
            Genres{' '}
            <div className="other-stats-container text-xs ml-12 flex items-center">
              {genresData && genresData.length > 0 && (
                <div className="no-of-genres">{`${genresData.length} genre${
                  genresData.length === 1 ? '' : 's'
                }`}</div>
              )}
            </div>
          </div>
          <div className="other-controls-container">
            {genresData && genresData.length > 0 && (
              <Dropdown
                name="genreSortDropdown"
                value={sortingOrder}
                options={[
                  { label: 'A to Z', value: 'aToZ' },
                  { label: 'Z to A', value: 'zToA' },
                  { label: 'High Song Count', value: 'noOfSongsDescending' },
                  { label: 'Low Song Count', value: 'noOfSongsAscending' },
                ]}
                onChange={(e) => {
                  updateCurrentlyActivePageData({
                    songsPage: {
                      sortingOrder: e.currentTarget.value as ArtistSortTypes,
                    },
                  });
                  setSortingOrder(e.currentTarget.value as GenreSortTypes);
                }}
              />
            )}
          </div>
        </div>
        {genresData && genresData.length > 0 && (
          <div className="genres-container flex flex-wrap">
            {genreComponents}
          </div>
        )}
        {genresData === null && (
          <div className="no-songs-container my-[10%] h-full w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={NoSongsImage}
              alt="No songs available."
              className="w-60 mb-8"
            />
            <span>Songs without genres. Yeah, we know it isn't ideal.</span>
          </div>
        )}
      </>
    </MainContainer>
  );
};

export default GenresPage;
