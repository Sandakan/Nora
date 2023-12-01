/* eslint-disable jsx-a11y/no-autofocus */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import Img from '../Img';
import Button from '../Button';

type Props = { playlistData: Playlist };

const RenamePlaylistPrompt = (props: Props) => {
  const { playlistData } = props;
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { name, playlistId, artworkPaths } = playlistData;

  const [input, setInput] = React.useState(name);

  const renamePlaylist = React.useCallback(
    (newName: string) =>
      window.api.playlistsData
        .renameAPlaylist(playlistId, newName)
        .then(() => changePromptMenuData(false)),
    [changePromptMenuData, playlistId],
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="img-container relative mb-8 max-w-[50%] rounded-xl">
        <Img
          src={artworkPaths.artworkPath}
          alt="Playlist default cover"
          loading="eager"
          className="aspect-square w-full max-w-[15rem] rounded-xl shadow-lg"
        />
      </div>
      <span className="mb-4 text-center text-2xl font-medium">
        {t('renamePlaylistPrompt.renamePlaylistWithName', { name })}
      </span>
      <input
        type="text"
        name="playlistName"
        className="playlist-name-input w-fit min-w-[400px] max-w-[75%] rounded-2xl border-[transparent] !bg-background-color-2 px-6 py-3 text-lg text-font-color-black outline-none dark:!bg-dark-background-color-2 dark:text-font-color-white"
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
        className="!mr-0 mt-6 cursor-pointer justify-center !bg-background-color-3 p-2 !px-8 !py-3 text-lg !text-font-color-black dark:!bg-dark-background-color-3 dark:text-font-color-black"
        clickHandler={() => renamePlaylist(input)}
      />
    </div>
  );
};

export default RenamePlaylistPrompt;
