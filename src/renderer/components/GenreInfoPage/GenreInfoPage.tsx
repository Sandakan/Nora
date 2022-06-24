/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { Song } from '../SongsPage/Song';

const GenreInfoPage = () => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const [genreData, setGenreData] = React.useState({} as Genre);
  const [genreSongs, setGenreSongs] = React.useState([] as AudioInfo[]);

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (genreData && genreData.songs && genreData.songs.length > 0) {
      window.api
        .getAllSongs()
        .then((res) => {
          if (res) {
            setGenreSongs(
              res.data.filter((song) =>
                genreData.songs.some((y) => y.songId === song.songId)
              )
            );
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return undefined;
  }, [genreData]);
  return (
    <div
      className="main-container songs-list-container genre-info-page-container"
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
      {genreData.genreId && (
        <div className="genre-info-container">
          <div className="genre-title">{genreData.name}</div>
          <div className="genre-no-of-songs">{`${genreData.songs.length} song${
            genreData.songs.length !== 1 ? 's' : ''
          }`}</div>
        </div>
      )}
      {genreSongs.length > 0 && (
        <div className="songs-container">
          {genreSongs.map((song, index) => (
            <Song
              key={index}
              index={index}
              songId={song.songId}
              title={song.title}
              artists={song.artists}
              duration={song.duration}
              artworkPath={song.artworkPath}
              path={song.path}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GenreInfoPage;
