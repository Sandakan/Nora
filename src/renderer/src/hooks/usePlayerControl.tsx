import { lazy, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { dispatch, store } from '../store/store';
import storage from '../utils/localStorage';
import log from '../utils/log';
import type PlayerQueue from '../other/playerQueue';
import type AudioPlayer from '../other/player';

const ErrorPrompt = lazy(() => import('../components/ErrorPrompt'));
const SongUnplayableErrorPrompt = lazy(() => import('../components/SongUnplayableErrorPrompt'));

/**
 * Hook for controlling audio playback.
 *
 * This hook manages the core player control functionality including play/pause,
 * loading songs, playing from unknown sources, clearing player data, updating
 * song data, and managing playback state. It handles player state management,
 * error handling, and IPC communication.
 *
 * @param player - The HTMLAudioElement instance
 * @param playerQueue - The PlayerQueue instance for queue management
 * @param recordListeningData - Function to record listening session data
 * @param managePlaybackErrors - Function to handle playback errors
 * @param changePromptMenuData - Function to show prompts/dialogs
 * @param addNewNotifications - Function to add toast notifications
 * @returns Object containing player control functions
 *
 * @example
 * ```tsx
 * const {
 *   toggleSongPlayback,
 *   playSong,
 *   playSongFromUnknownSource,
 *   updateCurrentSongData,
 *   clearAudioPlayerData,
 *   updateCurrentSongPlaybackState
 * } = usePlayerControl(player, playerQueue, recordListeningData, managePlaybackErrors, ...);
 *
 * // Use in UI or event handlers
 * <button onClick={() => toggleSongPlayback()}>Play/Pause</button>
 * playSong('song-id-123');
 * updateCurrentSongPlaybackState(true);
 * ```
 */
export function usePlayerControl(
  playerInstance: AudioPlayer | HTMLAudioElement,
  playerQueue: PlayerQueue,
  recordListeningData: (
    songId: number,
    songDuration: number,
    repetition?: boolean,
    isKnownSource?: boolean
  ) => void,
  managePlaybackErrors: (error: unknown) => void,
  changePromptMenuData: (
    isVisible?: boolean,
    prompt?: React.ReactNode | null,
    className?: string
  ) => void,
  addNewNotifications: (notifications: AppNotification[]) => void
) {
  const { t } = useTranslation();
  const refStartPlay = useRef(false);

  // Support both AudioPlayer instance and HTMLAudioElement for backward compatibility
  const player =
    playerInstance instanceof HTMLAudioElement
      ? playerInstance
      : (playerInstance as AudioPlayer).audio;
  const audioPlayer =
    playerInstance instanceof HTMLAudioElement ? null : (playerInstance as AudioPlayer);

  const toggleSongPlayback = useCallback(
    (startPlay?: boolean) => {
      if (store.state.currentSongData?.songId) {
        // Use AudioPlayer's togglePlayback if available
        if (audioPlayer) {
          return audioPlayer.togglePlayback(startPlay).catch((err) => managePlaybackErrors(err));
        }

        // Fallback to direct audio element control
        if (typeof startPlay !== 'boolean' || startPlay === player.paused) {
          if (player.readyState > 0) {
            if (player.paused) {
              return player
                .play()
                .then(() => {
                  const playbackChange = new CustomEvent('player/playbackChange');
                  return player.dispatchEvent(playbackChange);
                })
                .catch((err) => managePlaybackErrors(err));
            }
            if (player.ended) {
              player.currentTime = 0;
              return player
                .play()
                .then(() => {
                  const playbackChange = new CustomEvent('player/playbackChange');
                  return player.dispatchEvent(playbackChange);
                })
                .catch((err) => managePlaybackErrors(err));
            }
            const playbackChange = new CustomEvent('player/playbackChange');
            player.dispatchEvent(playbackChange);
            return player.pause();
          }
        }
      } else
        addNewNotifications([
          {
            id: 'noSongToPlay',
            content: t('notifications.selectASongToPlay'),
            iconName: 'error',
            iconClassName: 'material-icons-round-outlined'
          }
        ]);
      return undefined;
    },
    [addNewNotifications, t, managePlaybackErrors, player]
  );

  const playSong = useCallback(
    (songId: number, isStartPlay = true, playAsCurrentSongIndex = false) => {
      console.log('[playSong]', { songId, isStartPlay, playAsCurrentSongIndex });

      if (typeof songId === 'number') {
        // Use AudioPlayer's playSongById if available (preferred path)
        if (audioPlayer) {
          return audioPlayer.playSongById(songId, {
            autoPlay: isStartPlay,
            recordListening: true,
            onError: (error) => {
              console.error('Error playing song via AudioPlayer:', error);
              changePromptMenuData(true, <SongUnplayableErrorPrompt err={error as Error} />);
            }
          });
        }

        // Fallback to legacy direct control (deprecated)
        console.time('timeForSongFetch');

        return window.api.audioLibraryControls
          .getSong(songId)
          .then((songData) => {
            console.timeEnd('timeForSongFetch');
            if (songData) {
              console.log('[playSong.received]', {
                songId,
                title: songData.title,
                path: songData.path
              });

              dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });

              storage.playback.setCurrentSongOptions('songId', songData.songId);

              const newSrc = `${songData.path}?ts=${Date.now()}`;
              console.log('[playSong.src]', { src: newSrc });
              player.src = newSrc;

              const trackChangeEvent = new CustomEvent('player/trackchange', {
                detail: songId
              });
              player.dispatchEvent(trackChangeEvent);

              refStartPlay.current = isStartPlay;

              if (isStartPlay) {
                console.log('[playSong.autoStart]', { isStartPlay: true });
                toggleSongPlayback();
              }

              // Dynamic theme is now handled automatically by useDynamicTheme hook

              recordListeningData(songId, songData.duration);
            } else console.log(songData);
            return undefined;
          })
          .catch((err) => {
            console.error(err);
            changePromptMenuData(true, <SongUnplayableErrorPrompt err={err} />);
          });
      }
      changePromptMenuData(
        true,
        <ErrorPrompt
          reason="SONG_ID_UNDEFINED"
          message={`${t('player.errorTitle')}\nERROR : SONG_ID_UNDEFINED`}
        />
      );
      return log(
        'ERROR OCCURRED WHEN TRYING TO PLAY A S0NG.',
        {
          error: 'Song id is of unknown type',
          songIdType: typeof songId,
          songId
        },
        'ERROR'
      );
    },
    [audioPlayer, changePromptMenuData, toggleSongPlayback, recordListeningData, player, t]
  );

  const playSongFromUnknownSource = useCallback(
    (audioPlayerData: AudioPlayerData, isStartPlay = true) => {
      if (audioPlayerData) {
        const { isKnownSource } = audioPlayerData;
        if (isKnownSource) playSong(audioPlayerData.songId);
        else {
          console.log('playSong', audioPlayerData.path);
          dispatch({
            type: 'CURRENT_SONG_DATA_CHANGE',
            data: audioPlayerData
          });
          player.src = `${audioPlayerData.path}?ts=${Date.now()}`;
          refStartPlay.current = isStartPlay;
          if (isStartPlay) toggleSongPlayback();

          recordListeningData(audioPlayerData.songId, audioPlayerData.duration, undefined, false);
        }
      }
    },
    [playSong, recordListeningData, toggleSongPlayback, player]
  );

  const updateCurrentSongData = useCallback(
    (callback: (prevData: AudioPlayerData) => AudioPlayerData) => {
      const updatedData = callback(store.state.currentSongData);
      if (updatedData) {
        dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: updatedData });
      }
    },
    []
  );

  const clearAudioPlayerData = useCallback(() => {
    toggleSongPlayback(false);

    player.currentTime = 0;
    player.pause();

    // Remove current song from queue using PlayerQueue method
    const currentSongId = store.state.currentSongData.songId;
    if (currentSongId) {
      playerQueue.removeSongId(currentSongId);
      storage.queue.setQueue(playerQueue);
    }

    dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: {} as AudioPlayerData });

    addNewNotifications([
      {
        id: 'songPausedOnDelete',
        duration: 7500,
        content: t('notifications.playbackPausedDueToSongDeletion')
      }
    ]);
  }, [addNewNotifications, t, toggleSongPlayback, player, playerQueue]);

  const updateCurrentSongPlaybackState = useCallback((isPlaying: boolean) => {
    if (isPlaying !== store.state.player.isCurrentSongPlaying) {
      dispatch({ type: 'CURRENT_SONG_PLAYBACK_STATE', data: isPlaying });
    }
  }, []);

  return {
    toggleSongPlayback,
    playSong,
    playSongFromUnknownSource,
    updateCurrentSongData,
    clearAudioPlayerData,
    updateCurrentSongPlaybackState,
    refStartPlay
  };
}
