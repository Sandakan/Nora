import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type AudioPlayer from '../other/player';
import { store } from '../store/store';

/**
 * Synchronizes Discord Rich Presence with the provided audio player or audio element.
 *
 * Accepts either an AudioPlayer instance (preferred) or a bare HTMLAudioElement.
 * When an AudioPlayer is provided, the hook subscribes through its event emitter
 * and reads playback state via AudioPlayer getters that delegate to getActiveAudio(),
 * ensuring correct timestamps after crossfade swaps.
 *
 * @param playerInput - The AudioPlayer instance or HTMLAudioElement for Discord presence
 */
export function useDiscordRpc(playerInput: AudioPlayer | HTMLAudioElement) {
  const { t } = useTranslation();

  const audioPlayer =
    playerInput instanceof HTMLAudioElement ? null : (playerInput as AudioPlayer);

  const setDiscordRpcActivity = useCallback(() => {
    const currentSong = store.state.currentSongData;

    if (!currentSong) {
      return;
    }

    // Determine which audio element to read state from
    const activeEl = audioPlayer?.getActiveAudio() ?? (playerInput as HTMLAudioElement);

    // Truncate text to Discord's character limit
    const truncateText = (text: string, maxLength: number) => {
      return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
    };

    // Prepare song information
    const title = truncateText(currentSong?.title ?? t('discordrpc.untitledSong'), 128);

    const artists = truncateText(
      `${currentSong.artists?.map((artist) => artist.name).join(', ') || t('discordrpc.unknownArtist')}`,
      128
    );

    // Get current timestamp
    const now = Date.now();

    // Find first artist with artwork for Discord presence images
    const firstArtistWithArtwork = currentSong?.artists?.find(
      (artist) => artist.onlineArtworkPaths?.picture_small
    );
    const artworkLink =
      firstArtistWithArtwork?.onlineArtworkPaths?.picture_xl ??
      firstArtistWithArtwork?.onlineArtworkPaths?.picture_medium ??
      firstArtistWithArtwork?.onlineArtworkPaths?.picture_small;

    const activity: DiscordActivity = {
      details: title,
      state: artists,
      assets: {
        large_image: artworkLink ?? 'nora_logo',
        small_image: artworkLink ?? 'song_artwork',
        small_text: firstArtistWithArtwork
          ? firstArtistWithArtwork.name
          : t('discordrpc.playingASong')
      },
      buttons: [
        {
          label: t('discordrpc.noraOnGitHub'),
          url: 'https://github.com/Sandakan/Nora/'
        }
      ]
    };

    if (!activeEl.paused) {
      const currentTime = activeEl.currentTime ?? 0;
      const duration = activeEl.duration ?? 0;
      if (Number.isFinite(currentTime) && Number.isFinite(duration) && duration > 0) {
        activity.timestamps = {
          start: now - currentTime * 1000,
          end: now + (duration - currentTime) * 1000
        };
      }
    }

    window.api.playerControls.setDiscordRpcActivity(activity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioPlayer) {
      audioPlayer.on('play', setDiscordRpcActivity);
      audioPlayer.on('pause', setDiscordRpcActivity);
      audioPlayer.on('seeked', setDiscordRpcActivity);
    } else {
      const player = playerInput as HTMLAudioElement;
      player.addEventListener('play', setDiscordRpcActivity);
      player.addEventListener('pause', setDiscordRpcActivity);
      player.addEventListener('seeked', setDiscordRpcActivity);
    }

    return () => {
      if (audioPlayer) {
        audioPlayer.off('play', setDiscordRpcActivity);
        audioPlayer.off('pause', setDiscordRpcActivity);
        audioPlayer.off('seeked', setDiscordRpcActivity);
      } else {
        const player = playerInput as HTMLAudioElement;
        player.removeEventListener('play', setDiscordRpcActivity);
        player.removeEventListener('pause', setDiscordRpcActivity);
        player.removeEventListener('seeked', setDiscordRpcActivity);
      }
    };
  }, [audioPlayer, playerInput, setDiscordRpcActivity]);
}
