import { lazy, useCallback, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import log from '../utils/log';

const ErrorPrompt = lazy(() => import('../components/ErrorPrompt'));

const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

/**
 * Provides handlers to manage and recover from HTMLAudioElement playback errors.
 *
 * The hook returns a recovery function that attempts automatic retries, skips tracks for
 * unsupported sources, and shows a user-facing error prompt after repeated failures, plus a
 * reset function for the internal consecutive-error counter.
 *
 * @param player - The audio element to monitor and control when playback errors occur.
 * @param changePromptMenuData - Callback to display or hide a prompt; receives (isVisible?, prompt?).
 * @param skipSongRef - Optional ref containing a function to skip the current track; used by the prompt and recovery logic.
 * @returns An object with:
 *  - `managePlaybackErrors`: a function accepting an `appError` value to handle the current player error and attempt recovery or surface a prompt,
 *  - `resetErrorCount`: a function that resets the internal consecutive-error counter to zero.
 */
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
