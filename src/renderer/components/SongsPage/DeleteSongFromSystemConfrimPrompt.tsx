/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppContext';
import Button from '../Button';
import Checkbox from '../Checkbox';

export default (props: { songPath: string; title: string }) => {
  const { updateNotificationPanelData, changePromptMenuData } =
    React.useContext(AppUpdateContext);
  const { songPath, title } = props;
  const [isPermanentDelete, setIsPermenanentDelete] = React.useState(false);
  return (
    <>
      <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
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
        className="delete-song-confirm-btn danger-btn w-48 h-10 rounded-lg outline-none !bg-foreground-color-1 dark:!bg-foreground-color-1 text-font-color-white dark:text-font-color-white border-[transparent] float-right cursor-pointer hover:border-foreground-color-1 dark:hover:border-foreground-color-1 transition-[background] ease-in-out"
        clickHandler={() => {
          changePromptMenuData(false);
          return window.api
            .deleteSongFromSystem(songPath, isPermanentDelete)
            .then(
              (res) =>
                res.success &&
                updateNotificationPanelData(
                  5000,
                  <span>
                    {isPermanentDelete
                      ? `'${title}' song removed from the system.`
                      : `'${title}' song moved to the Recycle Bin.`}
                  </span>,
                  <span className="material-icons-round icon">done_all</span>
                )
            );
        }}
      />
    </>
  );
};
