import path from 'path';

import { File } from 'node-taglib-sharp';

const EXTENSION_MIME_MAP: Record<string, string> = {
  m4r: 'audio/mp4'
};

export const createTagFile = (filePath: string): File => {
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  const mimeType = EXTENSION_MIME_MAP[ext];
  return File.createFromPath(filePath, mimeType);
};
