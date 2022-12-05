import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

import { DEFAULT_ARTWORK_SAVE_LOCATION, DEFAULT_FILE_URL } from '../filesystem';
import log from '../log';
import { removeDefaultFileUrlFromPath } from '../fs/resolveFilePaths';
import getAssetPath from '../utils/getAssetPath';
import { generateRandomId } from '../utils/randomId';

const createArtworks = async (
  id: string,
  artworkType: QueueTypes,
  artwork?: Buffer | string
) => {
  const defaultPath = path.join(
    DEFAULT_FILE_URL,
    getAssetPath(
      'images',
      'png',
      artworkType === 'playlist'
        ? 'playlist_cover_default.png'
        : artworkType === 'album'
        ? 'album_cover_default.png'
        : 'song_cover_default.png'
    )
  );
  const defaultArtworkPaths = {
    isDefaultArtwork: true,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath,
  };
  if (artwork) {
    const imgPath = path.join(DEFAULT_ARTWORK_SAVE_LOCATION, `${id}.webp`);
    const optimizedImgPath = path.join(
      DEFAULT_ARTWORK_SAVE_LOCATION,
      `${id}-optimized.webp`
    );

    try {
      await sharp(artwork)
        .webp()
        .toFile(imgPath)
        .catch((err) => {
          log(
            `ERROR OCCURRED WHEN CREATING ARTWORK OF A SONG WITH SONGID -${id}- IMAGE USING SHARP PACKAGE.`,
            { err },
            'ERROR'
          );
          throw err;
        });
      sharp(artwork)
        .webp({ quality: 50, effort: 0 })
        .resize(50, 50)
        .toFile(optimizedImgPath)
        .catch((err) => {
          log(
            `ERROR OCCURRED WHEN OPTIMIZING ARTWORK OF A SONG WITH SONGID -${id}- IMAGE USING SHARP PACKAGE.`,
            { err },
            'ERROR'
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('code' in (error as any) && (error as any).code === 'ENOENT') {
      await fs.mkdir(DEFAULT_ARTWORK_SAVE_LOCATION);
    } else throw error;
  }
};

export const storeArtworks = async (
  id: string,
  artworkType: QueueTypes,
  artwork?: Buffer | string
): Promise<ArtworkPaths> => {
  try {
    await checkForDefaultArtworkSaveLocation();
    const result = await createArtworks(id, artworkType, artwork);
    return result;
  } catch (error) {
    log(`Error occurred when storing artwork.`, { error }, 'ERROR');
    throw error;
  }
};

export const removeSongArtwork = (artworkPaths: ArtworkPaths) => {
  return new Promise((resolve, reject) => {
    try {
      fs.unlink(removeDefaultFileUrlFromPath(artworkPaths.artworkPath))
        .then(() =>
          fs.unlink(
            removeDefaultFileUrlFromPath(artworkPaths.optimizedArtworkPath)
          )
        )
        .then(() => resolve(true))
        .catch((err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

const checkForTempFolder = async (folderPath: string) => {
  try {
    await fs.stat(folderPath);
    return true;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('code' in (error as any) && (error as any).code === 'ENOENT') {
      await fs.mkdir(folderPath);
      return true;
    }
    throw error;
  }
};

export const createTempArtwork = async (artwork: Buffer): Promise<string> => {
  try {
    const tempFolder = path.join(app.getPath('userData'), 'temp_artworks');
    await checkForTempFolder(tempFolder);

    const artworkPath = path.resolve(tempFolder, `${generateRandomId()}.webp`);
    await sharp(artwork).resize(250, 250).toFile(artworkPath);
    return artworkPath;
  } catch (error) {
    log(`FAILED TO CREATE A TEMPORARY ARTWORK.`, { error }, 'ERROR');
    throw new Error(`CREATE_TEMP_ARTWORK_FAILED` as MessageCodes);
  }
};
