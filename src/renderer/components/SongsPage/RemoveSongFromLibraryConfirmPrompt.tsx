/* eslint-disable react/no-unescaped-entities */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';
import Checkbox from '../Checkbox';

export default (props: { songIds: string[]; title?: string }) => {
  const { addNewNotifications, changePromptMenuData } =
    React.useContext(AppUpdateContext);
  const { songIds, title } = props;
  const [isDoNotShowAgain, setIsDoNotShowAgain] = React.useState(false);
  return (
    <>
      <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        Confrim Blacklisting{' '}
        {songIds.length === 1 && title ? (
          <>&apos;{title}&apos;</>
        ) : (
          `${songIds.length} songs`
        )}{' '}
        from the library
      </div>
      <div className="description">
        Removing {songIds.length !== 1 ? 'this song' : 'these songs'} from the
        libary will blacklist {songIds.length !== 1 ? 'it' : 'them'}. You can
        restore {songIds.length !== 1 ? 'it' : 'them'} again from the blacklist
        from the Settings Page. But you won't be able to restore data related to
        {songIds.length !== 1 ? 'this song' : 'these songs'} managed by this
        app. {songIds.length !== 1 ? 'This song' : 'These songs'} won&apos;t be
        bothering you again.
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
        label={`Blacklist Song${songIds.length !== 1 ? 's' : ''}`}
        className="remove-song-from-library-btn danger-btn  float-right h-10 w-48 cursor-pointer rounded-lg border-[transparent] !bg-font-color-crimson text-font-color-white outline-none transition-[background] ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
        clickHandler={() =>
          window.api.removeSongsFromLibrary(songIds).then(async (res) => {
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
                      {songIds.length === 1 && title ? (
                        <>&apos;{title}&apos;</>
                      ) : (
                        `${songIds.length} songs`
                      )}{' '}
                      blacklisted and removed from the library.
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
