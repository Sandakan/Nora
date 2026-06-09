import { lazy, useCallback, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import log from '../utils/log';

const ErrorPrompt = lazy(() => import('../components/ErrorPrompt'));

const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

export function usePlaybackErrors(
  player: HTMLAudioElement,
  changePromptMenuData: (isVisible?: boolean, prompt?: React.ReactNode | null) => void,
  skipSongRef?: React.MutableRefObject<(() => void) | undefined>
) {
  const { t } = useTranslation();
  const repetitivePlaybackErrorsCountRef = useRef(0);

  const managePlaybackErrors = useCallback(
    (appError: unknown) => {
      const playerErrorData = player.error;
      console.error(appError, playerErrorData);

      const playerErrorCode = playerErrorData?.code;

      const prompt = (
        <ErrorPrompt
          reason="ERROR_IN_PLAYER"
          message={
            <Trans
              i18nKey="player.errorMessage"
              components={{
                br: <br />,
                details: (
                  <details className="mt-4">
                    {playerErrorData
                      ? `CODE ${playerErrorData.code} : ${playerErrorData.message}`
                      : t('player.noErrorMessage')}
                  </details>
                )
              }}
            />
          }
          showSendFeedbackBtn
          onSkipSong={
            skipSongRef?.current ? () => skipSongRef.current?.() : undefined
          }
        />
      );

      if (repetitivePlaybackErrorsCountRef.current >= 5) {
        changePromptMenuData(true, prompt);
        return log(
          'Playback errors exceeded the 5 errors limit.',
          { appError, playerErrorData },
          'ERROR'
        );
      }

      repetitivePlaybackErrorsCountRef.current += 1;
      const prevSongPosition = player.currentTime;
      log(`Error occurred in the player.`, { appError, playerErrorData }, 'ERROR');

      if (player.src && playerErrorData) {
        if (playerErrorCode === MEDIA_ERR_SRC_NOT_SUPPORTED) {
          log('Song file not found, skipping to next song.', {}, 'WARN');
          skipSongRef?.current?.();
          return undefined;
        }
        player.load();
        player.currentTime = prevSongPosition;
      } else {
        player.pause();
        changePromptMenuData(true, prompt);
      }
      return undefined;
    },
    [changePromptMenuData, player, t, skipSongRef]
  );

  const resetErrorCount = useCallback(() => {
    repetitivePlaybackErrorsCountRef.current = 0;
  }, []);

  return {
    managePlaybackErrors,
    resetErrorCount
  };
}
