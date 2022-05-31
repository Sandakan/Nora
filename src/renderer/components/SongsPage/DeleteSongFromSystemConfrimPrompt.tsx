/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import Checkbox from '../Checkbox';

export default (props: { songPath: string; title: string }) => {
  const { updateNotificationPanelData, changePromptMenuData } =
    React.useContext(AppContext);
  const { songPath, title } = props;
  const [isPermanentDelete, setIsPermenanentDelete] = React.useState(false);
  return (
    <>
      <div className="title-container">
        Delete &apos;{title}&apos; from system
      </div>
      <div className="description">
        This action cannot be undone. You will lose this song from your system
        and may not be able to recover it again.
      </div>
      <Checkbox
        id="permanentDelete"
        isChecked={isPermanentDelete}
        checkedStateUpdateFunction={setIsPermenanentDelete}
        labelContent="Permanently delete from the system."
      />
      <button
        type="button"
        className="delete-song-confirm-btn danger-btn"
        onClick={() => {
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
                  <span className="material-icons-twotone">done_all</span>
                )
            );
        }}
      >
        Delete Song
      </button>
    </>
  );
};
