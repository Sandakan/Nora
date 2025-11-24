import type { SaveDialogOptions } from 'electron';
import sharp from 'sharp';

import logger from '../logger';
import { sendMessageToRenderer, showSaveDialog } from '../main';
import isPathAWebURL from '../utils/isPathAWebUrl';
import {
  fetchArtworkBufferFromURL,
  generateLocalArtworkBuffer
} from '../updateSong/updateSongId3Tags';
import { removeDefaultAppProtocolFromFilePath } from '../fs/resolveFilePaths';

const getSaveOptions = (saveName?: string) => {
  const saveOptions: SaveDialogOptions = {
    title: 'Select the destination to save the artwork',
    buttonLabel: 'Save Artwork',
    defaultPath: 'artwork',
    filters: [
      {
        extensions: ['png', 'jpeg', 'webp', 'avif', 'tiff', 'gif'],
        name: 'Image files'
      }
    ],
    properties: ['createDirectory', 'showOverwriteConfirmation'],
    nameFieldLabel: 'artwork'
  };

  if (saveName) {
    saveOptions.defaultPath = saveName;
    saveOptions.nameFieldLabel = saveName;
  }
  return saveOptions;
};

const saveArtworkToSystem = async (artworkPath: string, saveName?: string) => {
  let artwork: Buffer | undefined;
  try {
    const saveOptions = getSaveOptions(saveName);
    const savePath = await showSaveDialog(saveOptions);
    if (savePath) {
      const isArtworkPathAWebURL = isPathAWebURL(artworkPath);

      if (isArtworkPathAWebURL) artwork = await fetchArtworkBufferFromURL(artworkPath);
      else
        artwork = await generateLocalArtworkBuffer(
          removeDefaultAppProtocolFromFilePath(artworkPath)
        );

      if (artwork) {
        await sharp(artwork, { animated: true }).toFile(savePath);
        return sendMessageToRenderer({ messageCode: 'ARTWORK_SAVED' });
      }
    } else sendMessageToRenderer({ messageCode: 'DESTINATION_NOT_SELECTED' });

    return undefined;
  } catch (error) {
    logger.debug('Failed to save a song artwork.', {
      error,
      artwork,
      saveName
    });
    sendMessageToRenderer({ messageCode: 'ARTWORK_SAVE_FAILED' });
    return undefined;
  }
};

export default saveArtworkToSystem;
