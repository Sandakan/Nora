/* eslint-disable no-console */
/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Checkbox from '../Checkbox';
import Button from '../Button';
import Img from '../Img';

interface AddSongsToPlaylistProp {
  songId: string;
  title: string;
}

interface SelectablePlaylistProp extends Playlist {
  isChecked: boolean;
  playlistCheckedStateUpdateFunc: (state: boolean) => void;
}

const SelectablePlaylist = (props: SelectablePlaylistProp) => {
  const {
    playlistId,
    artworkPaths,
    name,
    songs,
    playlistCheckedStateUpdateFunc,
    isChecked,
  } = props;

  return (
    <div
      className={`playlist appear-from-bottom group ${playlistId} mb-6 mr-4 flex h-52 w-[9.5rem] flex-col justify-between rounded-xl p-4 text-font-color-black dark:text-font-color-white ${
        isChecked
          ? 'bg-background-color-3 text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black'
          : 'hover:bg-background-color-2 hover:dark:bg-dark-background-color-2'
      }`}
      onClick={() => playlistCheckedStateUpdateFunc(!isChecked)}
      onKeyDown={() => playlistCheckedStateUpdateFunc(!isChecked)}
      role="button"
      tabIndex={0}
    >
      <div className="playlist-cover-and-checkbox-container relative h-[70%] overflow-hidden">
        <Checkbox
          id={playlistId}
          checkedStateUpdateFunction={playlistCheckedStateUpdateFunc}
          isChecked={isChecked}
          className="absolute bottom-3 right-3"
        />
        <div className="playlist-cover-container h-full cursor-pointer overflow-hidden rounded-lg">
          <Img
            src={artworkPaths.artworkPath}
            alt="Playlist Cover"
            loading="lazy"
            className="h-full"
          />
        </div>
      </div>
      <div className="playlist-info-container">
        <div
          className="title playlist-title w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-xl"
          title={name}
        >
          {name}
        </div>
        <div className="playlist-no-of-songs text-sm font-light">{`${
          songs.length
        } song${songs.length === 1 ? '' : 's'}`}</div>
      </div>
    </div>
  );
};

interface SelectPlaylist extends Playlist {
  isSelected: boolean;
}

const AddSongsToPlaylists = (props: AddSongsToPlaylistProp) => {
  const { changePromptMenuData, addNewNotifications } =
    React.useContext(AppUpdateContext);
  const { songId, title } = props;
  const [playlists, setPlaylists] = React.useState([] as SelectPlaylist[]);

  React.useEffect(() => {
    window.api
      .getPlaylistData([], undefined, true)
      .then((res) => {
        if (res.length > 0) {
          setPlaylists(() =>
            res.map((playlist) => {
              if (playlist.songs.some((id) => id === songId))
                return { ...playlist, isSelected: true };
              return { ...playlist, isSelected: false };
            })
          );
        }
        return undefined;
      })
      .catch((err) => console.error(err));
  }, [songId]);

  const addSongsToPlaylists = React.useCallback(() => {
    const selectedPlaylists = playlists.filter(
      (playlist) => playlist.isSelected
    );
    const promises = selectedPlaylists.map(async (playlist) => {
      if (playlist.playlistId === 'Favorites')
        return window.api
          .toggleLikeSongs([songId], true)
          .catch((err) => console.error(err));
      return window.api
        .addSongToPlaylist(playlist.playlistId, songId)
        .catch((err) => console.error(err));
    });
    // eslint-disable-next-line promise/catch-or-return
    Promise.all(promises)
      .then((res) => {
        console.log(res);
        return addNewNotifications([
          {
            id: 'songAddedtoPlaylists',
            delay: 5000,
            content: (
              <span>
                Added '{title}' to{' '}
                {selectedPlaylists.length > 3
                  ? `${selectedPlaylists
                      .filter((_, index) => index <= 3)
                      .map((playlist) => `'${playlist.name}'`)
                      .join(', ')} and ${
                      selectedPlaylists.length - 3
                    } other playlists.`
                  : `${selectedPlaylists
                      .map((playlist) => `'${playlist.name}'`)
                      .join(', ')} playlists.`}
              </span>
            ),
          },
        ]);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        changePromptMenuData(false);
      });
  }, [playlists, songId, title, changePromptMenuData, addNewNotifications]);

  const playlistComponents = React.useMemo(
    () =>
      playlists.length > 0
        ? playlists.map((playlist) => {
            return (
              <SelectablePlaylist
                name={playlist.name}
                createdDate={playlist.createdDate}
                playlistId={playlist.playlistId}
                songs={playlist.songs}
                artworkPaths={playlist.artworkPaths}
                isArtworkAvailable={playlist.isArtworkAvailable}
                isChecked={playlist.isSelected}
                playlistCheckedStateUpdateFunc={(state) => {
                  setPlaylists((prevData) => {
                    return prevData.map((data) => {
                      if (data.playlistId === playlist.playlistId)
                        return { ...data, isSelected: state };
                      return data;
                    });
                  });
                }}
                key={playlist.playlistId}
              />
            );
          })
        : [],
    [playlists]
  );

  return (
    <>
      <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        Select playlists to add '{title}' song
      </div>
      {playlistComponents.length > 0 && (
        <div className="playlists-container flex h-full flex-wrap">
          {playlistComponents}
        </div>
      )}
      <Button
        label="Add to Playlist"
        clickHandler={addSongsToPlaylists}
        className="float-right mb-4 rounded-lg !bg-background-color-3  px-12  text-font-color-black dark:!bg-dark-background-color-3 dark:text-font-color-black"
      />
    </>
  );
};

export default AddSongsToPlaylists;
