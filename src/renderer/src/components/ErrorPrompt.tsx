import { type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import Button from './Button';
import Hyperlink from './Hyperlink';

import packageFile from '../../../../package.json';

interface ErrorPromptProps {
  reason: string;
  message?: ReactNode;
  showSendFeedbackBtn?: boolean;
}
const ErrorPrompt = (props: ErrorPromptProps) => {
  const { t } = useTranslation();

  const { reason, message, showSendFeedbackBtn } = props;
  return (
    <>
      <div className="alert-icon-container">
        <div className="title-container mb-4 mt-1 flex items-center text-3xl font-medium uppercase text-font-color-crimson dark:text-font-color-crimson">
          <span className="material-icons-round icon mr-4 text-4xl">warning</span>
          <span className="font-semibold">{t('errorPrompt.title')}</span>
        </div>
      </div>
      {message && <div>{message}</div>}
      {showSendFeedbackBtn && (
        <>
          <br />
          <div>
            <Trans
              i18nKey="errorPrompt.sendErrorInfo"
              components={{
                Hyperlink1: (
                  <Hyperlink
                    noValidityCheck
                    link="mailto:sandakannipunajith@gmail.com?subject=Regarding Nora&body=If you found a bug in the app, please try to attach the log file of the app with a detailed explanation of the bug.%0d%0a%0d%0aYou can get to it by going to  Settings > About > Open Log File."
                  />
                ),
                Hyperlink2: <Hyperlink noValidityCheck linkTitle="" link={packageFile.bugs.url} />
              }}
            />
          </div>
        </>
      )}
      <div className="buttons-container flex items-center justify-end">
        <Button
          label={t('common.restartApp')}
          iconName="sync"
          className="mt-6 w-fit !bg-background-color-3 !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:text-font-color-black dark:hover:border-background-color-3"
          clickHandler={() => window.api.appControls.restartRenderer(reason)}
        />
      </div>
    </>
  );
};

export default ErrorPrompt;
