/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';

import ReleaseNotesPrompt from '../../ReleaseNotesPrompt/ReleaseNotesPrompt';

const NewUpdateIndicator = () => {
  const { appUpdatesState } = React.useContext(AppContext);
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  return (
    <>
      {!(appUpdatesState === 'UNKNOWN') && (
        <div
          className={`new-update-indicator mr-1 flex cursor-pointer items-center justify-center rounded-md bg-background-color-2 px-3 py-1 text-center transition-[background] hover:text-font-color-highlight dark:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
            appUpdatesState === 'LATEST' && 'hidden'
          }`}
          title={
            appUpdatesState === 'OLD'
              ? 'New app update available.'
              : appUpdatesState === 'CHECKING'
              ? 'Checking for app updates...'
              : appUpdatesState === 'ERROR'
              ? 'Error occurred when checking for app updates.'
              : appUpdatesState === 'NO_NETWORK_CONNECTION'
              ? 'Error occurred when checking for app updates. No internet connection found.'
              : undefined
          }
          onClick={() => changePromptMenuData(true, <ReleaseNotesPrompt />)}
          role="button"
          tabIndex={0}
        >
          <span
            className={`material-icons-round-outlined py-[1px] text-lg leading-none ${
              navigator.onLine && ''
            }`}
          >
            {appUpdatesState === 'OLD'
              ? 'download'
              : appUpdatesState === 'LATEST'
              ? 'download_done'
              : appUpdatesState === 'CHECKING'
              ? 'sync'
              : 'warning'}
          </span>
        </div>
      )}
    </>
  );
};

export default NewUpdateIndicator;
