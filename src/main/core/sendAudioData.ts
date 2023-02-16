/* eslint-disable no-await-in-loop */
import * as musicMetaData from 'music-metadata';
import path from 'path';
import { DEFAULT_FILE_URL, getArtistsData, getSongsData } from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import getArtistInfoFromNet from './getArtistInfoFromNet';
import log from '../log';
import addToSongsHistory from './addToSongsHistory';
import updateSongListeningData from './updateSongListeningData';

export const sendAudioData = async (
  audioId: string
): Promise<AudioPlayerData> => {
  log(`Fetching song data for song id -${audioId}-`);
  try {
    const songs = getSongsData();
    const artists = getArtistsData();

    if (songs && artists) {
      for (let x = 0; x < songs.length; x += 1) {
        if (songs[x].songId === audioId) {
          const song = songs[x];
          const songArtists = [];
          const metadata = await musicMetaData.parseFile(song.path);
          if (metadata) {
            const artworkData = metadata.common.picture
              ? metadata.common.picture[0].data
              : '';
            addToSongsHistory(song.songId);
            if (song.artists) {
              for (let i = 0; i < song.artists.length; i += 1) {
                for (let y = 0; y < artists.length; y += 1) {
                  if (artists[y].artistId === song.artists[i].artistId) {
                    if (!artists[y].onlineArtworkPaths)
                      getArtistInfoFromNet(artists[y].artistId).catch((err) =>
                        log(err)
                      );
                    const { artistId, name, artworkName, onlineArtworkPaths } =
                      artists[y];
                    songArtists.push({
                      artistId,
                      name,
                      artworkName,
                      onlineArtworkPaths,
                    });
                  }
                }
              }
            }
            const data: AudioPlayerData = {
              title: song.title,
              artists: songArtists || song.artists,
              duration: song.duration,
              artwork: Buffer.from(artworkData).toString('base64') || undefined,
              artworkPath: getSongArtworkPath(
                song.songId,
                song.isArtworkAvailable
              ).artworkPath,
              path: path.join(DEFAULT_FILE_URL, song.path),
              songId: song.songId,
              isAFavorite: song.isAFavorite,
              album: song.album,
              palette: song.palette,
              isKnownSource: true,
            };

            updateSongListeningData(song.songId, 'listens', 'increment');
            return data;
            // return log(`total : ${console.timeEnd('total')}`);
          }
          log(
            `ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA`,
            undefined,
            'ERROR'
          );
          throw new Error(
            'ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA'
          );
        }
      }
      log(`No matching song for songId -${audioId}-`);
      throw new Error('SONG_NOT_FOUND' as ErrorCodes);
    }
    log(
      `ERROR OCCURRED WHEN READING data.json TO GET SONGS DATA. data.json FILE DOESN'T EXIST OR SONGS ARRAY IS EMPTY.`,
      undefined,
      'ERROR'
    );
    throw new Error('EMPTY_SONG_ARRAY' as ErrorCodes);
  } catch (err) {
    log(`ERROR OCCURRED WHEN TRYING TO SEND SONGS DATA.`, { err }, 'WARN');
    throw new Error('SONG_DATA_SEND_FAILED' as ErrorCodes);
  }
};

export default sendAudioData;
