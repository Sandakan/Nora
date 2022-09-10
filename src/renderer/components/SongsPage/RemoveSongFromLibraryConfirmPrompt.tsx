/* eslint-disable react/no-unescaped-entities */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppContext';
import Button from '../Button';
import Checkbox from '../Checkbox';

export default (props: { songPath: string; title: string }) => {
  const { addNewNotifications, changePromptMenuData } =
    React.useContext(AppUpdateContext);
  const { songPath, title } = props;
  const [isDoNotShowAgain, setIsDoNotShowAgain] = React.useState(false);
  return (
    <>
      <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
        Confrim Blacklisting &apos;{title}&apos; from the library
      </div>
      <div className="description">
        Removing this song from the libary will blacklist it. You can restore it
        again from the blacklist from the Settings Page. But you won't be able
        to restore data related to this song managed by this app. This song
        won&apos;t be bothering you again.
      </div>
      <Checkbox
        id="doNotShowAgainCheckbox"
        className="permanent-delete-checkbox-container"
        labelContent="Do not show this message again."
        isChecked={isDoNotShowAgain}
        checkedStateUpdateFunction={(state) => {
          setIsDoNotShowAgain(state);
        }}
      />
      <Button
        label="Blacklist Song"
        className="remove-song-from-library-btn danger-btn  w-48 h-10 rounded-lg outline-none !bg-foreground-color-1 dark:!bg-foreground-color-1 text-font-color-white dark:text-font-color-white border-[transparent] float-right cursor-pointer hover:border-foreground-color-1 dark:hover:border-foreground-color-1 transition-[background] ease-in-out"
        clickHandler={() =>
          window.api.removeSongFromLibrary(songPath).then(async (res) => {
            if (res.success) {
              if (isDoNotShowAgain)
                window.api.saveUserData(
                  'preferences.doNotShowRemoveSongFromLibraryConfirm',
                  isDoNotShowAgain
                );
              changePromptMenuData(false);
              addNewNotifications([
                {
                  id: `${title}Blacklisted`,
                  delay: 5000,
                  content: (
                    <span>
                      &apos;{title}&apos; blacklisted and removed from the
                      library.
                    </span>
                  ),
                  icon: (
                    <span className="material-icons-round">delete_outline</span>
                  ),
                },
              ]);
            }
            return undefined;
          })
        }
      />
    </>
  );
};
