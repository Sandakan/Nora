import path from 'path';
import fs from 'fs/promises';

import sharp from 'sharp';

import logger from '../logger';
import { DEFAULT_ARTWORK_SAVE_LOCATION } from '../filesystem';

import songCoverImage from '../../renderer/src/assets/images/webp/song_cover_default.webp?asset&asarUnpack';

let defaultSongCoverImgBuffer: Buffer;

export const getDefaultSongCoverImgBuffer = async () => {
  if (defaultSongCoverImgBuffer) return defaultSongCoverImgBuffer;

  try {
    const webpBuffer = await fs.readFile(songCoverImage);
    const buffer = await sharp(webpBuffer).png().toBuffer();

    defaultSongCoverImgBuffer = buffer;
    return buffer;
  } catch (error) {
    logger.error(`Failed to read 'song_cover_default.webp'`, { error });
    return undefined;
  }
};

export const generateCoverBuffer = async (
  cover?: string,
  appendDefaultArtworkLocationToPath = true
) => {
  if (cover) {
    if (typeof cover === 'string') {
      try {
        const imgPath = appendDefaultArtworkLocationToPath
          ? path.join(DEFAULT_ARTWORK_SAVE_LOCATION, cover)
          : cover;
        const isWebp = path.extname(imgPath) === '.webp';

        const buffer = isWebp ? await sharp(imgPath).png().toBuffer() : await fs.readFile(imgPath);

        return buffer;
      } catch (error) {
        logger.error(`Failed to generate artwork buffer.`, { error });
        return getDefaultSongCoverImgBuffer();
      }
    }
  }

  return getDefaultSongCoverImgBuffer();
};

export default generateCoverBuffer;
