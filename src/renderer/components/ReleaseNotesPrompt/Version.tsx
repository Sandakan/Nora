/* eslint-disable react/no-array-index-key */
import calculateElapsedTime from 'renderer/utils/calculateElapsedTime';

import packageFile from '../../../../package.json';
import VersionNote, { VersionNoteProps } from './VersionNote';

interface VersionProp {
  version: string;
  releaseDate: string;
  isLatest: boolean;
  notes: {
    new?: VersionNoteProps[];
    fixed?: VersionNoteProps[];
    knownIssues?: VersionNoteProps[];
  };
}

const Version = (props: VersionProp) => {
  const { version, releaseDate, isLatest, notes } = props;
  const elapsed = calculateElapsedTime(releaseDate);
  const localeReleaseDate = new Date(releaseDate).toLocaleDateString();
  return (
    <div key={version} className="app-version group mb-8 px-4 pb-4 last:pb-8">
      <div className="version-info mb-4 flex justify-between text-lg font-medium">
        <span className="version text-font-color-highlight dark:text-dark-font-color-highlight">
          v{version} {version === packageFile.version && '(Current)'}
        </span>
        <span className="release-date">
          {elapsed && !elapsed.isFuture ? (
            <span
              className="text-font-color-highlight dark:text-dark-font-color-highlight"
              title={`Released on ${localeReleaseDate}`}
            >
              {isLatest ? <>Latest &bull;</> : ''}({elapsed.elapsed}{' '}
              {elapsed.type}
              {elapsed.elapsed === 1 ? '' : 's'} ago)
            </span>
          ) : (
            localeReleaseDate
          )}
        </span>
      </div>
      {Array.isArray(notes.new) && notes.new.length > 0 && (
        <>
          {' '}
          <h3 className="mb-2 px-4 text-lg">New Features and Updates</h3>
          <ul className="notes list-disc px-8 font-light text-[hsla(0,0%,0%,0.8)] marker:text-font-color-highlight dark:text-[hsla(0,0%,100%,0.8)] dark:marker:text-dark-font-color-highlight">
            {notes.new.map((note, index) => (
              <VersionNote
                key={`${version}-feature-${index}`}
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
          <ul className="notes list-disc px-8 font-light text-[hsla(0,0%,0%,0.8)] marker:text-font-color-highlight dark:text-[hsla(0,0%,100%,0.8)] dark:marker:text-dark-font-color-highlight">
            {notes.fixed.map((note, index) => (
              <VersionNote
                key={`${version}-fix-${index}`}
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
          <ul className="notes list-disc px-8 font-light text-[hsla(0,0%,0%,0.8)] marker:text-font-color-highlight dark:text-[hsla(0,0%,100%,0.8)] dark:marker:text-dark-font-color-highlight">
            {notes.knownIssues.map((note, index) => (
              <VersionNote
                key={`${version}-issue-${index}`}
                note={note.note}
                artworkPath={note.artworkPath}
              />
            ))}
          </ul>
        </>
      )}
      <div className="mb-4 mt-8 h-[2px] w-full bg-[hsla(0,0%,80%,0.25)] group-last:invisible" />
    </div>
  );
};

export default Version;
