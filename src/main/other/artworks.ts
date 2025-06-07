import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import fsExtra from 'fs-extra';
import sharp from 'sharp';

import { DEFAULT_ARTWORK_SAVE_LOCATION, DEFAULT_FILE_URL } from '../filesystem';
import logger from '../logger';
import { removeDefaultAppProtocolFromFilePath } from '../fs/resolveFilePaths';
import { generateRandomId } from '../utils/randomId';
import { isAnErrorWithCode } from '../utils/isAnErrorWithCode';
// import { timeEnd, timeStart } from '../utils/measureTimeUsage';

import albumCoverImage from '../../renderer/src/assets/images/webp/album_cover_default.webp?asset';
import songCoverImage from '../../renderer/src/assets/images/webp/song_cover_default.webp?asset';
import playlistCoverImage from '../../renderer/src/assets/images/webp/playlist_cover_default.webp?asset';
import { saveArtworks } from '@main/db/queries/artworks';
import { db } from '@main/db/db';

const createArtworks = async (
  id: string,
  artworkType: QueueTypes,
  artwork?: Buffer | Uint8Array | string
) => {
  const defaultPath = path.join(
    DEFAULT_FILE_URL,
    artworkType === 'playlist'
      ? playlistCoverImage
      : artworkType === 'album'
        ? albumCoverImage
        : songCoverImage
  );
  const defaultArtworkPaths = {
    isDefaultArtwork: true,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath
  };
  // const start = timeStart();
  if (artwork) {
    const imgPath = path.join(DEFAULT_ARTWORK_SAVE_LOCATION, `${id}.webp`);
    const optimizedImgPath = path.join(DEFAULT_ARTWORK_SAVE_LOCATION, `${id}-optimized.webp`);

    try {
      await sharp(artwork)
        .webp({ quality: 50, effort: 0 })
        .resize(50, 50)
        .toFile(optimizedImgPath)
        .catch((error) => {
          logger.error(`Failed to create an optimized song artwork.`, { error, optimizedImgPath });
          throw error;
        });

      // const start1 = timeEnd(start, 'Time to save optimized artwork.');

      sharp(artwork, { animated: true })
        .webp()
        .toFile(imgPath)
        // .then(() => timeEnd(start1, 'Time to save full-resolution artwork.'))
        .catch((error) => {
          logger.error(`Failed to create an full-resolution song artwork.`, {
            error,
            optimizedImgPath
          });
          throw error;
        });

      return {
        isDefaultArtwork: false,
        artworkPath: path.join(DEFAULT_FILE_URL, imgPath),
        optimizedArtworkPath: path.join(DEFAULT_FILE_URL, optimizedImgPath)
      };
    } catch (error) {
      logger.error(`Failed to create a song artwork.`, { error });
      return defaultArtworkPaths;
    }
  }
  return defaultArtworkPaths;
};

const checkForDefaultArtworkSaveLocation = async () => {
  try {
    await fs.stat(DEFAULT_ARTWORK_SAVE_LOCATION);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('code' in (error as any) && (error as any).code === 'ENOENT') {
      await fs.mkdir(DEFAULT_ARTWORK_SAVE_LOCATION);
    } else
      logger.error(`Error occurred when checking for default artwork save location.`, { error });
  }
};

export const storeArtworks = async (
  artworkType: QueueTypes,
  artwork?: Buffer | Uint8Array | string,
  trx: DB | DBTransaction = db
) => {
  try {
    // const start = timeStart();

    const id = generateRandomId();
    await checkForDefaultArtworkSaveLocation();

    // const start1 = timeEnd(start, 'Time to check for default artwork location');

    const result = await createArtworks(id, artworkType, artwork);
    const data = await saveArtworks(
      [
        { path: result.artworkPath, width: 1000, height: 1000, source: 'LOCAL' }, // Full resolution song artwork
        { path: result.artworkPath, width: 50, height: 50, source: 'LOCAL' } // Optimized song artwork
      ],
      trx
    );

    // timeEnd(start, 'Time to create artwork');
    // timeEnd(start1, 'Total time to finish artwork storing process');
    return data;
  } catch (error) {
    logger.error(`Failed to store song artwork.`, { error });
    throw error;
  }
};

const manageArtworkRemovalErrors = (error: Error) => {
  if (isAnErrorWithCode(error) && error.code === 'ENOENT')
    return logger.error('Failed to remove artwork.', { error });
  throw error;
};

export const removeArtwork = async (artworkPaths: ArtworkPaths, type: QueueTypes = 'songs') => {
  try {
    await fs
      .unlink(removeDefaultAppProtocolFromFilePath(artworkPaths.artworkPath))
      .catch(manageArtworkRemovalErrors);
    await fs
      .unlink(removeDefaultAppProtocolFromFilePath(artworkPaths.optimizedArtworkPath))
      .catch(manageArtworkRemovalErrors);
  } catch (error) {
    logger.error(`Failed to remove a ${type} artwork.`, { error, artworkPaths });
    throw new Error(`Error occurred when removing a ${type} artwork.`);
  }
};

export const removeSongArtworkFromUnknownSource = async (artworkPath: string) => {
  try {
    await fs.unlink(removeDefaultAppProtocolFromFilePath(artworkPath));
    return true;
  } catch (error) {
    logger.error('Failed to remove artwork of a song from an unknown source.', { artworkPath });
    throw new Error('Error occurred when removing artwork of a song from an unknown source.');
  }
};

const createTempFolder = async (folderPath: string) => {
  try {
    await fs.stat(folderPath);
    return true;
  } catch (error) {
    if (isAnErrorWithCode(error) && error.code === 'ENOENT') {
      await fs.mkdir(folderPath);
      return true;
    }
    logger.error(`Failed to create temp folder.`, { error });
    return false;
  }
};

export const createTempArtwork = async (artwork: Uint8Array | Buffer | string) => {
  try {
    const tempFolder = path.join(app.getPath('userData'), 'temp_artworks');
    await createTempFolder(tempFolder);

    const artworkPath = path.resolve(tempFolder, `${generateRandomId()}.webp`);
    await sharp(artwork).toFile(artworkPath);
    return artworkPath;
  } catch (error) {
    logger.error(`Failed to create a temporary artwork.`, { error });
    return undefined;
  }
};

export const clearTempArtworkFolder = () => {
  const tempFolder = path.join(app.getPath('userData'), 'temp_artworks');

  try {
    if (fsExtra.pathExistsSync(tempFolder)) {
      fsExtra.emptyDirSync(tempFolder);
      return logger.debug('Successfully cleared the contents in the temp_folder.');
    }
    return undefined;
  } catch (error) {
    logger.error('Failed to clear contents in the temp_artwork folder.', { error });
    return undefined;
  }
};
