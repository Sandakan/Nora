import { lazy, useCallback, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import log from '../utils/log';

const ErrorPrompt = lazy(() => import('../components/ErrorPrompt'));

/**
 * Hook for managing playback errors and retry logic.
 *
 * This hook handles audio player errors, tracks repetitive error counts,
 * and provides error recovery mechanisms. It displays error prompts when
 * errors exceed threshold limits.
 *
 * @param player - The HTMLAudioElement instance
 * @param changePromptMenuData - Function to show error prompts to user
 * @returns Object containing error management functions
 *
 * @example
 * ```tsx
 * const { managePlaybackErrors, resetErrorCount } = usePlaybackErrors(player, changePromptMenuData);
 *
 * // Use in error handler
 * player.addEventListener('error', (err) => managePlaybackErrors(err));
 * ```
 */
export function usePlaybackErrors(
  player: HTMLAudioElement,
  changePromptMenuData: (isVisible?: boolean, prompt?: React.ReactNode | null) => void
) {
  const { t } = useTranslation();
  const repetitivePlaybackErrorsCountRef = useRef(0);

  const managePlaybackErrors = useCallback(
    (appError: unknown) => {
      const playerErrorData = player.error;
      console.error(appError, playerErrorData);

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
        />
      );

      if (repetitivePlaybackErrorsCountRef.current > 5) {
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
        player.load();
        player.currentTime = prevSongPosition;
      } else {
        player.pause();
        changePromptMenuData(true, prompt);
      }
      return undefined;
    },
    [changePromptMenuData, player, t]
  );

  const resetErrorCount = useCallback(() => {
    repetitivePlaybackErrorsCountRef.current = 0;
  }, []);

  return {
    managePlaybackErrors,
    resetErrorCount
  };
}
