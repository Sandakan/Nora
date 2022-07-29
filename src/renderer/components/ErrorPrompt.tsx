/* eslint-disable react/require-default-props */
import { ReactElement } from 'react';
import Button from './Button';

interface ErrorPromptProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reason: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message?: ReactElement<any, any>;
}
export default ({ reason, message }: ErrorPromptProps) => {
  return (
    <>
      <div className="alert-icon-container">
        <div className="title-container mt-1 mb-4 text-foreground-color-1 font-medium text-3xl uppercase dark:text-foreground-color-1 flex items-center">
          <span className="material-icons-round icon mr-4 text-4xl">
            warning
          </span>{' '}
          Error Ocurred
        </div>
      </div>
      {message && <div>{message}</div>}
      <Button
        label="Restart App"
        iconName="sync"
        className="!bg-background-color-3 dark:!bg-dark-background-color-3 text-font-color-black dark:text-font-color-black rounded-md w-fit float-right mt-6 hover:border-background-color-3 dark:hover:border-background-color-3"
        clickHandler={() => window.api.restartRenderer(reason)}
      />
    </>
  );
};
