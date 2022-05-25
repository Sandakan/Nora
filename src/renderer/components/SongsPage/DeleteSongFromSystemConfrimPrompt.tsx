/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

export default (props: { songPath: string; title: string }) => {
  const { updateNotificationPanelData } = React.useContext(AppContext);
  const { songPath, title } = props;
  // const isPermanentDeleteRef = React.useRef({ isPermanentDelete: false });
  return (
    <>
      <div className="title-container">
        Delete &apos;{title}&apos; from system
      </div>
      <div className="description">
        This action cannot be undone. You will lose this song
      </div>
      {/* <div className="permanent-delete-checkbox-container">
        <input
          type="checkbox"
          name="permanentDelete"
          id="permanenetDeleteCheckbox"
          checked={isPermanentDeleteRef.current.isPermanentDelete}
          onChange={(e) => {
            isPermanentDeleteRef.current.isPermanentDelete =
              e.currentTarget.checked;
          }}
        />
        <label htmlFor="permanentDeleteCheckbox" className="info">
          Permanently delete from the system.
        </label>
      </div> */}
      <button
        type="button"
        className="delete-song-confirm-btn danger-btn"
        onClick={() =>
          window.api
            .deleteSongFromSystem(
              songPath
              // isPermanentDeleteRef.current.isPermanentDelete
            )
            .then(
              (res) =>
                res.success &&
                updateNotificationPanelData(
                  5000,
                  <span>
                    &apos;{title}&apos; song removed from the library.
                  </span>
                )
            )
        }
      >
        Delete Song
      </button>
    </>
  );
};
