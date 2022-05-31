/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import Checkbox from '../Checkbox';

export default (props: { songPath: string; title: string }) => {
  const { updateNotificationPanelData, changePromptMenuData } =
    React.useContext(AppContext);
  const { songPath, title } = props;
  const [isDontShowAgain, setIsDontShowAgain] = React.useState(false);
  return (
    <>
      <div className="title-container">
        Confrim Removing &apos;{title}&apos; from the library
      </div>
      <div className="description">
        Removing this song from the libary will blacklist it. But you can
        restore it from the blacklist from the Settings Page. This song
        won&apos;t be bothering you again.
      </div>
      <Checkbox
        id="doNotShowAgainCheckbox"
        containerClassName="permanent-delete-checkbox-container"
        labelContent="Do not show this message again."
        isChecked={isDontShowAgain}
        checkedStateUpdateFunction={(state) => {
          setIsDontShowAgain(state);
        }}
      />
      <button
        type="button"
        className="remove-song-from-library-confirm-btn danger-btn"
        onClick={() =>
          window.api.removeSongFromLibrary(songPath).then(async (res) => {
            if (res.success) {
              if (isDontShowAgain)
                window.api.saveUserData(
                  'preferences.doNotShowRemoveSongFromLibraryConfirm',
                  isDontShowAgain
                );
              changePromptMenuData(false);
              updateNotificationPanelData(
                5000,
                <span>
                  &apos;{title}&apos; blacklisted and removed from the library.
                </span>,
                <span className="material-icons-round">delete_outline</span>
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
