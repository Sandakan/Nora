import { Trans, useTranslation } from 'react-i18next';

import storage from '../../utils/localStorage';

import Button from '../Button';

const ClearLocalStoragePrompt = () => {
  const { t } = useTranslation();

  const { resetLocalStorage } = storage;

  return (
    <>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        {t('clearLocalStoragePrompt.title')}
      </div>
      <p>{t('clearLocalStoragePrompt.description')}</p>

      <div className="info-about-affecting-files-container mt-4">
        <Trans
          i18nKey="clearLocalStoragePrompt.effect"
          components={{
            p: <p className="mb-1" />,
            ul: (
              <ul className="marker:text-font-color-highlight dark:marker:text-dark-font-color-highlight ml-4 list-inside list-disc" />
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
          className="confirm-app-reset-btn danger-btn bg-font-color-crimson! text-font-color-white hover:border-font-color-crimson dark:bg-font-color-crimson! dark:text-font-color-white dark:hover:border-font-color-crimson float-right mt-6 h-10 w-48 cursor-pointer rounded-lg outline-hidden ease-in-out"
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
