/* eslint-disable promise/catch-or-return */

import { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Checkbox from '../Checkbox';
import Button from '../Button';
import Img from '../Img';
import { useSuspenseQuery } from '@tanstack/react-query';
import { playlistQuery } from '@renderer/queries/playlists';
import { SpecialPlaylists } from '@common/playlists.enum';

interface AddSongsToPlaylistProp {
  songIds: number[];
  title?: string;
}

interface SelectablePlaylistProp extends Playlist {
  isChecked: boolean;
  playlistCheckedStateUpdateFunc: (_state: boolean) => void;
}

const SelectablePlaylist = (props: SelectablePlaylistProp) => {
  const { t } = useTranslation();

  const { playlistId, artworkPaths, name, songs, playlistCheckedStateUpdateFunc, isChecked } =
    props;

  return (
    <div
      className={`playlist appear-from-bottom group ${playlistId} text-font-color-black dark:text-font-color-white mr-4 mb-6 flex h-52 w-38 flex-col justify-between rounded-xl p-4 ${
        isChecked
          ? 'bg-background-color-3 text-font-color-black! dark:bg-dark-background-color-3 dark:text-font-color-black!'
          : 'hover:bg-background-color-2 dark:hover:bg-dark-background-color-2'
      }`}
      onClick={() => playlistCheckedStateUpdateFunc(!isChecked)}
      onKeyDown={() => playlistCheckedStateUpdateFunc(!isChecked)}
      role="button"
      tabIndex={0}
    >
      <div className="playlist-cover-and-checkbox-container relative h-[70%] overflow-hidden">
        <Checkbox
          id={String(playlistId)}
          checkedStateUpdateFunction={playlistCheckedStateUpdateFunc}
          isChecked={isChecked}
          className="absolute right-3 bottom-3"
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
          className="title playlist-title w-full overflow-hidden text-xl text-ellipsis whitespace-nowrap"
          title={name}
        >
          {name}
        </div>
        <div className="playlist-no-of-songs text-sm font-light">
          {t('common.songWithCount', { count: songs.length })}
        </div>
      </div>
    </div>
  );
};

const AddSongsToPlaylistsPrompt = (props: AddSongsToPlaylistProp) => {
  const { changePromptMenuData, addNewNotifications } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { songIds } = props;
  const { data: playlists } = useSuspenseQuery({
    ...playlistQuery.all({ sortType: 'aToZ' }),
    select: (data) => data.data
  });

  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<number[]>([]);

  const addSongsToPlaylists = useCallback(() => {
    const selectedPlaylistsData = playlists.filter((playlist) =>
      selectedPlaylistIds.includes(playlist.playlistId)
    );
    const promises = selectedPlaylistsData.map(async (playlist) => {
      if (playlist.playlistId === SpecialPlaylists.Favorites)
        // Special ID for Favorites playlist
        return window.api.playerControls
          .toggleLikeSongs(songIds, true)
          .catch((err) => console.error(err));
      return window.api.playlistsData
        .addSongsToPlaylist(playlist.playlistId, songIds)
        .catch((err) => console.error(err));
    });
    Promise.all(promises)
      .then((res) => {
        console.log(res);
        return addNewNotifications([
          {
            id: 'songAddedtoPlaylists',
            duration: 5000,
            iconName: 'playlist_add',
            content: t('addSongsToPlaylistsPrompt.songsAddedToPlaylists', {
              count: songIds.length,
              playlistCount: selectedPlaylistsData.length
            })
          }
        ]);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        changePromptMenuData(false);
      });
  }, [playlists, songIds, selectedPlaylistIds, addNewNotifications, t, changePromptMenuData]);

  const playlistComponents = useMemo(
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
                isChecked={selectedPlaylistIds.includes(playlist.playlistId)}
                playlistCheckedStateUpdateFunc={(state) => {
                  setSelectedPlaylistIds((prevData) => {
                    if (state) {
                      return [...prevData, playlist.playlistId];
                    }
                    return prevData.filter((id) => id !== playlist.playlistId);
                  });
                }}
                key={playlist.playlistId}
              />
            );
          })
        : [],
    [playlists, selectedPlaylistIds]
  );

  const noOfSelectedPlaylists = useMemo(() => selectedPlaylistIds.length, [playlists]);

  return (
    <>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center pr-4 text-3xl font-medium">
        {t('addSongsToPlaylistsPrompt.selectPlaylistsToAdd', { count: songIds.length })}
      </div>
      {songIds.length > 1 && <p>&bull; {t('addSongsToPlaylistsPrompt.duplicationNotice')}</p>}
      {playlistComponents.length > 0 && (
        <div className="playlists-container mt-4 flex h-full flex-wrap">{playlistComponents}</div>
      )}
      <div className="buttons-and-other-info-container flex items-center justify-end">
        <span className="text-font-color-highlight dark:text-dark-font-color-highlight mr-12">
          {t('common.selectionWithCount', { count: noOfSelectedPlaylists })}
        </span>
        <div className="buttons-container flex">
          <Button
            label="Cancel"
            iconName="close"
            clickHandler={() => changePromptMenuData(false)}
          />
          <Button
            label={t('song.addToPlaylists')}
            iconName="playlist_add"
            clickHandler={addSongsToPlaylists}
            className="bg-background-color-3! text-font-color-black dark:bg-dark-background-color-3! dark:text-font-color-black! px-6"
          />
        </div>
      </div>
    </>
  );
};

export default AddSongsToPlaylistsPrompt;
