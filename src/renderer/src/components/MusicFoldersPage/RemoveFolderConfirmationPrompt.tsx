import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Button from '../Button';

const RemoveFolderConfrimationPrompt = (props: { folderName: string; absolutePath: string }) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { folderName, absolutePath } = props;
  return (
    <>
      <div className="title-container mb-4 mt-1 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        {t('removeFolderConfirmationPrompt.title', { folderName })}
      </div>
      <div className="description">{t('removeFolderConfirmationPrompt.message')}</div>
      <div className="buttons-container flex items-center justify-end">
        <Button
          className="remove-folder-confirm-btn danger-btn float-right mt-8 h-10 w-48 cursor-pointer rounded-lg !bg-font-color-crimson font-medium text-font-color-white outline-none ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
          label={t('removeFolderConfirmationPrompt.removeFolder')}
          clickHandler={() => {
            window.api.folderData
              .removeAMusicFolder(absolutePath)
              .then(() => changePromptMenuData(false))
              .catch((err) => console.error(err));
          }}
        />
      </div>
    </>
  );
};

export default RemoveFolderConfrimationPrompt;
