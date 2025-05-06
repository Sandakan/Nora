import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Button from '../Button';

const RemoveFolderConfrimationPrompt = (props: { folderName: string; absolutePath: string }) => {
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { folderName, absolutePath } = props;
  return (
    <>
      <div className="title-container text-font-color-black dark:text-font-color-white mt-1 mb-4 text-3xl font-medium">
        {t('removeFolderConfirmationPrompt.title', { folderName })}
      </div>
      <div className="description">{t('removeFolderConfirmationPrompt.message')}</div>
      <div className="buttons-container flex items-center justify-end">
        <Button
          className="remove-folder-confirm-btn danger-btn bg-font-color-crimson! text-font-color-white hover:border-font-color-crimson dark:bg-font-color-crimson! dark:text-font-color-white dark:hover:border-font-color-crimson float-right mt-8 h-10 w-48 cursor-pointer rounded-lg font-medium outline-hidden ease-in-out"
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
