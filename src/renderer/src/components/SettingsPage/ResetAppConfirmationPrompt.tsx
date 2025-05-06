import { Trans, useTranslation } from 'react-i18next';
import Button from '../Button';

export const ResetAppConfirmationPrompt = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        {t('resetAppConfirmationPrompt.confirmAppReset')}
      </div>
      <p>
        <Trans
          i18nKey="resetAppConfirmationPrompt.message"
          components={{
            span: <span className="text-font-color-crimson font-semibold" />
          }}
        />
      </p>
      <br />
      <p>{t('resetAppConfirmationPrompt.restartAfterReset')}</p>
      <div className="buttons-container flex items-center justify-end">
        <Button
          label={t('settingsPage.resetApp')}
          className="confirm-app-reset-btn danger-btn bg-font-color-crimson! text-font-color-white hover:border-font-color-crimson dark:bg-font-color-crimson! dark:text-font-color-white dark:hover:border-font-color-crimson float-right mt-6 h-10 w-48 cursor-pointer rounded-lg outline-hidden ease-in-out"
          clickHandler={() => window.api.appControls.resetApp()}
        />
      </div>
    </>
  );
};

export default ResetAppConfirmationPrompt;
