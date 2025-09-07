import { app } from 'electron';
import { parseFile } from 'music-metadata';

import { parseSongArtworks, resolveSongFilePath } from '../fs/resolveFilePaths';
import logger from '../logger';
// import { setDiscordRpcActivity } from '../other/discordRPC';
import { setCurrentSongPath } from '../main';
import { getSongById } from '@main/db/queries/songs';
import { parsePaletteFromArtworks } from './getAllSongs';
import { setDiscordRpcActivity } from '@main/other/discordRPC';
import { getHistoryPlaylist, linkSongsWithPlaylist } from '@main/db/queries/playlists';

const IS_DEVELOPMENT = !app.isPackaged || process.env.NODE_ENV === 'development';

const getArtworkData = (artworkData?: Buffer | Uint8Array) => {
  if (artworkData === undefined) return undefined;

  if (IS_DEVELOPMENT) return Buffer.from(artworkData).toString('base64');
  return artworkData;
};

// const getRelevantArtistData = (
//   songArtists?: {
//     artistId: string;
//     name: string;
//   }[]
// ) => {
//   const artists = getArtistsData();
//   const relevantArtists: {
//     artistId: string;
//     artworkName?: string;
//     name: string;
//     onlineArtworkPaths?: OnlineArtistArtworks;
//   }[] = [];

//   if (songArtists) {
//     for (const songArtist of songArtists) {
//       for (const artist of artists) {
//         if (artist.artistId === songArtist.artistId) {
//           if (!artist.onlineArtworkPaths)
//             getArtistInfoFromNet(artist.artistId).catch((error) =>
//               logger.warn('Failed to get artist info from net', { err: error })
//             );

//           const { artistId, name, artworkName, onlineArtworkPaths } = artist;

//           relevantArtists.push({
//             artistId,
//             name,
//             artworkName,
//             onlineArtworkPaths
//           });
//         }
//       }
//     }
//   }

//   return relevantArtists;
// };

const addSongToHistory = async (songId: string) => {
  const historyPlaylist = await getHistoryPlaylist();

  if (historyPlaylist) {
    await linkSongsWithPlaylist([Number(songId)], historyPlaylist.id);
  }
};

const sendAudioData = async (songId: string): Promise<AudioPlayerData> => {
  logger.debug(`Fetching song data for song id -${songId}-`);
  try {
    const song = await getSongById(Number(songId));

    if (song) {
      const metadata = await parseFile(song.path);

      if (metadata) {
        const artworkData = metadata.common.picture ? metadata.common.picture[0].data : undefined;

        // addToSongsHistory(song.songId);
        const artists =
          song.artists?.map((a) => ({ artistId: String(a.artist.id), name: a.artist.name })) ?? [];
        const artworks = song.artworks.map((a) => a.artwork);
        const albumObj = song.albums?.[0]?.album;
        const album = albumObj ? { albumId: String(albumObj.id), name: albumObj.title } : undefined;
        const isBlacklisted = !!song.blacklist;
        const isAFavorite = song.playlists.some((p) => p.playlist.name === 'Favorites');

        const data: AudioPlayerData = {
          title: song.title,
          artists,
          duration: Number(song.duration),
          artwork: getArtworkData(artworkData),
          artworkPath: parseSongArtworks(artworks).artworkPath,
          path: resolveSongFilePath(song.path),
          songId: String(song.id),
          isAFavorite,
          album,
          paletteData: parsePaletteFromArtworks(artworks),
          isKnownSource: true, // TODO: Add logic to determine if the source is known
          isBlacklisted
        };

        addSongToHistory(songId);

        const now = Date.now();
        setDiscordRpcActivity({
          details: `Listening to '${data.title}'`,
          state: `By ${data.artists?.map((artist) => artist.name).join(', ')}`,
          largeImageKey: 'nora_logo',
          smallImageKey: 'song_artwork',
          startTimestamp: now,
          endTimestamp: now + data.duration * 1000
        });
        setCurrentSongPath(song.path);
        return data;
        // returnlogger.debug(`total : ${console.timeEnd('total')}`);
      }
      logger.error(`No matching song to send audio data`, { audioId: songId });
      throw new Error('SONG_NOT_FOUND' as ErrorCodes);
    }
    logger.error(`Failed to read data.json because it doesn't exist or is empty.`, {
      audioId: songId
    });
    throw new Error('EMPTY_SONG_ARRAY' as ErrorCodes);
  } catch (error) {
    logger.error(`Failed to send songs data.`, { err: error });
    throw new Error('SONG_DATA_SEND_FAILED' as ErrorCodes);
  }
};

export default sendAudioData;
