import React from 'react';
import BlacklistedSong from '../BlacklistedSong';

type Props = { songBlacklist: string[] };

const BlacklistedSongSettings = (props: Props) => {
  const { songBlacklist } = props;
  const [blacklistedSongs, setBlacklistedSongs] = React.useState<SongData[]>(
    []
  );

  React.useEffect(() => {
    if (songBlacklist.length > 0) {
      window.api
        .getSongInfo(songBlacklist, undefined, undefined, true)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) setBlacklistedSongs(res);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [songBlacklist]);

  const blacklistedSongComponents = React.useMemo(
    () =>
      blacklistedSongs
        ? blacklistedSongs.map((song, index) => (
            <BlacklistedSong
              key={song.songId}
              title={song.title}
              songPath={song.path}
              songId={song.songId}
              index={index}
            />
          ))
        : [],
    [blacklistedSongs]
  );
  return (
    <div>
      <div className="title-container mt-1 mb-4 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">filter_list</span>
        Blacklisted Songs
      </div>
      <div className="description">
        Songs that have been removed and blacklisted from the library will
        appear here.
      </div>
      <div className="blacklisted-songs relative my-4 mr-8 max-h-96 overflow-y-auto rounded-xl border-[0.2rem] border-background-color-2 p-2 empty:min-h-[7rem] empty:after:absolute empty:after:top-1/2 empty:after:left-1/2 empty:after:-translate-x-1/2 empty:after:-translate-y-1/2 empty:after:text-[#ccc] empty:after:content-['There_are_no_blacklisted_songs.'] dark:border-dark-background-color-2">
        {blacklistedSongComponents}
      </div>
    </div>
  );
};

export default BlacklistedSongSettings;
