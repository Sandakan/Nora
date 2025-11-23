import path from 'path';
import fs from 'fs/promises';

import * as musicMetaData from 'music-metadata';
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
  cover?: musicMetaData.IPicture[] | string,
  defaultOnUndefined = true,
  appendDefaultArtworkLocationToPath = true
) => {
  if ((!cover || (typeof cover !== 'string' && cover[0].data === undefined)) && !defaultOnUndefined)
    return undefined;

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

    if (cover[0].format === 'image/webp') {
      try {
        const buffer = await sharp(cover[0].data).png().toBuffer();
        return buffer;
      } catch (error) {
        logger.debug('Failed to get artwork buffer of a song.', { error });
        return getDefaultSongCoverImgBuffer();
      }
    }

    // return cover[0].data;
    return Buffer.from(cover[0].data.buffer, 0, cover[0].data.length);
  }

  return getDefaultSongCoverImgBuffer();
};

export default generateCoverBuffer;
