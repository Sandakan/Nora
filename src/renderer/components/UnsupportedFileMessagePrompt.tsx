import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import Button from 'renderer/components/Button';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import packageFile from '../../../package.json';

type Props = { filePath: string };
const { supportedMusicExtensions } = packageFile.appPreferences;

const supportedExtensionComponents = supportedMusicExtensions.map((ext) => (
  <span className="mx-2">
    &bull; <span className="hover:underline">{ext}</span>
  </span>
));

const UnsupportedFileMessagePrompt = (props: Props) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { filePath } = props;
  const fileType = filePath.split('.').at(-1)?.replace('.', '') ?? filePath;

  return (
    <div>
      <div className="title-container mb-4 text-3xl font-medium">
        {t('unsupportedFileMessagePrompt.title')}
      </div>
      <div className="description">
        <Trans
          i18nKey="unsupportedFileMessagePrompt.description"
          components={{
            span: <span className="underline">{fileType}</span>,
            div: <div className="mt-1">{supportedExtensionComponents}</div>,
            br: <br />,
          }}
        />
      </div>
      <div className="buttons-container mt-12 flex justify-end">
        <Button
          label={t('common.ok')}
          className="ok-btn w-[10rem] rounded-md !bg-background-color-3 !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
          clickHandler={() => {
            changePromptMenuData(false);
          }}
        />
      </div>
    </div>
  );
};

export default UnsupportedFileMessagePrompt;
