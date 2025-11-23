import { Trans, useTranslation } from 'react-i18next';
import { repository } from '../../../../../package.json';
import Hyperlink from '../Hyperlink';

const ReleaseNotesAppUpdateInfo = (props: { state: AppUpdatesState }) => {
  const { t } = useTranslation();

  const { state } = props;
  if (state === 'LATEST') {
    return (
      <>
        <br />
        <span className="text-font-color-highlight dark:text-dark-font-color-highlight text-sm">
          {t('releaseNotesPrompt.latestVersion')}
        </span>
      </>
    );
  }
  if (state === 'OLD') {
    return (
      <Trans
        i18nKey="releaseNotesPrompt.oldVersion"
        components={{
          br: <br />,
          span: <span className="text-font-color-crimson text-sm" />,
          Hyperlink: (
            <Hyperlink
              className="font-base text-font-color-highlight-2 dark:text-dark-font-color-highlight-2 text-sm underline"
              link={`${repository.url}/releases`}
              linkTitle={t('releaseNotesPrompt.noraReleases')}
            />
          )
        }}
      />
    );
  }
  if (state === 'ERROR') {
    return (
      <Trans
        i18nKey="releaseNotesPrompt.versionCheckError"
        components={{
          br: <br />,
          div: <div />,
          span: <span className="text-font-color-crimson text-sm" />
        }}
      />
    );
  }

  return (
    <Trans
      i18nKey="releaseNotesPrompt.versionCheckNetworkError"
      components={{
        br: <br />,
        div: <div />,
        span: <span className="text-font-color-crimson text-sm" />
      }}
    />
  );
};

export default ReleaseNotesAppUpdateInfo;
