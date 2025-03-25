/* eslint-disable jsx-a11y/no-autofocus */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import Img from '../Img';

import PlaylistDefaultCover from '../../assets/images/webp/playlist_cover_default.webp';

interface NewPlaylistPromptProp {
  updatePlaylists: (_updatedPlaylist: Playlist[]) => void;
  currentPlaylists: Playlist[];
}

const NewPlaylistPrompt = (props: NewPlaylistPromptProp) => {
  const { changePromptMenuData, addNewNotifications } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [input, setInput] = useState('');
  const [artworkPath, setArtworkPath] = useState('');

  const createNewPlaylist = (playlistName: string) => {
    if (playlistName !== '') {
      window.api.playlistsData
        .addNewPlaylist(playlistName.trim(), undefined, artworkPath)
        .then((res) => {
          if (res && res.success && res.playlist) {
            changePromptMenuData(false);
            props.updatePlaylists([...props.currentPlaylists, res.playlist]);
            addNewNotifications([
              {
                id: 'playlistCreated',
                duration: 5000,
                content: t('newPlaylistPrompt.addPlaylistSuccess')
              }
            ]);
          } else {
            addNewNotifications([
              {
                id: 'playlistCreateFailed',
                duration: 5000,
                // eslint-disable-next-line react/jsx-no-useless-fragment
                content: <>{res.message}</>
              }
            ]);
          }
        });
    } else
      addNewNotifications([
        {
          id: 'EmptyPlaylistName',
          duration: 5000,
          content: t('newPlaylistPrompt.playlistNameEmpty')
        }
      ]);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="img-container relative mb-8 max-w-[50%] rounded-xl">
        <Img
          src={artworkPath ? `nora://localfiles/${artworkPath}` : PlaylistDefaultCover}
          alt="Playlist default cover"
          loading="eager"
          className="aspect-square w-full max-w-[15rem] rounded-xl shadow-lg"
        />
        <Button
          className="artwork-update-btn bg-background-color-3! hover:bg-font-color-highlight! dark:bg-dark-background-color-2! dark:hover:bg-dark-background-color-3! dark:hover:text-font-color-black absolute -right-8 -bottom-4 mr-0 aspect-square rounded-full border-none outline outline-offset-1 transition-[background] focus-visible:outline!"
          iconName="edit"
          iconClassName="group:hover:text-font-color-black dark:group:hover:text-font-color-black mr-0"
          clickHandler={() =>
            window.api.songUpdates
              .getImgFileLocation()
              .then((res) => setArtworkPath(res))
              // eslint-disable-next-line no-console
              .catch((err) => console.error(err))
          }
        />
      </div>
      <span className="mb-4 text-center text-2xl font-medium">
        {t('newPlaylistPrompt.addNewPlaylist')}{' '}
      </span>
      <input
        type="text"
        name="playlistName"
        className="playlist-name-input bg-background-color-2! text-font-color-black dark:bg-dark-background-color-2! dark:text-font-color-white w-fit max-w-[75%] min-w-[400px] rounded-2xl border-[transparent] px-6 py-3 text-lg outline-hidden"
        placeholder={t('renamePlaylistPrompt.playlistName')}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') createNewPlaylist(e.currentTarget.value);
        }}
        autoFocus
      />
      <Button
        label={t('playlistsPage.addPlaylist')}
        iconName="add"
        className="bg-background-color-3! text-font-color-black! dark:bg-dark-background-color-3! dark:text-font-color-black mt-6 mr-0! cursor-pointer justify-center p-2 px-8! py-3! text-lg"
        clickHandler={() => createNewPlaylist(input)}
      />
    </div>
  );
};

export default NewPlaylistPrompt;
