import { Trans, useTranslation } from 'react-i18next';

import storage from '../../utils/localStorage';

import Button from '../Button';

const ClearLocalStoragePrompt = () => {
  const { t } = useTranslation();

  const { resetLocalStorage } = storage;

  return (
    <>
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        {t('clearLocalStoragePrompt.title')}
      </div>
      <p>{t('clearLocalStoragePrompt.description')}</p>

      <div className="info-about-affecting-files-container mt-4">
        <Trans
          i18nKey="clearLocalStoragePrompt.effect"
          components={{
            p: <p className="mb-1" />,
            ul: (
              <ul className="ml-4 list-inside list-disc marker:text-font-color-highlight dark:marker:text-dark-font-color-highlight" />
            ),
            li: <li className="text-sm font-light" />
          }}
        />
      </div>

      <br />
      <p> {t('clearLocalStoragePrompt.restartNotice')}</p>
      <div className="buttons-container flex items-center justify-end">
        <Button
          label={t('settingsPage.clearOptionalData')}
          className="confirm-app-reset-btn danger-btn float-right mt-6 h-10 w-48 cursor-pointer rounded-lg bg-font-color-crimson! text-font-color-white outline-hidden ease-in-out hover:border-font-color-crimson dark:bg-font-color-crimson! dark:text-font-color-white dark:hover:border-font-color-crimson"
          clickHandler={() => {
            resetLocalStorage();
            window.api.appControls.restartRenderer('LOCAL_STORAGE_CLEARED');
          }}
        />
      </div>
    </>
  );
};

export default ClearLocalStoragePrompt;
