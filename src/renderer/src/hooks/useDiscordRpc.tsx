import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { store } from '../store/store';

/**
 * Synchronizes Discord Rich Presence with the provided audio element's current song.
 *
 * Registers listeners on the audio player to update Discord activity (song title, artists,
 * artwork, action button) and to set playback timestamps while the player is actively playing.
 *
 * @param player - The HTMLAudioElement whose playback state and metadata drive the presence updates
 */
export function useDiscordRpc(player: HTMLAudioElement) {
  const { t } = useTranslation();

  const setDiscordRpcActivity = useCallback(() => {
    const currentSong = store.state.currentSongData;

    if (!currentSong) {
      return;
    }

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
    const artworkLink = firstArtistWithArtwork?.onlineArtworkPaths?.picture_xl
      ?? firstArtistWithArtwork?.onlineArtworkPaths?.picture_medium
      ?? firstArtistWithArtwork?.onlineArtworkPaths?.picture_small;

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

    if (!player.paused) {
      const currentTime = player.currentTime ?? 0;
      const duration = player.duration ?? 0;
      if (Number.isFinite(currentTime) && Number.isFinite(duration) && duration > 0) {
        activity.timestamps = {
          start: now - currentTime * 1000,
          end: now + (duration - currentTime) * 1000
        };
      }
    }

    window.api?.playerControls?.setDiscordRpcActivity(activity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update Discord RPC on playback events
    player.addEventListener('play', setDiscordRpcActivity);
    player.addEventListener('pause', setDiscordRpcActivity);
    player.addEventListener('seeked', setDiscordRpcActivity);

    return () => {
      // Clean up event listeners
      player.removeEventListener('play', setDiscordRpcActivity);
      player.removeEventListener('pause', setDiscordRpcActivity);
      player.removeEventListener('seeked', setDiscordRpcActivity);
    };
  }, [setDiscordRpcActivity, player]);
}
