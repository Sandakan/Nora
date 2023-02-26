/* eslint-disable react/no-unescaped-entities */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';
import Checkbox from '../Checkbox';

const BlacklistFolderConfrimPrompt = (props: {
  folderPaths: string[];
  folderName?: string;
}) => {
  const { isMultipleSelectionEnabled } = React.useContext(AppContext);
  const { addNewNotifications, changePromptMenuData } =
    React.useContext(AppUpdateContext);
  const { folderPaths, folderName } = props;
  const [isDoNotShowAgain, setIsDoNotShowAgain] = React.useState(false);
  return (
    <>
      <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        Confirm Blacklisting{' '}
        {folderPaths.length === 1 && folderName ? (
          <>&apos;{folderName}&apos; folder</>
        ) : (
          `${folderPaths.length} folders`
        )}
        .
      </div>
      <div className="description">
        You are about to blacklist{' '}
        {folderPaths.length === 1 ? 'this folder' : 'these folders'}. You can
        restore {folderPaths.length === 1 ? 'it' : 'them'} again from the
        Folders Pane by right clicking a blacklisted folder. Your data related
        to {folderPaths.length === 1 ? 'this folder' : 'these folders'} won't be
        affected by this action.
        <div className="mt-4">
          What Blacklisting a folder does
          <ul className="list-inside list-disc pl-4 marker:text-font-color-highlight dark:marker:text-dark-font-color-highlight">
            <li>
              Will appear greyed out in the Folders pane with '
              <span className="material-icons-round text-font-color-highlight dark:text-dark-font-color-highlight">
                block
              </span>
              ' symbol
            </li>
            <li>Songs linked to this folder will also be blacklisted.</li>
          </ul>
        </div>
        <div className="mt-4">
          What happens to songs linked to a blacklisted folder
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
          label={`Blacklist Folder${folderPaths.length !== 1 ? 's' : ''}`}
          className="blacklist-folders-btn mt-4 !bg-background-color-3 px-8 text-lg text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
          clickHandler={() => {
            return window.api.blacklistFolders(folderPaths).then(() => {
              addNewNotifications([
                {
                  id: `${folderName}Blacklisted`,
                  delay: 5000,
                  content: (
                    <span>
                      &apos;
                      {isMultipleSelectionEnabled
                        ? `${folderPaths.length} folders`
                        : folderName}
                      &apos; blacklisted.
                    </span>
                  ),
                  icon: <span className="material-icons-round">block</span>,
                },
              ]);
              return changePromptMenuData(false);
            });
          }}
        />
      </div>
    </>
  );
};

export default BlacklistFolderConfrimPrompt;
