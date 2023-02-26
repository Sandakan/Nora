/* eslint-disable react/require-default-props */
import { ReactElement } from 'react';
import packageFile from '../../../package.json';
import Button from './Button';
import Hyperlink from './Hyperlink';

interface ErrorPromptProps {
  reason: string;
  message?: ReactElement<any, any>;
  showSendFeedbackBtn?: boolean;
}
export default (props: ErrorPromptProps) => {
  const { reason, message, showSendFeedbackBtn } = props;
  return (
    <>
      <div className="alert-icon-container">
        <div className="title-container mt-1 mb-4 flex items-center text-3xl font-medium uppercase text-font-color-crimson dark:text-font-color-crimson">
          <span className="material-icons-round icon mr-4 text-4xl">
            warning
          </span>
          <span className="font-semibold">Error Ocurred</span>
        </div>
      </div>
      {message && <div>{message}</div>}
      {showSendFeedbackBtn && (
        <>
          <br />
          <div>
            Please send us{' '}
            <Hyperlink
              label="feedback"
              linkTitle=""
              noValidityCheck
              link="mailto:sandakannipunajith@gmail.com?subject=Regarding Nora&body=If you found a bug in the app, please try to attach the log file of the app with a detailed explanation of the bug.%0d%0a%0d%0aYou can get to it by going to  Settings > About > Open Log File."
            />{' '}
            to improve the app or{' '}
            <Hyperlink
              label="create an issue"
              noValidityCheck
              linkTitle=""
              link={packageFile.bugs.url}
            />{' '}
            on Github.
          </div>
        </>
      )}
      <div className="buttons-container flex items-center justify-end">
        <Button
          label="Restart App"
          iconName="sync"
          className="mt-6 w-fit !bg-background-color-3 !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:text-font-color-black dark:hover:border-background-color-3"
          clickHandler={() => window.api.restartRenderer(reason)}
        />
      </div>
    </>
  );
};
