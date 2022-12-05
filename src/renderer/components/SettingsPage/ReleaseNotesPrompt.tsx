/* eslint-disable react/no-array-index-key */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/require-default-props */
import React from 'react';
import calculateElapsedTime from 'renderer/utils/calculateElapsedTime';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Checkbox from '../Checkbox';
import Img from '../Img';

import packageFile from '../../../../package.json';
import localReleseNotes from '../../../../release-notes.json';

interface Note {
  note: string;
  artworkPath?: string;
}

interface VersionProp {
  version: string;
  releaseDate: string;
  isLatest: boolean;
  notes: { new?: Note[]; fixed?: Note[]; knownIssues?: Note[] };
}

const NoteComponent = (props: Note) => {
  const { note, artworkPath } = props;
  const key = React.useId();
  return (
    <li className="mb-1 last:mb-4" key={key}>
      {note}
      {artworkPath && (
        <>
          <br />
          <Img
            src={artworkPath}
            noFallbacks
            className="my-4 mx-auto w-[80%] max-w-full"
            alt=""
          />
        </>
      )}
    </li>
  );
};

const Version = (props: VersionProp) => {
  const { version, releaseDate, isLatest, notes } = props;
  const key = React.useId();
  const elapsed = calculateElapsedTime(releaseDate);
  return (
    <div key={key} className="app-version group mb-8 px-4 pb-4 last:pb-8">
      <div className="version-info mb-4 flex justify-between text-lg font-medium">
        <span className="version text-font-color-highlight dark:text-dark-font-color-highlight">
          v{version} {version === packageFile.version && '(Current)'}
        </span>
        <span className="release-date">
          {elapsed && !elapsed.isFuture ? (
            <span
              className="text-font-color-highlight dark:text-dark-font-color-highlight"
              title={`Released on ${releaseDate}`}
            >
              {isLatest ? <>Latest &bull;</> : ''}({elapsed.elapsed}{' '}
              {elapsed.type}
              {elapsed.elapsed === 1 ? '' : 's'} ago)
            </span>
          ) : (
            new Date(releaseDate).toDateString()
          )}
        </span>
      </div>
      {Array.isArray(notes.new) && notes.new.length > 0 && (
        <>
          {' '}
          <h3 className="mb-2 px-4 text-lg">New Features and Updates</h3>
          <ul className="notes list-disc px-8 font-light text-[hsla(0,0%,0%,0.8)] marker:text-background-color-3 dark:text-[hsla(0,0%,100%,0.8)] dark:marker:text-dark-background-color-3">
            {notes.new.map((note, index) => (
              <NoteComponent
                key={`feature-${index}`}
                note={note.note}
                artworkPath={note.artworkPath}
              />
            ))}
          </ul>
        </>
      )}
      {Array.isArray(notes.fixed) && notes.fixed.length > 0 && (
        <>
          <h3 className="mb-2 px-4 text-lg">Fixes and Improvements</h3>
          <ul className="notes list-disc px-8 font-light text-[hsla(0,0%,0%,0.8)] marker:text-background-color-3 dark:text-[hsla(0,0%,100%,0.8)] dark:marker:text-dark-background-color-3">
            {notes.fixed.map((note, index) => (
              <NoteComponent
                key={`fix-${index}`}
                note={note.note}
                artworkPath={note.artworkPath}
              />
            ))}
          </ul>
        </>
      )}
      {Array.isArray(notes.knownIssues) && notes.knownIssues.length > 0 && (
        <>
          <h3 className="mb-2 px-4 text-lg">Known Issues and Bugs</h3>
          <ul className="notes list-disc px-8 font-light text-[hsla(0,0%,0%,0.8)] marker:text-background-color-3 dark:text-[hsla(0,0%,100%,0.8)] dark:marker:text-dark-background-color-3">
            {notes.knownIssues.map((note, index) => (
              <NoteComponent
                key={`issue-${index}`}
                note={note.note}
                artworkPath={note.artworkPath}
              />
            ))}
          </ul>
        </>
      )}
      <div className="mt-8 mb-4 h-[2px] w-full bg-[hsla(0,0%,80%,0.25)] group-last:invisible" />
    </div>
  );
};

const ReleaseNotesAppUpdateInfo = (props: { state: AppUpdatesState }) => {
  const { state } = props;
  if (state === 'LATEST') {
    return (
      <>
        <br />
        <span className="text-sm text-background-color-3">
          You have the latest version.
        </span>
      </>
    );
  }
  if (state === 'OLD') {
    return (
      <>
        <br />
        <span className="text-sm text-font-color-crimson">
          You do not have the latest version.
        </span>{' '}
        <span
          className="font-base text-sm text-font-color-highlight-2 underline dark:text-dark-font-color-highlight-2"
          onClick={() =>
            window.api.openInBrowser(`${packageFile.repository}/releases`)
          }
          onKeyDown={() =>
            window.api.openInBrowser(`${packageFile.repository}/releases`)
          }
          role="button"
          tabIndex={0}
        >
          Update Now
        </span>
      </>
    );
  }
  if (state === 'ERROR') {
    return (
      <>
        <br />
        <span className="text-sm text-font-color-crimson">
          Failed to check for new updates. Something is wrong in our end.
          <div>You may be viewing an outdated changelog.</div>
        </span>
      </>
    );
  }

  return (
    <>
      <br />
      <span className="text-sm text-font-color-crimson">
        We couldn't check for new updates. Check you network connection and try
        again.
        <div>You may be viewing an outdated changelog.</div>
      </span>
    </>
  );
};

