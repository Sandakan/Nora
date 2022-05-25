/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

export default (props: { songPath: string; title: string }) => {
  const { updateNotificationPanelData } = React.useContext(AppContext);
  const { songPath, title } = props;
  const isDontShowAgainRef = React.useRef({ isDontShowAgain: false });
  return (
    <>
      <div className="title-container">
        Confrim Removing {title} from the library
      </div>
      <div className="description">
        Removing this from the libary will blacklist it. But you can remove it
        from the blacklist from the Settings Page.
      </div>
      <div className="permanent-delete-checkbox-container">
        <input
          type="checkbox"
          name="permanentDelete"
          id="doNotShowAgainCheckbox"
          checked={isDontShowAgainRef.current.isDontShowAgain}
          onChange={(e) => {
            isDontShowAgainRef.current.isDontShowAgain =
              e.currentTarget.checked;
          }}
        />
        <label htmlFor="permanentDeleteCheckbox" className="info">
          Do not show this message again.
        </label>
      </div>
      <button
        type="button"
        className="remove-song-from-library-confirm-btn danger-btn"
        onClick={() =>
          window.api.deleteSongFromSystem(songPath).then(async (res) => {
            if (res.success) {
              if (isDontShowAgainRef.current.isDontShowAgain)
                window.api.saveUserData(
                  'preferences.doNotShowRemoveSongFromLibraryConfirm',
                  isDontShowAgainRef.current.isDontShowAgain
                );
              updateNotificationPanelData(
                5000,
                <span>
                  &apos;{title}&apos; blacklisted and removed from the library.
                </span>
              );
            }
            return undefined;
          })
        }
      >
        Delete Song
      </button>
    </>
  );
};
