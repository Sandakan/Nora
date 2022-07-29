/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import MainContainer from '../MainContainer';
import { Song } from '../SongsPage/Song';

const GenreInfoPage = () => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const [genreData, setGenreData] = React.useState({} as Genre);
  const [genreSongs, setGenreSongs] = React.useState([] as AudioInfo[]);

  const fetchGenresData = React.useCallback(() => {
    if (currentlyActivePage.data && currentlyActivePage.data.genreInfoPage) {
      window.api
        .getGenresData([currentlyActivePage.data.genreInfoPage.genreId])
        .then((res) => {
          if (res && res.length > 0 && res[0]) setGenreData(res[0]);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [currentlyActivePage.data]);

  const fetchSongsData = React.useCallback(() => {
    if (genreData && genreData.songs && genreData.songs.length > 0) {
      window.api
        .getSongInfo(genreData.songs.map((song) => song.songId))
        .then((res) => {
          if (res) return setGenreSongs(res);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return undefined;
  }, [genreData]);

  React.useEffect(() => {
    fetchGenresData();
    const manageGenreUpdates = (
      _: unknown,
      eventType: DataUpdateEventTypes
    ) => {
      if (eventType === 'genres') fetchGenresData();
    };
    window.api.dataUpdateEvent(manageGenreUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageGenreUpdates);
    };
  }, [fetchGenresData]);

  React.useEffect(() => {
    fetchSongsData();
    const manageSongUpdates = (_: unknown, eventType: DataUpdateEventTypes) => {
      if (eventType === 'songs') fetchSongsData();
    };
    window.api.dataUpdateEvent(manageSongUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageSongUpdates);
    };
  }, [fetchSongsData]);

  const songComponents = React.useMemo(
    () =>
      genreSongs.map((song, index) => (
        <Song
          key={index}
          index={index}
          songId={song.songId}
          title={song.title}
          artists={song.artists}
          duration={song.duration}
          artworkPath={song.artworkPath}
          path={song.path}
          isAFavorite={song.isAFavorite}
        />
      )),
    [genreSongs]
  );

  return (
    <MainContainer
      className="main-container songs-list-container genre-info-page-container !h-full"
      style={
        genreData.backgroundColor && {
          background: `linear-gradient(180deg, ${`rgb(${
            (genreData.backgroundColor.rgb as number[])[0]
          },${(genreData.backgroundColor.rgb as number[])[1]},${
            (genreData.backgroundColor.rgb as number[])[2]
          })`} 0%, var(--background-color-1) 90%)`,
        }
      }
    >
      <>
        {genreData.genreId && (
          <div className="genre-info-container my-8 h-fit text-font-color-black dark:text-font-color-white">
            <div className="genre-title h-fit text-6xl max-w-[80%] text-ellipsis whitespace-nowrap overflow-hidden py-2">
              {genreData.name}
            </div>
            <div className="genre-no-of-songs">{`${
              genreData.songs.length
            } song${genreData.songs.length !== 1 ? 's' : ''}`}</div>
          </div>
        )}
        {genreSongs.length > 0 && (
          <div className="songs-container">{songComponents}</div>
        )}
      </>
    </MainContainer>
  );
};

export default GenreInfoPage;
