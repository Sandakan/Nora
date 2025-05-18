import { lazy, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';

import Button from '../../Button';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

const ReleaseNotesPrompt = lazy(() => import('../../ReleaseNotesPrompt/ReleaseNotesPrompt'));

const NewUpdateIndicator = () => {
  const appUpdatesState = useStore(store, (state) => state.appUpdatesState);

  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  return (
    <>
      {!(appUpdatesState === 'UNKNOWN') && (
        <Button
          className={`new-update-indicator bg-background-color-2 hover:text-font-color-highlight dark:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight !mr-1 flex cursor-pointer items-center justify-center rounded-md !border-0 !px-3 !py-1 text-center outline-offset-1 transition-[background] focus-visible:!outline ${
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
                    : 'releaseNotesPrompt.latestVersion'
          )}
          clickHandler={() => changePromptMenuData(true, <ReleaseNotesPrompt />)}
          isDisabled={appUpdatesState === 'LATEST'}
        />
      )}
    </>
  );
};

export default NewUpdateIndicator;
