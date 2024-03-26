import path from 'path';
import fs from 'fs/promises';

import * as musicMetaData from 'music-metadata';
import sharp from 'sharp';

import log from '../log';
import { DEFAULT_ARTWORK_SAVE_LOCATION } from '../filesystem';

import songCoverImage from '../../renderer/src/assets/images/webp/song_cover_default.webp?asset&asarUnpack';

console.log('songCoverImage', songCoverImage);
let defaultSongCoverImgBuffer: Buffer;

export const getDefaultSongCoverImgBuffer = async () => {
  if (defaultSongCoverImgBuffer) return defaultSongCoverImgBuffer;

  try {
    const webpBuffer = await fs.readFile(songCoverImage);
    const buffer = await sharp(webpBuffer).png().toBuffer();

    defaultSongCoverImgBuffer = buffer;
    return buffer;
  } catch (error) {
    log(
      `ERROR OCCURRED WHEN READING A FILE OF NAME 'song_cover_default.webp'.`,
      { error },
      'ERROR'
    );
    return undefined;
  }
};

export const generateCoverBuffer = async (
  cover?: musicMetaData.IPicture[] | string,
  noDefaultOnUndefined = false
) => {
  if (
    (cover === undefined || (typeof cover !== 'string' && cover[0].data === undefined)) &&
    noDefaultOnUndefined
  )
    return undefined;
  if (cover) {
    if (typeof cover === 'string') {
      try {
        const imgPath = path.join(DEFAULT_ARTWORK_SAVE_LOCATION, cover);
        const isWebp = path.extname(imgPath) === '.webp';

        const buffer = isWebp ? await sharp(imgPath).png().toBuffer() : await fs.readFile(imgPath);

        return buffer;
      } catch (error) {
        log(`ERROR OCCURRED WHEN TRYING TO GENERATE ARTWORK BUFFER.`, { error }, 'ERROR');
        return getDefaultSongCoverImgBuffer();
      }
    }

    if (cover[0].format === 'image/webp') {
      try {
        const buffer = await sharp(cover[0].data).png().toBuffer();
        return buffer;
      } catch (error) {
        log('Error occurred when trying to get artwork buffer of a song.', { error }, 'WARN');
        return getDefaultSongCoverImgBuffer();
      }
    }

    return cover[0].data;
  }

  return getDefaultSongCoverImgBuffer();
};

export default generateCoverBuffer;
