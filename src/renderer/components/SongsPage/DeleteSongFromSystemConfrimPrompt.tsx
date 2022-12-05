/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Button from '../Button';
import Checkbox from '../Checkbox';

export default (props: { songPath: string; title: string; songId: string }) => {
  const { currentSongData } = React.useContext(AppContext);
  const { addNewNotifications, changePromptMenuData, clearAudioPlayerData } =
    React.useContext(AppUpdateContext);
  const { songPath, title, songId } = props;
  const [isPermanentDelete, setIsPermenanentDelete] = React.useState(false);
  return (
    <>
      <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        Delete &apos;{title}&apos; from system
      </div>
      <div className="description">
        You will lose this song from your system and may not be able to recover
        it again if you select &apos;Permanently delete from system&apos;
        option.
      </div>
      <Checkbox
        id="permanentDelete"
        isChecked={isPermanentDelete}
        checkedStateUpdateFunction={setIsPermenanentDelete}
        labelContent="Permanently delete from the system."
      />
      <Button
        label="Delete Song"
        className="delete-song-confirm-btn danger-btn float-right h-10 w-48 cursor-pointer rounded-lg border-[transparent] !bg-font-color-crimson text-font-color-white outline-none transition-[background] ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
        clickHandler={() => {
          changePromptMenuData(false);
          return window.api
            .deleteSongFromSystem(songPath, isPermanentDelete)
            .then((res) => {
              if (res.success) {
                if (songId === currentSongData.songId) clearAudioPlayerData();
                addNewNotifications([
                  {
                    id: `${title}Removed`,
                    delay: 5000,
                    content: (
                      <span>
                        {isPermanentDelete
                          ? `'${title}' song removed from the system.`
                          : `'${title}' song moved to the Recycle Bin.`}
                      </span>
                    ),
                    icon: (
                      <span className="material-icons-round icon">
                        done_all
                      </span>
                    ),
                  },
                ]);
              }
              return undefined;
            });
        }}
      />
    </>
  );
};
