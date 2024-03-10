import { Trans, useTranslation } from 'react-i18next';
import Button from '../Button';

export default () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        {t('resetAppConfirmationPrompt.confirmAppReset')}
      </div>
      <p>
        <Trans
          i18nKey="resetAppConfirmationPrompt.message"
          components={{
            span: <span className="font-semibold text-font-color-crimson" />
          }}
        />
      </p>
      <br />
      <p>{t('resetAppConfirmationPrompt.restartAfterReset')}</p>
      <div className="buttons-container flex items-center justify-end">
        <Button
          label={t('settingsPage.resetApp')}
          className="confirm-app-reset-btn danger-btn float-right mt-6 h-10 w-48 cursor-pointer rounded-lg !bg-font-color-crimson text-font-color-white outline-none ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
          clickHandler={() => window.api.appControls.resetApp()}
        />
      </div>
    </>
  );
};
