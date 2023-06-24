import sharp from 'sharp';
import { SaveDialogOptions } from 'electron';

import log from '../log';
import { sendMessageToRenderer, showSaveDialog } from '../main';
import isPathAWebURL from '../utils/isPathAWebUrl';
import {
  fetchArtworkBufferFromURL,
  generateLocalArtworkBuffer,
} from '../updateSongId3Tags';
import { removeDefaultAppProtocolFromFilePath } from '../fs/resolveFilePaths';

const getSaveOptions = (saveName?: string) => {
  const saveOptions: SaveDialogOptions = {
    title: 'Select the destination to save the artwork',
    buttonLabel: 'Save Artwork',
    defaultPath: 'artwork',
    filters: [
      {
        extensions: ['png', 'jpeg', 'webp', 'avif', 'tiff', 'gif'],
        name: 'Image files',
      },
    ],
    properties: ['createDirectory', 'showOverwriteConfirmation'],
    nameFieldLabel: 'artwork',
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

      if (isArtworkPathAWebURL)
        artwork = await fetchArtworkBufferFromURL(artworkPath);
      else
        artwork = await generateLocalArtworkBuffer(
          removeDefaultAppProtocolFromFilePath(artworkPath)
        );

      if (artwork) {
        await sharp(artwork).toFile(savePath);
        return sendMessageToRenderer(
          'Saved the artwork to the request location.'
        );
      }
    } else sendMessageToRenderer('No save destination selected.');

    return undefined;
  } catch (error) {
    log(
      'Error occurred when trying to fulfil the user request to save a song artwork.',
      { error },
      'ERROR'
    );
    sendMessageToRenderer('Failed to save the song artwork.');
    return undefined;
  }
};

export default saveArtworkToSystem;
