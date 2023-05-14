import React from 'react';
import { valueRounder } from 'renderer/utils/valueRounder';

const AppStats = () => {
  const [stats, setStats] = React.useState({
    songs: 0,
    artists: 0,
    albums: 0,
    playlists: 0,
    genres: 0,
  });

  React.useEffect(() => {
    window.api.audioLibraryControls
      .getAllSongs()
      .then((res) => {
        if (res && Array.isArray(res.data))
          return setStats((prevStats) => ({
            ...prevStats,
            songs: res.data.length,
          }));
        return undefined;
      })
      .catch((err) => console.error(err));

    window.api.artistsData
      .getArtistData()
      .then((artists) => {
        if (Array.isArray(artists))
          return setStats((prevStats) => ({
            ...prevStats,
            artists: artists.length,
          }));
        return undefined;
      })
      .catch((err) => console.error(err));

    window.api.albumsData
      .getAlbumData()
      .then((albums) => {
        if (Array.isArray(albums))
          return setStats((prevStats) => ({
            ...prevStats,
            albums: albums.length,
          }));
        return undefined;
      })
      .catch((err) => console.error(err));

    window.api.genresData
      .getGenresData()
      .then((genres) => {
        if (Array.isArray(genres))
          return setStats((prevStats) => ({
            ...prevStats,
            genres: genres.length,
          }));
        return undefined;
      })
      .catch((err) => console.error(err));

    window.api.playlistsData
      .getPlaylistData()
      .then((playlists) => {
        if (Array.isArray(playlists))
          return setStats((prevStats) => ({
            ...prevStats,
            playlists: playlists.length,
          }));
        return undefined;
      })
      .catch((err) => console.error(err));
  }, []);

  const statComponents = React.useMemo(
    () =>
      Object.entries(stats).map(([key, value]) => {
        return (
          <span
            className="flex flex-col items-center border-[3px] border-b-0 border-r-0 border-t-0 border-background-color-2 py-4 text-lg first:border-l-0 dark:border-dark-background-color-2"
            title={`${value} ${key}`}
            key={`${value}-${key}`}
          >
            <span className="text-xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
              {valueRounder(value)}
            </span>
            <span className="opacity-75">{key}</span>
          </span>
        );
      }),
    [stats]
  );

  return (
    <div className="mx-auto my-8 grid max-w-4xl grid-cols-5 rounded-lg border-[3px] border-background-color-2 dark:border-dark-background-color-2">
      {statComponents}
    </div>
  );
};

export default AppStats;
