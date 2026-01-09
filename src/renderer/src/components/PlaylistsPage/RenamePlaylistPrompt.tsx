/* eslint-disable jsx-a11y/no-autofocus */
import { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Img from '../Img';
import Button from '../Button';

type Props = { playlistData: Playlist };

const RenamePlaylistPrompt = (props: Props) => {
  const { playlistData } = props;
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { name, playlistId, artworkPaths } = playlistData;

  const [input, setInput] = useState(name);

  const renamePlaylist = useCallback(
    (newName: string) =>
      window.api.playlistsData
        .renameAPlaylist(playlistId, newName)
        .then(() => changePromptMenuData(false)),
    [changePromptMenuData, playlistId]
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="img-container relative mb-8 max-w-[50%] rounded-xl">
        <Img
          src={artworkPaths.artworkPath}
          alt="Playlist default cover"
          loading="eager"
          className="aspect-square w-full max-w-60 rounded-xl shadow-lg"
        />
      </div>
      <span className="mb-4 text-center text-2xl font-medium">
        {t('renamePlaylistPrompt.renamePlaylistWithName', { name })}
      </span>
      <input
        type="text"
        name="playlistName"
        className="playlist-name-input bg-background-color-2! text-font-color-black dark:bg-dark-background-color-2! dark:text-font-color-white w-fit max-w-[75%] min-w-100 rounded-2xl border-transparent px-6 py-3 text-lg outline-hidden"
        placeholder={t('renamePlaylistPrompt.playlistName')}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') renamePlaylist(e.currentTarget.value);
        }}
        autoFocus
      />
      <Button
        label={t('playlist.renamePlaylist')}
        iconName="edit"
        className="bg-background-color-3! text-font-color-black! dark:bg-dark-background-color-3! dark:text-font-color-black mt-6 mr-0! cursor-pointer justify-center p-2 px-8! py-3! text-lg"
        clickHandler={() => renamePlaylist(input)}
      />
    </div>
  );
};

export default RenamePlaylistPrompt;
