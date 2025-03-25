import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../contexts/AppUpdateContext';

import Button from './Button';

type Props = { err?: Error };

const SongUnplayableErrorPrompt = (props: Props) => {
  const { changePromptMenuData, addNewNotifications } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  useEffect(() => {
    addNewNotifications([
      {
        id: 'unplayableSong',
        duration: 10000,
        content: t('songUnplayableErrorPrompt.title'),
        iconName: 'error_outline'
      }
    ]);
  }, [addNewNotifications, t]);

  const { err } = props;
  return (
    <div>
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-4">play_disabled</span>
        {t('songUnplayableErrorPrompt.title')}
      </div>
      <p>{t('songUnplayableErrorPrompt.description')}</p>
      <div className="mt-6">ERROR: {err?.message.split(':').at(-1) ?? 'UNKNOWN'}</div>
      <Button
        label={t('common.ok')}
        className="remove-song-from-library-btn float-right mt-2 w-[10rem] bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3"
        clickHandler={() => changePromptMenuData(false)}
      />
    </div>
  );
};

export default SongUnplayableErrorPrompt;
