import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { appPreferences } from '../../../../package.json';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import { store } from '../store/store';
import Button from './Button';

type Props = { err?: Error; songPath?: string };

const { supportedMusicExtensions } = appPreferences;

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

  const { err, songPath: providedSongPath } = props;
  const errorMessage = err?.message.split(':').at(-1) ?? 'UNKNOWN';

  // Get song path from props or from store's current song data
  const songPath = providedSongPath || store.state.currentSongData?.path || '';

  // Detect if this is a codec/format support error (DEMUXER_ERROR suggests format issue)
  const isFormatError =
    errorMessage.includes('DEMUXER_ERROR') || errorMessage.includes('NotSupportedError');
  const fileExtension = songPath?.split('.').at(-1)?.toLowerCase() ?? '';
  const isFLAC = fileExtension === 'flac';

  console.log('Detected unplayable song error:', {
    errorMessage,
    isFormatError,
    fileExtension,
    isFLAC
  });

  const supportedExtensionComponents = supportedMusicExtensions.map((ext) => (
    <span className="mx-2" key={ext}>
      &bull; <span className="hover:underline">{ext}</span>
    </span>
  ));

  return (
    <div>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        <span className="material-icons-round-outlined mr-4">play_disabled</span>
        {isFormatError
          ? t('songUnplayableErrorPrompt.formatNotSupportedTitle')
          : t('songUnplayableErrorPrompt.title')}
      </div>

      {isFormatError ? (
        <div>
          <p className="mb-4">
            {isFLAC
              ? t('songUnplayableErrorPrompt.flacNotSupportedDescription')
              : t('songUnplayableErrorPrompt.formatNotSupportedDescription')}
          </p>
          <div className="bg-background-color-2 dark:bg-dark-background-color-2 mb-4 rounded-lg p-4">
            <p className="mb-2 text-sm font-semibold">
              {t('songUnplayableErrorPrompt.supportedFormatsLabel')}
            </p>
            <div className="flex flex-wrap">{supportedExtensionComponents}</div>
          </div>
          {isFLAC && (
            <div className="bg-background-color-1 dark:bg-dark-background-color-1 rounded-lg p-3 text-sm">
              <p className="text-font-color-secondary dark:text-dark-font-color-secondary">
                {t('songUnplayableErrorPrompt.flacConversionHint')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p>{t('songUnplayableErrorPrompt.description')}</p>
      )}

      <div className="text-font-color-secondary dark:text-dark-font-color-secondary mt-6 text-xs">
        ERROR: {errorMessage}
      </div>
      <Button
        label={t('common.ok')}
        className="remove-song-from-library-btn bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 float-right mt-2 w-[10rem]"
        clickHandler={() => changePromptMenuData(false)}
      />
    </div>
  );
};

export default SongUnplayableErrorPrompt;
