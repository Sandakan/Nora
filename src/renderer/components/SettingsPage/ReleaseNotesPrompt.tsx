/* eslint-disable react/no-array-index-key */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/require-default-props */
import React from 'react';
import app from '../../../../package.json';
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
          <img
            src={artworkPath}
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
  return (
    <div key={key} className="px-4 last:pb-8 group">
      <div className="version-info flex justify-between font-medium mb-4 text-lg">
        <span className="version">
          v{version} {version === app.version && '(Current)'}
        </span>
        <span className="release-date">
          {new Date(releaseDate).toDateString()} {isLatest && '(Latest)'}
        </span>
      </div>
      {Array.isArray(notes.new) && notes.new.length > 0 && (
        <>
          {' '}
          <h3 className="px-4 text-lg mb-2">New Features and Updates</h3>
          <ul className="notes list-disc marker:text-background-color-3 dark:marker:text-dark-background-color-3 px-8 font-light text-[hsla(0,0%,0%,0.8)] dark:text-[hsla(0,0%,100%,0.8)]">
            {notes.new.map((note, index) => (
              <NoteComponent
                key={index}
                note={note.note}
                artworkPath={note.artworkPath}
              />
            ))}
          </ul>
        </>
      )}
      {Array.isArray(notes.fixed) && notes.fixed.length > 0 && (
        <>
          <h3 className="px-4 text-lg mb-2">Fixes and Improvements</h3>
          <ul className="notes list-disc marker:text-background-color-3 dark:marker:text-dark-background-color-3 px-8 font-light text-[hsla(0,0%,0%,0.8)] dark:text-[hsla(0,0%,100%,0.8)]">
            {notes.fixed.map((note, index) => (
              <NoteComponent
                key={index}
                note={note.note}
                artworkPath={note.artworkPath}
              />
            ))}
          </ul>
        </>
      )}
      {Array.isArray(notes.knownIssues) && notes.knownIssues.length > 0 && (
        <>
          <h3 className="px-4 text-lg mb-2">Known Issues and Bugs</h3>
          <ul className="notes list-disc marker:text-background-color-3 dark:marker:text-dark-background-color-3 px-8 font-light text-[hsla(0,0%,0%,0.8)] dark:text-[hsla(0,0%,100%,0.8)]">
            {notes.knownIssues.map((note, index) => (
              <NoteComponent
                key={index}
                note={note.note}
                artworkPath={note.artworkPath}
              />
            ))}
          </ul>
        </>
      )}
      <div className="w-full h-[2px] bg-[hsla(0,0%,80%,0.25)] mt-8 mb-4 group-last:invisible" />
    </div>
  );
};

const ReleaseNotesPrompt = () => {
  const [releaseNotes, setReleaseNotes] = React.useState(
    localReleseNotes as Changelog
  );

  React.useEffect(() => {
    if (navigator.onLine) {
      fetch(app.releaseNotes.json)
        .then((res) => res.json())
        .then((res) => {
          // eslint-disable-next-line no-console
          console.log('fetched release notes from th server.', res);
          return setReleaseNotes(res);
        })
        // eslint-disable-next-line no-console
        .catch((err) => console.error(err));
    }
  }, []);

  return (
    <>
      <div className="w-full h-[500px]">
        {releaseNotes && (
          <>
            <h2 className="title-container text-center text-3xl font-medium mb-4">
              Changelog
              {navigator.onLine ? (
                releaseNotes.latestVersion.version === app.version ? (
                  <>
                    <br />
                    <span className="text-sm text-background-color-3">
                      You have the latest version.
                    </span>
                  </>
                ) : (
                  <>
                    <br />
                    <span className="text-sm text-foreground-color-1">
                      You do not have the latest version.
                    </span>{' '}
                    <span
                      className="text-[#6c5ce7] text-sm font-base underline"
                      onClick={() =>
                        window.api.openInBrowser(
                          'https://github.com/Sandakan/Oto-Music-for-Desktop/releases'
                        )
                      }
                      onKeyDown={() =>
                        window.api.openInBrowser(
                          'https://github.com/Sandakan/Oto-Music-for-Desktop/releases'
                        )
                      }
                      role="button"
                      tabIndex={0}
                    >
                      Update Now
                    </span>
                  </>
                )
              ) : (
                <>
                  <br />
                  <span className="text-sm text-foreground-color-1">
                    We couldn't check for new updates. Check you network
                    connection and try again.
                    <div>You may be viewing an outdated changelog.</div>
                  </span>
                </>
              )}
            </h2>
            {navigator.onLine && releaseNotes.latestVersion.artwork && (
              <div className="version-artwork-container p-4 mb-4">
                <img
                  src={`https://raw.githubusercontent.com/Sandakan/Oto-Music-for-Desktop/master${releaseNotes.latestVersion.artwork}`}
                  className="rounded-lg"
                  alt=""
                />
              </div>
            )}
            {releaseNotes.versions.map((version) => (
              <Version
                version={version.version}
                releaseDate={version.releaseDate}
                notes={version.notes}
                isLatest={
                  releaseNotes.latestVersion.version === version.version
                }
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default ReleaseNotesPrompt;
