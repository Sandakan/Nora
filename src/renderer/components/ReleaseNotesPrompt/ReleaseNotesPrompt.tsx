/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import useNetworkConnectivity from 'renderer/hooks/useNetworkConnectivity';

import isLatestVersion from 'renderer/utils/isLatestVersion';
import storage from 'renderer/utils/localStorage';

import Version from './Version';
import Checkbox from '../Checkbox';
import Img from '../Img';

import packageFile from '../../../../package.json';
import localReleseNotes from '../../../../release-notes.json';
import ReleaseNotesAppUpdateInfo from './ReleaseNotesAppUpdateInfo';

const ReleaseNotesPrompt = () => {
  const { appUpdatesState, localStorageData } = React.useContext(AppContext);
  const { updateAppUpdatesState } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { isOnline } = useNetworkConnectivity();
  const [releaseNotes, setReleaseNotes] = React.useState<Changelog>(
    localReleseNotes satisfies Changelog,
  );

  const latestUpdatedInfo = React.useMemo(() => {
    const sortedReleaseNotes = releaseNotes.versions.sort(
      (versionA, versionB) => {
        const dateNowOfA = new Date(versionA.releaseDate).getTime();
        const dateNowOfB = new Date(versionB.releaseDate).getTime();

        if (dateNowOfA === dateNowOfB) return 0;
        if (dateNowOfA > dateNowOfB) return -1;
        return 1;
      },
    );

    const latestVersion = sortedReleaseNotes[0];

    // ! / / / / TO BE DEPRECATED CODE / / /
    /** @deprecated  */
    if (releaseNotes.latestVersion) {
      latestVersion.artwork ||= releaseNotes.latestVersion.artwork;
      latestVersion.importantNotes ??=
        releaseNotes.latestVersion.importantNotes;
    }
    //! / / / / /

    return latestVersion;
  }, [releaseNotes.latestVersion, releaseNotes.versions]);

  const noNewUpdateInform = React.useMemo(
    () =>
      localStorageData?.preferences?.noUpdateNotificationForNewUpdate ===
      latestUpdatedInfo.version,
    [
      latestUpdatedInfo.version,
      localStorageData?.preferences?.noUpdateNotificationForNewUpdate,
    ],
  );

  const updateNoNewUpdateInform = React.useCallback(
    (state: boolean) => {
      const result = state ? latestUpdatedInfo.version : packageFile.version;
      storage.preferences.setPreferences(
        'noUpdateNotificationForNewUpdate',
        result,
      );
    },
    [latestUpdatedInfo.version],
  );

  React.useEffect(() => {
    if (isOnline) {
      updateAppUpdatesState('CHECKING');

      fetch(packageFile.releaseNotes.json)
        .then((res) => {
          if (res.status === 200) return res.json();
          throw new Error('response status is not 200');
        })
        .then((res: Changelog) => {
          console.log('fetched release notes from the server.', res);
          return setReleaseNotes(res);
        })
        .catch((err) => {
          updateAppUpdatesState('ERROR');
          console.error(err);
        });
    } else updateAppUpdatesState('NO_NETWORK_CONNECTION');
  }, [isOnline, updateAppUpdatesState]);

  const isAppLatestVersion = React.useMemo(
    () => isLatestVersion(latestUpdatedInfo.version, packageFile.version),
    [latestUpdatedInfo.version],
  );

  React.useEffect(() => {
    if (isOnline) updateAppUpdatesState(isAppLatestVersion ? 'LATEST' : 'OLD');
  }, [isAppLatestVersion, isOnline, updateAppUpdatesState]);

  const appVersionComponents = React.useMemo(
    () =>
      releaseNotes.versions.map((version) => (
        <Version
          key={version.version}
          version={version.version}
          releaseDate={version.releaseDate}
          notes={version.notes}
          isLatest={latestUpdatedInfo.version === version.version}
        />
      )),
    [latestUpdatedInfo.version, releaseNotes.versions],
  );

  const latestVersionImportantNotes = React.useMemo(() => {
    if (latestUpdatedInfo.importantNotes) {
      const notes = latestUpdatedInfo.importantNotes.map((note) => {
        return (
          <li className="latest-version-important-note mb-2 max-w-[90%] font-medium">
            {note}
          </li>
        );
      });

      return (
        <ul className="mb-12 mt-8 flex list-disc flex-col justify-center px-8 marker:text-font-color-highlight dark:marker:text-dark-font-color-highlight">
          {notes}
        </ul>
      );
    }
    return undefined;
  }, [latestUpdatedInfo.importantNotes]);

  return (
    <>
      <div className="h-full w-full">
        {releaseNotes && (
          <>
            <h2 className="title-container mb-2 text-center text-3xl font-medium">
              {t('releaseNotesPrompt.changelog')}
              <ReleaseNotesAppUpdateInfo state={appUpdatesState} />
            </h2>
            {isOnline && !isAppLatestVersion && (
              <div className="mb-2 grid place-items-center">
                <Checkbox
                  id="noNewUpdateInformCheckbox"
                  className="text-sm"
                  isChecked={noNewUpdateInform}
                  labelContent={t(
                    'releaseNotesPrompt.doNotRemindThisVersionUpdate',
                  )}
                  checkedStateUpdateFunction={(state) =>
                    updateNoNewUpdateInform(state)
                  }
                />
              </div>
            )}
            {isOnline && latestUpdatedInfo.artwork && (
              <div className="version-artwork-container mb-4 p-4 empty:mb-0 empty:p-0">
                <Img
                  src={`${packageFile.urls.raw_repository_url}master${latestUpdatedInfo.artwork}`}
                  fallbackSrc={latestUpdatedInfo.artwork}
                  className="mx-auto rounded-lg"
                  alt=""
                />
              </div>
            )}
            {latestVersionImportantNotes}
            {appVersionComponents}
          </>
        )}
      </div>
    </>
  );
};

export default ReleaseNotesPrompt;
