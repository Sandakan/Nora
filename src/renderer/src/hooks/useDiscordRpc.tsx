import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { store } from '../store/store';

/**
 * Custom hook to manage Discord Rich Presence integration.
 *
 * This hook automatically updates Discord Rich Presence activity
 * with the currently playing song information, including:
 * - Song title and artists
 * - Playback timestamps (start/end times)
 * - Artist artwork (if available)
 * - Nora logo as large image
 * - Button link to Nora's GitHub repository
 *
 * The activity is updated on:
 * - Play event (starts activity timer)
 * - Pause event (clears activity timer)
 * - Seek event (updates timestamps)
 *
 * Text is automatically truncated to Discord's 128 character limit.
 *
 * @param player - The HTML audio player element
 *
 * @example
 * ```tsx
 * function App() {
 *   const player = useAudioPlayer();
 *
 *   useDiscordRpc(player);
 * }
 * ```
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

    // Find first artist with artwork for small image
    const firstArtistWithArtwork = currentSong?.artists?.find(
      (artist) => artist.onlineArtworkPaths !== undefined
    );
    const onlineArtworkLink = firstArtistWithArtwork?.onlineArtworkPaths?.picture_small;

    // Send activity to Discord via IPC
    window.api.playerControls.setDiscordRpcActivity({
      timestamps: {
        // Only set timestamps when playing (not paused)
        start: player.paused ? undefined : now - (player.currentTime ?? 0) * 1000,
        end: player.paused
          ? undefined
          : now + ((player.duration ?? 0) - (player.currentTime ?? 0)) * 1000
      },
      details: title,
      state: artists,
      assets: {
        large_image: 'nora_logo',
        // large_text: 'Nora', // Large text will also be displayed as the 3rd line (state) so I skipped it for now
        small_image: onlineArtworkLink ?? 'song_artwork',
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
    });
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
