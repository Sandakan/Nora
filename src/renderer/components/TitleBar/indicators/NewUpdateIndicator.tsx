/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';

import Button from 'renderer/components/Button';
import ReleaseNotesPrompt from '../../ReleaseNotesPrompt/ReleaseNotesPrompt';

const NewUpdateIndicator = () => {
  const { appUpdatesState } = React.useContext(AppContext);
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  return (
    <>
      {!(appUpdatesState === 'UNKNOWN') && (
        <Button
          className={`new-update-indicator !mr-1 flex cursor-pointer items-center justify-center rounded-md !border-0 bg-background-color-2 !px-3 !py-1 text-center outline-1 outline-offset-1 transition-[background] hover:text-font-color-highlight focus-visible:!outline dark:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
            appUpdatesState === 'LATEST' && 'hidden'
          }`}
          iconClassName="material-icons-round-outlined"
          iconName={
            appUpdatesState === 'OLD'
              ? 'download'
              : appUpdatesState === 'LATEST'
                ? 'download_done'
                : appUpdatesState === 'CHECKING'
                  ? 'sync'
                  : 'warning'
          }
          tooltipLabel={t(
            appUpdatesState === 'OLD'
              ? 'common.newUpdateAvailable'
              : appUpdatesState === 'CHECKING'
                ? 'common.checkingForUpdates'
                : appUpdatesState === 'ERROR'
                  ? 'common.updateCheckError'
                  : appUpdatesState === 'NO_NETWORK_CONNECTION'
                    ? 'common.updateCheckErrorNoInternet'
                    : 'releaseNotesPrompt.latestVersion',
          )}
          clickHandler={() =>
            changePromptMenuData(true, <ReleaseNotesPrompt />)
          }
          isDisabled={appUpdatesState === 'LATEST'}
        />
      )}
    </>
  );
};

export default NewUpdateIndicator;
