import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import { SpecialPlaylists } from '@common/playlists.enum';

interface ConfirmDeletePlaylistProp {
  playlistIds: number[];
  playlistName?: string;
}

const ConfirmDeletePlaylistsPrompt = (props: ConfirmDeletePlaylistProp) => {
  const { addNewNotifications, changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { playlistIds, playlistName } = props;

  const [playlistsData, setPlaylistsData] = useState<Playlist[]>([]);

  useEffect(() => {
    if (playlistIds.length > 0) {
      window.api.playlistsData
        .getPlaylistData(playlistIds)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            return setPlaylistsData(res);
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [playlistIds]);

  const arePlaylistsRemovable = useMemo(() => {
    return !playlistIds.some((playlistId) => SpecialPlaylists.isSpecialPlaylistId(playlistId));
  }, [playlistIds]);

  const removePlaylists = useCallback(() => {
    window.api.playlistsData
      .removePlaylists(playlistIds)
      .then(() => {
        changePromptMenuData(false);
        return addNewNotifications([
          {
            id: `playlistsDeleted`,
            duration: 5000,
            content: t('confirmDeletePlaylistsPrompt.playlistsDeletedWithCount', {
              count: playlistIds.length
            })
          }
        ]);
      })
      .catch((err) => console.error(err));
  }, [addNewNotifications, changePromptMenuData, playlistIds, t]);

  return (
    <>
      <div className="title-container text-font-color-black dark:text-font-color-white mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        {t('confirmDeletePlaylistsPrompt.confirmPlaylistDeleteWithCount', {
          count: playlistIds.length,
          playlistName
        })}
      </div>
      <div className="description">
        {t('confirmDeletePlaylistsPrompt.message', {
          count: playlistIds.length
        })}
        <div className="info-about-affecting-files-container mt-4">
          <p>{t('confirmDeletePlaylistsPrompt.modificationNotice')}</p>
          <ul className="ml-4 list-inside list-disc">
            {playlistsData.map((playlist) => (
              <li className="text-sm font-light" key={playlist.playlistId}>
                {playlist.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {!arePlaylistsRemovable && (
        <h4 className="text-font-color-crimson mt-8 flex items-center justify-center font-medium">
          <span className="material-icons-round-outlined mr-2 text-lg">warning</span>{' '}
          {t('resetAppConfirmationPrompt.systemPlaylistsRemovalProhibited')}
        </h4>
      )}
      {arePlaylistsRemovable && (
        <div className="buttons-container mt-8 flex w-full justify-end">
          <Button
            label={t('playlist.deletePlaylist', {
              count: playlistsData.length
            })}
            className="delete-playlist-btn danger-btn bg-font-color-crimson! text-font-color-white hover:border-font-color-crimson dark:bg-font-color-crimson! dark:text-font-color-white dark:hover:border-font-color-crimson float-right h-10 w-48 cursor-pointer rounded-lg border-transparent outline-hidden ease-in-out"
            clickHandler={removePlaylists}
          />
        </div>
      )}
    </>
  );
};

export default ConfirmDeletePlaylistsPrompt;