const ReleaseNotesPrompt = () => {
  const { userData, appUpdatesState } = React.useContext(AppContext);
  const { updateUserData, updateAppUpdatesState } =
    React.useContext(AppUpdateContext);
  const [releaseNotes, setReleaseNotes] = React.useState(
    localReleseNotes as Changelog
  );
  const [noNewUpdateInform, setNoNewUpdateInform] = React.useState(
    userData?.preferences.noUpdateNotificationForNewUpdate ===
      releaseNotes.latestVersion.version
  );

  const updateNoNewUpdateInform = React.useCallback(
    (state: boolean) => {
      const result = state
        ? releaseNotes.latestVersion.version
        : packageFile.version;
      window.api
        .saveUserData('preferences.noUpdateNotificationForNewUpdate', result)
        .then(() => {
          updateUserData((prevUserData) => {
            return {
              ...prevUserData,
              preferences: {
                ...prevUserData.preferences,
                noUpdateNotificationForNewUpdate: result,
              },
            };
          });
          return setNoNewUpdateInform(state);
        })
        // eslint-disable-next-line no-console
        .catch((err) => console.error(err));
    },
    [releaseNotes.latestVersion.version, updateUserData]
  );

  React.useEffect(() => {
    if (navigator.onLine) {
      updateAppUpdatesState('CHECKING');

      fetch(packageFile.releaseNotes.json)
        .then((res) => {
          if (res.status === 200) return res.json();
          throw new Error('response status is not 200');
        })
        .then((res) => {
          // eslint-disable-next-line no-console
          console.log('fetched release notes from the server.', res);
          return setReleaseNotes(res);
        })
        // eslint-disable-next-line no-console
        .catch((err) => {
          updateAppUpdatesState('ERROR');
          console.error(err);
        });
    } else updateAppUpdatesState('NO_NETWORK_CONNECTION');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLatestVersion = React.useMemo(() => {
    // Learn more about semantic versioning on https://semver.org/
    // Semantic version checking regex from https://regex101.com/r/vkijKf/1/
    // Pre-release is in the form (alpha|beta)+YYYYMMDDNN where NN is a number in range 0 to 99.
    const semVerRegex =
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    // Lv - Latest Version
    const latestVersion = releaseNotes.latestVersion.version.match(semVerRegex);
    // Cv - Current Version
    const currentVersion = packageFile.version.split('-');

    if (latestVersion && currentVersion) {
      const [, LvMajor, LvMinor, LvPatch, LvPreRelease] = latestVersion;
      const [, CvMajor, CvMinor, CvPatch, CvPreRelease] = currentVersion;
      return !(
        `${LvMajor}.${LvMinor}.${LvPatch}` >
          `${CvMajor}.${CvMinor}.${CvPatch}` || LvPreRelease > CvPreRelease
      );
    }
    return false;
  }, [releaseNotes.latestVersion.version]);

  React.useEffect(() => {
    updateAppUpdatesState(isLatestVersion ? 'LATEST' : 'OLD');
  }, [isLatestVersion, updateAppUpdatesState]);

  const appVersionComponents = React.useMemo(
    () =>
      releaseNotes.versions.map((version) => (
        <Version
          version={version.version}
          releaseDate={version.releaseDate}
          notes={version.notes}
          isLatest={releaseNotes.latestVersion.version === version.version}
        />
      )),
    [releaseNotes]
  );

  return (
    <>
      <div className="h-full w-full">
        {releaseNotes && (
          <>
            <h2 className="title-container mb-2 text-center text-3xl font-medium">
              Changelog
              <ReleaseNotesAppUpdateInfo state={appUpdatesState} />
            </h2>
            {navigator.onLine && !isLatestVersion && (
              <div className="mb-2 grid place-items-center">
                <Checkbox
                  id="noNewUpdateInformCheckbox"
                  className="text-sm"
                  isChecked={noNewUpdateInform}
                  labelContent="Do not remind me again about this version of the app."
                  checkedStateUpdateFunction={(state) =>
                    updateNoNewUpdateInform(state)
                  }
                />
              </div>
            )}
            {navigator.onLine && releaseNotes.latestVersion.artwork && (
              <div className="version-artwork-container mb-4 p-4">
                <Img
                  src={`${packageFile.urls.raw_repository_url}master${releaseNotes.latestVersion.artwork}`}
                  noFallbacks
                  className="rounded-lg"
                  alt=""
                />
              </div>
            )}
            {appVersionComponents}
          </>
        )}
      </div>
    </>
  );
};

export default ReleaseNotesPrompt;
