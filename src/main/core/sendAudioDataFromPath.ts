import * as musicMetaData from 'music-metadata';
import path from 'path';
import { appPreferences } from '../../../package.json';
import { createTempArtwork } from '../other/artworks';
import { DEFAULT_FILE_URL, getSongsData } from '../filesystem';
import log from '../log';
import { sendMessageToRenderer, addToSongsOutsideLibraryData } from '../main';
import { generateRandomId } from '../utils/randomId';
import getAssetPath from '../utils/getAssetPath';
import sendAudioData from './sendAudioData';

const defaultSongCoverPath = getAssetPath(
  'images',
  'webp',
  'song_cover_default.webp'
);

const sendAudioDataFromPath = async (
  songPath: string
): Promise<AudioPlayerData> => {
  log(`Parsing song data from song path -${songPath}-`);
  if (
    appPreferences.supportedMusicExtensions.some((ext) =>
      path.extname(songPath).includes(ext)
    )
  ) {
    const songs = getSongsData();

    try {
      const metadata = await musicMetaData.parseFile(songPath);

      if (Array.isArray(songs)) {
        if (songs.length > 0) {
          for (let x = 0; x < songs.length; x += 1) {
            if (songs[x].path === songPath) {
              // eslint-disable-next-line no-await-in-loop
              const audioData = await sendAudioData(songs[x].songId);

              if (audioData) return audioData;
              throw new Error('Audio data generation failed.');
            }
          }
        }
        if (metadata) {
          const artworkData = metadata.common.picture
            ? metadata.common.picture[0].data
            : '';

          const tempArtworkPath = path.join(
            DEFAULT_FILE_URL,
            metadata.common.picture
              ? (await createTempArtwork(metadata.common.picture[0].data).catch(
                  (err) =>
                    log(
                      `Artwork creation failed for song from an unknown source.\nPATH : ${songPath}; ERROR : ${err}`
                    )
                )) ?? defaultSongCoverPath
              : defaultSongCoverPath
          );

          const title =
            metadata.common.title ||
            path.basename(songPath).split('.')[0] ||
            'Unknown Title';

          const data: AudioPlayerData = {
            title,
            artists: metadata.common.artists?.map((artistName) => ({
              artistId: '',
              name: artistName,
            })),
            duration: metadata.format.duration ?? 0,
            artwork: Buffer.from(artworkData).toString('base64') || undefined,
            artworkPath: tempArtworkPath,
            path: path.join(DEFAULT_FILE_URL, songPath),
            songId: generateRandomId(),
            isAFavorite: false,
            isKnownSource: false,
          };

          addToSongsOutsideLibraryData({
            title: data.title,
            songId: data.songId,
            artworkPath: data.artworkPath,
            duration: data.duration,
            path: data.path,
          });

          sendMessageToRenderer(
            'You are playing a song outside from your library.',
            'PLAYBACK_FROM_UNKNOWN_SOURCE',
            { path: songPath }
          );
          return data;
        }
        log(`No matching song for songId -${songPath}-`);
        throw new Error('SONG_NOT_FOUND' as ErrorCodes);
      }
      log(
        `ERROR OCCURRED WHEN READING data.json TO GET SONGS DATA. data.json didn't return an array.`
      );
      throw new Error('SONG_DATA_SEND_FAILED' as ErrorCodes);
    } catch (err) {
      log(
        `ERROR OCCURRED WHEN TRYING TO SEND SONGS DATA FROM AN UNPARSED SOURCE.`,
        { err }
      );
      throw new Error('SONG_DATA_SEND_FAILED' as ErrorCodes);
    }
  } else {
    log(
      `USER TRIED TO OPEN A FILE WITH AN UNSUPPORTED EXTENSION '${path.extname(
        songPath
      )}'.`
    );
    throw new Error('UNSUPPORTED_FILE_EXTENSION' as ErrorCodes);
  }
};

export default sendAudioDataFromPath;
