/* eslint-disable react/no-unescaped-entities */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import storage from 'renderer/utils/localStorage';
import Button from '../Button';
import Checkbox from '../Checkbox';

const BlacklistSongConfrimPrompt = (props: {
  songIds: string[];
  title?: string;
}) => {
  const { addNewNotifications, changePromptMenuData } =
    React.useContext(AppUpdateContext);
  const { songIds, title } = props;
  const [isDoNotShowAgain, setIsDoNotShowAgain] = React.useState(false);
  return (
    <>
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        Confirm Blacklisting{' '}
        {songIds.length === 1 && title ? (
          <>&apos;{title}&apos;</>
        ) : (
          `${songIds.length} songs`
        )}{' '}
        from the library
      </div>
      <div className="description">
        You are about to blacklist{' '}
        {songIds.length === 1 ? 'this song' : 'these songs'} from the libary.
        You can restore {songIds.length === 1 ? 'it' : 'them'} again from the
        Settings Page or by right clicking a blacklisted song. Your data related
        to {songIds.length === 1 ? 'this song' : 'these songs'} won't be
        affected by this action.
        <div className="mt-4">
          What Blacklisting a song does
          <ul className="list-inside list-disc pl-4 marker:text-font-color-highlight dark:marker:text-dark-font-color-highlight">
            <li>
              Will appear greyed out in the library with '
              <span className="material-icons-round text-font-color-highlight dark:text-dark-font-color-highlight">
                block
              </span>
              ' symbol
            </li>
            <li>
              Won't be added to the queue automatically or by{' '}
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight">
                'Shuffle and Play'
              </span>{' '}
              or{' '}
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight">
                'Play All'
              </span>{' '}
              unless you explicitly added them.
            </li>
            <li>
              Can still be played by double clicking or by selecting{' '}
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight">
                'Play'
              </span>{' '}
              or{' '}
              <span className="text-font-color-highlight dark:text-dark-font-color-highlight">
                'Play Next'
              </span>
              .
            </li>
          </ul>
        </div>
      </div>
      <Checkbox
        id="doNotShowAgainCheckbox"
        className="no-blacklist-song-confirm-checkbox-container mt-8"
        labelContent="Do not show this message again."
        isChecked={isDoNotShowAgain}
        checkedStateUpdateFunction={(state) => {
          setIsDoNotShowAgain(state);
        }}
      />
      <div className="buttons-container flex items-center justify-end">
        <Button
          label={`Blacklist Song${songIds.length !== 1 ? 's' : ''}`}
          className="blacklist-song-btn mt-4 !bg-background-color-3 px-8 text-lg text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
          clickHandler={() =>
            window.api
              .blacklistSongs(songIds)
              .then(() => {
                if (isDoNotShowAgain)
                  storage.preferences.setPreferences(
                    'isSongIndexingEnabled',
                    isDoNotShowAgain
                  );
                changePromptMenuData(false);
                return addNewNotifications([
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
                      <span className="material-icons-round">
                        delete_outline
                      </span>
                    ),
                  },
                ]);
              })
              .catch((err) => console.error(err))
          }
        />
      </div>
    </>
  );
};

export default BlacklistSongConfrimPrompt;
