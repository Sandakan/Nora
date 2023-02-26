import packageFile from '../../../../package.json';
import Hyperlink from '../Hyperlink';

const ReleaseNotesAppUpdateInfo = (props: { state: AppUpdatesState }) => {
  const { state } = props;
  if (state === 'LATEST') {
    return (
      <>
        <br />
        <span className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
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
        <Hyperlink
          className="font-base text-sm text-font-color-highlight-2 underline dark:text-dark-font-color-highlight-2"
          label="Update Now"
          link={`${packageFile.repository.url}/releases`}
          linkTitle="Nora Releases"
        />
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

export default ReleaseNotesAppUpdateInfo;
