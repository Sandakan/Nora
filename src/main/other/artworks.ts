import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import fsExtra from 'fs-extra';
import sharp from 'sharp';

import { DEFAULT_ARTWORK_SAVE_LOCATION, DEFAULT_FILE_URL } from '../filesystem';
import log from '../log';
import { removeDefaultAppProtocolFromFilePath } from '../fs/resolveFilePaths';
import getAssetPath from '../utils/getAssetPath';
import { generateRandomId } from '../utils/randomId';
// import { timeEnd, timeStart } from '../utils/measureTimeUsage';

const createArtworks = async (
  id: string,
  artworkType: QueueTypes,
  artwork?: Buffer | string,
) => {
  const defaultPath = path.join(
    DEFAULT_FILE_URL,
    getAssetPath(
      'images',
      'webp',
      artworkType === 'playlist'
        ? 'playlist_cover_default.webp'
        : artworkType === 'album'
          ? 'album_cover_default.webp'
          : 'song_cover_default.webp',
    ),
  );
  const defaultArtworkPaths = {
    isDefaultArtwork: true,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath,
  };
  // const start = timeStart();
  if (artwork) {
    const imgPath = path.join(DEFAULT_ARTWORK_SAVE_LOCATION, `${id}.webp`);
    const optimizedImgPath = path.join(
      DEFAULT_ARTWORK_SAVE_LOCATION,
      `${id}-optimized.webp`,
    );

    try {
      await sharp(artwork)
        .webp({ quality: 50, effort: 0 })
        .resize(50, 50)
        .toFile(optimizedImgPath)
        .catch((err) => {
          log(
            `ERROR OCCURRED WHEN OPTIMIZING ARTWORK OF A SONG WITH SONGID -${id}- IMAGE USING SHARP PACKAGE.`,
            { err },
            'ERROR',
          );
          throw err;
        });

      // const start1 = timeEnd(start, 'Time to save optimized artwork.');

      sharp(artwork, { animated: true })
        .webp()
        .toFile(imgPath)
        // .then(() => timeEnd(start1, 'Time to save full-resolution artwork.'))
        .catch((err) => {
          log(
            `ERROR OCCURRED WHEN CREATING ARTWORK OF A SONG WITH SONGID -${id}- IMAGE USING SHARP PACKAGE.`,
            { err },
            'ERROR',
          );
          throw err;
        });

      return {
        isDefaultArtwork: false,
        artworkPath: path.join(DEFAULT_FILE_URL, imgPath),
        optimizedArtworkPath: path.join(DEFAULT_FILE_URL, optimizedImgPath),
      };
    } catch (error) {
      log(`Error occurred when creating artwork.`, { error }, 'ERROR');
      return defaultArtworkPaths;
    }
  }
  return defaultArtworkPaths;
};

const checkForDefaultArtworkSaveLocation = async () => {
  try {
    await fs.stat(DEFAULT_ARTWORK_SAVE_LOCATION);
  } catch (error) {
    if ('code' in (error as any) && (error as any).code === 'ENOENT') {
      await fs.mkdir(DEFAULT_ARTWORK_SAVE_LOCATION);
    } else throw error;
  }
};

export const storeArtworks = async (
  id: string,
  artworkType: QueueTypes,
  artwork?: Buffer | string,
): Promise<ArtworkPaths> => {
  try {
    // const start = timeStart();

    await checkForDefaultArtworkSaveLocation();

    // const start1 = timeEnd(start, 'Time to check for default artwork location');

    const result = await createArtworks(id, artworkType, artwork);

    // timeEnd(start, 'Time to create artwork');
    // timeEnd(start1, 'Total time to finish artwork storing process');
    return result;
  } catch (error) {
    log(`Error occurred when storing artwork.`, { error }, 'ERROR');
    throw error;
  }
};

const manageArtworkRemovalErrors = (err: Error) => {
  if ('code' in err && err.code === 'ENOENT') return log(err);
  throw err;
};

export const removeArtwork = async (
  artworkPaths: ArtworkPaths,
  type: QueueTypes = 'songs',
) => {
  try {
    await fs
      .unlink(removeDefaultAppProtocolFromFilePath(artworkPaths.artworkPath))
      .catch(manageArtworkRemovalErrors);
    await fs
      .unlink(
        removeDefaultAppProtocolFromFilePath(artworkPaths.optimizedArtworkPath),
      )
      .catch(manageArtworkRemovalErrors);
  } catch (error) {
    log(
      `Error occurred when removing a ${type} artwork.`,
      { error, artworkPaths },
      'ERROR',
    );
    throw new Error(`Error occurred when removing a ${type} artwork.`);
  }
};

export const removeSongArtworkFromUnknownSource = async (
  artworkPath: string,
) => {
  try {
    await fs.unlink(removeDefaultAppProtocolFromFilePath(artworkPath));
    return true;
  } catch (error) {
    log(
      'Error occurred when removing artwork of a song from an unknown source.',
      { artworkPath },
      'ERROR',
    );
    throw new Error(
      'Error occurred when removing artwork of a song from an unknown source.',
    );
  }
};

const createTempFolder = async (folderPath: string) => {
  try {
    await fs.stat(folderPath);
    return true;
  } catch (error) {
    if ('code' in (error as any) && (error as any).code === 'ENOENT') {
      await fs.mkdir(folderPath);
      return true;
    }
    throw error;
  }
};

export const createTempArtwork = async (
  artwork: Buffer | string,
): Promise<string> => {
  try {
    const tempFolder = path.join(app.getPath('userData'), 'temp_artworks');
    await createTempFolder(tempFolder);

    const artworkPath = path.resolve(tempFolder, `${generateRandomId()}.webp`);
    await sharp(artwork).toFile(artworkPath);
    return artworkPath;
  } catch (error) {
    log(`FAILED TO CREATE A TEMPORARY ARTWORK.`, { error }, 'ERROR');
    throw new Error(`CREATE_TEMP_ARTWORK_FAILED` as MessageCodes);
  }
};

export const clearTempArtworkFolder = () => {
  const tempFolder = path.join(app.getPath('userData'), 'temp_artworks');

  try {
    if (fsExtra.pathExistsSync(tempFolder)) {
      fsExtra.emptyDirSync(tempFolder);
      return log('Successfully cleared the contents in the temp_folder.');
    }
    return undefined;
  } catch (error) {
    log(
      'Error occurred when trying to clear contents in the temp_artwork folder.',
      { error },
      'ERROR',
    );
    return undefined;
  }
};
